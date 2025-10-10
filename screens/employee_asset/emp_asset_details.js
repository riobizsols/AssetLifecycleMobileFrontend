import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React, { useState, useEffect, useCallback } from "react";
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
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Appbar } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { API_CONFIG, getApiHeaders, API_ENDPOINTS } from "../../config/api";
import { UI_CONSTANTS, COMMON_STYLES, UI_UTILS } from "../../utils/uiConstants";
import CustomAlert from "../../components/CustomAlert";

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
  
  getDetailRowLayout: () => {
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
      return { width: scale(100) };
    }
    return { width: '100%', marginBottom: scale(4) };
  },
  
  getValueWidth: () => {
    if (DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet') {
      return { flex: 1 };
    }
    return { width: '100%' };
  },
  
  getFooterLayout: () => {
    if (DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet') {
      return {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      };
    }
    return {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    };
  },
  
  getButtonSize: () => {
    if (DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet') {
      return {
        paddingHorizontal: scale(20),
        paddingVertical: scale(12),
        minWidth: scale(120),
      };
    }
    return {
      paddingHorizontal: scale(16),
      paddingVertical: scale(12),
      width: '100%',
    };
  },
};

export default function EmployeeAssetDetails() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
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
  const fetchEmployeeDetails = useCallback(async (employeeId) => {
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
  }, []);

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
  const fetchAssignmentDetails = useCallback(async () => {
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
  }, [assetData, assetAssignment, fetchEmployeeDetails]);

  // Fetch details when component loads
  useEffect(() => {
    fetchAssignmentDetails();
  }, [fetchAssignmentDetails]);

  // Function to handle cancel assignment via API - creates new row and updates existing
  const handleCancelAssignment = async () => {
    // Get asset ID from either assetData or assetAssignment
    const assetId = assetData?.asset_id || assetData?.id || assetAssignment?.asset_id;
    
    if (!assetId) {
      showAlert(t('common.error'), t('assets.assetIdNotFound'), 'error');
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
    <View style={[styles.safeAreaContainer, { paddingTop: insets.top }]}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={UI_CONSTANTS.COLORS.PRIMARY}
        translucent={Platform.OS === 'android'}
      />
      <View style={styles.container}>
        {/* AppBar */}
        <View style={styles.appbar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
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
              {t('assets.assetAssignmentDetails')}
            </Text>
          </View>
        </View>

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
            placeholder={t('assets.serialNumber')}
            placeholderTextColor={UI_CONSTANTS.COLORS.GRAY_DARK}
            value={serialNumber || barcode || ""}
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
              {t('assets.assetDetails')}
            </Text>
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
          </View>
        </View>
      </ScrollView>

      {/* Cancel Assignment Button */}
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
            style={[
              styles.cancelBtn,
              RESPONSIVE_CONSTANTS.getButtonSize(),
              loading && styles.buttonDisabled
            ]}
            onPress={handleCancelAssignment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={UI_CONSTANTS.COLORS.WHITE} />
            ) : (
              <Text 
                style={styles.cancelBtnText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t('assets.cancelAssignment')}
              </Text>
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
      </View>
    </View>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={[
      styles.detailRow,
      RESPONSIVE_CONSTANTS.getDetailRowLayout()
    ]}>
      <Text style={[
        styles.detailLabel,
        RESPONSIVE_CONSTANTS.getLabelWidth()
      ]}>
        {label}
      </Text>
      {DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet' ? (
        <Text style={styles.detailColon}>:</Text>
      ) : null}
      <TextInput 
        style={[
          styles.detailValue,
          RESPONSIVE_CONSTANTS.getValueWidth()
        ]} 
        value={value} 
        editable={false} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
  },
  container: {
    flex: 1,
    backgroundColor: UI_CONSTANTS.COLORS.BACKGROUND,
  },
  appbar: {
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
    elevation: 0,
    shadowOpacity: 0,
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    position: "relative",
  },
  backButton: {
    padding: RESPONSIVE_CONSTANTS.SPACING.MD,
    marginLeft: RESPONSIVE_CONSTANTS.SPACING.SM,
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
    color: UI_CONSTANTS.COLORS.WHITE,
    fontWeight: "600",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    alignSelf: "center",
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: RESPONSIVE_CONSTANTS.SPACING.MD,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    width: '100%',
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
  detailsTable: {
    padding: RESPONSIVE_CONSTANTS.CARD_PADDING,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "stretch",
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  detailLabel: {
    flex: 1.2,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: "500",
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
    textAlign: "left",
    marginRight: RESPONSIVE_CONSTANTS.SPACING.XS,
  },
  detailColon: {
    width: RESPONSIVE_CONSTANTS.SPACING.MD,
    textAlign: "center",
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    margin: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  detailValue: {
    flex: 2,
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
  yellowLine: {
    height: 3,
    backgroundColor: UI_CONSTANTS.COLORS.SECONDARY,
    width: "100%",
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.SM,
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
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 60,
  },
  cancelBtn: {
    backgroundColor: UI_CONSTANTS.COLORS.ERROR,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.SM,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    minHeight: RESPONSIVE_CONSTANTS.BUTTON_HEIGHT,
  },
  cancelBtnText: {
    color: UI_CONSTANTS.COLORS.WHITE,
    fontWeight: "600",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
  },
  buttonDisabled: {
    backgroundColor: UI_CONSTANTS.COLORS.GRAY_DARK,
  },
}); 