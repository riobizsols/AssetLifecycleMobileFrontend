import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ActivityIndicator,
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
  INPUT_HEIGHT: verticalScale(45),
  VALUE_INPUT_HEIGHT: verticalScale(36),
  BUTTON_HEIGHT: verticalScale(48),
  CARD_PADDING: scale(16),
  CARD_BORDER_RADIUS: scale(12),
  LABEL_WIDTH: scale(150),
  COLON_WIDTH: scale(10),

  // Responsive layout
  getTableContainerWidth: () => {
    if (DEVICE_TYPE === 'desktop') {
      return Math.min(width * 0.9, 1000);
    }
    if (DEVICE_TYPE === 'tablet') {
      return Math.min(width * 0.95, 800);
    }
    return width - scale(32); // Mobile: full width minus padding
  },
  getActionBarLayout: () => {
    if (DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet') {
      return {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: scale(20),
        gap: scale(12),
      };
    }
    return {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: scale(16),
      gap: scale(8),
    };
  },

  getTableRowLayout: () => {
    if (DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet') {
      return {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
      };
    }
    return {
      flexDirection: 'column',
    };
  },

  getCellLayout: () => {
    if (DEVICE_TYPE === 'desktop') {
      return {
        width: '48%',
        marginBottom: scale(12),
      };
    }
    if (DEVICE_TYPE === 'tablet') {
      return {
        width: '48%',
        marginBottom: scale(10),
      };
    }
    return {
      width: '100%',
      marginBottom: scale(8),
    };
  },
};

const ReportBreakdownScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  // State for breakdown reports data
  const [breakdownData, setBreakdownData] = useState([]);

  // Fetch breakdown reports from API
  const fetchBreakdownReports = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const serverUrl = getServerUrl();
      const endpoint = API_ENDPOINTS.GET_BREAKDOWN_REPORTS();
      const url = `${serverUrl}${endpoint}`;

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
      console.log('Breakdown reports fetched successfully:', data.data?.length || 0, 'items');

      // Handle different response structures
      if (data.success && data.data) {
        setBreakdownData(data.data);
      } else if (data.data && Array.isArray(data.data)) {
        setBreakdownData(data.data);
      } else if (Array.isArray(data)) {
        setBreakdownData(data);
      } else {
        console.warn('Unexpected API response structure:', data);
        setBreakdownData([]);
      }
    } catch (error) {
      console.error('Error fetching breakdown reports:', error);
      showAlert(
        t('breakdown.error'),
        `${t('breakdown.failedToFetchBreakdownReports')}: ${error.message}`,
        'error'
      );
      setBreakdownData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchBreakdownReports();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleRefresh = () => {
    fetchBreakdownReports(true);
  };

  const handleAddBreakdown = () => {
    navigation.navigate('BREAKDOWNSELECTION');
  };

  const handleDelete = () => {
    showAlert(t('breakdown.delete'), t('breakdown.deleteFunctionalityWillBeImplemented'), 'info');
  };

  const handleRowPress = (item) => {
    // Navigate to update screen with breakdown data
    navigation.navigate('UPDATEBREAKDOWN', { breakdownData: item });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CR':
        return '#FF9800'; // Orange for Created
      case 'IN':
        return '#2196F3'; // Blue for In Progress
      case 'RS':
        return '#4CAF50'; // Green for Resolved
      default:
        return '#757575'; // Grey for unknown
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'CR':
        return t('breakdown.created');
      case 'IN':
        return t('breakdown.inProgress');
      case 'RS':
        return t('breakdown.resolved');
      default:
        return status;
    }
  };

  const renderBreakdownItem = ({ item }) => (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={() => handleRowPress(item)}
      activeOpacity={0.7}
    >
      {/* Header Section with ID and Status */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <MaterialCommunityIcons name="clipboard-alert" size={20} color="#003667" />
          <Text style={styles.cardId}>{item.abr_id}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Main Content Section */}
      <View style={styles.cardBody}>
        {/* Asset & Breakdown Info Row */}
        <View style={styles.cardRow}>
          <View style={styles.cardInfoBlock}>
            <Text style={styles.cardLabel}>{t('breakdown.assetId')}</Text>
            <Text style={styles.cardValue} numberOfLines={1}>{item.asset_id}</Text>
          </View>
          <View style={styles.cardInfoBlock}>
            <Text style={styles.cardLabel}>{t('breakdown.breakdownCode')}</Text>
            <Text style={styles.cardValue} numberOfLines={1}>{item.atbrrc_id}</Text>
          </View>
        </View>

        {/* Reported By & Date Row */}
        <View style={styles.cardRow}>
          <View style={styles.cardInfoBlock}>
            <Text style={styles.cardLabel}>{t('breakdown.reportedBy')}</Text>
            <Text style={styles.cardValue} numberOfLines={1}>{item.reported_by}</Text>
          </View>
          <View style={styles.cardInfoBlock}>
            <Text style={styles.cardLabel}>{t('breakdown.createdOn')}</Text>
            <Text style={styles.cardValue} numberOfLines={1}>
              {new Date(item.created_on).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.cardDescriptionContainer}>
          <Text style={styles.cardLabel}>{t('breakdown.description')}</Text>
          <Text
            style={styles.cardDescription}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.description}
          </Text>
        </View>

        {/* Additional Info Row */}
        <View style={styles.cardRow}>
          <View style={styles.cardInfoBlock}>
            <Text style={styles.cardLabel}>{t('breakdown.orgId')}</Text>
            <Text style={styles.cardValue} numberOfLines={1}>{item.org_id}</Text>
          </View>
          <View style={styles.cardInfoBlock}>
            <Text style={styles.cardLabel}>{t('breakdown.decisionCode')}</Text>
            <Text style={styles.cardValue} numberOfLines={1}>{item.decision_code}</Text>
          </View>
        </View>
      </View>

      {/* Footer with chevron */}
      <View style={styles.cardFooter}>
        <Text style={styles.cardFooterText}>Tap to view details</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color="#003667" />
      </View>
    </TouchableOpacity>
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
              {t('breakdown.reportBreakdown')}
            </Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.actionBar}>
            <TouchableOpacity style={styles.actionButton} onPress={handleAddBreakdown}>
              <MaterialCommunityIcons
                name="plus"
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
              <MaterialCommunityIcons
                name="delete"
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          <View style={[
            styles.tableContainer,
            { width: RESPONSIVE_CONSTANTS.getTableContainerWidth() },
            DEVICE_TYPE === 'desktop' && styles.tableContainerDesktop,
            DEVICE_TYPE === 'tablet' && styles.tableContainerTablet,
          ]}>
            <View style={styles.tableHeader}>
              <Text
                style={styles.headerText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t('breakdown.breakdownReports')}
              </Text>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#003667" />
                <Text style={styles.loadingText}>{t('breakdown.loadingBreakdownReports')}</Text>
              </View>
            ) : breakdownData.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={48}
                  color="#666"
                />
                <Text style={styles.emptyText}>{t('breakdown.noBreakdownReportsFound')}</Text>
                <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
                  <Text style={styles.refreshButtonText}>{t('breakdown.refresh')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={breakdownData}
                renderItem={renderBreakdownItem}
                keyExtractor={(item) => item.abr_id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  styles.listContainer,
                  DEVICE_TYPE === 'desktop' && styles.listContainerDesktop,
                  DEVICE_TYPE === 'tablet' && styles.listContainerTablet,
                ]}
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            )}
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
  contentContainer: {
    flex: 1,
    backgroundColor: '#EEEEEE',
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
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingTop: RESPONSIVE_CONSTANTS.SPACING.LG,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XL,
    gap: RESPONSIVE_CONSTANTS.SPACING.MD,
    width: '100%',
  },
  actionButton: {
    width: RESPONSIVE_CONSTANTS.BUTTON_HEIGHT,
    height: RESPONSIVE_CONSTANTS.BUTTON_HEIGHT,
    backgroundColor: '#003667',
    borderRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.LG,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flex: 1,
    width: '100%',
    marginHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  tableContainerDesktop: {
    maxWidth: 1000,
    alignSelf: 'center',
  },
  tableContainerTablet: {
    maxWidth: 800,
    alignSelf: 'center',
  },
  tableHeader: {
    backgroundColor: '#003366',
    padding: RESPONSIVE_CONSTANTS.SPACING.XL,
    borderTopLeftRadius: RESPONSIVE_CONSTANTS.SPACING.LG,
    borderTopRightRadius: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.XL,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  listContainerDesktop: {
    padding: RESPONSIVE_CONSTANTS.SPACING.XXL,
  },
  listContainerTablet: {
    padding: RESPONSIVE_CONSTANTS.SPACING.XL,
  },
  // Card Container
  cardContainer: {
    backgroundColor: '#FFFFFF',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.LG,
    borderRadius: scale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#003667',
    overflow: 'hidden',
  },
  // Card Header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: RESPONSIVE_CONSTANTS.SPACING.LG,
    backgroundColor: '#F5F8FA',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  cardId: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    fontWeight: 'bold',
    color: '#003667',
  },
  // Card Divider
  cardDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  // Card Body
  cardBody: {
    padding: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
    gap: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  cardInfoBlock: {
    flex: 1,
  },
  cardLabel: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.XS,
    color: '#616161',
    fontWeight: '600',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XS,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#333',
    fontWeight: '600',
  },
  cardDescriptionContainer: {
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
    backgroundColor: '#F9FAFB',
    padding: RESPONSIVE_CONSTANTS.SPACING.MD,
    borderRadius: scale(8),
    borderLeftWidth: 3,
    borderLeftColor: '#FEC200',
  },
  cardDescription: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    color: '#555',
    lineHeight: RESPONSIVE_CONSTANTS.FONT_SIZES.SM * 1.5,
    fontStyle: 'italic',
  },
  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.SM,
    backgroundColor: '#F5F8FA',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cardFooterText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.XS,
    color: '#003667',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  // Status Badge
  statusBadge: {
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.MD,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.XS,
    borderRadius: scale(16),
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.XS,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.XXXL,
  },
  loadingText: {
    marginTop: RESPONSIVE_CONSTANTS.SPACING.LG,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    color: '#666',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.XXXL,
  },
  emptyText: {
    marginTop: RESPONSIVE_CONSTANTS.SPACING.LG,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  refreshButton: {
    marginTop: RESPONSIVE_CONSTANTS.SPACING.XL,
    backgroundColor: '#003667',
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.XXL,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: '600',
  },
});

export default ReportBreakdownScreen;
