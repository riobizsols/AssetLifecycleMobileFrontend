import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Appbar } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";



export default function AssetDetailsScreen() {
    const navigation = useNavigation();
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
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderText}>Serial No. 121354</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.inputRow}>
            <Text style={styles.label}>Asset Type</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput style={styles.input} value="122101" editable={false} />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.label}>Department</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput style={styles.input} value="HR" editable={false} />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.label}>Effective Date</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput style={styles.input} value="20/12/2025" editable={false} />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.label}>Return Date</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput style={styles.input} value="20/12/2026" editable={false} />
          </View>
        </View>
      </View>
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
});
