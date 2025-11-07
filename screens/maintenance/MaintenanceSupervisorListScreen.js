import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
  StatusBar,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import CustomAlert from '../../components/CustomAlert';
import SideMenu from '../../components/SideMenu';
import { authUtils } from '../../utils/auth';
import { getServerUrl, getApiHeaders, API_ENDPOINTS } from '../../config/api';

const BASE_DIMENSIONS = {
  WIDTH: 375,
  HEIGHT: 812,
};

const BREAKPOINTS = {
  SMALL: 320,
  MEDIUM: 375,
  LARGE: 414,
  TABLET: 768,
  DESKTOP: 1024,
};

const getDeviceType = (windowWidth) => {
  if (windowWidth >= BREAKPOINTS.DESKTOP) {
    return 'desktop';
  }
  if (windowWidth >= BREAKPOINTS.TABLET) {
    return 'tablet';
  }
  if (windowWidth >= BREAKPOINTS.LARGE) {
    return 'large';
  }
  if (windowWidth >= BREAKPOINTS.MEDIUM) {
    return 'medium';
  }
  return 'small';
};

const calculateResponsiveHelpers = (windowWidth, windowHeight) => {
  const deviceType = getDeviceType(windowWidth);

  const scale = (size) => {
    const scaleFactor = windowWidth / BREAKPOINTS.MEDIUM;
    return Math.max(size * scaleFactor, size * 0.8);
  };

  const verticalScale = (size) => {
    const scaleFactor = windowHeight / BASE_DIMENSIONS.HEIGHT;
    return Math.max(size * scaleFactor, size * 0.8);
  };

  const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

  return {
    deviceType,
    scale,
    verticalScale,
    moderateScale,
  };
};

const createResponsiveConstants = (helpers, windowWidth) => {
  const { deviceType, scale, verticalScale, moderateScale } = helpers;

  return {
    DEVICE_TYPE: deviceType,
    WINDOW_WIDTH: windowWidth,
    SPACING: {
      XS: scale(4),
      SM: scale(8),
      MD: scale(12),
      LG: scale(16),
      XL: scale(20),
      XXL: scale(24),
      XXXL: scale(32),
    },
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
    INPUT_HEIGHT: verticalScale(45),
    BUTTON_HEIGHT: verticalScale(48),
    CARD_PADDING: scale(16),
    CARD_BORDER_RADIUS: scale(12),
    LABEL_WIDTH: scale(150),
    COLON_WIDTH: scale(10),
    getTableContainerWidth: () => {
      if (deviceType === 'desktop') {
        return Math.min(windowWidth * 0.9, 1000);
      }
      if (deviceType === 'tablet') {
        return Math.min(windowWidth * 0.95, 800);
      }
      return windowWidth - scale(32);
    },
  };
};

const MaintenanceSupervisorListContent = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [maintenanceData, setMaintenanceData] = useState([]);
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

  const responsiveHelpers = useMemo(
    () => calculateResponsiveHelpers(windowWidth, windowHeight),
    [windowWidth, windowHeight]
  );

  const RESPONSIVE_CONSTANTS = useMemo(
    () => createResponsiveConstants(responsiveHelpers, windowWidth),
    [responsiveHelpers, windowWidth]
  );

  const showAlert = useCallback((title, message, type = 'info', onConfirm = () => {}, showCancel = false) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      onConfirm: () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
        onConfirm();
      },
      onCancel: () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
      },
      confirmText: t('common.ok'),
      cancelText: t('common.cancel'),
      showCancel,
    });
  }, [t]);

  const getStatusColor = useCallback((status) => {
    const normalizedStatus = (status || '').toString().toLowerCase();
    switch (normalizedStatus) {
      case 'completed':
      case 'complete':
      case 'done':
        return '#4CAF50';
      case 'in progress':
      case 'inprogress':
      case 'ongoing':
        return '#2196F3';
      case 'pending':
      case 'scheduled':
        return '#FF9800';
      case 'cancelled':
      case 'canceled':
        return '#9E9E9E';
      case 'overdue':
        return '#E53935';
      default:
        return '#757575';
    }
  }, []);

  const getStatusText = useCallback((status) => {
    const normalizedStatus = (status || '').toString().toLowerCase();
    if (normalizedStatus.includes('complete')) {
      return t('maintenance.completed');
    }
    if (normalizedStatus.includes('progress') || normalizedStatus.includes('ongoing')) {
      return t('maintenance.inProgress');
    }
    if (normalizedStatus.includes('cancel')) {
      return t('maintenance.cancelled');
    }
    if (normalizedStatus.includes('overdue')) {
      return t('maintenance.overdue', { defaultValue: 'Overdue' });
    }
    return t('maintenance.pending');
  }, [t]);

  const formatDate = useCallback((dateValue) => {
    if (!dateValue) {
      return t('common.na');
    }

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      return t('common.na');
    }

    return date.toLocaleDateString();
  }, [t]);

  const parseMaintenanceData = useCallback((rawData) => {
    if (!rawData) {
      return [];
    }

    if (Array.isArray(rawData)) {
      return rawData;
    }

    if (rawData.data && Array.isArray(rawData.data)) {
      return rawData.data;
    }

    if (rawData.success && Array.isArray(rawData.records)) {
      return rawData.records;
    }

    const values = Object.values(rawData);
    if (values.every((value) => typeof value === 'object')) {
      try {
        const flattened = values.flatMap((value) => (Array.isArray(value) ? value : []));
        if (flattened.length) {
          return flattened;
        }
      } catch (error) {
        console.warn('Failed to flatten maintenance response', error);
      }
    }

    return [];
  }, []);

  const fetchMaintenanceSchedules = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const serverUrl = getServerUrl();
      const endpoint = API_ENDPOINTS.GET_MAINTENANCE_SCHEDULES();
      const url = `${serverUrl}${endpoint}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: await getApiHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Maintenance API Error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Maintenance schedules fetched successfully:', Array.isArray(data?.data) ? data.data.length : Array.isArray(data) ? data.length : 0, 'items');

      const parsedData = parseMaintenanceData(data);
      setMaintenanceData(parsedData);
    } catch (error) {
      console.error('Error fetching maintenance schedules:', error);

      let errorMessage = error.message;
      let parsedError = null;

      try {
        const jsonMatch = errorMessage.match(/\{.*\}/);
        if (jsonMatch) {
          parsedError = JSON.parse(jsonMatch[0]);
          if (parsedError.message) {
            errorMessage = parsedError.message;
          }
        }
      } catch (parseError) {
        console.warn('Could not parse maintenance error JSON:', parseError);
      }

      let displayMessage = t('maintenance.error');

      if (errorMessage.toLowerCase().includes('session') && errorMessage.toLowerCase().includes('expired')) {
        displayMessage = t('breakdown.errors.sessionExpired', 'Session expired. Please log in again.');
      } else if (errorMessage.includes('401') || errorMessage.toLowerCase().includes('unauthorized')) {
        displayMessage = t('breakdown.errors.unauthorized', 'You are not authorized to view maintenance schedules.');
      } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')) {
        displayMessage = t('breakdown.errors.networkError', 'Network error. Please check your connection and try again.');
      } else if (errorMessage.toLowerCase().includes('timeout')) {
        displayMessage = t('breakdown.errors.timeoutError', 'The request timed out. Please try again.');
      } else if (errorMessage.includes('500') || errorMessage.toLowerCase().includes('server')) {
        displayMessage = t('breakdown.errors.serverError', 'Server error. Please try again later.');
      } else if (parsedError?.message) {
        displayMessage = parsedError.message;
      } else if (errorMessage) {
        displayMessage = errorMessage;
      }

      showAlert(
        t('maintenance.error'),
        displayMessage,
        'error'
      );
      setMaintenanceData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [parseMaintenanceData, showAlert, t]);

  useEffect(() => {
    fetchMaintenanceSchedules();
  }, [fetchMaintenanceSchedules]);

  const handleLogout = useCallback(() => {
    showAlert(
      t('maintenance.logout'),
      t('maintenance.confirmLogout'),
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
          showAlert(t('maintenance.error'), t('maintenance.failedToLogout'), 'error');
        }
      },
      true
    );
  }, [navigation, showAlert, t]);

  const handleAddMaintenance = useCallback(() => {
    navigation.navigate('MaintenanceSupervisorForm');
  }, [navigation]);

  const handleRowPress = useCallback((item) => {
    navigation.navigate('MaintenanceSupervisorForm', { scheduleData: item });
  }, [navigation]);

  const handleRefresh = useCallback(() => {
    fetchMaintenanceSchedules(true);
  }, [fetchMaintenanceSchedules]);

  const closeMenu = useCallback(() => {
    setMenuVisible(false);
  }, []);

  const openMenu = useCallback(() => {
    setMenuVisible(true);
  }, []);

  const renderMaintenanceItem = useCallback(({ item }) => {
    const scheduleId = item.maintenance_id || item.schedule_id || item.id || null;
    const assetName = item.asset_name || item.assetName || item.asset || null;
    const assetId = item.asset_id || item.assetId || item.assetID || item.assetCode || null;
    const technician = item.technician || item.assigned_to || item.assignedTo || null;
    const priority = item.priority || item.priority_level || item.priorityLevel;
    const maintenanceType = item.maintenance_type || item.maintenanceType || item.type;
    const rawStatus = item.status || item.maintenance_status || item.statusText;
    const statusText = getStatusText(rawStatus);
    const statusColor = getStatusColor(rawStatus);

    return (
      <TouchableOpacity
        style={[
          styles.cardContainer,
          {
            borderLeftColor: statusColor,
            borderRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
          },
        ]}
        onPress={() => handleRowPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.cardHeader, { padding: RESPONSIVE_CONSTANTS.CARD_PADDING }]}>
          <View style={styles.cardHeaderLeft}>
            <MaterialCommunityIcons name="wrench" size={20} color="#003667" />
            <Text style={[styles.cardId, { fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG }]}>
              {scheduleId ?? t('maintenance.maintenanceId')}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusColor,
                paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.MD,
                paddingVertical: RESPONSIVE_CONSTANTS.SPACING.XS,
              },
            ]}
          >
            <Text style={[styles.statusText, { fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.XS }]}>
              {statusText}
            </Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={[styles.cardBody, { padding: RESPONSIVE_CONSTANTS.CARD_PADDING }]}>
          <View style={[styles.cardRow, { marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD }]}>
            <View style={styles.cardInfoBlock}>
              <Text
                style={[
                  styles.cardLabel,
                  { fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.XS, marginBottom: RESPONSIVE_CONSTANTS.SPACING.XS },
                ]}
              >
                {t('assets.assetId')}
              </Text>
              <Text style={[styles.cardValue, { fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD }]} numberOfLines={1}>
                {assetId || t('common.na')}
              </Text>
            </View>
            <View style={styles.cardInfoBlock}>
              <Text
                style={[
                  styles.cardLabel,
                  { fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.XS, marginBottom: RESPONSIVE_CONSTANTS.SPACING.XS },
                ]}
              >
                {t('assets.assetName')}
              </Text>
              <Text style={[styles.cardValue, { fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD }]} numberOfLines={1}>
                {assetName || t('common.na')}
              </Text>
            </View>
          </View>

          <View style={[styles.cardRow, { marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD }]}>
            <View style={styles.cardInfoBlock}>
              <Text
                style={[
                  styles.cardLabel,
                  { fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.XS, marginBottom: RESPONSIVE_CONSTANTS.SPACING.XS },
                ]}
              >
                {t('maintenance.maintenanceType')}
              </Text>
              <Text style={[styles.cardValue, { fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD }]} numberOfLines={1}>
                {maintenanceType || t('common.na')}
              </Text>
            </View>
            <View style={styles.cardInfoBlock}>
              <Text
                style={[
                  styles.cardLabel,
                  { fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.XS, marginBottom: RESPONSIVE_CONSTANTS.SPACING.XS },
                ]}
              >
                {t('maintenance.priority', { defaultValue: 'Priority' })}
              </Text>
              <Text style={[styles.cardValue, { fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD }]} numberOfLines={1}>
                {priority || t('common.na')}
              </Text>
            </View>
          </View>

          <View style={[styles.cardRow, { marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD }]}>
            <View style={styles.cardInfoBlock}>
              <Text
                style={[
                  styles.cardLabel,
                  { fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.XS, marginBottom: RESPONSIVE_CONSTANTS.SPACING.XS },
                ]}
              >
                {t('maintenance.scheduledDate')}
              </Text>
              <Text style={[styles.cardValue, { fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD }]} numberOfLines={1}>
                {formatDate(item.scheduled_date || item.scheduledDate || item.schedule_date)}
              </Text>
            </View>
            <View style={styles.cardInfoBlock}>
              <Text
                style={[
                  styles.cardLabel,
                  { fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.XS, marginBottom: RESPONSIVE_CONSTANTS.SPACING.XS },
                ]}
              >
                {t('maintenance.completedDate', { defaultValue: 'Completed Date' })}
              </Text>
              <Text style={[styles.cardValue, { fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD }]} numberOfLines={1}>
                {formatDate(item.completed_date || item.completedDate || item.completion_date)}
              </Text>
            </View>
          </View>

          <View style={styles.cardRow}>
            <View style={styles.cardInfoBlock}>
              <Text
                style={[
                  styles.cardLabel,
                  { fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.XS, marginBottom: RESPONSIVE_CONSTANTS.SPACING.XS },
                ]}
              >
                {t('maintenance.technician')}
              </Text>
              <Text style={[styles.cardValue, { fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD }]} numberOfLines={1}>
                {technician || t('common.na')}
              </Text>
            </View>
            <View style={styles.cardInfoBlock}>
              <Text
                style={[
                  styles.cardLabel,
                  { fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.XS, marginBottom: RESPONSIVE_CONSTANTS.SPACING.XS },
                ]}
              >
                {t('maintenance.cost', { defaultValue: 'Cost' })}
              </Text>
              <Text style={[styles.cardValue, { fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD }]} numberOfLines={1}>
                {item.cost ? `${item.currency || '$'}${item.cost}` : t('common.na')}
              </Text>
            </View>
          </View>

          {item.description ? (
            <View
              style={[
                styles.cardDescriptionContainer,
                {
                  marginTop: RESPONSIVE_CONSTANTS.SPACING.MD,
                  padding: RESPONSIVE_CONSTANTS.SPACING.MD,
                  borderRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS / 1.5,
                },
              ]}
            >
              <Text
                style={[
                  styles.cardLabel,
                  { fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.XS, marginBottom: RESPONSIVE_CONSTANTS.SPACING.XS },
                ]}
              >
                {t('maintenance.description')}
              </Text>
              <Text
                style={[
                  styles.cardDescription,
                  {
                    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
                    lineHeight: RESPONSIVE_CONSTANTS.FONT_SIZES.SM * 1.4,
                  },
                ]}
                numberOfLines={3}
              >
                {item.description}
              </Text>
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.cardFooter,
            {
              paddingHorizontal: RESPONSIVE_CONSTANTS.CARD_PADDING,
              paddingVertical: RESPONSIVE_CONSTANTS.SPACING.SM,
            },
          ]}
        >
          <Text style={[styles.cardFooterText, { fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.XS }]}>
            Tap to view details
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#003667" />
        </View>
      </TouchableOpacity>
    );
  }, [RESPONSIVE_CONSTANTS, formatDate, getStatusColor, getStatusText, handleRowPress, t]);

  const keyExtractor = useCallback((item, index) => {
    const key = item.maintenance_id || item.schedule_id || item.id || item.maintenanceId || item.guid;
    if (key) {
      return key.toString();
    }
    return `maintenance-${index}`;
  }, []);

  return (
    <View style={[styles.safeContainer, { paddingTop: insets.top }]}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#003667"
          translucent={Platform.OS === 'android'}
        />

        <View style={styles.appbarContainer}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              {
                padding: RESPONSIVE_CONSTANTS.SPACING.MD,
                marginLeft: RESPONSIVE_CONSTANTS.SPACING.SM,
              },
            ]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FEC200" />
          </TouchableOpacity>

          <Text style={[styles.appbarTitle, { fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG }]} numberOfLines={1}>
            {t('maintenance.maintenanceSupervisor')}
          </Text>

          <TouchableOpacity
            style={[
              styles.iconButton,
              {
                padding: RESPONSIVE_CONSTANTS.SPACING.MD,
                marginRight: RESPONSIVE_CONSTANTS.SPACING.SM,
              },
            ]}
            onPress={openMenu}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="menu" size={24} color="#FEC200" />
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          <View
            style={[
              styles.actionBar,
              {
                paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
                paddingTop: RESPONSIVE_CONSTANTS.SPACING.LG,
                marginBottom: RESPONSIVE_CONSTANTS.SPACING.XL,
                gap: RESPONSIVE_CONSTANTS.SPACING.MD,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.secondaryActionButton,
                {
                  height: RESPONSIVE_CONSTANTS.BUTTON_HEIGHT,
                  borderRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
                  paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.XL,
                },
              ]}
              onPress={handleRefresh}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="refresh" size={20} color="#003667" />
              <Text style={[styles.secondaryActionButtonText, { fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD }]}>
                {t('common.refresh')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryActionButton,
                {
                  width: RESPONSIVE_CONSTANTS.BUTTON_HEIGHT,
                  height: RESPONSIVE_CONSTANTS.BUTTON_HEIGHT,
                  borderRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
                },
              ]}
              onPress={handleAddMaintenance}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.tableContainer,
              {
                width: RESPONSIVE_CONSTANTS.getTableContainerWidth(),
                marginHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
                borderRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
              },
              responsiveHelpers.deviceType === 'desktop' && styles.tableContainerDesktop,
              responsiveHelpers.deviceType === 'tablet' && styles.tableContainerTablet,
            ]}
          >
            <View
              style={[
                styles.tableHeader,
                {
                  padding: RESPONSIVE_CONSTANTS.SPACING.XL,
                  borderTopLeftRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
                  borderTopRightRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
                },
              ]}
            >
              <Text style={[styles.headerText, { fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.XL }]} numberOfLines={1}>
                {t('maintenance.maintenanceRecords')}
              </Text>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#003667" />
                <Text
                  style={[
                    styles.loadingText,
                    {
                      fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
                      marginTop: RESPONSIVE_CONSTANTS.SPACING.LG,
                    },
                  ]}
                >
                  {t('common.loading')}
                </Text>
              </View>
            ) : maintenanceData.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#666" />
                <Text
                  style={[
                    styles.emptyText,
                    {
                      fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
                      marginTop: RESPONSIVE_CONSTANTS.SPACING.LG,
                    },
                  ]}
                >
                  {t('maintenance.noMaintenanceFound')}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.refreshButton,
                    {
                      marginTop: RESPONSIVE_CONSTANTS.SPACING.XL,
                      borderRadius: RESPONSIVE_CONSTANTS.SPACING.SM,
                      paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.XXL,
                      paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
                    },
                  ]}
                  onPress={handleRefresh}
                >
                  <Text style={[styles.refreshButtonText, { fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD }]}>
                    {t('common.refresh')}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={maintenanceData}
                renderItem={renderMaintenanceItem}
                keyExtractor={keyExtractor}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  styles.listContainer,
                  {
                    padding: RESPONSIVE_CONSTANTS.SPACING.LG,
                  },
                  responsiveHelpers.deviceType === 'desktop' && styles.listContainerDesktop,
                  responsiveHelpers.deviceType === 'tablet' && styles.listContainerTablet,
                ]}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#003667"]} />
                }
              />
            )}
          </View>
        </View>

        <SideMenu visible={menuVisible} onClose={closeMenu} onLogout={handleLogout} />

        <CustomAlert {...alertConfig} />
      </View>
  );
};

const MaintenanceSupervisorListScreen = () => (
  <SafeAreaProvider>
    <MaintenanceSupervisorListContent />
  </SafeAreaProvider>
);

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#003667',
  },
  appbarContainer: {
    backgroundColor: '#003667',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    paddingVertical: 8,
    ...Platform.select({
      ios: {},
      android: {
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  appbarTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#EEEEEE',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  primaryActionButton: {
    backgroundColor: '#003667',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#003667',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  secondaryActionButtonText: {
    color: '#003667',
    fontWeight: '600',
    marginLeft: 8,
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tableContainerDesktop: {
    alignSelf: 'center',
    maxWidth: 1000,
  },
  tableContainerTablet: {
    alignSelf: 'center',
    maxWidth: 800,
  },
  tableHeader: {
    backgroundColor: '#003366',
  },
  headerText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 32,
  },
  listContainerDesktop: {
    paddingHorizontal: 32,
  },
  listContainerTablet: {
    paddingHorizontal: 24,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F8FA',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardId: {
    fontWeight: 'bold',
    color: '#003667',
  },
  statusBadge: {
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  cardBody: {
    backgroundColor: '#FFFFFF',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardInfoBlock: {
    flex: 1,
  },
  cardLabel: {
    color: '#616161',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    color: '#333333',
    fontWeight: '600',
  },
  cardDescriptionContainer: {
    backgroundColor: '#F9FAFB',
    borderLeftWidth: 3,
    borderLeftColor: '#FEC200',
  },
  cardDescription: {
    color: '#555555',
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F8FA',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cardFooterText: {
    color: '#003667',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    color: '#666666',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: '#666666',
    fontWeight: '500',
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#003667',
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default MaintenanceSupervisorListScreen;

