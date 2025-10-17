import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
  Platform,
  StatusBar,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Camera, useCameraPermission, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
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
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('select'); // 'select' or 'scan'
  const [assetTypes, setAssetTypes] = useState([]);
  const [selectedAssetType, setSelectedAssetType] = useState(null);
  const [showAssetTypeDropdown, setShowAssetTypeDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [barcode, setBarcode] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13', 'code-128', 'code-39', 'ean-8', 'upc-e'],
    onCodeScanned: (codes) => {
      if (codes.length > 0 && !scanLoading) {
        handleBarcodeScanned({ data: codes[0].value });
      }
    },
  });

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


  const showAlert = useCallback((title, message, type = 'info', onConfirm = () => {}, showCancel = false) => {
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
  }, [t]);

  const fetchAssetsByType = useCallback(async (assetTypeId) => {
    try {
      setLoadingAssets(true);
      const serverUrl = getServerUrl();
      const headers = await getApiHeaders();
      const fullUrl = `${serverUrl}${API_ENDPOINTS.GET_ASSETS_BY_TYPE(assetTypeId)}`;

      console.log('=== Fetching Assets by Type ===');
      console.log('Asset Type ID:', assetTypeId);
      console.log('Full URL:', fullUrl);

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers,
        timeout: 10000,
      });

      console.log('Assets response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error fetching assets:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Assets response:', JSON.stringify(data, null, 2));

      // Handle different response structures
      let assetsData = null;

      if (Array.isArray(data)) {
        assetsData = data;
      } else if (data && data.data && Array.isArray(data.data)) {
        assetsData = data.data;
      } else if (data && data.assets && Array.isArray(data.assets)) {
        assetsData = data.assets;
      } else if (data && data.results && Array.isArray(data.results)) {
        assetsData = data.results;
      }

      if (assetsData && assetsData.length > 0) {
        console.log('Found assets:', assetsData.length);
        setAvailableAssets(assetsData);
      } else {
        console.warn('No assets found for this asset type');
        setAvailableAssets([]);
      }
    } catch (error) {
      console.error('=== Fetch Assets Error ===');
      console.error('Error message:', error.message);

      let errorMessage = 'Failed to load assets. Please try again.';

      if (error.message.includes('Network request failed')) {
        errorMessage = 'Network connection failed. Please check your internet connection.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message.includes('HTTP')) {
        errorMessage = `Server error: ${error.message}`;
      }

      showAlert(
        t('breakdown.error'),
        errorMessage,
        'error'
      );
      setAvailableAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  }, [t, showAlert]);

  const fetchAssetTypes = useCallback(async () => {
    try {
      setLoading(true);
      const serverUrl = getServerUrl();
      const headers = await getApiHeaders();
      const fullUrl = `${serverUrl}${API_ENDPOINTS.GET_ASSET_TYPES_MAINT_REQUIRED()}`;

      console.log('=== Asset Types API Debug ===');
      console.log('Server URL:', serverUrl);
      console.log('Full URL:', fullUrl);
      console.log('Headers:', headers);
      console.log('Platform:', Platform.OS);

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers,
        timeout: 10000, // 10 second timeout
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Asset types response:', JSON.stringify(data, null, 2));

      // Handle different response structures
      let assetTypesData = null;

      // Check if response is directly an array
      if (Array.isArray(data)) {
        assetTypesData = data;
      }
      // Check if response has a 'data' property
      else if (data && data.data && Array.isArray(data.data)) {
        assetTypesData = data.data;
      }
      // Check if response has an 'assetTypes' property
      else if (data && data.assetTypes && Array.isArray(data.assetTypes)) {
        assetTypesData = data.assetTypes;
      }
      // Check if response has a 'results' property
      else if (data && data.results && Array.isArray(data.results)) {
        assetTypesData = data.results;
      }

      // Set asset types from API response
      if (assetTypesData && assetTypesData.length > 0) {
        console.log('Found asset types:', assetTypesData.length);
        setAssetTypes(assetTypesData);
        // Set first asset type as default selection and fetch its assets
        setSelectedAssetType(assetTypesData[0]);
        // Fetch assets for the first asset type
        fetchAssetsByType(assetTypesData[0].asset_type_id);
      } else {
        console.warn('No asset types found in response. Response structure:', typeof data, Object.keys(data || {}));
        setAssetTypes([]);
        setAvailableAssets([]);
      }
    } catch (error) {
      console.error('=== Asset Types API Error ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);

      let errorMessage = 'Failed to load asset types. Please try again.';

      if (error.message.includes('Network request failed')) {
        errorMessage = 'Network connection failed. Please check your internet connection and server status.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message.includes('HTTP')) {
        errorMessage = `Server error: ${error.message}`;
      }

      showAlert(
        t('breakdown.error'),
        errorMessage,
        'error'
      );
      // Set empty array on error
      setAssetTypes([]);
      setAvailableAssets([]);
    } finally {
      setLoading(false);
    }
  }, [t, showAlert, fetchAssetsByType]);

  // Fetch asset types from API on component mount
  useEffect(() => {
    fetchAssetTypes();
  }, [fetchAssetTypes]);

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

  const handleCreateBreakdown = (asset) => {
    // Prepare asset data for the breakdown report screen
    const assetData = {
      id: asset.asset_id || asset.id,
      assetType: asset.asset_type_name || asset.assetTypeName || selectedAssetType?.text,
      assetName: asset.text || asset.asset_name || asset.assetName || t('breakdown.null'),
      status: t('breakdown.breakdownReported'),
      assetTypeId: asset.asset_type_id || asset.assetTypeId || selectedAssetType?.asset_type_id,
    };

    navigation.navigate('BREAKDOWNREPORT', { assetData });
  };

  const openCamera = async () => {
    if (!hasPermission) {
      await requestPermission();
    }
    setShowCamera(true);
    setBarcode(null); // reset previous barcode
  };

  const handleBarcodeScanned = async (barcodeData) => {
    setShowCamera(false);
    setBarcode(barcodeData.data);

    // Call API to check serial number and get asset_id
    await checkSerialNumber(barcodeData.data);
  };

  const checkSerialNumber = async (serialNumber) => {
    setScanLoading(true);
    try {
      // Convert serial number to uppercase for case-insensitive search
      const normalizedSerial = serialNumber.trim().toUpperCase();
      console.log(`Checking serial number: ${normalizedSerial}`);
      const serverUrl = getServerUrl();
      const url = `${serverUrl}${API_ENDPOINTS.CHECK_SERIAL(normalizedSerial)}`;
      console.log('API URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: await getApiHeaders(),
        timeout: 10000,
      });

      if (!response.ok) {
        if (response.status === 404) {
          Alert.alert(
            t('assets.assetNotFound'),
            t('assets.noAssetFoundWithSerial'),
            [{ text: t('common.ok') }]
          );
          return;
        }
        if (response.status === 401) {
          Alert.alert(
            t('assets.authenticationError'),
            t('assets.checkAuthorizationToken'),
            [{ text: t('common.ok') }]
          );
          return;
        }
        if (response.status === 500) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Server error details:', errorData);
          Alert.alert(
            t('assets.serverError'),
            t('assets.serverEncounteredError'),
            [{ text: t('common.ok') }]
          );
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Asset data received:', data);

      // Check if data is an array or object
      let assetId = null;
      let assetData = null;
      if (Array.isArray(data) && data.length > 0) {
        assetId = data[0].asset_id;
        assetData = data[0];
        console.log('Asset ID from array:', assetId);
      } else if (data && typeof data === 'object') {
        assetId = data.asset_id || data.id || data.assetId;
        assetData = data;
        console.log('Asset ID from object:', assetId);
      }

      if (assetId && assetData) {
        // Navigate to breakdown report with scanned asset data
        const breakdownAssetData = {
          id: assetId,
          assetType: assetData.asset_type_name || assetData.assetTypeName || 'N/A',
          assetName: assetData.text || assetData.asset_name || assetData.assetName || t('breakdown.null'),
          status: t('breakdown.breakdownReported'),
          assetTypeId: assetData.asset_type_id || assetData.assetTypeId || 'N/A',
          barcode: barcode,
        };

        navigation.navigate('BREAKDOWNREPORT', { assetData: breakdownAssetData });
      } else {
        Alert.alert(
          t('assets.assetNotFound'),
          t('assets.noAssetFoundWithSerial'),
          [{ text: t('common.ok') }]
        );
      }
    } catch (error) {
      console.error('Error checking serial number:', error);

      // Provide more specific error messages
      let errorMessage = t('assets.failedToCheckSerialNumber');

      if (error.message.includes('Network request failed')) {
        errorMessage = t('assets.networkConnectionFailed');
      } else if (error.message.includes('timeout')) {
        errorMessage = t('assets.requestTimedOut');
      } else if (error.message.includes('fetch')) {
        errorMessage = t('assets.unableToConnectToServer');
      }

      Alert.alert(
        t('assets.networkError'),
        errorMessage,
        [{ text: t('common.ok') }]
      );
    } finally {
      setScanLoading(false);
    }
  };

  const handleAssetPress = (asset) => {
    showAlert(
      t('breakdown.assetDetails'),
      `${t('breakdown.assetId')}: ${asset.id}\n${t('breakdown.assetType')}: ${asset.assetTypeName}`,
      'info',
    );
  };

  const renderAssetItem = ({ item }) => (
    <View style={[
      styles.assetCard,
      DEVICE_TYPE === 'desktop' && styles.assetCardDesktop,
      DEVICE_TYPE === 'tablet' && styles.assetCardTablet,
    ]}>
      <View style={[
        styles.assetHeader,
        RESPONSIVE_CONSTANTS.getAssetCardLayout(),
      ]}>
        <TouchableOpacity onPress={() => handleAssetPress(item)}>
          <Text
            style={styles.assetId}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.asset_id || item.id}
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
          RESPONSIVE_CONSTANTS.getDetailRowLayout(),
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
            {item.asset_type_id || item.assetTypeId}
          </Text>
        </View>
        <View style={[
          styles.detailRow,
          RESPONSIVE_CONSTANTS.getDetailRowLayout(),
        ]}>
          <Text
            style={styles.detailLabel}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {t('breakdown.assetType')}:
          </Text>
          <Text
            style={styles.detailValue}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.asset_type_name || item.assetTypeName || selectedAssetType?.text || 'N/A'}
          </Text>
        </View>
        <View style={[
          styles.detailRow,
          RESPONSIVE_CONSTANTS.getDetailRowLayout(),
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
            {item.text || item.asset_name || item.assetName || 'N/A'}
          </Text>
        </View>
        <View style={[
          styles.detailRow,
          RESPONSIVE_CONSTANTS.getDetailRowLayout(),
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
            {item.service_vendor_id || item.serviceVendorId || 'N/A'}
          </Text>
        </View>
        <View style={[
          styles.detailRow,
          RESPONSIVE_CONSTANTS.getDetailRowLayout(),
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
            {item.prod_serv_id || item.product_service_id || item.productServiceId || 'N/A'}
          </Text>
        </View>
      </View>
    </View>
  );

  return showCamera ? (
    <View style={{ flex: 1 }}>
      <View style={{ position: 'absolute', top: 40, right: 20, zIndex: 2 }}>
        <TouchableOpacity
          onPress={() => setShowCamera(false)}
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: 20,
            padding: 8,
          }}
        >
          <MaterialCommunityIcons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
      {device != null && hasPermission && (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={showCamera}
          codeScanner={codeScanner}
        />
      )}
      {!hasPermission && (
        <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center' }}>
            {t('scanning.cameraPermissionRequired')}
          </Text>
        </View>
      )}
      <View
        style={{
          position: 'absolute',
          bottom: 40,
          alignSelf: 'center',
          backgroundColor: '#003667',
          padding: 12,
          borderRadius: 40,
        }}
      >
        <Text style={{ color: '#fff' }}>{t('scanning.pointCameraAtBarcode')}</Text>
      </View>
      {scanLoading && (
        <View style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: [{ translateX: -50 }, { translateY: -50 }],
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: 20,
          borderRadius: 10,
          alignItems: 'center',
        }}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: '#fff', marginTop: 10 }}>{t('assets.processing')}</Text>
        </View>
      )}
    </View>
  ) : (
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
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#003667" />
              <Text style={styles.loadingText}>{t('common.loading') || 'Loading...'}</Text>
            </View>
          ) : (
            <>
          {/* Breakdown Selection Section */}
          <View style={[
            styles.selectionSection,
            { width: RESPONSIVE_CONSTANTS.getSectionWidth() },
            DEVICE_TYPE === 'desktop' && styles.selectionSectionDesktop,
            DEVICE_TYPE === 'tablet' && styles.selectionSectionTablet,
            showAssetTypeDropdown && styles.selectionSectionWithDropdown,
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
            RESPONSIVE_CONSTANTS.getTabLayout(),
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
              onPress={() => {
                setActiveTab('scan');
                openCamera();
              }}
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
            RESPONSIVE_CONSTANTS.getFilterLayout(),
          ]}>
            <Text
              style={styles.filterLabel}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('breakdown.assetType')}
            </Text>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={[
                  styles.dropdownButton,
                  assetTypes.length === 0 && styles.dropdownButtonDisabled,
                ]}
                onPress={() => {
                  if (assetTypes.length > 0) {
                    setShowAssetTypeDropdown(!showAssetTypeDropdown);
                  }
                }}
                disabled={assetTypes.length === 0}
              >
                <Text
                  style={styles.dropdownButtonText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {selectedAssetType?.text || t('breakdown.selectAssetType') || 'Select Asset Type'}
                </Text>
                <MaterialCommunityIcons
                  name={showAssetTypeDropdown ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#003667"
                />
              </TouchableOpacity>

              <Modal
                visible={showAssetTypeDropdown}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowAssetTypeDropdown(false)}
              >
                <TouchableWithoutFeedback onPress={() => setShowAssetTypeDropdown(false)}>
                  <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback>
                      <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                          <Text style={styles.modalTitle}>{t('breakdown.selectAssetType') || 'Select Asset Type'}</Text>
                          <TouchableOpacity onPress={() => setShowAssetTypeDropdown(false)}>
                            <MaterialCommunityIcons name="close" size={24} color="#003667" />
                          </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalScrollView}>
                          {assetTypes.map((type) => (
                            <TouchableOpacity
                              key={type.asset_type_id}
                              style={styles.modalOption}
                              onPress={() => {
                                setSelectedAssetType(type);
                                setShowAssetTypeDropdown(false);
                                // Fetch assets for the selected asset type
                                fetchAssetsByType(type.asset_type_id);
                              }}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={styles.modalOptionText}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {type.text}
                              </Text>
                              {selectedAssetType?.asset_type_id === type.asset_type_id && (
                                <MaterialCommunityIcons name="check" size={20} color="#003667" />
                              )}
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </TouchableWithoutFeedback>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>
            </View>
          </View>
        </View>

        {/* Available Assets Section */}
        <View style={[
          styles.assetsSection,
          { width: RESPONSIVE_CONSTANTS.getSectionWidth() },
          DEVICE_TYPE === 'desktop' && styles.assetsSectionDesktop,
          DEVICE_TYPE === 'tablet' && styles.assetsSectionTablet,
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

          {loadingAssets ? (
            <View style={styles.loadingAssetsContainer}>
              <ActivityIndicator size="large" color="#003667" />
              <Text style={styles.loadingText}>{t('common.loading') || 'Loading assets...'}</Text>
            </View>
          ) : availableAssets.length === 0 ? (
            <View style={styles.emptyAssetsContainer}>
              <MaterialCommunityIcons
                name="information-outline"
                size={48}
                color="#999"
              />
              <Text style={styles.emptyAssetsText}>
                {selectedAssetType
                  ? t('breakdown.noAssetsFound') || 'No assets found for this type'
                  : t('breakdown.selectAssetTypeToViewAssets') || 'Select an asset type to view assets'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={availableAssets}
              renderItem={renderAssetItem}
              keyExtractor={(item) => item.asset_id || item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.assetsList,
                DEVICE_TYPE === 'desktop' && styles.assetsListDesktop,
                DEVICE_TYPE === 'tablet' && styles.assetsListTablet,
              ]}
            />
          )}
          </View>
            </>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.XXXL,
  },
  loadingText: {
    marginTop: RESPONSIVE_CONSTANTS.SPACING.MD,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#003667',
    fontWeight: '500',
  },
  loadingAssetsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.XXXL,
  },
  emptyAssetsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.XXXL,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.XL,
  },
  emptyAssetsText: {
    marginTop: RESPONSIVE_CONSTANTS.SPACING.LG,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#999',
    fontWeight: '500',
    textAlign: 'center',
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
  selectionSectionWithDropdown: {
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
  dropdownButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: RESPONSIVE_CONSTANTS.SPACING.XL,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    width: '100%',
    maxWidth: scale(400),
    maxHeight: verticalScale(500),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: RESPONSIVE_CONSTANTS.SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    fontWeight: 'bold',
    color: '#003667',
  },
  modalScrollView: {
    maxHeight: verticalScale(350),
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  modalOptionText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#333',
    fontWeight: '500',
    flex: 1,
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
