import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Appbar } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';





export default function Asset_2() {
    const { t } = useTranslation();
    const navigation = useNavigation();
  return (
    <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f4f4f4' }}>
      {/* AppBar */}
      <Appbar.Header style={styles.appbar}>
          <Appbar.Action icon="menu" color="#FEC200" onPress={() => {}} />
          {/* Centered Title */}
          <View style={styles.centerTitleContainer}>
            <Text style={styles.appbarTitle}>{t('assets.employeeAsset')}</Text>
          </View>
          {/* Right side empty to balance layout */}
          <View style={{ width: 40 }} />
        </Appbar.Header>

      {/* Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderText}>{t('assets.serialNo')}: 121354</Text>
        </View>
        <View style={styles.yellowLine} />
        <View style={styles.cardBody}>
          <View style={styles.inputRow}>
            <Text style={styles.label}>{t('assets.assetType')}</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput style={styles.input} value="122101" editable={false} />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.label}>{t('employees.department')}</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput style={styles.input} value="HR" editable={false} />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.label}>{t('assets.effectiveDate')}</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput style={styles.input} value="20/12/2025" editable={false} />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.label}>{t('assets.returnDate')}</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput style={styles.input} value="20/12/2026" editable={false} />
          </View>
        </View>
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>{t('assets.cancelAssign')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.okayButton} onPress={() => navigation.goBack()}>
          <Text style={styles.okayButtonText}>{t('assets.okay')}</Text>
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
  card: {
    margin: 10,
    marginTop: 20,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    backgroundColor: '#003667',
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
  yellowLine: {
    height: 3,
    backgroundColor: "#FEC200",
    width: "100%",
  },
  label: {
    width: 115,
    color: '#616161',
    fontSize: 14,
    fontWeight : '500'
  },
  colon: {
    width: 10,
    color: '#616161',
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal : 15
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    paddingHorizontal: 10,
    height: 35,
    borderWidth: 1,
    borderColor: '#ccc',
    color: '#616161',
    fontSize: 12,
    textAlignVertical: 'center',
    textAlign: 'left',
    fontWeight : '400',
    paddingVertical: 0,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  cancelButton: {
    backgroundColor: '#FEC200',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginRight: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 15,
  },
  okayButton: {
    backgroundColor: '#003667',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 28,
    minWidth: 80,
    alignItems: 'center',
  },
  okayButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 15,
  },
});