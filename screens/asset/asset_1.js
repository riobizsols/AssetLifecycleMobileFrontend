import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Appbar } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";

export default function App() {
  const navigation = useNavigation();
  const [showCamera, setShowCamera] = useState(false);
  const [barcode, setBarcode] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();

  const openCamera = async () => {
    if (!permission?.granted) {
      await requestPermission();
    }
    setShowCamera(true);
    setBarcode(null); // reset previous barcode
  };

  const handleBarcodeScanned = (barcodeData) => {
    setShowCamera(false);
    setBarcode(barcodeData.data);
  };

  return showCamera ? (
    <View style={{ flex: 1 }}>
      <View style={{ position: "absolute", top: 40, right: 20, zIndex: 2 }}>
        <TouchableOpacity
          onPress={() => setShowCamera(false)}
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            borderRadius: 20,
            padding: 8,
          }}
        >
          <MaterialCommunityIcons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{
          barcodeTypes: [
            "qr",
            "ean13",
            "ean8",
            "code39",
            "code128",
            "upc_a",
            "upc_e",
          ],
        }}
        onBarcodeScanned={handleBarcodeScanned}
      />
      <View
        style={{
          position: "absolute",
          bottom: 40,
          alignSelf: "center",
          backgroundColor: "#003667",
          padding: 12,
          borderRadius: 40,
        }}
      >
        <Text style={{ color: "#fff" }}>Point camera at barcode</Text>
      </View>
    </View>
  ) : (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#EEEEEE" }}>
      {/* AppBar */}
      <Appbar.Header style={styles.appbar}>
        <Appbar.Action icon="menu" color="#FEC200" onPress={() => {}} />
        <View style={styles.centerTitleContainer}>
          <Text style={styles.appbarTitle}>Asset</Text>
        </View>
      </Appbar.Header>

      {/* Main Content */}
      <View style={styles.container}>
        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Scan Barcode</Text>
          <Text style={styles.cardSubtitle}>
            Hold your device over a barcode to{"\n"}scan
          </Text>
          <View style={styles.barcodeContainer}>
            <MaterialCommunityIcons
              name="barcode-scan"
              size={140}
              color="#222"
            />
            <View style={styles.redLine} />
          </View>
          {barcode && (
            <Text style={{ marginTop: 20, color: "#003667", fontWeight: "bold" }}>
              Barcode Value: {barcode}
            </Text>
          )}
        </View>

        {/* Scan Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={openCamera}
        >
          <Text style={styles.buttonText}>Scan Asset</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  downloadIcon: {
    marginLeft: 8,
  },
  appbarTitle: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    alignSelf: "center",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    // paddingTop: 32,
  },
  card: {
    width: "85%",
    height: "65%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    // paddingVertical: 32,
    // paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 32,
  },
  cardTitle: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 8,
    color: "#616161",
    textAlign: "center",
  },
  cardSubtitle: {
    color: "#7A7A7A",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 24,
    textAlign: "center",
    marginTop: 25,
  },
  barcodeContainer: {
    backgroundColor: "#FFFFFF",
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 75,
    position: "relative",
  },
  redLine: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "red",
    width: "100%",
    alignSelf: "center",
    transform: [{ translateY: -1 }],
  },
  button: {
    marginTop: 24,
    backgroundColor: "#003667",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 80,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  buttonText: {
    color: "#fff",
    fontWeight: '500',
    fontSize: 12,
  },
});
