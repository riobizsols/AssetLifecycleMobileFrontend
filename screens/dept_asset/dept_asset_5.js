import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { API_CONFIG, getApiHeaders, API_ENDPOINTS } from "../../config/api";

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
  if (width >= BREAKPOINTS.DESKTOP) return 'desktop';
  if (width >= BREAKPOINTS.TABLET) return 'tablet';
  if (width >= BREAKPOINTS.LARGE) return 'large';
  if (width >= BREAKPOINTS.MEDIUM) return 'medium';
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
  },
  
  INPUT_HEIGHT: verticalScale(37),
  LABEL_WIDTH: scale(140),
  COLON_WIDTH: scale(10),
  TABLE_CELL_FONT_SIZE: moderateScale(12),
  TABLE_HEADER_FONT_SIZE: moderateScale(13),
  EMPTY_TEXT_FONT_SIZE: moderateScale(16),
  APPBAR_HEIGHT: verticalScale(56),
  TABLE_HEADER_HEIGHT: verticalScale(40),
  TABLE_ROW_HEIGHT: verticalScale(50),
  BORDER_RADIUS: scale(8),
};

export default function EmployeeAssetDetailScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { employeeId, employeeName, departmentId } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [assetData, setAssetData] = useState([]);
  const [employeeInfo, setEmployeeInfo] = useState({
    id: "",
    name: "",
    department: "",
    assetCount: 0
  });
  const [departments, setDepartments] = useState({});

  // Fetch departments data
  const fetchDepartments = async () => {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_DEPARTMENTS()}`;
      console.log("Fetching departments for employee details:", url);
      
      const response = await fetch(url, {
        method: "GET",
        headers: await getApiHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Departments data received for employee details:", data);
      
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

  // Fetch employee active assets
  const fetchEmployeeActiveAssets = async (empId) => {
    if (!empId) {
      Alert.alert(t('common.error'), t('assets.employeeIdRequired'));
      return;
    }

    setLoading(true);
    try {
      console.log(`Fetching active assets for employee: ${empId}`);
      const url = `${API_CONFIG.BASE_URL}/api/asset-assignments/employee/${empId}/active`;
      console.log('API URL:', url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: await getApiHeaders(),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) {
          Alert.alert(
            t('assets.noActiveAssetsFound'),
            t('assets.noActiveAssetsFoundForEmployee'),
            [{ text: t('common.ok') }]
          );
          setAssetData([]);
          setEmployeeInfo({
            id: employeeId || "",
            name: employeeName || "",
            department: departments[departmentId] || departmentId || "",
            assetCount: 0
          });
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
      console.log('Employee active assets data received:', data);
      
      // Process the assignment data to get asset details
      const processedAssets = [];
      
      // Handle the new API response structure
      if (data && data.data && Array.isArray(data.data)) {
        // Fetch asset details for each assignment
        for (const assignment of data.data) {
          try {
            const assetUrl = `${API_CONFIG.BASE_URL}/api/assets/${assignment.asset_id}`;
            console.log(`Fetching asset details from: ${assetUrl}`);
            
            const assetResponse = await fetch(assetUrl, {
              method: 'GET',
              headers: await getApiHeaders(),
            });
            
            if (assetResponse.ok) {
              const assetDetails = await assetResponse.json();
              console.log(`Asset details for ${assignment.asset_id}:`, assetDetails);
              
              // Handle the asset details response structure
              let assetDescription = t('assets.unknownAsset');
              let serialNumber = `SN-${assignment.asset_id}`;
              
              if (Array.isArray(assetDetails) && assetDetails.length > 0) {
                assetDescription = assetDetails[0].description || assetDetails[0].text || assetDetails[0].name || `${t('assets.asset')} ${assignment.asset_id}`;
                serialNumber = assetDetails[0].serial_number || `SN-${assignment.asset_id}`;
              } else if (assetDetails && typeof assetDetails === 'object') {
                assetDescription = assetDetails.description || assetDetails.text || assetDetails.name || `${t('assets.asset')} ${assignment.asset_id}`;
                serialNumber = assetDetails.serial_number || `SN-${assignment.asset_id}`;
              }
              
              console.log(`Processed asset: ${assetDescription} (${serialNumber})`);
              
              processedAssets.push({
                type: assetDescription,
                serial: serialNumber,
                remarks: assignment.remarks || t('assets.active'),
                assetId: assignment.asset_id,
                assignmentId: assignment.asset_assign_id
              });
            } else {
              console.log(`Asset details not available for ${assignment.asset_id}, using fallback`);
              // Fallback if asset details not available
              processedAssets.push({
                type: `${t('assets.asset')} ${assignment.asset_id}`,
                serial: `SN-${assignment.asset_id}`,
                remarks: assignment.remarks || t('assets.active'),
                assetId: assignment.asset_id,
                assignmentId: assignment.asset_assign_id
              });
            }
          } catch (error) {
            console.error(`Error fetching asset details for ${assignment.asset_id}:`, error);
            // Fallback if asset details fetch fails
            processedAssets.push({
              type: `${t('assets.asset')} ${assignment.asset_id}`,
              serial: `SN-${assignment.asset_id}`,
              remarks: assignment.remarks || "Active",
              assetId: assignment.asset_id,
              assignmentId: assignment.asset_assign_id
            });
          }
        }
      }
      
      setAssetData(processedAssets);
      setEmployeeInfo({
        id: data.employee?.employee_id || data.employee?.emp_int_id || employeeId || "",
        name: data.employee?.employee_name || employeeName || "",
        department: data.department?.department_name || departments[departmentId] || departmentId || "",
        assetCount: data.count || processedAssets.length
      });
      
    } catch (error) {
      console.error("Error fetching employee active assets:", error);
      if (error.name === 'AbortError') {
        Alert.alert(t('common.timeout'), t('assets.requestTimedOut'));
      } else {
        Alert.alert(t('common.error'), t('assets.failedToFetchEmployeeAssets'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch employee assets when employeeId changes
  useEffect(() => {
    if (employeeId) {
      fetchEmployeeActiveAssets(employeeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  return (
    <SafeAreaProvider>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor="#003667"
          translucent={Platform.OS === 'android'}
        />
        {/* AppBar */}
        <View style={styles.appbar}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons 
              name="arrow-left" 
              size={24} 
              color="#FEC200" 
            />
          </TouchableOpacity>
          <View style={styles.centerTitleContainer}>
            <Text style={styles.appbarTitle}>{t('assets.employeeAssetDetail')}</Text>
          </View>
        </View>

        <View style={styles.contentContainer}>

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={[styles.infoRow, styles.firstInfoRow]}>
            <Text style={styles.label}>{t('assets.employeeId')}</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput
              style={styles.valueInput}
              value={employeeInfo.id}
              editable={false}
            />
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('assets.employeeName')}</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput
              style={styles.valueInput}
              value={employeeInfo.name}
              editable={false}
            />
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('assets.department')}</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput 
              style={styles.valueInput} 
              value={employeeInfo.department} 
              editable={false} 
            />
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('assets.noOfAsset')}</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput 
              style={styles.valueInput} 
              value={employeeInfo.assetCount.toString()} 
              editable={false} 
            />
          </View>
        </View>

        {/* Table */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>
              {t('assets.asset')}
            </Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>
              {t('assets.serialNo')}
            </Text>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>{t('assets.remarks')}</Text>
          </View>
          <View style={styles.yellowLine} />
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#003667" />
              <Text style={styles.loadingText}>{t('assets.loadingEmployeeAssets')}</Text>
            </View>
          ) : assetData.length > 0 ? (
            <FlatList
              data={assetData}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View
                  style={[
                    styles.tableRow,
                    { backgroundColor: index % 2 === 0 ? "#fff" : "#f0f4f8" },
                  ]}
                >
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>
                    {item.type}
                  </Text>
                  <TouchableOpacity 
                    style={{ flex: 1 }}
                    onPress={() =>
                      navigation.navigate("Dept_Asset_6", {
                        assetId: item.assetId,
                        serialNumber: item.serial,
                        employeeId: employeeId,
                        employeeName: employeeName,
                        departmentId: departmentId
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.tableCell,
                        {
                          color: "#003366",
                          textDecorationLine: "underline",
                          textAlign: "center",
                        },
                      ]}
                    >
                      {item.serial}
                    </Text>
                  </TouchableOpacity>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {item.remarks}
                  </Text>
                </View>
              )}
              ListFooterComponent={<View style={{ height: 120 }} />}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {employeeId ? t('assets.noActiveAssetsFoundForEmployeeMessage') : t('assets.noEmployeeDataAvailableMessage')}
              </Text>
            </View>
          )}
        </View>
        </View>
      </View>
    </SafeAreaProvider>
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
  appbar: {
    backgroundColor: '#003667',
    height: RESPONSIVE_CONSTANTS.APPBAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
    ...Platform.select({
      ios: {
        // iOS handles safe area automatically
      },
      android: {
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
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
    color: '#fff',
    fontWeight: '600',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    alignSelf: 'center',
  },
  formContainer: {
    backgroundColor: "#ededed",
    marginHorizontal: RESPONSIVE_CONSTANTS.SPACING.SM,
    borderRadius: RESPONSIVE_CONSTANTS.BORDER_RADIUS,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    marginBottom: 0,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  firstInfoRow: {
    marginTop: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  label: {
    width: RESPONSIVE_CONSTANTS.LABEL_WIDTH,
    color: "#616161",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: '500',
  },
  colon: {
    width: RESPONSIVE_CONSTANTS.COLON_WIDTH,
    color: "#333",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    textAlign: "center",
    marginHorizontal: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  valueInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: scale(4),
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.SM,
    height: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
    color: "#616161",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    fontWeight: '400',
    borderWidth: 1,
    borderColor: "#ccc",
    textAlignVertical: "center",
  },
  tableContainer: {
    margin: RESPONSIVE_CONSTANTS.SPACING.SM,
    borderRadius: RESPONSIVE_CONSTANTS.BORDER_RADIUS,
    backgroundColor: "#fff",
    overflow: "hidden",
    flex: 1,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#003366",
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.SM,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.SM,
    minHeight: RESPONSIVE_CONSTANTS.TABLE_HEADER_HEIGHT,
    alignItems: 'center',
  },
  tableHeaderText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: RESPONSIVE_CONSTANTS.TABLE_HEADER_FONT_SIZE,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.SM,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.SM,
    alignItems: "center",
    minHeight: RESPONSIVE_CONSTANTS.TABLE_ROW_HEIGHT,
  },
  tableCell: {
    fontSize: RESPONSIVE_CONSTANTS.TABLE_CELL_FONT_SIZE,
    fontWeight: '500',
    color: "#616161",
    textAlign: "center",
  },
  yellowLine: {
    height: 3,
    backgroundColor: "#FEC200",
    width: "100%",
  },
  loadingContainer: {
    padding: RESPONSIVE_CONSTANTS.SPACING.XXL * 1.5,
    alignItems: "center",
  },
  loadingText: {
    marginTop: RESPONSIVE_CONSTANTS.SPACING.SM,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    color: "#666",
  },
  emptyContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: RESPONSIVE_CONSTANTS.EMPTY_TEXT_FONT_SIZE,
    color: "#666",
  },
});
