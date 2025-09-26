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
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Appbar } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { API_CONFIG, getApiHeaders, API_ENDPOINTS } from "../../config/api";

export default function AssetDetailsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
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
        { text: t('assets.no'), style: "cancel" },
        {
          text: t('assets.yes'),
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
                    text: t('assets.ok'),
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
                { text: t('assets.ok') },
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
  }, [assetId]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#EEEEEE" }}>
        {/* AppBar */}
        <Appbar.Header style={styles.appbar}>
          <Appbar.Action
            icon="arrow-left"
            color="#FEC200"
            onPress={() => navigation.goBack()}
          />
          <View style={styles.centerTitleContainer}>
            <Text style={styles.appbarTitle}>{t('assets.assetDetails')}</Text>
          </View>
        </Appbar.Header>

        <View style={{ flex: 1 }}>
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
                    label={t('assets.serialNumber')}
                    value={assetData.serial_number || serialNumber || t('common.notAvailable')}
                  />
                  <DetailRow
                    label={t('assets.description')}
                    value={assetData.description || assetData.text || assetData.name || t('common.notAvailable')}
                  />
                  <DetailRow
                    label={t('assets.status')}
                    value={assetData.current_status || assetData.status || t('common.notAvailable')}
                  />
                  <DetailRow
                    label={t('assets.assignedTo')}
                    value={employeeName || assignmentData?.employee_int_id || t('common.notAvailable')}
                  />
                  <DetailRow
                    label={t('employees.department')}
                    value={departmentId || assignmentData?.dept_id || t('common.notAvailable')}
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
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailColon}>:</Text>
      <TextInput style={styles.detailValue} value={value} editable={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  appbar: {
    backgroundColor: "#003667",
    elevation: 0,
    shadowOpacity: 0,
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    position: "relative",
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
    fontSize: 16,
    alignSelf: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  card: {
    backgroundColor: "#fff",
    margin: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    backgroundColor: "#003667",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  cardHeaderText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  yellowLine: {
    height: 3,
    backgroundColor: "#FEC200",
    width: "100%",
  },
  detailsTable: {
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    width: 120,
    fontSize: 14,
    fontWeight: "500",
    color: "#616161",
  },
  detailColon: {
    width: 10,
    color: "#333",
    fontSize: 14,
    textAlign: "center",
    marginHorizontal: 10,
  },
  detailValue: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
    paddingHorizontal: 10,
    // height: 36,
    color: "#333",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  footer: {
    padding: 16,
    backgroundColor: "#fff",
    margin: 10,
    borderRadius: 8,
  },
  cancelBtn: {
    backgroundColor: "#dc3545",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#fff",
    fontSize: 16,
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
    fontSize: 16,
    color: "#666",
  },
  footerFixed: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    // backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    // elevation: 8,
    alignItems: 'flex-end',
  },
}); 