import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState, useEffect, useCallback } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
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
    Dimensions,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from "react-native-vector-icons/MaterialIcons";
import RNPickerSelect from "react-native-picker-select";
import { API_CONFIG, getApiHeaders, API_ENDPOINTS } from "../../config/api";
import { UI_CONSTANTS, COMMON_STYLES, UI_UTILS } from "../../utils/uiConstants";

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
    XXXL: scale(32),
  },
  
  // Responsive font sizes
  FONT_SIZES: {
    XS: moderateScale(10),
    SM: moderateScale(12),
    MD: moderateScale(14),
    LG: moderateScale(16),
    XL: moderateScale(18),
    XXL: moderateScale(20),
    XXXL: moderateScale(24),
    TITLE: moderateScale(28),
  },
  
  // Responsive dimensions
  CARD_PADDING: scale(16),
  CARD_BORDER_RADIUS: scale(12),
  INPUT_HEIGHT: verticalScale(45),
  BUTTON_HEIGHT: verticalScale(40),
  
  // Responsive layout
  getCardWidth: () => {
    if (DEVICE_TYPE === 'desktop') return Math.min(width * 0.6, 600);
    if (DEVICE_TYPE === 'tablet') return Math.min(width * 0.8, 500);
    return width - scale(20); // Mobile: full width minus padding
  },
  
  getFormRowLayout: () => {
    if (DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet') {
      return {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: scale(16),
      };
    }
    return {
      flexDirection: 'column',
      alignItems: 'stretch',
      marginBottom: scale(16),
    };
  },
  
  getLabelWidth: () => {
    if (DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet') {
      return { flex: 1.2 };
    }
    return { width: '100%', marginBottom: scale(4) };
  },
  
  getInputWidth: () => {
    if (DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet') {
      return { flex: 2 };
    }
    return { width: '100%' };
  },
  
  getButtonLayout: () => {
    if (DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet') {
      return {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: scale(12),
      };
    }
    return {
      flexDirection: 'column',
      gap: scale(12),
    };
  },
  
  getButtonSize: () => {
    if (DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet') {
      return {
        paddingHorizontal: scale(28),
        paddingVertical: scale(12),
        minWidth: scale(120),
      };
    }
    return {
      paddingHorizontal: scale(24),
      paddingVertical: scale(12),
      width: '100%',
    };
  },
};

export default function EmployeeAssetAssignment() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  
  const departments = [
    { label: t('assets.loading'), value: "" },
  ];
  const employees = [
    { label: t('assets.selectDepartmentFirst'), value: "" },
  ];
  const navigation = useNavigation();
  const route = useRoute();
  const { assetId, barcode, employeeId, employeeName, assetData } = route.params || {};
  const [serial] = useState(barcode || assetData?.serial_number || "");
  const [department, setDepartment] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
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
      showToast('error', t('common.error'), t('assets.failedToLoadDepartments'));
    } finally {
      setLoadingDepartments(false);
    }
  };

  // Fetch employees by department
  const fetchEmployeesByDepartment = async (deptId) => {
    if (!deptId) {
      setEmployeesList([{ label: t('assets.selectDepartmentFirst'), value: "" }]);
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
      showToast('error', t('common.error'), t('assets.failedToLoadEmployees'));
      setEmployeesList([{ label: t('assets.noEmployeesFound'), value: "" }]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Validate form fields
  const validateForm = () => {
    const errors = [];
    
    if (!department) {
      errors.push(t('assets.pleaseSelectDepartment'));
    }
    
    if (!selectedEmployee) {
      errors.push(t('assets.pleaseSelectEmployee'));
    }
    
    if (!effectiveDate) {
      errors.push(t('assets.pleaseSelectEffectiveDate'));
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
      showToast('error', t('assets.validationError'), validationErrors.join("\n"));
      return;
    }

    // Additional validation: Check if employee belongs to selected department
    const selectedEmployeeData = employeesList.find(emp => emp.value === selectedEmployee);
    if (selectedEmployeeData) {
      console.log('Selected employee:', selectedEmployeeData);
      console.log('Selected department:', department);
      
      // Check if employee's department matches selected department
      if (selectedEmployeeData.dept_id && selectedEmployeeData.dept_id !== department) {
        showToast('error', t('assets.validationError'), `Employee ${selectedEmployeeData.label} belongs to department ${selectedEmployeeData.dept_id}, but you selected ${department}. Please select the correct department.`);
        setLoadingAssignment(false);
        return;
      }
    }

    setLoadingAssignment(true);
    
    // Validate employee exists in database (optional - will continue if validation fails)
    try {
      const employeeExists = await validateEmployeeExists(selectedEmployee);
      if (!employeeExists) {
        console.warn(`Employee with emp_int_id ${selectedEmployee} not found in database, but continuing with assignment attempt`);
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
        employee_int_id: selectedEmployee,
        action: "A", // Assign action
        action_on: new Date().toISOString(),
        action_by: "EMP001",
        latest_assignment_flag: true
      };
      
      console.log('Assignment data:', assignmentData);
      console.log('Selected employee value (emp_int_id):', selectedEmployee);
      console.log('Selected employee details:', selectedEmployeeData);
      
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
            showToast('error', t('assets.employeeNotFound'), `The employee ID "${selectedEmployee}" (emp_int_id) does not exist in the database. Please select a different employee or contact your administrator.`);
          } else if (errorData.err.constraint === "tbl_Departments_FK") {
            showToast('error', t('assets.departmentNotFound'), `The department ID "${department}" does not exist in the database. Please select a different department or contact your administrator.`);
          } else if (errorData.err.constraint === "tbl_Assets_FK") {
            showToast('error', t('assets.assetNotFound'), `The asset ID "${assetId}" does not exist in the database. Please verify the asset details or contact your administrator.`);
          } else {
            showToast('error', t('assets.databaseConstraintError'), `A database constraint was violated: ${errorData.err.detail || errorData.err.message || 'Unknown constraint error'}`);
          }
        } else {
          // Handle other server errors
          const errorMessage = errorData.error || errorData.message || `Server error (${response.status})`;
          showToast('error', t('assets.serverError'), `${t('assets.failedToCreateAssetAssignment')}: ${errorMessage}`);
        }
        return;
      }

      const data = await response.json();
      console.log('Assignment created successfully:', data);
      
      showToast('success', t('assets.success'), t('assets.assetAssignedSuccessfully'));
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error('Error creating asset assignment:', error);
      showToast('error', t('common.error'), t('assets.failedToCreateAssetAssignment'));
    } finally {
      setLoadingAssignment(false);
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
            
            // Look for employee by emp_int_id or employee_id
            const foundEmployee = employees.find(
              (emp) => emp.emp_int_id === employeeId || emp.employee_id === employeeId
            );
            if (foundEmployee) {
              console.log("Employee found in department search for defaults:", foundEmployee);
              // Set department as default
              setDepartment(foundEmployee.dept_id || dept.dept_id);
              // Fetch employees for this department
              await fetchEmployeesByDepartment(foundEmployee.dept_id || dept.dept_id);
              // Set employee as default using emp_int_id
              const empIntId = foundEmployee.emp_int_id || employeeId;
              console.log("Setting default employee with emp_int_id:", empIntId);
              setSelectedEmployee(empIntId);
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

  // Fetch employee details and set defaults
  const fetchEmployeeDetailsAndSetDefaults = useCallback(async () => {
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
          // Set employee as default using emp_int_id
          const empIntId = employeeData.emp_int_id || employeeId;
          console.log("Setting default employee with emp_int_id:", empIntId);
          setSelectedEmployee(empIntId);
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
  }, [employeeId]);

  // Fetch departments on component mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Set defaults when employeeId changes
  useEffect(() => {
    if (employeeId && departmentsList.length > 1) { // Check if departments are loaded
      fetchEmployeeDetailsAndSetDefaults();
    }
  }, [employeeId, departmentsList, fetchEmployeeDetailsAndSetDefaults]);

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
    setSelectedEmployee(""); // Reset employee selection
    if (selectedDeptId) {
      fetchEmployeesByDepartment(selectedDeptId);
    } else {
      setEmployeesList([{ label: t('assets.selectDepartmentFirst'), value: "" }]);
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
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]}>
      {/* AppBar */}
      <View style={styles.appbar}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={24} 
            color="#FEC200" 
          />
        </TouchableOpacity>
        <View style={styles.centerTitleContainer}>
          <Text 
            style={styles.appbarTitle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {t('navigation.assetAssignment')}
          </Text>
        </View>
      </View>
      
      <View style={styles.container}>
        <ScrollView 
        contentContainerStyle={[
          styles.scroll,
          DEVICE_TYPE === 'desktop' && styles.scrollDesktop,
          DEVICE_TYPE === 'tablet' && styles.scrollTablet
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder={serial || "627384567868"}
            placeholderTextColor={UI_CONSTANTS.COLORS.GRAY_DARK}
            value={serial || ''}
            editable={false}
          />
        </View>
        
        {/* Asset Details Card */}
        <View style={[
          styles.card,
          { width: RESPONSIVE_CONSTANTS.getCardWidth() },
          DEVICE_TYPE === 'desktop' && styles.cardDesktop,
          DEVICE_TYPE === 'tablet' && styles.cardTablet
        ]}>
          <View style={styles.cardHeader}>
            <Text 
              style={styles.cardHeaderText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('navigation.assetAssignment')}
            </Text>
          </View>
          <View style={styles.yellowLine} />
          <View style={styles.cardBody}>
            {/* Serial Number */}
            <View style={[
              styles.formRow,
              RESPONSIVE_CONSTANTS.getFormRowLayout()
            ]}>
              <Text style={[
                styles.label,
                RESPONSIVE_CONSTANTS.getLabelWidth()
              ]}>
                {t('assets.serialNumber')}
              </Text>
              {DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet' ? (
                <Text style={styles.colon}>:</Text>
              ) : null}
              <TextInput 
                style={[
                  styles.input,
                  RESPONSIVE_CONSTANTS.getInputWidth()
                ]} 
                value={serial} 
                editable={false} 
              />
            </View>
            
            {/* Department */}
            <View style={[
              styles.formRow,
              RESPONSIVE_CONSTANTS.getFormRowLayout()
            ]}>
              <Text style={[
                styles.label,
                RESPONSIVE_CONSTANTS.getLabelWidth()
              ]}>
                {t('employees.department')}
              </Text>
              {DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet' ? (
                <Text style={styles.colon}>:</Text>
              ) : null}
              {loadingDepartments ? (
                <View style={[
                  styles.dropdownWrapper,
                  RESPONSIVE_CONSTANTS.getInputWidth()
                ]}>
                  <ActivityIndicator size="small" color={UI_CONSTANTS.COLORS.PRIMARY} />
                  <Text style={{ marginLeft: 8, color: UI_CONSTANTS.COLORS.TEXT_SECONDARY }}>
                    {t('assets.loading')}
                  </Text>
                </View>
              ) : (
                renderSearchableDropdown(
                  department,
                  handleDepartmentChange,
                  getFilteredDepartments(),
                  t('assets.selectDepartment'),
                  departmentSearchText,
                  setDepartmentSearchText,
                  showDepartmentDropdown,
                  setShowDepartmentDropdown
                )
              )}
            </View>
            
            {/* Employee */}
            <View style={[
              styles.formRow,
              RESPONSIVE_CONSTANTS.getFormRowLayout()
            ]}>
              <Text style={[
                styles.label,
                RESPONSIVE_CONSTANTS.getLabelWidth()
              ]}>
                {t('employees.employeeName')}
              </Text>
              {DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet' ? (
                <Text style={styles.colon}>:</Text>
              ) : null}
              {loadingEmployees ? (
                <View style={[
                  styles.dropdownWrapper,
                  RESPONSIVE_CONSTANTS.getInputWidth()
                ]}>
                  <ActivityIndicator size="small" color={UI_CONSTANTS.COLORS.PRIMARY} />
                  <Text style={{ marginLeft: 8, color: UI_CONSTANTS.COLORS.TEXT_SECONDARY }}>
                    {t('assets.loading')}
                  </Text>
                </View>
              ) : (
                renderSearchableDropdown(
                  selectedEmployee,
                  setSelectedEmployee,
                  getFilteredEmployees(),
                  t('assets.selectEmployee'),
                  employeeSearchText,
                  setEmployeeSearchText,
                  showEmployeeDropdown,
                  setShowEmployeeDropdown
                )
              )}
            </View>
            
            {/* Effective Date */}
            <View style={[
              styles.formRow,
              RESPONSIVE_CONSTANTS.getFormRowLayout()
            ]}>
              <Text style={[
                styles.label,
                RESPONSIVE_CONSTANTS.getLabelWidth()
              ]}>
                {t('assets.effectiveDate')}
              </Text>
              {DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet' ? (
                <Text style={styles.colon}>:</Text>
              ) : null}
              <TouchableOpacity
                style={[
                  styles.inputWithIcon,
                  RESPONSIVE_CONSTANTS.getInputWidth()
                ]}
                onPress={() => setShowEffective(true)}
              >
                <Text style={{ flex: 1, color: UI_CONSTANTS.COLORS.TEXT_SECONDARY }}>
                  {effectiveDate.toLocaleDateString()}
                </Text>
                <Icon 
                  name="calendar-today" 
                  size={UI_CONSTANTS.ICON_SIZES.MD} 
                  color={UI_CONSTANTS.COLORS.PRIMARY} 
                />
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
                placeholder={t('assets.search')}
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
                placeholder={t('assets.search')}
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
                    option.value === selectedEmployee && styles.selectedOption
                  ]}
                  onPress={() => {
                    setSelectedEmployee(option.value);
                    setEmployeeSearchText("");
                    setShowEmployeeDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    option.value === selectedEmployee && styles.selectedOptionText
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
      <View style={[
        styles.footer,
        DEVICE_TYPE === 'desktop' && styles.footerDesktop,
        DEVICE_TYPE === 'tablet' && styles.footerTablet
      ]}>
        <View style={[
          styles.buttonContainer,
          RESPONSIVE_CONSTANTS.getButtonLayout()
        ]}>
          <TouchableOpacity 
            style={[
              styles.cancelBtn,
              RESPONSIVE_CONSTANTS.getButtonSize()
            ]} 
            onPress={() => navigation.goBack()}
            disabled={loadingAssignment}
          >
            <Text 
              style={styles.cancelBtnText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('assets.cancel')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.assignBtn, 
              RESPONSIVE_CONSTANTS.getButtonSize(),
              loadingAssignment && styles.buttonDisabled
            ]} 
            onPress={createAssetAssignment}
            disabled={loadingAssignment}
          >
            {loadingAssignment ? (
              <ActivityIndicator size="small" color={UI_CONSTANTS.COLORS.WHITE} />
            ) : (
              <Text 
                style={styles.assignBtnText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t('assets.assign')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      </View>
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: "#003667"
  },
  container: {
    flex: 1,
    backgroundColor: "#EEEEEE",
  },
  overlay: {
    flex: 1,
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
    ...Platform.select({
      ios: {
        // iOS handles safe area automatically
      },
      android: {
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
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
  scroll: { 
    flexGrow: 1, 
    paddingBottom: RESPONSIVE_CONSTANTS.SPACING.LG,
    alignItems: 'center',
  },
  scrollDesktop: {
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.XXL,
  },
  scrollTablet: {
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.XL,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    margin: RESPONSIVE_CONSTANTS.SPACING.MD,
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.SM,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.SM,
    borderWidth: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
  },
  searchInput: {
    flex: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
    borderWidth: 1,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.SM,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.MD,
    height: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
    backgroundColor: UI_CONSTANTS.COLORS.GRAY_LIGHT,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: "400",
    textAlignVertical: 'center',
    paddingVertical: 0,
    width: '100%',
  },
  qrButton: {
    padding: RESPONSIVE_CONSTANTS.SPACING.SM,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.SM,
    marginLeft: RESPONSIVE_CONSTANTS.SPACING.SM,
    height: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
    width: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
  },
  card: {
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    borderRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    marginHorizontal: RESPONSIVE_CONSTANTS.SPACING.MD,
    marginTop: RESPONSIVE_CONSTANTS.SPACING.SM,
    shadowColor: UI_CONSTANTS.COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  cardDesktop: {
    maxWidth: 600,
    alignSelf: 'center',
  },
  cardTablet: {
    maxWidth: 500,
    alignSelf: 'center',
  },
  cardHeader: {
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    alignItems: "center",
    borderTopLeftRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    borderTopRightRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
  },
  cardHeaderText: {
    color: UI_CONSTANTS.COLORS.WHITE,
    fontWeight: "600",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
  },
  cardBody: {
    padding: DEVICE_TYPE === 'small' ? RESPONSIVE_CONSTANTS.SPACING.MD : RESPONSIVE_CONSTANTS.CARD_PADDING,
  },
  formRow: {
    flexDirection: "column",
    alignItems: "stretch",
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  label: {
    flex: 0,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: "500",
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
    textAlign: "left",
    marginRight: 0,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XS,
  },
  colon: {
    width: RESPONSIVE_CONSTANTS.SPACING.MD,
    textAlign: "center",
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    margin: RESPONSIVE_CONSTANTS.SPACING.MD,
    display: DEVICE_TYPE === 'small' ? 'none' : 'flex',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: RESPONSIVE_CONSTANTS.SPACING.MD,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    width: '100%',
    maxWidth: DEVICE_TYPE === 'desktop' ? 600 : DEVICE_TYPE === 'tablet' ? 500 : '100%',
  },
  input: {
    flex: 1,
    width: '100%',
    borderWidth: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.XS,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.SM,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.XS,
    backgroundColor: UI_CONSTANTS.COLORS.GRAY_LIGHT,
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: "400",
    height: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
  },
  inputWithIcon: {
    flex: 1,
    width: '100%',
    borderWidth: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.XS,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.SM,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.XS,
    backgroundColor: UI_CONSTANTS.COLORS.GRAY_LIGHT,
    flexDirection: "row",
    alignItems: "center",
    height: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: RESPONSIVE_CONSTANTS.CARD_PADDING,
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    borderTopWidth: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_LIGHT,
  },
  footerDesktop: {
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.XXL,
  },
  footerTablet: {
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.XL,
  },
  buttonContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "stretch",
    width: '100%',
    gap: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  cancelBtn: {
    backgroundColor: UI_CONSTANTS.COLORS.SECONDARY,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.XS,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.XXL,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    marginRight: 0,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: RESPONSIVE_CONSTANTS.BUTTON_HEIGHT,
    width: '100%',
  },
  assignBtn: {
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.XS,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.XXL,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: RESPONSIVE_CONSTANTS.BUTTON_HEIGHT,
    width: '100%',
  },
  cancelBtnText: {
    color: UI_CONSTANTS.COLORS.BLACK,
    fontWeight: "500",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
  },
  assignBtnText: {
    color: UI_CONSTANTS.COLORS.WHITE,
    fontWeight: "500",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
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
    flex: 1,
    width: '100%',
    position: "relative",
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.XS,
    backgroundColor: UI_CONSTANTS.COLORS.GRAY_LIGHT,
    height: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  dropdownButtonText: {
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
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
    top: DEVICE_TYPE === 'desktop' ? 150 : DEVICE_TYPE === 'tablet' ? 180 : DEVICE_TYPE === 'small' ? 220 : 200,
    left: DEVICE_TYPE === 'small' ? RESPONSIVE_CONSTANTS.SPACING.MD : RESPONSIVE_CONSTANTS.SPACING.LG,
    right: DEVICE_TYPE === 'small' ? RESPONSIVE_CONSTANTS.SPACING.MD : RESPONSIVE_CONSTANTS.SPACING.LG,
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    borderWidth: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.SM,
    height: DEVICE_TYPE === 'desktop' ? 300 : DEVICE_TYPE === 'small' ? 200 : 250,
    zIndex: 1000,
    elevation: 5,
    shadowColor: UI_CONSTANTS.COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: UI_CONSTANTS.COLORS.GRAY_LIGHT,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.SM,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  dropdownSearchInput: {
    flex: 1,
    height: RESPONSIVE_CONSTANTS.INPUT_HEIGHT * 0.7,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.SM,
    backgroundColor: "transparent",
  },
  clearButton: {
    padding: RESPONSIVE_CONSTANTS.SPACING.XS,
    marginLeft: RESPONSIVE_CONSTANTS.SPACING.XS,
  },
  optionsList: {
    height: DEVICE_TYPE === 'desktop' ? 200 : DEVICE_TYPE === 'small' ? 120 : 150,
  },
  optionItem: {
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONSTANTS.COLORS.GRAY_LIGHT,
  },
  selectedOption: {
    backgroundColor: UI_CONSTANTS.COLORS.INFO + '20',
  },
  optionText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
  },
  selectedOptionText: {
    color: UI_CONSTANTS.COLORS.PRIMARY,
    fontWeight: "500",
  },
  yellowLine: {
    height: 3,
    backgroundColor: UI_CONSTANTS.COLORS.SECONDARY,
    width: "100%",
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
}); 