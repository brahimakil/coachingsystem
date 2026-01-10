import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CoachModel from '../models/CoachModel';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

const CoachesView = ({ navigation }) => {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    profession: '',
    minPrice: '',
    maxPrice: '',
    day: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [tempFilters, setTempFilters] = useState({ ...filters });
  const [filterOptions, setFilterOptions] = useState({
    professions: [],
    priceRange: { min: 0, max: 100 },
    days: [],
  });

  const priceRanges = [
    { label: 'All Prices', min: '', max: '' },
    { label: 'Under $50', min: '', max: '50' },
    { label: '$50 - $100', min: '50', max: '100' },
    { label: '$100 - $200', min: '100', max: '200' },
    { label: 'Over $200', min: '200', max: '' },
  ];

  useEffect(() => {
    fetchFilterOptions();
    fetchCoaches();
  }, [filters, searchQuery]);

  const fetchFilterOptions = async () => {
    try {
      const response = await CoachModel.getFilterOptions();
      if (response.success) {
        setFilterOptions(response.data);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
      // Fallback to default filter options if API fails
      setFilterOptions({
        professions: [],
        priceRange: { min: 0, max: 100 },
        days: [],
      });
    }
  };

  const fetchCoaches = async () => {
    try {
      setLoading(true);
      // Add status filter to only get active coaches
      const filtersWithStatus = { ...filters, status: 'active' };
      if (searchQuery.trim()) {
        filtersWithStatus.search = searchQuery;
      }
      const response = await CoachModel.getCoaches(filtersWithStatus);
      if (response.success) {
        console.log('=== COACHES DATA ===');
        console.log('Total coaches:', response.data.length);
        response.data.forEach((coach, index) => {
          console.log(`Coach ${index + 1}:`, {
            name: coach.name,
            availableHours: coach.availableHours,
            availableHoursType: typeof coach.availableHours,
            availableHoursKeys: coach.availableHours ? Object.keys(coach.availableHours) : 'no keys',
          });
        });
        setCoaches(response.data);
      }
    } catch (error) {
      console.error('Error fetching coaches:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCoaches();
    setRefreshing(false);
  };

  const applyFilters = () => {
    setFilters({ ...tempFilters });
    setShowFilters(false);
  };

  const clearFilters = () => {
    const emptyFilters = { profession: '', minPrice: '', maxPrice: '', day: '' };
    setTempFilters(emptyFilters);
    setFilters(emptyFilters);
    setShowFilters(false);
  };

  const getDayName = (dayKey) => {
    const days = {
      monday: 'Mon',
      tuesday: 'Tue',
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      sunday: 'Sun',
    };
    return days[dayKey] || dayKey;
  };

  const getAvailableDays = (availableHours) => {
    if (!availableHours) return [];
    return Object.keys(availableHours)
      .filter(day => availableHours[day]?.length > 0)
      .map(day => getDayName(day));
  };

  const renderCoachCard = ({ item }) => {
    const availableDays = getAvailableDays(item.availableHours);

    return (
      <TouchableOpacity
        style={styles.coachCard}
        onPress={() => navigation.navigate('CoachDetail', { coachId: item.id })}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          {item.profilePictureUrl ? (
            <Image source={{ uri: item.profilePictureUrl }} style={styles.coachImage} />
          ) : (
            <View style={styles.coachImagePlaceholder}>
              <Ionicons name="person" size={40} color={colors.textSecondary} />
            </View>
          )}
          <View style={styles.cardInfo}>
            <Text style={styles.coachName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.professionBadge}>
              <Ionicons name="trophy" size={14} color={colors.primary} />
              <Text style={styles.professionText}>{item.profession || 'Coach'}</Text>
            </View>
            {/* Rating display */}
            {item.averageRating > 0 && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={14} color={colors.warning} />
                <Text style={styles.ratingText}>
                  {item.averageRating?.toFixed(1)} ({item.totalReviews || 0})
                </Text>
              </View>
            )}
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.priceValue}>${item.pricePerSession || 'N/A'}</Text>
            <Text style={styles.priceLabel}>per session</Text>
          </View>
        </View>

        {availableDays.length > 0 && (
          <View style={styles.daysContainer}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} style={styles.calendarIcon} />
            <View style={styles.daysWrapper}>
              {availableDays.map((day, index) => (
                <View key={index} style={styles.dayBadge}>
                  <Text style={styles.dayText}>{day}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: item.status === 'active' ? colors.success : colors.warning }]} />
            <Text style={styles.statusText}>
              {item.status === 'active' ? 'Available' : 'Pending'}
            </Text>
          </View>
          <View style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View Profile</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>No coaches found</Text>
      <Text style={styles.emptySubtitle}>Try adjusting your filters</Text>
    </View>
  );

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  const getDayDisplayName = (dayKey) => {
    const days = {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
    };
    return days[dayKey.toLowerCase()] || dayKey;
  };

  return (
    <View style={styles.container}>
      {/* Search Box */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search coaches by name, profession..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Button */}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowFilters(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="options" size={20} color={colors.white} />
        <Text style={styles.filterButtonText}>Filters</Text>
        {activeFilterCount > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Coaches List */}
      <FlatList
        data={coaches}
        renderItem={renderCoachCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={!loading && renderEmpty}
        ListFooterComponent={loading && <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />}
        showsVerticalScrollIndicator={false}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Coaches</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterScroll} showsVerticalScrollIndicator={false}>
              {/* Profession Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Profession</Text>
                <View style={styles.optionsGrid}>
                  <TouchableOpacity
                    style={[
                      styles.optionChip,
                      tempFilters.profession === '' && styles.optionChipActive
                    ]}
                    onPress={() => setTempFilters({ ...tempFilters, profession: '' })}
                  >
                    <Text style={[
                      styles.optionText,
                      tempFilters.profession === '' && styles.optionTextActive
                    ]}>All</Text>
                  </TouchableOpacity>
                  {filterOptions.professions.map((prof) => (
                    <TouchableOpacity
                      key={prof}
                      style={[
                        styles.optionChip,
                        tempFilters.profession === prof && styles.optionChipActive
                      ]}
                      onPress={() => setTempFilters({ ...tempFilters, profession: prof })}
                    >
                      <Text style={[
                        styles.optionText,
                        tempFilters.profession === prof && styles.optionTextActive
                      ]}>{prof}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Available Day Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Available Day</Text>
                <View style={styles.optionsGrid}>
                  <TouchableOpacity
                    style={[
                      styles.optionChip,
                      tempFilters.day === '' && styles.optionChipActive
                    ]}
                    onPress={() => setTempFilters({ ...tempFilters, day: '' })}
                  >
                    <Text style={[
                      styles.optionText,
                      tempFilters.day === '' && styles.optionTextActive
                    ]}>All Days</Text>
                  </TouchableOpacity>
                  {filterOptions.days.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.optionChip,
                        tempFilters.day === day && styles.optionChipActive
                      ]}
                      onPress={() => setTempFilters({ ...tempFilters, day: day })}
                    >
                      <Text style={[
                        styles.optionText,
                        tempFilters.day === day && styles.optionTextActive
                      ]}>{getDayDisplayName(day)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Price Range Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Price Range</Text>
                {priceRanges.map((range) => (
                  <TouchableOpacity
                    key={range.label}
                    style={[
                      styles.priceOption,
                      tempFilters.minPrice === range.min && tempFilters.maxPrice === range.max && styles.priceOptionActive
                    ]}
                    onPress={() => setTempFilters({ ...tempFilters, minPrice: range.min, maxPrice: range.max })}
                  >
                    <Ionicons 
                      name={tempFilters.minPrice === range.min && tempFilters.maxPrice === range.max ? "radio-button-on" : "radio-button-off"}
                      size={24} 
                      color={tempFilters.minPrice === range.min && tempFilters.maxPrice === range.max ? colors.primary : colors.textSecondary}
                    />
                    <Text style={[
                      styles.priceOptionText,
                      tempFilters.minPrice === range.min && tempFilters.maxPrice === range.max && styles.priceOptionTextActive
                    ]}>{range.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  filterButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
    marginLeft: spacing.sm,
    flex: 1,
  },
  filterBadge: {
    backgroundColor: colors.error,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  coachCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
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
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  coachImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  cardInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  coachName: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  professionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  professionText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  ratingText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '600',
    marginLeft: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceValue: {
    ...typography.h3,
    color: colors.success,
    fontWeight: '700',
  },
  priceLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  daysContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  calendarIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  daysWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    gap: spacing.xs,
  },
  dayBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  dayText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  statusText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewButtonText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
    marginRight: 4,
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
  },
  loader: {
    paddingVertical: spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  filterScroll: {
    maxHeight: 400,
  },
  filterSection: {
    padding: spacing.lg,
  },
  filterLabel: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  optionTextActive: {
    color: colors.white,
  },
  priceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    marginBottom: spacing.sm,
  },
  priceOptionActive: {
    backgroundColor: `${colors.primary}15`,
  },
  priceOptionText: {
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.md,
  },
  priceOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  clearButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  clearButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
});

export default CoachesView;
