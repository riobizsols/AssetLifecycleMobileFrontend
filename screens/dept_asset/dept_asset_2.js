import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Appbar } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { API_CONFIG, getApiHeaders, API_ENDPOINTS } from "../../config/api";

export default function DepartmentAssetsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { departmentId } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [assetData, setAssetData] = useState([]);
  const [departmentInfo, setDepartmentInfo] = useState({
    name: "",
    assetCount: 0
  });
  const [employees, setEmployees] = useState({});

  // Fetch employees data for department
  const fetchEmployees = async () => {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_DEPARTMENTS()}`;
      const response = await fetch(url, {
        method: "GET",
        headers: getApiHeaders(),
      });

      if (response.ok) {
        const departments = await response.json();
        
        // Fetch employees for each department
        const employeeMap = {};
        for (const dept of departments) {
          try {
            const empUrl = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_EMPLOYEES_BY_DEPARTMENT(dept.dept_id)}`;
            const empResponse = await fetch(empUrl, {
              method: "GET",
              headers: getApiHeaders(),
            });

            if (empResponse.ok) {
              const empData = await empResponse.json();
              empData.forEach(emp => {
                employeeMap[emp.employee_int_id] = emp.employee_name || emp.name || emp.full_name || t('assets.unknownEmployee');
              });
            }
          } catch (error) {
            console.error(`Error fetching employees for department ${dept.dept_id}:`, error);
          }
        }
        
        setEmployees(employeeMap);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  // Fetch department assets
  const fetchDepartmentAssets = async (deptId) => {
    if (!deptId) {
      Alert.alert(t('common.error'), t('assets.departmentIdRequired'));
      return;
    }

    setLoading(true);
    try {
      console.log(`Fetching assets for department: ${deptId}`);
      const url = `${API_CONFIG.BASE_URL}/api/asset-assignments/department/${deptId}/assignments`;
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
            t('assets.noAssetsFoundForDepartmentMessage'),
            [{ text: t('common.ok') }]
          );
          setAssetData([]);
          setDepartmentInfo({ name: "", assetCount: 0 });
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
      console.log('Department assets data received:', data);
      
      // Process the assignment data to get asset details
      const processedAssets = [];
      
      // Handle the API response structure with assignedAssets array
      if (data && data.assignedAssets && Array.isArray(data.assignedAssets)) {
        console.log(`Processing ${data.assignedAssets.length} assigned assets`);
        
        for (const assignment of data.assignedAssets) {
          console.log(`Processing asset: ${assignment.asset_name} (${assignment.serial_number})`);
          
          // Get employee name from the employees array if available
          let employeeName = t('assets.unknownEmployee');
          if (data.employees && Array.isArray(data.employees)) {
            const employee = data.employees.find(emp => emp.emp_int_id === assignment.employee_int_id);
            if (employee) {
              employeeName = employee.employee_name;
            }
          }
          
          processedAssets.push({
            type: assignment.asset_name || assignment.asset_type_name || `${t('assets.asset')} ${assignment.asset_id}`,
            serial: assignment.serial_number || `SN-${assignment.asset_id}`,
            assigned: employeeName,
            assetId: assignment.asset_id,
            assignmentId: assignment.asset_assign_id,
            // Pass the complete assignment data for asset details
            assignmentData: assignment
          });
        }
      } else if (data && data.data && Array.isArray(data.data)) {
        // Fallback: Process assignments array
        for (const assignment of data.data) {
          try {
            const assetUrl = `${API_CONFIG.BASE_URL}/api/assets/${assignment.asset_id}`;
            console.log(`Fetching asset details from: ${assetUrl}`);
            
            const assetResponse = await fetch(assetUrl, {
              method: 'GET',
              headers: getApiHeaders(),
            });
            
            if (assetResponse.ok) {
              const assetDetails = await assetResponse.json();
              console.log(`Asset details for ${assignment.asset_id}:`, assetDetails);
              
              // Handle the asset details response structure
              let assetDescription = t('assets.unknownAsset');
              let serialNumber = `SN-${assignment.asset_id}`;
              
              if (Array.isArray(assetDetails) && assetDetails.length > 0) {
                assetDescription = assetDetails[0].description || assetDetails[0].text || assetDetails[0].name || `${t('assets.asset')} ${assignment.asset_id}`;
                serialNumber = assetDetails[0].serial_number || `SN-${assignment.asset_id}`;
              } else if (assetDetails && typeof assetDetails === 'object') {
                assetDescription = assetDetails.description || assetDetails.text || assetDetails.name || `${t('assets.asset')} ${assignment.asset_id}`;
                serialNumber = assetDetails.serial_number || `SN-${assignment.asset_id}`;
              }
              
              console.log(`Processed asset: ${assetDescription} (${serialNumber})`);
              
              processedAssets.push({
                type: assetDescription,
                serial: serialNumber,
                assigned: employees[assignment.employee_int_id] || assignment.employee_int_id || t('assets.unknownEmployee'),
                assetId: assignment.asset_id,
                assignmentId: assignment.asset_assign_id
              });
            } else {
              console.log(`Asset details not available for ${assignment.asset_id}, using fallback`);
              // Fallback if asset details not available
              processedAssets.push({
                type: `${t('assets.asset')} ${assignment.asset_id}`,
                serial: `SN-${assignment.asset_id}`,
                assigned: employees[assignment.employee_int_id] || assignment.employee_int_id || t('assets.unknownEmployee'),
                assetId: assignment.asset_id,
                assignmentId: assignment.asset_assign_id
              });
            }
          } catch (error) {
            console.error(`Error fetching asset details for ${assignment.asset_id}:`, error);
            // Fallback if asset details fetch fails
            processedAssets.push({
              type: `${t('assets.asset')} ${assignment.asset_id}`,
              serial: `SN-${assignment.asset_id}`,
              assigned: employees[assignment.employee_int_id] || assignment.employee_int_id || "Unknown",
              assetId: assignment.asset_id,
              assignmentId: assignment.asset_assign_id
            });
          }
        }
      } else if (data && Array.isArray(data)) {
        // If response is directly an array of assignments
        for (const assignment of data) {
          try {
            const assetUrl = `${API_CONFIG.BASE_URL}/api/assets/${assignment.asset_id}`;
            const assetResponse = await fetch(assetUrl, {
              method: 'GET',
              headers: getApiHeaders(),
            });
            
            if (assetResponse.ok) {
              const assetDetails = await assetResponse.json();
              let assetDescription = t('assets.unknownAsset');
              let serialNumber = `SN-${assignment.asset_id}`;
              
              if (Array.isArray(assetDetails) && assetDetails.length > 0) {
                assetDescription = assetDetails[0].description || assetDetails[0].text || assetDetails[0].name || `${t('assets.asset')} ${assignment.asset_id}`;
                serialNumber = assetDetails[0].serial_number || `SN-${assignment.asset_id}`;
              } else if (assetDetails && typeof assetDetails === 'object') {
                assetDescription = assetDetails.description || assetDetails.text || assetDetails.name || `${t('assets.asset')} ${assignment.asset_id}`;
                serialNumber = assetDetails.serial_number || `SN-${assignment.asset_id}`;
              }
              
              processedAssets.push({
                type: assetDescription,
                serial: serialNumber,
                assigned: employees[assignment.employee_int_id] || assignment.employee_int_id || t('assets.unknownEmployee'),
                assetId: assignment.asset_id,
                assignmentId: assignment.asset_assign_id
              });
            } else {
              processedAssets.push({
                type: `${t('assets.asset')} ${assignment.asset_id}`,
                serial: `SN-${assignment.asset_id}`,
                assigned: employees[assignment.employee_int_id] || assignment.employee_int_id || t('assets.unknownEmployee'),
                assetId: assignment.asset_id,
                assignmentId: assignment.asset_assign_id
              });
            }
          } catch (error) {
            console.error(`Error fetching asset details for ${assignment.asset_id}:`, error);
            processedAssets.push({
              type: `${t('assets.asset')} ${assignment.asset_id}`,
              serial: `SN-${assignment.asset_id}`,
              assigned: employees[assignment.employee_int_id] || assignment.employee_int_id || "Unknown",
              assetId: assignment.asset_id,
              assignmentId: assignment.asset_assign_id
            });
          }
        }
      }
      
      console.log('Final processed assets:', processedAssets);
      setAssetData(processedAssets);
      setDepartmentInfo({
        name: data.department?.department_name || departmentId,
        assetCount: data.assetCount || processedAssets.length
      });
      
    } catch (error) {
      console.error("Error fetching department assets:", error);
      if (error.name === 'AbortError') {
        Alert.alert(t('common.timeout'), t('assets.requestTimedOut'));
      } else {
        Alert.alert(t('common.error'), t('assets.failedToFetchDepartmentAssets'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Fetch department assets when departmentId changes
  useEffect(() => {
    if (departmentId) {
      fetchDepartmentAssets(departmentId);
    }
  }, [departmentId]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f4f4f4" }}>
        {/* AppBar */}
        <Appbar.Header style={styles.appbar}>
          <Appbar.Action icon="menu" color="#FEC200" onPress={() => {}} />
          {/* Centered Title */}
          <View style={styles.centerTitleContainer}>
            <Text style={styles.appbarTitle}>{t('assets.departmentAssets')}</Text>
          </View>
          {/* Right side empty to balance layout */}
          <View style={{ width: 40 }} />
        </Appbar.Header>

        {/* Back Arrow */}
        <View style={styles.backRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Table */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>
              {t('assets.asset')}
            </Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>
              {t('assets.serialNo')}
            </Text>
            {/* <Text style={[styles.tableHeaderText, { flex: 2 }]}>
              Assigned to
            </Text> */}
          </View>
          <View style={styles.yellowLine} />
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#003667" />
              <Text style={styles.loadingText}>{t('assets.loadingDepartmentAssets')}</Text>
            </View>
          ) : assetData.length > 0 ? (
            <FlatList
              data={assetData}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View
                  style={[
                    styles.tableRow,
                    { backgroundColor: index % 2 === 0 ? "#fff" : "#f0f4f8" },
                  ]}
                >
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {item.type}
                  </Text>
                  <TouchableOpacity 
                    style={{ flex: 1 }}
                    onPress={() =>
                      navigation.navigate("Dept_Asset_3", { 
                        assetData: item,
                        serialNumber: item.serial,
                        assetId: item.assetId,
                        assignmentId: item.assignmentId,
                        assignmentData: item.assignmentData
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.tableCell,
                        {
                          color: "#003366",
                          textDecorationLine: "underline",
                          textAlign: "center",
                        },
                      ]}
                    >
                      {item.serial}
                    </Text>
                  </TouchableOpacity>
                  {/* <Text style={[styles.tableCell, { flex: 2 }]}>
                    {item.assigned}
                  </Text> */}
                </View>
              )}
              ListFooterComponent={<View style={{ height: 120 }} />}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {departmentId ? t('assets.noAssetsFoundForDepartment') : t('assets.noDepartmentDataAvailable')}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appbar: {
    backgroundColor: "#003366",
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  appbarTitle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    alignSelf: "center",
  },
  centerTitleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  backRow: {
    backgroundColor: "#ededed",
    paddingHorizontal: 10,
    paddingVertical: 10,
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
    fontWeight : '500',
    color: "#616161",
    textAlign: "center",
  },
  yellowLine:{
    height: 3,
    backgroundColor: "#FEC200",
    width: "100%",
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
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
});
