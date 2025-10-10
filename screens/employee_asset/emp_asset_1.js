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
  Dimensions,
  Modal,
  ScrollView,
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
    XXL: moderateScale(20),
  },
  
  // Responsive dimensions
  INPUT_HEIGHT: verticalScale(45),
  BUTTON_HEIGHT: verticalScale(40),
  LABEL_WIDTH: scale(150),
  COLON_WIDTH: scale(10),
  
  // Responsive layout
  getFormRowLayout: () => {
    if (DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet') {
      return {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: scale(8),
      };
    }
    return {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: scale(8),
    };
  },
};

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

  // Filter modal states
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [searchType, setSearchType] = useState(''); // 'id' or 'name'
  const [allEmployees, setAllEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingEmployees, setLoadingEmployees] = useState(false);

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

  // Fetch all employees using the /api/employees endpoint
  const fetchAllEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_EMPLOYEES()}`;
      console.log('Fetching all employees from:', url);
      console.log('API Headers:', getApiHeaders());
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getApiHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Raw API response:', JSON.stringify(data, null, 2));

      // Handle different response structures
      let employeeArray = data;
      if (!Array.isArray(data)) {
        employeeArray = data.data || data.employees || data.results || [];
      }

      console.log('Employee array length:', employeeArray.length);

      // Transform the data to ensure consistent structure
      const employeeList = employeeArray.map((emp) => ({
        employee_id: emp.employee_id || emp.emp_id,
        employee_int_id: emp.employee_int_id || emp.emp_int_id,
        employee_name: emp.employee_name || emp.name || emp.full_name || 'Unknown',
        department_name: emp.department_name || emp.dept_name || emp.department || 'Unknown',
        department_id: emp.department_id || emp.dept_id,
      }));

      // Sort by employee ID
      employeeList.sort((a, b) => {
        const idA = a.employee_id || a.employee_int_id || '';
        const idB = b.employee_id || b.employee_int_id || '';
        return idA.toString().localeCompare(idB.toString());
      });

      console.log(`Successfully processed ${employeeList.length} employees:`, employeeList.slice(0, 3));
      setAllEmployees(employeeList);
      setFilteredEmployees(employeeList);
    } catch (error) {
      console.error('Error fetching all employees:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      if (error.name === 'AbortError') {
        Alert.alert(t('common.timeout'), t('assets.requestTimedOut'));
      } else {
        Alert.alert(
          t('common.error'), 
          `Failed to fetch employees: ${error.message}`
        );
      }
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Open filter modal
  const openFilterModal = () => {
    console.log('Opening filter modal');
    console.log('Current allEmployees length:', allEmployees.length);
    console.log('Current loadingEmployees:', loadingEmployees);
    setFilterModalVisible(true);
    setSearchType('');
    setSearchQuery('');
    if (allEmployees.length === 0) {
      console.log('Fetching employees because list is empty');
      fetchAllEmployees();
    } else {
      console.log('Using cached employees');
      setFilteredEmployees(allEmployees);
    }
  };

  // Close filter modal
  const closeFilterModal = () => {
    setFilterModalVisible(false);
    setSearchType('');
    setSearchQuery('');
    setFilteredEmployees(allEmployees);
  };

  // Handle search type selection
  const handleSearchTypeSelection = (type) => {
    setSearchType(type);
    setSearchQuery('');
    setFilteredEmployees(allEmployees);
  };

  // Filter employees based on search query
  const handleSearchQueryChange = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredEmployees(allEmployees);
      return;
    }

    const filtered = allEmployees.filter((emp) => {
      if (searchType === 'id') {
        const empId = emp.employee_id || emp.employee_int_id || '';
        return empId.toString().toUpperCase().includes(query.toUpperCase());
      } else if (searchType === 'name') {
        return emp.employee_name.toUpperCase().includes(query.toUpperCase());
      }
      return true;
    });

    setFilteredEmployees(filtered);
  };

  // Handle employee selection from filter
  const handleEmployeeSelection = (employee) => {
    const selectedId = employee.employee_id || employee.employee_int_id;
    setEmployeeId(selectedId);
    closeFilterModal();
    // Automatically fetch assets for selected employee
    fetchEmployeeAssets(selectedId);
  };

  // Fetch asset details by serial number
  const fetchAssetBySerial = async (serialNumber) => {
    if (!serialNumber) {
      Alert.alert(t('common.error'), t('assets.serialNumberRequired'));
      return;
    }

    setLoading(true);
    try {
      // Convert serial number to uppercase for case-insensitive search
      const normalizedSerial = serialNumber.trim().toUpperCase();
      console.log(`Fetching asset details for serial: ${normalizedSerial}`);
      const url = `${API_CONFIG.BASE_URL}/api/assets/serial/${normalizedSerial}`;
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
      // Convert employee ID to uppercase for case-insensitive search
      const normalizedEmpId = empId.trim().toUpperCase();
      console.log(`Fetching assets for employee: ${normalizedEmpId}`);
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_EMPLOYEE_ACTIVE_ASSETS(normalizedEmpId)}`;
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
                onChangeText={(text) => setEmployeeId(text.toUpperCase())}
                onSubmitEditing={() => fetchEmployeeAssets(employeeId)}
                autoCapitalize="characters"
              />
              <TouchableOpacity 
                style={styles.filterButton}
                onPress={openFilterModal}
                disabled={loading}
              >
                <MaterialCommunityIcons
                  name="filter"
                  size={22}
                  color="#FEC200"
                />
              </TouchableOpacity>
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
              <TextInput 
                style={styles.value} 
                value={employeeInfo.name || t('employees.employeeName')} 
                editable={false}
                placeholder={t('employees.employeeName')}
                placeholderTextColor="#B6B7B8"
              />
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('employees.department')}</Text>
              <Text style={styles.colon}>:</Text>
              <TextInput 
                style={styles.value} 
                value={employeeInfo.department || t('employees.department')} 
                editable={false}
                placeholder={t('employees.department')}
                placeholderTextColor="#B6B7B8"
              />
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>No of Assets</Text>
              <Text style={styles.colon}>:</Text>
              <TextInput 
                style={styles.value} 
                value={employeeInfo.assetCount ? employeeInfo.assetCount.toString() : "0"} 
                editable={false}
                placeholder="0"
                placeholderTextColor="#B6B7B8"
              />
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
                {employeeId ? 'No Employee found' : t('assets.enterEmployeeIdToViewAssets')}
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

        {/* Filter Modal */}
        <Modal
          visible={filterModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={closeFilterModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Search Employee</Text>
                <TouchableOpacity onPress={closeFilterModal} style={styles.closeButton}>
                  <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Search Type Selection */}
              {!searchType ? (
                <View style={styles.searchTypeContainer}>
                  <Text style={styles.searchTypeTitle}>Select Search Type:</Text>
                  
                  <TouchableOpacity
                    style={styles.searchTypeButton}
                    onPress={() => {
                      console.log('Selected search type: ID');
                      handleSearchTypeSelection('id');
                    }}
                  >
                    <MaterialCommunityIcons name="card-account-details" size={24} color="#003667" />
                    <Text style={styles.searchTypeButtonText}>Search by Employee ID</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.searchTypeButton}
                    onPress={() => {
                      console.log('Selected search type: NAME');
                      handleSearchTypeSelection('name');
                    }}
                  >
                    <MaterialCommunityIcons name="account-search" size={24} color="#003667" />
                    <Text style={styles.searchTypeButtonText}>Search by Employee Name</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Employee List */}
              {searchType ? (
                <View style={styles.employeeListContainer}>
                  
                  {/* Back Button */}
                  <TouchableOpacity
                    style={styles.backToTypeButton}
                    onPress={() => {
                      console.log('Back to search type pressed');
                      setSearchType('');
                      setSearchQuery('');
                      setFilteredEmployees(allEmployees);
                    }}
                  >
                    <MaterialCommunityIcons name="arrow-left" size={20} color="#003667" />
                    <Text style={styles.backToTypeButtonText}>Back to Search Type</Text>
                  </TouchableOpacity>

                  {/* Search Input */}
                  <View style={styles.modalSearchContainer}>
                    <MaterialCommunityIcons name="magnify" size={20} color="#666" />
                    <TextInput
                      style={styles.modalSearchInput}
                      placeholder={searchType === 'id' ? 'Search by Employee ID...' : 'Search by Employee Name...'}
                      placeholderTextColor="#999"
                      value={searchQuery}
                      onChangeText={handleSearchQueryChange}
                      autoCapitalize={searchType === 'id' ? 'characters' : 'words'}
                    />
                    {searchQuery !== '' && (
                      <TouchableOpacity onPress={() => handleSearchQueryChange('')}>
                        <MaterialCommunityIcons name="close-circle" size={20} color="#999" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Employee List */}
                  {loadingEmployees ? (
                    <View style={styles.modalLoadingContainer}>
                      <ActivityIndicator size="large" color="#003667" />
                      <Text style={styles.modalLoadingText}>Loading employees...</Text>
                    </View>
                  ) : filteredEmployees.length > 0 ? (
                    <FlatList
                      data={filteredEmployees}
                      keyExtractor={(item, index) => `${item.employee_id || item.employee_int_id}-${index}`}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.employeeItem}
                          onPress={() => {
                            console.log('Employee selected:', item);
                            handleEmployeeSelection(item);
                          }}
                        >
                          <View style={styles.employeeItemContent}>
                            <Text style={styles.employeeItemId}>
                              {item.employee_id || item.employee_int_id}
                            </Text>
                            <Text style={styles.employeeItemName}>{item.employee_name}</Text>
                            <Text style={styles.employeeItemDept}>{item.department_name}</Text>
                          </View>
                          <MaterialCommunityIcons name="chevron-right" size={24} color="#003667" />
                        </TouchableOpacity>
                      )}
                    />
                  ) : (
                    <View style={styles.modalEmptyContainer}>
                      <MaterialCommunityIcons name="account-off-outline" size={48} color="#999" />
                      <Text style={styles.modalEmptyText}>No employees found</Text>
                    </View>
                  )}
                </View>
              ) : null}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appbarContainer: {
    backgroundColor: "#003667",
    height: verticalScale(56),
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
    height: verticalScale(56),
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  downloadIcon: {
    marginRight: RESPONSIVE_CONSTANTS.SPACING.MD,
    padding: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  appbarTitle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    alignSelf: "center",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#EEEEEE",
  },
  formContainer: {
    backgroundColor: "#EEEEEE",
    margin: 0,
    borderRadius: scale(8),
    padding: RESPONSIVE_CONSTANTS.SPACING.LG,
    marginBottom: 0,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  assetInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: scale(4),
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.MD,
    height: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
    borderWidth: 1,
    borderColor: "#ccc",
    textAlignVertical: "center",
    paddingVertical: 0,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
  },
  filterButton: {
    marginLeft: RESPONSIVE_CONSTANTS.SPACING.SM,
    backgroundColor: "#003667",
    height: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
    width: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
    alignContent: "center",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: scale(6),
  },
  qrButton: {
    marginLeft: RESPONSIVE_CONSTANTS.SPACING.SM,
    backgroundColor: "#003667",
    height: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
    width: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
    alignContent: "center",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: scale(6),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  label: {
    width: RESPONSIVE_CONSTANTS.LABEL_WIDTH,
    color: "#616161",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: "500",
  },
  colon: {
    width: RESPONSIVE_CONSTANTS.COLON_WIDTH,
    color: "#616161",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    textAlign: "center",
    marginRight: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  value: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: scale(4),
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.MD,
    height: verticalScale(35),
    textAlignVertical: "center",
    color: "#616161",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    borderWidth: 1,
    borderColor: "#ccc",
    fontWeight: "400",
  },
  tableContainer: {
    flex: 1,
    margin: RESPONSIVE_CONSTANTS.SPACING.MD,
    borderRadius: scale(8),
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#003366",
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  tableHeaderText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
  },
  yellowLine: {
    height: 3,
    backgroundColor: "#FEC200",
    width: "100%",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.SM,
    alignItems: "center",
  },
  tableCell: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    color: "#616161",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.XXL * 1.5,
  },
  loadingText: {
    marginTop: RESPONSIVE_CONSTANTS.SPACING.MD,
    color: "#003667",
    fontWeight: "500",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.XXL * 1.5,
  },
  emptyText: {
    color: "#616161",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    textAlign: "center",
    fontStyle: "italic",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    backgroundColor: "#EEEEEE",
  },
  historyButton: {
    flex: 1,
    alignItems: "center",
    marginRight: RESPONSIVE_CONSTANTS.SPACING.SM,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  assignAssetButton: {
    flex: 1,
    backgroundColor: "#003667",
    borderRadius: scale(6),
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    alignItems: "center",
    marginLeft: RESPONSIVE_CONSTANTS.SPACING.SM,
    minHeight: RESPONSIVE_CONSTANTS.BUTTON_HEIGHT,
    justifyContent: "center",
  },
  historyLinkText: {
    color: "#003667",
    fontWeight: "500",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    textDecorationLine: "underline",
    textAlign: "center",
  },
  assignAssetButtonText: {
    color: "#FFFFFF",
    fontWeight: "500",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    textAlign: "center",
  },
  
  // Filter Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(12),
    width: '90%',
    maxHeight: '85%',
    minHeight: 400,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: RESPONSIVE_CONSTANTS.SPACING.LG,
    backgroundColor: '#003667',
    borderBottomWidth: 1,
    borderBottomColor: '#FEC200',
  },
  modalTitle: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.XL,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  searchTypeContainer: {
    padding: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  searchTypeTitle: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    fontWeight: '600',
    color: '#003667',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.LG,
    textAlign: 'center',
  },
  searchTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: RESPONSIVE_CONSTANTS.SPACING.LG,
    borderRadius: scale(8),
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
    borderWidth: 2,
    borderColor: '#003667',
  },
  searchTypeButtonText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: '500',
    color: '#003667',
    marginLeft: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  employeeListContainer: {
    flex: 1,
    padding: RESPONSIVE_CONSTANTS.SPACING.LG,
    minHeight: 300,
  },
  backToTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  backToTypeButtonText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    color: '#003667',
    marginLeft: RESPONSIVE_CONSTANTS.SPACING.SM,
    fontWeight: '500',
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: scale(8),
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.MD,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalSearchInput: {
    flex: 1,
    height: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#333',
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  employeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: RESPONSIVE_CONSTANTS.SPACING.MD,
    backgroundColor: '#F9F9F9',
    borderRadius: scale(8),
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.SM,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  employeeItemContent: {
    flex: 1,
  },
  employeeItemId: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: '600',
    color: '#003667',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XS,
  },
  employeeItemName: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    color: '#333',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XS,
  },
  employeeItemDept: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.XS,
    color: '#666',
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.XXL,
  },
  modalLoadingText: {
    marginTop: RESPONSIVE_CONSTANTS.SPACING.MD,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#666',
  },
  modalEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.XXL,
  },
  modalEmptyText: {
    marginTop: RESPONSIVE_CONSTANTS.SPACING.MD,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#999',
  },
});
