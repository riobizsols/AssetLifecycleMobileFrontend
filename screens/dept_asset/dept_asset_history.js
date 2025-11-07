import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React, { useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  FlatList,
  Platform,
  StatusBar,
  Dimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Appbar } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { API_CONFIG, getApiHeaders, API_ENDPOINTS } from "../../config/api";

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
  },
  
  // Responsive font sizes
  FONT_SIZES: {
    XS: moderateScale(10),
    SM: moderateScale(12),
    MD: moderateScale(14),
    LG: moderateScale(16),
    XL: moderateScale(18),
    XXL: moderateScale(20),
  },
  
  // Responsive dimensions
  CARD_PADDING: scale(12),
  CARD_BORDER_RADIUS: scale(8),
  
  // Layout helpers
  getCardMargin: () => {
    if (DEVICE_TYPE === 'desktop' || DEVICE_TYPE === 'tablet') {
      return scale(20);
    }
    return scale(10);
  },
};

export default function DepartmentAssetHistory() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { departmentId, departmentName } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [departments, setDepartments] = useState({});
  const [assets, setAssets] = useState({});
  const insets = useSafeAreaInsets();

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return t('common.notAvailable');
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB"); // DD/MM/YYYY format
    } catch (error) {
      return dateString;
    }
  };

  // Helper function to get action display text
  const getActionDisplayText = (action) => {
    switch (action) {
      case "A":
        return t('assets.assigned');
      case "U":
        return t('assets.unassigned');
      case "C":
        return t('assets.cancelled');
      case "T":
        return t('assets.transferred');
      default:
        return action || t('common.notAvailable');
    }
  };

  // Fetch departments data
  const fetchDepartments = async () => {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_DEPARTMENTS()}`;
      console.log("Fetching departments for history:", url);
      
      const response = await fetch(url, {
        method: "GET",
        headers: await getApiHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Departments data received for history:", data);
      
      // Create a map of dept_id to department name
      const deptMap = {};
      data.forEach(dept => {
        deptMap[dept.dept_id] = dept.text || dept.name || dept.dept_name;
      });
      
      setDepartments(deptMap);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  // Fetch assets data for asset names
  const fetchAssets = async (assetIds) => {
    if (!assetIds || assetIds.length === 0) {
      return;
    }

    try {
      // Get unique asset IDs
      const uniqueAssetIds = [...new Set(assetIds)];
      console.log("Fetching assets for history:", uniqueAssetIds);

      // Fetch asset details for each unique asset ID
      const assetMap = {};
      const fetchPromises = uniqueAssetIds.map(async (assetId) => {
        try {
          const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_ASSET_DETAILS(assetId)}`;
          const response = await fetch(url, {
            method: "GET",
            headers: await getApiHeaders(),
          });

          if (response.ok) {
            const assetData = await response.json();
            // Handle different response structures
            const asset = assetData.data || assetData.asset || assetData;
            assetMap[assetId] = asset?.description || asset?.asset_name || asset?.name || asset?.text || assetId;
          } else {
            // If asset fetch fails, use asset_id as fallback
            assetMap[assetId] = assetId;
          }
        } catch (error) {
          console.error(`Error fetching asset ${assetId}:`, error);
          // Use asset_id as fallback if fetch fails
          assetMap[assetId] = assetId;
        }
      });

      await Promise.all(fetchPromises);
      console.log("Assets map created:", assetMap);
      setAssets(assetMap);
    } catch (error) {
      console.error("Error fetching assets:", error);
    }
  };

  // Fetch department asset history
  const fetchDepartmentHistory = async () => {
    if (!departmentId) {
      console.log('No departmentId provided to history screen');
      Alert.alert(t('common.error'), t('assets.departmentIdNotFound'));
      return;
    }

    setLoading(true);
    try {
      // Convert department ID to uppercase for case-insensitive search
      const normalizedDeptId = departmentId.trim().toUpperCase();
      // Use the API endpoint for department asset history
      const url = `${API_CONFIG.BASE_URL}/api/asset-assignments/dept/${normalizedDeptId}`;
      console.log("Fetching department history for ID:", normalizedDeptId);
      console.log("API URL:", url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(url, {
        method: "GET",
        headers: await getApiHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("History API response status:", response.status);

      if (!response.ok) {
        if (response.status === 404) {
          console.log('No history found (404)');
          setHistoryData([]);
          Alert.alert(
            t('assets.noHistoryFound'),
            t('assets.noHistoryFoundForDepartment'),
            [{ text: t('common.ok') }]
          );
          return;
        }
        if (response.status === 401) {
          Alert.alert(
            t('assets.authenticationError'),
            t('assets.checkAuthorizationToken'),
            [{ text: t('common.ok') }]
          );
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Department history data received:", data);
      console.log("Number of history records:", data.length);
      
      // Handle different response structures
      let historyRecords = [];
      if (data.data && Array.isArray(data.data)) {
        historyRecords = data.data;
      } else if (data.assignments && Array.isArray(data.assignments)) {
        historyRecords = data.assignments;
      } else if (Array.isArray(data)) {
        historyRecords = data;
      } else {
        console.warn('Unexpected API response structure:', data);
        historyRecords = [];
      }
      
      if (historyRecords.length === 0) {
        console.log('No history data found');
        setHistoryData([]);
        return;
      }
      
      // Sort by action_on date (newest first)
      const sortedData = historyRecords.sort((a, b) => 
        new Date(b.action_on || b.action_on) - new Date(a.action_on || a.action_on)
      );
      
      setHistoryData(sortedData);
      console.log('History data set successfully');

      // Extract unique asset IDs and fetch asset names
      const assetIds = sortedData
        .map(record => record.asset_id)
        .filter(id => id); // Filter out null/undefined values
      
      if (assetIds.length > 0) {
        fetchAssets(assetIds);
      }
    } catch (error) {
      console.error("Error fetching department history:", error);
      
      let errorMessage = t('assets.failedToLoadDepartmentHistory');
      
      if (error.name === 'AbortError') {
        errorMessage = t('assets.requestTimedOut');
      } else if (error.message.includes("Network request failed")) {
        errorMessage = t('assets.networkConnectionFailed');
      } else if (error.message.includes("fetch")) {
        errorMessage = t('assets.unableToConnectToServer');
      }
      
      Alert.alert(
        t('common.error'),
        errorMessage + '\n' + error.message,
        [{ text: t('common.ok') }]
      );
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentHistory();
    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId]);

  // Render history item
  const renderHistoryItem = ({ item, index }) => (
    <View
      style={[
        styles.historyRow,
        { backgroundColor: index % 2 === 0 ? "#fff" : "#f0f4f8" },
      ]}
    >
      <View style={styles.historyCell}>
        <Text style={styles.historyLabel}>{t('assets.assetId')}:</Text>
        <Text style={styles.historyValue}>
          {item.asset_id || t('common.notAvailable')}
        </Text>
      </View>
      
      <View style={styles.historyCell}>
        <Text style={styles.historyLabel}>{t('assets.assetName')}:</Text>
        <Text style={styles.historyValue}>
          {assets[item.asset_id] || item.asset_name || item.description || item.asset_id || t('common.notAvailable')}
        </Text>
      </View>
      
      <View style={styles.historyCell}>
        <Text style={styles.historyLabel}>{t('assets.action')}:</Text>
        <Text style={styles.historyValue}>
          {getActionDisplayText(item.action)}
        </Text>
      </View>
      
      <View style={styles.historyCell}>
        <Text style={styles.historyLabel}>{t('assets.actionOn')}:</Text>
        <Text style={styles.historyValue}>
          {formatDate(item.action_on)}
        </Text>
      </View>
      
      <View style={styles.historyCell}>
        <Text style={styles.historyLabel}>{t('assets.actionBy')}:</Text>
        <Text style={styles.historyValue}>
          {item.action_by || t('common.notAvailable')}
        </Text>
      </View>
      
      <View style={styles.historyCell}>
        <Text style={styles.historyLabel}>{t('employees.department')}:</Text>
        <Text style={styles.historyValue}>
          {departments[item.dept_id] || item.dept_id || departmentName || t('common.notAvailable')}
        </Text>
      </View>
    </View>
  );

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
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FEC200" />
        </TouchableOpacity>
        <View style={styles.centerTitleContainer}>
          <Text style={styles.appbarTitle}>{t('assets.departmentAssetHistory')}</Text>
        </View>
      </View>

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Department Info */}
        <View style={styles.assetInfo}>
          <Text style={styles.assetInfoText}>
            {t('employees.department')}: {departmentName || departmentId || t('common.notAvailable')}
          </Text>
        </View>

        {/* History Table */}
        <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>{t('assets.assignmentHistory')}</Text>
        </View>
        <View style={styles.yellowLine} />
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#003667" />
            <Text style={styles.loadingText}>{t('assets.loadingHistory')}</Text>
          </View>
        ) : historyData.length > 0 ? (
          <View style={styles.listContainer}>
            <FlatList
              data={historyData}
              keyExtractor={(item, index) => `${item.asset_assign_id || item.asset_id || index}-${index}`}
              renderItem={renderHistoryItem}
              ListHeaderComponent={<View style={{ height: 10 }} />}
              ListFooterComponent={<View style={{ height: 120 }} />}
              showsVerticalScrollIndicator={true}
              scrollEnabled={true}
              nestedScrollEnabled={true}
              contentContainerStyle={{ flexGrow: 1 }}
            />
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('assets.noHistoryFound')}</Text>
          </View>
        )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#003667",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#EEEEEE",
  },
  appbarContainer: {
    backgroundColor: "#003667",
    height: verticalScale(56),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    position: "relative",
    paddingHorizontal: 0,
    ...Platform.select({
      ios: {
        // iOS handles safe area automatically
      },
      android: {
        // Android needs explicit handling
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  appbar: {
    backgroundColor: "#003667",
    elevation: 0,
    shadowOpacity: 0,
    height: verticalScale(56),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    position: "relative",
  },
  backButton: {
    padding: RESPONSIVE_CONSTANTS.SPACING.MD,
    marginLeft: RESPONSIVE_CONSTANTS.SPACING.SM,
    zIndex: 2,
  },
  centerTitleContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1,
  },
  appbarTitle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    alignSelf: "center",
  },
  assetInfo: {
    backgroundColor: "#fff",
    margin: RESPONSIVE_CONSTANTS.getCardMargin(),
    padding: RESPONSIVE_CONSTANTS.SPACING.LG,
    borderRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  assetInfoText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    fontWeight: "600",
    color: "#003667",
    textAlign: "center",
  },
  tableContainer: {
    margin: RESPONSIVE_CONSTANTS.getCardMargin(),
    backgroundColor: "#fff",
    borderRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  tableHeader: {
    backgroundColor: "#003667",
    borderTopLeftRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    borderTopRightRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    alignItems: "center",
  },
  tableHeaderText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
  },
  yellowLine: {
    height: 3,
    backgroundColor: "#FEC200",
    width: "100%",
  },
  historyRow: {
    padding: RESPONSIVE_CONSTANTS.CARD_PADDING,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  historyCell: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  historyLabel: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: "500",
    color: "#616161",
    flex: 1,
  },
  historyValue: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: "#333",
    flex: 2,
    textAlign: "right",
  },
  loadingContainer: {
    padding: RESPONSIVE_CONSTANTS.SPACING.XXL * 1.5,
    alignItems: "center",
  },
  loadingText: {
    marginTop: RESPONSIVE_CONSTANTS.SPACING.MD,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    color: "#666",
  },
  emptyContainer: {
    padding: RESPONSIVE_CONSTANTS.SPACING.XXL * 1.5,
    alignItems: "center",
  },
  emptyText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    color: "#666",
    textAlign: "center",
  },
});

