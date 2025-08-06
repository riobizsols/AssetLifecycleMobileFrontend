import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Appbar } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { API_CONFIG, getApiHeaders, API_ENDPOINTS } from "../../config/api";

export default function AssetDetailsScreen() {
    const navigation = useNavigation();
    const route = useRoute();
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
    }, [assetId]);

    // Handle cancel assignment
    const handleCancelAssignment = async () => {
      if (!assignmentData?.asset_assign_id) {
        Alert.alert("Error", "Assignment ID not found");
        return;
      }

      console.log('Original assignment data:', assignmentData);

      Alert.alert(
        "Cancel Assignment",
        "Are you sure you want to cancel this asset assignment?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Yes",
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
                  assignment_type: assignmentData.assignment_type || "Department",
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
                  "Success",
                  "Asset assignment has been cancelled successfully.",
                  [
                    {
                      text: "OK",
                      onPress: () => navigation.goBack()
                    }
                  ]
                );

              } catch (error) {
                console.error("Error cancelling assignment:", error);
                Alert.alert(
                  "Error",
                  "Failed to cancel assignment. Please try again.",
                  [{ text: "OK" }]
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
<SafeAreaView style={{ flex: 1, backgroundColor: '#f4f4f4' }}>
      {/* AppBar */}
      <Appbar.Header style={styles.appbar}>
          <Appbar.Action icon="menu" color="#FEC200" onPress={() => {}} />
          {/* Centered Title */}
          <View style={styles.centerTitleContainer}>
            <Text style={styles.appbarTitle}>Asset Details</Text>
          </View>
          {/* Right side empty to balance layout */}
          <View style={{ width: 40 }} />
        </Appbar.Header>

      {/* Back Arrow */}
      <View style={styles.backRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Card */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#003667" />
          <Text style={styles.loadingText}>Loading asset details...</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderText}>
              Serial No. {serialNumber || assetData?.serial || "N/A"}
            </Text>
          </View>
          <View style={styles.yellowLine} />
          <View style={styles.cardBody}>
            <View style={styles.inputRow}>
              <Text style={styles.label}>Asset Type</Text>
              <Text style={styles.colon}>:</Text>
              <TextInput 
                style={styles.input} 
                value={assignmentData?.asset_name || assetDetails?.asset_name || assetDetails?.description || assetDetails?.text || assetData?.type || "N/A"} 
                editable={false} 
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.label}>Department</Text>
              <Text style={styles.colon}>:</Text>
              <TextInput 
                style={styles.input} 
                value={assignmentData?.dept_id || assignmentDetails?.dept_id || "N/A"} 
                editable={false} 
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.label}>Effective Date</Text>
              <Text style={styles.colon}>:</Text>
              <TextInput 
                style={styles.input} 
                value={assignmentData?.action_on ? new Date(assignmentData.action_on).toLocaleDateString() : assignmentDetails?.action_on ? new Date(assignmentDetails.action_on).toLocaleDateString() : "N/A"} 
                editable={false} 
              />
            </View>
            {/* <View style={styles.inputRow}>
              <Text style={styles.label}>Assigned To</Text>
              <Text style={styles.colon}>:</Text>
              <TextInput 
                style={styles.input} 
                value={assignmentData?.employee_int_id || assignmentDetails?.employee_int_id || assetData?.assigned || "N/A"} 
                editable={false} 
              />
                        </View> */}
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
            <Text style={styles.cancelButtonText}>Cancel Assignment</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  </SafeAreaProvider>

    
  );
}

const styles = StyleSheet.create({
  appbar: {
    backgroundColor: '#003366',
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  appbarTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    alignSelf: 'center',
  },
  centerTitleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  backRow: {
    backgroundColor: '#ededed',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  card: {
    margin: 10,
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    backgroundColor: '#003366',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cardHeaderText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  cardBody: {
    padding: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  label: {
    width: 120,
    color: '#616161',
    fontSize: 14,
    fontWeight : '500',
  },
  colon: {
    width: 10,
    color: '#333',
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal : 10
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    paddingHorizontal: 10,
    height: 37,
    borderWidth: 1,
    borderColor: '#ccc',
    color: '#616161',
    fontSize: 12,
    fontWeight : '400',
    textAlignVertical: 'center',
    textAlign: 'left',
  },
  yellowLine:{
    height: 3,
    backgroundColor: "#FEC200",
    width: "100%",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    alignItems: 'flex-end',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    minWidth: 150,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
