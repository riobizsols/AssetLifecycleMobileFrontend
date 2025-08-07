import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { authUtils } from '../utils/auth';
import { useNavigation as useNavigationContext } from '../context/NavigationContext';
import { navigationService } from '../services/navigationService';

const { width, height } = Dimensions.get('window');

const SideMenu = ({ visible, onClose, onLogout }) => {
  const navigation = useNavigation();
  const { getSortedNavigation } = useNavigationContext();
  const slideAnim = React.useRef(new Animated.Value(-width)).current;
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await authUtils.getUserData();
        setUserData(user);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    if (visible) {
      loadUserData();
    }
  }, [visible]);

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  // Generate dynamic menu items based on user navigation
  const generateMenuItems = () => {
    const navigationItems = getSortedNavigation();
    
    const menuItems = [
      {
        id: 'dashboard',
        title: 'Dashboard',
        icon: 'view-dashboard',
        onPress: () => {
          onClose();
          navigation.navigate('Home');
        },
      },
    ];

    // If no navigation items are available, show default items
    if (!navigationItems || navigationItems.length === 0) {
      menuItems.push(
        {
          id: 'asset_default',
          title: 'Asset Assignment',
          icon: 'barcode-scan',
          onPress: () => {
            onClose();
            navigation.navigate('Asset');
          },
        },
        {
          id: 'employee_default',
          title: 'Employee Assets',
          icon: 'account-group',
          onPress: () => {
            onClose();
            navigation.navigate('EmployeeAsset');
          },
        },
        {
          id: 'department_default',
          title: 'Department Assets',
          icon: 'domain',
          onPress: () => {
            onClose();
            navigation.navigate('DepartmentAsset');
          },
        }
      );
    } else {
      // Remove duplicates based on app_id
      const uniqueItems = navigationItems.filter((item, index, self) => 
        index === self.findIndex(t => t.app_id === item.app_id)
      );
      
      // Add dynamic navigation items
      uniqueItems.forEach((item, index) => {
        menuItems.push({
          id: `${item.app_id.toLowerCase()}_${index}`,
          title: item.label,
          icon: navigationService.getNavigationIcon(item.app_id),
          onPress: () => {
            onClose();
            navigation.navigate(navigationService.getScreenName(item.app_id));
          },
        });
      });
    }

    return menuItems;
  };

  const menuItems = generateMenuItems();

  const renderMenuItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons
        name={item.icon}
        size={24}
        color="#003667"
        style={styles.menuIcon}
      />
      <Text style={styles.menuText}>{item.title}</Text>
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color="#666"
      />
    </TouchableOpacity>
  );

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <Animated.View
        style={[
          styles.menuContainer,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Image 
              source={require('../assets/rio-logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
              tintColor="#FEC200"
            />
            <Text style={styles.headerTitle}>Asset Management</Text>
            <Text style={styles.headerSubtitle}>v1.0.0</Text>
          </View>
          
          {/* User Details */}
          {userData && (
            <View style={styles.userSection}>
              <View style={styles.userAvatar}>
                <MaterialCommunityIcons
                  name="account-circle"
                  size={50}
                  color="#FEC200"
                />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {userData.full_name || userData.name || userData.username || 'User'}
                </Text>
                <Text style={styles.userEmail}>
                  {userData.email || 'user@example.com'}
                </Text>
                {userData.role && (
                  <Text style={styles.userRole}>
                    {userData.role}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menuList}>
          {menuItems.map(renderMenuItem)}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => {
                onClose();
                onLogout();
              }}
            >
              <MaterialCommunityIcons
                name="logout"
                size={24}
                color="#F44336"
              />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
            
            {/* User ID and Role Info */}
            {userData && (
              <View style={styles.userInfoRight}>
                {userData.user_id && (
                  <Text style={styles.userInfoText}>
                    User ID: {userData.user_id}
                  </Text>
                )}
                {userData.job_role_id && (
                  <Text style={styles.userInfoText}>
                    Role ID: {userData.job_role_id}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.8,
    height: height,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    backgroundColor: '#003667',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerLogo: {
    width: 120,
    height: 50,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FEC200',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  userAvatar: {
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#FEC200',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  menuList: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuIcon: {
    marginRight: 16,
    width: 24,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfoRight: {
    alignItems: 'flex-end',
  },
  userInfoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    textAlign: 'right',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 16,
    color: '#F44336',
    fontWeight: '600',
    marginLeft: 12,
  },
});

export default SideMenu; 