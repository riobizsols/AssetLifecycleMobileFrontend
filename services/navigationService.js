import { API_CONFIG, getApiHeaders } from '../config/api';
import { authUtils } from '../utils/auth';

export const navigationService = {
  // Get user navigation from API
  async getUserNavigation() {
    try {
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
      throw error;
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
    };
    return screenMap[appId] || 'Home';
  },

  // Get navigation label
  getNavigationLabel(appId) {
    const labelMap = {
      'ASSETASSIGNMENT': 'Asset Assignment',
      'EMPASSIGNMENT': 'Employee Assignment',
      'DEPTASSIGNMENT': 'Department Assignment',
    };
    return labelMap[appId] || 'Unknown';
  },

  // Get icon for navigation item
  getNavigationIcon(appId) {
    const iconMap = {
      'ASSETASSIGNMENT': 'barcode-scan',
      'EMPASSIGNMENT': 'account-group',
      'DEPTASSIGNMENT': 'domain',
    };
    return iconMap[appId] || 'view-dashboard';
  },
}; 