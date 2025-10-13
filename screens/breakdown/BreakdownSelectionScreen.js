import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import CustomAlert from '../../components/CustomAlert';
import { authUtils } from '../../utils/auth';
import SideMenu from '../../components/SideMenu';
import { useNavigation as useNavigationContext } from '../../context/NavigationContext';

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
      return Math.min(width * 0.8, 900);
    }
    if (DEVICE_TYPE === 'tablet') {
      return Math.min(width * 0.9, 700);
    }
    return width - scale(32); // Mobile: full width minus padding
  },

  getFilterLayout: () => {
    if (DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet') {
      return {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale(16),
      };
    }
    return {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(12),
    };
  },

  getTabLayout: () => {
    if (DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet') {
      return {
        flexDirection: 'row',
        marginBottom: scale(20),
        backgroundColor: '#F5F5F5',
        borderRadius: scale(8),
        padding: scale(4),
      };
    }
    return {
      flexDirection: 'row',
      marginBottom: scale(16),
      backgroundColor: '#F5F5F5',
      borderRadius: scale(8),
      padding: scale(4),
    };
  },

  getAssetCardLayout: () => {
    if (DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet') {
      return {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: scale(12),
      };
    }
    return {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: scale(10),
    };
  },

  getDetailRowLayout: () => {
    if (DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet') {
      return {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      };
    }
    return {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    };
  },
};

const BreakdownSelectionScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { hasAccess } = useNavigationContext();
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('select'); // 'select' or 'scan'
  const [selectedAssetType, setSelectedAssetType] = useState(t('breakdown.laptop'));
  const [showAssetTypeDropdown, setShowAssetTypeDropdown] = useState(false);
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

  // Mock data for asset types
  const assetTypes = [
    t('breakdown.laptop'), 
    t('breakdown.desktop'), 
    t('breakdown.monitor'), 
    t('breakdown.printer'), 
    t('breakdown.scanner'), 
    t('breakdown.networkDevice')
  ];

  // Mock data for available assets
  const [availableAssets, setAvailableAssets] = useState([
    {
      id: 'ASS001',
      assetTypeId: 'AT001',
      assetTypeName: t('breakdown.appleLaptop'),
      assetName: t('breakdown.macBookPro'),
      serviceVendorId: 'V002',
      productServiceId: 'PS001',
    },
    {
      id: 'ASS005',
      assetTypeId: 'AT001',
      assetTypeName: t('breakdown.laptop'),
      assetName: t('breakdown.dellPowerEdge'),
      serviceVendorId: 'V004',
      productServiceId: 'V004',
    },
    {
      id: 'ASS002',
      assetTypeId: 'AT001',
      assetTypeName: t('breakdown.dellXps13'),
      assetName: null,
      serviceVendorId: 'V002',
      productServiceId: 'PS001',
    },
    {
      id: 'ASS003',
      assetTypeId: 'AT001',
      assetTypeName: t('breakdown.hpEliteBook840'),
      assetName: null,
      serviceVendorId: 'V002',
      productServiceId: 'PS001',
    },
    {
      id: 'ASS004',
      assetTypeId: 'AT001',
      assetTypeName: t('breakdown.laptop'),
      assetName: t('breakdown.lenevoThinkPad'),
      serviceVendorId: 'V005',
      productServiceId: 'V005',
    },
  ]);

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

  const handleCreateBreakdown = (asset) => {
    // Prepare asset data for the breakdown report screen
    const assetData = {
      id: asset.id,
      assetType: asset.assetTypeName,
      assetName: asset.assetName || t('breakdown.null'),
      status: t('breakdown.breakdownReported'),
    };
    
    navigation.navigate('BREAKDOWNREPORT', { assetData });
  };

  const handleAssetPress = (asset) => {
    showAlert(t('breakdown.assetDetails'), `${t('breakdown.assetId')}: ${asset.id}\n${t('breakdown.assetTypeName')}: ${asset.assetTypeName}`, 'info');
  };

  const renderAssetItem = ({ item }) => (
    <View style={[
      styles.assetCard,
      DEVICE_TYPE === 'desktop' && styles.assetCardDesktop,
      DEVICE_TYPE === 'tablet' && styles.assetCardTablet
    ]}>
      <View style={[
        styles.assetHeader,
        RESPONSIVE_CONSTANTS.getAssetCardLayout()
      ]}>
        <TouchableOpacity onPress={() => handleAssetPress(item)}>
          <Text 
            style={styles.assetId}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.id}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.createBreakdownButton}
          onPress={() => handleCreateBreakdown(item)}
        >
          <Text 
            style={styles.createBreakdownButtonText}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {t('breakdown.createBreakdown')}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.assetDetails}>
        <View style={[
          styles.detailRow,
          RESPONSIVE_CONSTANTS.getDetailRowLayout()
        ]}>
          <Text 
            style={styles.detailLabel}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {t('breakdown.assetTypeId')}:
          </Text>
          <Text 
            style={styles.detailValue}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.assetTypeId}
          </Text>
        </View>
        <View style={[
          styles.detailRow,
          RESPONSIVE_CONSTANTS.getDetailRowLayout()
        ]}>
          <Text 
            style={styles.detailLabel}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {t('breakdown.assetTypeName')}:
          </Text>
          <Text 
            style={styles.detailValue}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.assetTypeName}
          </Text>
        </View>
        <View style={[
          styles.detailRow,
          RESPONSIVE_CONSTANTS.getDetailRowLayout()
        ]}>
          <Text 
            style={styles.detailLabel}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {t('breakdown.assetName')}:
          </Text>
          <Text 
            style={styles.detailValue}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.assetName || t('breakdown.null')}
          </Text>
        </View>
        <View style={[
          styles.detailRow,
          RESPONSIVE_CONSTANTS.getDetailRowLayout()
        ]}>
          <Text 
            style={styles.detailLabel}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {t('breakdown.serviceVendorId')}:
          </Text>
          <Text 
            style={styles.detailValue}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.serviceVendorId}
          </Text>
        </View>
        <View style={[
          styles.detailRow,
          RESPONSIVE_CONSTANTS.getDetailRowLayout()
        ]}>
          <Text 
            style={styles.detailLabel}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {t('breakdown.productServiceId')}:
          </Text>
          <Text 
            style={styles.detailValue}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.productServiceId}
          </Text>
        </View>
      </View>
    </View>
  );

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
              {t('breakdown.breakdownSelection')}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Breakdown Selection Section */}
          <View style={[
            styles.selectionSection,
            { width: RESPONSIVE_CONSTANTS.getSectionWidth() },
            DEVICE_TYPE === 'desktop' && styles.selectionSectionDesktop,
            DEVICE_TYPE === 'tablet' && styles.selectionSectionTablet,
          ]}>
          <Text 
            style={styles.sectionTitle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {t('breakdown.breakdownSelection')}
          </Text>
          
          {/* Tabs */}
          <View style={[
            styles.tabContainer,
            RESPONSIVE_CONSTANTS.getTabLayout()
          ]}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'select' && styles.activeTab]}
              onPress={() => setActiveTab('select')}
            >
              <Text 
                style={[styles.tabText, activeTab === 'select' && styles.activeTabText]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t('breakdown.selectAsset')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'scan' && styles.activeTab]}
              onPress={() => setActiveTab('scan')}
            >
              <Text 
                style={[styles.tabText, activeTab === 'scan' && styles.activeTabText]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t('scanning.scanAsset')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Asset Type Filter */}
          <View style={[
            styles.filterContainer,
            RESPONSIVE_CONSTANTS.getFilterLayout()
          ]}>
            <Text 
              style={styles.filterLabel}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('breakdown.assetTypeName')}
            </Text>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowAssetTypeDropdown(!showAssetTypeDropdown)}
              >
                <Text 
                  style={styles.dropdownButtonText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {selectedAssetType}
                </Text>
                <MaterialCommunityIcons
                  name={showAssetTypeDropdown ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#003667"
                />
              </TouchableOpacity>
              
              {showAssetTypeDropdown && (
                <View style={styles.dropdownOptions}>
                  {assetTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={styles.dropdownOption}
                      onPress={() => {
                        setSelectedAssetType(type);
                        setShowAssetTypeDropdown(false);
                      }}
                    >
                      <Text 
                        style={styles.dropdownOptionText}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Available Assets Section */}
        <View style={[
          styles.assetsSection,
          { width: RESPONSIVE_CONSTANTS.getSectionWidth() },
          DEVICE_TYPE === 'desktop' && styles.assetsSectionDesktop,
          DEVICE_TYPE === 'tablet' && styles.assetsSectionTablet
        ]}>
          <View style={styles.assetsHeader}>
            <Text 
              style={styles.sectionTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('breakdown.availableAssets')}
            </Text>
            <TouchableOpacity style={styles.expandButton}>
              <MaterialCommunityIcons
                name="fullscreen"
                size={20}
                color="#003667"
              />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={availableAssets}
            renderItem={renderAssetItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.assetsList,
              DEVICE_TYPE === 'desktop' && styles.assetsListDesktop,
              DEVICE_TYPE === 'tablet' && styles.assetsListTablet
            ]}
          />
          </View>
        </View>

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
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingTop: RESPONSIVE_CONSTANTS.SPACING.LG,
    alignItems: 'center',
  },
  selectionSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    padding: RESPONSIVE_CONSTANTS.SPACING.XL,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XL,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectionSectionDesktop: {
    padding: RESPONSIVE_CONSTANTS.SPACING.XXL,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XXL,
  },
  selectionSectionTablet: {
    padding: RESPONSIVE_CONSTANTS.SPACING.XL,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XL,
  },
  sectionTitle: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.XL,
    fontWeight: 'bold',
    color: '#003667',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XL,
    backgroundColor: '#F5F5F5',
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.SM,
    padding: RESPONSIVE_CONSTANTS.SPACING.XS,
  },
  tab: {
    flex: 1,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    alignItems: 'center',
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: '500',
    color: '#616161',
  },
  activeTabText: {
    color: '#003667',
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  filterLabel: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: '600',
    color: '#333',
    minWidth: scale(120),
    textAlign: 'left',
  },
  dropdownContainer: {
    flex: 1,
    position: 'relative',
    maxWidth: scale(200),
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: scale(10),
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    backgroundColor: '#FFFFFF',
    minHeight: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownButtonText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#333',
    fontWeight: '500',
  },
  dropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: scale(10),
    marginTop: RESPONSIVE_CONSTANTS.SPACING.XS,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  dropdownOption: {
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  dropdownOptionText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#333',
    fontWeight: '500',
  },
  assetsSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    padding: RESPONSIVE_CONSTANTS.SPACING.XL,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  assetsSectionDesktop: {
    padding: RESPONSIVE_CONSTANTS.SPACING.XXL,
  },
  assetsSectionTablet: {
    padding: RESPONSIVE_CONSTANTS.SPACING.XL,
  },
  assetsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  expandButton: {
    padding: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  assetsList: {
    paddingBottom: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  assetsListDesktop: {
    paddingBottom: RESPONSIVE_CONSTANTS.SPACING.XXL,
  },
  assetsListTablet: {
    paddingBottom: RESPONSIVE_CONSTANTS.SPACING.XL,
  },
  assetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    padding: RESPONSIVE_CONSTANTS.SPACING.LG,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
    borderWidth: 1,
    borderColor: '#F5F5F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  assetCardDesktop: {
    padding: RESPONSIVE_CONSTANTS.SPACING.XL,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  assetCardTablet: {
    padding: RESPONSIVE_CONSTANTS.SPACING.LG,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  assetId: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    fontWeight: '600',
    color: '#003667',
    textDecorationLine: 'underline',
  },
  createBreakdownButton: {
    backgroundColor: '#003667',
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.SM,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.SM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  createBreakdownButtonText: {
    color: '#FFFFFF',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: '600',
  },
  assetDetails: {
    gap: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#616161',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
});

export default BreakdownSelectionScreen;
