import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Appbar } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { API_CONFIG, getApiHeaders, API_ENDPOINTS } from "../../config/api";
import { authUtils } from "../../utils/auth";
import CustomAlert from "../../components/CustomAlert";
import SideMenu from "../../components/SideMenu";
import { useNavigation as useNavigationContext } from "../../context/NavigationContext";

export default function App() {
  const navigation = useNavigation();
  const { hasAccess } = useNavigationContext();
  const [showCamera, setShowCamera] = useState(false);
  const [barcode, setBarcode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [menuVisible, setMenuVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
    onCancel: () => {},
    confirmText: 'OK',
    cancelText: 'Cancel',
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
      confirmText: 'OK',
      cancelText: 'Cancel',
      showCancel,
    });
  };

  const handleLogout = async () => {
    showAlert(
      "Logout",
      "Are you sure you want to logout?",
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
          showAlert('Error', 'Failed to logout. Please try again.', 'error');
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
    if (!permission?.granted) {
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
          Alert.alert(
            "Asset Not Found",
            "No asset found with this serial number.",
            [{ text: "OK" }]
          );
          return;
        }
        if (response.status === 401) {
          Alert.alert(
            "Authentication Error",
            "Please check your authorization token.",
            [{ text: "OK" }]
          );
          return;
        }
        if (response.status === 500) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Server error details:', errorData);
          Alert.alert(
            "Server Error",
            "The server encountered an error. Please try again later.",
            [{ text: "OK" }]
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
      if (Array.isArray(data) && data.length > 0) {
        assetId = data[0].asset_id;
        console.log('Asset ID from array:', assetId);
      } else if (data && typeof data === 'object') {
        assetId = data.asset_id || data.id || data.assetId;
        console.log('Asset ID from object:', assetId);
      }
      
      if (assetId) {
        // Call API to get asset assignment data
        await getAssetAssignment(assetId);
      } else {
        Alert.alert(
          "Asset Not Found",
          "No asset found with this serial number.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error checking serial number:", error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to check serial number. Please try again.";
      
      if (error.message.includes("Network request failed")) {
        errorMessage = "Network connection failed. Please check:\n\n1. Your backend server is running on port 4000\n2. Your device is connected to the same network\n3. The IP address in config/api.js is correct";
      } else if (error.message.includes("timeout")) {
        errorMessage = "Request timed out. Please check your network connection.";
      } else if (error.message.includes("fetch")) {
        errorMessage = "Unable to connect to server. Please check if the backend is running.";
      }
      
      Alert.alert(
        "Network Error",
        errorMessage,
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  const getAssetAssignment = async (assetId) => {
    try {
      console.log(`Getting asset assignment for asset ID: ${assetId}`);
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
          Alert.alert(
            "No Assignment Found",
            "This asset is not assigned to any employee.",
            [{ text: "OK" }]
          );
          return;
        }
        if (response.status === 401) {
          Alert.alert(
            "Authentication Error",
            "Please check your authorization token.",
            [{ text: "OK" }]
          );
          return;
        }
        if (response.status === 500) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Server error details:', errorData);
          Alert.alert(
            "Server Error",
            "The server encountered an error. Please try again later.",
            [{ text: "OK" }]
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
          // Navigate to asset_2.js with the filtered asset assignment data
          navigation.navigate('AssetDetails', { 
            assetAssignment: filteredAssignments[0],
            barcode: barcode 
          });
        } else {
          // Check access level before allowing assignment
          if (hasAccess('ASSETASSIGNMENT', 'A')) {
            // Navigate to asset_3.js for unassigned assets or assets without matching criteria
            navigation.navigate('AssetAssignment', { 
              assetId: assetId,
              barcode: barcode 
            });
          } else {
            showAlert('Access Denied', 'You do not have permission to assign assets. You can only view asset details.', 'error');
          }
        }
      } else {
        // Check access level before allowing assignment
        if (hasAccess('ASSETASSIGNMENT', 'A')) {
          // Navigate to asset_3.js for unassigned assets
          navigation.navigate('AssetAssignment', { 
            assetId: assetId,
            barcode: barcode 
          });
        } else {
          showAlert('Access Denied', 'You do not have permission to assign assets. You can only view asset details.', 'error');
        }
      }
    } catch (error) {
      console.error("Error getting asset assignment:", error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to get asset assignment data. Please try again.";
      
      if (error.message.includes("Network request failed")) {
        errorMessage = "Network connection failed. Please check:\n\n1. Your backend server is running on port 4000\n2. Your device is connected to the same network\n3. The IP address in config/api.js is correct";
      } else if (error.message.includes("timeout")) {
        errorMessage = "Request timed out. Please check your network connection.";
      } else if (error.message.includes("fetch")) {
        errorMessage = "Unable to connect to server. Please check if the backend is running.";
      }
      
      Alert.alert(
        "Network Error",
        errorMessage,
        [{ text: "OK" }]
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
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{
          barcodeTypes: [
            "qr",
            "ean13",
            "ean8",
            "code39",
            "code128",
            "upc_a",
            "upc_e",
          ],
        }}
        onBarcodeScanned={handleBarcodeScanned}
      />
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
        <Text style={{ color: "#fff" }}>Point camera at barcode</Text>
      </View>
    </View>
  ) : (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#EEEEEE" }}>
      {/* AppBar */}
                      <Appbar.Header style={styles.appbar}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FEC200" />
          </TouchableOpacity>
          <View style={styles.centerTitleContainer}>
            <Text style={styles.appbarTitle}>Asset</Text>
          </View>
          {/* <Appbar.Action icon="logout" color="#FEC200" onPress={handleLogout} /> */}
        </Appbar.Header>

      {/* Main Content */}
      <View style={styles.container}>
        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Scan Barcode</Text>
          <Text style={styles.cardSubtitle}>
            Hold your device over a barcode to{"\n"}scan
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
              Barcode Value: {barcode}
            </Text>
          )}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#003667" />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          )}
        </View>

        {/* Scan Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={openCamera}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Scan Asset</Text>
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
