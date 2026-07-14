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

const isUnreadWarrantyStatus = (status) => {
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

export default function WarrantyExpiryNotificationsScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const isMountedRef = React.useRef(true);
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

  const [vendorModal, setVendorModal] = useState({ visible: false, item: null });
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorSaving, setVendorSaving] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState(null);

  const mapNotificationToRow = useCallback((n) => ({
    id: n.notifyId || n.id,
    notifyId: n.notifyId,
    assetId: n.assetId,
    workflowType: n.workflowType,
    title: n.title || 'Warranty Expiry',
    body: n.body || '',
    alertText:
      n.workflowType === 'WARRANTY'
        ? `${n.assetId} — ${n.title || 'Warranty Expiry'}`
        : '',
    dueDate: n.dueDate,
    daysUntilCutoff: typeof n.daysUntilCutoff === 'number' ? n.daysUntilCutoff : null,
    notificationStatus: n.notificationStatus,
    canChangeVendor: !!n.canChangeVendor,
    assetTypeName: n.assetTypeName || '',
  }), []);

  const load = useCallback(async (isRefresh = false) => {
    if (!isMountedRef.current) return;
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const user = await authUtils.getUserData();
      if (!isMountedRef.current) return;
      const empIntId = user?.emp_int_id;
      if (!empIntId) {
        setItems([]);
        setError(t('warrantyAlerts.noEmployeeId', 'Employee profile not loaded.'));
        return;
      }

      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.USER_NOTIFICATIONS(empIntId)}`;
      const headers = await getApiHeaders();
      const result = await safeFetch(url, { method: 'GET', headers });
      if (!isMountedRef.current) return;

      if (!result.success) {
        setError(result.error || t('common.error', 'Something went wrong'));
        setItems([]);
        return;
      }

      const raw = result.data?.data || result.data || [];
      const list = Array.isArray(raw) ? raw : [];
      const warrantyOnly = list
        .filter((x) => x.workflowType === 'WARRANTY')
        .map(mapNotificationToRow)
        .sort((a, b) => {
          const da = new Date(a.dueDate || 0).getTime();
          const db = new Date(b.dueDate || 0).getTime();
          return da - db;
        });

      setItems(warrantyOnly);
    } catch (e) {
      if (!isMountedRef.current) return;
      setError(e.message || t('common.error', 'Error'));
      setItems([]);
    } finally {
      if (!isMountedRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }, [mapNotificationToRow, t]);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load])
  );

  const markOpen = useCallback(async (row) => {
    if (!row.notifyId) return;
    const st = String(row.notificationStatus || '').toUpperCase();
    if (!isUnreadWarrantyStatus(st) || openingNotifyRef.current[row.notifyId]) return;

    setItems((prev) =>
      prev.map((x) =>
        x.notifyId === row.notifyId ? { ...x, notificationStatus: 'OPEN' } : x
      )
    );
    openingNotifyRef.current[row.notifyId] = true;

    const headers = await getApiHeaders();
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.WARRANTY_NOTIFICATION_OPEN(row.notifyId)}`;
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
    if (row.workflowType === 'WARRANTY' && row.notifyId) {
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
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.WARRANTY_NOTIFICATION_DISCARD(row.notifyId)}`;
      const result = await safeFetch(url, { method: 'PUT', headers });
      if (!result.success) {
        Toast.show({
          type: 'error',
          text1: t('warrantyAlerts.discardFailed', 'Could not resolve alert'),
          text2: result.error || '',
        });
        return;
      }
      removeRow(row.notifyId);
      Toast.show({
        type: 'success',
        text1: t('warrantyAlerts.discarded', 'Alert resolved'),
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
        text1: t('warrantyAlerts.invalidSnooze', 'Enter a valid number of days'),
      });
      return;
    }
    try {
      const headers = await getApiHeaders();
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.WARRANTY_NOTIFICATION_SNOOZE(row.notifyId)}`;
      const result = await safeFetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ snooze_days: days }),
      });
      if (!result.success) {
        Toast.show({
          type: 'error',
          text1: t('warrantyAlerts.snoozeFailed', 'Could not snooze'),
          text2: result.error || '',
        });
        return;
      }
      removeRow(row.notifyId);
      setSnoozeModal({ visible: false, item: null });
      Toast.show({
        type: 'success',
        text1: t('warrantyAlerts.snoozed', 'Reminder updated'),
        text2: t('warrantyAlerts.snoozedDays', { count: days, defaultValue: `${days} day(s)` }),
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
          warranty_period: iso,
          warranty_notify_id: row.notifyId,
        }),
      });
      if (!result.success) {
        Toast.show({
          type: 'error',
          text1: t('warrantyAlerts.extendFailed', 'Could not update warranty'),
          text2: result.error || '',
        });
        return;
      }
      removeRow(row.notifyId);
      setExtendModal({ visible: false, item: null });
      Toast.show({
        type: 'success',
        text1: t('warrantyAlerts.extendSuccess', 'Warranty date saved'),
      });
    } catch (e) {
      Toast.show({ type: 'error', text1: e.message });
    } finally {
      setExtendSaving(false);
    }
  };

  const openVendorPicker = async (item) => {
    setActionsForId(null);
    setVendorModal({ visible: true, item });
    setSelectedVendorId(null);
    setVendorsLoading(true);
    try {
      const headers = await getApiHeaders();
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_VENDORS()}?serviceOnly=true`;
      const result = await safeFetch(url, { method: 'GET', headers });
      if (!result.success) {
        const fallbackUrl = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_VENDORS()}`;
        const fb = await safeFetch(fallbackUrl, { method: 'GET', headers });
        if (fb.success) {
          const raw = fb.data;
          setVendors(Array.isArray(raw) ? raw : []);
        } else {
          setVendors([]);
          Toast.show({
            type: 'error',
            text1: t('warrantyAlerts.vendorsFailed', 'Could not load vendors'),
          });
        }
      } else {
        const raw = result.data;
        setVendors(Array.isArray(raw) ? raw : []);
      }
    } catch {
      setVendors([]);
    } finally {
      setVendorsLoading(false);
    }
  };

  const submitVendorChange = async () => {
    const row = vendorModal.item;
    if (!row?.assetId || !row?.notifyId || !selectedVendorId) {
      Toast.show({
        type: 'info',
        text1: t('warrantyAlerts.pickVendor', 'Select a vendor'),
      });
      return;
    }
    setVendorSaving(true);
    try {
      const headers = await getApiHeaders();
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.UPDATE_ASSET(row.assetId)}`;
      const result = await safeFetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          service_vendor_id: selectedVendorId,
          warranty_notify_id: row.notifyId,
        }),
      });
      if (!result.success) {
        Toast.show({
          type: 'error',
          text1: t('warrantyAlerts.vendorFailed', 'Could not update vendor'),
          text2: result.error || '',
        });
        return;
      }
      setVendorModal({ visible: false, item: null });
      Toast.show({
        type: 'success',
        text1: t('warrantyAlerts.vendorSuccess', 'Service vendor updated'),
      });
      await load(true);
    } catch (e) {
      Toast.show({ type: 'error', text1: e.message });
    } finally {
      setVendorSaving(false);
    }
  };

  const safeGoBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('Home');
  }, [navigation]);

  const goToAsset = (row) => {
    setActionsForId(null);
    navigation.navigate('Dept_Asset_6', { assetId: row.assetId });
  };

  const renderItem = ({ item }) => {
    const unread = isUnreadWarrantyStatus(item.notificationStatus);
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
              {t('warrantyAlerts.badge', 'Warranty')}
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
                  ? t('warrantyAlerts.overdue', 'Overdue')
                  : t('warrantyAlerts.daysLeft', {
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
            {t('warrantyAlerts.warrantyEnd', 'Warranty end')}:{' '}
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
            <Text style={styles.actionsBtnText}>{t('warrantyAlerts.actions', 'Actions')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewAssetBtn} onPress={() => goToAsset(item)}>
            <Text style={styles.viewAssetText}>{t('warrantyAlerts.viewAsset', 'View asset')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#FEC200" />
          </TouchableOpacity>
        </View>

        {actionsForId === item.notifyId && (
          <View style={styles.inlineMenu}>
            <TouchableOpacity style={styles.menuRow} onPress={() => handleDiscard(item)}>
              <MaterialCommunityIcons name="close-circle-outline" size={20} color="#555" />
              <Text style={styles.menuRowText}>{t('warrantyAlerts.discard', 'Discard')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuRow} onPress={() => openSnooze(item)}>
              <MaterialCommunityIcons name="sleep" size={20} color="#1565C0" />
              <Text style={[styles.menuRowText, { color: '#1565C0' }]}>
                {t('warrantyAlerts.remindAgain', 'Remind again')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuRow} onPress={() => openExtend(item)}>
              <MaterialCommunityIcons name="calendar-check" size={20} color="#2E7D32" />
              <Text style={[styles.menuRowText, { color: '#2E7D32' }]}>
                {t('warrantyAlerts.extendWarranty', 'Extend warranty')}
              </Text>
            </TouchableOpacity>
            {item.canChangeVendor && (
              <TouchableOpacity style={styles.menuRow} onPress={() => openVendorPicker(item)}>
                <MaterialCommunityIcons name="store-outline" size={20} color="#6A1B9A" />
                <Text style={[styles.menuRowText, { color: '#6A1B9A' }]}>
                  {t('warrantyAlerts.changeVendor', 'Change vendor')}
                </Text>
              </TouchableOpacity>
            )}
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
          <TouchableOpacity style={styles.navButton} onPress={safeGoBack}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FEC200" />
          </TouchableOpacity>
          <View style={styles.titleWrap}>
            <Text style={styles.appbarTitle} numberOfLines={1}>
              {t('warrantyAlerts.title', 'Warranty expiry')}
            </Text>
            <Text style={styles.appbarSubtitle} numberOfLines={1}>
              {t('warrantyAlerts.subtitle', 'Resolve or snooze alerts like on the web')}
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
                <MaterialCommunityIcons name="shield-check-outline" size={72} color="#BDBDBD" />
                <Text style={styles.emptyTitle}>
                  {t('warrantyAlerts.emptyTitle', 'No warranty alerts')}
                </Text>
                <Text style={styles.emptySub}>
                  {error ||
                    t(
                      'warrantyAlerts.emptyBody',
                      'When an asset warranty is due soon, it will appear here.'
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
                {t('warrantyAlerts.snoozeTitle', 'Remind again in')}
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
                  placeholder={t('warrantyAlerts.daysPlaceholder', 'Days')}
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

      {/* Extend warranty */}
      <Modal visible={extendModal.visible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {t('warrantyAlerts.extendTitle', 'New warranty end date')}
            </Text>
            <Text style={styles.modalHint}>
              {t('warrantyAlerts.extendHint', 'Pick a date outside the risk window to clear this alert.')}
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
                    ? t('warrantyAlerts.hideDatePicker', 'Tap to hide picker')
                    : t('warrantyAlerts.tapToPickDate', 'Tap to pick a date')}
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

      {/* Vendor */}
      <Modal visible={vendorModal.visible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.vendorCard]}>
            <Text style={styles.modalTitle}>
              {t('warrantyAlerts.vendorTitle', 'Service vendor')}
            </Text>
            {vendorsLoading ? (
              <ActivityIndicator style={{ marginVertical: 24 }} color={UI_CONSTANTS.COLORS.PRIMARY} />
            ) : (
              <ScrollView style={styles.vendorList} keyboardShouldPersistTaps="handled">
                {vendors.map((v) => {
                  const id = v.vendor_id;
                  const label = v.vendor_name || v.company_name || id;
                  const selected = selectedVendorId === id;
                  return (
                    <TouchableOpacity
                      key={String(id)}
                      style={[styles.vendorRow, selected && styles.vendorRowSelected]}
                      onPress={() => setSelectedVendorId(id)}
                    >
                      <MaterialCommunityIcons
                        name={selected ? 'radiobox-marked' : 'radiobox-blank'}
                        size={22}
                        color={selected ? UI_CONSTANTS.COLORS.PRIMARY : '#999'}
                      />
                      <Text style={styles.vendorRowText} numberOfLines={2}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnSecondary}
                onPress={() => setVendorModal({ visible: false, item: null })}
                disabled={vendorSaving}
              >
                <Text style={styles.modalBtnSecondaryText}>{t('common.cancel', 'Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnPrimary}
                onPress={submitVendorChange}
                disabled={vendorSaving}
              >
                {vendorSaving ? (
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
