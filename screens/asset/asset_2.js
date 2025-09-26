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
  Dimensions,
} from "react-native";
import { Appbar } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { API_CONFIG, getApiHeaders, API_ENDPOINTS } from "../../config/api";
import CustomAlert from "../../components/CustomAlert";
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
        justifyContent: 'space-between',
        alignItems: 'center',
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

export default function App() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { assetAssignment, barcode } = route.params || {};
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
    if (!dateString) return t('common.na');
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
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_EMPLOYEE(
        employeeId
      )}`;
      console.log("Fetching employee details by emp_int_id:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: getApiHeaders(),
      });

      if (!response.ok) {
        console.warn(
          `Employee not found by emp_int_id ${employeeId}, trying alternative methods`
        );
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
      const departmentsUrl = `${
        API_CONFIG.BASE_URL
      }${API_ENDPOINTS.GET_DEPARTMENTS()}`;
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
          const employeesUrl = `${
            API_CONFIG.BASE_URL
          }${API_ENDPOINTS.GET_EMPLOYEES_BY_DEPARTMENT(dept.dept_id)}`;
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
              console.log(
                "Employee fields available:",
                Object.keys(foundEmployee)
              );
              setEmployeeDetails(foundEmployee);
              return;
            }
          }
        } catch (error) {
          console.error(`Error searching department ${dept.dept_id}:`, error);
        }
      }

      console.warn(
        `Employee with ID ${employeeId} not found in any department`
      );
    } catch (error) {
      console.error("Error in employee search:", error);
    }
  };

  // Fetch all details when component loads
  const fetchAssignmentDetails = async () => {
    if (!assetAssignment) return;

    setLoadingDetails(true);
    try {
      console.log("Fetching assignment details for:", assetAssignment);
      console.log("Department ID:", assetAssignment.dept_id);
      console.log("Employee ID (emp_int_id):", assetAssignment.employee_id);

      // Fetch department and employee details in parallel
      await Promise.all([
        fetchDepartmentDetails(assetAssignment.dept_id),
        fetchEmployeeDetails(
          assetAssignment.employee_int_id || assetAssignment.employee_id
        ), // Use employee_int_id if available, fallback to employee_id
      ]);
    } catch (error) {
      console.error("Error fetching assignment details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Fetch details when component loads
  useEffect(() => {
    fetchAssignmentDetails();
  }, [assetAssignment]);

  // Helper function to get action type based on context
  const getActionType = (context) => {
    switch (context) {
      case "assign":
        return "ASSIGN";
      case "unassign":
        return "UNASSIGN";
      case "transfer":
        return "TRANSFER";
      case "return":
        return "RETURN";
      default:
        return "ASSIGN";
    }
  };

  // Function to handle cancel assignment via API - creates new row and updates existing
  const handleCancelAssignment = async () => {
    if (!assetAssignment?.asset_id) {
      showAlert(t('common.error'), t('assets.assetIdNotFound'), "error");
      return;
    }

    setLoading(true);
    try {
      // First API call: Update existing assignment to set latest_assignment_flag to false
      const updateUrl = `${API_CONFIG.BASE_URL}/api/asset-assignments/asset/${assetAssignment.asset_id}`;
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
        dept_id: assetAssignment.dept_id,
        asset_id: assetAssignment.asset_id,
        org_id: assetAssignment.org_id || "ORG001",
        employee_int_id: assetAssignment.employee_int_id,
        action: "C", // Unassign action
        action_on: new Date().toISOString(),
        action_by: "Nivetha",
        latest_assignment_flag: false,
      };

      console.log("New assignment data:", newAssignmentData);

      const createResponse = await fetch(createUrl, {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify(newAssignmentData),
      });

      if (createResponse.ok) {
        showAlert(t('common.success'), t('assets.assignmentCancelledSuccessfully'), "success", () => {
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

  // Function to cancel assignment
  const cancelAssignment = async () => {
    if (!assetAssignment?.asset_assign_id) {
      showAlert(t('common.error'), t('assets.assignmentIdNotFound'), "error");
      return;
    }

    showAlert(
      t('assets.cancelAssignment'),
      t('assets.confirmCancelAssignment'),
      "warning",
      async () => {
        setLoading(true);
        try {
          const url = `${
            API_CONFIG.BASE_URL
          }${API_ENDPOINTS.UPDATE_ASSET_ASSIGNMENT(
            assetAssignment.asset_assign_id
          )}`;
          console.log("Updating assignment to unassigned:", url);

          // Update the assignment with UNASSIGN action
          const updateData = {
            action: getActionType("unassign"),
            action_on: new Date().toISOString(),
            action_by: "SYSTEM", // You can replace this with actual user ID
            latest_assignment_flag: false,
            status: "Unassigned",
            changed_by: "SYSTEM", // You can replace this with actual user ID
            changed_on: new Date().toISOString(),
          };

          const response = await fetch(url, {
            method: "PUT",
            headers: getApiHeaders(),
            body: JSON.stringify(updateData),
          });

          if (response.ok) {
            showAlert(t('common.success'), t('assets.assignmentCancelledSuccessfully'), "success", () => {
              navigation.goBack();
            });
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error("Server error details:", errorData);
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        } catch (error) {
          console.error("Error cancelling assignment:", error);
          showAlert(t('common.error'), t('assets.failedToCancelAssignment'), "error");
        } finally {
          setLoading(false);
        }
      },
      true
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* AppBar */}
      <Appbar.Header style={styles.appbar}>
        <Appbar.Action
          icon="arrow-left"
          color={UI_CONSTANTS.COLORS.SECONDARY}
          onPress={() => navigation.goBack()}
        />
        <View style={styles.centerTitleContainer}>
          <Text 
            style={styles.appbarTitle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {t('assets.assetDetails')}
          </Text>
        </View>
      </Appbar.Header>

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContainer,
          DEVICE_TYPE === 'desktop' && styles.scrollDesktop,
          DEVICE_TYPE === 'tablet' && styles.scrollTablet
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder={assetAssignment?.asset_id || t('common.na')}
            placeholderTextColor={UI_CONSTANTS.COLORS.GRAY_DARK}
            value={barcode || ""}
            editable={false}
          />
          <TouchableOpacity style={styles.qrButton}>
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
          <View style={styles.detailsTable}>
            <DetailRow
              label={t('assets.serialNumber')}
              value={assetAssignment?.asset_id || t('common.na')}
            />
            <DetailRow
              label={t('employees.department')}
              value={
                loadingDetails
                  ? t('assets.loading')
                  : departmentDetails?.text || assetAssignment?.dept_id || t('common.na')
              }
            />
            <DetailRow
              label={t('employees.employeeName')}
              value={
                loadingDetails
                  ? t('assets.loading')
                  : employeeDetails
                  ? employeeDetails.name ||
                    employeeDetails.full_name ||
                    employeeDetails.employee_name ||
                    t('assets.unknownName')
                  : assetAssignment?.employee_int_id ||
                    assetAssignment?.employee_id ||
                    t('common.na')
              }
            />
            {/* <DetailRow 
              label="Status" 
              value={assetAssignment?.status || 'N/A'} 
            /> */}
            <DetailRow
              label={t('assets.effectiveDate')}
              value={formatDate(assetAssignment?.action_on)}
            />
            {/* <DetailRow
              label="Created By"
              value={assetAssignment?.created_by || "N/A"}
            />
            <DetailRow
              label="Created On"
              value={formatDate(assetAssignment?.created_on)}
            />
            <DetailRow
              label="Changed By"
              value={assetAssignment?.changed_by || "N/A"}
            />
            <DetailRow
              label="Changed On"
              value={formatDate(assetAssignment?.changed_on)}
            /> */}
          </View>
        </View>
      </ScrollView>

      {/* Cancel Assignment Button and Link */}
      <View style={[
        styles.footer,
        DEVICE_TYPE === 'desktop' && styles.footerDesktop,
        DEVICE_TYPE === 'tablet' && styles.footerTablet
      ]}>
        <View style={[
          styles.footerRow,
          RESPONSIVE_CONSTANTS.getFooterLayout()
        ]}>
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => navigation.navigate('AssetHistory', { 
              assetId: assetAssignment?.asset_id,
              assetAssignment: assetAssignment 
            })}
          >
            <Text 
              style={styles.linkText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('assets.viewHistory')}
            </Text>
          </TouchableOpacity>
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
                {t('assets.cancelAssignmentButton')}
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
    </SafeAreaView>
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
  safe: {
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
    color: UI_CONSTANTS.COLORS.WHITE,
    fontWeight: "600",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    alignSelf: "center",
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  scrollDesktop: {
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.XXL,
  },
  scrollTablet: {
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.XL,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    margin: RESPONSIVE_CONSTANTS.SPACING.MD,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
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
    textAlignVertical: "center",
    paddingVertical: 0,
  },
  qrButton: {
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.SM,
    padding: RESPONSIVE_CONSTANTS.SPACING.SM,
    marginLeft: RESPONSIVE_CONSTANTS.SPACING.SM,
    justifyContent: "center",
    alignItems: "center",
    height: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
    width: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
  },
  card: {
    marginHorizontal: RESPONSIVE_CONSTANTS.SPACING.SM,
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    borderRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    marginTop: RESPONSIVE_CONSTANTS.SPACING.XS,
    shadowColor: UI_CONSTANTS.COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
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
    borderTopLeftRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    borderTopRightRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    alignItems: "center",
  },
  cardHeaderText: {
    color: UI_CONSTANTS.COLORS.WHITE,
    fontWeight: "600",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
  },
  detailsTable: {
    paddingHorizontal: RESPONSIVE_CONSTANTS.CARD_PADDING,
    paddingTop: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  detailLabel: {
    width: scale(100),
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: "500",
  },
  detailColon: {
    width: RESPONSIVE_CONSTANTS.SPACING.MD,
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    fontWeight: "400",
    textAlign: "center",
    marginRight: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  detailValue: {
    flex: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
    borderWidth: 1,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.XS,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.SM,
    height: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    fontWeight: "400",
    textAlignVertical: "center",
    textAlign: "left",
    paddingVertical: 0,
    marginRight: RESPONSIVE_CONSTANTS.SPACING.MD,
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
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  linkButton: {
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.SM,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  linkText: {
    color: UI_CONSTANTS.COLORS.PRIMARY,
    fontWeight: "500",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    textDecorationLine: "underline",
  },
  buttonDisabled: {
    backgroundColor: UI_CONSTANTS.COLORS.GRAY_DARK,
  },
});
