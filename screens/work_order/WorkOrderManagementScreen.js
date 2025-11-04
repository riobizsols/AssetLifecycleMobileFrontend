import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  RefreshControl,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import CustomAlert from '../../components/CustomAlert';
import { UI_CONSTANTS } from '../../utils/uiConstants';
import { API_CONFIG, API_ENDPOINTS, getApiHeaders } from '../../config/api';

const { width, height } = Dimensions.get('window');

// Responsive design breakpoints
const BREAKPOINTS = {
  SMALL: 320,
  MEDIUM: 375,
  LARGE: 414,
  TABLET: 768,
  DESKTOP: 1024,
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
  const scaleFactor = width / BREAKPOINTS.MEDIUM;
  return Math.max(size * scaleFactor, size * 0.8);
};

const verticalScale = (size) => {
  const scaleFactor = height / 812;
  return Math.max(size * scaleFactor, size * 0.8);
};

const moderateScale = (size, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

// Responsive UI constants
const RESPONSIVE_CONSTANTS = {
  SPACING: {
    XS: scale(4),
    SM: scale(8),
    MD: scale(12),
    LG: scale(16),
    XL: scale(20),
    XXL: scale(24),
  },
  FONT_SIZES: {
    XS: moderateScale(10),
    SM: moderateScale(12),
    MD: moderateScale(14),
    LG: moderateScale(16),
    XL: moderateScale(18),
    XXL: moderateScale(20),
  },
  CARD_PADDING: scale(16),
  CARD_BORDER_RADIUS: scale(12),
  INPUT_HEIGHT: verticalScale(48),
  BUTTON_HEIGHT: verticalScale(48),
};

const WorkOrderManagementScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  // Work order data from API
  const [workOrders, setWorkOrders] = useState([]);

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

  useEffect(() => {
    loadWorkOrders();
  }, [loadWorkOrders]);

  // Function to format date to show only date part
  const formatDateOnly = (dateString) => {
    if (!dateString) {
      return '';
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }

      // Format as YYYY-MM-DD
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.warn('Error formatting date:', error);
      return dateString;
    }
  };

  // Function to normalize status values
  const normalizeStatus = (status) => {
    if (!status) {
      return 'pending';
    }

    const normalized = status.toString().toLowerCase().trim();

    // Handle common status variations
    const statusMap = {
      'in': 'in_progress',
      'in progress': 'in_progress',
      'in-progress': 'in_progress',
      'inprogress': 'in_progress',
      'pending': 'pending',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'canceled': 'cancelled',
      'active': 'active',
      'inactive': 'inactive',
      'open': 'open',
      'closed': 'closed',
    };

    return statusMap[normalized] || normalized;
  };

  const loadWorkOrders = useCallback(async () => {
    try {
      setLoading(true);
      const headers = await getApiHeaders();
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_WORK_ORDERS()}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Raw API response:', JSON.stringify(responseData, null, 2));

      // Handle different response formats
      let data = [];
      if (Array.isArray(responseData)) {
        data = responseData;
      } else if (responseData && Array.isArray(responseData.data)) {
        data = responseData.data;
      } else if (responseData && Array.isArray(responseData.workOrders)) {
        data = responseData.workOrders;
      } else if (responseData && Array.isArray(responseData.results)) {
        data = responseData.results;
      } else {
        console.warn('Unexpected API response format:', responseData);
        data = [];
      }

      console.log('Extracted data array:', data);
      if (data.length > 0) {
        console.log('Sample item structure:', JSON.stringify(data[0], null, 2));
        console.log('Sample item keys:', Object.keys(data[0]));
      }

      // Transform the API data to match our expected format
      const transformedData = data.map((item, index) => {
        console.log(`Processing item ${index}:`, item);

        // Log all available keys for debugging
        console.log(`Available keys in item ${index}:`, Object.keys(item));
        if (item.asset) {
          console.log(`Asset object for item ${index}:`, item.asset);
          console.log(`Asset keys for item ${index}:`, Object.keys(item.asset));
        }
        if (item.vendor) {
          console.log(`Vendor object for item ${index}:`, item.vendor);
          console.log(`Vendor keys for item ${index}:`, Object.keys(item.vendor));
        }
        // Helper function to extract string value from asset_type (handle both object and string)
        const getAssetTypeName = () => {
          // If asset_type is an object, extract the name
          if (item.asset_type && typeof item.asset_type === 'object') {
            return item.asset_type.asset_type_name || item.asset_type.name || item.asset_type.text || null;
          }
          if (item.asset?.asset_type && typeof item.asset.asset_type === 'object') {
            return item.asset.asset_type.asset_type_name || item.asset.asset_type.name || item.asset.asset_type.text || null;
          }
          // Otherwise try direct string values
          return item.asset_type_name || item.asset?.asset_type_name || (typeof item.assetType === 'string' ? item.assetType : null) || (typeof item.asset_type === 'string' ? item.asset_type : null) || item.ASSET_TYPE || item.equipment_type || null;
        };

        // Helper function to extract asset type ID (handle both object and string)
        const getAssetTypeId = () => {
          // If asset_type is an object, extract the ID
          if (item.asset_type && typeof item.asset_type === 'object') {
            return item.asset_type.asset_type_id || item.asset_type.id || null;
          }
          if (item.asset?.asset_type && typeof item.asset.asset_type === 'object') {
            return item.asset.asset_type.asset_type_id || item.asset.asset_type.id || null;
          }
          // Otherwise try direct values
          return item.asset?.asset_type_id || item.asset_type_id || item.assetTypeId || item.ASSET_TYPE_ID || item.equipment_type_id || null;
        };

        const transformed = {
          id: item.work_order_id || item.id || item.workOrderId || item.wo_id || item.workorder_id || item.WO_ID,
          title: item.title || item.work_order_title || item.workOrderTitle || item.work_title || item.subject || item.WORK_ORDER_TITLE,
          assetId: item.asset?.asset_id || item.asset_id || item.assetId || item.asset_serial || item.ASSET_ID || item.asset_serial_number,
          assetName: (item.asset?.description && item.asset.description !== 'NULL') ? item.asset.description : (item.asset?.serial_number || item.asset?.asset_id) || item.asset_name || item.assetName || item.equipment_name || item.device_name || item.ASSET_NAME || item.asset_model,
          priority: ((item.priority || item.work_priority || item.priority_level || item.PRIORITY || 'medium')?.toString() || 'medium').toLowerCase(),
          status: normalizeStatus(item.status || item.work_status || item.state || item.STATUS || item.work_order_status || 'pending'),
          assignedTo: item.assigned_to || item.assigned_technician || item.assignedTo || item.technician_name || item.assignee || item.ASSIGNED_TO || item.technician || item.assigned_user,
          createdDate: item.created_date || item.created_at || item.createdDate || item.date_created || item.created || item.CREATED_DATE || item.work_order_date,
          dueDate: item.due_date || item.expected_completion_date || item.dueDate || item.completion_date || item.target_date || item.DUE_DATE || item.expected_date || item.scheduled_date,
          description: item.description || item.work_description || item.workDescription || item.notes || item.details || item.DESCRIPTION || item.work_notes || item.remarks,
          maintenanceType: item.maintenance_type_name || item.maintenance_type || item.work_type || item.type || item.maintenanceType || item.MAINTENANCE_TYPE || item.work_order_type,
          startDate: item.act_maint_st_date || item.start_date || item.actual_start_date || item.startDate || item.START_DATE || item.work_start_date || item.commencement_date,
          assetType: getAssetTypeName(),
          assetTypeId: getAssetTypeId(),
          // Vendor information
          vendorName: item.vendor?.vendor_name || item.vendor?.name || item.vendor_name || item.vendorName || item.service_vendor_name || item.SERVICE_VENDOR_NAME || null,
          vendorEmail: item.vendor?.email || item.vendor?.vendor_email || item.vendor_email || item.vendorEmail || item.service_vendor_email || item.SERVICE_VENDOR_EMAIL || null,
          contactPerson: item.vendor?.contact_person || item.vendor?.contact_name || item.contact_person || item.contactPerson || item.vendor_contact_person || item.CONTACT_PERSON || null,
          vendorPhone: item.vendor?.phone || item.vendor?.vendor_phone || item.vendor_phone || item.vendorPhone || item.service_vendor_phone || item.SERVICE_VENDOR_PHONE || null,
          // Keep full vendor object if needed
          vendor: item.vendor || null,
        };

        console.log(`Transformed item ${index}:`, transformed);
        return transformed;
      });

      console.log('Final transformed work orders:', transformedData);
      setWorkOrders(transformedData);
    } catch (error) {
      console.error('Error loading work orders:', error);

      let errorMessage = t('workOrder.failedToLoadWorkOrders') || 'Failed to load work orders. Please try again.';

      if (error.message.includes('HTTP error')) {
        errorMessage = `Server error: ${error.message}`;
      } else if (error.message.includes('Network')) {
        errorMessage = 'Network error: Please check your internet connection.';
      } else if (error.message.includes('JSON')) {
        errorMessage = 'Data format error: Invalid response from server.';
      }

      showAlert(
        t('workOrder.error') || 'Error',
        errorMessage,
        'error'
      );
      // Set empty array on error
      setWorkOrders([]);
    } finally {
      setLoading(false);
    }
  }, [t, showAlert]);

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


  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadWorkOrders();
    } finally {
      setRefreshing(false);
    }
  };

  const handleWorkOrderPress = (workOrder) => {
    // Navigate to work order details screen
    navigation.navigate('WorkOrderDetails', { workOrder: workOrder });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'in_progress':
        return '#2196F3';
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  const filterWorkOrders = () => {
    let filtered = workOrders;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(wo => wo.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(wo =>
        (wo.id && wo.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (wo.title && wo.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (wo.assetId && wo.assetId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (wo.maintenanceType && wo.maintenanceType.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (wo.assetType && wo.assetType.toLowerCase().includes(searchQuery.toLowerCase())),
      );
    }

    return filtered;
  };

  const renderWorkOrderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.workOrderCard,
        DEVICE_TYPE === 'desktop' && styles.workOrderCardDesktop,
        DEVICE_TYPE === 'tablet' && styles.workOrderCardTablet,
      ]}
      onPress={() => handleWorkOrderPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.workOrderId} numberOfLines={1}>
            {item.id}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {t(`workOrder.status_${item.status}`)}
          </Text>
        </View>
      </View>

      <Text style={styles.workOrderTitle} numberOfLines={2}>
        {item.title}
      </Text>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('workOrder.assetId')}:</Text>
          <Text style={styles.detailValue} numberOfLines={1}>
            {item.assetId}
          </Text>
        </View>

        {item.maintenanceType && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('workOrder.maintenanceType')}:</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {item.maintenanceType}
            </Text>
          </View>
        )}

        {item.startDate && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('workOrder.startDate')}:</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {formatDateOnly(item.startDate)}
            </Text>
          </View>
        )}

        {item.assetType && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('workOrder.assetType')}:</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {typeof item.assetType === 'string' ? item.assetType : item.assetType?.asset_type_name || item.assetType?.name || item.assetType?.text || 'N/A'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const filterOptions = ['all', 'pending', 'in_progress', 'completed', 'cancelled'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={UI_CONSTANTS.COLORS.PRIMARY} />

      {/* AppBar */}
      <View style={styles.appBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FEC200" />
        </TouchableOpacity>
        <View style={styles.centerTitleContainer}>
          <Text
            style={styles.appbarTitle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {t('workOrder.workOrderManagement')}
          </Text>
        </View>
        <View style={styles.rightPlaceholder} />
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#003667']}
            tintColor="#003667"
          />
        }
      >
        {/* Search and Filter Section */}
        <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={20} color="#616161" />
              <TextInput
                style={styles.searchInput}
                placeholder={t('workOrder.searchWorkOrders')}
                placeholderTextColor="#9E9E9E"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialCommunityIcons name="close" size={20} color="#616161" />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowFilterDropdown(!showFilterDropdown)}
              >
                <MaterialCommunityIcons name="filter-variant" size={20} color="#003667" />
                <Text style={styles.filterButtonText}>
                  {t(`workOrder.filter_${filterStatus}`)}
                </Text>
                <MaterialCommunityIcons
                  name={showFilterDropdown ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#003667"
                />
              </TouchableOpacity>

              {showFilterDropdown && (
                <View style={styles.filterDropdown}>
                  {filterOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={styles.filterOption}
                      onPress={() => {
                        setFilterStatus(option);
                        setShowFilterDropdown(false);
                      }}
                    >
                      <Text style={styles.filterOptionText}>
                        {t(`workOrder.filter_${option}`)}
                      </Text>
                      {filterStatus === option && (
                        <MaterialCommunityIcons name="check" size={20} color="#003667" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Work Orders List */}
          <View style={styles.listContainer}>
            {loading && !refreshing ? (
              <View style={styles.loadingContainer}>
                <MaterialCommunityIcons name="loading" size={48} color="#003667" />
                <Text style={styles.loadingText}>{t('workOrder.loading') || 'Loading work orders...'}</Text>
              </View>
            ) : (
              <>
                {filterWorkOrders().map((item) => (
                  <View key={item.id}>
                    {renderWorkOrderItem({ item })}
                  </View>
                ))}

                {filterWorkOrders().length === 0 && !loading && (
                  <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="clipboard-text-off-outline" size={64} color="#BDBDBD" />
                    <Text style={styles.emptyText}>{t('workOrder.noWorkOrdersFound') || 'No work orders found'}</Text>
                    <Text style={styles.emptySubtext}>{t('workOrder.tryDifferentFilter') || 'Try adjusting your filters or search terms'}</Text>
                  </View>
                )}
              </>
            )}
          </View>
      </ScrollView>


      {/* Custom Alert */}
      <CustomAlert {...alertConfig} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
  },
  appBar: {
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: RESPONSIVE_CONSTANTS.SPACING.SM,
    paddingBottom: RESPONSIVE_CONSTANTS.SPACING.SM,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  rightPlaceholder: {
    padding: RESPONSIVE_CONSTANTS.SPACING.MD,
    marginRight: RESPONSIVE_CONSTANTS.SPACING.SM,
    zIndex: 2,
  },
  appbarTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: UI_CONSTANTS.COLORS.BACKGROUND,
  },
  searchSection: {
    backgroundColor: UI_CONSTANTS.COLORS.BACKGROUND,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.SM,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.MD,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
    height: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
  },
  searchInput: {
    flex: 1,
    marginLeft: RESPONSIVE_CONSTANTS.SPACING.SM,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#333',
  },
  filterContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.SM,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.MD,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.SM,
    gap: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  filterButtonText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#003667',
    fontWeight: '500',
    flex: 1,
  },
  filterDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.SM,
    marginTop: RESPONSIVE_CONSTANTS.SPACING.XS,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.MD,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  filterOptionText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#333',
  },
  listContainer: {
    backgroundColor: UI_CONSTANTS.COLORS.BACKGROUND,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingTop: RESPONSIVE_CONSTANTS.SPACING.MD,
    paddingBottom: RESPONSIVE_CONSTANTS.SPACING.XXL,
  },
  workOrderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    padding: RESPONSIVE_CONSTANTS.SPACING.LG,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  workOrderCardDesktop: {
    padding: RESPONSIVE_CONSTANTS.SPACING.XL,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  workOrderCardTablet: {
    padding: RESPONSIVE_CONSTANTS.SPACING.LG,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RESPONSIVE_CONSTANTS.SPACING.SM,
    flex: 1,
  },
  workOrderId: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    fontWeight: '700',
    color: '#003667',
  },
  priorityBadge: {
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.SM,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.XS,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.XS,
  },
  priorityText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.XS,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.MD,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.XS,
    borderRadius: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  statusText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    fontWeight: '600',
  },
  workOrderTitle: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    fontWeight: '600',
    color: '#333',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  cardDetails: {
    gap: RESPONSIVE_CONSTANTS.SPACING.SM,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  detailLabel: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    color: '#616161',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  description: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    color: '#616161',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.XXL * 2,
  },
  emptyText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    fontWeight: '600',
    color: '#616161',
    marginTop: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  emptySubtext: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: '#9E9E9E',
    marginTop: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.XXL * 2,
  },
  loadingText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    fontWeight: '500',
    color: '#003667',
    marginTop: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
});

export default WorkOrderManagementScreen;

