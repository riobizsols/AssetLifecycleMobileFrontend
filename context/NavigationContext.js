import React, { createContext, useContext, useState, useEffect } from 'react';
import { navigationService } from '../services/navigationService';
import { authUtils } from '../utils/auth';

const NavigationContext = createContext();

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

export const NavigationProvider = ({ children }) => {
  const [userNavigation, setUserNavigation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load user navigation after login
  const loadUserNavigation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const navigationData = await navigationService.getUserNavigation();
      
      // Verify job_role_id matches with stored user data
      const userData = await authUtils.getUserData();
      if (userData && userData.job_role_id && navigationData.user_id) {
        // For now, we'll assume the navigation is valid if we get a response
        // You can add additional validation here if needed
        setUserNavigation(navigationData);
      } else {
        throw new Error('User data mismatch');
      }
    } catch (error) {
      console.error('Error loading user navigation:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has access to a specific app
  const hasAccess = (appId, requiredAccessLevel = 'A') => {
    return navigationService.hasAccess(userNavigation, appId, requiredAccessLevel);
  };

  // Get sorted navigation items
  const getSortedNavigation = () => {
    return navigationService.getSortedNavigation(userNavigation);
  };

  // Clear navigation data on logout
  const clearNavigation = () => {
    setUserNavigation(null);
    setError(null);
  };

  const value = {
    userNavigation,
    loading,
    error,
    loadUserNavigation,
    hasAccess,
    getSortedNavigation,
    clearNavigation,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}; 