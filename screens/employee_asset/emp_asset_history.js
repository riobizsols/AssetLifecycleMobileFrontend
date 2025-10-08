import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React, { useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  FlatList,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Appbar } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { API_CONFIG, getApiHeaders, API_ENDPOINTS } from "../../config/api";

export default function EmployeeAssetHistory() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { employeeId, employeeName } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [departments, setDepartments] = useState({});
  const [employees, setEmployees] = useState({});
  const insets = useSafeAreaInsets();

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return t('common.notAvailable');
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB"); // DD/MM/YYYY format
    } catch (error) {
      return dateString;
    }
  };

  // Helper function to get action display text
  const getActionDisplayText = (action) => {
    switch (action) {
      case "A":
        return t('assets.assigned');
      case "U":
        return t('assets.unassigned');
      case "C":
        return t('assets.cancelled');
      case "T":
        return t('assets.transferred');
      default:
        return action || t('common.notAvailable');
    }
  };

  // Fetch departments data
  const fetchDepartments = async () => {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_DEPARTMENTS()}`;
      console.log("Fetching departments for history:", url);
      
      const response = await fetch(url, {
        method: "GET",
        headers: getApiHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Departments data received for history:", data);
      
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

  // Fetch employees data
  const fetchEmployees = async () => {
    try {
      // Get all departments first
      const deptUrl = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_DEPARTMENTS()}`;
      const deptResponse = await fetch(deptUrl, {
        method: "GET",
        headers: getApiHeaders(),
      });

      if (!deptResponse.ok) {
        throw new Error(`HTTP error! status: ${deptResponse.status}`);
      }

      const departments = await deptResponse.json();
      
      // Fetch employees from all departments
      const empMap = {};
      
      for (const dept of departments) {
        try {
          const empUrl = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_EMPLOYEES_BY_DEPARTMENT(dept.dept_id)}`;
          const empResponse = await fetch(empUrl, {
            method: "GET",
            headers: getApiHeaders(),
          });

          if (empResponse.ok) {
            const employees = await empResponse.json();
            employees.forEach(emp => {
              empMap[emp.emp_int_id] = emp.name || emp.full_name || emp.employee_name || emp.employee_id;
            });
          }
        } catch (error) {
          console.error(`Error fetching employees for department ${dept.dept_id}:`, error);
        }
      }
      
      console.log("Employees map created:", empMap);
      setEmployees(empMap);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  // Fetch employee asset history
  const fetchEmployeeHistory = async () => {
    if (!employeeId) {
      console.log('No employeeId provided to history screen');
      Alert.alert(t('common.error'), t('assets.employeeIdNotFound'));
      return;
    }

    setLoading(true);
    try {
      // Use the correct API endpoint for employee asset history
      const url = `${API_CONFIG.BASE_URL}/api/asset-assignments/employee-history/${employeeId}`;
      console.log("Fetching employee history for ID:", employeeId);
      console.log("API URL:", url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(url, {
        method: "GET",
        headers: getApiHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("History API response status:", response.status);

      if (!response.ok) {
        if (response.status === 404) {
          console.log('No history found (404)');
          setHistoryData([]);
          Alert.alert(
            t('assets.noHistoryFound'),
            t('assets.noHistoryFoundForEmployee'),
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
      console.log("Employee history data received:", data);
      console.log("Number of history records:", data.length);
      
      // Handle different response structures
      let historyRecords = [];
      if (data.data && Array.isArray(data.data)) {
        historyRecords = data.data;
      } else if (Array.isArray(data)) {
        historyRecords = data;
      } else {
        console.warn('Unexpected API response structure:', data);
        historyRecords = [];
      }
      
      if (historyRecords.length === 0) {
        console.log('No history data found');
        setHistoryData([]);
        return;
      }
      
      // Sort by action_on date (newest first)
      const sortedData = historyRecords.sort((a, b) => 
        new Date(b.action_on) - new Date(a.action_on)
      );
      
      setHistoryData(sortedData);
      console.log('History data set successfully');
    } catch (error) {
      console.error("Error fetching employee history:", error);
      
      let errorMessage = t('assets.failedToLoadEmployeeHistory');
      
      if (error.name === 'AbortError') {
        errorMessage = t('assets.requestTimedOut');
      } else if (error.message.includes("Network request failed")) {
        errorMessage = t('assets.networkConnectionFailed');
      } else if (error.message.includes("fetch")) {
        errorMessage = t('assets.unableToConnectToServer');
      }
      
      Alert.alert(
        t('common.error'),
        errorMessage + '\n' + error.message,
        [{ text: t('common.ok') }]
      );
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeHistory();
    fetchDepartments();
    fetchEmployees();
  }, [employeeId]);

  // Render history item
  const renderHistoryItem = ({ item, index }) => (
    <View
      style={[
        styles.historyRow,
        { backgroundColor: index % 2 === 0 ? "#fff" : "#f0f4f8" },
      ]}
    >
      <View style={styles.historyCell}>
        <Text style={styles.historyLabel}>{t('assets.action')}</Text>
        <Text style={styles.historyValue}>
          {getActionDisplayText(item.action)}
        </Text>
      </View>
      
      <View style={styles.historyCell}>
        <Text style={styles.historyLabel}>{t('assets.date')}</Text>
        <Text style={styles.historyValue}>
          {formatDate(item.action_on)}
        </Text>
      </View>
      
      <View style={styles.historyCell}>
        <Text style={styles.historyLabel}>{t('assets.by')}</Text>
        <Text style={styles.historyValue}>
          {item.action_by || t('common.notAvailable')}
        </Text>
      </View>
      
      <View style={styles.historyCell}>
        <Text style={styles.historyLabel}>{t('assets.asset')}</Text>
        <Text style={styles.historyValue}>
          {item.asset_id || t('common.notAvailable')}
        </Text>
      </View>
      
      <View style={styles.historyCell}>
        <Text style={styles.historyLabel}>{t('assets.department')}</Text>
        <Text style={styles.historyValue}>
          {departments[item.dept_id] || item.dept_id || t('common.notAvailable')}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
          <Text style={styles.appbarTitle}>{t('assets.employeeAssetHistory')}</Text>
        </View>
      </View>

      {/* Employee Info */}
      <View style={styles.assetInfo}>
        <Text style={styles.assetInfoText}>
          {t('assets.employee')} {employeeName || t('common.notAvailable')}
        </Text>
      </View>

      {/* History Table */}
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>{t('assets.assignmentHistory')}</Text>
        </View>
        <View style={styles.yellowLine} />
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#003667" />
            <Text style={styles.loadingText}>{t('assets.loadingHistory')}</Text>
          </View>
        ) : historyData.length > 0 ? (
          <View style={styles.listContainer}>
            <FlatList
              data={historyData}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderHistoryItem}
              ListHeaderComponent={<View style={{ height: 10 }} />}
              ListFooterComponent={<View style={{ height: 120 }} />}
              showsVerticalScrollIndicator={true}
              scrollEnabled={true}
              nestedScrollEnabled={true}
              contentContainerStyle={{ flexGrow: 1 }}
            />
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('assets.noHistoryFound')}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#003667",
  },
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
  appbarTitle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    alignSelf: "center",
  },
  assetInfo: {
    backgroundColor: "#fff",
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  assetInfoText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#003667",
    textAlign: "center",
  },
  tableContainer: {
    margin: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  tableHeader: {
    backgroundColor: "#003667",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  tableHeaderText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  yellowLine: {
    height: 3,
    backgroundColor: "#FEC200",
    width: "100%",
  },
  historyRow: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  historyCell: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  historyLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#616161",
    flex: 1,
  },
  historyValue: {
    fontSize: 14,
    color: "#333",
    flex: 2,
    textAlign: "right",
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