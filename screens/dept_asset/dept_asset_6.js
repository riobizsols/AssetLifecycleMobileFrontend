import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
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
  
  INPUT_HEIGHT: verticalScale(36),
  LABEL_WIDTH: scale(120),
  COLON_WIDTH: scale(10),
  APPBAR_HEIGHT: verticalScale(56),
  BORDER_RADIUS: scale(8),
};

export default function AssetDetailsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { assetId, serialNumber, employeeId, employeeName, departmentId } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [assetData, setAssetData] = useState(null);
  const [assignmentData, setAssignmentData] = useState(null);

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

  // Fetch asset details
  const fetchAssetDetails = async () => {
    if (!assetId) {
      Alert.alert(t('common.error'), t('assets.assetIdRequired'));
      return;
    }

    setLoading(true);
    try {
      console.log(`Fetching asset details for: ${assetId}`);
      const url = `${API_CONFIG.BASE_URL}/api/assets/${assetId}`;
      console.log('API URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getApiHeaders(),
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          Alert.alert(t('assets.assetNotFound'), t('assets.noAssetFoundWithId'));
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Asset details received:', data);
      
      // Handle the API response structure
      let assetDetails = data;
      if (Array.isArray(data) && data.length > 0) {
        assetDetails = data[0];
      }
      
      setAssetData(assetDetails);
      
      // Fetch assignment details
      await fetchAssignmentDetails(assetId);
      
    } catch (error) {
      console.error("Error fetching asset details:", error);
      Alert.alert(t('common.error'), t('assets.failedToFetchAssetDetails'));
    } finally {
      setLoading(false);
    }
  };

  // Fetch assignment details
  const fetchAssignmentDetails = async (assetId) => {
    try {
      const assignmentUrl = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_ASSET_ASSIGNMENT(assetId)}`;
      console.log('Fetching assignment details:', assignmentUrl);
      
      const response = await fetch(assignmentUrl, {
        method: 'GET',
        headers: getApiHeaders(),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Assignment details received:', data);
        
        if (data && Array.isArray(data) && data.length > 0) {
          // Find the latest active assignment
          const activeAssignment = data.find(assignment => 
            assignment.latest_assignment_flag === true && 
            assignment.action === "A"
          );
          
          if (activeAssignment) {
            setAssignmentData(activeAssignment);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching assignment details:", error);
    }
  };

  // Handle cancel assignment
  const handleCancelAssignment = async () => {
    if (!assignmentData?.asset_id) {
      Alert.alert(t('common.error'), t('assets.assignmentDataNotFound'));
      return;
    }

    Alert.alert(
      t('assets.cancelAssignment'),
      t('assets.confirmCancelAssignmentForAsset', { assetName: assetData?.description || assetId }),
      [
        { text: t('common.no'), style: "cancel" },
        {
          text: t('common.yes'),
          onPress: async () => {
            setLoading(true);
            try {
              // First API call: Update existing assignment to set latest_assignment_flag to false
              const updateUrl = `${API_CONFIG.BASE_URL}/api/asset-assignments/asset/${assignmentData.asset_id}`;
              console.log("Updating existing assignment:", updateUrl);

              const updateData = {
                latest_assignment_flag: false,
              };

              const updateResponse = await fetch(updateUrl, {
                method: "PUT",
                headers: getApiHeaders(),
                body: JSON.stringify(updateData),
              });

              if (!updateResponse.ok) {
                console.error("Failed to update existing assignment");
              }

              // Second API call: Create new assignment row for cancellation
              const createUrl = `${API_CONFIG.BASE_URL}/api/asset-assignments`;
              console.log("Creating new assignment row for cancellation:", createUrl);

              // Generate a unique asset assignment ID
              const assetAssignId = `AA${Date.now()}`;

              // Create new assignment row with cancellation data
              const newAssignmentData = {
                asset_assign_id: assetAssignId,
                dept_id: assignmentData.dept_id,
                asset_id: assignmentData.asset_id,
                org_id: assignmentData.org_id || "ORG001",
                employee_int_id: assignmentData.employee_int_id,
                action: "C", // Unassign action
                action_on: new Date().toISOString(),
                action_by: "SYSTEM",
                latest_assignment_flag: false,
              };

              console.log("New assignment data:", newAssignmentData);

              const createResponse = await fetch(createUrl, {
                method: "POST",
                headers: getApiHeaders(),
                body: JSON.stringify(newAssignmentData),
              });

              if (createResponse.ok) {
                Alert.alert(t('assets.success'), t('assets.assignmentCancelledSuccessfully'), [
                  {
                    text: t('common.ok'),
                    onPress: () => navigation.goBack(),
                  },
                ]);
              } else {
                const errorData = await createResponse.json().catch(() => ({}));
                console.error("Server error details:", errorData);
                throw new Error(`HTTP error! status: ${createResponse.status}`);
              }
            } catch (error) {
              console.error("Error cancelling assignment:", error);
              Alert.alert(t('common.error'), t('assets.failedToCancelAssignment'), [
                { text: t('common.ok') },
              ]);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Load asset details when component mounts
  useEffect(() => {
    fetchAssetDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetId]);

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
            <Text style={styles.appbarTitle}>{t('assets.assetDetails')}</Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#003667" />
              <Text style={styles.loadingText}>{t('assets.loadingAssetDetails')}</Text>
            </View>
          ) : assetData ? (
            <>
              {/* Asset Details Card */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardHeaderText}>{t('assets.assetInformation')}</Text>
                </View>
                <View style={styles.yellowLine} />
                <View style={styles.detailsTable}>
                  <DetailRow
                    label={t('assets.assetId')}
                    value={assetData.asset_id || assetData.id || assetId || t('common.notAvailable')}
                  />
                  <DetailRow
                    label={t('assets.assetName')}
                    value={assetData.asset_name || assetData.description || assetData.text || assetData.name || t('common.notAvailable')}
                  />
                  <DetailRow
                    label={t('assets.assetType')}
                    value={assetData.asset_type || assetData.type || assignmentData?.asset_type_name || t('common.notAvailable')}
                  />
                  <DetailRow
                    label={t('assets.assetTypeId')}
                    value={assetData.asset_type_id || assignmentData?.asset_type_id || t('common.notAvailable')}
                  />
                  <DetailRow
                    label={t('assets.purchaseVendor')}
                    value={assetData.purchase_vendor || assetData.vendor || t('common.notAvailable')}
                  />
                  <DetailRow
                    label={t('assets.serviceVendor')}
                    value={assetData.service_vendor || assetData.servicer || t('common.notAvailable')}
                  />
                  <DetailRow
                    label={t('assets.purchasedOn')}
                    value={assetData.purchased_on ? formatDate(assetData.purchased_on) : assetData.purchase_date ? formatDate(assetData.purchase_date) : t('common.notAvailable')}
                  />
                  <DetailRow
                    label={t('assets.expiryDate')}
                    value={assetData.expiry_date ? formatDate(assetData.expiry_date) : assetData.warranty_expiry ? formatDate(assetData.warranty_expiry) : t('common.notAvailable')}
                  />
                  <DetailRow
                    label={t('assets.warrantyPeriod')}
                    value={assetData.warranty_period || assetData.warranty_duration || t('common.notAvailable')}
                  />
                  <DetailRow
                    label={t('assets.assignmentDate')}
                    value={formatDate(assignmentData?.action_on)}
                  />
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('assets.noAssetDataAvailable')}</Text>
            </View>
          )}
        </View>

        {/* Cancel Assignment Button at the bottom */}
        <View style={styles.footerFixed}>
          <TouchableOpacity
            style={[styles.cancelBtn, loading && styles.buttonDisabled]}
            onPress={handleCancelAssignment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.cancelBtnText}>{t('assets.cancelAssignment')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailColon}>:</Text>
      <TextInput 
        style={styles.detailValue} 
        value={value} 
        editable={false}
        multiline={false}
        numberOfLines={1}
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: RESPONSIVE_CONSTANTS.SPACING.SM,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    color: "#666",
  },
  card: {
    backgroundColor: "#fff",
    margin: RESPONSIVE_CONSTANTS.SPACING.SM,
    borderRadius: RESPONSIVE_CONSTANTS.BORDER_RADIUS,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    backgroundColor: "#003667",
    borderTopLeftRadius: RESPONSIVE_CONSTANTS.BORDER_RADIUS,
    borderTopRightRadius: RESPONSIVE_CONSTANTS.BORDER_RADIUS,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    alignItems: "center",
  },
  cardHeaderText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
  },
  yellowLine: {
    height: 3,
    backgroundColor: "#FEC200",
    width: "100%",
  },
  detailsTable: {
    padding: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  detailLabel: {
    width: RESPONSIVE_CONSTANTS.LABEL_WIDTH,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: "500",
    color: "#616161",
  },
  detailColon: {
    width: RESPONSIVE_CONSTANTS.COLON_WIDTH,
    color: "#333",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    textAlign: "center",
    marginHorizontal: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  detailValue: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: scale(4),
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.SM,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.SM,
    height: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
    color: "#333",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    borderWidth: 1,
    borderColor: "#ddd",
    textAlignVertical: "center",
    includeFontPadding: false,
    textAlign: "left",
  },
  cancelBtn: {
    backgroundColor: "#dc3545",
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.XXL,
    borderRadius: scale(6),
    alignItems: "center",
    minWidth: scale(150),
  },
  cancelBtnText: {
    color: "#fff",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    color: "#666",
  },
  footerFixed: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: RESPONSIVE_CONSTANTS.SPACING.LG,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
  },
}); 