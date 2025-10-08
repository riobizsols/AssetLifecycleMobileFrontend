import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Appbar } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Camera, useCameraPermission, useCameraDevice, useCodeScanner } from "react-native-vision-camera";
import { API_CONFIG, getApiHeaders, API_ENDPOINTS } from "../../config/api";
import CustomAlert from "../../components/CustomAlert";

export default function EmployeeAssetAssign() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { employeeId, employeeName } = route.params || {};
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
      console.log(`Checking serial number: ${serialNumber}`);
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.CHECK_SERIAL(serialNumber)}`;
      console.log('API URL:', url);
      console.log('API Headers:', getApiHeaders());
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getApiHeaders(),
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
      if (Array.isArray(data) && data.length > 0) {
        assetId = data[0].asset_id;
        console.log('Asset ID from array:', assetId);
      } else if (data && typeof data === 'object') {
        assetId = data.asset_id || data.id || data.assetId;
        console.log('Asset ID from object:', assetId);
      }
      
      if (assetId) {
        // Check if asset is already assigned
        await checkAssetAssignment(assetId, data);
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
  const checkAssetAssignment = async (assetId, assetData) => {
    try {
      console.log(`Checking asset assignment for asset ID: ${assetId}`);
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_ASSET_ASSIGNMENT(assetId)}`;
      console.log('API URL:', url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getApiHeaders(),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log('Asset assignment data received:');

      if (!response.ok) {
        if (response.status === 404) {
          // Asset is not assigned, navigate to assignment page
          navigation.navigate('EmployeeAssetAssignment', { 
            assetId: assetId,
            barcode: barcode,
            assetData: assetData
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
          // Asset is already assigned, navigate to details page
          navigation.navigate('EmployeeAssetDetails', { 
            assetAssignment: filteredAssignments[0],
            barcode: barcode,
            employeeId: employeeId,
            employeeName: employeeName
          });
        } else {
          // Asset is not assigned, navigate to assignment page
          navigation.navigate('EmployeeAssetAssignment', { 
            assetId: assetId,
            barcode: barcode,
            assetData: assetData,
            employeeId: employeeId,
            employeeName: employeeName
          });
        }
      } else {
        // Asset is not assigned, navigate to assignment page
        navigation.navigate('EmployeeAssetAssignment', { 
          assetId: assetId,
          barcode: barcode,
          assetData: assetData,
          employeeId: employeeId,
          employeeName: employeeName
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#EEEEEE" }}>
      {/* AppBar */}
      <Appbar.Header style={styles.appbar}>
        <Appbar.Action
          icon="arrow-left"
          color="#FEC200"
          onPress={() => navigation.goBack()}
        />
        <View style={styles.centerTitleContainer}>
          <Text style={styles.appbarTitle}>{t('assets.employeeAssetAssign')}</Text>
        </View>
      </Appbar.Header>

      {/* Main Content */}
      <View style={styles.container}>
        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('assets.assignAsset')}</Text>
          <Text style={styles.cardSubtitle}>
            {t('assets.selectAssetToAssignToEmployee')}
          </Text>
          <View style={styles.iconContainer}>
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

        {/* Scan QR Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={openCamera}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{t('scanning.scanAsset')}</Text>
        </TouchableOpacity>

        {/* Assign Button */}
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => {
            // Navigate to Select Asset page
            console.log("Assign asset button pressed");
            navigation.navigate('EmployeeAssetSelect', {
              employeeId: employeeId,
              employeeName: employeeName
            });
          }}
        >
          <Text style={styles.buttonText}>{t('assets.assignAsset')}</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appbar: {
    backgroundColor: "#003667",
    elevation: 0,
    shadowOpacity: 0,
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
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
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    alignSelf: "center",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "85%",
    height: "65%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
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
  iconContainer: {
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
  secondaryButton: {
    marginTop: 16,
    backgroundColor: "#FEC200",
  },
  buttonDisabled: {
    backgroundColor: "#cccccc",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "500",
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
