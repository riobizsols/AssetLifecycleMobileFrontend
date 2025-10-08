import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Custom hook for consistent SafeArea handling across iOS and Android
 * @returns {Object} SafeArea configuration
 */
export const useSafeAreaConfig = () => {
  const insets = useSafeAreaInsets();
  
  return {
    // Top padding for SafeAreaView
    paddingTop: insets.top,
    
    // Bottom padding for SafeAreaView
    paddingBottom: insets.bottom,
    
    // Left padding for SafeAreaView
    paddingLeft: insets.left,
    
    // Right padding for SafeAreaView
    paddingRight: insets.right,
    
    // StatusBar configuration
    statusBarConfig: {
      barStyle: 'light-content',
      backgroundColor: '#003667',
      translucent: Platform.OS === 'android',
    },
    
    // AppBar container styles
    appBarContainerStyles: {
      backgroundColor: '#003667',
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      position: 'relative',
      paddingHorizontal: 0,
      ...Platform.select({
        ios: {
          // iOS handles safe area automatically
        },
        android: {
          // Android needs explicit handling
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
      }),
    },
  };
};

/**
 * Get consistent SafeAreaView styles
 * @param {Object} insets - Safe area insets
 * @param {string} backgroundColor - Background color for the safe area
 * @returns {Object} SafeAreaView styles
 */
export const getSafeAreaStyles = (insets, backgroundColor = '#EEEEEE') => {
  return {
    flex: 1,
    backgroundColor,
    // Removed paddingTop to prevent excessive spacing
  };
};

/**
 * Get container styles with safe area padding
 * @param {Object} insets - Safe area insets
 * @param {string} backgroundColor - Background color for the container
 * @returns {Object} Container styles with safe area padding
 */
export const getContainerWithSafeAreaStyles = (insets, backgroundColor = '#003667') => {
  return {
    flex: 1,
    backgroundColor,
    paddingTop: insets.top,
  };
};

/**
 * Get consistent container styles for the main wrapper
 * @param {string} backgroundColor - Background color for the container
 * @returns {Object} Container styles
 */
export const getContainerStyles = (backgroundColor = '#003667') => {
  return {
    flex: 1,
    backgroundColor,
  };
};

/**
 * Get content area styles with proper background color
 * @param {string} backgroundColor - Background color for the content area
 * @returns {Object} Content area styles
 */
export const getContentAreaStyles = (backgroundColor = '#EEEEEE') => {
  return {
    flex: 1,
    backgroundColor,
  };
};
