import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CoachModel from '../models/CoachModel';
import SubscriptionModel from '../models/SubscriptionModel';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

const CoachDetailView = ({ route, navigation }) => {
  const { coachId } = route.params;
  const { player } = useAuth();
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    fetchCoachDetails();
    checkSubscriptionStatus();
  }, [coachId]);

  const checkSubscriptionStatus = async () => {
    if (!player?.uid) return;
    
    try {
      const response = await SubscriptionModel.checkSubscription(player.uid, coachId);
      if (response.success) {
        setSubscriptionStatus(response);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const fetchCoachDetails = async () => {
    try {
      setLoading(true);
      const response = await CoachModel.getCoach(coachId);
      if (response.success) {
        setCoach(response.data);
      }
    } catch (error) {
      console.error('Error fetching coach details:', error);
      Alert.alert('Error', 'Failed to load coach details');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCV = () => {
    if (coach?.cvUrl) {
      Linking.openURL(coach.cvUrl).catch((err) => {
        Alert.alert('Error', 'Failed to open CV');
        console.error('Failed to open CV:', err);
      });
    } else {
      Alert.alert('No CV', 'CV not available for this coach');
    }
  };

  const handleSubscribe = async () => {
    if (!player?.uid) {
      Alert.alert('Error', 'Please login to subscribe');
      return;
    }

    if (subscriptionStatus?.subscription?.status === 'rejected') {
      Alert.alert(
        'Cannot Subscribe',
        'Your previous subscription request was rejected. You cannot subscribe to this coach again.'
      );
      return;
    }

    if (subscriptionStatus?.hasSubscription && subscriptionStatus?.subscription?.status === 'active') {
      Alert.alert('Already Subscribed', 'You already have an active subscription with this coach');
      return;
    }

    if (subscriptionStatus?.hasSubscription && subscriptionStatus?.subscription?.status === 'pending') {
      Alert.alert('Pending', 'Your subscription request is pending approval');
      return;
    }

    // Calculate default dates (1 month subscription)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    Alert.alert(
      'Subscribe to Coach',
      `Send subscription request to ${coach?.name}?\n\nDuration: 1 month\nStart: ${startDate.toLocaleDateString()}\nEnd: ${endDate.toLocaleDateString()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: async () => {
            try {
              setSubscribing(true);
              const subscriptionData = {
                playerId: player.uid,
                coachId: coachId,
                status: 'pending',
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
              };

              await SubscriptionModel.createSubscription(subscriptionData);
              Alert.alert('Success', 'Subscription request sent! Waiting for coach approval.');
              checkSubscriptionStatus();
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to create subscription');
            } finally {
              setSubscribing(false);
            }
          },
        },
      ]
    );
  };

  const getDayName = (dayKey) => {
    const days = {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
    };
    return days[dayKey] || dayKey;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!coach) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Coach not found</Text>
      </View>
    );
  }

  const availableDays = coach.availableHours
    ? Object.keys(coach.availableHours).filter(day => coach.availableHours[day]?.length > 0)
    : [];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Coach Header */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          {coach.profilePictureUrl ? (
            <Image source={{ uri: coach.profilePictureUrl }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={60} color={colors.textSecondary} />
            </View>
          )}
          <Text style={styles.coachName}>{coach.name}</Text>
          <Text style={styles.profession}>{coach.profession || 'Professional Coach'}</Text>
          
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: coach.status === 'active' ? colors.success : colors.warning }]} />
            <Text style={styles.statusText}>
              {coach.status === 'active' ? 'Available' : 'Pending'}
            </Text>
          </View>
        </View>
      </View>

      {/* Info Cards */}
      <View style={styles.content}>
        {/* Contact Info */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Contact Information</Text>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
            <Text style={styles.infoText}>{coach.email}</Text>
          </View>
          {coach.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color={colors.primary} />
              <Text style={styles.infoText}>{coach.phone}</Text>
            </View>
          )}
        </View>

        {/* Price */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Session Price</Text>
          <View style={styles.priceRow}>
            <Ionicons name="cash-outline" size={24} color={colors.success} />
            <Text style={styles.priceText}>${coach.pricePerSession || 'N/A'}</Text>
            <Text style={styles.priceLabel}>per session</Text>
          </View>
        </View>

        {/* Available Schedule */}
        {availableDays.length > 0 && (
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Available Schedule</Text>
            {availableDays.map((day) => (
              <View key={day} style={styles.scheduleDay}>
                <View style={styles.dayHeader}>
                  <Ionicons name="calendar" size={18} color={colors.primary} />
                  <Text style={styles.dayName}>{getDayName(day)}</Text>
                </View>
                <View style={styles.timeSlotsContainer}>
                  {coach.availableHours[day]?.map((slot, index) => (
                    <View key={index} style={styles.timeSlot}>
                      <Ionicons name="time-outline" size={16} color={colors.success} />
                      <Text style={styles.timeText}>{slot.start} - {slot.end}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.cvButton} onPress={handleViewCV}>
            <Ionicons name="document-text" size={22} color={colors.white} />
            <Text style={styles.cvButtonText}>View CV</Text>
          </TouchableOpacity>

          {subscriptionStatus?.hasSubscription ? (
            subscriptionStatus.subscription.status === 'active' ? (
              <View style={[styles.subscribeButton, styles.activeSubscription]}>
                <Ionicons name="checkmark-circle" size={22} color={colors.white} />
                <Text style={styles.subscribeButtonText}>Already Subscribed</Text>
              </View>
            ) : subscriptionStatus.subscription.status === 'pending' ? (
              <View style={[styles.subscribeButton, styles.pendingSubscription]}>
                <Ionicons name="time" size={22} color={colors.white} />
                <Text style={styles.subscribeButtonText}>Pending Approval</Text>
              </View>
            ) : subscriptionStatus.subscription.status === 'rejected' ? (
              <View style={[styles.subscribeButton, styles.rejectedSubscription]}>
                <Ionicons name="close-circle" size={22} color={colors.white} />
                <Text style={styles.subscribeButtonText}>Cannot Subscribe</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.subscribeButton} 
                onPress={handleSubscribe}
                disabled={subscribing}
              >
                {subscribing ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="add-circle" size={22} color={colors.white} />
                    <Text style={styles.subscribeButtonText}>Subscribe</Text>
                  </>
                )}
              </TouchableOpacity>
            )
          ) : (
            <TouchableOpacity 
              style={styles.subscribeButton} 
              onPress={handleSubscribe}
              disabled={subscribing}
            >
              {subscribing ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="add-circle" size={22} color={colors.white} />
                  <Text style={styles.subscribeButtonText}>Subscribe</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileSection: {
    alignItems: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.white,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.white,
  },
  coachName: {
    ...typography.h2,
    color: colors.white,
    marginTop: spacing.md,
  },
  profession: {
    ...typography.body,
    color: colors.white,
    opacity: 0.9,
    marginTop: spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    marginTop: spacing.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  statusText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    padding: spacing.lg,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.md,
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    ...typography.h2,
    color: colors.success,
    marginLeft: spacing.md,
  },
  priceLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  scheduleDay: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dayName: {
    ...typography.h5,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  timeSlotsContainer: {
    marginLeft: spacing.lg + spacing.sm,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  timeText: {
    ...typography.bodySmall,
    color: colors.text,
    marginLeft: spacing.sm,
    fontWeight: '500',
  },
  actionsSection: {
    marginTop: spacing.md,
  },
  cvButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  cvButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  subscribeButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  activeSubscription: {
    backgroundColor: colors.success,
  },
  pendingSubscription: {
    backgroundColor: colors.warning,
  },
  rejectedSubscription: {
    backgroundColor: colors.error,
    opacity: 0.7,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});

export default CoachDetailView;
