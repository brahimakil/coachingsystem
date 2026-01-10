import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { testAIConnection, initializeAI, GEMINI_MODEL } from '../services/gemini.service';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

const GEMINI_API_KEY = '@gemini_api_key';

const ProfileView = ({ navigation }) => {
  const { player } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [savedApiKey, setSavedApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      const key = await AsyncStorage.getItem(GEMINI_API_KEY);
      if (key) {
        setSavedApiKey(key);
        setApiKey(key);
        // Initialize AI with saved key
        initializeAI(key);
      }
    } catch (error) {
      console.error('Error loading API key:', error);
    }
  };

  const handleTestApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter an API key');
      return;
    }

    setTesting(true);
    setTestResult(null);

    const result = await testAIConnection(apiKey.trim());
    
    setTesting(false);
    setTestResult(result);

    if (result.success) {
      Alert.alert(
        'Success!',
        'API key is valid and working correctly.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Test Failed',
        `Error: ${result.error}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter an API key');
      return;
    }

    setSaving(true);

    try {
      await AsyncStorage.setItem(GEMINI_API_KEY, apiKey.trim());
      setSavedApiKey(apiKey.trim());
      
      // Initialize AI with new key
      initializeAI(apiKey.trim());
      
      Alert.alert('Success', 'API key saved successfully!');
    } catch (error) {
      console.error('Error saving API key:', error);
      Alert.alert('Error', 'Failed to save API key');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveApiKey = async () => {
    Alert.alert(
      'Remove API Key',
      'Are you sure you want to remove your API key?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(GEMINI_API_KEY);
              setApiKey('');
              setSavedApiKey('');
              setTestResult(null);
              Alert.alert('Success', 'API key removed');
            } catch (error) {
              console.error('Error removing API key:', error);
              Alert.alert('Error', 'Failed to remove API key');
            }
          },
        },
      ]
    );
  };

  if (!player) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Please login to view profile</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 70}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {player.name?.charAt(0).toUpperCase() || 'P'}
            </Text>
          </View>
        </View>
        <Text style={styles.name}>{player.name || 'Player'}</Text>
        <Text style={styles.email}>{player.email || 'No email'}</Text>
      </View>

      {/* Player Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Player Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color={colors.primary} />
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{player.name || 'N/A'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{player.email || 'N/A'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Ionicons name="id-card-outline" size={20} color={colors.primary} />
            <Text style={styles.infoLabel}>ID:</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{player.uid || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Gemini AI Configuration */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Gemini AI Configuration</Text>
          <View style={styles.modelBadge}>
            <Text style={styles.modelText}>{GEMINI_MODEL}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>API Key</Text>
          <Text style={styles.cardDescription}>
            Enter your Google Gemini API key to enable AI features in the app.
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons name="key-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your Gemini API key"
              placeholderTextColor={colors.textSecondary}
              value={apiKey}
              onChangeText={setApiKey}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {savedApiKey && (
            <View style={styles.savedKeyInfo}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.savedKeyText}>API key is configured</Text>
            </View>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.testButton]}
              onPress={handleTestApiKey}
              disabled={testing || !apiKey.trim()}
            >
              {testing ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="flash-outline" size={18} color={colors.white} />
                  <Text style={styles.buttonText}>Test</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSaveApiKey}
              disabled={saving || !apiKey.trim()}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="save-outline" size={18} color={colors.white} />
                  <Text style={styles.buttonText}>Save</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {savedApiKey && (
            <TouchableOpacity
              style={[styles.button, styles.removeButton]}
              onPress={handleRemoveApiKey}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={[styles.buttonText, { color: colors.error }]}>Remove API Key</Text>
            </TouchableOpacity>
          )}

          {testResult && (
            <View style={[styles.testResult, testResult.success ? styles.testSuccess : styles.testError]}>
              <Ionicons 
                name={testResult.success ? 'checkmark-circle' : 'close-circle'} 
                size={20} 
                color={testResult.success ? colors.success : colors.error} 
              />
              <Text style={styles.testResultText}>
                {testResult.success ? 'API key is working!' : `Error: ${testResult.error}`}
              </Text>
            </View>
          )}

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.infoBoxText}>
              Get your API key from: https://aistudio.google.com/app/apikey
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.error,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.h1,
    color: colors.white,
    fontWeight: 'bold',
  },
  name: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  email: {
    ...typography.body,
    color: colors.textSecondary,
  },
  section: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  modelBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  modelText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  infoValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
    flex: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  savedKeyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success}20`,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  savedKeyText: {
    ...typography.bodySmall,
    color: colors.success,
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  testButton: {
    backgroundColor: colors.warning,
  },
  saveButton: {
    backgroundColor: colors.success,
  },
  removeButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.error,
    marginTop: spacing.sm,
  },
  buttonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  testResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  testSuccess: {
    backgroundColor: `${colors.success}20`,
  },
  testError: {
    backgroundColor: `${colors.error}20`,
  },
  testResultText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: `${colors.primary}10`,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  infoBoxText: {
    ...typography.bodySmall,
    color: colors.primary,
    flex: 1,
    lineHeight: 18,
  },
});

export default ProfileView;
