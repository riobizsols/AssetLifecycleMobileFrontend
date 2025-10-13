import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState, useEffect, useCallback } from 'react';
import { Appbar } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import {
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { API_CONFIG, getApiHeaders, API_ENDPOINTS } from '../../config/api';
import { UI_CONSTANTS } from '../../utils/uiConstants';

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
  if (width >= BREAKPOINTS.DESKTOP) {return 'desktop';}
  if (width >= BREAKPOINTS.TABLET) {return 'tablet';}
  if (width >= BREAKPOINTS.LARGE) {return 'large';}
  if (width >= BREAKPOINTS.MEDIUM) {return 'medium';}
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
    if (DEVICE_TYPE === 'desktop') {return Math.min(width * 0.6, 600);}
    if (DEVICE_TYPE === 'tablet') {return Math.min(width * 0.8, 500);}
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

  getFooterLayout: () => {
    if (DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet') {
      return {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      };
    }
    return {
      flexDirection: 'column',
      alignItems: 'center',
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
      paddingHorizontal: scale(20),
      paddingVertical: scale(12),
      minWidth: scale(100),
      flex: 1,
    };
  },
};

export default function App() {
  const { t } = useTranslation();

  const departments = [
    { label: t('assets.loading'), value: '' },
  ];
  const employees = [
    { label: t('assets.selectDepartmentFirst'), value: '' },
  ];
  const navigation = useNavigation();
  const route = useRoute();
  const { assetId, assetData, barcode } = route.params || {};
  const [serial] = useState(assetData?.serial_number || barcode || assetId || '122101');
  const [department, setDepartment] = useState('');
  const [employee, setEmployee] = useState('');
  const [] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date());
  const [returnDate] = useState(new Date());
  const [showEffective, setShowEffective] = useState(false);
  const [] = useState(false);
  const [departmentsList, setDepartmentsList] = useState(departments);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [employeesList, setEmployeesList] = useState(employees);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingAssignment, setLoadingAssignment] = useState(false);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [departmentSearchText, setDepartmentSearchText] = useState('');
  const [employeeSearchText, setEmployeeSearchText] = useState('');

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
    if (!departmentSearchText) {return departmentsList;}
    return departmentsList.filter(dept =>
      dept.label.toLowerCase().includes(departmentSearchText.toLowerCase())
    );
  };

  // Filter employees based on search text
  const getFilteredEmployees = () => {
    if (!employeeSearchText) {return employeesList;}
    return employeesList.filter(emp =>
      emp.label.toLowerCase().includes(employeeSearchText.toLowerCase())
    );
  };

  // Fetch departments from API
  const fetchDepartments = useCallback(async () => {
    setLoadingDepartments(true);
    try {
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_DEPARTMENTS()}`;
      console.log('Fetching departments:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: await getApiHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Departments data received:');

      // Transform the data to match the dropdown format
      const transformedDepartments = data.map(dept => ({
        label: dept.text,
        value: dept.dept_id,
      }));

      setDepartmentsList(transformedDepartments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      showToast('error', t('common.error'), t('assets.failedToLoadDepartments'));
    } finally {
      setLoadingDepartments(false);
    }
  }, [t]);

  // Fetch employees by department
  const fetchEmployeesByDepartment = async (deptId) => {
    if (!deptId) {
      setEmployeesList([{ label: t('assets.selectDepartmentFirst'), value: '' }]);
      return;
    }

    setLoadingEmployees(true);
    try {
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_EMPLOYEES_BY_DEPARTMENT(deptId)}`;
      console.log('Fetching employees for department:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: await getApiHeaders(),
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
          dept_id: emp.dept_id,
        });
      });

      // Transform the data to match the dropdown format
      // Use emp_int_id as the value for the assignment
      const transformedEmployees = data.map(emp => ({
        label: `${emp.employee_id} - ${emp.name || emp.full_name || 'Unknown'}`,
        value: emp.emp_int_id || emp.employee_id, // Use emp_int_id if available, fallback to employee_id
        dept_id: emp.dept_id, // Store department ID for validation
        employee_id: emp.employee_id, // Store original employee_id for display
      }));

      console.log('Transformed employees:', transformedEmployees);
      setEmployeesList(transformedEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      showToast('error', t('common.error'), t('assets.failedToLoadEmployees'));
      setEmployeesList([{ label: t('assets.noEmployeesFound'), value: '' }]);
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

    if (!employee) {
      errors.push(t('assets.pleaseSelectEmployee'));
    }

    if (!effectiveDate) {
      errors.push(t('assets.pleaseSelectEffectiveDate'));
    }

    if (!returnDate) {
      errors.push(t('assets.pleaseSelectReturnDate'));
    }

    if (effectiveDate && returnDate && effectiveDate > returnDate) {
      errors.push(t('assets.effectiveDateAfterReturnDate'));
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
        headers: await getApiHeaders(),
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

  // Helper function to get action type based on context

  // Update previous assignments to set latest_assignment_flag to false
  const updatePreviousAssignments = async (assetId) => {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_ASSET_ASSIGNMENT(assetId)}`;
      console.log('Fetching current assignments for asset:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: await getApiHeaders(),
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
              changed_by: 'SYSTEM',
              changed_on: new Date().toISOString()
            };

            await fetch(updateUrl, {
              method: 'PUT',
              headers: await getApiHeaders(),
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
      showToast('error', t('assets.validationError'), validationErrors.join('\n'));
      return;
    }

    // Additional validation: Check if employee belongs to selected department
    const selectedEmployee = employeesList.find(emp => emp.value === employee);
    if (selectedEmployee) {
      console.log('Selected employee:', selectedEmployee);
      console.log('Selected department:', department);

      // Check if employee's department matches selected department
      if (selectedEmployee.dept_id && selectedEmployee.dept_id !== department) {
        showToast('error', t('assets.validationError'), `Employee ${selectedEmployee.label} belongs to department ${selectedEmployee.dept_id}, but you selected ${department}. Please select the correct department.`);
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
        org_id: 'ORG001',
        employee_int_id: employee,
        action: 'A', // Assign action
        action_on: new Date().toISOString(),
        action_by: 'EMP001',
        latest_assignment_flag: true
      };

      console.log('Assignment data:', assignmentData);
      console.log('Selected employee value (emp_int_id):', employee);
      console.log('Selected employee details:', selectedEmployee);

      const response = await fetch(url, {
        method: 'POST',
        headers: await getApiHeaders(),
        body: JSON.stringify(assignmentData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error details:', errorData);

        // Handle specific foreign key constraint errors
        if (errorData.err && errorData.err.code === '23503') {
          if (errorData.err.constraint === 'tbl_Employees_FK') {
            showToast('error', t('assets.employeeNotFound'), t('assets.employeeNotExistMessage'));
          } else if (errorData.err.constraint === 'tbl_Departments_FK') {
            showToast('error', t('assets.departmentNotFound'), t('assets.departmentNotExistMessage'));
          } else if (errorData.err.constraint === 'tbl_Assets_FK') {
            showToast('error', t('assets.assetNotFound'), t('assets.assetNotExistMessage'));
          } else {
            showToast('error', t('assets.databaseConstraintError'), `${t('assets.databaseConstraintViolated')}: ${errorData.err.detail || errorData.err.message || 'Unknown constraint error'}`);
          }
        } else {
          // Handle other server errors
          const errorMessage = errorData.error || errorData.message || `Server error (${response.status})`;
          showToast('error', t('assets.serverError'), `${t('assets.serverErrorMessage')}: ${errorMessage}`);
        }
        return;
      }

      const data = await response.json();
      console.log('Assignment created successfully:', data);

      showToast('success', t('common.success'), t('assets.assetAssignedSuccessfully'));
      setTimeout(() => {
        navigation.navigate('Home');
      }, 1500);
    } catch (error) {
      console.error('Error creating asset assignment:', error);
      showToast('error', t('common.error'), t('assets.failedToCreateAssetAssignment'));
    } finally {
      setLoadingAssignment(false);
    }
  };

  // Fetch departments on component mount
  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // Custom searchable dropdown component
  const renderSearchableDropdown = (
    value,
    setValue,
    options,
    placeholder,
    searchText,
    setSearchText,
    showDropdown,
    setShowDropdown  ) => {
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
            name={showDropdown ? 'arrow-drop-up' : 'arrow-drop-down'}
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
    setEmployee(''); // Reset employee selection
    if (selectedDeptId) {
      fetchEmployeesByDepartment(selectedDeptId);
    } else {
      setEmployeesList([{ label: t('assets.selectDepartmentFirst'), value: '' }]);
    }
  };


  return (
    <SafeAreaView style={styles.safe}>
      {/* AppBar */}
      <Appbar.Header style={styles.appbar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={UI_CONSTANTS.ICON_SIZES.LG}
            color={UI_CONSTANTS.COLORS.SECONDARY}
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
      </Appbar.Header>

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
            placeholder={serial || '627384567868'}
            placeholderTextColor={UI_CONSTANTS.COLORS.GRAY_DARK}
            value={serial || ''}
            editable={false}
          />
          <TouchableOpacity 
            style={styles.qrButton}
            onPress={() => navigation.replace('Asset')}
          >
            <MaterialCommunityIcons
              name="line-scan"
              size={UI_CONSTANTS.ICON_SIZES.MD}
              color={UI_CONSTANTS.COLORS.SECONDARY}
            />
          </TouchableOpacity>
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
              {t('assets.assetDetails')}
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
                  t('assets.selectDepartmentPlaceholder'),
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
                  employee,
                  setEmployee,
                  getFilteredEmployees(),
                  t('assets.selectEmployeePlaceholder'),
                  employeeSearchText,
                  setEmployeeSearchText,
                  showEmployeeDropdown,
                  setShowEmployeeDropdown
                )
              )}
            </View>
              {/* Status */}
              {/* <View style={styles.formRow}>
                <Text style={styles.label}>Status</Text>
                <Text style={styles.colon}>:</Text>
                {renderDropdown(status, setStatus, statuses)}
              </View> */}
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
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(e, date) => {
                    setShowEffective(false);
                    if (date) {setEffectiveDate(date);}
                  }}
                />
              )}
            </View>
              {/* Return Date */}
              {/* <View style={styles.formRow}>
                <Text style={styles.label}>Return Date</Text>
                <Text style={styles.colon}>:</Text>
                <TouchableOpacity
                  style={styles.inputWithIcon}
                  onPress={() => setShowReturn(true)}
                >
                  <Text style={{ flex: 1, color: "#616161" }}>
                    {returnDate.toLocaleDateString()}
                  </Text>
                  <Icon name="calendar-today" size={20} color="#003366" />
                </TouchableOpacity>
                {showReturn && (
                  <DateTimePicker
                    value={returnDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(e, date) => {
                      setShowReturn(false);
                      if (date) setReturnDate(date);
                    }}
                  />
                )}
              </View> */}
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
                  placeholder={t('assets.searchPlaceholder')}
                  placeholderTextColor="#888"
                  value={departmentSearchText}
                  onChangeText={setDepartmentSearchText}
                  autoFocus={true}
                />
                {departmentSearchText.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => setDepartmentSearchText('')}
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
                      setDepartmentSearchText('');
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
                  placeholder={t('assets.searchPlaceholder')}
                  placeholderTextColor="#888"
                  value={employeeSearchText}
                  onChangeText={setEmployeeSearchText}
                  autoFocus={true}
                />
                {employeeSearchText.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => setEmployeeSearchText('')}
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
                      setEmployeeSearchText('');
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
      <View style={[
        styles.footer,
        DEVICE_TYPE === 'desktop' && styles.footerDesktop,
        DEVICE_TYPE === 'tablet' && styles.footerTablet
      ]}>
        <View style={[
          styles.footerContent,
          RESPONSIVE_CONSTANTS.getFooterLayout()
        ]}>
          <TouchableOpacity
            style={styles.historyLink}
            onPress={() => navigation.navigate('AssetHistory', {
              assetId: assetId,
              assetAssignment: null
            })}
          >
            <Text
              style={styles.historyLinkText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('assets.viewHistory')}
            </Text>
          </TouchableOpacity>

          <View style={[
            styles.buttonContainer,
            DEVICE_TYPE === 'mobile' && styles.buttonContainerMobile
          ]}>
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                RESPONSIVE_CONSTANTS.getButtonSize()
              ]}
              onPress={() => navigation.navigate('Home')}
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
    backgroundColor: UI_CONSTANTS.COLORS.BACKGROUND,
  },
  overlay: {
    flex: 1,
  },
  appbar: {
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
    elevation: 0,
    shadowOpacity: 0,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
  },
  backButton: {
    padding: RESPONSIVE_CONSTANTS.SPACING.MD,
    marginLeft: RESPONSIVE_CONSTANTS.SPACING.SM,
    zIndex: 2,
  },
  centerTitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  appbarTitle: {
    color: UI_CONSTANTS.COLORS.WHITE,
    fontWeight: '600',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#003667',
    height: 56,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '400',
    textAlignVertical: 'center',
    paddingVertical: 0,
  },
  qrButton: {
    padding: RESPONSIVE_CONSTANTS.SPACING.SM,
    justifyContent: 'center',
    alignItems: 'center',
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
    overflow: 'hidden',
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
    alignItems: 'center',
    borderTopLeftRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    borderTopRightRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
  },
  cardHeaderText: {
    color: UI_CONSTANTS.COLORS.WHITE,
    fontWeight: '600',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
  },
  cardBody: {
    padding: RESPONSIVE_CONSTANTS.CARD_PADDING,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  label: {
    flex: 1.2,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: '500',
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
    textAlign: 'left',
    marginRight: RESPONSIVE_CONSTANTS.SPACING.XS,
  },
  colon: {
    width: RESPONSIVE_CONSTANTS.SPACING.MD,
    textAlign: 'center',
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    margin: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: RESPONSIVE_CONSTANTS.SPACING.MD,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
    width: '100%',
  },
  input: {
    flex: 2,
    borderWidth: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.XS,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.SM,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.XS,
    backgroundColor: UI_CONSTANTS.COLORS.GRAY_LIGHT,
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: '400',
    height: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
  },
  inputWithIcon: {
    flex: 2,
    borderWidth: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.XS,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.SM,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.XS,
    backgroundColor: UI_CONSTANTS.COLORS.GRAY_LIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    height: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
  },
  footer: {
    paddingHorizontal: RESPONSIVE_CONSTANTS.CARD_PADDING,
    paddingVertical: RESPONSIVE_CONSTANTS.CARD_PADDING,
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: UI_CONSTANTS.COLORS.GRAY_LIGHT,
  },
  footerDesktop: {
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.XXL,
  },
  footerTablet: {
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.XL,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 60,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  buttonContainerMobile: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: RESPONSIVE_CONSTANTS.SPACING.MD,
    width: '100%',
  },
  cancelBtn: {
    backgroundColor: UI_CONSTANTS.COLORS.SECONDARY,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.XS,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.XXL,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: RESPONSIVE_CONSTANTS.BUTTON_HEIGHT,
  },
  assignBtn: {
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.XS,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.XXL,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: RESPONSIVE_CONSTANTS.BUTTON_HEIGHT,
  },
  cancelBtnText: {
    color: UI_CONSTANTS.COLORS.WHITE,
    fontWeight: '500',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
  },
  assignBtnText: {
    color: UI_CONSTANTS.COLORS.WHITE,
    fontWeight: '500',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
  },
  historyLink: {
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.SM,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.MD,
    alignSelf: 'center',
  },
  historyLinkText: {
    color: UI_CONSTANTS.COLORS.PRIMARY,
    fontWeight: '500',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    textDecorationLine: 'underline',
  },
  buttonDisabled: {
    backgroundColor: UI_CONSTANTS.COLORS.GRAY_DARK,
  },
  dropdownWrapper: {
    flex: 2,
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontWeight: '400',
    flex: 1,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 999,
  },
  dropdownList: {
    position: 'absolute',
    top: DEVICE_TYPE === 'desktop' ? 150 : 200,
    left: RESPONSIVE_CONSTANTS.SPACING.LG,
    right: RESPONSIVE_CONSTANTS.SPACING.LG,
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    borderWidth: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.SM,
    height: DEVICE_TYPE === 'desktop' ? 300 : 250,
    zIndex: 1000,
    elevation: 5,
    shadowColor: UI_CONSTANTS.COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: 'transparent',
  },
  clearButton: {
    padding: RESPONSIVE_CONSTANTS.SPACING.XS,
    marginLeft: RESPONSIVE_CONSTANTS.SPACING.XS,
  },
  optionsList: {
    height: DEVICE_TYPE === 'desktop' ? 200 : 150,
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
    fontWeight: '500',
  },
  yellowLine: {
    height: 3,
    backgroundColor: UI_CONSTANTS.COLORS.SECONDARY,
    width: '100%',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
});