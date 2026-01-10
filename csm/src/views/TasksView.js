import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import TaskModel from '../models/TaskModel';
import { colors, spacing, typography, borderRadius } from '../styles/theme';

const TasksView = ({ navigation }) => {
  const { player } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const filters = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Completed', value: 'completed' },
  ];

  useEffect(() => {
    if (player?.uid) {
      fetchTasks();
    }
  }, [player, filter]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const statusFilter = filter === 'all' ? null : filter;
      const response = await TaskModel.getPlayerTasks(player.uid, statusFilter);
      if (response.success) {
        console.log('Tasks data:', JSON.stringify(response.data, null, 2));
        setTasks(response.data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const getSubmissionStatus = (task) => {
    if (!task.submission || task.submission.status === 'not_submitted' || task.submission.status === 'pending') {
      return { label: 'Not Submitted', color: colors.textSecondary, icon: 'alert-circle' };
    }
    if (task.submission.status === 'submitted') {
      return { label: 'Submitted', color: colors.warning, icon: 'time' };
    }
    if (task.submission.status === 'approved') {
      return { label: 'Approved', color: colors.success, icon: 'checkmark-circle' };
    }
    if (task.submission.status === 'rejected') {
      return { label: 'Rejected', color: colors.error, icon: 'close-circle' };
    }
    return { label: 'Unknown', color: colors.textSecondary, icon: 'help-circle' };
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderTaskCard = ({ item }) => {
    const submissionStatus = getSubmissionStatus(item);
    const overdue = isOverdue(item.dueDate) && item.status === 'pending';

    return (
      <TouchableOpacity
        style={[styles.taskCard, overdue && styles.taskCardOverdue]}
        onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.taskInfo}>
            <Text style={styles.taskTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.coachName}>Coach: {item.coachName || 'Unknown'}</Text>
          </View>
          {overdue && (
            <View style={styles.overdueBadge}>
              <Ionicons name="warning" size={16} color={colors.white} />
              <Text style={styles.overdueText}>Overdue</Text>
            </View>
          )}
        </View>

        <Text style={styles.taskDescription} numberOfLines={2}>{item.description}</Text>

        <View style={styles.cardFooter}>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={styles.dateText}>Due: {formatDate(item.dueDate)}</Text>
          </View>

          <View style={[styles.submissionBadge, { backgroundColor: `${submissionStatus.color}20` }]}>
            <Ionicons name={submissionStatus.icon} size={14} color={submissionStatus.color} />
            <Text style={[styles.submissionText, { color: submissionStatus.color }]}>
              {submissionStatus.label}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="clipboard-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>No tasks found</Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'all' 
          ? 'Your coaches will assign tasks here' 
          : `No ${filter} tasks`}
      </Text>
    </View>
  );

  if (!player) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Please login to view tasks</Text>
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

      {/* Tasks List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTaskCard}
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
  taskCard: {
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
  taskCardOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  taskInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  taskTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: 4,
  },
  coachName: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  overdueText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
    marginLeft: 4,
  },
  taskDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    ...typography.bodySmall,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  submissionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  submissionText: {
    ...typography.caption,
    fontWeight: '600',
    marginLeft: 4,
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
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});

export default TasksView;
