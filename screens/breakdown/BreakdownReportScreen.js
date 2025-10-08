import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
  StatusBar,
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
  const [showMaintenanceDropdown, setShowMaintenanceDropdown] = useState(false);
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
  };

  // Form state
  const [formData, setFormData] = useState({
    breakdownCode: '',
    description: '',
    createMaintenance: t('breakdown.yes'),
    maintenanceDate: '',
  });

  // State for API data
  const [breakdownCodes, setBreakdownCodes] = useState([]);
  const maintenanceOptions = [t('breakdown.yes'), t('breakdown.no')];

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
    navigation.goBack();
  };

  const handleReportBreakdown = () => {
    // Validate form
    if (!formData.breakdownCode) {
      showAlert(t('common.validationError'), t('breakdown.pleaseSelectBreakdownCode'), 'error');
      return;
    }

    if (!formData.description.trim()) {
      showAlert(t('common.validationError'), t('breakdown.pleaseProvideDescription'), 'error');
      return;
    }

    if (formData.createMaintenance === 'Yes' && !formData.maintenanceDate) {
      showAlert(t('common.validationError'), t('breakdown.pleaseSelectMaintenanceDate'), 'error');
      return;
    }

    showAlert(
      t('common.success'),
      t('breakdown.reportSubmittedSuccessfully'),
      'success',
      () => {
        navigation.navigate('REPORTBREAKDOWN');
      }
    );
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
                    {breakdownCodes.length > 0 ? (
                      breakdownCodes.map((item) => {
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
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {t('breakdown.noCodesAvailable')}
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

        {/* Maintenance Planning Section */}
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
            {t('breakdown.maintenancePlanning')}
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
              {t('breakdown.createMaintenance')}
            </Text>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowMaintenanceDropdown(!showMaintenanceDropdown)}
              >
                <Text 
                  style={styles.dropdownButtonText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {formData.createMaintenance}
                </Text>
                <MaterialCommunityIcons 
                  name={showMaintenanceDropdown ? "chevron-up" : "chevron-down"} 
                  size={UI_CONSTANTS.ICON_SIZES.MD} 
                  color={UI_CONSTANTS.COLORS.TEXT_SECONDARY} 
                />
              </TouchableOpacity>
              
              {showMaintenanceDropdown && (
                <View style={styles.dropdownOptions}>
                  <ScrollView 
                    style={styles.dropdownScrollView}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    {maintenanceOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={styles.dropdownOption}
                        onPress={() => {
                          updateFormData('createMaintenance', option);
                          setShowMaintenanceDropdown(false);
                        }}
                      >
                        <Text 
                          style={styles.dropdownOptionText}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {formData.createMaintenance === 'Yes' && (
            <View style={[
              styles.fieldContainer,
              RESPONSIVE_CONSTANTS.getFieldLayout()
            ]}>
              <Text 
                style={styles.fieldLabel}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t('breakdown.upcomingMaintenanceDate')}
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  DEVICE_TYPE === 'desktop' && styles.textInputDesktop,
                  DEVICE_TYPE === 'tablet' && styles.textInputTablet
                ]}
                placeholder={t('breakdown.dateFormatPlaceholder')}
                placeholderTextColor={UI_CONSTANTS.COLORS.TEXT_SECONDARY}
                value={formData.maintenanceDate}
                onChangeText={(text) => updateFormData('maintenanceDate', text)}
              />
            </View>
          )}
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
              RESPONSIVE_CONSTANTS.getButtonSize()
            ]} 
            onPress={handleReportBreakdown}
          >
            <Text 
              style={styles.reportButtonText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('breakdown.reportBreakdown')}
            </Text>
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
});

export default BreakdownReportScreen;
