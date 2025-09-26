import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// UI Constants for consistent layout across all languages
export const UI_CONSTANTS = {
  // Screen dimensions
  SCREEN_WIDTH: width,
  SCREEN_HEIGHT: height,
  
  // Spacing
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 12,
    LG: 16,
    XL: 20,
    XXL: 24,
    XXXL: 32,
  },
  
  // Font sizes - consistent across languages
  FONT_SIZES: {
    XS: 10,
    SM: 12,
    MD: 14,
    LG: 16,
    XL: 18,
    XXL: 20,
    XXXL: 24,
    TITLE: 28,
  },
  
  // Button dimensions
  BUTTON_HEIGHT: 48,
  BUTTON_HEIGHT_SM: 40,
  BUTTON_HEIGHT_LG: 56,
  
  // Input dimensions
  INPUT_HEIGHT: 48,
  INPUT_HEIGHT_LG: 56,
  
  // Card dimensions
  CARD_PADDING: 16,
  CARD_BORDER_RADIUS: 12,
  
  // Icon sizes
  ICON_SIZES: {
    SM: 16,
    MD: 20,
    LG: 24,
    XL: 32,
    XXL: 48,
  },
  
  // Minimum widths for consistent layout
  MIN_BUTTON_WIDTH: 120,
  MIN_CARD_WIDTH: 280,
  
  // Maximum text widths to prevent overflow
  MAX_TEXT_WIDTH: width - 32, // Screen width minus padding
  
  // Colors
  COLORS: {
    PRIMARY: '#003667',
    SECONDARY: '#FEC200',
    SUCCESS: '#4CAF50',
    ERROR: '#F44336',
    WARNING: '#FF9800',
    INFO: '#2196F3',
    WHITE: '#FFFFFF',
    BLACK: '#000000',
    GRAY_LIGHT: '#F5F5F5',
    GRAY_MEDIUM: '#E0E0E0',
    GRAY_DARK: '#7A7A7A',
    TEXT_PRIMARY: '#222222',
    TEXT_SECONDARY: '#7A7A7A',
    BACKGROUND: '#EEEEEE',
  },
};

// Common styles for consistent UI across languages
export const COMMON_STYLES = {
  // Text styles with consistent sizing
  text: {
    primary: {
      fontSize: UI_CONSTANTS.FONT_SIZES.LG,
      color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
      fontWeight: '600',
    },
    secondary: {
      fontSize: UI_CONSTANTS.FONT_SIZES.MD,
      color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
    },
    title: {
      fontSize: UI_CONSTANTS.FONT_SIZES.TITLE,
      color: UI_CONSTANTS.COLORS.PRIMARY,
      fontWeight: 'bold',
    },
    subtitle: {
      fontSize: UI_CONSTANTS.FONT_SIZES.XL,
      color: UI_CONSTANTS.COLORS.PRIMARY,
      fontWeight: '600',
    },
    small: {
      fontSize: UI_CONSTANTS.FONT_SIZES.SM,
      color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
    },
    button: {
      fontSize: UI_CONSTANTS.FONT_SIZES.LG,
      fontWeight: 'bold',
    },
  },
  
  // Container styles
  container: {
    flex: 1,
    backgroundColor: UI_CONSTANTS.COLORS.BACKGROUND,
  },
  
  // Card styles
  card: {
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    borderRadius: UI_CONSTANTS.CARD_BORDER_RADIUS,
    padding: UI_CONSTANTS.CARD_PADDING,
    shadowColor: UI_CONSTANTS.COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Button styles
  button: {
    height: UI_CONSTANTS.BUTTON_HEIGHT,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: UI_CONSTANTS.COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  buttonPrimary: {
    backgroundColor: UI_CONSTANTS.COLORS.SECONDARY,
    minWidth: UI_CONSTANTS.MIN_BUTTON_WIDTH,
  },
  
  buttonSecondary: {
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    borderWidth: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
    minWidth: UI_CONSTANTS.MIN_BUTTON_WIDTH,
  },
  
  // Input styles
  input: {
    height: UI_CONSTANTS.INPUT_HEIGHT,
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    borderRadius: UI_CONSTANTS.CARD_BORDER_RADIUS,
    paddingHorizontal: UI_CONSTANTS.SPACING.LG,
    fontSize: UI_CONSTANTS.FONT_SIZES.LG,
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
    borderWidth: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
    shadowColor: UI_CONSTANTS.COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Row styles for consistent alignment
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  rowSpaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  // Text container styles for proper wrapping
  textContainer: {
    flex: 1,
    flexWrap: 'wrap',
  },
  
  // Menu item styles
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: UI_CONSTANTS.SPACING.LG,
    paddingHorizontal: UI_CONSTANTS.SPACING.LG,
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    borderRadius: UI_CONSTANTS.CARD_BORDER_RADIUS,
    marginBottom: UI_CONSTANTS.SPACING.MD,
    shadowColor: UI_CONSTANTS.COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Icon container styles
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: UI_CONSTANTS.SPACING.LG,
  },
  
  // App bar styles
  appBar: {
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
    elevation: 0,
    shadowOpacity: 0,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
  },
  
  appBarTitle: {
    color: UI_CONSTANTS.COLORS.WHITE,
    fontWeight: '600',
    fontSize: UI_CONSTANTS.FONT_SIZES.LG,
    alignSelf: 'center',
  },
};

// Utility functions for consistent UI
export const UI_UTILS = {
  // Get responsive font size based on screen width
  getResponsiveFontSize: (baseSize) => {
    const scale = UI_CONSTANTS.SCREEN_WIDTH / 375; // Base width is iPhone X
    return Math.max(baseSize * scale, baseSize * 0.9); // Minimum 90% of base size
  },
  
  // Get responsive spacing
  getResponsiveSpacing: (baseSpacing) => {
    const scale = UI_CONSTANTS.SCREEN_WIDTH / 375;
    return Math.max(baseSpacing * scale, baseSpacing * 0.8);
  },
  
  // Truncate text with ellipsis
  truncateText: (text, maxLength = 50) => {
    if (text && text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  },
  
  // Get button width based on text length
  getButtonWidth: (text, minWidth = UI_CONSTANTS.MIN_BUTTON_WIDTH) => {
    const textLength = text ? text.length : 0;
    const calculatedWidth = Math.max(textLength * 8 + 32, minWidth);
    return Math.min(calculatedWidth, UI_CONSTANTS.SCREEN_WIDTH - 32);
  },
  
  // Get card width based on content
  getCardWidth: (contentLength = 0) => {
    const baseWidth = UI_CONSTANTS.MIN_CARD_WIDTH;
    const contentWidth = contentLength * 6; // Approximate character width
    return Math.max(baseWidth, Math.min(contentWidth + 32, UI_CONSTANTS.SCREEN_WIDTH - 32));
  },
};
