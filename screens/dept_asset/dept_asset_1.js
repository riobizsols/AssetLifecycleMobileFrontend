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
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Appbar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import Dept_Asset_2 from "../dept_asset/dept_asset_2";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const EMPLOYEE_DATA = [
  { id: "AF101", name: "Jerome Bell", assets: 2 },
  { id: "AF102", name: "Brooklyn Simmons", assets: 3 },
  { id: "AF103", name: "Kathryn Murphy", assets: 2 },
  { id: "AF104", name: "Cody Fisher", assets: 1 },
];

export default function DepartmentScreenMain() {
  const navigation = useNavigation();
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#EEEEEE" }}>
        {/* AppBar */}
        <Appbar.Header style={styles.appbar}>
          <Appbar.Action icon="menu" color="#FEC200" onPress={() => {}} />
          {/* Centered Title */}
          <View style={styles.centerTitleContainer}>
            <Text style={styles.appbarTitle}>Department</Text>
          </View>
          {/* Right side empty to balance layout */}
          <View style={{ width: 40 }} />
        </Appbar.Header>

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.assetInput}
              placeholder="DEP101"
              placeholderTextColor="#aaa"
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
            <Text style={styles.label}>Department</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput style={styles.valueInput} value="HR" editable={false} />
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>No. Of. Asset</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput style={styles.valueInput} value="8" editable={false} />
            <TouchableOpacity>
              <Text style={styles.viewText }  onPress={() =>
                    navigation.navigate("Dept_Asset_2", )
                  }>View</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>No. Of. Employee</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput style={styles.valueInput} value="4" editable={false} />
            <TouchableOpacity>
              <Text style={styles.viewText}  onPress={() =>
                    navigation.navigate("Dept_Asset_4", )
                  }>View</Text>
            </TouchableOpacity>
          </View>
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
            <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>
              No. Of. Assets Assigned
            </Text>
          </View>
           <View style={styles.yellowLine} />
          <FlatList
            data={EMPLOYEE_DATA}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <View
                style={[
                  styles.tableRow,
                  { backgroundColor: index % 2 === 0 ? "#fff" : "#f0f4f8" },
                ]}
              >
                <Text style={[styles.tableCell, { flex: 1.2 }]}>{item.id}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{item.name}</Text>
                <TouchableOpacity style={{ flex: 1.5 }}>
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
                    {item.assets}
                  </Text>
                </TouchableOpacity>
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
  },
  assetInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 4,
    paddingHorizontal: 10,
    height: 45,
    borderWidth: 1,
    borderColor: "#ccc",
    // textAlign: 'center',
    textAlignVertical: "center",
  },
  qrButton: {
    marginLeft: 8,
    backgroundColor: "#003667",
    height: 45,
    width: "10%",
    borderRadius: 6,
    alignContent: "center",
    alignItems: "center",
    justifyContent: "center",
    // padding: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  yellowLine:{
    height: 3,
    backgroundColor: "#FEC200",
    width: "100%",
  },
  label: {
    width: 150,
    color: "#616161",
    fontSize: 14,
    fontWeight: "500",
  },
  colon: {
    width: 10,
    color: "#333",
    fontSize: 14,
    textAlign: "center",
    marginHorizontal: 10,
  },
  valueInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 4,
    paddingHorizontal: 10,
    height: 36,
    // marginRight: 60,
    textAlignVertical: "center",
    color: "#616161",
    fontSize: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    fontWeight: 400,
  },
  viewText: {
    color: "#003366",
    fontSize: 12,
    fontWeight: 400,
    marginRight: 18,
    textDecorationLine: "underline",
    marginLeft:10
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
    color: "#333",
    textAlign: "center",
  },
});
