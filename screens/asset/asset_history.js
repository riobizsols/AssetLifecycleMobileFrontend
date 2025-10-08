import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Appbar } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { API_CONFIG, getApiHeaders, API_ENDPOINTS } from "../../config/api";
import CustomAlert from "../../components/CustomAlert";

export default function AssetHistoryScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { assetId, assetAssignment } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState([]);
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

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return t('common.na');
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
        return action || t('common.na');
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

  // Fetch asset assignment history
  const fetchAssetHistory = async () => {
    if (!assetId) {
      showAlert(t('common.error'), t('assets.assetIdNotFound'), "error");
      return;
    }

    setLoading(true);
    try {
      const url = `${API_CONFIG.BASE_URL}/api/asset-assignments/asset/${assetId}`;
      console.log("Fetching asset history:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: getApiHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Asset history data received:", data);
      
      // Sort by action_on date (newest first)
      const sortedData = data.sort((a, b) => 
        new Date(b.action_on) - new Date(a.action_on)
      );
      
      setHistoryData(sortedData);
    } catch (error) {
      console.error("Error fetching asset history:", error);
      showAlert(t('common.error'), t('assets.failedToLoadAssetHistory'), "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch history when component loads
  useEffect(() => {
    fetchAssetHistory();
    fetchDepartments();
    fetchEmployees();
  }, [assetId]);

  // Render history item
  const renderHistoryItem = ({ item, index }) => (
    <View
      style={[
        styles.historyRow,
        { backgroundColor: index % 2 === 0 ? "#fff" : "#f0f4f8" },
      ]}
    >
      <View style={styles.historyCell}>
        <Text style={styles.historyLabel}>{t('assets.action')}:</Text>
        <Text style={styles.historyValue}>
          {getActionDisplayText(item.action)}
        </Text>
      </View>
      
      <View style={styles.historyCell}>
        <Text style={styles.historyLabel}>{t('assets.date')}:</Text>
        <Text style={styles.historyValue}>
          {formatDate(item.action_on)}
        </Text>
      </View>
      
      <View style={styles.historyCell}>
        <Text style={styles.historyLabel}>{t('assets.by')}:</Text>
        <Text style={styles.historyValue}>
          {item.action_by || t('common.na')}
        </Text>
      </View>
      
      {/* <View style={styles.historyCell}>
        <Text style={styles.historyLabel}>Latest:</Text>
        <Text style={styles.historyValue}>
          {item.latest_assignment_flag ? "Yes" : "No"}
        </Text>
      </View> */}
      
      <View style={styles.historyCell}>
        <Text style={styles.historyLabel}>{t('employees.employeeName')}:</Text>
        <Text style={styles.historyValue}>
          {employees[item.employee_int_id] || item.employee_int_id || t('common.na')}
        </Text>
      </View>
      
      <View style={styles.historyCell}>
        <Text style={styles.historyLabel}>{t('employees.department')}:</Text>
        <Text style={styles.historyValue}>
          {departments[item.dept_id] || item.dept_id || t('common.na')}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#EEEEEE" }}>
      {/* AppBar */}
      <Appbar.Header style={styles.appbar}>
        <Appbar.Action
          icon="arrow-left"
          color="#FEC200"
          onPress={() => navigation.goBack()}
        />
        <View style={styles.centerTitleContainer}>
          <Text style={styles.appbarTitle}>{t('assets.assetHistory')}</Text>
        </View>
      </Appbar.Header>

      {/* Asset Info */}
      <View style={styles.assetInfo}>
        <Text style={styles.assetInfoText}>
          {t('assets.assetId')}: {assetId || t('common.na')}
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
          <FlatList
            data={historyData}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderHistoryItem}
            ListHeaderComponent={<View style={{ height: 10 }} />}
            ListFooterComponent={<View style={{ height: 120 }} />}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('assets.noHistoryFound')}</Text>
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
    // marginBottom : 30,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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