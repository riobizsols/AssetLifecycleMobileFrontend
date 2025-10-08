import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Platform,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
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
import { API_CONFIG, getApiHeaders, API_ENDPOINTS, getServerUrl } from '../../config/api';

const MaintenanceSupervisorListScreen = () => {
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

  // State for maintenance schedules data
  const [maintenanceData, setMaintenanceData] = useState([]);

  // Fetch maintenance schedules from API
  const fetchMaintenanceSchedules = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const serverUrl = getServerUrl();
      const endpoint = API_ENDPOINTS.GET_MAINTENANCE_SCHEDULES();
      const url = `${serverUrl}${endpoint}`;

      console.log('Fetching maintenance schedules from:', url);

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
      console.log('Maintenance schedules fetched successfully:', data.data?.length || 0, 'items');
      console.log('Full API response:', JSON.stringify(data, null, 2));
      
      // Handle different response structures
      let maintenanceArray = [];
      if (data.success && data.data) {
        maintenanceArray = data.data;
      } else if (data.data && Array.isArray(data.data)) {
        maintenanceArray = data.data;
      } else if (Array.isArray(data)) {
        maintenanceArray = data;
      } else {
        console.warn('Unexpected API response structure:', data);
        maintenanceArray = [];
      }
      
      console.log('Processed maintenance data:', JSON.stringify(maintenanceArray, null, 2));
      setMaintenanceData(maintenanceArray);
    } catch (error) {
      console.error('Error fetching maintenance schedules:', error);
      showAlert(
        t('maintenance.error'),
        t('maintenance.failedToLoadData') || 'Failed to load maintenance schedules. Please try again.',
        'error'
      );
      setMaintenanceData([]);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchMaintenanceSchedules();
  }, []);

  // Handle pull to refresh
  const onRefresh = () => {
    fetchMaintenanceSchedules(true);
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
  };

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const handleFilter = () => {
    showAlert(t('maintenance.filter'), t('maintenance.filterFunctionalityWillBeImplemented'), 'info');
  };

  const handleAddMaintenance = () => {
    navigation.navigate('MaintenanceSupervisorForm');
  };

  const handleRowPress = (item) => {
    // Navigate to add new maintenance form
    navigation.navigate('MaintenanceSupervisorForm');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CO':
        return '#4CAF50'; // Green for Completed
      case 'IN':
        return '#2196F3'; // Blue for In Progress
      case 'PE':
        return '#FF9800'; // Orange for Pending
      default:
        return '#757575'; // Grey for unknown
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'CO':
        return t('maintenance.completed');
      case 'IN':
        return t('maintenance.inProgress');
      case 'PE':
        return t('maintenance.pending');
      default:
        return status;
    }
  };

  const renderMaintenanceItem = ({ item }) => {
    // Handle different data structures from API with comprehensive field mapping
    const getValue = (possibleFields) => {
      if (typeof possibleFields === 'string') {
        possibleFields = [possibleFields];
      }
      
      for (const field of possibleFields) {
        if (item[field] !== undefined && item[field] !== null && item[field] !== '') {
          return item[field];
        }
      }
      return 'N/A';
    };

    // Log the item structure for debugging
    console.log('Rendering maintenance item:', JSON.stringify(item, null, 2));
    console.log('Available fields in item:', Object.keys(item));

    return (
      <TouchableOpacity
        style={styles.tableRow}
        onPress={() => handleRowPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cellContainer}>
           <View style={styles.cell}>
             <Text style={styles.cellLabel}>{t('maintenance.id')}</Text>
             <Text style={styles.cellValue}>{getValue(['id', 'ams_id', 'maintenance_id', 'schedule_id', '_id'])}</Text>
           </View>
          <View style={styles.cell}>
            <Text style={styles.cellLabel}>{t('maintenance.assetId')}</Text>
            <Text style={styles.cellValue}>{getValue(['assetId', 'asset_id', 'assetId', 'asset'])}</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.cellLabel}>{t('maintenance.assetType')}</Text>
            <Text style={styles.cellValue}>{getValue(['assetType', 'asset_type_name', 'asset_type', 'type', 'category'])}</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.cellLabel}>{t('maintenance.serialNumber')}</Text>
            <Text style={styles.cellValue}>{getValue(['serialNumber', 'serial_number', 'serial', 'serialNo'])}</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.cellLabel}>{t('maintenance.description')}</Text>
            <Text style={styles.cellValue}>{getValue(['description', 'desc', 'details', 'notes'])}</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.cellLabel}>{t('maintenance.maintenanceType')}</Text>
            <Text style={styles.cellValue}>{getValue(['maintenanceType', 'maintenance_type_name', 'maintenance_type', 'type', 'maintenance_category'])}</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.cellLabel}>{t('maintenance.vendor')}</Text>
            <Text style={styles.cellValue}>{getValue(['vendor', 'vendor_name', 'technician', 'assigned_to', 'performed_by'])}</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.cellLabel}>{t('maintenance.status')}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status || item.status_code || item.state) }]}>
              <Text style={styles.statusText}>{getStatusText(item.status || item.status_code || item.state)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#003667"
        translucent={Platform.OS === 'android'}
      />
      {/* AppBar */}
      <View style={styles.appbarContainer}>
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FEC200" />
        </TouchableOpacity>
        <View style={styles.centerTitleContainer}>
          <Text style={styles.appbarTitle}>{t('maintenance.maintenanceSupervisor')}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.actionButton} onPress={handleFilter}>
            <MaterialCommunityIcons name="filter-variant" size={24} color="#FFD700" />
          </TouchableOpacity>
        </View>

        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={styles.headerText}>{t('maintenance.maintenanceRecords')}</Text>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#003667" />
              <Text style={styles.loadingText}>{t('common.loading') || 'Loading...'}</Text>
            </View>
          ) : maintenanceData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="toolbox-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>{t('maintenance.noMaintenanceRecords') || 'No maintenance records found'}</Text>
            </View>
          ) : (
            <FlatList
              data={maintenanceData}
              renderItem={renderMaintenanceItem}
              keyExtractor={(item) => item.id || item._id || Math.random().toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#003667']}
                  tintColor="#003667"
                />
              }
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
    backgroundColor: '#003667',
  },
  appbarContainer: {
    backgroundColor: '#003667',
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
    backgroundColor: '#003667',
    elevation: 0,
    shadowOpacity: 0,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
  },
  menuButton: {
    padding: 12,
    marginLeft: 8,
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
    fontSize: 16,
    alignSelf: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#EEEEEE',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    width: 48,
    height: 48,
    backgroundColor: '#003667',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flex: 1,
  },
  tableHeader: {
    backgroundColor: '#003667',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  tableRow: {
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cellContainer: {
    padding: 16,
  },
  cell: {
    marginBottom: 12,
  },
  cellLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  cellValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default MaintenanceSupervisorListScreen;
