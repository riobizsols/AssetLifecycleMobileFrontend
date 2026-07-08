import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Platform,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_CONFIG, getApiHeaders, API_ENDPOINTS } from '../config/api';
import { authUtils } from '../utils/auth';
import { safeFetch } from '../utils/responseHandler';
import InlineDatePicker from '../components/InlineDatePicker';
import { UI_CONSTANTS, COMMON_STYLES } from '../utils/uiConstants';

const SNOOZE_PRESETS = [
  { label: '5 days', value: 5 },
  { label: '10 days', value: 10 },
  { label: '20 days', value: 20 },
];

const isUnreadExpiryStatus = (status) => {
  const n = String(status || '').toUpperCase();
  return n === 'NEW' || n === 'UNREAD';
};

const formatDisplayDate = (dateString) => {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return String(dateString);
  }
};

const toIsoDateOnly = (d) => {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function AssetExpiryNotificationsScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [actionsForId, setActionsForId] = useState(null);
  const openingNotifyRef = React.useRef({});

  const [snoozeModal, setSnoozeModal] = useState({ visible: false, item: null });
  const [snoozePreset, setSnoozePreset] = useState(5);
  const [snoozeCustom, setSnoozeCustom] = useState('');

  const [extendModal, setExtendModal] = useState({ visible: false, item: null });
  const [extendDate, setExtendDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [extendSaving, setExtendSaving] = useState(false);
  const [scrapSaving, setScrapSaving] = useState(false);

  const mapNotificationToRow = useCallback((n) => ({
    id: n.notifyId || n.id,
    notifyId: n.notifyId,
    assetId: n.assetId,
    workflowType: n.workflowType,
    title: n.title || 'Asset Expiry',
    body: n.body || '',
    alertText:
      n.workflowType === 'ASSET_EXPIRY'
        ? `${n.assetId} — ${n.title || 'Asset Expiry'}`
        : '',
    dueDate: n.dueDate,
    daysUntilCutoff: typeof n.daysUntilCutoff === 'number' ? n.daysUntilCutoff : null,
    notificationStatus: n.notificationStatus,
    assetTypeName: n.assetTypeName || '',
  }), []);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const user = await authUtils.getUserData();
      const empIntId = user?.emp_int_id;
      if (!empIntId) {
        setItems([]);
        setError(t('assetExpiryAlerts.noEmployeeId', 'Employee profile not loaded.'));
        return;
      }

      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.USER_NOTIFICATIONS(empIntId)}`;
      const headers = await getApiHeaders();
      const result = await safeFetch(url, { method: 'GET', headers });

      if (!result.success) {
        setError(result.error || t('common.error', 'Something went wrong'));
        setItems([]);
        return;
      }

      const raw = result.data?.data || result.data || [];
      const list = Array.isArray(raw) ? raw : [];
      const expiryOnly = list
        .filter((x) => x.workflowType === 'ASSET_EXPIRY')
        .map(mapNotificationToRow)
        .sort((a, b) => {
          const da = new Date(a.dueDate || 0).getTime();
          const db = new Date(b.dueDate || 0).getTime();
          return da - db;
        });

      setItems(expiryOnly);
    } catch (e) {
      setError(e.message || t('common.error', 'Error'));
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [mapNotificationToRow, t]);

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load])
  );

  const markOpen = useCallback(async (row) => {
    if (!row.notifyId) return;
    const st = String(row.notificationStatus || '').toUpperCase();
    if (!isUnreadExpiryStatus(st) || openingNotifyRef.current[row.notifyId]) return;

    setItems((prev) =>
      prev.map((x) =>
        x.notifyId === row.notifyId ? { ...x, notificationStatus: 'OPEN' } : x
      )
    );
    openingNotifyRef.current[row.notifyId] = true;

    const headers = await getApiHeaders();
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.EXPIRY_NOTIFICATION_OPEN(row.notifyId)}`;
    const result = await safeFetch(url, { method: 'PUT', headers });

    if (!result.success) {
      setItems((prev) =>
        prev.map((x) =>
          x.notifyId === row.notifyId
            ? { ...x, notificationStatus: row.notificationStatus || 'NEW' }
            : x
        )
      );
    }

    delete openingNotifyRef.current[row.notifyId];
  }, []);

  const onCardPress = (row) => {
    if (row.workflowType === 'ASSET_EXPIRY' && row.notifyId) {
      markOpen(row);
    }
  };

  const removeRow = (notifyId) => {
    setItems((prev) => prev.filter((x) => x.notifyId !== notifyId));
  };

  const handleDiscard = async (row) => {
    setActionsForId(null);
    try {
      const headers = await getApiHeaders();
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.EXPIRY_NOTIFICATION_DISCARD(row.notifyId)}`;
      const result = await safeFetch(url, { method: 'PUT', headers });
      if (!result.success) {
        Toast.show({
          type: 'error',
          text1: t('assetExpiryAlerts.discardFailed', 'Could not resolve alert'),
          text2: result.error || '',
        });
        return;
      }
      removeRow(row.notifyId);
      Toast.show({
        type: 'success',
        text1: t('assetExpiryAlerts.discarded', 'Alert resolved'),
      });
    } catch (e) {
      Toast.show({ type: 'error', text1: e.message });
    }
  };

  const openSnooze = (item) => {
    setActionsForId(null);
    setSnoozePreset(5);
    setSnoozeCustom('');
    setSnoozeModal({ visible: true, item });
  };

  const applySnooze = async () => {
    const row = snoozeModal.item;
    if (!row?.notifyId) {
      setSnoozeModal({ visible: false, item: null });
      return;
    }
    const days =
      snoozePreset === 'custom' ? Number(snoozeCustom) : Number(snoozePreset);
    if (!Number.isFinite(days) || days < 0) {
      Toast.show({
        type: 'error',
        text1: t('assetExpiryAlerts.invalidSnooze', 'Enter a valid number of days'),
      });
      return;
    }
    try {
      const headers = await getApiHeaders();
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.EXPIRY_NOTIFICATION_SNOOZE(row.notifyId)}`;
      const result = await safeFetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ snooze_days: days }),
      });
      if (!result.success) {
        Toast.show({
          type: 'error',
          text1: t('assetExpiryAlerts.snoozeFailed', 'Could not snooze'),
          text2: result.error || '',
        });
        return;
      }
      removeRow(row.notifyId);
      setSnoozeModal({ visible: false, item: null });
      Toast.show({
        type: 'success',
        text1: t('assetExpiryAlerts.snoozed', 'Reminder updated'),
        text2: t('assetExpiryAlerts.snoozedDays', { count: days, defaultValue: `${days} day(s)` }),
      });
    } catch (e) {
      Toast.show({ type: 'error', text1: e.message });
    }
  };

  const openExtend = (item) => {
    setActionsForId(null);
    const base = item.dueDate ? new Date(item.dueDate) : new Date();
    base.setHours(12, 0, 0, 0);
    setExtendDate(base);
    setShowDatePicker(true);
    setExtendModal({ visible: true, item });
  };

  const submitExtend = async () => {
    const row = extendModal.item;
    if (!row?.assetId || !row?.notifyId) return;

    setExtendSaving(true);
    try {
      const iso = toIsoDateOnly(extendDate);
      const headers = await getApiHeaders();
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.UPDATE_ASSET(row.assetId)}`;
      const result = await safeFetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          expiry_date: iso,
          expiry_notify_id: row.notifyId,
        }),
      });
      if (!result.success) {
        Toast.show({
          type: 'error',
          text1: t('assetExpiryAlerts.extendFailed', 'Could not update expiry date'),
          text2: result.error || '',
        });
        return;
      }
      removeRow(row.notifyId);
      setExtendModal({ visible: false, item: null });
      Toast.show({
        type: 'success',
        text1: t('assetExpiryAlerts.extendSuccess', 'Expiry date saved'),
      });
    } catch (e) {
      Toast.show({ type: 'error', text1: e.message });
    } finally {
      setExtendSaving(false);
    }
  };

  const confirmScrap = (item) => {
    setActionsForId(null);
    Alert.alert(
      t('assetExpiryAlerts.scrapTitle', 'Start scrap process'),
      t('assetExpiryAlerts.scrapConfirm', 'Initiate scrap approval for this asset?'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('assetExpiryAlerts.scrap', 'Scrap'),
          style: 'destructive',
          onPress: () => submitScrap(item),
        },
      ]
    );
  };

  const submitScrap = async (row) => {
    if (!row?.assetId) return;
    setScrapSaving(true);
    try {
      const headers = await getApiHeaders();
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.CREATE_SCRAP_REQUEST()}`;
      const result = await safeFetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          asset_id: row.assetId,
          is_scrap_sales: 'N',
          notes: 'Initiated from asset expiry notification (mobile)',
        }),
      });
      if (!result.success) {
        Toast.show({
          type: 'error',
          text1: t('assetExpiryAlerts.scrapFailed', 'Could not start scrap'),
          text2: result.error || result.data?.message || '',
        });
        return;
      }

      if (row.notifyId) {
        await safeFetch(
          `${API_CONFIG.BASE_URL}${API_ENDPOINTS.EXPIRY_NOTIFICATION_DISCARD(row.notifyId)}`,
          { method: 'PUT', headers }
        );
        removeRow(row.notifyId);
      }

      Toast.show({
        type: 'success',
        text1: t('assetExpiryAlerts.scrapSuccess', 'Scrap process started'),
      });
    } catch (e) {
      Toast.show({ type: 'error', text1: e.message });
    } finally {
      setScrapSaving(false);
    }
  };

  const goToAsset = (row) => {
    setActionsForId(null);
    navigation.navigate('Dept_Asset_6', { assetId: row.assetId });
  };

  const renderItem = ({ item }) => {
    const unread = isUnreadExpiryStatus(item.notificationStatus);
    const days = item.daysUntilCutoff;
    const urgent = days !== null && days <= 2;
    const overdue = days !== null && days < 0;

    return (
      <TouchableOpacity
        style={[styles.card, urgent && styles.cardUrgent]}
        activeOpacity={0.85}
        onPress={() => onCardPress(item)}
      >
        <View style={styles.cardTop}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {t('assetExpiryAlerts.badge', 'Asset expiry')}
            </Text>
          </View>
          {days !== null && (
            <View
              style={[
                styles.daysPill,
                overdue && styles.daysOverdue,
                !overdue && urgent && styles.daysUrgent,
              ]}
            >
              <Text style={styles.daysPillText}>
                {overdue
                  ? t('assetExpiryAlerts.overdue', 'Overdue')
                  : t('assetExpiryAlerts.daysLeft', {
                      count: days,
                      defaultValue: `${days}d left`,
                    })}
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.cardTitle, unread && styles.cardTitleUnread]} numberOfLines={2}>
          {item.alertText || item.title}
        </Text>
        {!!item.body && (
          <Text style={styles.cardBody} numberOfLines={3}>
            {item.body}
          </Text>
        )}
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="calendar-month-outline" size={16} color="#5c6b7a" />
          <Text style={styles.metaText}>
            {t('assetExpiryAlerts.expiryEnd', 'Expiry date')}:{' '}
            <Text style={styles.metaBold}>{formatDisplayDate(item.dueDate)}</Text>
          </Text>
        </View>
        {!!item.assetTypeName && (
          <Text style={styles.assetTypeHint} numberOfLines={1}>
            {item.assetTypeName}
          </Text>
        )}

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionsBtn}
            onPress={() =>
              setActionsForId((id) => (id === item.notifyId ? null : item.notifyId))
            }
          >
            <MaterialCommunityIcons name="dots-horizontal-circle-outline" size={22} color={UI_CONSTANTS.COLORS.PRIMARY} />
            <Text style={styles.actionsBtnText}>{t('assetExpiryAlerts.actions', 'Actions')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewAssetBtn} onPress={() => goToAsset(item)}>
            <Text style={styles.viewAssetText}>{t('assetExpiryAlerts.viewAsset', 'View asset')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#FEC200" />
          </TouchableOpacity>
        </View>

        {actionsForId === item.notifyId && (
          <View style={styles.inlineMenu}>
            <TouchableOpacity style={styles.menuRow} onPress={() => handleDiscard(item)}>
              <MaterialCommunityIcons name="close-circle-outline" size={20} color="#555" />
              <Text style={styles.menuRowText}>{t('assetExpiryAlerts.discard', 'Discard')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuRow} onPress={() => openSnooze(item)}>
              <MaterialCommunityIcons name="sleep" size={20} color="#1565C0" />
              <Text style={[styles.menuRowText, { color: '#1565C0' }]}>
                {t('assetExpiryAlerts.remindAgain', 'Remind again')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuRow} onPress={() => openExtend(item)}>
              <MaterialCommunityIcons name="calendar-check" size={20} color="#2E7D32" />
              <Text style={[styles.menuRowText, { color: '#2E7D32' }]}>
                {t('assetExpiryAlerts.extendExpiry', 'Extend expiry')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuRow} onPress={() => confirmScrap(item)} disabled={scrapSaving}>
              <MaterialCommunityIcons name="recycle" size={20} color="#C62828" />
              <Text style={[styles.menuRowText, { color: '#C62828' }]}>
                {t('assetExpiryAlerts.scrap', 'Scrap')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={UI_CONSTANTS.COLORS.PRIMARY} />
      <View style={styles.container}>
        <View style={styles.appBar}>
          <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FEC200" />
          </TouchableOpacity>
          <View style={styles.titleWrap}>
            <Text style={styles.appbarTitle} numberOfLines={1}>
              {t('assetExpiryAlerts.title', 'Asset expiry')}
            </Text>
            <Text style={styles.appbarSubtitle} numberOfLines={1}>
              {t('assetExpiryAlerts.subtitle', 'Discard, snooze, extend, or scrap')}
            </Text>
          </View>
          <View style={{ width: 48 }} />
        </View>

        {loading && !refreshing ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={UI_CONSTANTS.COLORS.PRIMARY} />
            <Text style={styles.loadingText}>{t('common.loading', 'Loading...')}</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it) => String(it.notifyId || it.id)}
            renderItem={renderItem}
            contentContainerStyle={[
              styles.listContent,
              items.length === 0 && styles.listEmpty,
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => load(true)}
                colors={[UI_CONSTANTS.COLORS.PRIMARY]}
                tintColor={UI_CONSTANTS.COLORS.PRIMARY}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons name="calendar-alert" size={72} color="#BDBDBD" />
                <Text style={styles.emptyTitle}>
                  {t('assetExpiryAlerts.emptyTitle', 'No asset expiry alerts')}
                </Text>
                <Text style={styles.emptySub}>
                  {error ||
                    t(
                      'assetExpiryAlerts.emptyBody',
                      'When an asset lifecycle expiry is due within 7 days, it will appear here.'
                    )}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Snooze */}
      <Modal visible={snoozeModal.visible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {t('assetExpiryAlerts.snoozeTitle', 'Remind again in')}
              </Text>
              <View style={styles.snoozeRow}>
                {SNOOZE_PRESETS.map((p) => (
                  <TouchableOpacity
                    key={p.value}
                    style={[
                      styles.snoozeChip,
                      snoozePreset === p.value && styles.snoozeChipActive,
                    ]}
                    onPress={() => setSnoozePreset(p.value)}
                  >
                    <Text
                      style={[
                        styles.snoozeChipText,
                        snoozePreset === p.value && styles.snoozeChipTextActive,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[
                    styles.snoozeChip,
                    snoozePreset === 'custom' && styles.snoozeChipActive,
                  ]}
                  onPress={() => setSnoozePreset('custom')}
                >
                  <Text
                    style={[
                      styles.snoozeChipText,
                      snoozePreset === 'custom' && styles.snoozeChipTextActive,
                    ]}
                  >
                    {t('common.custom', 'Custom')}
                  </Text>
                </TouchableOpacity>
              </View>
              {snoozePreset === 'custom' && (
                <TextInput
                  style={styles.customInput}
                  keyboardType="number-pad"
                  placeholder={t('assetExpiryAlerts.daysPlaceholder', 'Days')}
                  value={snoozeCustom}
                  onChangeText={setSnoozeCustom}
                />
              )}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalBtnSecondary}
                  onPress={() => setSnoozeModal({ visible: false, item: null })}
                >
                  <Text style={styles.modalBtnSecondaryText}>{t('common.cancel', 'Cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalBtnPrimary} onPress={applySnooze}>
                  <Text style={styles.modalBtnPrimaryText}>{t('common.apply', 'Apply')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Extend expiry */}
      <Modal visible={extendModal.visible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {t('assetExpiryAlerts.extendTitle', 'New expiry date')}
            </Text>
            <Text style={styles.modalHint}>
              {t('assetExpiryAlerts.extendHint', 'Pick a date more than 7 days away to clear this alert.')}
            </Text>
            <TouchableOpacity
              style={styles.dateField}
              onPress={() => setShowDatePicker((prev) => !prev)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="calendar" size={22} color={UI_CONSTANTS.COLORS.PRIMARY} />
              <View style={styles.dateFieldText}>
                <Text style={styles.dateInput}>
                  {formatDisplayDate(extendDate.toISOString())}
                </Text>
                <Text style={styles.datePreview}>
                  {showDatePicker
                    ? t('assetExpiryAlerts.hideDatePicker', 'Tap to hide picker')
                    : t('assetExpiryAlerts.tapToPickDate', 'Tap to pick a date')}
                </Text>
              </View>
              <MaterialCommunityIcons
                name={showDatePicker ? 'chevron-up' : 'chevron-down'}
                size={22}
                color={UI_CONSTANTS.COLORS.GRAY_DARK}
              />
            </TouchableOpacity>
            {showDatePicker ? (
              <InlineDatePicker value={extendDate} onChange={setExtendDate} />
            ) : null}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnSecondary}
                onPress={() => setExtendModal({ visible: false, item: null })}
                disabled={extendSaving}
              >
                <Text style={styles.modalBtnSecondaryText}>{t('common.cancel', 'Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnPrimary}
                onPress={submitExtend}
                disabled={extendSaving}
              >
                {extendSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalBtnPrimaryText}>{t('common.save', 'Save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
  },
  container: {
    flex: 1,
    backgroundColor: UI_CONSTANTS.COLORS.BACKGROUND,
  },
  appBar: {
    ...COMMON_STYLES.appBar,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: UI_CONSTANTS.SPACING.SM,
  },
  navButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  appbarTitle: {
    ...COMMON_STYLES.appBarTitle,
    fontSize: UI_CONSTANTS.FONT_SIZES.LG,
  },
  appbarSubtitle: {
    fontSize: UI_CONSTANTS.FONT_SIZES.XS,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    textAlign: 'center',
    paddingHorizontal: UI_CONSTANTS.SPACING.SM,
  },
  listContent: {
    padding: UI_CONSTANTS.SPACING.LG,
    paddingBottom: UI_CONSTANTS.SPACING.XXXL,
  },
  listEmpty: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: UI_CONSTANTS.CARD_BORDER_RADIUS,
    padding: UI_CONSTANTS.SPACING.LG,
    marginBottom: UI_CONSTANTS.SPACING.MD,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB300',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardUrgent: {
    borderLeftColor: UI_CONSTANTS.COLORS.ERROR,
    backgroundColor: '#FFF8F8',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },
  badge: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: UI_CONSTANTS.FONT_SIZES.XS,
    fontWeight: '700',
    color: '#F57F17',
    letterSpacing: 0.3,
  },
  daysPill: {
    backgroundColor: '#ECEFF1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  daysUrgent: {
    backgroundColor: '#FFEBEE',
  },
  daysOverdue: {
    backgroundColor: '#FFCDD2',
  },
  daysPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#37474F',
  },
  cardTitle: {
    fontSize: UI_CONSTANTS.FONT_SIZES.MD,
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
    fontWeight: '600',
    marginBottom: 6,
  },
  cardTitleUnread: {
    fontWeight: '800',
  },
  cardBody: {
    fontSize: UI_CONSTANTS.FONT_SIZES.SM,
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
    lineHeight: 20,
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: UI_CONSTANTS.FONT_SIZES.SM,
    color: '#5c6b7a',
  },
  metaBold: {
    fontWeight: '700',
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
  },
  assetTypeHint: {
    marginTop: 4,
    fontSize: UI_CONSTANTS.FONT_SIZES.XS,
    color: '#90A4AE',
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: UI_CONSTANTS.SPACING.MD,
    paddingTop: UI_CONSTANTS.SPACING.MD,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
  },
  actionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionsBtnText: {
    fontSize: UI_CONSTANTS.FONT_SIZES.SM,
    fontWeight: '600',
    color: UI_CONSTANTS.COLORS.PRIMARY,
  },
  viewAssetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAssetText: {
    fontSize: UI_CONSTANTS.FONT_SIZES.SM,
    fontWeight: '600',
    color: '#FEC200',
  },
  inlineMenu: {
    marginTop: UI_CONSTANTS.SPACING.MD,
    paddingTop: UI_CONSTANTS.SPACING.SM,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EEE',
    gap: 4,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  menuRowText: {
    fontSize: UI_CONSTANTS.FONT_SIZES.MD,
    color: '#333',
    flex: 1,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: UI_CONSTANTS.SPACING.MD,
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: UI_CONSTANTS.SPACING.LG,
  },
  emptyTitle: {
    fontSize: UI_CONSTANTS.FONT_SIZES.LG,
    fontWeight: '700',
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
    marginTop: UI_CONSTANTS.SPACING.MD,
  },
  emptySub: {
    textAlign: 'center',
    marginTop: UI_CONSTANTS.SPACING.SM,
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
    lineHeight: 22,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: UI_CONSTANTS.SPACING.LG,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: UI_CONSTANTS.SPACING.LG,
  },
  vendorCard: {
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: UI_CONSTANTS.FONT_SIZES.LG,
    fontWeight: '700',
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },
  modalHint: {
    fontSize: UI_CONSTANTS.FONT_SIZES.SM,
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
    marginBottom: UI_CONSTANTS.SPACING.MD,
    lineHeight: 20,
  },
  snoozeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },
  snoozeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  snoozeChipActive: {
    backgroundColor: '#E3F2FD',
    borderColor: UI_CONSTANTS.COLORS.PRIMARY,
  },
  snoozeChipText: {
    fontSize: UI_CONSTANTS.FONT_SIZES.SM,
    color: '#555',
  },
  snoozeChipTextActive: {
    color: UI_CONSTANTS.COLORS.PRIMARY,
    fontWeight: '700',
  },
  customInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: UI_CONSTANTS.SPACING.MD,
    fontSize: UI_CONSTANTS.FONT_SIZES.MD,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: UI_CONSTANTS.SPACING.SM,
  },
  modalBtnPrimary: {
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  modalBtnPrimaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: UI_CONSTANTS.FONT_SIZES.MD,
  },
  modalBtnSecondary: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  modalBtnSecondaryText: {
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
    fontWeight: '600',
    fontSize: UI_CONSTANTS.FONT_SIZES.MD,
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },
  dateFieldText: {
    flex: 1,
  },
  dateInput: {
    fontSize: UI_CONSTANTS.FONT_SIZES.MD,
    fontWeight: '600',
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
  },
  datePreview: {
    fontSize: UI_CONSTANTS.FONT_SIZES.SM,
    color: UI_CONSTANTS.COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  vendorList: {
    maxHeight: 320,
  },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  vendorRowSelected: {
    backgroundColor: '#E8EAF6',
  },
  vendorRowText: {
    flex: 1,
    fontSize: UI_CONSTANTS.FONT_SIZES.MD,
    color: '#333',
  },
});
