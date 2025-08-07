import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Appbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import CustomAlert from '../components/CustomAlert';
import { authUtils } from '../utils/auth';
import SideMenu from '../components/SideMenu';
import { useNavigation as useNavigationContext } from '../context/NavigationContext';
import { navigationService } from '../services/navigationService';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation();
  const { getSortedNavigation, clearNavigation } = useNavigationContext();
  const [menuVisible, setMenuVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
    onCancel: () => {},
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false,
  });

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
      confirmText: 'OK',
      cancelText: 'Cancel',
      showCancel,
    });
  };

  const handleLogout = async () => {
    showAlert(
      "Logout",
      "Are you sure you want to logout?",
      'warning',
      async () => {
        try {
          await authUtils.removeToken();
          clearNavigation();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        } catch (error) {
          console.error('Logout error:', error);
          showAlert('Error', 'Failed to logout. Please try again.', 'error');
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

  // Generate dynamic menu items based on user navigation
  const generateMenuItems = () => {
    const navigationItems = getSortedNavigation();
    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#607D8B'];
    
    // If no navigation items are available, show default items
    if (!navigationItems || navigationItems.length === 0) {
      return [
        {
          id: 'asset_default',
          title: 'Asset Assignment',
          subtitle: 'Scan and manage assets',
          icon: 'barcode-scan',
          color: '#4CAF50',
          onPress: () => navigation.navigate('Asset'),
        },
        {
          id: 'employee_default',
          title: 'Employee Assets',
          subtitle: 'View employee asset assignments',
          icon: 'account-group',
          color: '#2196F3',
          onPress: () => navigation.navigate('EmployeeAsset'),
        },
        {
          id: 'department_default',
          title: 'Department Assets',
          subtitle: 'Manage department asset allocations',
          icon: 'domain',
          color: '#FF9800',
          onPress: () => navigation.navigate('DepartmentAsset'),
        },
      ];
    }
    
    // Remove duplicates based on app_id
    const uniqueItems = navigationItems.filter((item, index, self) => 
      index === self.findIndex(t => t.app_id === item.app_id)
    );
    
    return uniqueItems.map((item, index) => ({
      id: `${item.app_id.toLowerCase()}_${index}`,
      title: item.label,
      subtitle: `Manage ${item.label.toLowerCase()}`,
      icon: navigationService.getNavigationIcon(item.app_id),
      color: colors[index % colors.length],
      onPress: () => navigation.navigate(navigationService.getScreenName(item.app_id)),
    }));
  };

  const menuItems = React.useMemo(() => {
    return generateMenuItems();
  }, [getSortedNavigation]);

  const renderMenuItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
        <MaterialCommunityIcons
          name={item.icon}
          size={32}
          color={item.color}
        />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuTitle}>{item.title}</Text>
        <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color="#666"
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* AppBar */}
      <Appbar.Header style={styles.appbar}>
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={toggleMenu}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="menu" size={24} color="#FEC200" />
        </TouchableOpacity>
        <View style={styles.centerTitleContainer}>
          <Text style={styles.appbarTitle}>Asset Management</Text>
        </View>
        {/* <Appbar.Action icon="logout" color="#FEC200" onPress={handleLogout} /> */}
      </Appbar.Header>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome Back!</Text>
          <Text style={styles.welcomeSubtitle}>
            Manage your assets efficiently with our comprehensive tools
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="barcode-scan" size={24} color="#4CAF50" />
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>Total Assets</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="account-group" size={24} color="#2196F3" />
            <Text style={styles.statNumber}>30</Text>
            <Text style={styles.statLabel}>Employees</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="domain" size={24} color="#FF9800" />
            <Text style={styles.statNumber}>6</Text>
            <Text style={styles.statLabel}>Departments</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          {menuItems.map(renderMenuItem)}
        </View>

        {/* Recent Activity */}
        {/* <View style={styles.activityContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.activityText}>Asset LAPTOP-001 assigned to John Doe</Text>
              <Text style={styles.activityTime}>2 hours ago</Text>
            </View>
            <View style={styles.activityItem}>
              <MaterialCommunityIcons name="barcode-scan" size={20} color="#2196F3" />
              <Text style={styles.activityText}>New asset MONITOR-005 scanned</Text>
              <Text style={styles.activityTime}>4 hours ago</Text>
            </View>
            <View style={styles.activityItem}>
              <MaterialCommunityIcons name="account-multiple" size={20} color="#FF9800" />
              <Text style={styles.activityText}>Department IT assets updated</Text>
              <Text style={styles.activityTime}>1 day ago</Text>
            </View>
          </View>
        </View> */}
      </ScrollView>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        showCancel={alertConfig.showCancel}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />

      {/* Side Menu */}
      <SideMenu
        visible={menuVisible}
        onClose={closeMenu}
        onLogout={handleLogout}
      />
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
  },
  welcomeSection: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#003667',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#7A7A7A',
    textAlign: 'center',
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003667',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#7A7A7A',
    marginTop: 4,
  },
  menuContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003667',
    marginBottom: 16,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#7A7A7A',
  },
  activityContainer: {
    marginBottom: 24,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: '#222',
    marginLeft: 12,
  },
  activityTime: {
    fontSize: 12,
    color: '#7A7A7A',
  },
});

export default HomeScreen; 