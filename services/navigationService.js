import { API_CONFIG, setServerUrl } from '../config/api';
import { authUtils } from '../utils/auth';

export const navigationService = {
  // Get user navigation from API
  async getUserNavigation() {
    try {
      const token = await authUtils.getToken();
      let response;
      let serverUrl = API_CONFIG.BASE_URL;

      console.log('Fetching user navigation from:', serverUrl);

      // Try primary server first with timeout
      try {
        response = await Promise.race([
          fetch(`${serverUrl}/api/navigation/user/navigation?platform=M`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 10000)
          )
        ]);
      } catch (primaryError) {
        console.log('Primary server failed for navigation:', primaryError.message);

        // Try fallback servers
        for (const fallbackUrl of API_CONFIG.FALLBACK_URLS) {
          try {
            console.log(`Trying fallback server for navigation: ${fallbackUrl}`);
            response = await Promise.race([
              fetch(`${fallbackUrl}/api/navigation/user/navigation?platform=M`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/json',
                },
              }),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), 10000)
              )
            ]);
            serverUrl = fallbackUrl;
            console.log(`Successfully connected to fallback server: ${fallbackUrl}`);
            setServerUrl(fallbackUrl);
            break;
          } catch (fallbackError) {
            console.log(`Fallback server ${fallbackUrl} also failed:`, fallbackError.message);
          }
        }

        // If all servers failed, return empty navigation
        if (!response) {
          console.log('All servers failed, returning empty navigation');
          return {
            user_id: null,
            data: []
          };
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Transform the API response to match expected format
      if (data.success && data.data) {
        console.log('Navigation data loaded successfully from API');
        return {
          user_id: data.user_id,
          data: data.data.map(item => ({
            app_id: item.app_id,
            label: item.label,
            sequence: item.seq,
            access_level: item.access_level,
            int_status: 1, // All items from API are active
            icon: navigationService.getNavigationIcon(item.app_id)
          }))
        };
      }

      // Return empty navigation if data format is unexpected
      return {
        user_id: null,
        data: []
      };
    } catch (error) {
      console.error('Error fetching user navigation:', error);

      // Return empty navigation on error
      return {
        user_id: null,
        data: []
      };
    }
  },

  // Check if user has access to a specific app
  hasAccess(userNavigation, appId, requiredAccessLevel = 'A') {
    if (!userNavigation || !userNavigation.data) return false;
    
    const navigationItem = userNavigation.data.find(item => item.app_id === appId);
    if (!navigationItem) return false;

    // Check access level
    if (requiredAccessLevel === 'A' && navigationItem.access_level !== 'A') {
      return false;
    }

    return true;
  },

  // Get navigation items sorted by sequence
  getSortedNavigation(userNavigation) {
    if (!userNavigation || !userNavigation.data) return [];
    
    return userNavigation.data
      .filter(item => item.int_status === 1) // Only active items
      .sort((a, b) => a.sequence - b.sequence); // Sort by sequence
  },

  // Map app_id to screen name
  getScreenName(appId) {
    const screenMap = {
      'ASSETASSIGNMENT': 'Asset',
      'EMPASSIGNMENT': 'EmployeeAsset',
      'DEPTASSIGNMENT': 'DepartmentAsset',
      'MAINTENANCE SUPERVISER': 'MaintenanceSupervisor',
      'REPORTBREAKDOWN': 'REPORTBREAKDOWN',
      'WORKORDERMANAGEMENT': 'WorkOrderManagement',
      'USAGEBASEDASSET': 'RecordUsage',
        'FCMDEBUG': 'FCMDebug',
        'FCMTEST': 'FCMTest',
        'NOTIFICATIONSETTINGS': 'NotificationSettings',
        'STATUSBARTESTER': 'StatusBarTester',
        'NOTIFICATIONTROUBLESHOOTER': 'NotificationTroubleshooter',
    };
    return screenMap[appId] || 'Home';
  },

  // Get navigation label (returns translation key)
  getNavigationLabel(appId) {
    const labelMap = {
      'ASSETASSIGNMENT': 'navigation.assetAssignment',
      'EMPASSIGNMENT': 'navigation.employeeAssets',
      'DEPTASSIGNMENT': 'navigation.departmentAssets',
      'MAINTENANCE SUPERVISER': 'navigation.maintenanceSupervisor',
      'REPORTBREAKDOWN': 'navigation.reportBreakdown',
      'WORKORDERMANAGEMENT': 'navigation.workOrderManagement',
      'USAGEBASEDASSET': 'navigation.usageBasedAsset',
        'FCMDEBUG': 'FCM Debug',
        'FCMTEST': 'FCM Test',
        'NOTIFICATIONSETTINGS': 'Notification Settings',
        'STATUSBARTESTER': 'Status Bar Tester',
        'NOTIFICATIONTROUBLESHOOTER': 'Notification Troubleshooter',
    };
    return labelMap[appId] || 'navigation.dashboard';
  },

  // Get navigation subtitle (returns translation key)
  getNavigationSubtitle(appId) {
    const subtitleMap = {
      'ASSETASSIGNMENT': 'navigation.scanAndManageAssets',
      'EMPASSIGNMENT': 'navigation.viewEmployeeAssetAssignments',
      'DEPTASSIGNMENT': 'navigation.manageDepartmentAssetAllocations',
      'MAINTENANCE SUPERVISER': 'navigation.updateMaintenanceSchedules',
      'REPORTBREAKDOWN': 'navigation.viewAndManageBreakdownReports',
      'WORKORDERMANAGEMENT': 'navigation.manageWorkOrdersAndTasks',
      'USAGEBASEDASSET': 'navigation.trackUsageAndHistory',
    };
    return subtitleMap[appId] || 'navigation.scanAndManageAssets';
  },

  // Get icon for navigation item
  getNavigationIcon(appId) {
    const iconMap = {
      'ASSETASSIGNMENT': 'barcode-scan',
      'EMPASSIGNMENT': 'account-group',
      'DEPTASSIGNMENT': 'domain',
      'MAINTENANCE SUPERVISER': 'wrench',
      'REPORTBREAKDOWN': 'clipboard-alert',
      'WORKORDERMANAGEMENT': 'clipboard-list',
      'USAGEBASEDASSET': 'clipboard-text-clock',
        'FCMDEBUG': 'bug',
        'FCMTEST': 'bell-ring',
        'NOTIFICATIONSETTINGS': 'cog',
        'STATUSBARTESTER': 'bell-outline',
        'NOTIFICATIONTROUBLESHOOTER': 'wrench',
    };
    return iconMap[appId] || 'view-dashboard';
  },
}; 