import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Appbar } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

// Responsive design breakpoints
const BREAKPOINTS = {
  SMALL: 320,   // iPhone SE, small phones
  MEDIUM: 375,  // iPhone X, standard phones
  LARGE: 414,   // iPhone Plus, large phones
  TABLET: 768,  // iPad, tablets
  DESKTOP: 1024, // Desktop/large tablets
};

// Device type detection
const getDeviceType = () => {
  if (width >= BREAKPOINTS.DESKTOP) return 'desktop';
  if (width >= BREAKPOINTS.TABLET) return 'tablet';
  if (width >= BREAKPOINTS.LARGE) return 'large';
  if (width >= BREAKPOINTS.MEDIUM) return 'medium';
  return 'small';
};

const DEVICE_TYPE = getDeviceType();

// Responsive scaling functions
const scale = (size) => {
  const scaleFactor = width / BREAKPOINTS.MEDIUM; // Base on iPhone X (375px)
  return Math.max(size * scaleFactor, size * 0.8); // Minimum 80% of original size
};

const verticalScale = (size) => {
  const scaleFactor = height / 812; // Base on iPhone X height
  return Math.max(size * scaleFactor, size * 0.8);
};

const moderateScale = (size, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

// Responsive UI constants for this screen
const RESPONSIVE_CONSTANTS = {
  // Responsive spacing
  SPACING: {
    XS: scale(4),
    SM: scale(8),
    MD: scale(12),
    LG: scale(16),
    XL: scale(20),
    XXL: scale(24),
  },
  
  // Responsive font sizes
  FONT_SIZES: {
    XS: moderateScale(10),
    SM: moderateScale(12),
    MD: moderateScale(14),
    LG: moderateScale(16),
    XL: moderateScale(18),
  },
  
  // Responsive dimensions
  INPUT_HEIGHT: verticalScale(35),
  BUTTON_HEIGHT: verticalScale(40),
  LABEL_WIDTH: scale(115),
  COLON_WIDTH: scale(10),
  CARD_BORDER_RADIUS: scale(8),
  
  // Responsive button widths
  getButtonWidth: () => {
    if (DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet') {
      return scale(120);
    }
    return scale(100);
  },
};

export default function Asset_2() {
    const { t } = useTranslation();
    const navigation = useNavigation();
  return (
    <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f4f4f4' }}>
      {/* AppBar */}
      <Appbar.Header style={styles.appbar}>
          <Appbar.Action icon="menu" color="#FEC200" onPress={() => {}} />
          {/* Centered Title */}
          <View style={styles.centerTitleContainer}>
            <Text style={styles.appbarTitle}>{t('assets.employeeAsset')}</Text>
          </View>
          {/* Right side empty to balance layout */}
          <View style={{ width: 40 }} />
        </Appbar.Header>

      {/* Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderText}>{t('assets.serialNo')}: 121354</Text>
        </View>
        <View style={styles.yellowLine} />
        <View style={styles.cardBody}>
          <View style={styles.inputRow}>
            <Text style={styles.label}>{t('assets.assetType')}</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput style={styles.input} value="122101" editable={false} />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.label}>{t('employees.department')}</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput style={styles.input} value="HR" editable={false} />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.label}>{t('assets.effectiveDate')}</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput style={styles.input} value="20/12/2025" editable={false} />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.label}>{t('assets.returnDate')}</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput style={styles.input} value="20/12/2026" editable={false} />
          </View>
        </View>
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>{t('assets.cancelAssign')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.okayButton} onPress={() => navigation.goBack()}>
          <Text style={styles.okayButtonText}>{t('assets.okay')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
    </SafeAreaProvider>
    
  );
}

const styles = StyleSheet.create({
    appbar: {
        backgroundColor: "#003667",
        elevation: 0,
        shadowOpacity: 0,
        height: verticalScale(60),
        flexDirection: "row",
        alignItems: "center",
        position: "relative",
      },
      centerTitleContainer: {
        position: "absolute",
        left: 0,
        right: 0,
        alignItems: "center",
        zIndex: 1,
      },
      appbarTitle: {
        color: "#fff",
        fontWeight: "600",
        fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
        alignSelf: "center",
      },
  card: {
    margin: RESPONSIVE_CONSTANTS.SPACING.MD,
    marginTop: RESPONSIVE_CONSTANTS.SPACING.XL,
    borderRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    backgroundColor: '#003667',
    borderTopLeftRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    borderTopRightRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    alignItems: 'center',
  },
  cardHeaderText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
  },
  cardBody: {
    padding: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  yellowLine: {
    height: 3,
    backgroundColor: "#FEC200",
    width: "100%",
  },
  label: {
    width: RESPONSIVE_CONSTANTS.LABEL_WIDTH,
    color: '#616161',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: '500'
  },
  colon: {
    width: RESPONSIVE_CONSTANTS.COLON_WIDTH,
    color: '#616161',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    textAlign: 'center',
    marginHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: scale(4),
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.MD,
    height: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
    borderWidth: 1,
    borderColor: '#ccc',
    color: '#616161',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    textAlignVertical: 'center',
    textAlign: 'left',
    fontWeight: '400',
    paddingVertical: 0,
  },
  bottomBar: {
    position: 'absolute',
    bottom: verticalScale(50),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    backgroundColor: 'transparent',
  },
  cancelButton: {
    backgroundColor: '#FEC200',
    borderRadius: scale(6),
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG + scale(2),
    marginRight: RESPONSIVE_CONSTANTS.SPACING.MD,
    minWidth: RESPONSIVE_CONSTANTS.getButtonWidth(),
    alignItems: 'center',
    minHeight: RESPONSIVE_CONSTANTS.BUTTON_HEIGHT,
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
  },
  okayButton: {
    backgroundColor: '#003667',
    borderRadius: scale(6),
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.XXL + scale(4),
    minWidth: scale(80),
    alignItems: 'center',
    minHeight: RESPONSIVE_CONSTANTS.BUTTON_HEIGHT,
    justifyContent: 'center',
  },
  okayButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
  },
});
