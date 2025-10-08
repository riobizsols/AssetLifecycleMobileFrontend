import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Linking,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import { Appbar } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import Asset_2 from "./emp_asset_2";
import RNFS from "react-native-fs";
import Share from "react-native-share";
import { API_CONFIG, getApiHeaders, API_ENDPOINTS } from "../../config/api";
import { authUtils } from "../../utils/auth";
import CustomAlert from "../../components/CustomAlert";
import SideMenu from "../../components/SideMenu";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export default function Asset_1() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [employeeId, setEmployeeId] = useState("");
  const [assetData, setAssetData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [employeeInfo, setEmployeeInfo] = useState({
    name: "",
    department: "",
    assetCount: 0
  });
  const insets = useSafeAreaInsets();
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

  // Fetch asset details by serial number
  const fetchAssetBySerial = async (serialNumber) => {
    if (!serialNumber) {
      Alert.alert(t('common.error'), t('assets.serialNumberRequired'));
      return;
    }

    setLoading(true);
    try {
      console.log(`Fetching asset details for serial: ${serialNumber}`);
      const url = `${API_CONFIG.BASE_URL}/api/assets/serial/${serialNumber}`;
      console.log('API URL:', url);
      
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Asset details received:', data);
      
      // Handle the API response structure - it returns an array
      let assetData = data;
      if (Array.isArray(data) && data.length > 0) {
        assetData = data[0]; // Get the first object from the array
      }
      
      // Navigate to employee asset details page with the asset data
      navigation.navigate('EmployeeAssetDetails', {
        assetData: assetData,
        serialNumber: serialNumber,
        employeeId: employeeId,
        employeeName: employeeInfo.name
      });
      
    } catch (error) {
      console.error("Error fetching asset details:", error);
      if (error.name === 'AbortError') {
        Alert.alert(t('assets.timeout'), t('assets.requestTimedOut'));
      } else {
        Alert.alert(t('common.error'), t('assets.failedToFetchAssetDetails'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch employee active assets
  const fetchEmployeeAssets = async (empId) => {
    if (!empId.trim()) {
      Alert.alert(t('common.error'), t('assets.pleaseEnterEmployeeId'));
      return;
    }

    setLoading(true);
    try {
      console.log(`Fetching assets for employee: ${empId}`);
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_EMPLOYEE_ACTIVE_ASSETS(empId)}`;
      console.log('API URL:', url);
      
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
            t('assets.noAssetsFound'),
            t('assets.noActiveAssetsFound'),
            [{ text: t('common.ok') }]
          );
          setAssetData([]);
          setEmployeeInfo({ name: "", department: "", assetCount: 0 });
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Employee assets data received:', data);
      
      // Handle the API response structure
      let transformedAssets = [];
      let employeeName = "Unknown";
      let departmentName = "Unknown";
      
      if (data.data && Array.isArray(data.data)) {
        // Fetch asset details for each assignment
        const assetPromises = data.data.map(async (assignment) => {
          try {
            const assetUrl = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_ASSET_DETAILS(assignment.asset_id)}`;
            const assetResponse = await fetch(assetUrl, {
              method: 'GET',
              headers: getApiHeaders(),
            });
            
            if (assetResponse.ok) {
              const assetData = await assetResponse.json();
              return {
                type: assetData.description || `Asset ${assignment.asset_id}`,
                serial: assetData.serial_number || `SN-${assignment.asset_id}`,
                remarks: assignment.remarks || "Active assignment",
                assetId: assignment.asset_id,
                assignmentId: assignment.asset_assign_id
              };
            } else {
              // Fallback if asset details not available
              return {
                type: `Asset ${assignment.asset_id}`,
                serial: `SN-${assignment.asset_id}`,
                remarks: assignment.remarks || "Active assignment",
                assetId: assignment.asset_id,
                assignmentId: assignment.asset_assign_id
              };
            }
          } catch (error) {
            console.error(`Error fetching asset details for ${assignment.asset_id}:`, error);
            // Fallback if asset details fetch fails
            return {
              type: `Asset ${assignment.asset_id}`,
              serial: `SN-${assignment.asset_id}`,
              remarks: assignment.remarks || "Active assignment",
              assetId: assignment.asset_id,
              assignmentId: assignment.asset_assign_id
            };
          }
        });
        
        // Wait for all asset details to be fetched
        transformedAssets = await Promise.all(assetPromises);
      }
      
      // Extract employee and department info
      if (data.employee) {
        employeeName = data.employee.employee_name || "Unknown";
      }
      if (data.department) {
        departmentName = data.department.department_name || "Unknown";
      }
      
      setAssetData(transformedAssets);
      setEmployeeInfo({
        name: employeeName,
        department: departmentName,
        assetCount: transformedAssets.length
      });
      
      // Show success message if assets found
      if (transformedAssets.length > 0) {
        Alert.alert(
          t('common.success'),
          `${t('assets.foundActiveAssets')} ${employeeName}`,
          [{ text: t('common.ok') }]
        );
      }
      
    } catch (error) {
      console.error("Error fetching employee assets:", error);
      
      let errorMessage = t('assets.failedToFetchAssetDetails');
      
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
    } finally {
      setLoading(false);
    }
  };

  // Convert assetData to CSV string
  const assetDataToCSV = () => {
    const header = [t('assets.assetName'), t('assets.serialNo'), t('assets.remarks')];
    const rows = assetData.map((item) => [
      item.type,
      item.serial,
      item.remarks,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");
    return csv;
  };



  // Download handler
  const handleDownload = async () => {
    if (assetData.length === 0) {
      Alert.alert(t('assets.noData'), t('assets.noAssetsToDownload'));
      return;
    }
    
    console.log("Download icon pressed");
    try {
      const csv = assetDataToCSV();
      const fileName = `employee_${employeeId}_assets.csv`;
      const fileUri = RNFS.DocumentDirectoryPath + '/' + fileName;
      await RNFS.writeFile(fileUri, csv, 'utf8');
      await Share.open({
        url: fileUri,
        type: "text/csv",
        title: t('assets.shareEmployeeAssetCSV'),
        UTI: "public.comma-separated-values-text",
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      Alert.alert(t('common.error'), t('assets.errorExportingCSV') + ": " + error.message);
    }
  };

  return (
    <SafeAreaProvider>
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
            <View style={styles.titleRow}>
              <Text style={styles.appbarTitle}>{t('assets.employeeAsset')}</Text>
            </View>
            <TouchableOpacity
              onPress={handleDownload}
              style={styles.downloadIcon}
              disabled={assetData.length === 0}
            >
              <MaterialCommunityIcons 
                name="download" 
                size={22} 
                color={assetData.length === 0 ? "#666" : "#FEC200"} 
              />
            </TouchableOpacity>
          </View>

        {/* Form */}
        <View style={styles.contentContainer}>
          <View style={styles.formContainer}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.assetInput}
                placeholder={t('assets.enterEmployeeId')}
                placeholderTextColor="#B6B7B8"
                value={employeeId}
                onChangeText={setEmployeeId}
                onSubmitEditing={() => fetchEmployeeAssets(employeeId)}
              />
              <TouchableOpacity 
                style={styles.qrButton}
                onPress={() => fetchEmployeeAssets(employeeId)}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FEC200" />
                ) : (
                  <MaterialCommunityIcons
                    name="magnify"
                    size={22}
                    color="#FEC200"
                  />
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('employees.employeeName')}</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{employeeInfo.name || t('employees.employeeName')}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('employees.department')}</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{employeeInfo.department || t('employees.department')}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('assets.numberOfAssets')}</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{employeeInfo.assetCount || "0"}</Text>
            </View>
          </View>

          {/* Table */}
          <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>
              {t('assets.asset')}
            </Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>{t('assets.serialNo')}</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>{t('assets.remarks')}</Text>
          </View>
          <View style={styles.yellowLine} />
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#003667" />
              <Text style={styles.loadingText}>{t('assets.loadingEmployeeAssets')}</Text>
            </View>
          ) : assetData.length > 0 ? (
            <FlatList
              data={assetData}
              keyExtractor={(item, index) => `${item.type}-${index}`}
              renderItem={({ item, index }) => (
                <View
                  style={[
                    styles.tableRow,
                    { backgroundColor: index % 2 === 0 ? "#fff" : "#f0f4f8" },
                  ]}
                >
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>{item.type}</Text>

                  <TouchableOpacity
                    style={{ flex: 1.5 }}
                    onPress={() => fetchAssetBySerial(item.serial)}
                  >
                    <Text
                      style={[
                        styles.tableCell,
                        {
                          color: "#003667",
                          textDecorationLine: "underline",
                        },
                      ]}
                    >
                      {item.serial}
                    </Text>
                  </TouchableOpacity>

                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {item.remarks}
                  </Text>
                </View>
              )}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {employeeId ? t('assets.noAssetsFoundForEmployee') : t('assets.enterEmployeeIdToViewAssets')}
              </Text>
            </View>
          )}
        </View>
        
                {/* Show History Link and Assign Asset Button */}
        {employeeId && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.historyButton}
              onPress={() => {
                console.log('History link pressed');
                console.log('Employee ID:', employeeId);
                console.log('Employee Name:', employeeInfo.name);
                
                if (!employeeId || !employeeId.trim()) {
                  Alert.alert(
                    t('assets.noEmployee'), 
                    t('assets.pleaseEnterEmployeeIdFirst'),
                    [{ text: t('common.ok') }]
                  );
                  return;
                }
                
                // Navigate to history screen
                navigation.navigate('EmployeeAssetHistory', {
                  employeeId: employeeId.trim(),
                  employeeName: employeeInfo.name || employeeId
                });
              }}
              disabled={loading}
            >
              <Text style={styles.historyLinkText}>
                {loading ? t('assets.loading') : t('assets.viewHistory')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.assignAssetButton}
              onPress={() => {
                console.log('Assign Asset button pressed');
                console.log('Employee ID:', employeeId);
                
                if (!employeeId) {
                  Alert.alert(t('assets.noEmployee'), t('assets.pleaseEnterEmployeeIdFirst'));
                  return;
                }
                
                // Navigate to asset assignment screen
                navigation.navigate('EmployeeAssetAssign', {
                  employeeId: employeeId,
                  employeeName: employeeInfo.name
                });
              }}
              disabled={loading}
            >
              <Text style={styles.assignAssetButtonText}>
                {t('assets.assignAsset')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
    </SafeAreaProvider>
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
    marginRight: 10,
  },
  appbarTitle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    alignSelf: "center",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#EEEEEE",
  },
  formContainer: {
    backgroundColor: "#EEEEEE",
    margin: 0,
    borderRadius: 8,
    padding: 16,
    marginBottom: 0,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    // height :"20%"
  },
  assetInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
    paddingHorizontal: 10,
    height: 45,
    borderWidth: 1,
    borderColor: "#ccc",
    // textAlign: 'center',           // Center text horizontally
    textAlignVertical: "center", // Center text vertically (mainly for Android)
    paddingVertical: 0,
  },
  qrButton: {
    marginLeft: 8,
    backgroundColor: "#003667",
    height: 45,
    width: 40,
    alignContent: "center",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,

    // padding: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    width: 150,
    color: "#616161",
    fontSize: 14,
    fontWeight: "500",
  },
  colon: {
    width: 10,
    color: "#616161",
    fontSize: 14,
    textAlign: "center",
    marginRight: 10,
  },
  value: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 4,
    paddingHorizontal: 10,
    height: 35,
    // width: "10%",
    // marginRight: 60,
    textAlignVertical: "center",
    color: "#616161",
    fontSize: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    fontWeight: 400,
  },
  tableContainer: {
    flex: 1,
    margin: 10,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#003366",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 13,
  },
  yellowLine: {
    height: 3,
    backgroundColor: "#FEC200",
    width: "100%",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  tableCell: {
    fontSize: 12,
    color: "#616161",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    color: "#003667",
    fontWeight: "500",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#616161",
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  historyButton: {
    flex: 1,
    alignItems: "center",
    marginRight: 8,
  },
  assignAssetButton: {
    flex: 1,
    backgroundColor: "#003667",
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    marginLeft: 8,
  },
  historyLinkText: {
    color: "#003667",
    fontWeight: "500",
    fontSize: 14,
    textDecorationLine: "underline",
    textAlign: "center",
  },
  assignAssetButtonText: {
    color: "#FFFFFF",
    fontWeight: "500",
    fontSize: 14,
    textAlign: "center",
  },
});
