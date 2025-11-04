import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { UI_CONSTANTS, COMMON_STYLES } from '../utils/uiConstants';
import { SafeAreaView } from 'react-native-safe-area-context';
import fcmService from '../services/FCMService';
import { useNotification } from '../context/NotificationContext';

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { clearUnreadCount } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Format time to relative format (e.g., "2m ago", "1h ago")
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      // Handle different timestamp formats
      let date;
      if (typeof timestamp === 'string') {
        // Handle ISO format strings (e.g., "2024-01-15T10:30:00Z")
        date = new Date(timestamp);
      } else if (typeof timestamp === 'number') {
        // Handle Unix timestamp (seconds or milliseconds)
        date = new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp);
      } else {
        date = new Date(timestamp);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid timestamp:', timestamp);
        return '';
      }
      
      const now = new Date();
      const diffMs = now - date;
      
      // Handle future dates
      if (diffMs < 0) {
        return 'Just now';
      }
      
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      const diffWeeks = Math.floor(diffDays / 7);
      const diffMonths = Math.floor(diffDays / 30);

      if (diffMins < 1) return 'Just now';
      if (diffMins === 1) return '1m ago';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours === 1) return '1h ago';
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      if (diffWeeks === 1) return '1 week ago';
      if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
      if (diffMonths === 1) return '1 month ago';
      if (diffMonths < 12) return `${diffMonths} months ago`;
      
      // Return formatted date for older notifications
      const sameYear = date.getFullYear() === now.getFullYear();
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: sameYear ? undefined : 'numeric' 
      });
    } catch (error) {
      console.error('Error formatting time:', error, timestamp);
      return '';
    }
  };

  // Get icon based on notification type
  const getIconForType = (type) => {
    const iconMap = {
      'workflow_approval': 'briefcase-check-outline',
      'breakdown_approval': 'alert-circle-outline',
      'asset_created': 'barcode-scan',
      'asset_updated': 'barcode-edit',
      'maintenance_due': 'wrench-clock',
      'test_notification': 'bell-outline',
      'work_order': 'briefcase-check-outline',
      'maintenance': 'wrench-clock',
      'breakdown': 'alert-circle-outline',
      'asset': 'barcode-scan',
      'assignment': 'account-check-outline',
      'approval': 'check-circle-outline',
      'default': 'bell-outline',
    };
    return iconMap[type?.toLowerCase()] || iconMap['default'];
  };

  // Get status color based on notification status
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'sent': return '#007AFF';
      case 'delivered': return '#34C759';
      case 'failed': return '#FF3B30';
      case 'clicked': return '#5856D6';
      default: return '#8E8E93';
    }
  };

  // Get notification type label
  const getNotificationTypeLabel = (type) => {
    const labels = {
      'workflow_approval': 'Maintenance Approval',
      'breakdown_approval': 'Breakdown Approval',
      'asset_created': 'Asset Created',
      'asset_updated': 'Asset Updated',
      'maintenance_due': 'Maintenance Due',
      'test_notification': 'Test Notification',
    };
    return labels[type] || type || 'Notification';
  };

  // Fetch notification history from API
  const fetchNotificationHistory = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Call API with filters (default: limit 50, offset 0)
      const response = await fcmService.getNotificationHistory({
        limit: 50,
        offset: 0,
      });
      
      // According to API documentation, response structure is:
      // { userId: "...", history: [...] }
      const notificationsList = response?.history || [];
      
      // Format notifications for display according to API structure
      const formattedNotifications = notificationsList.map((notification) => {
        // Get timestamp - prioritize deliveredOn from API, fallback to other fields
        const timestamp = notification.deliveredOn || notification.delivered_on || notification.sentOn || notification.sent_on || notification.timestamp || notification.created_at;
        
        return {
          id: notification.notificationId || notification.notification_id || notification.id,
          notificationId: notification.notificationId || notification.notification_id,
          title: notification.title || 'Notification',
          message: notification.body || '',
          notificationType: notification.notificationType || notification.notification_type || 'default',
          status: notification.status || 'sent',
          sentOn: notification.sentOn || notification.sent_on,
          deliveredOn: notification.deliveredOn || notification.delivered_on,
          clickedOn: notification.clickedOn || notification.clicked_on,
          data: notification.data,
          device: notification.device,
          time: formatTime(timestamp),
          icon: getIconForType(notification.notificationType || notification.notification_type || 'default'),
        };
      });
      
      setNotifications(formattedNotifications);
    } catch (err) {
      console.error('Error fetching notification history:', err);
      setError(err.message || 'Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // formatTime and getIconForType are stable functions, no need to include them

  // Load notifications when screen is focused and clear unread count
  useFocusEffect(
    useCallback(() => {
      fetchNotificationHistory();
      clearUnreadCount(); // Clear unread count when user opens notifications screen
    }, [fetchNotificationHistory, clearUnreadCount])
  );

  // Handle refresh
  const onRefresh = useCallback(() => {
    fetchNotificationHistory(true);
  }, [fetchNotificationHistory]);

  const renderItem = ({ item }) => (
    <View style={styles.notificationItem}>
      <View style={styles.notificationIconContainer}>
        <MaterialCommunityIcons name={item.icon} size={24} color={UI_CONSTANTS.COLORS.PRIMARY} />
      </View>
      <View style={styles.notificationTextContainer}>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationTitleContainer}>
            <Text style={styles.notificationTitle} numberOfLines={1} ellipsizeMode="tail">
              {item.title}
            </Text>
            <Text style={styles.notificationTypeLabel}>
              {getNotificationTypeLabel(item.notificationType)}
            </Text>
          </View>
        </View>
        <Text style={styles.notificationMessage} numberOfLines={2} ellipsizeMode="tail">
          {item.message}
        </Text>
        <View style={styles.notificationFooter}>
          <Text style={styles.notificationTime}>{item.time}</Text>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="bell-off-outline" size={64} color={UI_CONSTANTS.COLORS.GRAY_DARK} />
      <Text style={styles.emptyText}>
        {error ? t('notifications.errorLoading', 'Failed to load notifications') : t('notifications.noNotifications', 'No notifications yet')}
      </Text>
      {error && (
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchNotificationHistory()}>
          <Text style={styles.retryButtonText}>{t('common.retry', 'Retry')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={UI_CONSTANTS.COLORS.PRIMARY} />
      <View style={styles.container}>
        <View style={styles.appBar}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FEC200" />
        </TouchableOpacity>
        <View style={styles.centerTitleContainer}>
          <Text style={styles.appbarTitle} numberOfLines={1} ellipsizeMode="tail">
            {t('notifications.title', 'Notifications')}
          </Text>
        </View>
        <View style={styles.spacer} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={UI_CONSTANTS.COLORS.PRIMARY} />
          <Text style={styles.loadingText}>{t('common.loading', 'Loading...')}</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContainer,
            notifications.length === 0 && styles.emptyListContainer
          ]}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[UI_CONSTANTS.COLORS.PRIMARY]}
              tintColor={UI_CONSTANTS.COLORS.PRIMARY}
            />
          }
        />
      )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
  },
  container: {
    flex: 1,
    backgroundColor: UI_CONSTANTS.COLORS.BACKGROUND,
  },
  appBar: {
    ...COMMON_STYLES.appBar,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: UI_CONSTANTS.SPACING.SM,
  },
  navButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  centerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: UI_CONSTANTS.SPACING.MD,
  },
  appbarTitle: {
    ...COMMON_STYLES.appBarTitle,
  },
  spacer: {
    width: 48,
  },
  listContainer: {
    paddingHorizontal: UI_CONSTANTS.SPACING.LG,
    paddingTop: UI_CONSTANTS.SPACING.LG,
    paddingBottom: UI_CONSTANTS.SPACING.XL,
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: UI_CONSTANTS.SPACING.MD,
    marginBottom: UI_CONSTANTS.SPACING.MD,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E9F2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: UI_CONSTANTS.SPACING.MD,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: UI_CONSTANTS.SPACING.XS,
  },
  notificationTitleContainer: {
    flex: 1,
    marginRight: UI_CONSTANTS.SPACING.SM,
  },
  notificationTitle: {
    fontSize: UI_CONSTANTS.FONT_SIZES.MD,
    fontWeight: '600',
    color: UI_CONSTANTS.COLORS.PRIMARY_DARK || UI_CONSTANTS.COLORS.PRIMARY,
    marginBottom: 2,
  },
  notificationTypeLabel: {
    fontSize: UI_CONSTANTS.FONT_SIZES.XS,
    color: UI_CONSTANTS.COLORS.GRAY_DARK,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: UI_CONSTANTS.SPACING.SM,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  notificationMessage: {
    ...COMMON_STYLES.text.secondary,
    marginBottom: UI_CONSTANTS.SPACING.XS,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: UI_CONSTANTS.SPACING.XS,
  },
  notificationTime: {
    ...COMMON_STYLES.text.small,
    color: UI_CONSTANTS.COLORS.GRAY_DARK,
  },
  deviceText: {
    ...COMMON_STYLES.text.small,
    color: UI_CONSTANTS.COLORS.GRAY_DARK,
    fontSize: UI_CONSTANTS.FONT_SIZES.XS,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: UI_CONSTANTS.SPACING.XXL,
  },
  loadingText: {
    ...COMMON_STYLES.text.secondary,
    marginTop: UI_CONSTANTS.SPACING.MD,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: UI_CONSTANTS.SPACING.XXL,
    paddingHorizontal: UI_CONSTANTS.SPACING.LG,
  },
  emptyText: {
    ...COMMON_STYLES.text.secondary,
    textAlign: 'center',
    marginTop: UI_CONSTANTS.SPACING.MD,
  },
  retryButton: {
    marginTop: UI_CONSTANTS.SPACING.LG,
    paddingHorizontal: UI_CONSTANTS.SPACING.LG,
    paddingVertical: UI_CONSTANTS.SPACING.MD,
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: UI_CONSTANTS.FONT_SIZES.MD,
  },
});

export default NotificationsScreen;


