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
import { Appbar } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

const EMPLOYEE_LIST = [
  { id: "AF101", name: "Jerome Bell", role: "Developer" },
  { id: "AF102", name: "Brooklyn Simmons", role: "Developer" },
  { id: "AF103", name: "Kathryn Murphy", role: "HR" },
  { id: "AF104", name: "Cody Fisher", role: "HR" },
];

export default function EmployeeListScreen() {
  const navigation = useNavigation();
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f4f4f4" }}>
        {/* AppBar */}
        <Appbar.Header style={styles.appbar}>
          <Appbar.Action icon="menu" color="#FEC200" onPress={() => {}} />
          {/* Centered Title */}
          <View style={styles.centerTitleContainer}>
            <Text style={styles.appbarTitle}>Employee List</Text>
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
            <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>
              Employee Id
            </Text>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>
              Employee name
            </Text>
            <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>Role</Text>
          </View>
          <View style={styles.yellowLine} />
          <FlatList
            data={EMPLOYEE_LIST}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <View
                style={[
                  styles.tableRow,
                  { backgroundColor: index % 2 === 0 ? "#fff" : "#f0f4f8" },
                ]}
              >
                <Text style={[styles.tableCell, { flex: 1.2 }]}>{item.id}</Text>
                {/* <Text style={[styles.tableCell, { flex: 2 }]}>{item.name}</Text> */}
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() =>
                    navigation.navigate("Dept_Asset_5", { serial: item.name })
                  }
                >
                  <Text
                    style={[
                      styles.tableCell,
                      { flex: 2 },
                      {
                        color: "#003366",
                        textDecorationLine: "underline",
                        textAlign: "center",
                      },
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.tableCell, { flex: 1.2 }]}>
                  {item.role}
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
    fontWeight: "500",
    color: "#616161",
    textAlign: "center",
  },
  yellowLine:{
    height: 3,
    backgroundColor: "#FEC200",
    width: "100%",
  },
});
