import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { AuthModel } from '../models/AuthModel';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

const ForgotPasswordView = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateEmail = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOtp = () => {
    const newErrors = {};
    if (!otp || otp.length < 6) {
      newErrors.otp = 'Please enter a valid 6-digit OTP';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};
    if (!newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRequestOtp = async () => {
    if (!validateEmail()) return;

    setLoading(true);
    try {
      const result = await AuthModel.requestPasswordReset(email.trim());
      if (result.success) {
        setStep(2);
        Alert.alert('OTP Sent', result.message);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!validateOtp()) return;

    setLoading(true);
    try {
      const result = await AuthModel.verifyResetOtp(email.trim(), otp);
      if (result.success) {
        setResetToken(result.resetToken);
        setStep(3);
        Alert.alert('Success', 'OTP verified. Please set your new password.');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validatePassword()) return;

    setLoading(true);
    try {
      const result = await AuthModel.resetPassword(email.trim(), resetToken, newPassword);
      if (result.success) {
        Alert.alert('Success', result.message, [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      <Text style={styles.stepDescription}>
        Enter your email address and we'll send you an OTP to reset your password.
      </Text>
      <CustomInput
        label="Email Address"
        placeholder="Enter your email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setErrors({ ...errors, email: '' });
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        error={errors.email}
        icon={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
      />
      <CustomButton
        title="Send OTP"
        onPress={handleRequestOtp}
        loading={loading}
        style={styles.button}
      />
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.stepDescription}>
        Enter the 6-digit OTP sent to {email}
      </Text>
      <CustomInput
        label="Enter OTP"
        placeholder="123456"
        value={otp}
        onChangeText={(text) => {
          setOtp(text);
          setErrors({ ...errors, otp: '' });
        }}
        keyboardType="number-pad"
        maxLength={6}
        error={errors.otp}
        icon={<Ionicons name="key-outline" size={20} color={colors.textSecondary} />}
      />
      <CustomButton
        title="Verify OTP"
        onPress={handleVerifyOtp}
        loading={loading}
        style={styles.button}
      />
      <TouchableOpacity onPress={handleRequestOtp} style={styles.resendButton}>
        <Text style={styles.resendText}>Resend OTP</Text>
      </TouchableOpacity>
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.stepDescription}>
        Create a new password for your account.
      </Text>
      <CustomInput
        label="New Password"
        placeholder="Enter new password"
        value={newPassword}
        onChangeText={(text) => {
          setNewPassword(text);
          setErrors({ ...errors, newPassword: '' });
        }}
        secureTextEntry
        error={errors.newPassword}
        icon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
      />
      <CustomInput
        label="Confirm Password"
        placeholder="Confirm new password"
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);
          setErrors({ ...errors, confirmPassword: '' });
        }}
        secureTextEntry
        error={errors.confirmPassword}
        icon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
      />
      <CustomButton
        title="Reset Password"
        onPress={handleResetPassword}
        loading={loading}
        style={styles.button}
      />
    </>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            if (step > 1) {
              setStep(step - 1);
            } else {
              navigation.goBack();
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="lock-open" size={60} color={colors.primary} />
          </View>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>Step {step} of 3</Text>
        </View>

        <View style={styles.form}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </View>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginText}>
            Remember your password?{' '}
            <Text style={styles.loginTextBold}>Login</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  form: {
    flex: 1,
  },
  stepDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  button: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  resendButton: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  resendText: {
    color: colors.primary,
    fontSize: 14,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  loginText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  loginTextBold: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default ForgotPasswordView;
