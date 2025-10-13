import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Appbar } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Camera, useCameraPermission, useCameraDevice, useCodeScanner } from "react-native-vision-camera";
import { API_CONFIG, getApiHeaders, API_ENDPOINTS } from "../../config/api";
import { authUtils } from "../../utils/auth";
import CustomAlert from "../../components/CustomAlert";
import SideMenu from "../../components/SideMenu";
import { useNavigation as useNavigationContext } from "../../context/NavigationContext";

export default function App() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { hasAccess } = useNavigationContext();
  const [showCamera, setShowCamera] = useState(false);
  const [barcode, setBarcode] = useState(null);
  const [loading, setLoading] = useState(false);
  const { hasPermission, requestPermission } = useCameraPermission();
  const [menuVisible, setMenuVisible] = useState(false);
  const device = useCameraDevice('back');
  const insets = useSafeAreaInsets();
  
  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13', 'code-128', 'code-39', 'ean-8', 'upc-e'],
    onCodeScanned: (codes) => {
      if (codes.length > 0 && !loading) {
        handleBarcodeScanned({ data: codes[0].value });
      }
    },
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

  const handleLogout = async () => {
    showAlert(
      t('auth.logout'),
      t('auth.logoutConfirm'),
      'warning',
      async () => {
        try {
          await authUtils.removeToken();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        } catch (error) {
          console.error('Logout error:', error);
          showAlert(t('common.error'), t('auth.logoutFailed'), 'error');
        }
      },
      true
    );
  };

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const closeMenu = () => {
    setMenuVisible(false);
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
          Alert.alert(
            t('assets.assetNotFound'),
            t('assets.noAssetFoundWithSerial'),
            [{ text: t('common.ok') }]
          );
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
      console.log('Asset data received:');
      console.log('Data type:', typeof data);
      console.log('Data keys:', Object.keys(data));
      
      // Check if data is an array or object
      let assetId = null;
      let assetData = null;
      if (Array.isArray(data) && data.length > 0) {
        assetId = data[0].asset_id;
        assetData = data[0];
        console.log('Asset ID from array:', assetId);
      } else if (data && typeof data === 'object') {
        assetId = data.asset_id || data.id || data.assetId;
        assetData = data;
        console.log('Asset ID from object:', assetId);
      }
      
      if (assetId && assetData) {
        // Call API to get asset assignment data, passing the full asset data
        await getAssetAssignment(assetId, assetData);
      } else {
        Alert.alert(
          t('assets.assetNotFound'),
          t('assets.noAssetFoundWithSerial'),
          [{ text: t('common.ok') }]
        );
      }
    } catch (error) {
      console.error("Error checking serial number:", error);
      
      // Provide more specific error messages
      let errorMessage = t('assets.failedToCheckSerialNumber');
      
      if (error.message.includes("Network request failed")) {
        errorMessage = t('assets.networkConnectionFailed');
      } else if (error.message.includes("timeout")) {
        errorMessage = t('assets.requestTimedOut');
      } else if (error.message.includes("fetch")) {
        errorMessage = t('assets.unableToConnectToServer');
      }
      
      Alert.alert(
        t('assets.networkError'),
        errorMessage,
        [{ text: t('common.ok') }]
      );
    } finally {
      setLoading(false);
    }
  };

  const getAssetAssignment = async (assetId, assetData) => {
    try {
      console.log(`Getting asset assignment for asset ID: ${assetId}`);
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
          Alert.alert(
            t('assets.noAssignmentFound'),
            t('assets.assetNotAssignedToEmployee'),
            [{ text: t('common.ok') }]
          );
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
          // Navigate to asset_2.js with the filtered asset assignment data and asset details
          navigation.navigate('AssetDetails', { 
            assetAssignment: filteredAssignments[0],
            assetData: assetData,
            barcode: barcode 
          });
        } else {
          // Check access level before allowing assignment
          if (hasAccess('ASSETASSIGNMENT', 'A')) {
            // Navigate to asset_3.js for unassigned assets or assets without matching criteria
            navigation.navigate('AssetAssignment', { 
              assetId: assetId,
              assetData: assetData,
              barcode: barcode 
            });
          } else {
            showAlert(t('assets.accessDenied'), t('assets.noPermissionToAssignAssets'), 'error');
          }
        }
      } else {
        // Check access level before allowing assignment
        if (hasAccess('ASSETASSIGNMENT', 'A')) {
          // Navigate to asset_3.js for unassigned assets
          navigation.navigate('AssetAssignment', { 
            assetId: assetId,
            assetData: assetData,
            barcode: barcode 
          });
        } else {
          showAlert(t('assets.accessDenied'), t('assets.noPermissionToAssignAssets'), 'error');
        }
      }
    } catch (error) {
      console.error("Error getting asset assignment:", error);
      
      // Provide more specific error messages
      let errorMessage = t('assets.failedToGetAssetAssignment');
      
      if (error.message.includes("Network request failed")) {
        errorMessage = t('assets.networkConnectionFailed');
      } else if (error.message.includes("timeout")) {
        errorMessage = t('assets.requestTimedOut');
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
    <View style={{ flex: 1 }}>
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
      {device != null && hasPermission && (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={showCamera}
          codeScanner={codeScanner}
        />
      )}
      {!hasPermission && (
        <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center' }}>
            {t('scanning.cameraPermissionRequired')}
          </Text>
        </View>
      )}
      <View
        style={{
          position: "absolute",
          bottom: 40,
          alignSelf: "center",
          backgroundColor: "#003667",
          padding: 12,
          borderRadius: 40,
        }}
      >
        <Text style={{ color: "#fff" }}>{t('scanning.pointCameraAtBarcode')}</Text>
      </View>
    </View>
  ) : (
    <View style={[{ flex: 1, backgroundColor: "#003667" }, { paddingTop: insets.top }]}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#003667"
        translucent={Platform.OS === 'android'}
      />
      {/* AppBar */}
      <View style={styles.appbarContainer}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FEC200" />
          </TouchableOpacity>
          <View style={styles.centerTitleContainer}>
            <Text style={styles.appbarTitle}>{t('navigation.assetAssignment')}</Text>
          </View>
        </View>

      {/* Main Content */}
      <View style={[styles.container, { backgroundColor: "#EEEEEE" }]}>
        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('scanning.scanBarcode')}</Text>
          <Text style={styles.cardSubtitle}>
            {t('scanning.scanning')}
          </Text>
          <View style={styles.barcodeContainer}>
            <MaterialCommunityIcons
              name="barcode-scan"
              size={140}
              color="#222"
            />
            <View style={styles.redLine} />
          </View>
          {barcode && (
            <Text style={{ marginTop: 20, color: "#003667", fontWeight: "bold" }}>
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

        {/* Scan Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={openCamera}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{t('scanning.scanAsset')}</Text>
        </TouchableOpacity>
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

      {/* Side Menu */}
      <SideMenu
        visible={menuVisible}
        onClose={closeMenu}
        onLogout={handleLogout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  appbarContainer: {
    backgroundColor: "#003667",
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    position: "relative",
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
  appbar: {
    backgroundColor: "#003667",
    elevation: 0,
    shadowOpacity: 0,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    position: "relative",
  },
  backButton: {
    padding: 12,
    marginLeft: 8,
    zIndex: 2,
  },
  centerTitleContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  downloadIcon: {
    marginLeft: 8,
  },
  appbarTitle: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    alignSelf: "center",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    // paddingTop: 32,
  },
  card: {
    width: "85%",
    height: "65%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    // paddingVertical: 32,
    // paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 32,
  },
  cardTitle: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 8,
    color: "#616161",
    textAlign: "center",
  },
  cardSubtitle: {
    color: "#7A7A7A",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 24,
    textAlign: "center",
    marginTop: 25,
  },
  barcodeContainer: {
    backgroundColor: "#FFFFFF",
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 75,
    position: "relative",
  },
  redLine: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "red",
    width: "100%",
    alignSelf: "center",
    transform: [{ translateY: -1 }],
  },
  button: {
    marginTop: 24,
    backgroundColor: "#003667",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 80,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  buttonDisabled: {
    backgroundColor: "#cccccc",
  },
  buttonText: {
    color: "#fff",
    fontWeight: '500',
    fontSize: 12,
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#003667",
    fontWeight: "500",
  },
});
