import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { Appbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import CustomAlert from '../../components/CustomAlert';
import { authUtils } from '../../utils/auth';
import SideMenu from '../../components/SideMenu';
import { useNavigation as useNavigationContext } from '../../context/NavigationContext';

const MaintenanceSupervisorListScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { hasAccess } = useNavigationContext();
  const [menuVisible, setMenuVisible] = useState(false);
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

  // Mock data for maintenance supervisor
  const [maintenanceData, setMaintenanceData] = useState([
    {
      id: 'ams001',
      assetId: 'ASS001',
      assetType: t('maintenance.laptop'),
      serialNumber: 'LAP00001',
      description: t('maintenance.macBookPro'),
      maintenanceType: t('maintenance.regularMaintenance'),
      vendor: 'Jeniefer Antony',
      status: 'CO',
    },
    {
      id: 'ams002',
      assetId: 'ASS002',
      assetType: t('maintenance.desktop'),
      serialNumber: 'DES00002',
      description: t('maintenance.dellOptiPlex'),
      maintenanceType: t('maintenance.preventiveMaintenance'),
      vendor: 'Mike Johnson',
      status: 'IN',
    },
    {
      id: 'ams003',
      assetId: 'ASS003',
      assetType: t('maintenance.monitor'),
      serialNumber: 'MON00003',
      description: t('maintenance.hpEliteDisplay'),
      maintenanceType: t('maintenance.emergencyMaintenance'),
      vendor: 'Sarah Wilson',
      status: 'PE',
    },
    {
      id: 'ams004',
      assetId: 'ASS004',
      assetType: t('maintenance.printer'),
      serialNumber: 'PRI00004',
      description: t('maintenance.canonImageRunner'),
      maintenanceType: t('maintenance.regularMaintenance'),
      vendor: 'David Brown',
      status: 'CO',
    },
    {
      id: 'ams005',
      assetId: 'ASS005',
      assetType: t('maintenance.scanner'),
      serialNumber: 'SCA00005',
      description: t('maintenance.epsonWorkForce'),
      maintenanceType: t('maintenance.preventiveMaintenance'),
      vendor: 'Lisa Davis',
      status: 'IN',
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
    showAlert(t('maintenance.maintenanceDetails'), `${t('maintenance.selected')}: ${item.id}`, 'info');
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

  const renderMaintenanceItem = ({ item }) => (
    <TouchableOpacity
      style={styles.tableRow}
      onPress={() => handleRowPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cellContainer}>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>{t('maintenance.id')}</Text>
          <Text style={styles.cellValue}>{item.id}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>{t('maintenance.assetId')}</Text>
          <Text style={styles.cellValue}>{item.assetId}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>{t('maintenance.assetType')}</Text>
          <Text style={styles.cellValue}>{item.assetType}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>{t('maintenance.serialNumber')}</Text>
          <Text style={styles.cellValue}>{item.serialNumber}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>{t('maintenance.description')}</Text>
          <Text style={styles.cellValue}>{item.description}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>{t('maintenance.maintenanceType')}</Text>
          <Text style={styles.cellValue}>{item.maintenanceType}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>{t('maintenance.vendor')}</Text>
          <Text style={styles.cellValue}>{item.vendor}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>{t('maintenance.status')}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FEC200" />
        </TouchableOpacity>
        <View style={styles.centerTitleContainer}>
          <Text style={styles.appbarTitle}>{t('maintenance.maintenanceSupervisor')}</Text>
        </View>
      </Appbar.Header>

      <View style={styles.content}>
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.actionButton} onPress={handleFilter}>
            <MaterialCommunityIcons name="filter-variant" size={24} color="#FFD700" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleAddMaintenance}>
            <MaterialCommunityIcons name="plus" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={styles.headerText}>{t('maintenance.maintenanceRecords')}</Text>
          </View>
          
          <FlatList
            data={maintenanceData}
            renderItem={renderMaintenanceItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
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
    backgroundColor: '#EEEEEE',
  },
  appbar: {
    backgroundColor: '#003667',
    elevation: 0,
    shadowOpacity: 0,
    height: 60,
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
    color: '#333',
    fontWeight: '500',
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
});

export default MaintenanceSupervisorListScreen;
