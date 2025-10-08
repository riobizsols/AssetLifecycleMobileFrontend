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

  // Fetch departments data
  const fetchDepartments = async () => {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_DEPARTMENTS()}`;
      console.log("Fetching departments:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: getApiHeaders(),
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
        headers: getApiHeaders(),
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
            headers: getApiHeaders(),
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
      console.log(`Fetching assignments for department: ${deptId}`);
      const url = `${API_CONFIG.BASE_URL}/api/asset-assignments/department/${deptId}/assignments`;
      console.log("API URL:", url);

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        API_CONFIG.TIMEOUT
      );

      const response = await fetch(url, {
        method: "GET",
        headers: getApiHeaders(),
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
                headers: getApiHeaders(),
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
          {/* Centered Title */}
          <View style={styles.centerTitleContainer}>
            <Text style={styles.appbarTitle}>{t('assets.departmentMain')}</Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.assetInput}
              placeholder={t('assets.enterDepartmentId')}
              placeholderTextColor="#aaa"
              value={departmentId}
              onChangeText={setDepartmentId}
              onSubmitEditing={() => fetchDepartmentAssignments(departmentId)}
            />
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
    height: 56,
    flexDirection: "row",
    alignItems: "center",
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
  appbarTitle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    alignSelf: "center",
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
  },
  assetInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 4,
    paddingHorizontal: 10,
    height: 45,
    borderWidth: 1,
    borderColor: "#ccc",
    // textAlign: 'center',
    textAlignVertical: "center",
  },
  qrButton: {
    marginLeft: 8,
    backgroundColor: "#003667",
    height: 45,
    width: "10%",
    borderRadius: 6,
    alignContent: "center",
    alignItems: "center",
    justifyContent: "center",
    // padding: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  yellowLine: {
    height: 3,
    backgroundColor: "#FEC200",
    width: "100%",
  },
  label: {
    width: 150,
    color: "#616161",
    fontSize: 14,
    fontWeight: "500",
  },
  colon: {
    width: 10,
    color: "#333",
    fontSize: 14,
    textAlign: "center",
    marginHorizontal: 10,
  },
  valueInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 4,
    paddingHorizontal: 10,
    height: 36,
    // marginRight: 60,
    textAlignVertical: "center",
    color: "#616161",
    fontSize: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    fontWeight: 400,
  },
  viewText: {
    color: "#003366",
    fontSize: 12,
    fontWeight: 400,
    marginRight: 18,
    textDecorationLine: "underline",
    marginLeft: 10,
  },
  tableContainer: {
    margin: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
    flex: 1,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#003366",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 13,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  tableCell: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
    textAlign: "center",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    // padding: 40,
    alignItems: "center",
    justifyContent: "center",
    // alignContent: "center",
    flex: 1,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
