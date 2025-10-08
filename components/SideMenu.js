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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { authUtils } from '../utils/auth';
import { useNavigation as useNavigationContext } from '../context/NavigationContext';
import { navigationService } from '../services/navigationService';
import { UI_CONSTANTS, COMMON_STYLES, UI_UTILS } from '../utils/uiConstants';

const { width, height } = Dimensions.get('window');

const SideMenu = ({ visible, onClose, onLogout }) => {
  const { t } = useTranslation();
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
        title: t('navigation.dashboard'),
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
          title: t('navigation.assetAssignment'),
          icon: 'barcode-scan',
          onPress: () => {
            onClose();
            navigation.navigate('Asset');
          },
        },
        {
          id: 'employee_default',
          title: t('navigation.employeeAssets'),
          icon: 'account-group',
          onPress: () => {
            onClose();
            navigation.navigate('EmployeeAsset');
          },
        },
        {
          id: 'department_default',
          title: t('navigation.departmentAssets'),
          icon: 'domain',
          onPress: () => {
            onClose();
            navigation.navigate('DepartmentAsset');
          },
        },
        {
          id: 'maintenance_default',
          title: t('navigation.maintenanceSupervisor'),
          icon: 'wrench',
          onPress: () => {
            onClose();
            navigation.navigate('MaintenanceSupervisor');
          },
        },
        {
          id: 'report_breakdown_default',
          title: t('navigation.reportBreakdown'),
          icon: 'clipboard-alert',
          onPress: () => {
            onClose();
            navigation.navigate('REPORTBREAKDOWN');
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
          title: t(navigationService.getNavigationLabel(item.app_id)),
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
        size={UI_CONSTANTS.ICON_SIZES.LG}
        color={UI_CONSTANTS.COLORS.PRIMARY}
        style={styles.menuIcon}
      />
      <Text 
        style={styles.menuText}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {item.title}
      </Text>
      <MaterialCommunityIcons
        name="chevron-right"
        size={UI_CONSTANTS.ICON_SIZES.MD}
        color={UI_CONSTANTS.COLORS.GRAY_DARK}
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
            <Text 
              style={styles.headerTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('navigation.assetManagement')}
            </Text>
            <Text 
              style={styles.headerSubtitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('sideMenu.version')}
            </Text>
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
              <Text 
                style={styles.userName}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {userData.full_name || userData.name || userData.username || t('sideMenu.user')}
              </Text>
                <Text 
                  style={styles.userEmail}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {userData.email || 'user@example.com'}
                </Text>
                {userData.role && (
                  <Text 
                    style={styles.userRole}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
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
              <Text 
                style={styles.logoutText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t('auth.logout')}
              </Text>
            </TouchableOpacity>
            
            {/* User ID and Role Info */}
            {userData && (
              <View style={styles.userInfoRight}>
                {userData.user_id && (
                  <Text style={styles.userInfoText}>
                    {t('sideMenu.userId')}: {userData.user_id}
                  </Text>
                )}
                {userData.job_role_id && (
                  <Text style={styles.userInfoText}>
                    {t('sideMenu.roleId')}: {userData.job_role_id}
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
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    shadowColor: UI_CONSTANTS.COLORS.BLACK,
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
    paddingTop: 60,
    paddingBottom: UI_CONSTANTS.SPACING.XXXL,
    paddingHorizontal: UI_CONSTANTS.SPACING.LG,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerLogo: {
    width: 120,
    height: 50,
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },
  headerTitle: {
    fontSize: UI_CONSTANTS.FONT_SIZES.LG,
    fontWeight: 'bold',
    color: UI_CONSTANTS.COLORS.WHITE,
    marginTop: UI_CONSTANTS.SPACING.MD,
    marginBottom: UI_CONSTANTS.SPACING.XS,
  },
  headerSubtitle: {
    fontSize: UI_CONSTANTS.FONT_SIZES.MD,
    color: UI_CONSTANTS.COLORS.SECONDARY,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: UI_CONSTANTS.SPACING.LG,
    paddingHorizontal: UI_CONSTANTS.SPACING.LG,
    paddingVertical: UI_CONSTANTS.SPACING.MD,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: UI_CONSTANTS.SPACING.SM,
  },
  userAvatar: {
    marginRight: UI_CONSTANTS.SPACING.MD,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: UI_CONSTANTS.FONT_SIZES.LG,
    fontWeight: 'bold',
    color: UI_CONSTANTS.COLORS.WHITE,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: UI_CONSTANTS.FONT_SIZES.SM,
    color: UI_CONSTANTS.COLORS.SECONDARY,
    marginBottom: 2,
  },
  userRole: {
    fontSize: UI_CONSTANTS.FONT_SIZES.SM,
    color: UI_CONSTANTS.COLORS.WHITE,
    opacity: 0.8,
  },
  menuList: {
    flex: 1,
    paddingTop: UI_CONSTANTS.SPACING.LG,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: UI_CONSTANTS.SPACING.LG,
    paddingHorizontal: UI_CONSTANTS.SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONSTANTS.COLORS.GRAY_LIGHT,
  },
  menuIcon: {
    marginRight: UI_CONSTANTS.SPACING.LG,
    width: UI_CONSTANTS.ICON_SIZES.LG,
  },
  menuText: {
    flex: 1,
    fontSize: UI_CONSTANTS.FONT_SIZES.LG,
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  footer: {
    padding: UI_CONSTANTS.SPACING.LG,
    borderTopWidth: 1,
    borderTopColor: UI_CONSTANTS.COLORS.GRAY_LIGHT,
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
    fontSize: UI_CONSTANTS.FONT_SIZES.SM,
    color: UI_CONSTANTS.COLORS.GRAY_DARK,
    marginBottom: 2,
    textAlign: 'right',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: UI_CONSTANTS.SPACING.MD,
  },
  logoutText: {
    fontSize: UI_CONSTANTS.FONT_SIZES.LG,
    color: UI_CONSTANTS.COLORS.ERROR,
    fontWeight: '600',
    marginLeft: UI_CONSTANTS.SPACING.MD,
  },
});

export default SideMenu; 