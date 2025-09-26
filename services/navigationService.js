import { API_CONFIG, getApiHeaders } from '../config/api';
import { authUtils } from '../utils/auth';
import { getMockNavigationData, shouldUseMockData } from '../utils/mockNavigationData';

export const navigationService = {
  // Get user navigation from API
  async getUserNavigation() {
    try {
      // Check if we should use mock data
      if (shouldUseMockData()) {
        console.log('Using mock navigation data');
        return getMockNavigationData();
      }

      const token = await authUtils.getToken();
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/navigation/user/navigation?platform=M`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user navigation:', error);
      
      // Fallback to mock data if API fails
      console.log('Falling back to mock navigation data');
      return getMockNavigationData();
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
    };
    return iconMap[appId] || 'view-dashboard';
  },
}; 