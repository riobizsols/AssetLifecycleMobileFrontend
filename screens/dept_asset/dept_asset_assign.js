import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UI_CONSTANTS } from "../../utils/uiConstants";

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
    XXXL: scale(32),
  },
  
  // Responsive font sizes
  FONT_SIZES: {
    XS: moderateScale(10),
    SM: moderateScale(12),
    MD: moderateScale(14),
    LG: moderateScale(16),
    XL: moderateScale(18),
    XXL: moderateScale(20),
    XXXL: moderateScale(24),
    TITLE: moderateScale(28),
  },
  
  // Responsive dimensions
  CARD_PADDING: scale(16),
  CARD_BORDER_RADIUS: scale(12),
  INPUT_HEIGHT: verticalScale(45),
  BUTTON_HEIGHT: verticalScale(40),
  
  // Responsive layout
  getCardWidth: () => {
    if (DEVICE_TYPE === 'desktop') return Math.min(width * 0.6, 600);
    if (DEVICE_TYPE === 'tablet') return Math.min(width * 0.8, 500);
    return width - scale(40); // Mobile: full width minus padding
  },
  
  getCardHeight: () => {
    if (DEVICE_TYPE === 'desktop') return Math.min(height * 0.5, 400);
    if (DEVICE_TYPE === 'tablet') return Math.min(height * 0.6, 450);
    return height * 0.65; // Mobile: 65% of screen height
  },
  
  getButtonSize: () => {
    if (DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet') {
      return {
        paddingHorizontal: scale(40),
        paddingVertical: scale(12),
        minWidth: scale(150),
      };
    }
    return {
      paddingHorizontal: scale(80),
      paddingVertical: scale(12),
      width: '100%',
    };
  },
};
import { Appbar } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Camera, useCameraPermission, useCameraDevice, useCodeScanner } from "react-native-vision-camera";
import { API_CONFIG, getApiHeaders, API_ENDPOINTS } from "../../config/api";
import CustomAlert from "../../components/CustomAlert";

export default function DepartmentAssetAssign() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { departmentId, departmentName } = route.params || {};
  const [showCamera, setShowCamera] = useState(false);
  const [barcode, setBarcode] = useState(null);
  const [loading, setLoading] = useState(false);
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  
  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13', 'ean-8', 'code-128', 'code-39', 'code-93', 'codabar', 'upc-a', 'upc-e', 'pdf-417', 'aztec', 'data-matrix'],
    onCodeScanned: (codes) => {
      if (codes.length > 0) {
        handleBarcodeScanned({ data: codes[0].value });
      }
    }
  });
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
    onCancel: () => {},
    confirmText: t('common.ok'),
    cancelText: t('common.cancel'),
    showCancel: false,
  });

  const showAlert = (title, message, type = 'info', onConfirm = () => {}, showCancel = false) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      onConfirm: () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        onConfirm();
      },
      onCancel: () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
      },
      confirmText: t('common.ok'),
      cancelText: t('common.cancel'),
      showCancel,
    });
  };

  const openCamera = async () => {
    if (!hasPermission) {
      await requestPermission();
    }
    setShowCamera(true);
    setBarcode(null); // reset previous barcode
  };

  const handleBarcodeScanned = async (barcodeData) => {
    setShowCamera(false);
    setBarcode(barcodeData.data);
    
    // Call API to check serial number and get asset_id
    await checkSerialNumber(barcodeData.data);
  };

  const checkSerialNumber = async (serialNumber) => {
    setLoading(true);
    try {
      // Convert serial number to uppercase for case-insensitive search
      const normalizedSerial = serialNumber.trim().toUpperCase();
      console.log(`Checking serial number: ${normalizedSerial}`);
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.CHECK_SERIAL(normalizedSerial)}`;
      console.log('API URL:', url);
      console.log('API Headers:', getApiHeaders());
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: await getApiHeaders(),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          showAlert(t('assets.assetNotFound'), t('assets.noAssetFoundWithSerial'), "error");
          return;
        }
        if (response.status === 401) {
          showAlert(t('assets.authenticationError'), t('assets.checkAuthorizationToken'), "error");
          return;
        }
        if (response.status === 500) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Server error details:', errorData);
          showAlert(t('assets.serverError'), t('assets.serverEncounteredError'), "error");
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Asset data received:');
      console.log('Data type:', typeof data);
      console.log('Data keys:', Object.keys(data));
      
      // Check if data is an array or object
      let assetId = null;
      let assetInfo = null;
      let serialNumberFromApi = null;
      
      if (Array.isArray(data) && data.length > 0) {
        assetInfo = data[0];
        assetId = assetInfo.asset_id;
        serialNumberFromApi = assetInfo.serial_number || assetInfo.serialNumber || null;
        console.log('Asset ID from array:', assetId);
        console.log('Serial number from API (array):', serialNumberFromApi);
      } else if (data && typeof data === 'object') {
        assetInfo = data;
        assetId = data.asset_id || data.id || data.assetId;
        serialNumberFromApi = data.serial_number || data.serialNumber || null;
        console.log('Asset ID from object:', assetId);
        console.log('Serial number from API (object):', serialNumberFromApi);
      }
      
      if (assetId) {
        // Use the serial number from API response if available, otherwise use scanned barcode
        const finalSerialNumber = serialNumberFromApi || barcode;
        console.log('Final serial number to use:', finalSerialNumber);
        console.log('Scanned barcode:', barcode);
        
        // Update assetInfo with serial number from API if available
        if (assetInfo) {
          if (serialNumberFromApi && !assetInfo.serial_number) {
            assetInfo.serial_number = serialNumberFromApi;
          } else if (!assetInfo.serial_number && barcode) {
            assetInfo.serial_number = barcode;
          }
        }
        
        // Check if asset is already assigned
        await checkAssetAssignment(assetId, assetInfo, finalSerialNumber);
      } else {
        showAlert(t('assets.assetNotFound'), t('assets.noAssetFoundWithSerial'), "error");
      }
    } catch (error) {
      console.error("Error checking serial number:", error);
      
      // Provide more specific error messages
      let errorMessage = t('assets.failedToCheckSerialNumber');
      
      if (error.message.includes("Network request failed")) {
        errorMessage = t('assets.networkConnectionFailed');
      } else if (error.message.includes("timeout")) {
        errorMessage = t('assets.requestTimedOutNetwork');
      } else if (error.message.includes("fetch")) {
        errorMessage = t('assets.unableToConnectToServer');
      }
      
      showAlert(t('assets.networkError'), errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  // Check asset assignment status
  const checkAssetAssignment = async (assetId, assetData, serialNumber) => {
    try {
      console.log(`Checking asset assignment for asset ID: ${assetId}`);
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_ASSET_ASSIGNMENT(assetId)}`;
      console.log('API URL:', url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: await getApiHeaders(),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log('Asset assignment data received:');

      if (!response.ok) {
        if (response.status === 404) {
          // Asset is not assigned, navigate to assignment page
          navigation.navigate('DepartmentAssetAssignment', { 
            assetId: assetId,
            barcode: serialNumber || barcode, // Use API serial number if available
            assetData: assetData,
            departmentId: departmentId,
            departmentName: departmentName
          });
          return;
        }
        if (response.status === 401) {
          Alert.alert(
            t('assets.authenticationError'),
            t('assets.checkAuthorizationToken'),
            [{ text: t('common.ok') }]
          );
          return;
        }
        if (response.status === 500) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Server error details:', errorData);
          Alert.alert(
            t('assets.serverError'),
            t('assets.serverEncounteredError'),
            [{ text: t('common.ok') }]
          );
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Asset assignment data received:');
      
      if (data && data.length > 0) {
        // Filter assignments by latest_assignment_flag: true and action: "A"
        const filteredAssignments = data.filter(assignment => 
          assignment.latest_assignment_flag === true && 
          assignment.action === "A"
        );
        
        console.log('Filtered assignments:', filteredAssignments);
        
        if (filteredAssignments.length > 0) {
          // Asset is already assigned, navigate directly to asset details screen
          const activeAssignment = filteredAssignments[0];
          navigation.navigate('Dept_Asset_3', {
            assetId: assetId,
            assetData: assetData,
            assignmentData: activeAssignment,
            serialNumber: serialNumber || barcode,
            departmentId: departmentId,
            departmentName: departmentName
          });
        } else {
          // Asset is not assigned, navigate to assignment page
          navigation.navigate('DepartmentAssetAssignment', { 
            assetId: assetId,
            barcode: serialNumber || barcode, // Use API serial number if available
            assetData: assetData,
            departmentId: departmentId,
            departmentName: departmentName
          });
        }
      } else {
        // Asset is not assigned, navigate to assignment page
        navigation.navigate('DepartmentAssetAssignment', { 
          assetId: assetId,
          barcode: serialNumber || barcode, // Use API serial number if available
          assetData: assetData,
          departmentId: departmentId,
          departmentName: departmentName
        });
      }
    } catch (error) {
      console.error("Error getting asset assignment:", error);
      
      // Provide more specific error messages
      let errorMessage = t('assets.failedToGetAssetAssignmentData');
      
      if (error.message.includes("Network request failed")) {
        errorMessage = t('assets.networkConnectionFailed');
      } else if (error.message.includes("timeout")) {
        errorMessage = t('assets.requestTimedOutNetwork');
      } else if (error.message.includes("fetch")) {
        errorMessage = t('assets.unableToConnectToServer');
      }
      
      Alert.alert(
        t('assets.networkError'),
        errorMessage,
        [{ text: t('common.ok') }]
      );
    }
  };

  return showCamera ? (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <View style={{ position: "absolute", top: 40, right: 20, zIndex: 2 }}>
        <TouchableOpacity
          onPress={() => setShowCamera(false)}
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            borderRadius: 20,
            padding: 8,
          }}
        >
          <MaterialCommunityIcons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {device && hasPermission ? (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          codeScanner={codeScanner}
        />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center' }}>
            {t('scanning.cameraPermissionRequired')}
          </Text>
        </View>
      )}
      
      {/* Scanning Overlay */}
      <View style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -150 }, { translateY: -100 }],
        width: 300,
        height: 200,
        borderWidth: 2,
        borderColor: '#FEC200',
        backgroundColor: 'transparent',
      }}>
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: '#FEC200',
          opacity: 0.8,
        }} />
      </View>
      
      <View
        style={{
          position: "absolute",
          bottom: 40,
          alignSelf: "center",
          backgroundColor: "rgba(0,54,103,0.8)",
          padding: 12,
          borderRadius: 40,
        }}
      >
        <Text style={{ color: "#fff" }}>{t('scanning.pointCameraAtBarcode')}</Text>
      </View>
    </View>
   ) : (
     <View style={[styles.safeAreaContainer, { paddingTop: insets.top }]}>
       <StatusBar 
         barStyle="light-content" 
         backgroundColor="#003667"
         translucent={Platform.OS === 'android'}
       />
       <View style={styles.container}>
         {/* AppBar */}
         <View style={styles.appbar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={UI_CONSTANTS.ICON_SIZES.LG}
              color={UI_CONSTANTS.COLORS.SECONDARY}
            />
          </TouchableOpacity>
          <View style={styles.centerTitleContainer}>
            <Text 
              style={styles.appbarTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('assets.departmentAssetAssign')}
            </Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.contentContainer}>
          {/* Card */}
          <View style={[
            styles.card,
            { 
              width: RESPONSIVE_CONSTANTS.getCardWidth(),
              height: RESPONSIVE_CONSTANTS.getCardHeight()
            },
            DEVICE_TYPE === 'desktop' && styles.cardDesktop,
            DEVICE_TYPE === 'tablet' && styles.cardTablet
          ]}>
            <Text style={styles.cardTitle}>{t('assets.assignAsset')}</Text>
            <Text style={styles.cardSubtitle}>
              {t('assets.selectAssetToAssignToDepartment')}
            </Text>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="barcode-scan"
                size={DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet' ? 120 : 140}
                color="#222"
              />
              <View style={styles.redLine} />
            </View>
            {barcode && (
              <Text style={styles.barcodeText}>
                {t('scanning.barcodeValue')}: {barcode}
              </Text>
            )}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#003667" />
                <Text style={styles.loadingText}>{t('assets.processing')}</Text>
              </View>
            )}
          </View>

          {/* Buttons Container */}
          <View style={styles.buttonsContainer}>
            {/* Scan QR Button */}
            <TouchableOpacity
              style={[
                styles.button,
                RESPONSIVE_CONSTANTS.getButtonSize(),
                loading && styles.buttonDisabled
              ]}
              onPress={openCamera}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{t('scanning.scanAsset')}</Text>
            </TouchableOpacity>

            {/* Select Asset Button */}
            <TouchableOpacity
              style={[
                styles.button,
                styles.secondaryButton,
                RESPONSIVE_CONSTANTS.getButtonSize()
              ]}
              onPress={() => {
                console.log("Select asset button pressed");
                navigation.navigate('DepartmentAssetSelect', {
                  departmentId: departmentId,
                  departmentName: departmentName
                });
              }}
            >
              <Text style={styles.secondaryButtonText}>{t('assets.selectAsset')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      
      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        showCancel={alertConfig.showCancel}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
  },
  container: {
    flex: 1,
    backgroundColor: UI_CONSTANTS.COLORS.BACKGROUND,
  },
  appbar: {
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
    elevation: 0,
    shadowOpacity: 0,
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    position: "relative",
  },
  backButton: {
    padding: RESPONSIVE_CONSTANTS.SPACING.MD,
    marginLeft: RESPONSIVE_CONSTANTS.SPACING.SM,
    zIndex: 2,
  },
  centerTitleContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1,
  },
  appbarTitle: {
    color: UI_CONSTANTS.COLORS.WHITE,
    fontWeight: "600",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    alignSelf: "center",
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  card: {
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    borderRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: UI_CONSTANTS.COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XXXL,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.XL,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.XXXL,
  },
  cardDesktop: {
    maxWidth: 600,
  },
  cardTablet: {
    maxWidth: 500,
  },
  cardTitle: {
    fontWeight: "700",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.SM,
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
    textAlign: "center",
  },
  cardSubtitle: {
    color: UI_CONSTANTS.COLORS.GRAY_DARK,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: "500",
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XXL,
    textAlign: "center",
    marginTop: RESPONSIVE_CONSTANTS.SPACING.XXL,
  },
  iconContainer: {
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    width: DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet' ? 120 : 140,
    height: DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet' ? 120 : 140,
    alignItems: "center",
    justifyContent: "center",
    marginTop: DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet' ? 40 : 75,
    position: "relative",
  },
  redLine: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: UI_CONSTANTS.COLORS.ERROR,
    width: "100%",
    alignSelf: "center",
    transform: [{ translateY: -1 }],
  },
  barcodeText: {
    marginTop: RESPONSIVE_CONSTANTS.SPACING.XL,
    color: UI_CONSTANTS.COLORS.PRIMARY,
    fontWeight: "bold",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    textAlign: "center",
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.SM,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  secondaryButton: {
    backgroundColor: UI_CONSTANTS.COLORS.SECONDARY,
    marginBottom: 0,
  },
  buttonDisabled: {
    backgroundColor: UI_CONSTANTS.COLORS.GRAY_DARK,
  },
  buttonText: {
    color: UI_CONSTANTS.COLORS.WHITE,
    fontWeight: "500",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
  },
  secondaryButtonText: {
    color: UI_CONSTANTS.COLORS.BLACK,
    fontWeight: "500",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
  },
  loadingContainer: {
    marginTop: RESPONSIVE_CONSTANTS.SPACING.XL,
    alignItems: "center",
  },
  loadingText: {
    marginTop: RESPONSIVE_CONSTANTS.SPACING.SM,
    color: UI_CONSTANTS.COLORS.PRIMARY,
    fontWeight: "500",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
  },
});

