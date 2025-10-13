import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  Dimensions,
  Modal,
  ScrollView,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { Appbar } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import Dept_Asset_2 from "../dept_asset/dept_asset_2";
import { API_CONFIG, getApiHeaders, API_ENDPOINTS } from "../../config/api";
import { authUtils } from "../../utils/auth";
import CustomAlert from "../../components/CustomAlert";
import SideMenu from "../../components/SideMenu";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const { width, height } = Dimensions.get('window');

// Responsive design breakpoints
const BREAKPOINTS = {
  SMALL: 320,
  MEDIUM: 375,
  LARGE: 414,
  TABLET: 768,
  DESKTOP: 1024,
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
  const scaleFactor = width / BREAKPOINTS.MEDIUM;
  return Math.max(size * scaleFactor, size * 0.8);
};

const verticalScale = (size) => {
  const scaleFactor = height / 812;
  return Math.max(size * scaleFactor, size * 0.8);
};

const moderateScale = (size, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

// Responsive UI constants
const RESPONSIVE_CONSTANTS = {
  SPACING: {
    XS: scale(4),
    SM: scale(8),
    MD: scale(12),
    LG: scale(16),
    XL: scale(20),
    XXL: scale(24),
  },
  
  FONT_SIZES: {
    XS: moderateScale(10),
    SM: moderateScale(12),
    MD: moderateScale(14),
    LG: moderateScale(16),
    XL: moderateScale(18),
    XXL: moderateScale(20),
  },
  
  INPUT_HEIGHT: verticalScale(45),
  VALUE_INPUT_HEIGHT: verticalScale(36),
  BUTTON_HEIGHT: verticalScale(40),
  LABEL_WIDTH: scale(150),
  COLON_WIDTH: scale(10),
};

export default function DepartmentScreenMain() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [departmentId, setDepartmentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const [departmentInfo, setDepartmentInfo] = useState({
    name: "",
    assetCount: 0,
    employeeCount: 0,
  });
  const [employeeData, setEmployeeData] = useState([]);
  const [departments, setDepartments] = useState({});
  const [employees, setEmployees] = useState({});
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
  const [allDepartments, setAllDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingDepartments, setLoadingDepartments] = useState(false);

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
      t('common.logout'),
      t('common.confirmLogout'),
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
          showAlert(t('common.error'), t('common.failedToLogout'), 'error');
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

  // Fetch all departments using the existing departments data
  const fetchAllDepartments = async () => {
    setLoadingDepartments(true);
    try {
      // Use the existing departments data that's already fetched
      const departmentsList = Object.keys(departments).map(deptId => ({
        department_id: deptId,
        department_name: departments[deptId],
      }));

      // Sort by department ID
      departmentsList.sort((a, b) => {
        return a.department_id.toString().localeCompare(b.department_id.toString());
      });

      console.log(`Fetched ${departmentsList.length} departments:`, departmentsList.slice(0, 3));
      setAllDepartments(departmentsList);
      setFilteredDepartments(departmentsList);
    } catch (error) {
      console.error('Error fetching departments:', error);
      Alert.alert(
        t('common.error'), 
        `Failed to fetch departments: ${error.message}`
      );
    } finally {
      setLoadingDepartments(false);
    }
  };

  // Open filter modal
  const openFilterModal = () => {
    console.log('Opening filter modal');
    console.log('Current allDepartments length:', allDepartments.length);
    console.log('Current loadingDepartments:', loadingDepartments);
    setFilterModalVisible(true);
    setSearchType('');
    setSearchQuery('');
    if (allDepartments.length === 0) {
      console.log('Fetching departments because list is empty');
      fetchAllDepartments();
    } else {
      console.log('Using cached departments');
      setFilteredDepartments(allDepartments);
    }
  };

  // Close filter modal
  const closeFilterModal = () => {
    setFilterModalVisible(false);
    setSearchType('');
    setSearchQuery('');
    setFilteredDepartments(allDepartments);
  };

  // Handle search type selection
  const handleSearchTypeSelection = (type) => {
    setSearchType(type);
    setSearchQuery('');
    setFilteredDepartments(allDepartments);
  };

  // Filter departments based on search query
  const handleSearchQueryChange = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredDepartments(allDepartments);
      return;
    }

    const filtered = allDepartments.filter((dept) => {
      if (searchType === 'id') {
        return dept.department_id.toString().toUpperCase().includes(query.toUpperCase());
      } else if (searchType === 'name') {
        return dept.department_name.toUpperCase().includes(query.toUpperCase());
      }
      return true;
    });

    setFilteredDepartments(filtered);
  };

  // Handle department selection from filter
  const handleDepartmentSelection = (department) => {
    const selectedId = department.department_id;
    setDepartmentId(selectedId);
    closeFilterModal();
    // Automatically fetch department assignments for selected department
    fetchDepartmentAssignments(selectedId);
  };

  // Fetch departments data
  const fetchDepartments = async () => {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_DEPARTMENTS()}`;
      console.log("Fetching departments:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: await getApiHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Departments data received:", data);

      // Create a map of dept_id to department name
      const deptMap = {};
      data.forEach((dept) => {
        deptMap[dept.dept_id] = dept.text || dept.name || dept.dept_name;
      });

      setDepartments(deptMap);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  // Fetch employees data
  const fetchEmployees = async () => {
    try {
      // Get all departments first
      const deptUrl = `${
        API_CONFIG.BASE_URL
      }${API_ENDPOINTS.GET_DEPARTMENTS()}`;
      const deptResponse = await fetch(deptUrl, {
        method: "GET",
        headers: await getApiHeaders(),
      });

      if (!deptResponse.ok) {
        throw new Error(`HTTP error! status: ${deptResponse.status}`);
      }

      const departments = await deptResponse.json();

      // Fetch employees for each department
      const employeeMap = {};
      for (const dept of departments) {
        try {
          const empUrl = `${
            API_CONFIG.BASE_URL
          }${API_ENDPOINTS.GET_EMPLOYEES_BY_DEPARTMENT(dept.dept_id)}`;
          const empResponse = await fetch(empUrl, {
            method: "GET",
            headers: await getApiHeaders(),
          });

          if (empResponse.ok) {
            const empData = await empResponse.json();
            empData.forEach((emp) => {
              employeeMap[emp.employee_int_id] =
                emp.name || emp.full_name || emp.employee_name || "Unknown";
            });
          }
        } catch (error) {
          console.error(
            `Error fetching employees for department ${dept.dept_id}:`,
            error
          );
        }
      }

      setEmployees(employeeMap);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  // Fetch department assignments
  const fetchDepartmentAssignments = async (deptId) => {
    if (!deptId.trim()) {
      Alert.alert(t('common.error'), t('assets.pleaseEnterDepartmentId'));
      return;
    }

    setLoading(true);
    try {
      // Convert department ID to uppercase for case-insensitive search
      const normalizedDeptId = deptId.trim().toUpperCase();
      console.log(`Fetching assignments for department: ${normalizedDeptId}`);
      const url = `${API_CONFIG.BASE_URL}/api/asset-assignments/department/${normalizedDeptId}/assignments`;
      console.log("API URL:", url);

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        API_CONFIG.TIMEOUT
      );

      const response = await fetch(url, {
        method: "GET",
        headers: await getApiHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          Alert.alert(
            t('assets.noAssignmentsFound'),
            t('assets.noAssignmentsFoundForDepartment'),
            [{ text: t('common.ok') }]
          );
          setEmployeeData([]);
          setDepartmentInfo({ name: "", assetCount: 0, employeeCount: 0 });
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
      console.log("Department assignments data received:", data);

      // Extract asset count and employee count from API response
      let assetCount = 0;
      let employeeCount = 0;

      console.log("Processing department assignments for:", deptId);

      // Check if the response has summary data
      if (data && typeof data === "object" && !Array.isArray(data)) {
        // If response is an object with summary data
        assetCount =
          data.assetCount ||
          data.total_assets ||
          data.asset_count ||
          data.total_assignments ||
          0;
        employeeCount =
          data.employeeCount ||
          data.total_employees ||
          data.employee_count ||
          data.unique_employees ||
          0;

        // Process employee list if available
        const employeeList = data.employees || data.employee_list || [];
        if (Array.isArray(employeeList)) {
          console.log(
            "Processing employee list with",
            employeeList.length,
            "employees"
          );

          // Fetch asset count for each employee
          const processedEmployees = [];
          for (const emp of employeeList) {
            try {
              const employeeId =
                emp.employee_int_id || emp.employee_id || emp.id;
              console.log(`Fetching assets for employee: ${employeeId}`);

              const employeeAssetUrl = `${API_CONFIG.BASE_URL}/api/asset-assignments/employee/${employeeId}/active`;
              const employeeResponse = await fetch(employeeAssetUrl, {
                method: "GET",
                headers: await getApiHeaders(),
              });

              let assetCount = 0;
              if (employeeResponse.ok) {
                const employeeAssetData = await employeeResponse.json();
                console.log(
                  `Employee ${employeeId} asset data:`,
                  employeeAssetData
                );

                // Handle the employee asset response structure
                if (
                  employeeAssetData &&
                  employeeAssetData.data &&
                  Array.isArray(employeeAssetData.data)
                ) {
                  assetCount = employeeAssetData.data.length;
                } else if (
                  employeeAssetData &&
                  Array.isArray(employeeAssetData)
                ) {
                  assetCount = employeeAssetData.length;
                } else if (employeeAssetData && employeeAssetData.count) {
                  assetCount = employeeAssetData.count;
                }
              } else {
                console.log(`No assets found for employee ${employeeId}`);
              }

              processedEmployees.push({
                id: employeeId,
                name:
                  emp.employee_name ||
                  emp.name ||
                  emp.full_name ||
                  t('assets.unknownEmployee'),
                assets: assetCount,
              });

              console.log(
                `Employee ${employeeId} (${emp.employee_name}): ${assetCount} assets`
              );
            } catch (error) {
              console.error(
                `Error fetching assets for employee ${emp.employee_int_id}:`,
                error
              );
              processedEmployees.push({
                id: emp.employee_int_id || emp.employee_id || emp.id,
                name:
                  emp.employee_name ||
                  emp.name ||
                  emp.full_name ||
                  t('assets.unknownEmployee'),
                assets: 0,
              });
            }
          }

          // Sort by employee ID in ascending order
          const sortedEmployees = processedEmployees.sort((a, b) =>
            a.id.localeCompare(b.id)
          );

          console.log("Final processed employee list:", sortedEmployees);
          setEmployeeData(sortedEmployees);
        } else {
          setEmployeeData([]);
        }
      } else if (data && Array.isArray(data)) {
        // If response is an array of assignments, process them
        const employeeAssetMap = {};

        console.log(
          "Processing assignments array with",
          data.length,
          "assignments"
        );
        data.forEach((assignment, index) => {
          const employeeId =
            assignment.employee_int_id || assignment.employee_id;
          console.log(
            `Assignment ${index + 1}: Employee ${employeeId}, Asset ${
              assignment.asset_id
            }`
          );
          if (employeeId) {
            if (!employeeAssetMap[employeeId]) {
              employeeAssetMap[employeeId] = {
                id: employeeId,
                name: employees[employeeId] || t('assets.unknownEmployee'),
                assets: 0,
              };
            }
            employeeAssetMap[employeeId].assets += 1;
            assetCount += 1;
            console.log(
              `Updated ${employeeId}: ${employeeAssetMap[employeeId].assets} assets`
            );
          }
        });

        // Convert to array and sort by employee ID in ascending order
        const employeeList = Object.values(employeeAssetMap).sort((a, b) =>
          a.id.localeCompare(b.id)
        );

        console.log("Processed employee list with asset counts:", employeeList);
        setEmployeeData(employeeList);
        employeeCount = employeeList.length;
      } else {
        setEmployeeData([]);
      }

      setDepartmentInfo({
        name: departments[deptId] || deptId,
        assetCount: assetCount,
        employeeCount: employeeCount,
      });
    } catch (error) {
      console.error("Error fetching department assignments:", error);
      if (error.name === "AbortError") {
        Alert.alert(t('common.timeout'), t('assets.requestTimedOut'));
      } else {
        Alert.alert(
          t('common.error'),
          t('assets.failedToFetchDepartmentAssignments')
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Load departments and employees on component mount
  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
  }, []);

  return (
    <SafeAreaProvider>
      <View style={[styles.safeContainer, { paddingTop: insets.top }]}>
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
          {/* Centered Title */}
          <View style={styles.centerTitleContainer}>
            <Text style={styles.appbarTitle}>{t('assets.departmentMain')}</Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.assetInput}
              placeholder={t('assets.enterDepartmentId')}
              placeholderTextColor="#aaa"
              value={departmentId}
              onChangeText={(text) => setDepartmentId(text.toUpperCase())}
              onSubmitEditing={() => fetchDepartmentAssignments(departmentId)}
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
              onPress={() => fetchDepartmentAssignments(departmentId)}
            >
              <MaterialCommunityIcons
                name="magnify"
                size={22}
                color="#FEC200"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('employees.department')}</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput
              style={styles.valueInput}
              value={departmentInfo.name || ""}
              editable={false}
            />
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('assets.noOfAsset')}</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput
              style={styles.valueInput}
              value={departmentInfo.assetCount.toString()}
              editable={false}
            />
            <TouchableOpacity>
              <Text
                style={styles.viewText}
                onPress={() =>
                  navigation.navigate("Dept_Asset_2", {
                    departmentId: departmentId,
                  })
                }
              >
                {t('assets.view')}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('assets.noOfEmployee')}</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput
              style={styles.valueInput}
              value={departmentInfo.employeeCount.toString()}
              editable={false}
            />
            <TouchableOpacity>
              <Text
                style={styles.viewText}
                onPress={() =>
                  navigation.navigate("Dept_Asset_4", {
                    departmentId: departmentId,
                    employeeData: employeeData,
                  })
                }
              >
                {t('assets.view')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Table */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>
              {t('assets.employeeId')}
            </Text>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>
              {t('assets.employeeName')}
            </Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>
              {t('assets.noOfAssetsAssigned')}
            </Text>
          </View>
          <View style={styles.yellowLine} />

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#003667" />
              <Text style={styles.loadingText}>{t('assets.loadingDepartmentData')}</Text>
            </View>
          ) : employeeData.length > 0 ? (
            <FlatList
              data={employeeData}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <View
                  style={[
                    styles.tableRow,
                    { backgroundColor: index % 2 === 0 ? "#fff" : "#f0f4f8" },
                  ]}
                >
                  <Text style={[styles.tableCell, { flex: 1.2 }]}>
                    {item.id}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      {
                        color: "#003366",
                        // textDecorationLine: "underline",
                        textAlign: "center",
                        flex: 1.5,
                      },
                    ]}
                  >
                    {item.assets}
                  </Text>
                </View>
              )}
              ListFooterComponent={<View style={{ height: 120 }} />}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {departmentId
                  ? t('assets.noEmployeesFoundForDepartment')
                  : t('assets.enterDepartmentIdToViewEmployees')}
              </Text>
            </View>
          )}
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
              <Text style={styles.modalTitle}>Search Department</Text>
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
                  <Text style={styles.searchTypeButtonText}>Search by Department ID</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.searchTypeButton}
                  onPress={() => {
                    console.log('Selected search type: NAME');
                    handleSearchTypeSelection('name');
                  }}
                >
                  <MaterialCommunityIcons name="account-search" size={24} color="#003667" />
                  <Text style={styles.searchTypeButtonText}>Search by Department Name</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Department List */}
            {searchType ? (
              <View style={styles.employeeListContainer}>
                
                {/* Back Button */}
                <TouchableOpacity
                  style={styles.backToTypeButton}
                  onPress={() => {
                    console.log('Back to search type pressed');
                    setSearchType('');
                    setSearchQuery('');
                    setFilteredDepartments(allDepartments);
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
                    placeholder={searchType === 'id' ? 'Search by Department ID...' : 'Search by Department Name...'}
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

                {/* Department List */}
                {loadingDepartments ? (
                  <View style={styles.modalLoadingContainer}>
                    <ActivityIndicator size="large" color="#003667" />
                    <Text style={styles.modalLoadingText}>Loading departments...</Text>
                  </View>
                ) : filteredDepartments.length > 0 ? (
                  <FlatList
                    data={filteredDepartments}
                    keyExtractor={(item, index) => `${item.department_id}-${index}`}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.employeeItem}
                        onPress={() => {
                          console.log('Department selected:', item);
                          handleDepartmentSelection(item);
                        }}
                      >
                        <View style={styles.employeeItemContent}>
                          <Text style={styles.employeeItemId}>
                            {item.department_id}
                          </Text>
                          <Text style={styles.employeeItemName}>{item.department_name}</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color="#003667" />
                      </TouchableOpacity>
                    )}
                  />
                ) : (
                  <View style={styles.modalEmptyContainer}>
                    <MaterialCommunityIcons name="account-off-outline" size={48} color="#999" />
                    <Text style={styles.modalEmptyText}>No departments found</Text>
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
  safeContainer: {
    flex: 1,
    backgroundColor: "#003667",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#EEEEEE",
  },
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
        shadowColor: "#000",
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
    color: "#fff",
    fontWeight: "600",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    alignSelf: "center",
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
    backgroundColor: "#fff",
    borderRadius: scale(4),
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.MD,
    height: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
    borderWidth: 1,
    borderColor: "#ccc",
    textAlignVertical: "center",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
  },
  filterButton: {
    marginLeft: RESPONSIVE_CONSTANTS.SPACING.SM,
    backgroundColor: "#003667",
    height: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
    width: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
    borderRadius: scale(6),
    alignContent: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  qrButton: {
    marginLeft: RESPONSIVE_CONSTANTS.SPACING.SM,
    backgroundColor: "#003667",
    height: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
    width: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
    borderRadius: scale(6),
    alignContent: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  yellowLine: {
    height: 3,
    backgroundColor: "#FEC200",
    width: "100%",
  },
  label: {
    width: RESPONSIVE_CONSTANTS.LABEL_WIDTH,
    color: "#616161",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: "500",
  },
  colon: {
    width: RESPONSIVE_CONSTANTS.COLON_WIDTH,
    color: "#333",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    textAlign: "center",
    marginHorizontal: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  valueInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: scale(4),
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.MD,
    height: RESPONSIVE_CONSTANTS.VALUE_INPUT_HEIGHT,
    textAlignVertical: "center",
    color: "#616161",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    borderWidth: 1,
    borderColor: "#ccc",
    fontWeight: "400",
  },
  viewText: {
    color: "#003366",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    fontWeight: "400",
    marginRight: RESPONSIVE_CONSTANTS.SPACING.LG + scale(2),
    textDecorationLine: "underline",
    marginLeft: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  tableContainer: {
    margin: RESPONSIVE_CONSTANTS.SPACING.MD,
    borderRadius: scale(8),
    backgroundColor: "#fff",
    overflow: "hidden",
    flex: 1,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#003366",
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.SM,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  tableHeaderText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.SM,
    alignItems: "center",
  },
  tableCell: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    fontWeight: "500",
    color: "#333",
    textAlign: "center",
  },
  loadingContainer: {
    padding: RESPONSIVE_CONSTANTS.SPACING.XXL * 1.5,
    alignItems: "center",
  },
  loadingText: {
    marginTop: RESPONSIVE_CONSTANTS.SPACING.MD,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    color: "#666",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  emptyText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    color: "#666",
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

