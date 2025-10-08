import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { Appbar } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { API_CONFIG, getApiHeaders, API_ENDPOINTS } from "../../config/api";

export default function EmployeeListScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { departmentId, employeeData } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);

  // Set employee data when component loads or when employeeData changes
  useEffect(() => {
    if (employeeData && Array.isArray(employeeData)) {
      setEmployees(employeeData);
    } else {
      setEmployees([]);
    }
  }, [employeeData]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f4f4f4" }}>
        {/* AppBar */}
        <Appbar.Header style={styles.appbar}>
          <Appbar.Action icon="menu" color="#FEC200" onPress={() => {}} />
          {/* Centered Title */}
          <View style={styles.centerTitleContainer}>
            <Text style={styles.appbarTitle}>{t('assets.employeeList')}</Text>
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
              {t('assets.employeeId')}
            </Text>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>
              {t('assets.employeeName')}
            </Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>
              {t('assets.noOfAssetsAssigned')}
            </Text>
          </View>
          <View style={styles.yellowLine} />

          {employees.length > 0 ? (
            <FlatList
              data={employees}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <View
                  style={[
                    styles.tableRow,
                    { backgroundColor: index % 2 === 0 ? "#fff" : "#f0f4f8" },
                  ]}
                >
                  <Text style={[styles.tableCell, { flex: 1.2 }]}>
                    {item.id}
                  </Text>
                                     <TouchableOpacity 
                     style={{ flex: 2 }}
                     onPress={() =>
                       navigation.navigate("Dept_Asset_5", {
                         employeeId: item.id,
                         employeeName: item.name,
                         departmentId: departmentId
                       })
                     }
                   >
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
                       {item.name}
                     </Text>
                   </TouchableOpacity>
                   <Text
                      style={[
                        styles.tableCell,
                        {
                          color: "#003366",
                          // textDecorationLine: "underline",
                          textAlign: "center",
                          flex: 1.5 
                        },
                      ]}
                    >
                      {item.assets}
                    </Text>
                </View>
              )}
              ListFooterComponent={<View style={{ height: 120 }} />}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {departmentId
                  ? t('assets.noEmployeesFoundForDepartment')
                  : t('assets.noEmployeeDataAvailable')}
              </Text>
            </View>
          )}
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
  yellowLine: {
    height: 3,
    backgroundColor: "#FEC200",
    width: "100%",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
});
