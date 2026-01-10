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
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CoachModel from '../models/CoachModel';
import SubscriptionModel from '../models/SubscriptionModel';
import RatingModel from '../models/RatingModel';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

const CoachDetailView = ({ route, navigation }) => {
  const { coachId } = route.params;
  const { player } = useAuth();
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscribing, setSubscribing] = useState(false);
  
  // Rating states
  const [ratings, setRatings] = useState([]);
  const [ratingStats, setRatingStats] = useState(null);
  const [myRating, setMyRating] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newReview, setNewReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    fetchCoachDetails();
    checkSubscriptionStatus();
    fetchRatings();
  }, [coachId]);

  const fetchRatings = async () => {
    try {
      const [ratingsData, statsData] = await Promise.all([
        RatingModel.getCoachRatings(coachId),
        RatingModel.getCoachRatingStats(coachId),
      ]);
      setRatings(ratingsData || []);
      setRatingStats(statsData);

      // Check if player has already rated
      if (player?.uid) {
        const playerRating = await RatingModel.getPlayerRatingForCoach(coachId, player.uid);
        if (playerRating) {
          setMyRating(playerRating);
          setNewRating(playerRating.rating);
          setNewReview(playerRating.review || '');
        }
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

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

  const handleSubmitRating = async () => {
    if (!player?.uid) {
      Alert.alert('Error', 'Please login to rate');
      return;
    }

    setSubmittingRating(true);
    try {
      if (myRating) {
        // Update existing rating
        await RatingModel.updateRating(myRating.id, {
          rating: newRating,
          review: newReview,
        });
        Alert.alert('Success', 'Your rating has been updated!');
      } else {
        // Create new rating
        await RatingModel.createRating({
          coachId,
          playerId: player.uid,
          playerName: player.name,
          rating: newRating,
          review: newReview,
        });
        Alert.alert('Success', 'Thank you for your rating!');
      }
      setShowRatingModal(false);
      fetchRatings();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const canRate = () => {
    // Player can rate if they have any subscription (active, stopped, completed) with this coach
    return subscriptionStatus?.hasSubscription && 
           subscriptionStatus?.subscription?.status !== 'pending' &&
           subscriptionStatus?.subscription?.status !== 'rejected';
  };

  const renderStars = (rating, size = 16, interactive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          disabled={!interactive}
          onPress={() => interactive && setNewRating(i)}
        >
          <Ionicons
            name={i <= rating ? 'star' : 'star-outline'}
            size={size}
            color={colors.warning}
            style={{ marginRight: 2 }}
          />
        </TouchableOpacity>
      );
    }
    return <View style={{ flexDirection: 'row' }}>{stars}</View>;
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

          {/* Rating Display in Header */}
          {ratingStats && ratingStats.totalReviews > 0 && (
            <View style={styles.headerRating}>
              {renderStars(Math.round(ratingStats.averageRating), 18)}
              <Text style={styles.headerRatingText}>
                {ratingStats.averageRating.toFixed(1)} ({ratingStats.totalReviews} reviews)
              </Text>
            </View>
          )}
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

        {/* Reviews Section */}
        <View style={styles.infoCard}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.cardTitle}>Reviews</Text>
            {canRate() && (
              <TouchableOpacity
                style={styles.rateButton}
                onPress={() => setShowRatingModal(true)}
              >
                <Ionicons name={myRating ? 'create' : 'star'} size={16} color={colors.white} />
                <Text style={styles.rateButtonText}>{myRating ? 'Edit' : 'Rate'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {ratingStats && ratingStats.totalReviews > 0 ? (
            <>
              <View style={styles.ratingOverview}>
                <Text style={styles.avgRating}>{ratingStats.averageRating.toFixed(1)}</Text>
                <View style={styles.ratingOverviewRight}>
                  {renderStars(Math.round(ratingStats.averageRating), 20)}
                  <Text style={styles.totalReviews}>{ratingStats.totalReviews} reviews</Text>
                </View>
              </View>

              {ratings.slice(0, 5).map((review, index) => (
                <View key={review.id || index} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>{review.playerName}</Text>
                    {renderStars(review.rating, 14)}
                  </View>
                  {review.review && (
                    <Text style={styles.reviewText}>{review.review}</Text>
                  )}
                  {review.createdAt && (
                    <Text style={styles.reviewDate}>
                      {new Date(review.createdAt._seconds ? review.createdAt._seconds * 1000 : review.createdAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.noReviewsText}>No reviews yet</Text>
          )}
        </View>
      </View>

      {/* Rating Modal */}
      <Modal
        visible={showRatingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{myRating ? 'Edit Your Rating' : 'Rate Coach'}</Text>
            
            <View style={styles.starsContainer}>
              {renderStars(newRating, 36, true)}
            </View>
            <Text style={styles.ratingLabel}>{newRating} out of 5</Text>

            <TextInput
              style={styles.reviewInput}
              placeholder="Write your review (optional)"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              value={newReview}
              onChangeText={setNewReview}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowRatingModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmitRating}
                disabled={submittingRating}
              >
                {submittingRating ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  // Rating styles
  headerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  headerRatingText: {
    ...typography.bodySmall,
    color: colors.white,
    marginLeft: spacing.sm,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  rateButtonText: {
    ...typography.bodySmall,
    color: colors.white,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  ratingOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avgRating: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.text,
    marginRight: spacing.md,
  },
  ratingOverviewRight: {
    flex: 1,
  },
  totalReviews: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  reviewItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reviewerName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  reviewText: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  reviewDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  noReviewsText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  starsContainer: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  ratingLabel: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  reviewInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    ...typography.body,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    marginRight: spacing.sm,
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
  submitButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
});

export default CoachDetailView;
