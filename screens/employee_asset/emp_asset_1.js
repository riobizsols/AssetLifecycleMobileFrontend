import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
// import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Appbar } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import Asset_2 from "./emp_asset_2";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { API_CONFIG, getApiHeaders, API_ENDPOINTS } from "../../config/api";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export default function Asset_1() {
  const navigation = useNavigation();
  const [employeeId, setEmployeeId] = useState("");
  const [assetData, setAssetData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employeeInfo, setEmployeeInfo] = useState({
    name: "",
    department: "",
    assetCount: 0
  });

  // Fetch asset details by serial number
  const fetchAssetBySerial = async (serialNumber) => {
    if (!serialNumber) {
      Alert.alert("Error", "Serial number is required");
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
        Alert.alert("Timeout", "Request timed out. Please try again.");
      } else {
        Alert.alert("Error", "Failed to fetch asset details. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch employee active assets
  const fetchEmployeeAssets = async (empId) => {
    if (!empId.trim()) {
      Alert.alert("Error", "Please enter an employee ID");
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
            "No Assets Found",
            "No active assets found for this employee.",
            [{ text: "OK" }]
          );
          setAssetData([]);
          setEmployeeInfo({ name: "", department: "", assetCount: 0 });
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
          "Success",
          `Found ${transformedAssets.length} active asset(s) for ${employeeName}`,
          [{ text: "OK" }]
        );
      }
      
    } catch (error) {
      console.error("Error fetching employee assets:", error);
      
      let errorMessage = "Failed to fetch employee assets. Please try again.";
      
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

  // Convert assetData to CSV string
  const assetDataToCSV = () => {
    const header = ["Asset Name", "Serial No", "Remarks"];
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
      Alert.alert("No Data", "No assets to download. Please search for an employee first.");
      return;
    }
    
    console.log("Download icon pressed");
    try {
      const csv = assetDataToCSV();
      const fileName = `employee_${employeeId}_assets.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await Sharing.shareAsync(fileUri, {
        mimeType: "text/csv",
        dialogTitle: "Share Employee Asset CSV",
        UTI: "public.comma-separated-values-text",
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      Alert.alert("Error", "Error exporting CSV: " + error.message);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#EEEEEE" }}>
        <Appbar.Header style={styles.appbar}>
          <Appbar.Action icon="menu" color="#FEC200" onPress={() => {}} />
          <View style={styles.titleRow}>
            <Text style={styles.appbarTitle}>Employee Asset</Text>
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
        </Appbar.Header>

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.assetInput}
              placeholder="Enter Employee ID (e.g., EMP_INT_0004)"
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
            <Text style={styles.label}>Employee Name</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>{employeeInfo.name || "Employee Name"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Department</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>{employeeInfo.department || "Department"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>No. of. assets</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>{employeeInfo.assetCount || "0"}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>
              Asset
            </Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Serial No</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Remarks</Text>
          </View>
          <View style={styles.yellowLine} />
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#003667" />
              <Text style={styles.loadingText}>Loading employee assets...</Text>
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
                {employeeId ? "No assets found for this employee" : "Enter an employee ID to view assets"}
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
                console.log('Asset Data length:', assetData.length);
                
                if (!employeeId) {
                  Alert.alert("No Employee", "Please enter an employee ID first.");
                  return;
                }
                
                // Navigate to history screen
                navigation.navigate('EmployeeAssetHistory', {
                  employeeId: employeeId,
                  employeeName: employeeInfo.name
                });
              }}
              disabled={loading}
            >
              <Text style={styles.historyLinkText}>
                {loading ? "Loading..." : "Show History"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.assignAssetButton}
              onPress={() => {
                console.log('Assign Asset button pressed');
                console.log('Employee ID:', employeeId);
                
                if (!employeeId) {
                  Alert.alert("No Employee", "Please enter an employee ID first.");
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
                Assign Asset
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
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
