import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Appbar } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
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
  getTableContainerWidth: () => {
    if (DEVICE_TYPE === 'desktop') return Math.min(width * 0.9, 1000);
    if (DEVICE_TYPE === 'tablet') return Math.min(width * 0.95, 800);
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
  const { hasAccess } = useNavigationContext();
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
        headers: getApiHeaders(),
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

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const handleFilter = () => {
    showAlert(t('breakdown.filter'), t('breakdown.filterFunctionalityWillBeImplemented'), 'info');
  };

  const handleRefresh = () => {
    fetchBreakdownReports(true);
  };

  const handleAddBreakdown = () => {
    navigation.navigate('BREAKDOWNSELECTION');
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
      style={[
        styles.tableRow,
        DEVICE_TYPE === 'desktop' && styles.tableRowDesktop,
        DEVICE_TYPE === 'tablet' && styles.tableRowTablet
      ]}
      onPress={() => handleRowPress(item)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.cellContainer,
        RESPONSIVE_CONSTANTS.getTableRowLayout()
      ]}>
        <View style={[
          styles.cell,
          RESPONSIVE_CONSTANTS.getCellLayout()
        ]}>
          <Text style={styles.cellLabel}>{t('breakdown.breakdownId')}</Text>
          <Text 
            style={styles.cellValue}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.abr_id}
          </Text>
        </View>
        <View style={[
          styles.cell,
          RESPONSIVE_CONSTANTS.getCellLayout()
        ]}>
          <Text style={styles.cellLabel}>{t('breakdown.assetId')}</Text>
          <Text 
            style={styles.cellValue}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.asset_id}
          </Text>
        </View>
        <View style={[
          styles.cell,
          RESPONSIVE_CONSTANTS.getCellLayout()
        ]}>
          <Text style={styles.cellLabel}>{t('breakdown.breakdownCode')}</Text>
          <Text 
            style={styles.cellValue}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.atbrrc_id}
          </Text>
        </View>
        <View style={[
          styles.cell,
          RESPONSIVE_CONSTANTS.getCellLayout()
        ]}>
          <Text style={styles.cellLabel}>{t('breakdown.reportedBy')}</Text>
          <Text 
            style={styles.cellValue}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.reported_by}
          </Text>
        </View>
        <View style={[
          styles.cell,
          RESPONSIVE_CONSTANTS.getCellLayout()
        ]}>
          <Text style={styles.cellLabel}>{t('breakdown.status')}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        <View style={[
          styles.cell,
          RESPONSIVE_CONSTANTS.getCellLayout()
        ]}>
          <Text style={styles.cellLabel}>{t('breakdown.description')}</Text>
          <Text 
            style={styles.cellValue} 
            numberOfLines={DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet' ? 3 : 2}
            ellipsizeMode="tail"
          >
            {item.description}
          </Text>
        </View>
        <View style={[
          styles.cell,
          RESPONSIVE_CONSTANTS.getCellLayout()
        ]}>
          <Text style={styles.cellLabel}>{t('breakdown.orgId')}</Text>
          <Text 
            style={styles.cellValue}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.org_id}
          </Text>
        </View>
        <View style={[
          styles.cell,
          RESPONSIVE_CONSTANTS.getCellLayout()
        ]}>
          <Text style={styles.cellLabel}>{t('breakdown.decisionCode')}</Text>
          <Text 
            style={styles.cellValue}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.decision_code}
          </Text>
        </View>
        <View style={[
          styles.cell,
          RESPONSIVE_CONSTANTS.getCellLayout()
        ]}>
          <Text style={styles.cellLabel}>{t('breakdown.createdOn')}</Text>
          <Text 
            style={styles.cellValue}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {new Date(item.created_on).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
            {t('breakdown.reportBreakdown')}
          </Text>
        </View>
      </View>

      <View style={[
        styles.content,
        DEVICE_TYPE === 'desktop' && styles.contentDesktop,
        DEVICE_TYPE === 'tablet' && styles.contentTablet
      ]}>
        <View style={[
          styles.actionBar,
          RESPONSIVE_CONSTANTS.getActionBarLayout()
        ]}>
          <TouchableOpacity style={styles.actionButton} onPress={handleFilter}>
            <MaterialCommunityIcons 
              name="filter-variant" 
              size={UI_CONSTANTS.ICON_SIZES.LG} 
              color={UI_CONSTANTS.COLORS.SECONDARY} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleAddBreakdown}>
            <MaterialCommunityIcons 
              name="plus" 
              size={UI_CONSTANTS.ICON_SIZES.LG} 
              color={UI_CONSTANTS.COLORS.WHITE} 
            />
          </TouchableOpacity>
        </View>

        <View style={[
          styles.tableContainer,
          { width: RESPONSIVE_CONSTANTS.getTableContainerWidth() },
          DEVICE_TYPE === 'desktop' && styles.tableContainerDesktop,
          DEVICE_TYPE === 'tablet' && styles.tableContainerTablet
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
              <ActivityIndicator size="large" color={UI_CONSTANTS.COLORS.PRIMARY} />
              <Text style={styles.loadingText}>{t('breakdown.loadingBreakdownReports')}</Text>
            </View>
          ) : breakdownData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name="alert-circle-outline" 
                size={UI_CONSTANTS.ICON_SIZES.XXL * 2} 
                color={UI_CONSTANTS.COLORS.GRAY_DARK} 
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
                DEVICE_TYPE === 'tablet' && styles.listContainerTablet
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
    alignItems: 'center',
  },
  contentDesktop: {
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.XXL,
  },
  contentTablet: {
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.XL,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XL,
    gap: RESPONSIVE_CONSTANTS.SPACING.MD,
    width: '100%',
  },
  actionButton: {
    width: RESPONSIVE_CONSTANTS.BUTTON_HEIGHT,
    height: RESPONSIVE_CONSTANTS.BUTTON_HEIGHT,
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
    borderRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: UI_CONSTANTS.COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableContainer: {
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.LG,
    shadowColor: UI_CONSTANTS.COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flex: 1,
    width: '100%',
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
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
    padding: RESPONSIVE_CONSTANTS.SPACING.XL,
    borderTopLeftRadius: RESPONSIVE_CONSTANTS.SPACING.LG,
    borderTopRightRadius: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  headerText: {
    color: UI_CONSTANTS.COLORS.WHITE,
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
  tableRow: {
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
    borderRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    shadowColor: UI_CONSTANTS.COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_LIGHT,
  },
  tableRowDesktop: {
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  tableRowTablet: {
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  cellContainer: {
    padding: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  cell: {
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  cellLabel: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
    fontWeight: '600',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.XS,
  },
  cellValue: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.MD,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.XS,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.LG,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: UI_CONSTANTS.COLORS.WHITE,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    fontWeight: 'bold',
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
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
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
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
    fontWeight: '500',
    textAlign: 'center',
  },
  refreshButton: {
    marginTop: RESPONSIVE_CONSTANTS.SPACING.XL,
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.XXL,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  refreshButtonText: {
    color: UI_CONSTANTS.COLORS.WHITE,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: '600',
  },
});

export default ReportBreakdownScreen;
