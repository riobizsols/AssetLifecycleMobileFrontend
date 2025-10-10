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
          headers: getApiHeaders(),
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
          headers: getApiHeaders(),
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
      if (!assignmentData?.asset_assign_id) {
        Alert.alert(t('common.error'), t('assets.assignmentIdNotFound'));
        return;
      }

      console.log('Original assignment data:', assignmentData);

      Alert.alert(
        t('assets.cancelAssignment'),
        t('assets.confirmCancelAssignment'),
        [
          {
            text: t('common.cancel'),
            style: "cancel"
          },
          {
            text: t('assets.yes'),
            onPress: async () => {
              setLoading(true);
              try {
                console.log(`Cancelling assignment: ${assignmentData.asset_assign_id}`);
                
                // First, update the current assignment to set latest_assignment_flag to false
                const updateUrl = `${API_CONFIG.BASE_URL}/api/asset-assignments/${assignmentData.asset_assign_id}`;
                const updateResponse = await fetch(updateUrl, {
                  method: 'PUT',
                  headers: {
                    ...getApiHeaders(),
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    latest_assignment_flag: false
                  })
                });

                if (!updateResponse.ok) {
                  const errorText = await updateResponse.text();
                  console.error('Update API error response:', errorText);
                  throw new Error(`Failed to update assignment: ${updateResponse.status} - ${errorText}`);
                }

                console.log('Existing assignment updated successfully');

                // Now create a new cancellation record
                const cancelUrl = `${API_CONFIG.BASE_URL}/api/asset-assignments`;
                const cancelData = {
                  asset_assign_id: `AA${Date.now()}`, // Generate a unique ID
                  asset_id: assignmentData.asset_id,
                  employee_int_id: assignmentData.employee_int_id,
                  dept_id: assignmentData.dept_id,
                  action: "C", // Cancel
                  action_by: assignmentData.action_by || "USR001",
                  latest_assignment_flag: true,
                  assignment_type: assignmentData.assignment_type || t('assets.department'),
                  org_id: assignmentData.org_id || "ORG001",
                  action_on: new Date().toISOString(),
                  remarks: "Assignment cancelled"
                };

                console.log('Creating new cancellation record with data:', cancelData);

                const cancelResponse = await fetch(cancelUrl, {
                  method: 'POST',
                  headers: {
                    ...getApiHeaders(),
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(cancelData)
                });

                if (!cancelResponse.ok) {
                  const errorText = await cancelResponse.text();
                  console.error('Cancellation API error response:', errorText);
                  throw new Error(`Failed to create cancellation record: ${cancelResponse.status} - ${errorText}`);
                }

                console.log('Cancellation record created successfully');

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

