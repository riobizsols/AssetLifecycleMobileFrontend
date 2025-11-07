import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ActivityIndicator, Dimensions, Platform, StatusBar } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Appbar } from "react-native-paper";
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
  BUTTON_HEIGHT: verticalScale(40),
  LABEL_WIDTH: scale(120),
  COLON_WIDTH: scale(10),
  CARD_BORDER_RADIUS: scale(8),
};

export default function AssetDetailsScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    const { assetData, serialNumber, assetId, assignmentId, assignmentData } = route.params || {};
    const [loading, setLoading] = useState(false);
    const [assetDetails, setAssetDetails] = useState(null);
    const [assignmentDetails, setAssignmentDetails] = useState(null);

    // Debug logging
    useEffect(() => {
      console.log('Asset Details Screen - Received params:', { assetData, serialNumber, assetId, assignmentId });
    }, [assetData, serialNumber, assetId, assignmentId]);

    // Fetch asset details
    const fetchAssetDetails = async (assetId) => {
      if (!assetId) return;
      
      setLoading(true);
      try {
        console.log(`Fetching asset details for: ${assetId}`);
        const url = `${API_CONFIG.BASE_URL}/api/assets/${assetId}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: await getApiHeaders(),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Asset details received:', data);
          
          // Handle the asset details response structure
          let assetInfo = null;
          if (Array.isArray(data) && data.length > 0) {
            assetInfo = data[0];
          } else if (data && typeof data === 'object') {
            assetInfo = data;
          }
          
          setAssetDetails(assetInfo);
        } else {
          console.log(`Asset details not available for ${assetId}`);
          // If API call fails, use the asset data passed from navigation
          if (assetData) {
            setAssetDetails(assetData);
          }
        }
      } catch (error) {
        console.error('Error fetching asset details:', error);
        // If API call fails, use the asset data passed from navigation
        if (assetData) {
          setAssetDetails(assetData);
        }
      } finally {
        setLoading(false);
      }
    };

    // Fetch assignment details
    const fetchAssignmentDetails = async (assetId) => {
      if (!assetId) return;
      
      try {
        console.log(`Fetching assignment details for asset: ${assetId}`);
        const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_ASSET_ASSIGNMENT(assetId)}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: await getApiHeaders(),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Assignment details received:', data);
          
          // Find the active assignment
          if (Array.isArray(data)) {
            const activeAssignment = data.find(assignment => assignment.latest_assignment_flag === true);
            if (activeAssignment) {
              setAssignmentDetails(activeAssignment);
            }
          }
        } else {
          console.log(`Assignment details not available for ${assetId}`);
        }
      } catch (error) {
        console.error('Error fetching assignment details:', error);
      }
    };

    // Load data when component mounts
    useEffect(() => {
      if (assetId) {
        fetchAssetDetails(assetId);
        fetchAssignmentDetails(assetId);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assetId]);

    // Handle cancel assignment
    const handleCancelAssignment = async () => {
      // Get asset ID from either assetData or assignmentData
      const assetId = assetData?.asset_id || assetData?.id || assignmentData?.asset_id;
      
      if (!assetId) {
        Alert.alert(t('common.error'), t('assets.assetIdNotFound'));
        return;
      }

      // If we have assetData but no assignmentData, we need to fetch the current assignment first
      // Use assignmentDetails from API if available, otherwise use assignmentData from params
      let currentAssignment = assignmentDetails || assignmentData;
      if (assetData && !currentAssignment) {
        try {
          const assignmentUrl = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_ASSET_ASSIGNMENT(assetId)}`;
          console.log('Fetching current assignment for cancellation:', assignmentUrl);
          
          const assignmentResponse = await fetch(assignmentUrl, {
            method: 'GET',
            headers: await getApiHeaders(),
          });
          
          if (assignmentResponse.ok) {
            const assignmentDataResponse = await assignmentResponse.json();
            console.log('Current assignment data:', assignmentDataResponse);
            
            if (assignmentDataResponse && Array.isArray(assignmentDataResponse) && assignmentDataResponse.length > 0) {
              // Find the latest active assignment
              currentAssignment = assignmentDataResponse.find(assignment => 
                assignment.latest_assignment_flag === true && 
                assignment.action === "A"
              );
            }
          }
        } catch (error) {
          console.error("Error fetching current assignment:", error);
          Alert.alert(t('common.error'), t('assets.failedToFetchCurrentAssignmentDetails'));
          return;
        }
      }
      
      if (!currentAssignment) {
        Alert.alert(t('common.error'), t('assets.noActiveAssignmentFound'));
        return;
      }

      // Validate required fields are present
      console.log('Current assignment data for cancellation:', currentAssignment);
      if (!currentAssignment.asset_id || !currentAssignment.dept_id || !currentAssignment.org_id) {
        console.error('Missing required fields in assignment:', {
          asset_id: currentAssignment.asset_id,
          dept_id: currentAssignment.dept_id,
          org_id: currentAssignment.org_id
        });
        Alert.alert(t('common.error'), 'Assignment data is incomplete. Missing required fields.');
        return;
      }

      Alert.alert(
        t('assets.cancelAssignment'),
        t('assets.confirmCancelAssignmentForAsset', { assetName: assetData?.description || assetId }),
        [
          {
            text: t('common.cancel'),
            style: "cancel"
          },
          {
            text: t('common.yes'),
            onPress: async () => {
              setLoading(true);
              try {
                // First API call: Update existing assignment to set latest_assignment_flag to false
                const updateUrl = `${API_CONFIG.BASE_URL}/api/asset-assignments/asset/${assetId}`;
                console.log("Updating existing assignment:", updateUrl);

                const updateData = {
                  latest_assignment_flag: false,
                };

                const updateResponse = await fetch(updateUrl, {
                  method: "PUT",
                  headers: await getApiHeaders(),
                  body: JSON.stringify(updateData),
                });

                if (!updateResponse.ok) {
                  console.error("Failed to update existing assignment");
                  // Continue with creating new row even if update fails
                }

                // Second API call: Create new assignment row for cancellation
                const createUrl = `${API_CONFIG.BASE_URL}/api/asset-assignments`;
                console.log("Creating new assignment row for cancellation:", createUrl);

                // Generate a unique asset assignment ID
                const assetAssignId = `AA${Date.now()}`;

                // Create new assignment row with cancellation data
                // Only include employee_int_id if it exists in the original assignment
                const newAssignmentData = {
                  asset_assign_id: assetAssignId,
                  dept_id: currentAssignment.dept_id,
                  asset_id: assetId,
                  org_id: currentAssignment.org_id || "ORG001",
                  action: "C", // Cancel action
                  action_on: new Date().toISOString(),
                  action_by: "SYSTEM",
                  latest_assignment_flag: false,
                };
                
                // Only add employee_int_id if it exists (for department-only assignments, it should be null/omitted)
                if (currentAssignment.employee_int_id) {
                  newAssignmentData.employee_int_id = currentAssignment.employee_int_id;
                }

                console.log("New assignment data:", newAssignmentData);

                const createResponse = await fetch(createUrl, {
                  method: "POST",
                  headers: await getApiHeaders(),
                  body: JSON.stringify(newAssignmentData),
                });

                if (createResponse.ok) {
                  Alert.alert(
                    t('assets.success'),
                    t('assets.assetAssignmentCancelledSuccessfully'),
                    [
                      {
                        text: t('common.ok'),
                        onPress: () => navigation.goBack()
                      }
                    ]
                  );
                } else {
                  const errorData = await createResponse.json().catch(() => ({}));
                  console.error("Server error details:", errorData);
                  throw new Error(`HTTP error! status: ${createResponse.status}`);
                }
              } catch (error) {
                console.error("Error cancelling assignment:", error);
                Alert.alert(
                  t('common.error'),
                  t('assets.failedToCancelAssignment'),
                  [{ text: t('common.ok') }]
                );
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    };

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

      {/* Card */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#003667" />
          <Text style={styles.loadingText}>{t('assets.loadingAssetDetails')}</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderText}>
              {t('assets.serialNoWithColon')} {serialNumber || assetData?.serial || t('common.notAvailable')}
            </Text>
          </View>
          <View style={styles.yellowLine} />
          <View style={styles.cardBody}>
            <View style={styles.inputRow}>
              <Text style={styles.label}>{t('assets.assetId')}</Text>
              <Text style={styles.colon}>:</Text>
              <TextInput 
                style={styles.input} 
                value={assetId || assetDetails?.asset_id || assetData?.assetId || t('common.notAvailable')} 
                editable={false} 
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.label}>{t('assets.assetName')}</Text>
              <Text style={styles.colon}>:</Text>
              <TextInput 
                style={styles.input} 
                value={assignmentData?.asset_name || assetDetails?.asset_name || assetDetails?.description || assetDetails?.text || assetData?.type || t('common.notAvailable')} 
                editable={false} 
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.label}>{t('assets.assetType')}</Text>
              <Text style={styles.colon}>:</Text>
              <TextInput 
                style={styles.input} 
                value={assetDetails?.asset_type || assetDetails?.type || assignmentData?.asset_type_name || t('common.notAvailable')} 
                editable={false} 
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.label}>{t('assets.assetTypeId')}</Text>
              <Text style={styles.colon}>:</Text>
              <TextInput 
                style={styles.input} 
                value={assetDetails?.asset_type_id || assignmentData?.asset_type_id || t('common.notAvailable')} 
                editable={false} 
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.label}>{t('assets.purchaseVendor')}</Text>
              <Text style={styles.colon}>:</Text>
              <TextInput 
                style={styles.input} 
                value={assetDetails?.purchase_vendor || assetDetails?.vendor || t('common.notAvailable')} 
                editable={false} 
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.label}>{t('assets.serviceVendor')}</Text>
              <Text style={styles.colon}>:</Text>
              <TextInput 
                style={styles.input} 
                value={assetDetails?.service_vendor || assetDetails?.servicer || t('common.notAvailable')} 
                editable={false} 
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.label}>{t('assets.purchasedOn')}</Text>
              <Text style={styles.colon}>:</Text>
              <TextInput 
                style={styles.input} 
                value={assetDetails?.purchased_on ? new Date(assetDetails.purchased_on).toLocaleDateString() : assetDetails?.purchase_date ? new Date(assetDetails.purchase_date).toLocaleDateString() : t('common.notAvailable')} 
                editable={false} 
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.label}>{t('assets.expiryDate')}</Text>
              <Text style={styles.colon}>:</Text>
              <TextInput 
                style={styles.input} 
                value={assetDetails?.expiry_date ? new Date(assetDetails.expiry_date).toLocaleDateString() : assetDetails?.warranty_expiry ? new Date(assetDetails.warranty_expiry).toLocaleDateString() : t('common.notAvailable')} 
                editable={false} 
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.label}>{t('assets.warrantyPeriod')}</Text>
              <Text style={styles.colon}>:</Text>
              <TextInput 
                style={styles.input} 
                value={assetDetails?.warranty_period || assetDetails?.warranty_duration || t('common.notAvailable')} 
                editable={false} 
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.label}>{t('assets.assignmentDate')}</Text>
              <Text style={styles.colon}>:</Text>
              <TextInput 
                style={styles.input} 
                value={assignmentData?.action_on ? new Date(assignmentData.action_on).toLocaleDateString() : assignmentDetails?.action_on ? new Date(assignmentDetails.action_on).toLocaleDateString() : t('common.notAvailable')} 
                editable={false} 
              />
            </View>
          </View>
        </View>
      )}

      {/* Cancel Assignment Button */}
      {!loading && assignmentData && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleCancelAssignment}
          >
            <Text style={styles.cancelButtonText}>{t('assets.cancelAssignment')}</Text>
          </TouchableOpacity>
        </View>
      )}
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
    height: verticalScale(56),
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
  backRow: {
    backgroundColor: '#ededed',
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.MD,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  card: {
    margin: RESPONSIVE_CONSTANTS.SPACING.MD,
    marginTop: RESPONSIVE_CONSTANTS.SPACING.MD,
    borderRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    backgroundColor: '#003366',
    borderTopLeftRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    borderTopRightRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    alignItems: 'center',
  },
  cardHeaderText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
  },
  cardBody: {
    padding: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  label: {
    width: RESPONSIVE_CONSTANTS.LABEL_WIDTH,
    color: '#616161',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: '500',
  },
  colon: {
    width: RESPONSIVE_CONSTANTS.COLON_WIDTH,
    color: '#333',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    textAlign: 'center',
    marginHorizontal: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: scale(4),
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.MD,
    height: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
    borderWidth: 1,
    borderColor: '#ccc',
    color: '#616161',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.SM,
    fontWeight: '400',
    textAlignVertical: 'center',
    textAlign: 'left',
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
    marginTop: RESPONSIVE_CONSTANTS.SPACING.MD,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    color: "#666",
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: RESPONSIVE_CONSTANTS.SPACING.LG,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    alignItems: 'flex-end',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.XL,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    borderRadius: scale(6),
    minWidth: scale(150),
    alignItems: 'center',
    minHeight: RESPONSIVE_CONSTANTS.BUTTON_HEIGHT,
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: '600',
  },
});

