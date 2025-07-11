import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Appbar } from 'react-native-paper';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#EEEEEE' }}>
      {/* AppBar */}
      <Appbar.Header style={styles.appbar}>
        <Appbar.Action icon="menu" color="#FEC200" onPress={() => {}} />
        <View style={styles.centerTitleContainer}>
          <Text style={styles.appbarTitle}>Asset</Text>
        </View>
       
      </Appbar.Header>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Search Bar */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="627384567868"
            placeholderTextColor="#7A7A7A"
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
          <View style={styles.detailsTable}>
            <DetailRow label="Serial Number" value="122101" />
            <DetailRow label="Department" value="HR" />
            <DetailRow label="Employee" value="Alvin Ben" />
            <DetailRow label="Status" value="Assigned" />
            <DetailRow label="Effective Date" value="20/12/2025" />
            <DetailRow label="Return Date" value="20/12/2026" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  card: {
    height : "50%",
    marginHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    paddingBottom: 16,
    // justifyContent : 'space-around'
  },
  cardHeader: {
    backgroundColor: '#003667',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    // justifyContent : 'space-around',
    // marginBottom: 8,
  },
  cardHeaderText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  detailsTable: {
    paddingHorizontal: 16,
    // paddingVertical : 10,
    // margin : 10,
    paddingTop: 8,
    // marginVertical : 30
    // justifyContent : 'space-evenly'

  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    // justifyContent :
  },
  detailLabel: {
    width: 120,
    color: '#616161',
    fontSize: 14,
    fontWeight:"500"
  },
  detailColon: {
    width: 10,
    color: '#333',
    fontSize: 12,
    fontWeight:"400",
    textAlign: 'center',
    marginRight : 10
  },
  detailValue: {
    flex: 1,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 8,
    height: "140%",
    // backgroundColor: '#f3f3f3',
    color: '#616161',
    fontSize: 12,
    fontWeight : "400",
    textAlignVertical: 'center',
    paddingVertical: 0,
    marginRight : 30
  },
  yellowLine: {
    height: 3,
    backgroundColor: "#FEC200",
    width: "100%",
    marginBottom: 8,
  },
});