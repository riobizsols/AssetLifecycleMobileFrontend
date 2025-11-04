import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Appbar } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import CustomAlert from '../components/CustomAlert';
import { authUtils } from '../utils/auth';
import SideMenu from '../components/SideMenu';
import { useNavigation as useNavigationContext } from '../context/NavigationContext';
import { useNotification } from '../context/NotificationContext';
import { navigationService } from '../services/navigationService';
import { UI_CONSTANTS, COMMON_STYLES, UI_UTILS } from '../utils/uiConstants';
import { useSafeAreaConfig, getSafeAreaStyles, getContainerStyles } from '../utils/safeAreaUtils';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { getSortedNavigation, clearNavigation, userNavigation, loading } = useNavigationContext();
  const { handleUserLogout, unreadCount } = useNotification();
  const [menuVisible, setMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const safeAreaConfig = useSafeAreaConfig();
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
      t('auth.logout'),
      t('auth.logoutConfirm'),
      'warning',
      async () => {
        try {
          // Handle FCM logout (unregister token and clear storage)
          await handleUserLogout();
          
          // Clear authentication data
          await authUtils.removeToken();
          
          // Clear navigation data
          clearNavigation();
          
          // Navigate to login screen
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        } catch (error) {
          console.error('Logout error:', error);
          showAlert(t('common.error'), t('auth.logoutFailed'), 'error');
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
    
    // If no navigation items are available and not loading, return empty array
    // This ensures only authorized pages are shown
    if (!navigationItems || navigationItems.length === 0) {
      return [];
    }
    
    // Remove duplicates based on app_id
    const uniqueItems = navigationItems.filter((item, index, self) =>
      index === self.findIndex(navItem => navItem.app_id === item.app_id)
    );
    
    return uniqueItems.map((item, index) => ({
      id: `${item.app_id.toLowerCase()}_${index}`,
      title: t(navigationService.getNavigationLabel(item.app_id)),
      subtitle: t(navigationService.getNavigationSubtitle(item.app_id)),
      icon: navigationService.getNavigationIcon(item.app_id),
      color: colors[index % colors.length],
      onPress: () => navigation.navigate(navigationService.getScreenName(item.app_id)),
    }));
  };

  const menuItems = React.useMemo(() => {
    return generateMenuItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getSortedNavigation, userNavigation]);

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
          size={UI_CONSTANTS.ICON_SIZES.XL}
          color={item.color}
        />
      </View>
      <View style={styles.menuTextContainer}>
        <Text 
          style={styles.menuTitle}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {item.title}
        </Text>
        <Text 
          style={styles.menuSubtitle}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {item.subtitle}
        </Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={UI_CONSTANTS.ICON_SIZES.LG}
        color={UI_CONSTANTS.COLORS.GRAY_DARK}
      />
    </TouchableOpacity>
  );

  return (
    <View style={[getContainerStyles(UI_CONSTANTS.COLORS.PRIMARY), { paddingTop: insets.top }]}>
      <StatusBar {...safeAreaConfig.statusBarConfig} />
      {/* AppBar */}
      <View style={safeAreaConfig.appBarContainerStyles}>
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={toggleMenu}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="menu" size={24} color="#FEC200" />
          </TouchableOpacity>
          <View style={styles.centerTitleContainer}>
            <Text 
              style={styles.appbarTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('navigation.assetManagement')}
            </Text>
          </View>
          <View style={styles.rightIconsContainer}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="bell-outline" size={24} color="#FEC200" />
              {unreadCount > 0 && <View style={styles.notificationBadge} />}
            </TouchableOpacity>
          </View>
        </View>

      <ScrollView style={[styles.content, { backgroundColor: UI_CONSTANTS.COLORS.BACKGROUND }]} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text 
            style={styles.welcomeTitle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {t('home.welcomeBack')}
          </Text>
          <Text 
            style={styles.welcomeSubtitle}
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            {t('home.manageAssetsEfficiently')}
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons 
              name="barcode-scan" 
              size={UI_CONSTANTS.ICON_SIZES.LG} 
              color={UI_CONSTANTS.COLORS.SUCCESS} 
            />
            <Text style={styles.statNumber}>24</Text>
            <Text 
              style={styles.statLabel}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('home.totalAssets')}
            </Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons 
              name="account-group" 
              size={UI_CONSTANTS.ICON_SIZES.LG} 
              color={UI_CONSTANTS.COLORS.INFO} 
            />
            <Text style={styles.statNumber}>30</Text>
            <Text 
              style={styles.statLabel}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('home.employees')}
            </Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons 
              name="domain" 
              size={UI_CONSTANTS.ICON_SIZES.LG} 
              color={UI_CONSTANTS.COLORS.WARNING} 
            />
            <Text style={styles.statNumber}>6</Text>
            <Text 
              style={styles.statLabel}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('home.departments')}
            </Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <Text 
            style={styles.sectionTitle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {t('home.quickActions')}
          </Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{t('common.loading')}</Text>
            </View>
          ) : menuItems.length > 0 ? (
            menuItems.map(renderMenuItem)
          ) : (
            <View style={styles.noAccessContainer}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={64}
                color="#BDBDBD"
              />
              <Text style={styles.noAccessTitle}>
                {t('home.noAccess')}
              </Text>
              <Text style={styles.noAccessMessage}>
                {t('home.contactAdministrator')}
              </Text>
            </View>
          )}
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
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: UI_CONSTANTS.COLORS.BACKGROUND,
  },
  appbar: {
    ...COMMON_STYLES.appBar,
  },
  menuButton: {
    padding: UI_CONSTANTS.SPACING.MD,
    marginLeft: UI_CONSTANTS.SPACING.SM,
    zIndex: 2,
  },
  rightIconsContainer: {
    position: 'absolute',
    right: UI_CONSTANTS.SPACING.SM,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationButton: {
    padding: UI_CONSTANTS.SPACING.MD,
  },
  notificationBadge: {
    position: 'absolute',
    top: UI_CONSTANTS.SPACING.SM - 2,
    right: UI_CONSTANTS.SPACING.SM - 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  centerTitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  appbarTitle: {
    ...COMMON_STYLES.appBarTitle,
  },
  content: {
    flex: 1,
    paddingHorizontal: UI_CONSTANTS.SPACING.LG,
  },
  welcomeSection: {
    paddingVertical: UI_CONSTANTS.SPACING.XXL,
    alignItems: 'center',
  },
  welcomeTitle: {
    ...COMMON_STYLES.text.title,
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },
  welcomeSubtitle: {
    ...COMMON_STYLES.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: UI_CONSTANTS.SPACING.XXL,
  },
  statCard: {
    flex: 1,
    ...COMMON_STYLES.card,
    padding: UI_CONSTANTS.SPACING.MD,
    marginHorizontal: UI_CONSTANTS.SPACING.XS,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: UI_CONSTANTS.FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: UI_CONSTANTS.COLORS.PRIMARY,
    marginTop: UI_CONSTANTS.SPACING.SM,
  },
  statLabel: {
    ...COMMON_STYLES.text.small,
    marginTop: UI_CONSTANTS.SPACING.XS,
    textAlign: 'center',
  },
  menuContainer: {
    marginBottom: UI_CONSTANTS.SPACING.XXL,
  },
  sectionTitle: {
    ...COMMON_STYLES.text.subtitle,
    marginBottom: UI_CONSTANTS.SPACING.LG,
  },
  menuItem: {
    ...COMMON_STYLES.menuItem,
  },
  iconContainer: {
    ...COMMON_STYLES.iconContainer,
  },
  menuTextContainer: {
    flex: 1,
    marginRight: UI_CONSTANTS.SPACING.MD,
  },
  menuTitle: {
    ...COMMON_STYLES.text.primary,
    marginBottom: UI_CONSTANTS.SPACING.XS,
  },
  menuSubtitle: {
    ...COMMON_STYLES.text.secondary,
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: UI_CONSTANTS.SPACING.XXL * 2,
  },
  loadingText: {
    fontSize: UI_CONSTANTS.FONT_SIZES.LG,
    color: UI_CONSTANTS.COLORS.GRAY_DARK,
  },
  noAccessContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: UI_CONSTANTS.SPACING.XXL * 2,
  },
  noAccessTitle: {
    fontSize: UI_CONSTANTS.FONT_SIZES.XL,
    fontWeight: '600',
    color: UI_CONSTANTS.COLORS.GRAY_DARK,
    marginTop: UI_CONSTANTS.SPACING.LG,
    textAlign: 'center',
  },
  noAccessMessage: {
    fontSize: UI_CONSTANTS.FONT_SIZES.MD,
    color: '#9E9E9E',
    marginTop: UI_CONSTANTS.SPACING.SM,
    textAlign: 'center',
    paddingHorizontal: UI_CONSTANTS.SPACING.XL,
  },
});

export default HomeScreen;
