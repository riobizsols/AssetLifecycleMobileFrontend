import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import CustomAlert from '../../components/CustomAlert';
import { authUtils } from '../../utils/auth';
import SideMenu from '../../components/SideMenu';
import { getServerUrl, getApiHeaders, API_ENDPOINTS } from '../../config/api';

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
  if (width >= BREAKPOINTS.DESKTOP) {
    return 'desktop';
  }
  if (width >= BREAKPOINTS.TABLET) {
    return 'tablet';
  }
  if (width >= BREAKPOINTS.LARGE) {
    return 'large';
  }
  if (width >= BREAKPOINTS.MEDIUM) {
    return 'medium';
  }
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
  INPUT_HEIGHT: verticalScale(48),
  BUTTON_HEIGHT: verticalScale(48),

  // Responsive layout
  getSectionWidth: () => {
    if (DEVICE_TYPE === 'desktop') {
      return Math.min(width * 0.8, 800);
    }
    if (DEVICE_TYPE === 'tablet') {
      return Math.min(width * 0.9, 700);
    }
    return width - scale(32); // Mobile: full width minus padding
  },

  getActionButtonsLayout: () => {
    if (DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet') {
      return {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: scale(16),
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
        flex: 1,
        paddingVertical: scale(16),
        minHeight: verticalScale(48),
      };
    }
    return {
      width: '100%',
      paddingVertical: scale(16),
      minHeight: verticalScale(48),
    };
  },
};

const UpdateBreakdownScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
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

  // Get breakdown data from navigation params
  const breakdownData = route.params?.breakdownData || {};

  // Form state
  const [formData, setFormData] = useState({
    atbrrc_id: breakdownData.atbrrc_id || '',
    description: breakdownData.description || '',
    decision_code: breakdownData.decision_code || '',
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

  const [showBreakdownCodeDropdown, setShowBreakdownCodeDropdown] = useState(false);

  // Fetch breakdown reason codes on component mount
  useEffect(() => {
    fetchBreakdownReasonCodes();
  }, []);

  // State to store asset type ID (from breakdownData or fetched from asset)
  const [assetTypeId, setAssetTypeId] = useState(null);

  // Fetch asset details to get asset_type_id if not available in breakdownData
  useEffect(() => {
    const fetchAssetTypeId = async () => {
      // First, check if asset_type_id is already in breakdownData
      if (breakdownData.asset_type_id) {
        setAssetTypeId(breakdownData.asset_type_id);
        return;
      }

      // If not, try to fetch it from asset details
      if (breakdownData.asset_id) {
        try {
          const serverUrl = getServerUrl();
          const endpoint = API_ENDPOINTS.GET_ASSET_DETAILS(breakdownData.asset_id);
          const url = `${serverUrl}${endpoint}`;

          console.log('Fetching asset details to get asset_type_id:', url);

          const response = await fetch(url, {
            method: 'GET',
            headers: await getApiHeaders(),
          });

          if (response.ok) {
            const data = await response.json();
            // Handle different response structures
            const assetData = data.data || data.asset || data;
            const fetchedAssetTypeId = assetData.asset_type_id || assetData.assetTypeId;
            
            if (fetchedAssetTypeId) {
              setAssetTypeId(fetchedAssetTypeId);
              console.log('Fetched asset_type_id from asset details:', fetchedAssetTypeId);
            } else {
              console.warn('Asset details fetched but no asset_type_id found');
            }
          } else {
            console.warn('Failed to fetch asset details:', response.status);
          }
        } catch (error) {
          console.error('Error fetching asset details:', error);
          // Continue without asset_type_id - will show all codes
        }
      }
    };

    fetchAssetTypeId();
  }, [breakdownData.asset_id, breakdownData.asset_type_id]);

  // Filter breakdown codes by asset type when breakdown codes or asset type changes
  useEffect(() => {
    if (breakdownCodes.length > 0 && assetTypeId) {
      const filtered = breakdownCodes.filter(code => {
        const codeAssetTypeId = typeof code === 'object' ? code.asset_type_id : null;
        return codeAssetTypeId === assetTypeId;
      });
      setFilteredBreakdownCodes(filtered);
      console.log('Filtered breakdown codes by asset_type_id:', assetTypeId, 'Found:', filtered.length);
    } else if (breakdownCodes.length > 0) {
      // If no asset_type_id available, show all codes (fallback)
      console.warn('No asset_type_id available, showing all codes');
      setFilteredBreakdownCodes(breakdownCodes);
    } else {
      setFilteredBreakdownCodes([]);
    }
  }, [breakdownCodes, assetTypeId]);

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

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const handleCancel = () => {
    // Close all dropdowns before navigating
    setShowBreakdownCodeDropdown(false);
    navigation.goBack();
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdateBreakdown = async () => {
    // Validate form
    if (!formData.atbrrc_id) {
      showAlert(
        t('alerts.validationError'),
        t('breakdown.validation.breakdownCodeRequired'),
        'error'
      );
      return;
    }

    // Validate breakdown code exists in available codes (use filtered codes)
    const codesToCheck = filteredBreakdownCodes.length > 0 ? filteredBreakdownCodes : breakdownCodes;
    const isValidCode = codesToCheck.some(code => {
      const codeId = typeof code === 'string' ? code : code.id;
      return codeId === formData.atbrrc_id;
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

    // Decision code is read-only, so it should always be present from breakdownData
    // No validation needed as it's not user-editable

    setLoading(true);

    try {
      const serverUrl = getServerUrl();
      const endpoint = API_ENDPOINTS.UPDATE_BREAKDOWN_REPORT(breakdownData.abr_id);
      const url = `${serverUrl}${endpoint}`;

      const requestBody = {
        atbrrc_id: formData.atbrrc_id,
        description: formData.description,
        decision_code: formData.decision_code,
      };

      console.log('Updating breakdown report:', url, requestBody);

      const response = await fetch(url, {
        method: 'PUT',
        headers: await getApiHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Breakdown report updated successfully:', data);

      showAlert(
        t('common.success'),
        t('breakdown.updateSuccessfully'),
        'success',
        () => {
          navigation.goBack();
        }
      );
    } catch (error) {
      console.error('Error updating breakdown report:', error);
      
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
      let displayMessage = t('breakdown.errors.updateError');
      
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
        displayMessage = t('breakdown.errors.updateErrorDetails', { message: parsedError.message });
      } else if (errorMessage) {
        displayMessage = t('breakdown.errors.updateErrorDetails', { message: errorMessage });
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

  return (
    <SafeAreaProvider>
      <View style={[styles.safeContainer, { paddingTop: insets.top }]}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#003667"
          translucent={Platform.OS === 'android'}
        />
        {/* AppBar */}
        <View style={styles.appbarContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleCancel}
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
              {t('breakdown.updateBreakdown')}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Card with Breakdown ID */}
          <View style={styles.headerCard}>
            <View style={styles.headerCardContent}>
              <View style={styles.headerIconContainer}>
                <MaterialCommunityIcons name="file-document-edit" size={32} color="#FEC200" />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerLabel}>Breakdown ID</Text>
                <Text style={styles.headerValue}>{breakdownData.abr_id}</Text>
              </View>
            </View>
            <View style={styles.headerDivider} />
            <View style={styles.assetInfoRow}>
              <MaterialCommunityIcons name="package-variant" size={20} color="#003667" />
              <Text style={styles.assetIdLabel}>Asset ID:</Text>
              <Text style={styles.assetIdValue}>{breakdownData.asset_id}</Text>
            </View>
          </View>

          {/* Update Form Card */}
          <View style={styles.formCard}>
            <View style={styles.formCardHeader}>
              <MaterialCommunityIcons name="pencil-box" size={24} color="#003667" />
              <Text style={styles.formCardTitle}>{t('breakdown.updateInformation')}</Text>
            </View>

            {/* Breakdown Code Field */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <MaterialCommunityIcons name="code-tags" size={18} color="#003667" />
                <Text style={styles.inputLabel}>{t('breakdown.breakdownCodeAtbrrcId')}</Text>
              </View>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={styles.modernDropdownButton}
                  onPress={() => setShowBreakdownCodeDropdown(!showBreakdownCodeDropdown)}
                >
                  <Text style={[
                    styles.dropdownButtonText,
                    !formData.atbrrc_id && styles.placeholderText,
                  ]}>
                    {formData.atbrrc_id || t('breakdown.selectCode')}
                  </Text>
                  <MaterialCommunityIcons
                    name={showBreakdownCodeDropdown ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color="#003667"
                  />
                </TouchableOpacity>

                {showBreakdownCodeDropdown && (
                  <View style={styles.dropdownOptions}>
                    <ScrollView
                      style={styles.dropdownScrollView}
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                    >
                      {(filteredBreakdownCodes.length > 0 ? filteredBreakdownCodes : breakdownCodes).length > 0 ? (
                        (filteredBreakdownCodes.length > 0 ? filteredBreakdownCodes : breakdownCodes).map((item) => {
                          const code = typeof item === 'string' ? item : item.id;
                          const displayText = typeof item === 'string' ? item : `${item.id} - ${item.text}`;
                          return (
                            <TouchableOpacity
                              key={code}
                              style={styles.modernDropdownOption}
                              onPress={() => {
                                updateFormData('atbrrc_id', code);
                                setShowBreakdownCodeDropdown(false);
                              }}
                            >
                              <MaterialCommunityIcons name="check-circle" size={18} color="#FEC200" />
                              <Text style={styles.dropdownOptionText}>{displayText}</Text>
                            </TouchableOpacity>
                          );
                        })
                      ) : (
                        <View style={styles.modernDropdownOption}>
                          <MaterialCommunityIcons name="alert-circle" size={18} color="#999" />
                          <Text style={[styles.dropdownOptionText, { color: '#999' }]}>
                            {t('breakdown.noCodesAvailable')}
                          </Text>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {/* Description Field */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <MaterialCommunityIcons name="text-box" size={18} color="#003667" />
                <Text style={styles.inputLabel}>{t('breakdown.description')}</Text>
              </View>
              <View style={styles.textAreaContainer}>
                <TextInput
                  style={styles.modernTextArea}
                  placeholder={t('breakdown.describeIssuePlaceholder')}
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet' ? 5 : 4}
                  textAlignVertical="top"
                  value={formData.description}
                  onChangeText={(text) => updateFormData('description', text)}
                />
                <View style={styles.charCountContainer}>
                  <Text style={styles.charCount}>{formData.description.length} characters</Text>
                </View>
              </View>
            </View>

            {/* Decision Code Field - Read Only */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <MaterialCommunityIcons name="checkbox-marked-circle" size={18} color="#003667" />
                <Text style={styles.inputLabel}>{t('breakdown.decisionCode')}</Text>
                <View style={styles.readOnlyBadge}>
                  <Text style={styles.readOnlyBadgeText}>Read Only</Text>
                </View>
              </View>
              <View style={styles.dropdownContainer}>
                <View style={[styles.modernDropdownButton, styles.readOnlyDropdownButton]}>
                  <Text style={[
                    styles.dropdownButtonText,
                    styles.readOnlyText,
                    !formData.decision_code && styles.placeholderText,
                  ]}>
                    {formData.decision_code
                      ? (() => {
                          const selectedItem = decisionCodes.find(item => item.code === formData.decision_code);
                          return selectedItem ? `${selectedItem.code} - ${selectedItem.title}` : formData.decision_code;
                        })()
                      : t('breakdown.selectDecisionCode')
                    }
                  </Text>
                  <MaterialCommunityIcons
                    name="lock"
                    size={20}
                    color="#999"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.modernCancelButton}
              onPress={handleCancel}
            >
              <MaterialCommunityIcons name="close-circle" size={20} color="#616161" />
              <Text style={styles.modernCancelButtonText}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modernUpdateButton,
                loading && styles.disabledButton,
              ]}
              onPress={handleUpdateBreakdown}
              disabled={loading}
            >
              {loading ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.modernUpdateButtonText}>Updating...</Text>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons name="check-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.modernUpdateButtonText}>
                    {t('breakdown.updateBreakdown')}
                  </Text>
                </>
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
      </View>
    </SafeAreaProvider>
  );
};


const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#003667',
  },
  appbarContainer: {
    backgroundColor: '#003667',
    height: verticalScale(56),
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
  appbarTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    alignSelf: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#EEEEEE',
  },
  scrollContent: {
    padding: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingBottom: RESPONSIVE_CONSTANTS.SPACING.XXXL,
  },
  // Header Card Styles
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.LG,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderLeftWidth: 6,
    borderLeftColor: '#FEC200',
    overflow: 'hidden',
  },
  headerCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: RESPONSIVE_CONSTANTS.SPACING.XL,
    backgroundColor: '#F8F9FA',
  },
  headerIconContainer: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    backgroundColor: '#003667',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerLabel: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    color: '#616161',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XS,
  },
  headerValue: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: '#003667',
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  assetInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: RESPONSIVE_CONSTANTS.SPACING.LG,
    gap: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  assetIdLabel: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#616161',
    fontWeight: '600',
    marginLeft: RESPONSIVE_CONSTANTS.SPACING.XS,
  },
  assetIdValue: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#003667',
    fontWeight: 'bold',
  },
  // Form Card Styles
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.LG,
    padding: RESPONSIVE_CONSTANTS.SPACING.XL,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XL,
    paddingBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
    borderBottomWidth: 2,
    borderBottomColor: '#FEC200',
    gap: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  formCardTitle: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.XL,
    fontWeight: 'bold',
    color: '#003667',
  },
  inputGroup: {
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XL,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.SM,
    gap: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  inputLabel: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: '600',
    color: '#003667',
  },
  dropdownContainer: {
    position: 'relative',
  },
  modernDropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: scale(12),
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    backgroundColor: '#F8F9FA',
    minHeight: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
  },
  dropdownButtonText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#333',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#999',
    fontStyle: 'italic',
  },
  dropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: scale(12),
    marginTop: RESPONSIVE_CONSTANTS.SPACING.SM,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
    maxHeight: 200,
    overflow: 'hidden',
  },
  dropdownOptionsUpward: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: scale(12),
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.SM,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
    maxHeight: 200,
    overflow: 'hidden',
  },
  modernDropdownOption: {
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
  dropdownOptionText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#333',
    fontWeight: '500',
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  textAreaContainer: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: scale(12),
    backgroundColor: '#F8F9FA',
    overflow: 'hidden',
  },
  modernTextArea: {
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    minHeight: DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet' ? 120 : 100,
    textAlignVertical: 'top',
    color: '#333',
  },
  charCountContainer: {
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.SM,
    backgroundColor: '#EEEEEE',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  charCount: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.XS,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'right',
  },
  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: RESPONSIVE_CONSTANTS.SPACING.MD,
    marginTop: RESPONSIVE_CONSTANTS.SPACING.LG,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XL,
  },
  modernCancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: scale(12),
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.LG,
    gap: RESPONSIVE_CONSTANTS.SPACING.SM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modernCancelButtonText: {
    color: '#616161',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: '700',
  },
  modernUpdateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#003667',
    borderRadius: scale(12),
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.LG,
    gap: RESPONSIVE_CONSTANTS.SPACING.SM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  modernUpdateButtonText: {
    color: '#FFFFFF',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: '700',
  },
  disabledButton: {
    backgroundColor: '#999',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  // Read-only styles
  readOnlyBadge: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.SM,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.XS,
    borderRadius: scale(4),
    marginLeft: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  readOnlyBadgeText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.XS,
    color: '#616161',
    fontWeight: '600',
  },
  readOnlyDropdownButton: {
    backgroundColor: '#F5F5F5',
    borderColor: '#D0D0D0',
    opacity: 0.8,
  },
  readOnlyText: {
    color: '#616161',
  },
});

export default UpdateBreakdownScreen;
