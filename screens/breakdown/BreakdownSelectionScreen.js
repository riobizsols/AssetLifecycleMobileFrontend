import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
} from 'react-native';
import { Appbar } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import CustomAlert from '../../components/CustomAlert';
import { authUtils } from '../../utils/auth';
import SideMenu from '../../components/SideMenu';
import { useNavigation as useNavigationContext } from '../../context/NavigationContext';
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
        backgroundColor: UI_CONSTANTS.COLORS.GRAY_LIGHT,
        borderRadius: scale(8),
        padding: scale(4),
      };
    }
    return {
      flexDirection: 'row',
      marginBottom: scale(16),
      backgroundColor: UI_CONSTANTS.COLORS.GRAY_LIGHT,
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
    <SafeAreaView style={styles.container}>
      {/* AppBar */}
      <Appbar.Header style={styles.appbar}>
        <TouchableOpacity 
          style={styles.menuButton} 
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
            {t('breakdown.breakdownSelection')}
          </Text>
        </View>
      </Appbar.Header>

      <View style={[
        styles.content,
        DEVICE_TYPE === 'desktop' && styles.contentDesktop,
        DEVICE_TYPE === 'tablet' && styles.contentTablet
      ]}>
        {/* Breakdown Selection Section */}
        <View style={[
          styles.selectionSection,
          { width: RESPONSIVE_CONSTANTS.getSectionWidth() },
          DEVICE_TYPE === 'desktop' && styles.selectionSectionDesktop,
          DEVICE_TYPE === 'tablet' && styles.selectionSectionTablet
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
                  name={showAssetTypeDropdown ? "chevron-up" : "chevron-down"} 
                  size={UI_CONSTANTS.ICON_SIZES.MD} 
                  color={UI_CONSTANTS.COLORS.TEXT_SECONDARY} 
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
                size={UI_CONSTANTS.ICON_SIZES.MD} 
                color={UI_CONSTANTS.COLORS.TEXT_SECONDARY} 
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
    alignItems: 'center',
  },
  contentDesktop: {
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.XXL,
  },
  contentTablet: {
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.XL,
  },
  selectionSection: {
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    borderRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    padding: RESPONSIVE_CONSTANTS.SPACING.XL,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XL,
    ...UI_CONSTANTS.SHADOW,
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
    color: UI_CONSTANTS.COLORS.PRIMARY,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XL,
    backgroundColor: UI_CONSTANTS.COLORS.GRAY_LIGHT,
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
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    ...UI_CONSTANTS.SHADOW,
  },
  tabText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: '500',
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
  },
  activeTabText: {
    color: UI_CONSTANTS.COLORS.PRIMARY,
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
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
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
    zIndex: 1000,
    ...UI_CONSTANTS.SHADOW,
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
  assetsSection: {
    flex: 1,
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    borderRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    padding: RESPONSIVE_CONSTANTS.SPACING.XL,
    ...UI_CONSTANTS.SHADOW,
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
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    borderRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    padding: RESPONSIVE_CONSTANTS.SPACING.LG,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
    borderWidth: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_LIGHT,
    ...UI_CONSTANTS.SHADOW,
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
    color: UI_CONSTANTS.COLORS.PRIMARY,
    textDecorationLine: 'underline',
  },
  createBreakdownButton: {
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.SM,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.SM,
    ...UI_CONSTANTS.SHADOW,
  },
  createBreakdownButtonText: {
    color: UI_CONSTANTS.COLORS.WHITE,
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
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
});

export default BreakdownSelectionScreen;
