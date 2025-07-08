import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Appbar } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

const ASSET_DATA = [
  { type: "Keyboard", serial: "121354", remarks: "All keys are functional" },
  { type: "Monitor", serial: "121354", remarks: "No Damage or fraying" },
];

export default function EmployeeAssetDetailScreen() {
    const navigation = useNavigation();
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#EEEEEE" }}>
        {/* AppBar */}
        <Appbar.Header style={styles.appbar}>
          <Appbar.Action icon="menu" color="#FEC200" onPress={() => {}} />
          {/* Centered Title */}
          <View style={styles.centerTitleContainer}>
            <Text style={styles.appbarTitle}>Employee Asset Detail</Text>
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

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Employee Id</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput
              style={styles.valueInput}
              value="AF101"
              editable={false}
            />
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Employee Name</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput
              style={styles.valueInput}
              value="Jerome Bell"
              editable={false}
            />
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Department</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput style={styles.valueInput} value="HR" editable={false} />
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>No. of. assets</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput style={styles.valueInput} value="2" editable={false} />
          </View>
        </View>

        {/* Table */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>
              Asset Type
            </Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>
              Serial No.
            </Text>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Remarks</Text>
          </View>
          <FlatList
            data={ASSET_DATA}
            keyExtractor={(_, idx) => idx.toString()}
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
                <TouchableOpacity style={{ flex: 1 }}>
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
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appbar: {
    backgroundColor: "#003366",
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  appbarTitle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    alignSelf: "center",
  },
  backRow: {
    backgroundColor: "#ededed",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  formContainer: {
    backgroundColor: "#ededed",
    marginHorizontal: 10,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 0,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    width: 140,
    color: "#616161",
    fontSize: 14,
    fontWeight : '500',
  },
  colon: {
    width: 10,
    color: "#333",
    fontSize: 14,
    textAlign: "center",
    marginHorizontal : 10
  },
  valueInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 4,
    paddingHorizontal: 10,
    height: "90%",
    color: "#616161",
    fontSize: 13,
    fontWeight : '400',
    borderWidth: 1,
    borderColor: "#ccc",
    // textAlign: "center",
    textAlignVertical: "center",
  },
  tableContainer: {
    margin: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
    flex: 1,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#003366",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 13,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  tableCell: {
    fontSize: 12,
    fontWeight : '500',
    color: "#616161",
    textAlign: "center",
  },
});
