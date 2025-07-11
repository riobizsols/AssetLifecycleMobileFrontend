import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { Appbar } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";

import {
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import RNPickerSelect from "react-native-picker-select";

const departments = [
  { label: "IT", value: "it" },
  { label: "Development", value: "development" },
  { label: "Marketing", value: "marketing" },
  { label: "Design", value: "design" },
  { label: "HR", value: "hr" },
];
const employees = [
  { label: "AF1001 - John Doe", value: "john" },
  { label: "AF1002 - Jane Smith", value: "jane" },
  { label: "AF1009 - Adlin", value: "adlin" },
  { label: "AF1012 - Ahmmed", value: "ahmmed" },
];
const statuses = [
  { label: "Assigned", value: "assigned" },
  { label: "Unassigned", value: "unassigned" },
  { label: "Available", value: "available" },
];

export default function App() {
  const navigation = useNavigation();
  const [serial] = useState("122101");
  const [department, setDepartment] = useState("");
  const [employee, setEmployee] = useState("");
  const [status, setStatus] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(new Date());
  const [returnDate, setReturnDate] = useState(new Date());
  const [showEffective, setShowEffective] = useState(false);
  const [showReturn, setShowReturn] = useState(false);

  // Simple dropdown for demo (replace with picker or dropdown library for production)
  const renderDropdown = (value, setValue, options) => (
    <View style={styles.dropdownWrapper}>
      <RNPickerSelect
        onValueChange={setValue}
        items={options}
        value={value}
        placeholder={{ label: "Select...", value: "" }}
        style={pickerSelectStyles}
        Icon={() => null}
        useNativeAndroidPickerStyle={false}
      />
      <View style={styles.dropdownIcon}>
        <Icon name="arrow-drop-down" size={22} color="#888" />
      </View>
    </View>
  );

  const pickerSelectStyles = {
    inputIOS: {
      color: "#616161",
      fontSize: 14,
      fontWeight: "400",
      height: 36,
      paddingVertical: 8,
      paddingHorizontal: 0,
      backgroundColor: "transparent",
    },
    inputAndroid: {
      color: "#616161",
      fontSize: 14,
      fontWeight: "400",
      height: 36,
      paddingVertical: 8,
      paddingHorizontal: 0,
      backgroundColor: "transparent",
    },
    placeholder: {
      color: "#aaa",
    },
    iconContainer: {
      display: "none",
    },
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* AppBar */}
      <Appbar.Header style={styles.appbar}>
        <Appbar.Action icon="menu" color="#FEC200" onPress={() => {}} />
        <View style={styles.centerTitleContainer}>
          <Text style={styles.appbarTitle}>Asset</Text>
        </View>
       
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Search Bar */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="627384567868"
            placeholderTextColor="#888"
          />
          <TouchableOpacity style={styles.qrButton}>
            <MaterialCommunityIcons name="line-scan" size={22} color="#FEC200" />
          </TouchableOpacity>
        </View>
        {/* Asset Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderText}>Asset Details</Text>
          </View>
          <View style={styles.yellowLine} />
          <View style={styles.cardBody}>
            {/* Serial Number */}
            <View style={styles.formRow}>
              <Text style={styles.label}>Serial Number</Text>
              <Text style={styles.colon}>:</Text>
              <TextInput style={styles.input} value={serial} editable={false} />
            </View>
            {/* Department */}
            <View style={styles.formRow}>
              <Text style={styles.label}>Department</Text>
              <Text style={styles.colon}>:</Text>
              {renderDropdown(department, setDepartment, departments)}
            </View>
            {/* Employee */}
            <View style={styles.formRow}>
              <Text style={styles.label}>Employee</Text>
              <Text style={styles.colon}>:</Text>
              {renderDropdown(employee, setEmployee, employees)}
            </View>
            {/* Status */}
            <View style={styles.formRow}>
              <Text style={styles.label}>Status</Text>
              <Text style={styles.colon}>:</Text>
              {renderDropdown(status, setStatus, statuses)}
            </View>
            {/* Effective Date */}
            <View style={styles.formRow}>
              <Text style={styles.label}>Effective Date</Text>
              <Text style={styles.colon}>:</Text>
              <TouchableOpacity
                style={styles.inputWithIcon}
                onPress={() => setShowEffective(true)}
              >
                <Text style={{ flex: 1, color: "#616161" }}>
                  {effectiveDate.toLocaleDateString()}
                </Text>
                <Icon name="calendar-today" size={20} color="#003366" />
              </TouchableOpacity>
              {showEffective && (
                <DateTimePicker
                  value={effectiveDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(e, date) => {
                    setShowEffective(false);
                    if (date) setEffectiveDate(date);
                  }}
                />
              )}
            </View>
            {/* Return Date */}
            <View style={styles.formRow}>
              <Text style={styles.label}>Return Date</Text>
              <Text style={styles.colon}>:</Text>
              <TouchableOpacity
                style={styles.inputWithIcon}
                onPress={() => setShowReturn(true)}
              >
                <Text style={{ flex: 1, color: "#616161" }}>
                  {returnDate.toLocaleDateString()}
                </Text>
                <Icon name="calendar-today" size={20} color="#003366" />
              </TouchableOpacity>
              {showReturn && (
                <DateTimePicker
                  value={returnDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(e, date) => {
                    setShowReturn(false);
                    if (date) setReturnDate(date);
                  }}
                />
              )}
            </View>
          </View>
        </View>
      </ScrollView>
      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.assignBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.assignBtnText}>Assign</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#EEEEEE" },
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
   titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  appbarTitle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#003667",
    height: 56,
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  scroll: { flexGrow: 1, paddingBottom: 16 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    margin: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchInput: {
    flex: 1,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 45,
    backgroundColor: '#f3f3f3',
    fontSize: 14,
    fontWeight : "400",
    textAlignVertical: 'center',
    paddingVertical: 0,
  },
  qrButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#003667",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginHorizontal: 10,
    marginTop: 8,
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    // Android shadow
    elevation: 2,
    overflow: "hidden",
  },
  cardHeader: {
    backgroundColor: "#003366",
    paddingVertical: 10,
    alignItems: "center",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  cardHeaderText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  cardBody: {
    padding: 16,
  },
  formRow: {
    flexDirection: "row",
    alignItems: "stretch",
    // alignContent : 'flex-start',
    // justifyContent :"flex-start",

    marginBottom: 14,
  },
  label: {
    flex: 1.2,
    fontSize: 14,
    fontWeight:"500",
    color: "#616161",
    textAlign: "left",
    marginRight: 6,
  },
  colon: {
    width: 10,
    textAlign: "center",
    color: "#333",
    fontSize: 14,
    margin : 10
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 45,
    backgroundColor: '#f3f3f3',
    fontSize: 14,
    fontWeight : "400",
    textAlignVertical: 'center',
    paddingVertical: 0,
  },
  qrButton: {
    backgroundColor: '#003667',
    borderRadius: 8,
    padding: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 45,
    width: 40,
  },
  input: {
    flex: 2,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#f9f9f9",
    color: "#616161",
    flexDirection: "row",
    alignItems: "center",
    justifyContent : "flex-end",
    fontSize: 14,
    fontWeight : "400",
  },
  inputWithIcon: {
    flex: 2,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#f9f9f9",
    flexDirection: "row",
    alignItems: "center",
    // fontSize: 18,
    // fontWeight : "400",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  cancelBtn: {
    backgroundColor: "#FEC200",
    borderRadius: 4,
    paddingHorizontal: 28,
    paddingVertical: 10,
    marginRight: 10,
  },
  assignBtn: {
    backgroundColor: "#003667",
    borderRadius: 4,
    paddingHorizontal: 28,
    paddingVertical: 10,
  },
  cancelBtnText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 12,
  },
  assignBtnText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 12,
  },
  dropdownWrapper: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    backgroundColor: "#f9f9f9",
    height: 36,
    paddingHorizontal: 8,
    position: "relative",
  },
  dropdownIcon: {
    position: "absolute",
    right: 8,
    top: 7,
    pointerEvents: "none",
  },
  yellowLine:{
    height: 3,
    backgroundColor: "#FEC200",
    width: "100%",
    marginBottom: 8,
  },
});