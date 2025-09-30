import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Appbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  INPUT_HEIGHT: verticalScale(48),
  BUTTON_HEIGHT: verticalScale(48),
  
  // Responsive layout
  getSectionWidth: () => {
    if (DEVICE_TYPE === 'desktop') return Math.min(width * 0.8, 800);
    if (DEVICE_TYPE === 'tablet') return Math.min(width * 0.9, 700);
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
  const { hasAccess } = useNavigationContext();
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
  const [decisionCodes] = useState(['BF01', 'BF02', 'BF03', 'BF04', 'BF05']);

  const [showBreakdownCodeDropdown, setShowBreakdownCodeDropdown] = useState(false);
  const [showDecisionCodeDropdown, setShowDecisionCodeDropdown] = useState(false);
  const [showDecisionCodeDropdownUpward, setShowDecisionCodeDropdownUpward] = useState(false);

  // Fetch breakdown reason codes on component mount
  useEffect(() => {
    fetchBreakdownReasonCodes();
  }, []);

  // Fetch breakdown reason codes from API
  const fetchBreakdownReasonCodes = async () => {
    try {
      const serverUrl = getServerUrl();
      const endpoint = API_ENDPOINTS.GET_BREAKDOWN_REASON_CODES('ORG001');
      const url = `${serverUrl}${endpoint}`;

      console.log('Fetching breakdown reason codes:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: getApiHeaders(),
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

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const handleCancel = () => {
    // Close all dropdowns before navigating
    setShowBreakdownCodeDropdown(false);
    setShowDecisionCodeDropdown(false);
    setShowDecisionCodeDropdownUpward(false);
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
      showAlert(t('common.validationError'), t('breakdown.pleaseSelectBreakdownCode'), 'error');
      return;
    }

    if (!formData.description.trim()) {
      showAlert(t('common.validationError'), t('breakdown.pleaseProvideDescription'), 'error');
      return;
    }

    if (!formData.decision_code) {
      showAlert(t('common.validationError'), t('breakdown.pleaseSelectDecisionCode'), 'error');
      return;
    }

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
        headers: getApiHeaders(),
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
      showAlert(
        t('breakdown.error'),
        `${t('breakdown.failedToUpdateBreakdown')}: ${error.message}`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* AppBar */}
      <Appbar.Header style={styles.appbar}>
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
            {t('breakdown.updateBreakdown')}
          </Text>
        </View>
      </Appbar.Header>

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
        {/* Breakdown Details Section */}
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
              {t('breakdown.breakdownDetails')}
            </Text>
            <Text 
              style={styles.breakdownId}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              ID: {breakdownData.abr_id}
            </Text>
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{t('breakdown.assetId')}</Text>
            <View style={styles.readOnlyField}>
              <Text 
                style={styles.readOnlyText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {breakdownData.asset_id}
              </Text>
            </View>
          </View>
        </View>

        {/* Update Information Section */}
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
            {t('breakdown.updateInformation')}
          </Text>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{t('breakdown.breakdownCodeAtbrrcId')}</Text>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowBreakdownCodeDropdown(!showBreakdownCodeDropdown)}
              >
                <Text style={[
                  styles.dropdownButtonText,
                  !formData.atbrrc_id && styles.placeholderText
                ]}>
                  {formData.atbrrc_id || t('breakdown.selectCode')}
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
                    {breakdownCodes.length > 0 ? (
                      breakdownCodes.map((item) => {
                        const code = typeof item === 'string' ? item : item.id;
                        const displayText = typeof item === 'string' ? item : `${item.id} - ${item.text}`;
                        return (
                          <TouchableOpacity
                            key={code}
                            style={styles.dropdownOption}
                            onPress={() => {
                              updateFormData('atbrrc_id', code);
                              setShowBreakdownCodeDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownOptionText}>{displayText}</Text>
                          </TouchableOpacity>
                        );
                      })
                    ) : (
                      <View style={styles.dropdownOption}>
                        <Text style={[styles.dropdownOptionText, { color: UI_CONSTANTS.COLORS.GRAY_DARK }]}>
                          {t('breakdown.noCodesAvailable')}
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{t('breakdown.description')}</Text>
            <TextInput
              style={styles.textArea}
              placeholder={t('breakdown.describeIssuePlaceholder')}
              placeholderTextColor={UI_CONSTANTS.COLORS.GRAY_DARK}
              multiline
              numberOfLines={DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet' ? 5 : 4}
              textAlignVertical="top"
              value={formData.description}
              onChangeText={(text) => updateFormData('description', text)}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{t('breakdown.decisionCode')}</Text>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => {
                  // For decision code dropdown, always show upward to avoid button overlap
                  setShowDecisionCodeDropdown(false);
                  setShowDecisionCodeDropdownUpward(!showDecisionCodeDropdownUpward);
                }}
              >
                <Text style={[
                  styles.dropdownButtonText,
                  !formData.decision_code && styles.placeholderText
                ]}>
                  {formData.decision_code || t('breakdown.selectDecisionCode')}
                </Text>
                <MaterialCommunityIcons 
                  name={showDecisionCodeDropdownUpward ? "chevron-down" : "chevron-up"} 
                  size={UI_CONSTANTS.ICON_SIZES.MD} 
                  color={UI_CONSTANTS.COLORS.TEXT_SECONDARY} 
                />
              </TouchableOpacity>
              
              {showDecisionCodeDropdownUpward && (
                <View style={styles.dropdownOptionsUpward}>
                  <ScrollView 
                    style={styles.dropdownScrollView}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    {decisionCodes.map((code) => (
                      <TouchableOpacity
                        key={code}
                        style={styles.dropdownOption}
                        onPress={() => {
                          updateFormData('decision_code', code);
                          setShowDecisionCodeDropdownUpward(false);
                        }}
                      >
                        <Text style={styles.dropdownOptionText}>{code}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
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
              styles.updateButton, 
              RESPONSIVE_CONSTANTS.getButtonSize(),
              loading && styles.disabledButton
            ]} 
            onPress={handleUpdateBreakdown}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={UI_CONSTANTS.COLORS.WHITE} />
            ) : (
              <Text 
                style={styles.updateButtonText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t('breakdown.updateBreakdown')}
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
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONSTANTS.COLORS.BACKGROUND,
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
    alignItems: 'center',
    paddingBottom: RESPONSIVE_CONSTANTS.SPACING.XXXL,
  },
  section: {
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.LG,
    padding: RESPONSIVE_CONSTANTS.SPACING.XL,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XL,
    shadowColor: UI_CONSTANTS.COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
  },
  sectionDesktop: {
    maxWidth: 800,
    alignSelf: 'center',
  },
  sectionTablet: {
    maxWidth: 700,
    alignSelf: 'center',
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
  breakdownId: {
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
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.MD,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    backgroundColor: UI_CONSTANTS.COLORS.GRAY_LIGHT,
    minHeight: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
    justifyContent: 'center',
  },
  readOnlyText: {
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
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.MD,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    shadowColor: UI_CONSTANTS.COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
  },
  dropdownButtonText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
  },
  placeholderText: {
    color: UI_CONSTANTS.COLORS.GRAY_DARK,
  },
  dropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    borderWidth: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.MD,
    marginTop: RESPONSIVE_CONSTANTS.SPACING.XS,
    zIndex: 9999,
    shadowColor: UI_CONSTANTS.COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    maxHeight: 150, // Reduced height to prevent overlap
    overflow: 'hidden',
  },
  dropdownOptionsUpward: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    borderWidth: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.MD,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XS,
    zIndex: 9999,
    shadowColor: UI_CONSTANTS.COLORS.BLACK,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
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
  textArea: {
    borderWidth: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.MD,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    minHeight: DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet' ? 120 : 100,
    textAlignVertical: 'top',
    shadowColor: UI_CONSTANTS.COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: RESPONSIVE_CONSTANTS.SPACING.MD,
    marginTop: RESPONSIVE_CONSTANTS.SPACING.XL,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XXXL,
    width: '100%',
  },
  cancelButton: {
    backgroundColor: UI_CONSTANTS.COLORS.GRAY_LIGHT,
    borderWidth: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.MD,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.LG,
    alignItems: 'center',
    shadowColor: UI_CONSTANTS.COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButtonText: {
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    fontWeight: '600',
  },
  updateButton: {
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.MD,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.LG,
    alignItems: 'center',
    shadowColor: UI_CONSTANTS.COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  updateButtonText: {
    color: UI_CONSTANTS.COLORS.WHITE,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: UI_CONSTANTS.COLORS.GRAY_DARK,
    shadowOpacity: 0.1,
  },
});

export default UpdateBreakdownScreen;
