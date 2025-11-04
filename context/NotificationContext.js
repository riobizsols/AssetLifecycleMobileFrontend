import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import FCMService from '../services/FCMService';

// Notification types supported by the backend
export const NOTIFICATION_TYPES = {
  ASSET_CREATED: 'asset_created',
  ASSET_UPDATED: 'asset_updated',
  ASSET_DELETED: 'asset_deleted',
  MAINTENANCE_DUE: 'maintenance_due',
  MAINTENANCE_COMPLETED: 'maintenance_completed',
  WORKFLOW_APPROVAL: 'workflow_approval',
  WORKFLOW_ESCALATED: 'workflow_escalated',
  BREAKDOWN_REPORTED: 'breakdown_reported',
  USER_ASSIGNED: 'user_assigned',
  TEST_NOTIFICATION: 'test_notification',
};

// Initial state
const initialState = {
  // FCM Status
  isInitialized: false,
  isRegistered: false,
  fcmToken: null,
  
  // Notification Preferences
  preferences: {},
  preferencesLoading: false,
  preferencesError: null,
  
  // Device Tokens
  deviceTokens: [],
  deviceTokensLoading: false,
  deviceTokensError: null,
  
  // Notification History
  notificationHistory: [],
  historyLoading: false,
  historyError: null,
  
  // UI State
  settingsLoading: false,
  settingsError: null,
  testNotificationLoading: false,
  
  // Unread Count
  unreadCount: 0,
};

// Action types
const ACTION_TYPES = {
  // FCM Status
  SET_INITIALIZED: 'SET_INITIALIZED',
  SET_REGISTERED: 'SET_REGISTERED',
  SET_FCM_TOKEN: 'SET_FCM_TOKEN',
  
  // Preferences
  SET_PREFERENCES: 'SET_PREFERENCES',
  SET_PREFERENCES_LOADING: 'SET_PREFERENCES_LOADING',
  SET_PREFERENCES_ERROR: 'SET_PREFERENCES_ERROR',
  UPDATE_PREFERENCE: 'UPDATE_PREFERENCE',
  
  // Device Tokens
  SET_DEVICE_TOKENS: 'SET_DEVICE_TOKENS',
  SET_DEVICE_TOKENS_LOADING: 'SET_DEVICE_TOKENS_LOADING',
  SET_DEVICE_TOKENS_ERROR: 'SET_DEVICE_TOKENS_ERROR',
  
  // Notification History
  SET_NOTIFICATION_HISTORY: 'SET_NOTIFICATION_HISTORY',
  SET_HISTORY_LOADING: 'SET_HISTORY_LOADING',
  SET_HISTORY_ERROR: 'SET_HISTORY_ERROR',
  
  // UI State
  SET_SETTINGS_LOADING: 'SET_SETTINGS_LOADING',
  SET_SETTINGS_ERROR: 'SET_SETTINGS_ERROR',
  SET_TEST_NOTIFICATION_LOADING: 'SET_TEST_NOTIFICATION_LOADING',
  
  // Unread Count
  INCREMENT_UNREAD_COUNT: 'INCREMENT_UNREAD_COUNT',
  CLEAR_UNREAD_COUNT: 'CLEAR_UNREAD_COUNT',
  SET_UNREAD_COUNT: 'SET_UNREAD_COUNT',
  
  // Reset
  RESET_STATE: 'RESET_STATE',
};

// Reducer
const notificationReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.SET_INITIALIZED:
      return { ...state, isInitialized: action.payload };
    
    case ACTION_TYPES.SET_REGISTERED:
      return { ...state, isRegistered: action.payload };
    
    case ACTION_TYPES.SET_FCM_TOKEN:
      return { ...state, fcmToken: action.payload };
    
    case ACTION_TYPES.SET_PREFERENCES:
      return { 
        ...state, 
        preferences: action.payload,
        preferencesLoading: false,
        preferencesError: null,
      };
    
    case ACTION_TYPES.SET_PREFERENCES_LOADING:
      return { ...state, preferencesLoading: action.payload };
    
    case ACTION_TYPES.SET_PREFERENCES_ERROR:
      return { 
        ...state, 
        preferencesError: action.payload,
        preferencesLoading: false,
      };
    
    case ACTION_TYPES.UPDATE_PREFERENCE:
      return {
        ...state,
        preferences: {
          ...state.preferences,
          [action.payload.notificationType]: {
            ...state.preferences[action.payload.notificationType],
            ...action.payload.preferences,
          },
        },
      };
    
    case ACTION_TYPES.SET_DEVICE_TOKENS:
      return {
        ...state,
        deviceTokens: action.payload,
        deviceTokensLoading: false,
        deviceTokensError: null,
      };
    
    case ACTION_TYPES.SET_DEVICE_TOKENS_LOADING:
      return { ...state, deviceTokensLoading: action.payload };
    
    case ACTION_TYPES.SET_DEVICE_TOKENS_ERROR:
      return {
        ...state,
        deviceTokensError: action.payload,
        deviceTokensLoading: false,
      };
    
    case ACTION_TYPES.SET_NOTIFICATION_HISTORY:
      return {
        ...state,
        notificationHistory: action.payload,
        historyLoading: false,
        historyError: null,
      };
    
    case ACTION_TYPES.SET_HISTORY_LOADING:
      return { ...state, historyLoading: action.payload };
    
    case ACTION_TYPES.SET_HISTORY_ERROR:
      return {
        ...state,
        historyError: action.payload,
        historyLoading: false,
      };
    
    case ACTION_TYPES.SET_SETTINGS_LOADING:
      return { ...state, settingsLoading: action.payload };
    
    case ACTION_TYPES.SET_SETTINGS_ERROR:
      return { ...state, settingsError: action.payload };
    
    case ACTION_TYPES.SET_TEST_NOTIFICATION_LOADING:
      return { ...state, testNotificationLoading: action.payload };
    
    case ACTION_TYPES.INCREMENT_UNREAD_COUNT:
      return { ...state, unreadCount: state.unreadCount + 1 };
    
    case ACTION_TYPES.CLEAR_UNREAD_COUNT:
      return { ...state, unreadCount: 0 };
    
    case ACTION_TYPES.SET_UNREAD_COUNT:
      return { ...state, unreadCount: action.payload };
    
    case ACTION_TYPES.RESET_STATE:
      return initialState;
    
    default:
      return state;
  }
};

// Context
const NotificationContext = createContext();

// Provider component
export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Initialize FCM service
  useEffect(() => {
    initializeFCM();
  }, []);

  const initializeFCM = async () => {
    try {
      await FCMService.initialize();
      const token = await FCMService.getFCMToken();
      
      dispatch({ type: ACTION_TYPES.SET_INITIALIZED, payload: true });
      dispatch({ type: ACTION_TYPES.SET_FCM_TOKEN, payload: token });
      dispatch({ type: ACTION_TYPES.SET_REGISTERED, payload: FCMService.isRegistered });
    } catch (error) {
      console.error('Error initializing FCM:', error);
    }
  };

  // Load notification preferences
  const loadPreferences = async () => {
    try {
      dispatch({ type: ACTION_TYPES.SET_PREFERENCES_LOADING, payload: true });
      const preferences = await FCMService.getNotificationPreferences();
      
      const preferencesMap = preferences.reduce((acc, pref) => {
        acc[pref.notificationType] = pref;
        return acc;
      }, {});
      
      dispatch({ type: ACTION_TYPES.SET_PREFERENCES, payload: preferencesMap });
    } catch (error) {
      dispatch({ type: ACTION_TYPES.SET_PREFERENCES_ERROR, payload: error.message });
    }
  };

  // Update notification preference
  const updatePreference = async (notificationType, preferences) => {
    try {
      dispatch({ type: ACTION_TYPES.SET_SETTINGS_LOADING, payload: true });
      
      await FCMService.updateNotificationPreference(notificationType, preferences);
      
      dispatch({
        type: ACTION_TYPES.UPDATE_PREFERENCE,
        payload: { notificationType, preferences },
      });
      
      dispatch({ type: ACTION_TYPES.SET_SETTINGS_LOADING, payload: false });
    } catch (error) {
      dispatch({ type: ACTION_TYPES.SET_SETTINGS_ERROR, payload: error.message });
    }
  };

  // Update multiple preferences
  const updateMultiplePreferences = async (preferencesArray) => {
    try {
      dispatch({ type: ACTION_TYPES.SET_SETTINGS_LOADING, payload: true });
      
      await FCMService.updateMultiplePreferences(preferencesArray);
      
      // Update local state
      preferencesArray.forEach(({ notificationType, preferences }) => {
        dispatch({
          type: ACTION_TYPES.UPDATE_PREFERENCE,
          payload: { notificationType, preferences },
        });
      });
      
      dispatch({ type: ACTION_TYPES.SET_SETTINGS_LOADING, payload: false });
    } catch (error) {
      dispatch({ type: ACTION_TYPES.SET_SETTINGS_ERROR, payload: error.message });
    }
  };

  // Load device tokens
  const loadDeviceTokens = async (platform = null) => {
    try {
      dispatch({ type: ACTION_TYPES.SET_DEVICE_TOKENS_LOADING, payload: true });
      const tokens = await FCMService.getUserDeviceTokens(platform);
      dispatch({ type: ACTION_TYPES.SET_DEVICE_TOKENS, payload: tokens });
    } catch (error) {
      dispatch({ type: ACTION_TYPES.SET_DEVICE_TOKENS_ERROR, payload: error.message });
    }
  };

  // Load notification history
  const loadNotificationHistory = async (limit = 50, offset = 0) => {
    try {
      dispatch({ type: ACTION_TYPES.SET_HISTORY_LOADING, payload: true });
      const history = await FCMService.getNotificationHistory(limit, offset);
      
      // Ensure history is an array
      const historyArray = Array.isArray(history) ? history : 
                          (history && Array.isArray(history.notifications)) ? history.notifications : [];
      
      dispatch({ type: ACTION_TYPES.SET_NOTIFICATION_HISTORY, payload: historyArray });
    } catch (error) {
      dispatch({ type: ACTION_TYPES.SET_HISTORY_ERROR, payload: error.message });
      // Set empty array on error
      dispatch({ type: ACTION_TYPES.SET_NOTIFICATION_HISTORY, payload: [] });
    }
  };

  // Send test notification
  const sendTestNotification = async (title, body, data = {}) => {
    try {
      dispatch({ type: ACTION_TYPES.SET_TEST_NOTIFICATION_LOADING, payload: true });
      const result = await FCMService.sendTestNotification(title, body, data);
      dispatch({ type: ACTION_TYPES.SET_TEST_NOTIFICATION_LOADING, payload: false });
      return result;
    } catch (error) {
      dispatch({ type: ACTION_TYPES.SET_TEST_NOTIFICATION_LOADING, payload: false });
      throw error;
    }
  };

  // Register token with server
  const registerToken = async () => {
    try {
      await FCMService.registerTokenWithServer();
      dispatch({ type: ACTION_TYPES.SET_REGISTERED, payload: true });
    } catch (error) {
      console.error('Error registering token:', error);
      throw error;
    }
  };

  // Unregister token from server
  const unregisterToken = async () => {
    try {
      await FCMService.unregisterTokenFromServer();
      dispatch({ type: ACTION_TYPES.SET_REGISTERED, payload: false });
    } catch (error) {
      console.error('Error unregistering token:', error);
      throw error;
    }
  };

  // Set authentication token
  const setAuthToken = async (token) => {
    await FCMService.setAuthToken(token);
  };

  // Clear authentication token
  const clearAuthToken = async () => {
    await FCMService.clearAuthToken();
    dispatch({ type: ACTION_TYPES.SET_REGISTERED, payload: false });
  };

  // Handle user login
  const handleUserLogin = async () => {
    try {
      await FCMService.handleUserLogin();
      dispatch({ type: ACTION_TYPES.SET_REGISTERED, payload: FCMService.isRegistered });
      await loadPreferences();
    } catch (error) {
      console.error('Error handling user login:', error);
    }
  };

  // Handle user logout
  const handleUserLogout = async () => {
    try {
      await FCMService.handleUserLogout();
      dispatch({ type: ACTION_TYPES.SET_REGISTERED, payload: false });
      dispatch({ type: ACTION_TYPES.RESET_STATE });
    } catch (error) {
      console.error('Error handling user logout:', error);
    }
  };

  // Check if notification type is enabled
  const isNotificationEnabled = (notificationType) => {
    return FCMService.isNotificationEnabled(notificationType);
  };

  // Get preference for specific notification type
  const getNotificationPreference = (notificationType) => {
    return state.preferences[notificationType] || {
      isEnabled: true,
      emailEnabled: true,
      pushEnabled: true,
    };
  };

  // Get all notification types with their preferences
  const getAllNotificationTypes = () => {
    return Object.values(NOTIFICATION_TYPES).map(type => ({
      type,
      preference: getNotificationPreference(type),
    }));
  };

  // Increment unread count when notification is received
  const incrementUnreadCount = useCallback(() => {
    dispatch({ type: ACTION_TYPES.INCREMENT_UNREAD_COUNT });
  }, []);

  // Clear unread count (when user opens notifications screen)
  const clearUnreadCount = useCallback(() => {
    dispatch({ type: ACTION_TYPES.CLEAR_UNREAD_COUNT });
  }, []);

  // Set unread count to specific value
  const setUnreadCount = useCallback((count) => {
    dispatch({ type: ACTION_TYPES.SET_UNREAD_COUNT, payload: count });
  }, []);

  const contextValue = {
    // State
    ...state,
    
    // Actions
    loadPreferences,
    updatePreference,
    updateMultiplePreferences,
    loadDeviceTokens,
    loadNotificationHistory,
    sendTestNotification,
    registerToken,
    unregisterToken,
    setAuthToken,
    clearAuthToken,
    handleUserLogin,
    handleUserLogout,
    isNotificationEnabled,
    getNotificationPreference,
    getAllNotificationTypes,
    incrementUnreadCount,
    clearUnreadCount,
    setUnreadCount,
    
    // Constants
    NOTIFICATION_TYPES,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
