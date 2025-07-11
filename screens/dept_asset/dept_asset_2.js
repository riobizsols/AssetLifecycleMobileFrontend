import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Appbar } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";

const ASSET_DATA = [
  { type: "Keyboard", serial: "121354", assigned: "Jerome Bell" },
  { type: "Monitor", serial: "121354", assigned: "Brooklyn Simmons" },
  { type: "Mouse", serial: "121354", assigned: "Kathryn Murphy" },
  { type: "Power cable", serial: "121354", assigned: "Brooklyn Simmons" },
  { type: "Keyboard", serial: "121354", assigned: "Jerome Bell" },
  { type: "Monitor", serial: "121354", assigned: "Brooklyn Simmons" },
  { type: "Mouse", serial: "121354", assigned: "Kathryn Murphy" },
  { type: "Power cable", serial: "121354", assigned: "Cody Fisher" },
];

export default function DepartmentAssetsScreen() {
  const navigation = useNavigation();
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f4f4f4" }}>
        {/* AppBar */}
        <Appbar.Header style={styles.appbar}>
          <Appbar.Action icon="menu" color="#FEC200" onPress={() => {}} />
          {/* Centered Title */}
          <View style={styles.centerTitleContainer}>
            <Text style={styles.appbarTitle}>Department Assets</Text>
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

        {/* Table */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>
              Asset Type
            </Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>
              Serial No.
            </Text>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>
              Assigned to
            </Text>
          </View>
          <View style={styles.yellowLine} />
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
                <TouchableOpacity style={{ flex: 1 } }  onPress={() =>
                    navigation.navigate("Dept_Asset_3", { serial: item.serial })
                  }>
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
                  {item.assigned}
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
  yellowLine:{
    height: 3,
    backgroundColor: "#FEC200",
    width: "100%",
  },
});
