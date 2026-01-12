import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useTranslation } from "react-i18next";
import { UI_CONSTANTS, COMMON_STYLES } from "../../utils/uiConstants";

const MOCK_ASSETS = [
  { id: "AST-1001", name: "Floor Cleaning Machine" },
  { id: "AST-2044", name: "Conveyor Belt" },
  { id: "AST-3391", name: "Air Compressor" },
  { id: "AST-4820", name: "HVAC Unit" },
  { id: "AST-5932", name: "Generator" },
];

const MOCK_USAGE_HISTORY = [
  {
    id: "usage-1",
    assetId: "AST-1001",
    usageCounter: "120",
    date: "2024-08-26",
    recordedBy: "John Carter",
  },
  {
    id: "usage-2",
    assetId: "AST-2044",
    usageCounter: "98",
    date: "2024-08-24",
    recordedBy: "John Carter",
  },
  {
    id: "usage-3",
    assetId: "AST-1001",
    usageCounter: "110",
    date: "2024-08-20",
    recordedBy: "John Carter",
  },
];

const RecordUsageScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [usageCounter, setUsageCounter] = useState("");
  const [assetSearch, setAssetSearch] = useState("");
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const filteredAssets = useMemo(() => {
    if (!assetSearch.trim()) {
      return MOCK_ASSETS;
    }

    const searchTerm = assetSearch.trim().toLowerCase();
    return MOCK_ASSETS.filter(
      (asset) =>
        asset.id.toLowerCase().includes(searchTerm) ||
        asset.name.toLowerCase().includes(searchTerm),
    );
  }, [assetSearch]);

  const usageHistory = MOCK_USAGE_HISTORY;

  const handleSelectAsset = (asset) => {
    setSelectedAsset(asset);
    setShowAssetModal(false);
  };

  const handleCancel = () => {
    setSelectedAsset(null);
    setUsageCounter("");
  };

  const handleSubmit = () => {
    if (!selectedAsset || !usageCounter.trim()) {
      return;
    }

    setSubmitting(true);
    // TODO: Integrate API call to submit usage data
    setTimeout(() => {
      setSubmitting(false);
      setUsageCounter("");
    }, 1000);
  };

  const renderUsageRow = ({ item, index }) => (
    <View
      style={[
        styles.tableRow,
        index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
      ]}
    >
      <Text style={[styles.tableCell, styles.tableCellAsset]} numberOfLines={1}>
        {item.assetId}
      </Text>
      <Text style={[styles.tableCell, styles.tableCellUsage]} numberOfLines={1}>
        {item.usageCounter}
      </Text>
      <Text style={[styles.tableCell, styles.tableCellDate]} numberOfLines={1}>
        {item.date}
      </Text>
      <Text style={[styles.tableCell, styles.tableCellRecordedBy]} numberOfLines={1}>
        {item.recordedBy}
      </Text>
    </View>
  );

  const renderAssetItem = ({ item }) => (
    <TouchableOpacity
      style={styles.assetItem}
      onPress={() => handleSelectAsset(item)}
    >
      <View style={styles.assetItemContent}>
        <Text style={styles.assetId}>{item.id}</Text>
        <Text style={styles.assetName}>{item.name}</Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={22}
        color={UI_CONSTANTS.COLORS.PRIMARY}
      />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 0) }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={UI_CONSTANTS.COLORS.PRIMARY}
        translucent={Platform.OS === "android"}
      />

      <View style={styles.appBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={UI_CONSTANTS.COLORS.SECONDARY}
          />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>
          {t("recordUsage.title", "Record Usage")}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {t("recordUsage.selectAsset", "Select Asset")}
          </Text>
          <TouchableOpacity
            style={styles.dropdownTrigger}
            onPress={() => setShowAssetModal(true)}
            activeOpacity={0.75}
          >
            <View>
              {selectedAsset ? (
                <>
                  <Text style={styles.dropdownLabel}>
                    {t("recordUsage.assetId", "Asset ID")}
                  </Text>
                  <Text style={styles.dropdownValue}>{selectedAsset.id}</Text>
                  <Text style={styles.dropdownHint}>{selectedAsset.name}</Text>
                </>
              ) : (
                <Text style={styles.dropdownPlaceholder}>
                  {t("recordUsage.searchAsset", "Tap to search asset")}
                </Text>
              )}
            </View>
            <Icon name="arrow-drop-down" size={24} color="#7A7A7A" />
          </TouchableOpacity>

          {selectedAsset && (
            <View style={styles.formSection}>
              <Text style={styles.inputLabel}>
                {t("recordUsage.usageCounter", "Usage Counter")}
              </Text>
              <TextInput
                style={styles.input}
                value={usageCounter}
                onChangeText={setUsageCounter}
                placeholder={t("recordUsage.enterUsage", "Enter usage value")}
                keyboardType="numeric"
                placeholderTextColor={UI_CONSTANTS.COLORS.TEXT_SECONDARY}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancel}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelButtonText}>
                    {t("common.cancel", "Cancel")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.submitButton,
                    (!selectedAsset || !usageCounter.trim() || submitting) &&
                      styles.buttonDisabled,
                  ]}
                  onPress={handleSubmit}
                  activeOpacity={0.8}
                  disabled={!selectedAsset || !usageCounter.trim() || submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color={UI_CONSTANTS.COLORS.PRIMARY} />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {t("recordUsage.add", "Add")}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>
              {t("recordUsage.historyTitle", "Usage History")}
            </Text>
            <Text style={styles.historyCount}>
              {t("recordUsage.entries", "{{count}} entries", {
                count: usageHistory.length,
              })}
            </Text>
          </View>

          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.tableCellAsset]}>
                {t("recordUsage.assetId", "Asset ID")}
              </Text>
              <Text style={[styles.tableHeaderCell, styles.tableCellUsage]}>
                {t("recordUsage.usageCounter", "Usage Counter")}
              </Text>
              <Text style={[styles.tableHeaderCell, styles.tableCellDate]}>
                {t("recordUsage.date", "Date")}
              </Text>
              <Text
                style={[styles.tableHeaderCell, styles.tableCellRecordedBy]}
              >
                {t("recordUsage.recordedBy", "Recorded By")}
              </Text>
            </View>

            <FlatList
              data={usageHistory}
              keyExtractor={(item) => item.id}
              renderItem={renderUsageRow}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons
                    name="clipboard-text-clock-outline"
                    size={40}
                    color={UI_CONSTANTS.COLORS.TEXT_SECONDARY}
                  />
                  <Text style={styles.emptyTitle}>
                    {t("recordUsage.noEntriesTitle", "No usage recorded yet")}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {t(
                      "recordUsage.noEntriesSubtitle",
                      "Add usage data above to see it listed here.",
                    )}
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showAssetModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAssetModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("recordUsage.searchAsset", "Search Asset")}
              </Text>
              <TouchableOpacity
                onPress={() => setShowAssetModal(false)}
                style={styles.modalCloseButton}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color={UI_CONSTANTS.COLORS.PRIMARY}
                />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalSearchInput}
              value={assetSearch}
              onChangeText={setAssetSearch}
              placeholder={t("recordUsage.searchPlaceholder", "Search by ID or name")}
              placeholderTextColor={UI_CONSTANTS.COLORS.TEXT_SECONDARY}
              autoFocus
            />

            <FlatList
              data={filteredAssets}
              keyExtractor={(item) => item.id}
              renderItem={renderAssetItem}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <View style={styles.assetSeparator} />}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons
                    name="magnify-close"
                    size={40}
                    color={UI_CONSTANTS.COLORS.TEXT_SECONDARY}
                  />
                  <Text style={styles.emptyTitle}>
                    {t("recordUsage.noAssetsFound", "No assets found")}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {t(
                      "recordUsage.noAssetsFoundSubtitle",
                      "Try a different search term.",
                    )}
                  </Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...COMMON_STYLES.container,
    backgroundColor: UI_CONSTANTS.COLORS.BACKGROUND,
  },
  appBar: {
    ...COMMON_STYLES.appBar,
    paddingHorizontal: UI_CONSTANTS.SPACING.LG,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },
  backButton: {
    padding: UI_CONSTANTS.SPACING.SM,
    marginRight: UI_CONSTANTS.SPACING.SM,
  },
  appBarTitle: {
    ...COMMON_STYLES.appBarTitle,
  },
  scrollContent: {
    padding: UI_CONSTANTS.SPACING.LG,
    paddingBottom: UI_CONSTANTS.SPACING.XXL,
  },
  card: {
    ...COMMON_STYLES.card,
    marginBottom: UI_CONSTANTS.SPACING.XL,
  },
  cardTitle: {
    ...COMMON_STYLES.text.subtitle,
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },
  cardHeaderRow: {
    ...COMMON_STYLES.rowSpaceBetween,
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },
  historyCount: {
    ...COMMON_STYLES.text.small,
    color: UI_CONSTANTS.COLORS.PRIMARY,
  },
  dropdownTrigger: {
    ...COMMON_STYLES.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: UI_CONSTANTS.SPACING.MD,
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },
  dropdownLabel: {
    ...COMMON_STYLES.text.small,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dropdownValue: {
    ...COMMON_STYLES.text.primary,
    fontWeight: "700",
  },
  dropdownHint: {
    ...COMMON_STYLES.text.secondary,
    marginTop: 2,
  },
  dropdownPlaceholder: {
    ...COMMON_STYLES.text.secondary,
  },
  formSection: {
    marginTop: UI_CONSTANTS.SPACING.SM,
  },
  inputLabel: {
    ...COMMON_STYLES.text.secondary,
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },
  input: {
    ...COMMON_STYLES.input,
    marginBottom: UI_CONSTANTS.SPACING.LG,
  },
  buttonRow: {
    ...COMMON_STYLES.rowSpaceBetween,
    gap: UI_CONSTANTS.SPACING.MD,
  },
  button: {
    flex: 1,
    ...COMMON_STYLES.button,
  },
  cancelButton: {
    ...COMMON_STYLES.buttonSecondary,
  },
  submitButton: {
    ...COMMON_STYLES.buttonPrimary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    ...COMMON_STYLES.text.primary,
    textAlign: "center",
  },
  submitButtonText: {
    ...COMMON_STYLES.text.primary,
    color: UI_CONSTANTS.COLORS.PRIMARY,
    textAlign: "center",
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
    borderRadius: UI_CONSTANTS.CARD_BORDER_RADIUS,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
    paddingVertical: UI_CONSTANTS.SPACING.SM,
    paddingHorizontal: UI_CONSTANTS.SPACING.MD,
  },
  tableHeaderCell: {
    ...COMMON_STYLES.text.small,
    color: UI_CONSTANTS.COLORS.WHITE,
    fontWeight: "600",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: UI_CONSTANTS.SPACING.SM,
    paddingHorizontal: UI_CONSTANTS.SPACING.MD,
  },
  tableRowEven: {
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
  },
  tableRowOdd: {
    backgroundColor: UI_CONSTANTS.COLORS.GRAY_LIGHT,
  },
  tableCell: {
    ...COMMON_STYLES.text.secondary,
    flex: 1,
    paddingRight: UI_CONSTANTS.SPACING.SM,
  },
  tableCellAsset: {
    flex: 1.2,
  },
  tableCellUsage: {
    flex: 0.8,
  },
  tableCellDate: {
    flex: 1,
  },
  tableCellRecordedBy: {
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: UI_CONSTANTS.SPACING.XL,
    paddingHorizontal: UI_CONSTANTS.SPACING.LG,
  },
  emptyTitle: {
    ...COMMON_STYLES.text.primary,
    textAlign: "center",
    marginTop: UI_CONSTANTS.SPACING.MD,
  },
  emptySubtitle: {
    ...COMMON_STYLES.text.secondary,
    textAlign: "center",
    marginTop: UI_CONSTANTS.SPACING.SM,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    justifyContent: "center",
    padding: UI_CONSTANTS.SPACING.XL,
  },
  modalCard: {
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    borderRadius: UI_CONSTANTS.CARD_BORDER_RADIUS,
    padding: UI_CONSTANTS.SPACING.LG,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  modalHeader: {
    ...COMMON_STYLES.rowSpaceBetween,
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },
  modalTitle: {
    ...COMMON_STYLES.text.subtitle,
  },
  modalCloseButton: {
    padding: UI_CONSTANTS.SPACING.SM,
  },
  modalSearchInput: {
    ...COMMON_STYLES.input,
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },
  assetItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: UI_CONSTANTS.SPACING.MD,
  },
  assetItemContent: {
    flex: 1,
    paddingRight: UI_CONSTANTS.SPACING.MD,
  },
  assetId: {
    ...COMMON_STYLES.text.primary,
    fontWeight: "700",
  },
  assetName: {
    ...COMMON_STYLES.text.secondary,
    marginTop: 2,
  },
  assetSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
  },
});

export default RecordUsageScreen;


