import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Linking,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
// import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Appbar } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import Asset_2 from "./emp_asset_2";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const assetData = [
  { type: "Keyboard", serial: "121354", remarks: "All keys are functional" },
  { type: "Monitor", serial: "121354", remarks: "No Damage or fraying" },
  { type: "Mouse", serial: "121354", remarks: "No Damage or fraying" },
  { type: "Power cable", serial: "121354", remarks: "No Damage or fraying" },
];

// Function to convert assetData to CSV
const convertToCSV = (data) => {
  const header = "Asset Type,Serial No,Remarks\n";
  const rows = data.map(item => `${item.type},${item.serial},${item.remarks}`).join("\n");
  return header + rows;
};

export default function Asset_1() {
  const navigation = useNavigation();

  // Function to handle CSV download
  const handleDownloadCSV = async () => {
    try {
      const csv = convertToCSV(assetData);
      const fileUri = FileSystem.documentDirectory + "employee_assets.csv";
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        alert("CSV file saved to: " + fileUri);
      }
    } catch (error) {
      alert("Failed to save CSV: " + error.message);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#EEEEEE" }}>
        <Appbar.Header style={styles.appbar}>
          <Appbar.Action icon="menu" color="#FEC200" onPress={() => {}} />
          {/* Centered Title */}
          <View style={styles.centerTitleContainer}>
            <Text style={styles.appbarTitle}>Employee Asset</Text>
          </View>
          {/* Right side empty to balance layout */}
          <View style={{ width: 40 }} />
        </Appbar.Header>

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.assetInput}
              placeholder="AF1001"
              placeholderTextColor="#B6B7B8"
              
            />
            <TouchableOpacity style={styles.qrButton}>
              <MaterialCommunityIcons
                name="line-scan"
                size={22}
                color="#FEC200"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Employee Name</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>Alfee</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Department</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>Development</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>No. of. assets</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>4</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>
              Asset Type
            </Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Serial No</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Remarks</Text>
          </View>
          <FlatList
            data={assetData}
            keyExtractor={(item) => item.type}
            renderItem={({ item, index }) => (
              <View
                style={[
                  styles.tableRow,
                  { backgroundColor: index % 2 === 0 ? "#fff" : "#f0f4f8" },
                ]}
              >
                <Text style={[styles.tableCell, { flex: 1 }]}>{item.type}</Text>

                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() =>
                    navigation.navigate("Asset_2", { serial: item.serial })
                  }
                >
                  <Text
                    style={[
                      styles.tableCell,
                      {
                        color: "#003667",
                        textDecorationLine: "underline",
                      },
                    ]}
                  >
                    {item.serial}
                  </Text>
                </TouchableOpacity>

                <Text style={[styles.tableCell, { flex: 1 }]}>
                  {item.remarks}
                </Text>
              </View>
            )}
          />
        </View>

        {/* Download as CSV Button */}
        <View style={{ padding: 16 }}>
          <TouchableOpacity
            style={{
              backgroundColor: "#003667",
              padding: 12,
              borderRadius: 8,
              alignItems: "center",
              marginTop: 10,
            }}
            onPress={handleDownloadCSV}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>Download as CSV</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
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
  formContainer: {
    backgroundColor: "#EEEEEE",
    margin: 0,
    borderRadius: 8,
    padding: 16,
    marginBottom: 0,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    // height :"20%"
  },
  assetInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
    paddingHorizontal: 10,
    height: 45,
    borderWidth: 1,
    borderColor: "#ccc",
    // textAlign: 'center',           // Center text horizontally
    textAlignVertical: "center", // Center text vertically (mainly for Android)
    paddingVertical: 0,
    
  },
  qrButton: {
    marginLeft: 8,
    backgroundColor: "#003667",
    height: 45,
    width: "10%",
    alignContent: "center",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,

    // padding: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    width: 150,
    color: "#616161",
    fontSize: 14,
    fontWeight: "500",
  },
  colon: {
    width: 10,
    color: "#616161",
    fontSize: 14,
    textAlign: "center",
    marginRight: 10,
  },
  value: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 4,
    paddingHorizontal: 10,
    height: 35,
    marginRight: 60,
    textAlignVertical: "center",
    color: "#616161",
    fontSize: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    fontWeight: 400,
  },
  tableContainer: {
    height: "60%",
    margin: 10,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    overflow: "hidden",
    // flex: 1,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#003366",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 13,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  tableCell: {
    fontSize: 12,
    color: "#616161",
    fontWeight : '500'
  },
});
