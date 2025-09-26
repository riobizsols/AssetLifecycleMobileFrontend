import { MaterialCommunityIcons } from "@expo/vector-icons";
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
} from "react-native";
import { Appbar } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { API_CONFIG, getApiHeaders, API_ENDPOINTS } from "../../config/api";
import CustomAlert from "../../components/CustomAlert";

export default function EmployeeAssetDetails() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { assetData, assetAssignment, barcode, serialNumber, employeeId, employeeName } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [departmentDetails, setDepartmentDetails] = useState(null);
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
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
    if (!dateString) return t('common.notAvailable');
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB"); // DD/MM/YYYY format
    } catch (error) {
      return dateString;
    }
  };

  // Fetch department details by ID
  const fetchDepartmentDetails = async (deptId) => {
    if (!deptId) return;

    try {
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_DEPARTMENTS()}`;
      console.log("Fetching departments for department details:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: getApiHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Departments data received for details:");

      // Find the specific department
      const department = data.find((dept) => dept.dept_id === deptId);
      if (department) {
        setDepartmentDetails(department);
        console.log("Department details found:");
      } else {
        console.warn(`Department with ID ${deptId} not found`);
      }
    } catch (error) {
      console.error("Error fetching department details:", error);
    }
  };

  // Fetch employee details by ID
  const fetchEmployeeDetails = async (employeeId) => {
    if (!employeeId) return;

    try {
      // First try to get employee by emp_int_id (internal ID)
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_EMPLOYEE(employeeId)}`;
      console.log("Fetching employee details by emp_int_id:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: getApiHeaders(),
      });

      if (!response.ok) {
        console.warn(`Employee not found by emp_int_id ${employeeId}, trying alternative methods`);
        // Try to find employee by searching through all employees
        await searchEmployeeById(employeeId);
        return;
      }

      const data = await response.json();
      console.log("Employee details received:");

      if (data) {
        setEmployeeDetails(data);
        console.log("Employee details found:");
        console.log("Employee fields available:", Object.keys(data));
      } else {
        console.warn(`Employee with emp_int_id ${employeeId} not found`);
        // Try to find employee by searching through all employees
        await searchEmployeeById(employeeId);
      }
    } catch (error) {
      console.error("Error fetching employee details:", error);
      // Try to find employee by searching through all employees
      await searchEmployeeById(employeeId);
    }
  };

  // Fallback method to search for employee by ID
  const searchEmployeeById = async (employeeId) => {
    try {
      console.log("Searching for employee by ID:");

      // Try to get all employees and find the one we need
      // We'll need to get employees from all departments
      const departmentsUrl = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_DEPARTMENTS()}`;
      const deptResponse = await fetch(departmentsUrl, {
        method: "GET",
        headers: getApiHeaders(),
      });

      if (!deptResponse.ok) {
        console.error("Failed to fetch departments for employee search");
        return;
      }

      const departments = await deptResponse.json();
      console.log("Searching through departments:");

      // Search through each department for the employee
      for (const dept of departments) {
        try {
          const employeesUrl = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_EMPLOYEES_BY_DEPARTMENT(dept.dept_id)}`;
          const empResponse = await fetch(employeesUrl, {
            method: "GET",
            headers: getApiHeaders(),
          });

          if (empResponse.ok) {
            const employees = await empResponse.json();
            console.log(`Searching in department ${dept.dept_id}:`, employees);

            // Look for employee by emp_int_id
            const foundEmployee = employees.find(
              (emp) => emp.emp_int_id === employeeId
            );
            if (foundEmployee) {
              console.log("Employee found in department search:");
              console.log("Employee fields available:", Object.keys(foundEmployee));
              setEmployeeDetails(foundEmployee);
              return;
            }
          }
        } catch (error) {
          console.error(`Error searching department ${dept.dept_id}:`, error);
        }
      }

      console.warn(`Employee with ID ${employeeId} not found in any department`);
    } catch (error) {
      console.error("Error in employee search:", error);
    }
  };

  // Fetch all details when component loads
  const fetchAssignmentDetails = async () => {
    // Handle both assetData (from API call) and assetAssignment (from scanning)
    const dataToUse = assetData || assetAssignment;
    if (!dataToUse) return;

    setLoadingDetails(true);
    try {
      console.log("Fetching assignment details for:", dataToUse);
      
      // If we have assetData from API call, we need to fetch assignment details
      if (assetData && !assetAssignment) {
        // Fetch asset assignment details to get department and employee info
        try {
          const assetId = assetData.asset_id || assetData.id;
          if (assetId) {
            const assignmentUrl = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_ASSET_ASSIGNMENT(assetId)}`;
            console.log('Fetching asset assignment:', assignmentUrl);
            
            const assignmentResponse = await fetch(assignmentUrl, {
              method: 'GET',
              headers: getApiHeaders(),
            });
            
            if (assignmentResponse.ok) {
              const assignmentData = await assignmentResponse.json();
              console.log('Asset assignment data received:', assignmentData);
              
              if (assignmentData && Array.isArray(assignmentData) && assignmentData.length > 0) {
                // Find the latest active assignment
                const activeAssignment = assignmentData.find(assignment => 
                  assignment.latest_assignment_flag === true && 
                  assignment.action === "A"
                );
                
                if (activeAssignment) {
                  // Fetch department and employee details for the active assignment
                  await Promise.all([
                    fetchDepartmentDetails(activeAssignment.dept_id),
                    fetchEmployeeDetails(activeAssignment.employee_int_id || activeAssignment.employee_id)
                  ]);
                } else {
                  // No active assignment found, just show asset details
                  console.log('No active assignment found for this asset');
                }
              }
            }
          }
        } catch (error) {
          console.error("Error fetching asset assignment:", error);
        }
      } else if (assetAssignment) {
        // Use existing assetAssignment data
        console.log("Department ID:", assetAssignment.dept_id);
        console.log("Employee ID (emp_int_id):", assetAssignment.employee_id);

        // Fetch department and employee details in parallel
        await Promise.all([
          fetchDepartmentDetails(assetAssignment.dept_id),
          fetchEmployeeDetails(
            assetAssignment.employee_int_id || assetAssignment.employee_id
          ),
        ]);
      }
    } catch (error) {
      console.error("Error fetching assignment details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Fetch details when component loads
  useEffect(() => {
    fetchAssignmentDetails();
  }, [assetData, assetAssignment]);

  // Function to handle cancel assignment via API - creates new row and updates existing
  const handleCancelAssignment = async () => {
    // Get asset ID from either assetData or assetAssignment
    const assetId = assetData?.asset_id || assetData?.id || assetAssignment?.asset_id;
    
    if (!assetId) {
      showAlert(t('common.error'), t('assets.assetIdNotFound'), "error");
      return;
    }

    setLoading(true);
    try {
      // If we have assetData but no assetAssignment, we need to fetch the current assignment first
      let currentAssignment = assetAssignment;
      if (assetData && !assetAssignment) {
        try {
          const assignmentUrl = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_ASSET_ASSIGNMENT(assetId)}`;
          console.log('Fetching current assignment for cancellation:', assignmentUrl);
          
          const assignmentResponse = await fetch(assignmentUrl, {
            method: 'GET',
            headers: getApiHeaders(),
          });
          
          if (assignmentResponse.ok) {
            const assignmentData = await assignmentResponse.json();
            console.log('Current assignment data:', assignmentData);
            
            if (assignmentData && Array.isArray(assignmentData) && assignmentData.length > 0) {
              // Find the latest active assignment
              currentAssignment = assignmentData.find(assignment => 
                assignment.latest_assignment_flag === true && 
                assignment.action === "A"
              );
            }
          }
        } catch (error) {
          console.error("Error fetching current assignment:", error);
          showAlert(t('common.error'), t('assets.failedToFetchCurrentAssignmentDetails'), "error");
          return;
        }
      }
      
      if (!currentAssignment) {
        showAlert(t('common.error'), t('assets.noActiveAssignmentFound'), "error");
        return;
      }

      // First API call: Update existing assignment to set latest_assignment_flag to false
      const updateUrl = `${API_CONFIG.BASE_URL}/api/asset-assignments/asset/${assetId}`;
      console.log("Updating existing assignment:", updateUrl);

      const updateData = {
        latest_assignment_flag: false,
      };

      const updateResponse = await fetch(updateUrl, {
        method: "PUT",
        headers: getApiHeaders(),
        body: JSON.stringify(updateData),
      });

      if (!updateResponse.ok) {
        console.error("Failed to update existing assignment");
        // Continue with creating new row even if update fails
      }

      // Second API call: Create new assignment row for cancellation
      const createUrl = `${API_CONFIG.BASE_URL}/api/asset-assignments`;
      console.log("Creating new assignment row for cancellation:", createUrl);

      // Generate a unique asset assignment ID
      const assetAssignId = `AA${Date.now()}`;

      // Create new assignment row with cancellation data
      const newAssignmentData = {
        asset_assign_id: assetAssignId,
        dept_id: currentAssignment.dept_id,
        asset_id: assetId,
        org_id: currentAssignment.org_id || "ORG001",
        employee_int_id: currentAssignment.employee_int_id,
        action: "C", // Unassign action
        action_on: new Date().toISOString(),
        action_by: "SYSTEM",
        latest_assignment_flag: false,
      };

      console.log("New assignment data:", newAssignmentData);

      const createResponse = await fetch(createUrl, {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify(newAssignmentData),
      });

      if (createResponse.ok) {
        showAlert(t('assets.success'), t('assets.assignmentCancelledSuccessfully'), "success", () => {
          navigation.goBack();
        });
      } else {
        const errorData = await createResponse.json().catch(() => ({}));
        console.error("Server error details:", errorData);
        throw new Error(`HTTP error! status: ${createResponse.status}`);
      }
    } catch (error) {
      console.error("Error cancelling assignment:", error);
      showAlert(t('common.error'), t('assets.failedToCancelAssignment'), "error");
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.appbarTitle}>{t('assets.assetAssignmentDetails')}</Text>
        </View>
      </Appbar.Header>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Search Bar */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('assets.serialNumber')}
            placeholderTextColor="#7A7A7A"
            value={serialNumber || barcode || ""}
            editable={false}
          />
          <TouchableOpacity style={styles.qrButton}>
            <MaterialCommunityIcons
              name="line-scan"
              size={22}
              color="#FEC200"
            />
          </TouchableOpacity>
        </View>

        {/* Asset Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderText}>{t('assets.assetDetails')}</Text>
          </View>
          <View style={styles.yellowLine} />
          <View style={styles.detailsTable}>
            <DetailRow
              label={t('assets.assetId')}
              value={assetData?.asset_id || assetData?.id || assetAssignment?.asset_id || t('common.notAvailable')}
            />
            <DetailRow
              label={t('assets.serialNumber')}
              value={serialNumber || assetData?.serial_number || assetAssignment?.asset_id || t('common.notAvailable')}
            />
            <DetailRow
              label={t('assets.description')}
              value={assetData?.description || assetData?.text || assetData?.name || t('common.notAvailable')}
            />
            <DetailRow
              label={t('employees.department')}
              value={
                loadingDetails
                  ? t('assets.loading')
                  : departmentDetails?.text || departmentDetails?.name || t('common.notAvailable')
              }
            />
            <DetailRow
              label={t('assets.assignedTo')}
              value={
                loadingDetails
                  ? t('assets.loading')
                  : employeeDetails
                  ? employeeDetails.name ||
                    employeeDetails.full_name ||
                    employeeDetails.employee_name ||
                    t('assets.unknownName')
                  : t('common.notAvailable')
              }
            />
            {/* <DetailRow
              label="Effective Date"
              value={formatDate(assetAssignment?.action_on)}
            /> */}
          </View>
        </View>
      </ScrollView>

      {/* Cancel Assignment Button and Link */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <TouchableOpacity 
            style={styles.linkButton}
            // onPress={() => navigation.navigate('EmployeeAssetHistory', { 
            //   assetId: assetAssignment?.asset_id,
            //   assetAssignment: assetAssignment 
            // })}
          >
            {/* <Text style={styles.linkText}>View History</Text> */}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cancelBtn, loading && styles.buttonDisabled]}
            onPress={handleCancelAssignment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.cancelBtnText}>{t('assets.cancelAssignment')}</Text>
            )}
          </TouchableOpacity>
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
    </SafeAreaView>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailColon}>:</Text>
      <TextInput style={styles.detailValue} value={value} editable={false} />
    </View>
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
  appbarTitle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    alignSelf: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    margin: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    borderColor: "#e0e0e0",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 45,
    backgroundColor: "#f3f3f3",
    fontSize: 14,
    fontWeight: "400",
    textAlignVertical: "center",
    paddingVertical: 0,
  },
  qrButton: {
    backgroundColor: "#003667",
    borderRadius: 8,
    padding: 8,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
    height: 45,
    width: 40,
  },
  card: {
    marginHorizontal: 8,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    backgroundColor: "#003667",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  cardHeaderText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  detailsTable: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  detailLabel: {
    width: 100,
    color: "#616161",
    fontSize: 14,
    fontWeight: "500",
  },
  detailColon: {
    width: 10,
    color: "#333",
    fontSize: 12,
    fontWeight: "400",
    textAlign: "center",
    marginRight: 10,
  },
  detailValue: {
    flex: 1,
    borderColor: "#e0e0e0",
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 8,
    height: "140%",
    color: "#616161",
    fontSize: 12,
    fontWeight: "400",
    textAlignVertical: "center",
    textAlign: "left",
    paddingVertical: 0,
    marginRight: 15,
  },
  yellowLine: {
    height: 3,
    backgroundColor: "#FEC200",
    width: "100%",
    marginBottom: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cancelBtn: {
    backgroundColor: "#dc3545",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    flex: 1,
    marginLeft: 90,
  },
  cancelBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  linkButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  linkText: {
    color: "#003667",
    fontWeight: "500",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  buttonDisabled: {
    backgroundColor: "#cccccc",
  },
}); 