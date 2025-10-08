import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { Appbar } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { API_CONFIG, getApiHeaders, API_ENDPOINTS } from "../../config/api";

export default function EmployeeAssetDetailScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { employeeId, employeeName, departmentId } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [assetData, setAssetData] = useState([]);
  const [employeeInfo, setEmployeeInfo] = useState({
    id: "",
    name: "",
    department: "",
    assetCount: 0
  });
  const [departments, setDepartments] = useState({});

  // Fetch departments data
  const fetchDepartments = async () => {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_DEPARTMENTS()}`;
      console.log("Fetching departments for employee details:", url);
      
      const response = await fetch(url, {
        method: "GET",
        headers: getApiHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Departments data received for employee details:", data);
      
      // Create a map of dept_id to department name
      const deptMap = {};
      data.forEach(dept => {
        deptMap[dept.dept_id] = dept.text || dept.name || dept.dept_name;
      });
      
      setDepartments(deptMap);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  // Fetch employee active assets
  const fetchEmployeeActiveAssets = async (empId) => {
    if (!empId) {
      Alert.alert(t('common.error'), t('assets.employeeIdRequired'));
      return;
    }

    setLoading(true);
    try {
      console.log(`Fetching active assets for employee: ${empId}`);
      const url = `${API_CONFIG.BASE_URL}/api/asset-assignments/employee/${empId}/active`;
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
            t('assets.noActiveAssetsFound'),
            t('assets.noActiveAssetsFoundForEmployee'),
            [{ text: t('common.ok') }]
          );
          setAssetData([]);
          setEmployeeInfo({
            id: employeeId || "",
            name: employeeName || "",
            department: departments[departmentId] || departmentId || "",
            assetCount: 0
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Employee active assets data received:', data);
      
      // Process the assignment data to get asset details
      const processedAssets = [];
      
      // Handle the new API response structure
      if (data && data.data && Array.isArray(data.data)) {
        // Fetch asset details for each assignment
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
                remarks: assignment.remarks || t('assets.active'),
                assetId: assignment.asset_id,
                assignmentId: assignment.asset_assign_id
              });
            } else {
              console.log(`Asset details not available for ${assignment.asset_id}, using fallback`);
              // Fallback if asset details not available
              processedAssets.push({
                type: `${t('assets.asset')} ${assignment.asset_id}`,
                serial: `SN-${assignment.asset_id}`,
                remarks: assignment.remarks || t('assets.active'),
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
              remarks: assignment.remarks || "Active",
              assetId: assignment.asset_id,
              assignmentId: assignment.asset_assign_id
            });
          }
        }
      }
      
      setAssetData(processedAssets);
      setEmployeeInfo({
        id: data.employee?.emp_int_id || data.employee?.employee_id || employeeId || "",
        name: data.employee?.employee_name || employeeName || "",
        department: data.department?.department_name || departments[departmentId] || departmentId || "",
        assetCount: data.count || processedAssets.length
      });
      
    } catch (error) {
      console.error("Error fetching employee active assets:", error);
      if (error.name === 'AbortError') {
        Alert.alert(t('common.timeout'), t('assets.requestTimedOut'));
      } else {
        Alert.alert(t('common.error'), t('assets.failedToFetchEmployeeAssets'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Fetch employee assets when employeeId changes
  useEffect(() => {
    if (employeeId) {
      fetchEmployeeActiveAssets(employeeId);
    }
  }, [employeeId]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#EEEEEE" }}>
        {/* AppBar */}
        <Appbar.Header style={styles.appbar}>
          <Appbar.Action icon="menu" color="#FEC200" onPress={() => {}} />
          {/* Centered Title */}
          <View style={styles.centerTitleContainer}>
            <Text style={styles.appbarTitle}>{t('assets.employeeAssetDetail')}</Text>
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

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('assets.employeeId')}</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput
              style={styles.valueInput}
              value={employeeInfo.id}
              editable={false}
            />
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('assets.employeeName')}</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput
              style={styles.valueInput}
              value={employeeInfo.name}
              editable={false}
            />
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('assets.department')}</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput 
              style={styles.valueInput} 
              value={employeeInfo.department} 
              editable={false} 
            />
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('assets.noOfAsset')}</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput 
              style={styles.valueInput} 
              value={employeeInfo.assetCount.toString()} 
              editable={false} 
            />
          </View>
        </View>

        {/* Table */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>
              {t('assets.asset')}
            </Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>
              {t('assets.serialNo')}
            </Text>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>{t('assets.remarks')}</Text>
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
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View
                  style={[
                    styles.tableRow,
                    { backgroundColor: index % 2 === 0 ? "#fff" : "#f0f4f8" },
                  ]}
                >
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>
                    {item.type}
                  </Text>
                  <TouchableOpacity 
                    style={{ flex: 1 }}
                    onPress={() =>
                      navigation.navigate("Dept_Asset_6", {
                        assetId: item.assetId,
                        serialNumber: item.serial,
                        employeeId: employeeId,
                        employeeName: employeeName,
                        departmentId: departmentId
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
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {item.remarks}
                  </Text>
                </View>
              )}
              ListFooterComponent={<View style={{ height: 120 }} />}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {employeeId ? t('assets.noActiveAssetsFoundForEmployeeMessage') : t('assets.noEmployeeDataAvailableMessage')}
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
  backRow: {
    backgroundColor: "#ededed",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  formContainer: {
    backgroundColor: "#ededed",
    marginHorizontal: 10,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 0,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    width: 140,
    color: "#616161",
    fontSize: 14,
    fontWeight : '500',
  },
  colon: {
    width: 10,
    color: "#333",
    fontSize: 14,
    textAlign: "center",
    marginHorizontal : 10
  },
  valueInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 4,
    paddingHorizontal: 10,
    height: "90%",
    color: "#616161",
    fontSize: 13,
    fontWeight : '400',
    borderWidth: 1,
    borderColor: "#ccc",
    // textAlign: "center",
    textAlignVertical: "center",
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
    // padding: 40,
    alignItems: "center",
    flex:1,
    justifyContent:'center',

  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
});
