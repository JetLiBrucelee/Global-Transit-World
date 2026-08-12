import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import {
  useTrackShipment,
  useGetMySavedShipments,
  useSaveShipment,
  useUnsaveShipment,
  getGetMySavedShipmentsQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  delivered:        { bg: '#dcfce7', text: '#15803d' },
  in_transit:       { bg: '#dbeafe', text: '#1d4ed8' },
  out_for_delivery: { bg: '#ede9fe', text: '#6d28d9' },
  customs_review:   { bg: '#fef9c3', text: '#a16207' },
  held:             { bg: '#fee2e2', text: '#b91c1c' },
  pending:          { bg: '#f1f5f9', text: '#475569' },
  default:          { bg: '#f1f5f9', text: '#475569' },
};

function statusColor(status: string) {
  return STATUS_COLORS[status] ?? STATUS_COLORS.default;
}

function formatStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  const colors = useColors();
  if (!value) return null;
  return (
    <View style={infoStyles.row}>
      <Text style={[infoStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[infoStyles.value, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { marginBottom: 14 },
  label: { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  value: { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold' },
});

function ProgressBar({ pct }: { pct: number }) {
  const width = useSharedValue(0);
  React.useEffect(() => {
    width.value = withDelay(200, withTiming(pct, { duration: 900 }));
  }, [pct]);
  const animStyle = useAnimatedStyle(() => ({ width: `${width.value}%` as unknown as number }));
  const colors = useColors();

  return (
    <View style={[pbStyles.track, { backgroundColor: colors.muted }]}>
      <Animated.View style={[pbStyles.fill, animStyle, { backgroundColor: colors.secondary }]} />
    </View>
  );
}

const pbStyles = StyleSheet.create({
  track: { height: 8, borderRadius: 4, overflow: 'hidden', width: '100%' },
  fill: { height: '100%', borderRadius: 4 },
});

function SaveButton({ trackingNumber }: { trackingNumber: string }) {
  const colors = useColors();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const { data: saved } = useGetMySavedShipments({
    query: { retry: false, queryKey: getGetMySavedShipmentsQueryKey() },
  });
  const { mutateAsync: save } = useSaveShipment();
  const { mutateAsync: unsave } = useUnsaveShipment();

  const existing = (saved ?? []).find(
    (s) => s.shipment?.trackingNumber === trackingNumber
  );
  const isSaved = !!existing;

  const toggle = async () => {
    setBusy(true);
    try {
      if (existing) {
        await unsave({ savedId: existing.id });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        await save({ data: { shipmentId: trackingNumber } });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      qc.invalidateQueries({ queryKey: ['/api/customers/me/saved-shipments'] });
    } catch {
      Alert.alert(
        'Could not save shipment',
        'Sign in on the Sinovera web portal first, then try again.',
        [{ text: 'OK' }],
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={toggle}
      disabled={busy}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[
        btnStyles.saveBtn,
        isSaved
          ? { backgroundColor: colors.secondary }
          : { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)', borderWidth: 1 },
      ]}
    >
      <Feather
        name={isSaved ? 'bookmark' : 'bookmark'}
        size={15}
        color={isSaved ? '#1a2744' : '#ffffff'}
      />
      <Text style={[btnStyles.saveBtnText, { color: isSaved ? '#1a2744' : '#ffffff' }]}>
        {isSaved ? 'Saved' : 'Save'}
      </Text>
    </TouchableOpacity>
  );
}

const btnStyles = StyleSheet.create({
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  saveBtnText: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold' },
});

export default function TrackDetailScreen() {
  const { trackingNumber } = useLocalSearchParams<{ trackingNumber: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);

  const { data, isLoading, isError } = useTrackShipment(trackingNumber ?? '', {
    query: {
      queryKey: ['track', trackingNumber],
      enabled: !!trackingNumber,
    },
  });

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  if (isLoading) {
    return (
      <View style={[detailStyles.loadingScreen, { backgroundColor: '#1a2744' }]}>
        <View style={[detailStyles.backBtn, { top: topInset + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="chevron-left" size={28} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <ActivityIndicator color="#f5a623" size="large" />
        <Text style={detailStyles.loadingText}>Fetching tracking info…</Text>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={[detailStyles.loadingScreen, { backgroundColor: colors.background }]}>
        <View style={[detailStyles.backBtn, { top: topInset + 8, left: 16 }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="chevron-left" size={28} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={[detailStyles.errorIcon, { backgroundColor: '#fee2e2' }]}>
          <Feather name="package" size={32} color="#b91c1c" />
        </View>
        <Text style={[detailStyles.errorTitle, { color: colors.foreground }]}>Shipment Not Found</Text>
        <Text style={[detailStyles.errorSub, { color: colors.mutedForeground }]}>
          No shipment found for{'\n'}
          <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{trackingNumber}</Text>
          {'\n'}Please check the number and try again.
        </Text>
        <TouchableOpacity style={[detailStyles.retryBtn, { backgroundColor: '#1a2744' }]} onPress={() => router.back()}>
          <Text style={detailStyles.retryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const events = [...(data.trackingEvents ?? [])].sort(
    (a, b) => (b.sortOrder ?? 0) - (a.sortOrder ?? 0)
  );

  const completedStatuses = ['delivered', 'return_delivered'];
  const isDelivered = completedStatuses.includes(data.status);
  const pct =
    isDelivered ? 100 :
    data.status === 'pending' ? 5 :
    data.status === 'picked_up' ? 20 :
    data.status === 'in_transit' ? 55 :
    data.status === 'customs_review' ? 70 :
    data.status === 'out_for_delivery' ? 90 : 40;

  const sc = statusColor(data.status);

  return (
    <View style={[detailStyles.container, { backgroundColor: colors.background }]}>
      {/* Sticky navy header */}
      <View style={[detailStyles.header, { paddingTop: topInset + 8, backgroundColor: '#1a2744' }]}>
        <View style={detailStyles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="chevron-left" size={26} color="#ffffff" />
          </TouchableOpacity>
          <View style={detailStyles.headerCenter}>
            <Text style={detailStyles.trackingLabel}>Tracking</Text>
            <Text style={detailStyles.trackingNum} numberOfLines={1}>{data.trackingNumber}</Text>
          </View>
          <SaveButton trackingNumber={data.trackingNumber} />
        </View>
        <View style={detailStyles.statusRow}>
          <View style={[detailStyles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[detailStyles.statusText, { color: sc.text }]}>
              {data.customStatus ?? formatStatus(data.status)}
            </Text>
          </View>
        </View>
      </View>

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[detailStyles.scrollContent, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hold warning */}
        {data.isHeld && data.activeHold && (
          <View style={[detailStyles.card, detailStyles.holdCard]}>
            <Feather name="alert-triangle" size={20} color="#b91c1c" />
            <View style={{ flex: 1 }}>
              <Text style={detailStyles.holdTitle}>
                Shipment On Hold — {formatStatus(data.activeHold.reason)}
              </Text>
              <Text style={detailStyles.holdMsg}>{data.activeHold.publicMessage}</Text>
              {data.activeHold.expectedResolutionDate && (
                <Text style={detailStyles.holdDate}>
                  Expected resolution: {formatDate(data.activeHold.expectedResolutionDate)}
                </Text>
              )}
              {(data.activeHold.city || data.activeHold.country) && (
                <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                  <Feather name="map-pin" size={11} color="#b91c1c" />
                  <Text style={detailStyles.holdDate}>
                    {[data.activeHold.city, data.activeHold.country].filter(Boolean).join(', ')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Progress */}
        <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={detailStyles.progressHeader}>
            <Text style={[detailStyles.cardTitle, { color: colors.foreground }]}>Delivery Progress</Text>
            <Text style={[detailStyles.pctText, { color: colors.secondary }]}>{pct}%</Text>
          </View>
          <ProgressBar pct={pct} />
          <View style={detailStyles.progressLabels}>
            <Text style={[detailStyles.progressLabel, { color: colors.mutedForeground }]}>Origin</Text>
            <Text style={[detailStyles.progressLabel, { color: colors.mutedForeground }]}>In Transit</Text>
            <Text style={[detailStyles.progressLabel, { color: colors.mutedForeground }]}>Destination</Text>
          </View>
        </View>

        {/* Shipment details */}
        <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={detailStyles.cardTitleRow}>
            <Feather name="package" size={16} color={colors.secondary} />
            <Text style={[detailStyles.cardTitle, { color: colors.foreground }]}>Shipment Details</Text>
          </View>
          <View style={detailStyles.infoGrid}>
            <InfoRow label="Origin" value={`${data.originCity}, ${data.originCountry}`} />
            <InfoRow label="Destination" value={`${data.destinationCity}, ${data.destinationCountry}`} />
            <InfoRow label="Method" value={formatStatus(data.shippingMethod)} />
            {(data.currentCity || data.currentCountry) && (
              <InfoRow label="Current Location" value={[data.currentCity, data.currentCountry].filter(Boolean).join(', ')} />
            )}
            {data.estimatedDelivery && <InfoRow label="Est. Delivery" value={formatDate(data.estimatedDelivery)} />}
            {data.actualDelivery && <InfoRow label="Delivered On" value={formatDate(data.actualDelivery)} />}
            {data.weightKg && <InfoRow label="Weight" value={`${data.weightKg} kg`} />}
            <InfoRow label="Cargo" value={String(data.numberOfPackages)} />
            {data.senderNameMasked && <InfoRow label="Sender" value={data.senderNameMasked} />}
            {data.receiverNameMasked && <InfoRow label="Receiver" value={data.receiverNameMasked} />}
          </View>
        </View>

        {/* Delivered banner */}
        {isDelivered && (
          <View style={[detailStyles.card, detailStyles.deliveredCard]}>
            <Feather name="check-circle" size={24} color="#15803d" />
            <View>
              <Text style={detailStyles.deliveredTitle}>Shipment Delivered!</Text>
              {data.actualDelivery && (
                <Text style={detailStyles.deliveredDate}>
                  {formatDate(data.actualDelivery)}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Tracking timeline */}
        <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={detailStyles.cardTitleRow}>
            <Feather name="clock" size={16} color={colors.secondary} />
            <Text style={[detailStyles.cardTitle, { color: colors.foreground }]}>Tracking History</Text>
          </View>

          {events.length === 0 ? (
            <Text style={[detailStyles.noEvents, { color: colors.mutedForeground }]}>No tracking events yet.</Text>
          ) : (
            <View>
              <View style={[detailStyles.timelineLine, { backgroundColor: colors.border }]} />
              {events.map((event, idx) => {
                const esc = statusColor(event.status);
                return (
                  <View key={event.id} style={detailStyles.timelineRow}>
                    <View style={detailStyles.dotCol}>
                      <View
                        style={[
                          detailStyles.dot,
                          idx === 0
                            ? { backgroundColor: '#f5a623', borderColor: '#f5a623' }
                            : { backgroundColor: colors.card, borderColor: colors.border },
                        ]}
                      />
                    </View>
                    <View style={[detailStyles.eventCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <View style={detailStyles.eventHeader}>
                        <View style={[detailStyles.eventBadge, { backgroundColor: esc.bg }]}>
                          <Text style={[detailStyles.eventBadgeText, { color: esc.text }]}>
                            {event.customStatus ?? formatStatus(event.status)}
                          </Text>
                        </View>
                        <Text style={[detailStyles.eventTime, { color: colors.mutedForeground }]}>
                          {formatDateTime(event.eventTime)}
                        </Text>
                      </View>
                      <Text style={[detailStyles.eventDesc, { color: colors.foreground }]}>
                        {event.description}
                      </Text>
                      {event.location && (
                        <View style={detailStyles.eventLoc}>
                          <Feather name="map-pin" size={11} color={colors.mutedForeground} />
                          <Text style={[detailStyles.eventLocText, { color: colors.mutedForeground }]}>
                            {[event.location, event.city, event.country].filter(Boolean).join(', ')}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  container: { flex: 1 },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  backBtn: { position: 'absolute', left: 16 },
  loadingText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular' },
  errorIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  errorTitle: { fontSize: 22, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 10, textAlign: 'center' },
  errorSub: { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', textAlign: 'center', lineHeight: 21, paddingHorizontal: 32, marginBottom: 24 },
  retryBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  retryBtnText: { color: '#ffffff', fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold' },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  headerCenter: { flex: 1, alignItems: 'center' },
  trackingLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium' },
  trackingNum: { color: '#ffffff', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', fontVariant: ['tabular-nums'] },
  statusRow: { flexDirection: 'row' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' },
  scrollContent: { padding: 14, gap: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  holdCard: { backgroundColor: '#fff1f2', borderColor: '#fca5a5', flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  holdTitle: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: '#b91c1c', marginBottom: 4 },
  holdMsg: { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: '#b91c1c', lineHeight: 19 },
  holdDate: { fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', color: '#b91c1c', marginTop: 4 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  pctText: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold' },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progressLabel: { fontSize: 10, fontFamily: 'PlusJakartaSans_500Medium' },
  cardTitle: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  deliveredCard: { backgroundColor: '#f0fdf4', borderColor: '#86efac', flexDirection: 'row', gap: 12, alignItems: 'center' },
  deliveredTitle: { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: '#15803d' },
  deliveredDate: { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: '#16a34a' },
  noEvents: { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular' },
  timelineLine: { position: 'absolute', left: 9, top: 14, bottom: 14, width: 2 },
  timelineRow: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  dotCol: { alignItems: 'center', paddingTop: 2 },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2 },
  eventCard: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 12 },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  eventBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, flexShrink: 1 },
  eventBadgeText: { fontSize: 10, fontFamily: 'PlusJakartaSans_600SemiBold' },
  eventTime: { fontSize: 10, fontFamily: 'PlusJakartaSans_400Regular', flexShrink: 0, textAlign: 'right' },
  eventDesc: { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', lineHeight: 19 },
  eventLoc: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  eventLocText: { fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular' },
});
