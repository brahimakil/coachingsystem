import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import TaskModel from '../models/TaskModel';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

const TaskDetailView = ({ route, navigation }) => {
  const { taskId } = route.params;
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [textResponse, setTextResponse] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const response = await TaskModel.getTask(taskId);
      if (response) {
        setTask(response);
        if (response.submission?.textResponse) {
          setTextResponse(response.submission.textResponse);
        }
      }
    } catch (error) {
      console.error('Error fetching task:', error);
      Alert.alert('Error', 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newFiles = result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
        name: `media_${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
      }));
      setMediaFiles([...mediaFiles, ...newFiles]);
    }
  };

  const removeMedia = (index) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!textResponse.trim() && mediaFiles.length === 0) {
      Alert.alert('Required', 'Please add text response or media');
      return;
    }

    Alert.alert(
      'Submit Task',
      'Are you sure you want to submit this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            try {
              setSubmitting(true);
              await TaskModel.submitTask(taskId, textResponse, mediaFiles);
              Alert.alert('Success', 'Task submitted successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to submit task');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Task not found</Text>
      </View>
    );
  }

  const isSubmitted = task.submission?.status === 'submitted' || task.submission?.status === 'approved';

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 70}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {/* Task Info */}
      <View style={styles.section}>
        <Text style={styles.title}>{task.title}</Text>
        <Text style={styles.coachName}>Assigned by: {task.coachName || 'Unknown'}</Text>
        
        <View style={styles.datesRow}>
          <View style={styles.dateItem}>
            <Ionicons name="calendar" size={16} color={colors.primary} />
            <Text style={styles.dateLabel}>Due: {new Date(task.dueDate).toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.descriptionBox}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{task.description}</Text>
        </View>
      </View>

      {/* Submission Section */}
      {isSubmitted ? (
        <View style={styles.section}>
          <View style={styles.submittedHeader}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={styles.submittedTitle}>Task Submitted</Text>
          </View>
          
          {task.submission.textResponse && (
            <View style={styles.responseBox}>
              <Text style={styles.responseLabel}>Your Response:</Text>
              <Text style={styles.responseText}>{task.submission.textResponse}</Text>
            </View>
          )}

          {task.submission.mediaUrls && task.submission.mediaUrls.length > 0 && (
            <View style={styles.mediaSection}>
              <Text style={styles.responseLabel}>Attachments:</Text>
              {task.submission.mediaUrls.map((url, index) => (
                <TouchableOpacity key={index} style={styles.mediaLink}>
                  <Ionicons name="document-attach" size={20} color={colors.primary} />
                  <Text style={styles.mediaLinkText}>Attachment {index + 1}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Submit Your Work</Text>

          <Text style={styles.label}>Text Response</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Describe your work..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={6}
            value={textResponse}
            onChangeText={setTextResponse}
          />

          <Text style={styles.label}>Attachments (Photos/Videos)</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Ionicons name="cloud-upload" size={24} color={colors.primary} />
            <Text style={styles.uploadText}>Upload Media</Text>
          </TouchableOpacity>

          {mediaFiles.length > 0 && (
            <View style={styles.mediaList}>
              {mediaFiles.map((file, index) => (
                <View key={index} style={styles.mediaItem}>
                  <Ionicons 
                    name={file.type.startsWith('video') ? 'videocam' : 'image'} 
                    size={20} 
                    color={colors.primary} 
                  />
                  <Text style={styles.mediaFileName} numberOfLines={1}>{file.name}</Text>
                  <TouchableOpacity onPress={() => removeMedia(index)}>
                    <Ionicons name="close-circle" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color={colors.white} />
                <Text style={styles.submitButtonText}>Submit Task</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  section: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  coachName: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  datesRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateLabel: {
    ...typography.bodySmall,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  descriptionBox: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  label: {
    ...typography.h5,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  textInput: {
    ...typography.body,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  uploadText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  mediaList: {
    marginTop: spacing.md,
  },
  mediaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  mediaFileName: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
    marginLeft: spacing.sm,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.xl,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  submittedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  submittedTitle: {
    ...typography.h3,
    color: colors.success,
    marginLeft: spacing.sm,
  },
  responseBox: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  responseLabel: {
    ...typography.h5,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  responseText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  mediaSection: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  mediaLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  mediaLinkText: {
    ...typography.body,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});

export default TaskDetailView;
