import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Dimensions,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Appbar } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import CustomAlert from '../../components/CustomAlert';
import { authUtils } from '../../utils/auth';
import SideMenu from '../../components/SideMenu';
import { useNavigation as useNavigationContext } from '../../context/NavigationContext';
import { getServerUrl, getApiHeaders, API_ENDPOINTS } from '../../config/api';
import { UI_CONSTANTS, COMMON_STYLES, UI_UTILS } from '../../utils/uiConstants';

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
  BUTTON_HEIGHT: verticalScale(48),
  
  // Responsive layout
  getSectionWidth: () => {
    if (DEVICE_TYPE === 'desktop') return Math.min(width * 0.9, 1000);
    if (DEVICE_TYPE === 'tablet') return Math.min(width * 0.95, 800);
    return width - scale(32); // Mobile: full width minus padding
  },
  
  getFieldLayout: () => {
    if (DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet') {
      return {
        marginBottom: scale(20),
      };
    }
    return {
      marginBottom: scale(16),
    };
  },
  
  getActionButtonsLayout: () => {
    if (DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet') {
      return {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: scale(16),
        marginTop: scale(24),
        marginBottom: scale(50),
      };
    }
    return {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: scale(12),
      marginTop: scale(20),
      marginBottom: scale(50),
    };
  },
  
  getButtonSize: () => {
    if (DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet') {
      return {
        flex: 1,
        paddingVertical: scale(18),
        borderRadius: scale(12),
      };
    }
    return {
      flex: 1,
      paddingVertical: scale(16),
      borderRadius: scale(10),
    };
  },
};

const BreakdownReportScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { hasAccess } = useNavigationContext();
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);
  const [showBreakdownCodeDropdown, setShowBreakdownCodeDropdown] = useState(false);
  const [showDecisionCodeDropdown, setShowDecisionCodeDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
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

  // Get asset data from navigation params
  const assetData = route.params?.assetData || {
    id: 'ASS001',
    assetType: t('breakdown.appleLaptop'),
    assetName: t('breakdown.macBookPro'),
    status: t('breakdown.breakdownReported'),
    assetTypeId: 'AT001', // Default asset type ID for testing
  };

  // Form state
  const [formData, setFormData] = useState({
    breakdownCode: '',
    description: '',
    decision_code: '',
    priority: '',
  });

  // State for API data
  const [breakdownCodes, setBreakdownCodes] = useState([]);
  const [filteredBreakdownCodes, setFilteredBreakdownCodes] = useState([]);
  const [decisionCodes] = useState([
    {
      code: 'BF01',
      title: 'Maintenance Request & Breakdown Fix',
      description: 'Create maintenance request along with breakdown fix',
    },
    {
      code: 'BF02',
      title: 'Create Breakdown fix only',
      description: 'Create Breakdown fix only',
    },
    {
      code: 'BF03',
      title: 'Postpone fix to next maintenance',
      description: 'Postpone breakdown fix until next maintenance',
    },
  ]);

  // Priority options based on decision code
  const getPriorityOptions = (decisionCode) => {
    switch (decisionCode) {
      case 'BF01': // Maintenance Request & Breakdown Fix
        return ['High', 'Very High'];
      case 'BF02': // Create Breakdown fix only
        return ['High', 'Very High'];
      case 'BF03': // Postpone fix to next maintenance
        return ['Medium', 'Low'];
      default:
        return ['High', 'Very High', 'Medium', 'Low'];
    }
  };

  const [priorityOptions, setPriorityOptions] = useState(['High', 'Very High', 'Medium', 'Low']);
  const [upcomingMaintenanceDate, setUpcomingMaintenanceDate] = useState(null);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreateReasonModal, setShowCreateReasonModal] = useState(false);
  const [newReasonText, setNewReasonText] = useState('');
  const [creatingReason, setCreatingReason] = useState(false);

  // Fetch breakdown reason codes and upcoming maintenance on component mount
  useEffect(() => {
    fetchBreakdownReasonCodes();
    fetchUpcomingMaintenance();
  }, []);

  // Filter breakdown codes by asset type when breakdown codes or asset data changes
  useEffect(() => {
    if (breakdownCodes.length > 0 && assetData.assetTypeId) {
      const filtered = breakdownCodes.filter(code => 
        code.asset_type_id === assetData.assetTypeId
      );
      setFilteredBreakdownCodes(filtered);
    } else {
      setFilteredBreakdownCodes([]);
    }
  }, [breakdownCodes, assetData.assetTypeId]);

  // Update priority options when decision code changes
  useEffect(() => {
    if (formData.decision_code) {
      const newPriorityOptions = getPriorityOptions(formData.decision_code);
      setPriorityOptions(newPriorityOptions);
      
      // Reset priority if current selection is not available in new options
      if (formData.priority && !newPriorityOptions.includes(formData.priority)) {
        updateFormData('priority', '');
      }
    } else {
      setPriorityOptions(['High', 'Very High', 'Medium', 'Low']);
    }
  }, [formData.decision_code]);

  // Fetch breakdown reason codes from API
  const fetchBreakdownReasonCodes = async () => {
    try {
      const serverUrl = getServerUrl();
      const endpoint = API_ENDPOINTS.GET_BREAKDOWN_REASON_CODES('ORG001');
      const url = `${serverUrl}${endpoint}`;

      console.log('Fetching breakdown reason codes:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: await getApiHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Breakdown reason codes fetched successfully:', data);
      
      // Handle the actual API response format: { data: [{ id, text, asset_type_id }] }
      if (data.data && Array.isArray(data.data)) {
        setBreakdownCodes(data.data);
      } else if (Array.isArray(data)) {
        setBreakdownCodes(data);
      } else if (data.reason_codes && Array.isArray(data.reason_codes)) {
        setBreakdownCodes(data.reason_codes);
      } else {
        console.warn('Unexpected API response format:', data);
        setBreakdownCodes([]);
      }
    } catch (error) {
      console.error('Error fetching breakdown reason codes:', error);
      // Fallback to empty array on error
      setBreakdownCodes([]);
    }
  };

  const handleOpenCreateReason = () => {
    setShowBreakdownCodeDropdown(false);
    setNewReasonText('');
    setShowCreateReasonModal(true);
  };

  const handleCloseCreateReason = () => {
    if (creatingReason) return;
    setShowCreateReasonModal(false);
    setNewReasonText('');
  };

  const handleCreateBreakdownReasonCode = async () => {
    const assetTypeId = assetData.assetTypeId;
    const text = (newReasonText || '').trim();

    if (!assetTypeId) {
      showAlert(t('alerts.validationError'), 'Asset type ID is required', 'error');
      return;
    }

    if (!text) {
      showAlert(t('alerts.validationError'), 'Reason code text is required', 'error');
      return;
    }

    setCreatingReason(true);
    try {
      const serverUrl = getServerUrl();
      const endpoint = API_ENDPOINTS.CREATE_BREAKDOWN_REASON_CODE();
      const url = `${serverUrl}${endpoint}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: await getApiHeaders(),
        body: JSON.stringify({
          asset_type_id: assetTypeId,
          text,
        }),
      });

      const responseText = await response.text();
      let data = null;
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch (e) {
        data = null;
      }

      if (!response.ok) {
        const message =
          (data && (data.message || data.error)) ||
          responseText ||
          'Failed to create breakdown reason code';
        showAlert(t('alerts.error'), message, 'error');
        return;
      }

      const createdId =
        data?.data?.atbrrc_id ||
        data?.data?.id ||
        data?.atbrrc_id ||
        data?.id ||
        null;

      await fetchBreakdownReasonCodes();

      if (createdId) {
        updateFormData('breakdownCode', createdId);
      }

      setShowCreateReasonModal(false);
      setNewReasonText('');

      showAlert(
        t('common.success'),
        data?.message || 'Breakdown reason code created successfully',
        'success'
      );
    } catch (error) {
      console.error('Error creating breakdown reason code:', error);
      showAlert(t('alerts.error'), 'Failed to create breakdown reason code', 'error');
    } finally {
      setCreatingReason(false);
    }
  };

  // Fetch upcoming maintenance date from API
  const fetchUpcomingMaintenance = async () => {
    if (!assetData.id) {
      console.warn('No asset ID available for fetching upcoming maintenance');
      return;
    }

    try {
      setLoadingMaintenance(true);
      const serverUrl = getServerUrl();
      const endpoint = API_ENDPOINTS.GET_UPCOMING_MAINTENANCE(assetData.id);
      const url = `${serverUrl}${endpoint}`;

      console.log('Fetching upcoming maintenance:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: await getApiHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('No upcoming maintenance found for this asset');
          setUpcomingMaintenanceDate(null);
          return;
        }
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Upcoming maintenance fetched successfully:', data);

      // Handle different response structures
      let maintenanceDate = null;
      
      // Check if data is nested in a 'data' property
      const responseData = data.data || data;
      
      if (responseData && responseData.upcoming_maintenance_date) {
        maintenanceDate = responseData.upcoming_maintenance_date;
      } else if (responseData && responseData.maintenance_date) {
        maintenanceDate = responseData.maintenance_date;
      } else if (responseData && responseData.date) {
        maintenanceDate = responseData.date;
      } else if (responseData && responseData.upcoming_date) {
        maintenanceDate = responseData.upcoming_date;
      } else if (responseData && responseData.next_maintenance_date) {
        maintenanceDate = responseData.next_maintenance_date;
      }

      // Format the date for display
      if (maintenanceDate) {
        try {
          const date = new Date(maintenanceDate);
          const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
          setUpcomingMaintenanceDate(formattedDate);
        } catch (error) {
          console.error('Error formatting date:', error);
          setUpcomingMaintenanceDate(maintenanceDate);
        }
      } else {
        setUpcomingMaintenanceDate(null);
      }
    } catch (error) {
      console.error('Error fetching upcoming maintenance:', error);
      setUpcomingMaintenanceDate(null);
    } finally {
      setLoadingMaintenance(false);
    }
  };

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

  const handleLogout = async () => {
    showAlert(
      t('breakdown.logout'),
      t('breakdown.confirmLogout'),
      'warning',
      async () => {
        try {
          await authUtils.removeToken();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        } catch (error) {
          console.error('Logout error:', error);
          showAlert(t('breakdown.error'), t('breakdown.failedToLogout'), 'error');
        }
      },
      true
    );
  };

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleReportBreakdown = async () => {
    // Validate form
    if (!formData.breakdownCode) {
      showAlert(
        t('alerts.validationError'),
        t('breakdown.validation.breakdownCodeRequired'),
        'error'
      );
      return;
    }

    // Check if breakdown codes are available for this asset type
    if (filteredBreakdownCodes.length === 0) {
      showAlert(
        t('breakdown.noBreakdownCodesAvailable'),
        t('breakdown.noBreakdownCodesForAssetType'),
        'error'
      );
      return;
    }

    // Validate breakdown code exists in filtered codes
    const isValidCode = filteredBreakdownCodes.some(code => {
      const codeId = typeof code === 'string' ? code : code.id;
      return codeId === formData.breakdownCode;
    });
    
    if (!isValidCode) {
      showAlert(
        t('alerts.validationError'),
        t('breakdown.validation.invalidBreakdownCode'),
        'error'
      );
      return;
    }

    if (!formData.description.trim()) {
      showAlert(
        t('alerts.validationError'),
        t('breakdown.validation.descriptionRequired'),
        'error'
      );
      return;
    }

    // Check description length
    if (formData.description.trim().length < 20) {
      showAlert(
        t('alerts.validationError'),
        t('breakdown.validation.descriptionTooShort'),
        'error'
      );
      return;
    }

    if (!formData.decision_code) {
      showAlert(
        t('alerts.validationError'),
        t('breakdown.validation.decisionCodeRequired'),
        'error'
      );
      return;
    }

    if (!formData.priority) {
      showAlert(
        t('alerts.validationError'),
        t('breakdown.validation.priorityRequired'),
        'error'
      );
      return;
    }

    setLoading(true);

    try {
      const serverUrl = getServerUrl();
      const endpoint = API_ENDPOINTS.CREATE_BREAKDOWN_REPORT();
      const url = `${serverUrl}${endpoint}`;

      const requestBody = {
        asset_id: assetData.id,
        atbrrc_id: formData.breakdownCode,
        reported_by: 'USR001', // TODO: Get actual user ID from auth context
        description: formData.description.trim(),
        decision_code: formData.decision_code,
      };

      console.log('Creating breakdown report:', url, requestBody);

      const response = await fetch(url, {
        method: 'POST',
        headers: await getApiHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Breakdown report created successfully:', data);

      showAlert(
        t('common.success'),
        t('breakdown.reportSubmittedSuccessfully'),
        'success',
        () => {
          navigation.navigate('REPORTBREAKDOWN');
        }
      );
    } catch (error) {
      console.error('Error creating breakdown report:', error);
      
      // Parse error message to extract JSON if present
      let errorMessage = error.message;
      let parsedError = null;
      
      try {
        // Try to extract JSON from error message
        const jsonMatch = errorMessage.match(/\{.*\}/);
        if (jsonMatch) {
          parsedError = JSON.parse(jsonMatch[0]);
          if (parsedError.message) {
            errorMessage = parsedError.message;
          }
        }
      } catch (parseError) {
        // If parsing fails, use original error message
        console.warn('Could not parse error JSON:', parseError);
      }
      
      // Handle specific error cases
      let displayMessage = t('breakdown.errors.submitError');
      
      if (errorMessage.includes('Session expired') || errorMessage.includes('session expired') || errorMessage.includes('expired')) {
        displayMessage = t('breakdown.errors.sessionExpired');
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        displayMessage = t('breakdown.errors.unauthorized');
      } else if (errorMessage.includes('Network') || errorMessage.includes('network') || errorMessage.includes('fetch')) {
        displayMessage = t('breakdown.errors.networkError');
      } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
        displayMessage = t('breakdown.errors.timeoutError');
      } else if (errorMessage.includes('500') || errorMessage.includes('Server')) {
        displayMessage = t('breakdown.errors.serverError');
      } else if (parsedError && parsedError.message) {
        displayMessage = t('breakdown.errors.submitErrorDetails', { message: parsedError.message });
      } else if (errorMessage) {
        displayMessage = t('breakdown.errors.submitErrorDetails', { message: errorMessage });
      }
      
      showAlert(
        t('breakdown.error'),
        displayMessage,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={UI_CONSTANTS.COLORS.PRIMARY}
        translucent={Platform.OS === 'android'}
      />
      {/* AppBar */}
      <View style={styles.appbarContainer}>
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={handleCancel}
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
            {t('breakdown.reportBreakdown')}
          </Text>
        </View>
      </View>

      <ScrollView 
        style={[
          styles.content,
          DEVICE_TYPE === 'desktop' && styles.contentDesktop,
          DEVICE_TYPE === 'tablet' && styles.contentTablet
        ]} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { alignItems: 'center' }
        ]}
      >
        {/* Asset Details Section */}
        <View style={[
          styles.section,
          { width: RESPONSIVE_CONSTANTS.getSectionWidth() },
          DEVICE_TYPE === 'desktop' && styles.sectionDesktop,
          DEVICE_TYPE === 'tablet' && styles.sectionTablet
        ]}>
          <View style={styles.sectionHeader}>
            <Text 
              style={styles.sectionTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('breakdown.assetDetails')}
            </Text>
            <Text 
              style={styles.assetId}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              ID: {assetData.id}
            </Text>
          </View>
          
          <View style={[
            styles.fieldContainer,
            RESPONSIVE_CONSTANTS.getFieldLayout()
          ]}>
            <Text 
              style={styles.fieldLabel}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('breakdown.assetType')}
            </Text>
            <View style={styles.readOnlyField}>
              <Text 
                style={styles.readOnlyText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {assetData.assetType}
              </Text>
            </View>
          </View>

          <View style={[
            styles.fieldContainer,
            RESPONSIVE_CONSTANTS.getFieldLayout()
          ]}>
            <Text 
              style={styles.fieldLabel}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('breakdown.assetName')}
            </Text>
            <View style={styles.readOnlyField}>
              <Text 
                style={styles.readOnlyText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {assetData.assetName}
              </Text>
            </View>
          </View>

          <View style={[
            styles.fieldContainer,
            RESPONSIVE_CONSTANTS.getFieldLayout()
          ]}>
            <Text 
              style={styles.fieldLabel}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('breakdown.status')}
            </Text>
            <View style={styles.statusContainer}>
              <View style={styles.statusIndicator} />
              <Text 
                style={styles.statusText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {assetData.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Breakdown Information Section */}
        <View style={[
          styles.section,
          { width: RESPONSIVE_CONSTANTS.getSectionWidth() },
          DEVICE_TYPE === 'desktop' && styles.sectionDesktop,
          DEVICE_TYPE === 'tablet' && styles.sectionTablet
        ]}>
          <Text 
            style={styles.sectionTitle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {t('breakdown.breakdownInformation')}
          </Text>
          
          <View style={[
            styles.fieldContainer,
            RESPONSIVE_CONSTANTS.getFieldLayout()
          ]}>
            <Text 
              style={styles.fieldLabel}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('breakdown.breakdownCodeBrCode')}
            </Text>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowBreakdownCodeDropdown(!showBreakdownCodeDropdown)}
              >
                <Text 
                  style={[
                    styles.dropdownButtonText,
                    !formData.breakdownCode && styles.placeholderText
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {formData.breakdownCode || t('breakdown.selectCode')}
                </Text>
                <MaterialCommunityIcons 
                  name={showBreakdownCodeDropdown ? "chevron-up" : "chevron-down"} 
                  size={UI_CONSTANTS.ICON_SIZES.MD} 
                  color={UI_CONSTANTS.COLORS.TEXT_SECONDARY} 
                />
              </TouchableOpacity>
              
              {showBreakdownCodeDropdown && (
                <View style={styles.dropdownOptions}>
                  <ScrollView 
                    style={styles.dropdownScrollView}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    <TouchableOpacity
                      style={[styles.dropdownOption, styles.createNewOption]}
                      onPress={handleOpenCreateReason}
                    >
                      <MaterialCommunityIcons
                        name="plus-circle"
                        size={18}
                        color={UI_CONSTANTS.COLORS.PRIMARY}
                      />
                      <Text
                        style={[styles.dropdownOptionText, styles.createNewOptionText]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        Create New
                      </Text>
                    </TouchableOpacity>

                    {filteredBreakdownCodes.length > 0 ? (
                      filteredBreakdownCodes.map((item) => {
                        const code = typeof item === 'string' ? item : item.id;
                        const displayText = typeof item === 'string' ? item : `${item.id} - ${item.text}`;
                        return (
                          <TouchableOpacity
                            key={code}
                            style={styles.dropdownOption}
                            onPress={() => {
                              updateFormData('breakdownCode', code);
                              setShowBreakdownCodeDropdown(false);
                            }}
                          >
                            <Text 
                              style={styles.dropdownOptionText}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {displayText}
                            </Text>
                          </TouchableOpacity>
                        );
                      })
                    ) : (
                      <View style={styles.dropdownOption}>
                        <Text 
                          style={[styles.dropdownOptionText, { color: UI_CONSTANTS.COLORS.GRAY_DARK }]}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {t('breakdown.noBreakdownCodesForAssetType')}
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          <View style={[
            styles.fieldContainer,
            RESPONSIVE_CONSTANTS.getFieldLayout()
          ]}>
            <Text 
              style={styles.fieldLabel}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('breakdown.reportedByType')}
            </Text>
            <View style={styles.readOnlyField}>
              <Text 
                style={styles.readOnlyText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t('breakdown.user')}
              </Text>
            </View>
          </View>

          <View style={[
            styles.fieldContainer,
            RESPONSIVE_CONSTANTS.getFieldLayout()
          ]}>
            <Text 
              style={styles.fieldLabel}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('breakdown.description')}
            </Text>
            <TextInput
              style={[
                styles.textArea,
                DEVICE_TYPE === 'desktop' && styles.textAreaDesktop,
                DEVICE_TYPE === 'tablet' && styles.textAreaTablet
              ]}
              placeholder={t('breakdown.describeIssuePlaceholder')}
              placeholderTextColor={UI_CONSTANTS.COLORS.TEXT_SECONDARY}
              multiline
              numberOfLines={DEVICE_TYPE === 'desktop' ? 6 : DEVICE_TYPE === 'tablet' ? 5 : 4}
              textAlignVertical="top"
              value={formData.description}
              onChangeText={(text) => updateFormData('description', text)}
            />
          </View>

        </View>

        {/* Upcoming Maintenance Section */}
        <View style={[
          styles.section,
          { width: RESPONSIVE_CONSTANTS.getSectionWidth() },
          DEVICE_TYPE === 'desktop' && styles.sectionDesktop,
          DEVICE_TYPE === 'tablet' && styles.sectionTablet
        ]}>
          <Text 
            style={styles.sectionTitle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {t('breakdown.upcomingMaintenance')}
          </Text>
          
          <View style={styles.threeColumnLayout}>
            {/* Decision Code Column */}
            <View style={styles.columnContainer}>
              <Text 
                style={styles.columnLabel}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t('breakdown.decisionCode')} *
              </Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowDecisionCodeDropdown(!showDecisionCodeDropdown)}
                >
                  <Text 
                    style={[
                      styles.dropdownButtonText,
                      !formData.decision_code && styles.placeholderText
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {formData.decision_code
                      ? (() => {
                          const selectedItem = decisionCodes.find(item => item.code === formData.decision_code);
                          return selectedItem ? `${selectedItem.code} - ${selectedItem.title}` : formData.decision_code;
                        })()
                      : t('breakdown.selectDecisionCode')
                    }
                  </Text>
                  <MaterialCommunityIcons 
                    name={showDecisionCodeDropdown ? "chevron-up" : "chevron-down"} 
                    size={UI_CONSTANTS.ICON_SIZES.MD} 
                    color={UI_CONSTANTS.COLORS.TEXT_SECONDARY} 
                  />
                </TouchableOpacity>
                
                {showDecisionCodeDropdown && (
                  <View style={styles.dropdownOptions}>
                    <ScrollView 
                      style={styles.dropdownScrollView}
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                    >
                      {decisionCodes.map((item) => (
                        <TouchableOpacity
                          key={item.code}
                          style={[
                            styles.dropdownOption,
                            formData.decision_code === item.code && styles.selectedDropdownOption,
                          ]}
                          onPress={() => {
                            updateFormData('decision_code', item.code);
                            setShowDecisionCodeDropdown(false);
                          }}
                        >
                          <View style={styles.dropdownOptionContent}>
                            <View style={styles.dropdownOptionHeader}>
                              <MaterialCommunityIcons
                                name={formData.decision_code === item.code ? 'check-circle' : 'circle-outline'}
                                size={18}
                                color={formData.decision_code === item.code ? '#FEC200' : '#999'}
                              />
                              <Text style={[
                                styles.dropdownOptionCode,
                                formData.decision_code === item.code && styles.selectedDropdownText,
                              ]}>
                                {item.code}
                              </Text>
                              <Text style={[
                                styles.dropdownOptionTitle,
                                formData.decision_code === item.code && styles.selectedDropdownText,
                              ]}>
                                {item.title}
                              </Text>
                            </View>
                            <Text style={[
                              styles.dropdownOptionDescription,
                              formData.decision_code === item.code && styles.selectedDropdownDescription,
                            ]}>
                              {item.description}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
              <Text style={styles.columnDescription}>
                {t('breakdown.decisionCodeDescription')}
              </Text>
            </View>

            {/* Priority Column */}
            <View style={styles.columnContainer}>
              <Text 
                style={styles.columnLabel}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t('breakdown.priority')} *
              </Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowPriorityDropdown(!showPriorityDropdown)}
                >
                  <Text 
                    style={[
                      styles.dropdownButtonText,
                      !formData.priority && styles.placeholderText
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {formData.priority || t('breakdown.selectPriority')}
                  </Text>
                  <MaterialCommunityIcons 
                    name={showPriorityDropdown ? "chevron-up" : "chevron-down"} 
                    size={UI_CONSTANTS.ICON_SIZES.MD} 
                    color={UI_CONSTANTS.COLORS.TEXT_SECONDARY} 
                  />
                </TouchableOpacity>
                
                {showPriorityDropdown && (
                  <View style={styles.dropdownOptions}>
                    <ScrollView 
                      style={styles.dropdownScrollView}
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                    >
                      {priorityOptions.map((priority) => (
                        <TouchableOpacity
                          key={priority}
                          style={[
                            styles.dropdownOption,
                            formData.priority === priority && styles.selectedDropdownOption,
                          ]}
                          onPress={() => {
                            updateFormData('priority', priority);
                            setShowPriorityDropdown(false);
                          }}
                        >
                          <Text 
                            style={[
                              styles.dropdownOptionText,
                              formData.priority === priority && styles.selectedDropdownText,
                            ]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {priority}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
              <Text style={styles.columnDescription}>
                {t('breakdown.priorityDescription')}
              </Text>
            </View>

            {/* Upcoming Maintenance Date Column */}
            <View style={styles.columnContainer}>
              <Text 
                style={styles.columnLabel}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t('breakdown.upcomingMaintenanceDate')}
              </Text>
              <View style={styles.readOnlyField}>
                {loadingMaintenance ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#003667" />
                    <Text style={[styles.readOnlyText, { marginLeft: 8 }]}>
                      {t('common.loading')}
                    </Text>
                  </View>
                ) : (
                  <Text 
                    style={styles.readOnlyText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {upcomingMaintenanceDate || t('breakdown.noMaintenanceScheduled')}
                  </Text>
                )}
              </View>
              <Text style={styles.columnDescription}>
                {t('breakdown.maintenanceDateDescription')}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={[
          styles.actionButtons,
          RESPONSIVE_CONSTANTS.getActionButtonsLayout()
        ]}>
          <TouchableOpacity 
            style={[
              styles.cancelButton,
              RESPONSIVE_CONSTANTS.getButtonSize()
            ]} 
            onPress={handleCancel}
          >
            <Text 
              style={styles.cancelButtonText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.reportButton,
              RESPONSIVE_CONSTANTS.getButtonSize(),
              loading && styles.disabledButton
            ]} 
            onPress={handleReportBreakdown}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.buttonLoadingContainer}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text 
                  style={[styles.reportButtonText, { marginLeft: 8 }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {t('breakdown.submitting')}
                </Text>
              </View>
            ) : (
              <Text 
                style={styles.reportButtonText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t('breakdown.reportBreakdown')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <SideMenu
        visible={menuVisible}
        onClose={closeMenu}
        onLogout={handleLogout}
      />

      <CustomAlert {...alertConfig} />

      <Modal
        visible={showCreateReasonModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseCreateReason}
      >
        <TouchableWithoutFeedback onPress={handleCloseCreateReason}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.modalCard}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle} numberOfLines={1} ellipsizeMode="tail">
                    Create New Breakdown Code
                  </Text>
                  <TouchableOpacity onPress={handleCloseCreateReason} disabled={creatingReason}>
                    <MaterialCommunityIcons
                      name="close"
                      size={22}
                      color={UI_CONSTANTS.COLORS.PRIMARY}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalLabel} numberOfLines={1} ellipsizeMode="tail">
                  Reason
                </Text>
                <TextInput
                  style={styles.modalInput}
                  value={newReasonText}
                  onChangeText={setNewReasonText}
                  placeholder="e.g. Display Damage"
                  placeholderTextColor={UI_CONSTANTS.COLORS.TEXT_SECONDARY}
                  editable={!creatingReason}
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalCancelButton]}
                    onPress={handleCloseCreateReason}
                    disabled={creatingReason}
                  >
                    <Text style={styles.modalCancelText} numberOfLines={1} ellipsizeMode="tail">
                      {t('common.cancel')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalSaveButton, creatingReason && styles.disabledButton]}
                    onPress={handleCreateBreakdownReasonCode}
                    disabled={creatingReason}
                  >
                    {creatingReason ? (
                      <View style={styles.buttonLoadingContainer}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text style={[styles.modalSaveText, { marginLeft: 8 }]} numberOfLines={1} ellipsizeMode="tail">
                          {t('common.loading')}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.modalSaveText} numberOfLines={1} ellipsizeMode="tail">
                        {t('common.save')}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
  },
  appbarContainer: {
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
    paddingHorizontal: 0,
    ...Platform.select({
      ios: {
        // iOS handles safe area automatically
      },
      android: {
        // Android needs explicit handling
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  appbar: {
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
    elevation: 0,
    shadowOpacity: 0,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
  },
  menuButton: {
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
  appbarTitle: {
    color: UI_CONSTANTS.COLORS.WHITE,
    fontWeight: '600',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    alignSelf: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: UI_CONSTANTS.COLORS.BACKGROUND,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingTop: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingBottom: RESPONSIVE_CONSTANTS.SPACING.XXXL,
  },
  contentDesktop: {
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.XXL,
  },
  contentTablet: {
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.XL,
  },
  scrollContent: {
    paddingBottom: RESPONSIVE_CONSTANTS.SPACING.XXXL,
  },
  section: {
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    borderRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    padding: RESPONSIVE_CONSTANTS.SPACING.XL,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XL,
    ...UI_CONSTANTS.SHADOW,
  },
  sectionDesktop: {
    padding: RESPONSIVE_CONSTANTS.SPACING.XXL,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XXL,
  },
  sectionTablet: {
    padding: RESPONSIVE_CONSTANTS.SPACING.XL,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XL,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  sectionTitle: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.XL,
    fontWeight: 'bold',
    color: UI_CONSTANTS.COLORS.PRIMARY,
  },
  assetId: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: '600',
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
  },
  fieldContainer: {
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XL,
  },
  fieldLabel: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: '600',
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  readOnlyField: {
    borderWidth: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
    borderRadius: scale(10),
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    backgroundColor: UI_CONSTANTS.COLORS.GRAY_LIGHT,
  },
  readOnlyText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
    borderRadius: scale(10),
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    backgroundColor: UI_CONSTANTS.COLORS.GRAY_LIGHT,
  },
  statusIndicator: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: '#FFD700',
    marginRight: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  statusText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
    borderRadius: scale(10),
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    minHeight: RESPONSIVE_CONSTANTS.BUTTON_HEIGHT,
    ...UI_CONSTANTS.SHADOW,
  },
  dropdownButtonText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
  },
  placeholderText: {
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
  },
  dropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    borderWidth: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
    borderRadius: scale(10),
    marginTop: RESPONSIVE_CONSTANTS.SPACING.XS,
    zIndex: 9999,
    ...UI_CONSTANTS.SHADOW,
    maxHeight: 150, // Reduced height to prevent overlap
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONSTANTS.COLORS.GRAY_LIGHT,
  },
  dropdownOptionText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
  },
  dropdownScrollView: {
    maxHeight: 150,
  },
  createNewOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RESPONSIVE_CONSTANTS.SPACING.SM,
    borderBottomColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
  },
  createNewOptionText: {
    fontWeight: '700',
    color: UI_CONSTANTS.COLORS.PRIMARY,
  },
  selectedDropdownOption: {
    backgroundColor: '#F0F8FF',
  },
  dropdownOptionContent: {
    flex: 1,
  },
  dropdownOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XS,
    gap: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  dropdownOptionCode: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#003667',
    fontWeight: 'bold',
    minWidth: 40,
  },
  dropdownOptionTitle: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  dropdownOptionDescription: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    color: '#666',
    fontStyle: 'italic',
    marginLeft: scale(36), // Align with title text
  },
  selectedDropdownText: {
    color: '#003667',
  },
  selectedDropdownDescription: {
    color: '#003667',
    fontStyle: 'normal',
  },
  threeColumnLayout: {
    flexDirection: 'row',
    gap: RESPONSIVE_CONSTANTS.SPACING.LG,
    flexWrap: 'wrap',
  },
  columnContainer: {
    flex: 1,
    minWidth: scale(200),
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  columnLabel: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: '600',
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  columnDescription: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
    fontStyle: 'italic',
    marginTop: RESPONSIVE_CONSTANTS.SPACING.SM,
    lineHeight: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
    borderRadius: scale(10),
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    minHeight: RESPONSIVE_CONSTANTS.BUTTON_HEIGHT,
    ...UI_CONSTANTS.SHADOW,
  },
  textInputDesktop: {
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.LG,
    minHeight: scale(56),
  },
  textInputTablet: {
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    minHeight: scale(52),
  },
  textArea: {
    borderWidth: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
    borderRadius: scale(10),
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    minHeight: scale(100),
    textAlignVertical: 'top',
    ...UI_CONSTANTS.SHADOW,
  },
  textAreaDesktop: {
    minHeight: scale(120),
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  textAreaTablet: {
    minHeight: scale(110),
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: RESPONSIVE_CONSTANTS.SPACING.MD,
    marginTop: RESPONSIVE_CONSTANTS.SPACING.XL,
    marginBottom: scale(50),
  },
  cancelButton: {
    flex: 1,
    backgroundColor: UI_CONSTANTS.COLORS.GRAY_LIGHT,
    borderWidth: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
    borderRadius: scale(10),
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.LG,
    alignItems: 'center',
    ...UI_CONSTANTS.SHADOW,
  },
  cancelButtonText: {
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    fontWeight: '600',
  },
  reportButton: {
    flex: 1,
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
    borderRadius: scale(10),
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.LG,
    alignItems: 'center',
    ...UI_CONSTANTS.SHADOW,
  },
  reportButtonText: {
    color: UI_CONSTANTS.COLORS.WHITE,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    fontWeight: '600',
  },
  buttonLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#999',
    opacity: 0.7,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.XL,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    borderRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    padding: RESPONSIVE_CONSTANTS.SPACING.XL,
    ...UI_CONSTANTS.SHADOW,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.LG,
    gap: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  modalTitle: {
    flex: 1,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.XL,
    fontWeight: '700',
    color: UI_CONSTANTS.COLORS.PRIMARY,
  },
  modalLabel: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: '600',
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
    borderRadius: scale(10),
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    minHeight: RESPONSIVE_CONSTANTS.BUTTON_HEIGHT,
    ...UI_CONSTANTS.SHADOW,
  },
  modalActions: {
    flexDirection: 'row',
    gap: RESPONSIVE_CONSTANTS.SPACING.MD,
    marginTop: RESPONSIVE_CONSTANTS.SPACING.XL,
  },
  modalButton: {
    flex: 1,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.LG,
    borderRadius: scale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: UI_CONSTANTS.COLORS.GRAY_LIGHT,
    borderWidth: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
  },
  modalCancelText: {
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    fontWeight: '700',
  },
  modalSaveButton: {
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
  },
  modalSaveText: {
    color: UI_CONSTANTS.COLORS.WHITE,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    fontWeight: '700',
  },
});

export default BreakdownReportScreen;
