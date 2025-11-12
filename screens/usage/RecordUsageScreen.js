import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useTranslation } from "react-i18next";
import { UI_CONSTANTS, COMMON_STYLES } from "../../utils/uiConstants";
import { assetUsageService } from "../../services/assetUsageService";

const RecordUsageScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [assets, setAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetsError, setAssetsError] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [usageCounter, setUsageCounter] = useState("");
  const [assetSearch, setAssetSearch] = useState("");
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [usageHistory, setUsageHistory] = useState([]);
  const [usageHistoryLoading, setUsageHistoryLoading] = useState(false);
  const [usageHistoryError, setUsageHistoryError] = useState(null);
  const [usageSubmitError, setUsageSubmitError] = useState(null);
  const [usageSubmitSuccess, setUsageSubmitSuccess] = useState(null);

  const formatDate = useCallback((value) => {
    if (!value) {
      return "--";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toISOString().split("T")[0];
  }, []);

  const loadAssets = useCallback(async () => {
    setAssetsLoading(true);
    setAssetsError(null);

    try {
      const { assets: apiAssets } =
        await assetUsageService.getAssetsForUsageRecording();

      const normalizedAssets = (apiAssets || [])
        .map((asset) => {
          const id =
            asset?.asset_id || asset?.assetId || asset?.id || asset?.asset_code;

          if (!id) {
            return null;
          }

          const nameFromApi =
            asset?.description ||
            asset?.asset_name ||
            asset?.assetName ||
            asset?.name;

          return {
            id,
            name:
              (typeof nameFromApi === "string" && nameFromApi.trim()) ||
              t("assets.unknownAsset", "Unknown Asset"),
            raw: asset,
          };
        })
        .filter(Boolean);

      setAssets(normalizedAssets);
    } catch (error) {
      console.error("Failed to load assets for usage recording:", error);
      setAssets([]);
      setAssetsError(
        error?.message || "Unable to load assets for usage recording.",
      );
    } finally {
      setAssetsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  useEffect(() => {
    if (!selectedAsset) {
      return;
    }

    const stillExists = assets.some((asset) => asset.id === selectedAsset.id);
    if (!stillExists) {
      setSelectedAsset(null);
    }
  }, [assets, selectedAsset]);

  const loadUsageHistory = useCallback(
    async (assetId) => {
      if (!assetId) {
        setUsageHistory([]);
        setUsageHistoryError(null);
        return;
      }

      setUsageHistoryLoading(true);
      setUsageHistoryError(null);
       setUsageHistory([]);

      try {
        const history =
          await assetUsageService.getAssetUsageHistory(assetId);

        const normalizedHistory = (history || [])
          .map((entry) => ({
            id: entry?.aug_id || entry?.id || `${entry?.asset_id}-${entry?.created_on}`,
            assetId: entry?.asset_id || assetId,
            usageCounter:
              typeof entry?.usage_counter === "number"
                ? entry.usage_counter
                : Number(entry?.usage_counter) || 0,
            date: formatDate(
              entry?.created_on || entry?.createdAt || entry?.date,
            ),
            recordedBy:
              entry?.created_by_name ||
              entry?.created_by ||
              t("recordUsage.unknownUser", "Unknown User"),
          }))
          .sort(
            (a, b) =>
              new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
          );

        setUsageHistory(normalizedHistory);
      } catch (error) {
        console.error("Failed to load usage history:", error);
        setUsageHistory([]);
        setUsageHistoryError(
          error?.message || "Unable to load usage history.",
        );
      } finally {
        setUsageHistoryLoading(false);
      }
    },
    [formatDate, t],
  );

  useEffect(() => {
    loadUsageHistory(selectedAsset?.id);
  }, [selectedAsset?.id, loadUsageHistory]);

  const filteredAssets = useMemo(() => {
    if (!assetSearch.trim()) {
      return assets;
    }

    const searchTerm = assetSearch.trim().toLowerCase();
    return assets.filter(
      (asset) =>
        asset.id.toLowerCase().includes(searchTerm) ||
        asset.name.toLowerCase().includes(searchTerm),
    );
  }, [assetSearch, assets]);

  const assetPlaceholder = useMemo(() => {
    if (assetsLoading && assets.length === 0) {
      return t("assets.loadingAssets", "Loading assets...");
    }

    if (assetsError) {
      return t(
        "assets.failedToLoadAssets",
        "Failed to load assets. Tap to retry.",
      );
    }

    if (assets.length === 0) {
      return t("recordUsage.noAssetsAvailable", "No assets available.");
    }

    return t("recordUsage.searchAsset", "Tap to search asset");
  }, [assetsLoading, assetsError, assets.length, t]);

  const displayedHistory = useMemo(() => {
    if (!selectedAsset) {
      return [];
    }

    return usageHistory.filter((entry) => entry.assetId === selectedAsset.id);
  }, [selectedAsset, usageHistory]);

  const handleSelectAsset = (asset) => {
    setSelectedAsset(asset);
    setShowAssetModal(false);
    setUsageCounter("");
    setUsageSubmitError(null);
    setUsageSubmitSuccess(null);
  };

  const handleCancel = () => {
    setSelectedAsset(null);
    setUsageCounter("");
    setUsageHistory([]);
    setUsageHistoryError(null);
    setUsageSubmitError(null);
    setUsageSubmitSuccess(null);
  };

  const handleUsageCounterChange = (value) => {
    const sanitized = value.replace(/[^0-9.]/g, "");
    if (sanitized === usageCounter) {
      return;
    }

    setUsageCounter(sanitized);
    if (usageSubmitError) {
      setUsageSubmitError(null);
    }
    if (usageSubmitSuccess) {
      setUsageSubmitSuccess(null);
    }
  };

  const handleSubmit = () => {
    if (!selectedAsset || !usageCounter.trim()) {
      return;
    }

    const parsedUsage = Number(usageCounter);

    if (!Number.isInteger(parsedUsage) || parsedUsage < 0) {
      setUsageSubmitError(
        t(
          "recordUsage.invalidUsageCounter",
          "Usage must be a non-negative whole number.",
        ),
      );
      return;
    }

    const submitUsage = async () => {
      setSubmitting(true);
      setUsageSubmitError(null);
      setUsageSubmitSuccess(null);

      try {
        await assetUsageService.recordUsage({
          assetId: selectedAsset.id,
          usageCounter: parsedUsage,
        });

        setUsageSubmitSuccess(
          t(
            "recordUsage.submitSuccess",
            "Usage recorded successfully.",
          ),
        );
        setUsageCounter("");
        await loadUsageHistory(selectedAsset.id);
      } catch (error) {
        console.error("Failed to record usage:", error);
        setUsageSubmitError(
          error?.message ||
            t("recordUsage.submitError", "Failed to record usage."),
        );
      } finally {
        setSubmitting(false);
      }
    };

    submitUsage();
  };

  const renderUsageRow = ({ item, index }) => (
    <View
      style={[
        styles.tableRow,
        index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
      ]}
    >
      <View style={[styles.tableCell, styles.tableCellUsageContainer]}>
        <Text style={styles.tableCellUsageValue} numberOfLines={1}>
          {item.usageCounter}
        </Text>
        <Text style={styles.tableCellUsageUnit}>km</Text>
      </View>
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={UI_CONSTANTS.COLORS.PRIMARY}
        translucent={false}
      />

      <View style={styles.root}>
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
          <View style={styles.appBarTitleContainer}>
            <Text style={styles.appBarTitle}>
              {t("recordUsage.title", "Record Asset Usage")}
            </Text>
          </View>
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
                  {assetPlaceholder}
                </Text>
              )}
            </View>
            <Icon name="arrow-drop-down" size={24} color="#7A7A7A" />
          </TouchableOpacity>

          {assetsError && (
            <View style={styles.inlineErrorRow}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={18}
                color={UI_CONSTANTS.COLORS.ERROR}
              />
              <Text style={styles.inlineErrorText}>
                {t(
                  "assets.failedToLoadAssets",
                  "Failed to load assets. Please try again.",
                )}
              </Text>
              <TouchableOpacity onPress={loadAssets}>
                <Text style={styles.retryLinkText}>
                  {t("common.retry", "Retry")}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {selectedAsset && (
            <View style={styles.formSection}>
              <Text style={styles.inputLabel}>
                {t("recordUsage.usageLabel", "Usage (km)")}
              </Text>
              <TextInput
                style={styles.input}
                value={usageCounter}
                onChangeText={handleUsageCounterChange}
                placeholder={t(
                  "recordUsage.enterUsageKm",
                  "Enter usage value (km)",
                )}
                keyboardType={Platform.OS === "ios" ? "decimal-pad" : "decimal-pad"}
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
              {usageSubmitError ? (
                <Text style={styles.feedbackErrorText}>{usageSubmitError}</Text>
              ) : null}
              {usageSubmitSuccess ? (
                <Text style={styles.feedbackSuccessText}>
                  {usageSubmitSuccess}
                </Text>
              ) : null}
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
                count: selectedAsset ? displayedHistory.length : 0,
              })}
            </Text>
          </View>

          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text
                style={[styles.tableHeaderCell, styles.tableHeaderCellUsage]}
              >
                {t("recordUsage.usageLabel", "Usage (km)")}
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
              data={displayedHistory}
              keyExtractor={(item) => item.id}
              renderItem={renderUsageRow}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                usageHistoryLoading ? (
                  <View style={styles.emptyState}>
                    <ActivityIndicator
                      color={UI_CONSTANTS.COLORS.PRIMARY}
                      style={styles.modalActivityIndicator}
                    />
                    <Text style={styles.emptySubtitle}>
                      {t("recordUsage.loadingHistory", "Loading usage history...")}
                    </Text>
                  </View>
                ) : usageHistoryError ? (
                  <View style={styles.emptyState}>
                    <MaterialCommunityIcons
                      name="alert-circle-outline"
                      size={40}
                      color={UI_CONSTANTS.COLORS.ERROR}
                    />
                    <Text style={styles.emptyTitle}>
                      {t(
                        "recordUsage.failedToLoadHistory",
                        "Failed to load usage history.",
                      )}
                    </Text>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={() => loadUsageHistory(selectedAsset?.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.retryButtonText}>
                        {t("common.retry", "Retry")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <MaterialCommunityIcons
                      name={
                        selectedAsset
                        ? "clipboard-text-clock-outline"
                        : "magnify"
                      }
                      size={40}
                      color={UI_CONSTANTS.COLORS.TEXT_SECONDARY}
                    />
                    <Text style={styles.emptyTitle}>
                      {selectedAsset
                        ? t(
                            "recordUsage.noEntriesTitle",
                            "No usage recorded yet",
                          )
                        : t(
                            "recordUsage.selectAssetPrompt",
                            "Select an asset to view usage history.",
                          )}
                    </Text>
                    {selectedAsset && (
                      <Text style={styles.emptySubtitle}>
                        {t(
                          "recordUsage.noEntriesSubtitle",
                          "Add usage data above to see it listed here.",
                        )}
                      </Text>
                    )}
                  </View>
                )
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
                placeholder={t(
                  "recordUsage.searchPlaceholder",
                  "Search by ID or name",
                )}
                placeholderTextColor={UI_CONSTANTS.COLORS.TEXT_SECONDARY}
                autoFocus
              />

              <FlatList
                data={filteredAssets}
                keyExtractor={(item) => item.id}
                renderItem={renderAssetItem}
                keyboardShouldPersistTaps="handled"
                ItemSeparatorComponent={() => (
                  <View style={styles.assetSeparator} />
                )}
                ListEmptyComponent={
                  assetsLoading ? (
                    <View style={styles.emptyState}>
                      <ActivityIndicator
                        color={UI_CONSTANTS.COLORS.PRIMARY}
                        style={styles.modalActivityIndicator}
                      />
                      <Text style={styles.emptySubtitle}>
                        {t("assets.loadingAssets", "Loading assets...")}
                      </Text>
                    </View>
                  ) : assetsError ? (
                    <View style={styles.emptyState}>
                      <MaterialCommunityIcons
                        name="alert-circle-outline"
                        size={40}
                        color={UI_CONSTANTS.COLORS.ERROR}
                      />
                      <Text style={styles.emptyTitle}>
                        {t(
                          "assets.failedToLoadAssets",
                          "Failed to load assets. Please try again.",
                        )}
                      </Text>
                      <TouchableOpacity
                        style={styles.retryButton}
                        onPress={loadAssets}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.retryButtonText}>
                          {t("common.retry", "Retry")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
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
                  )
                }
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
  },
  root: {
    ...COMMON_STYLES.container,
    backgroundColor: UI_CONSTANTS.COLORS.BACKGROUND,
  },
  appBar: {
    ...COMMON_STYLES.appBar,
    paddingHorizontal: 0,
    justifyContent: "flex-start",
    position: "relative",
  },
  backButton: {
    padding: UI_CONSTANTS.SPACING.SM,
    marginLeft: UI_CONSTANTS.SPACING.SM,
    zIndex: 2,
  },
  appBarTitleContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  appBarTitle: {
    ...COMMON_STYLES.appBarTitle,
    textAlign: "center",
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
  inlineErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: UI_CONSTANTS.SPACING.SM,
    gap: UI_CONSTANTS.SPACING.XS,
  },
  inlineErrorText: {
    ...COMMON_STYLES.text.secondary,
    color: UI_CONSTANTS.COLORS.ERROR,
    flex: 1,
  },
  retryLinkText: {
    ...COMMON_STYLES.text.small,
    color: UI_CONSTANTS.COLORS.PRIMARY,
    fontWeight: "600",
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
  feedbackErrorText: {
    ...COMMON_STYLES.text.secondary,
    color: UI_CONSTANTS.COLORS.ERROR,
    marginTop: UI_CONSTANTS.SPACING.SM,
  },
  feedbackSuccessText: {
    ...COMMON_STYLES.text.secondary,
    color: UI_CONSTANTS.COLORS.SUCCESS,
    marginTop: UI_CONSTANTS.SPACING.SM,
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
  tableHeaderCellUsage: {
    flex: 0.8,
    textAlign: "right",
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
  tableCellUsageContainer: {
    flex: 0.8,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "baseline",
  },
  tableCellDate: {
    flex: 1,
    paddingLeft: UI_CONSTANTS.SPACING.SM,
  },
  tableCellRecordedBy: {
    flex: 1.2,
    paddingLeft: UI_CONSTANTS.SPACING.SM,
  },
  tableCellUsageValue: {
    ...COMMON_STYLES.text.secondary,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
  tableCellUsageUnit: {
    ...COMMON_STYLES.text.secondary,
    marginLeft: 4,
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
  modalActivityIndicator: {
    marginBottom: UI_CONSTANTS.SPACING.SM,
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
  retryButton: {
    marginTop: UI_CONSTANTS.SPACING.MD,
    paddingHorizontal: UI_CONSTANTS.SPACING.XL,
    paddingVertical: UI_CONSTANTS.SPACING.SM,
    borderRadius: UI_CONSTANTS.CARD_BORDER_RADIUS,
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
  },
  retryButtonText: {
    color: UI_CONSTANTS.COLORS.WHITE,
    fontWeight: "600",
  },
});

export default RecordUsageScreen;

