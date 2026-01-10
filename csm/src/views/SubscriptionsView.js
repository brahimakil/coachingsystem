import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import SubscriptionModel from '../models/SubscriptionModel';
import { colors, spacing, typography, borderRadius } from '../styles/theme';

const SubscriptionsView = ({ navigation }) => {
  const { player } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const filters = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Active', value: 'active' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Stopped', value: 'stopped' },
  ];

  useEffect(() => {
    if (player?.uid) {
      fetchSubscriptions();
    }
  }, [player, filter]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const statusFilter = filter === 'all' ? null : filter;
      const response = await SubscriptionModel.getPlayerSubscriptions(player.uid, statusFilter);
      if (response.success) {
        setSubscriptions(response.data);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSubscriptions();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'rejected':
        return colors.error;
      case 'stopped':
        return colors.textSecondary;
      default:
        return colors.text;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'rejected':
        return 'close-circle';
      case 'stopped':
        return 'stop-circle';
      default:
        return 'ellipse';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderSubscriptionCard = ({ item }) => {
    const coach = item.coach || {};
    
    return (
      <TouchableOpacity
        style={styles.subscriptionCard}
        onPress={() => navigation.navigate('Coaches', { 
          screen: 'CoachDetail', 
          params: { coachId: item.coachId } 
        })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          {coach.profilePictureUrl ? (
            <Image source={{ uri: coach.profilePictureUrl }} style={styles.coachImage} />
          ) : (
            <View style={styles.coachImagePlaceholder}>
              <Ionicons name="person" size={30} color={colors.textSecondary} />
            </View>
          )}
          <View style={styles.coachInfo}>
            <Text style={styles.coachName}>{coach.name || 'Unknown Coach'}</Text>
            <Text style={styles.coachProfession}>{coach.profession || 'Coach'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
            <Ionicons name={getStatusIcon(item.status)} size={16} color={getStatusColor(item.status)} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.dateRow}>
            <View style={styles.dateItem}>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              <Text style={styles.dateLabel}>Start</Text>
              <Text style={styles.dateValue}>{formatDate(item.startDate)}</Text>
            </View>
            <View style={styles.dateDivider} />
            <View style={styles.dateItem}>
              <Ionicons name="calendar-outline" size={16} color={colors.error} />
              <Text style={styles.dateLabel}>End</Text>
              <Text style={styles.dateValue}>{formatDate(item.endDate)}</Text>
            </View>
          </View>
        </View>

        {item.status === 'rejected' && (
          <View style={styles.rejectedNote}>
            <Ionicons name="information-circle" size={16} color={colors.error} />
            <Text style={styles.rejectedText}>Cannot subscribe to this coach again</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="file-tray-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>No subscriptions found</Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'all' 
          ? 'Browse coaches and subscribe to get started' 
          : `No ${filter} subscriptions`}
      </Text>
      <TouchableOpacity 
        style={styles.browseButton}
        onPress={() => navigation.navigate('Coaches')}
      >
        <Text style={styles.browseButtonText}>Browse Coaches</Text>
      </TouchableOpacity>
    </View>
  );

  if (!player) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Please login to view subscriptions</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterTab, filter === f.value && styles.filterTabActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[styles.filterTabText, filter === f.value && styles.filterTabTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Subscriptions List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={subscriptions}
          renderItem={renderSubscriptionCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
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
  filterContainer: {
    flexDirection: 'row',
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.lg,
  },
  subscriptionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  coachImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  coachImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  coachInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  coachName: {
    ...typography.h5,
    color: colors.text,
    marginBottom: 2,
  },
  coachProfession: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardBody: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateItem: {
    flex: 1,
    alignItems: 'center',
  },
  dateDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  dateLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  dateValue: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
    marginTop: 2,
  },
  rejectedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: `${colors.error}10`,
    borderRadius: borderRadius.sm,
  },
  rejectedText: {
    ...typography.caption,
    color: colors.error,
    marginLeft: spacing.sm,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  browseButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  browseButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});

export default SubscriptionsView;
