import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState, useEffect } from "react";
import { Appbar } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import {
    Platform,
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
import Icon from "react-native-vector-icons/MaterialIcons";
import RNPickerSelect from "react-native-picker-select";
import { API_CONFIG, getApiHeaders, API_ENDPOINTS } from "../../config/api";

const departments = [
  { label: "Loading...", value: "" },
];
const employees = [
  { label: "Select Department First", value: "" },
];

export default function EmployeeAssetAssignment() {
  const navigation = useNavigation();
  const route = useRoute();
  const { assetId, barcode, employeeId, employeeName, assetData } = route.params || {};
  const [serial] = useState(assetId || "122101");
  const [department, setDepartment] = useState("");
  const [employee, setEmployee] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(new Date());
  const [showEffective, setShowEffective] = useState(false);
  const [departmentsList, setDepartmentsList] = useState(departments);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [employeesList, setEmployeesList] = useState(employees);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingAssignment, setLoadingAssignment] = useState(false);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [departmentSearchText, setDepartmentSearchText] = useState("");
  const [employeeSearchText, setEmployeeSearchText] = useState("");

  // Helper function to show toast messages
  const showToast = (type, title, message) => {
    Toast.show({
      type: type, // 'success', 'error', 'info'
      text1: title,
      text2: message,
      position: 'bottom',
      visibilityTime: 3000,
    });
  };

  // Filter departments based on search text
  const getFilteredDepartments = () => {
    if (!departmentSearchText) return departmentsList;
    return departmentsList.filter(dept => 
      dept.label.toLowerCase().includes(departmentSearchText.toLowerCase())
    );
  };

  // Filter employees based on search text
  const getFilteredEmployees = () => {
    if (!employeeSearchText) return employeesList;
    return employeesList.filter(emp => 
      emp.label.toLowerCase().includes(employeeSearchText.toLowerCase())
    );
  };

  // Fetch departments from API
  const fetchDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_DEPARTMENTS()}`;
      console.log('Fetching departments:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getApiHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Departments data received:');
      
      // Transform the data to match the dropdown format
      const transformedDepartments = data.map(dept => ({
        label: dept.text,
        value: dept.dept_id
      }));
      
      setDepartmentsList(transformedDepartments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      showToast('error', 'Error', 'Failed to load departments. Please try again.');
    } finally {
      setLoadingDepartments(false);
    }
  };

  // Fetch employees by department
  const fetchEmployeesByDepartment = async (deptId) => {
    if (!deptId) {
      setEmployeesList([{ label: "Select Department First", value: "" }]);
      return;
    }

    setLoadingEmployees(true);
    try {
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_EMPLOYEES_BY_DEPARTMENT(deptId)}`;
      console.log('Fetching employees for department:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getApiHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Employees data received:', data);
      console.log('Number of employees received:', data.length);
      
      // Log each employee for debugging
      data.forEach((emp, index) => {
        console.log(`Employee ${index + 1}:`, {
          employee_id: emp.employee_id,
          emp_int_id: emp.emp_int_id,
          name: emp.name || emp.full_name,
          dept_id: emp.dept_id
        });
      });
      
      // Transform the data to match the dropdown format
      // Use emp_int_id as the value for the assignment
      const transformedEmployees = data.map(emp => ({
        label: `${emp.employee_id} - ${emp.name || emp.full_name || 'Unknown'}`,
        value: emp.emp_int_id || emp.employee_id, // Use emp_int_id if available, fallback to employee_id
        dept_id: emp.dept_id, // Store department ID for validation
        employee_id: emp.employee_id // Store original employee_id for display
      }));
      
      console.log('Transformed employees:', transformedEmployees);
      setEmployeesList(transformedEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      showToast('error', 'Error', 'Failed to load employees. Please try again.');
      setEmployeesList([{ label: "No employees found", value: "" }]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Validate form fields
  const validateForm = () => {
    const errors = [];
    
    if (!department) {
      errors.push("Please select a department");
    }
    
    if (!employee) {
      errors.push("Please select an employee");
    }
    
    if (!effectiveDate) {
      errors.push("Please select effective date");
    }
    
    return errors;
  };

  // Validate employee exists in database
  const validateEmployeeExists = async (employeeId) => {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_EMPLOYEE(employeeId)}`;
      console.log('Validating employee exists:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getApiHeaders(),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      // Check if the employee exists by emp_int_id or employee_id
      return data && (data.emp_int_id === employeeId || data.employee_id === employeeId);
    } catch (error) {
      console.error('Error validating employee:', error);
      return false;
    }
  };

  // Update previous assignments to set latest_assignment_flag to false
  const updatePreviousAssignments = async (assetId) => {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_ASSET_ASSIGNMENT(assetId)}`;
      console.log('Fetching current assignments for asset:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getApiHeaders(),
      });

      if (response.ok) {
        const assignments = await response.json();
        console.log('Current assignments:', assignments);
        
        // Update all existing assignments to set latest_assignment_flag to false
        for (const assignment of assignments) {
          if (assignment.latest_assignment_flag) {
            const updateUrl = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.UPDATE_ASSET_ASSIGNMENT(assignment.asset_assign_id)}`;
            const updateData = {
              latest_assignment_flag: false,
              changed_by: "SYSTEM",
              changed_on: new Date().toISOString()
            };
            
            await fetch(updateUrl, {
              method: 'PUT',
              headers: getApiHeaders(),
              body: JSON.stringify(updateData),
            });
            console.log(`Updated assignment ${assignment.asset_assign_id} latest_assignment_flag to false`);
          }
        }
      }
    } catch (error) {
      console.error('Error updating previous assignments:', error);
      // Don't block the assignment creation if this fails
    }
  };

  // Create asset assignment
  const createAssetAssignment = async () => {
    const validationErrors = validateForm();
    
    if (validationErrors.length > 0) {
      showToast('error', 'Validation Error', validationErrors.join("\n"));
      return;
    }

    // Additional validation: Check if employee belongs to selected department
    const selectedEmployee = employeesList.find(emp => emp.value === employee);
    if (selectedEmployee) {
      console.log('Selected employee:', selectedEmployee);
      console.log('Selected department:', department);
      
      // Check if employee's department matches selected department
      if (selectedEmployee.dept_id && selectedEmployee.dept_id !== department) {
        showToast('error', 'Validation Error', `Employee ${selectedEmployee.label} belongs to department ${selectedEmployee.dept_id}, but you selected ${department}. Please select the correct department.`);
        setLoadingAssignment(false);
        return;
      }
    }

    setLoadingAssignment(true);
    
    // Validate employee exists in database (optional - will continue if validation fails)
    try {
      const employeeExists = await validateEmployeeExists(employee);
      if (!employeeExists) {
        console.warn(`Employee with emp_int_id ${employee} not found in database, but continuing with assignment attempt`);
        // Don't block the assignment - let the server handle the validation
      }
    } catch (error) {
      console.warn('Employee validation failed, continuing with assignment:', error);
      // Don't block the assignment - let the server handle the validation
    }

    try {
      // First, update previous assignments to set latest_assignment_flag to false
      await updatePreviousAssignments(assetId);
      
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.CREATE_ASSET_ASSIGNMENT()}`;
      console.log('Creating asset assignment:', url);
      
      // Generate a unique asset assignment ID
      const assetAssignId = `AA${Date.now()}`;
      
      const assignmentData = {
        asset_assign_id: assetAssignId,
        dept_id: department,
        asset_id: assetId,
        org_id: "ORG001",
        employee_int_id: employee,
        action: "A", // Assign action
        action_on: new Date().toISOString(),
        action_by: "EMP001",
        latest_assignment_flag: true
      };
      
      console.log('Assignment data:', assignmentData);
      console.log('Selected employee value (emp_int_id):', employee);
      console.log('Selected employee details:', selectedEmployee);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify(assignmentData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error details:', errorData);
        
        // Handle specific foreign key constraint errors
        if (errorData.err && errorData.err.code === "23503") {
          if (errorData.err.constraint === "tbl_Employees_FK") {
            showToast('error', 'Employee Not Found', `The employee ID "${employee}" (emp_int_id) does not exist in the database. Please select a different employee or contact your administrator.`);
          } else if (errorData.err.constraint === "tbl_Departments_FK") {
            showToast('error', 'Department Not Found', `The department ID "${department}" does not exist in the database. Please select a different department or contact your administrator.`);
          } else if (errorData.err.constraint === "tbl_Assets_FK") {
            showToast('error', 'Asset Not Found', `The asset ID "${assetId}" does not exist in the database. Please verify the asset details or contact your administrator.`);
          } else {
            showToast('error', 'Database Constraint Error', `A database constraint was violated: ${errorData.err.detail || errorData.err.message || 'Unknown constraint error'}`);
          }
        } else {
          // Handle other server errors
          const errorMessage = errorData.error || errorData.message || `Server error (${response.status})`;
          showToast('error', 'Server Error', `Failed to create asset assignment: ${errorMessage}`);
        }
        return;
      }

      const data = await response.json();
      console.log('Assignment created successfully:', data);
      
      showToast('success', 'Success', 'Asset assigned successfully!');
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error('Error creating asset assignment:', error);
      showToast('error', 'Error', 'Failed to create asset assignment. Please check your connection and try again.');
    } finally {
      setLoadingAssignment(false);
    }
  };

  // Fetch employee details and set defaults
  const fetchEmployeeDetailsAndSetDefaults = async () => {
    if (!employeeId) return;

    try {
      // First try to get employee by emp_int_id (internal ID)
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_EMPLOYEE(employeeId)}`;
      console.log("Fetching employee details for defaults:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: getApiHeaders(),
      });

      if (response.ok) {
        const employeeData = await response.json();
        console.log("Employee data for defaults:", employeeData);
        
        if (employeeData && employeeData.dept_id) {
          // Set department as default
          setDepartment(employeeData.dept_id);
          // Fetch employees for this department
          await fetchEmployeesByDepartment(employeeData.dept_id);
          // Set employee as default
          setEmployee(employeeId);
        }
      } else {
        // Try to find employee by searching through all departments
        await searchEmployeeInAllDepartments();
      }
    } catch (error) {
      console.error("Error fetching employee details for defaults:", error);
      // Try to find employee by searching through all departments
      await searchEmployeeInAllDepartments();
    }
  };

  // Search for employee in all departments
  const searchEmployeeInAllDepartments = async () => {
    try {
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
            
            // Look for employee by emp_int_id
            const foundEmployee = employees.find(
              (emp) => emp.emp_int_id === employeeId
            );
            if (foundEmployee) {
              console.log("Employee found in department search for defaults:", foundEmployee);
              // Set department as default
              setDepartment(foundEmployee.dept_id || dept.dept_id);
              // Fetch employees for this department
              await fetchEmployeesByDepartment(foundEmployee.dept_id || dept.dept_id);
              // Set employee as default
              setEmployee(employeeId);
              return;
            }
          }
        } catch (error) {
          console.error(`Error searching department ${dept.dept_id}:`, error);
        }
      }

      console.warn(`Employee with ID ${employeeId} not found in any department for defaults`);
    } catch (error) {
      console.error("Error in employee search for defaults:", error);
    }
  };

  // Fetch departments on component mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Set defaults when employeeId changes
  useEffect(() => {
    if (employeeId && departmentsList.length > 1) { // Check if departments are loaded
      fetchEmployeeDetailsAndSetDefaults();
    }
  }, [employeeId, departmentsList]);

  // Custom searchable dropdown component
  const renderSearchableDropdown = (
    value, 
    setValue, 
    options, 
    placeholder, 
    searchText, 
    setSearchText, 
    showDropdown, 
    setShowDropdown,
    selectedLabel
  ) => {
    const selectedOption = options.find(option => option.value === value);
    const displayText = selectedOption ? selectedOption.label : placeholder;

    return (
      <View style={styles.dropdownWrapper}>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowDropdown(!showDropdown)}
        >
          <Text style={styles.dropdownButtonText}>
            {displayText}
          </Text>
          <Icon 
            name={showDropdown ? "arrow-drop-up" : "arrow-drop-down"} 
            size={22} 
            color="#888" 
          />
        </TouchableOpacity>
      </View>
    );
  };

  // Handle department selection
  const handleDepartmentChange = (selectedDeptId) => {
    setDepartment(selectedDeptId);
    setEmployee(""); // Reset employee selection
    if (selectedDeptId) {
      fetchEmployeesByDepartment(selectedDeptId);
    } else {
      setEmployeesList([{ label: "Select Department First", value: "" }]);
    }
  };

  const pickerSelectStyles = {
    inputIOS: {
      color: "#616161",
      fontSize: 14,
      fontWeight: "400",
      height: 36,
      paddingVertical: 8,
      paddingHorizontal: 0,
      backgroundColor: "transparent",
    },
    inputAndroid: {
      color: "#616161",
      fontSize: 14,
      fontWeight: "400",
      height: 36,
      paddingVertical: 8,
      paddingHorizontal: 0,
      backgroundColor: "transparent",
    },
    placeholder: {
      color: "#aaa",
    },
    iconContainer: {
      display: "none",
    },
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* AppBar */}
              <Appbar.Header style={styles.appbar}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FEC200" />
          </TouchableOpacity>
          <View style={styles.centerTitleContainer}>
            <Text style={styles.appbarTitle}>Employee Asset Assignment</Text>
          </View>
        </Appbar.Header>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Search Bar */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder={serial || "627384567868"}
            placeholderTextColor="#888"
            value={serial || ''}
            editable={false}
          />
          <TouchableOpacity style={styles.qrButton}>
            <MaterialCommunityIcons name="line-scan" size={22} color="#FEC200" />
          </TouchableOpacity>
        </View>
        {/* Asset Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderText}>Asset Assignment</Text>
          </View>
          <View style={styles.yellowLine} />
          <View style={styles.cardBody}>
            {/* Serial Number */}
            <View style={styles.formRow}>
              <Text style={styles.label}>Serial Number</Text>
              <Text style={styles.colon}>:</Text>
              <TextInput style={styles.input} value={serial} editable={false} />
            </View>
            {/* Department */}
            <View style={styles.formRow}>
              <Text style={styles.label}>Department</Text>
              <Text style={styles.colon}>:</Text>
              {loadingDepartments ? (
                <View style={styles.dropdownWrapper}>
                  <ActivityIndicator size="small" color="#003667" />
                  <Text style={{ marginLeft: 8, color: "#616161" }}>Loading...</Text>
                </View>
              ) : (
                renderSearchableDropdown(
                  department,
                  handleDepartmentChange,
                  getFilteredDepartments(),
                  "Select Department...",
                  departmentSearchText,
                  setDepartmentSearchText,
                  showDepartmentDropdown,
                  setShowDepartmentDropdown
                )
              )}
            </View>
            {/* Employee */}
            <View style={styles.formRow}>
              <Text style={styles.label}>Employee</Text>
              <Text style={styles.colon}>:</Text>
              {loadingEmployees ? (
                <View style={styles.dropdownWrapper}>
                  <ActivityIndicator size="small" color="#003667" />
                  <Text style={{ marginLeft: 8, color: "#616161" }}>Loading...</Text>
                </View>
              ) : (
                renderSearchableDropdown(
                  employee,
                  setEmployee,
                  getFilteredEmployees(),
                  "Select Employee...",
                  employeeSearchText,
                  setEmployeeSearchText,
                  showEmployeeDropdown,
                  setShowEmployeeDropdown
                )
              )}
            </View>
            {/* Effective Date */}
            <View style={styles.formRow}>
              <Text style={styles.label}>Effective Date</Text>
              <Text style={styles.colon}>:</Text>
              <TouchableOpacity
                style={styles.inputWithIcon}
                onPress={() => setShowEffective(true)}
              >
                <Text style={{ flex: 1, color: "#616161" }}>
                  {effectiveDate.toLocaleDateString()}
                </Text>
                <Icon name="calendar-today" size={20} color="#003366" />
              </TouchableOpacity>
              {showEffective && (
                <DateTimePicker
                  value={effectiveDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(e, date) => {
                    setShowEffective(false);
                    if (date) setEffectiveDate(date);
                  }}
                />
              )}
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Dropdown Overlays - Positioned outside ScrollView */}
      {showDepartmentDropdown && (
        <TouchableOpacity 
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setShowDepartmentDropdown(false)}
        >
          <View style={styles.dropdownList}>
            {/* Search Input */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.dropdownSearchInput}
                placeholder="Search..."
                placeholderTextColor="#888"
                value={departmentSearchText}
                onChangeText={setDepartmentSearchText}
                autoFocus={true}
              />
              {departmentSearchText.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setDepartmentSearchText("")}
                >
                  <Icon name="close" size={16} color="#888" />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Options List */}
            <ScrollView style={styles.optionsList} nestedScrollEnabled={true}>
              {getFilteredDepartments().map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionItem,
                    option.value === department && styles.selectedOption
                  ]}
                  onPress={() => {
                    handleDepartmentChange(option.value);
                    setDepartmentSearchText("");
                    setShowDepartmentDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    option.value === department && styles.selectedOptionText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      )}
      
      {showEmployeeDropdown && (
        <TouchableOpacity 
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setShowEmployeeDropdown(false)}
        >
          <View style={styles.dropdownList}>
            {/* Search Input */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.dropdownSearchInput}
                placeholder="Search..."
                placeholderTextColor="#888"
                value={employeeSearchText}
                onChangeText={setEmployeeSearchText}
                autoFocus={true}
              />
              {employeeSearchText.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setEmployeeSearchText("")}
                >
                  <Icon name="close" size={16} color="#888" />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Options List */}
            <ScrollView style={styles.optionsList} nestedScrollEnabled={true}>
              {getFilteredEmployees().map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionItem,
                    option.value === employee && styles.selectedOption
                  ]}
                  onPress={() => {
                    setEmployee(option.value);
                    setEmployeeSearchText("");
                    setShowEmployeeDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    option.value === employee && styles.selectedOptionText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      )}
      {/* Footer */}
      <View style={styles.footer}>
        {/* <TouchableOpacity 
          style={styles.historyLink}
          onPress={() => navigation.navigate('EmployeeAssetHistory', { 
            assetId: assetId,
            assetAssignment: null 
          })}
        >
          <Text style={styles.historyLinkText}>View History</Text>
        </TouchableOpacity> */}
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.cancelBtn} 
            onPress={() => navigation.goBack()}
            disabled={loadingAssignment}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.assignBtn, loadingAssignment && styles.buttonDisabled]} 
            onPress={createAssetAssignment}
            disabled={loadingAssignment}
          >
            {loadingAssignment ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.assignBtnText}>Assign</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#EEEEEE" },
  overlay: {
    flex: 1,
  },
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
  appbarTitle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#003667",
    height: 56,
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  scroll: { flexGrow: 1, paddingBottom: 16 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    margin: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchInput: {
    flex: 1,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 45,
    backgroundColor: '#f3f3f3',
    fontSize: 14,
    fontWeight : "400",
    textAlignVertical: 'center',
    paddingVertical: 0,
  },
  qrButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#003667",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginHorizontal: 10,
    marginTop: 8,
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    // Android shadow
    elevation: 2,
    overflow: "hidden",
  },
  cardHeader: {
    backgroundColor: "#003366",
    paddingVertical: 10,
    alignItems: "center",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  cardHeaderText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  cardBody: {
    padding: 16,
  },
  formRow: {
    flexDirection: "row",
    alignItems: "stretch",
    marginBottom: 14,
  },
  label: {
    flex: 1.2,
    fontSize: 14,
    fontWeight:"500",
    color: "#616161",
    textAlign: "left",
    marginRight: 6,
  },
  colon: {
    width: 10,
    textAlign: "center",
    color: "#333",
    fontSize: 14,
    margin : 10
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 45,
    backgroundColor: '#f3f3f3',
    fontSize: 14,
    fontWeight : "400",
    textAlignVertical: 'center',
    paddingVertical: 0,
  },
  qrButton: {
    backgroundColor: '#003667',
    borderRadius: 8,
    padding: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 45,
    width: 40,
  },
  input: {
    flex: 2,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#f9f9f9",
    color: "#616161",
    flexDirection: "row",
    alignItems: "center",
    justifyContent : "flex-end",
    fontSize: 14,
    fontWeight : "400",
  },
  inputWithIcon: {
    flex: 2,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#f9f9f9",
    flexDirection: "row",
    alignItems: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  cancelBtn: {
    backgroundColor: "#FEC200",
    borderRadius: 4,
    paddingHorizontal: 28,
    paddingVertical: 10,
    marginRight: 10,
  },
  assignBtn: {
    backgroundColor: "#003667",
    borderRadius: 4,
    paddingHorizontal: 28,
    paddingVertical: 10,
  },
  cancelBtnText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 12,
  },
  assignBtnText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 12,
  },
  historyLink: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  historyLinkText: {
    color: "#003667",
    fontWeight: "500",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  buttonDisabled: {
    backgroundColor: "#cccccc",
  },
  dropdownWrapper: {
    flex: 2,
    position: "relative",
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    backgroundColor: "#f9f9f9",
    height: 36,
    paddingHorizontal: 8,
  },
  dropdownButtonText: {
    color: "#616161",
    fontSize: 14,
    fontWeight: "400",
    flex: 1,
  },
  dropdownOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 999,
  },
  dropdownList: {
    position: "absolute",
    top: 200,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    height: 250,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  dropdownSearchInput: {
    flex: 1,
    height: 32,
    fontSize: 14,
    color: "#333",
    paddingHorizontal: 8,
    backgroundColor: "transparent",
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  optionsList: {
    height: 150,
  },
  optionItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectedOption: {
    backgroundColor: "#e3f2fd",
  },
  optionText: {
    fontSize: 14,
    color: "#333",
  },
  selectedOptionText: {
    color: "#003667",
    fontWeight: "500",
  },
  yellowLine:{
    height: 3,
    backgroundColor: "#FEC200",
    width: "100%",
    marginBottom: 8,
  },
}); 