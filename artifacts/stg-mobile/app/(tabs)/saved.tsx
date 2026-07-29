import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetMySavedShipments,
  useUnsaveShipment,
  getGetMySavedShipmentsQueryKey,
  type SavedShipment,
} from '@workspace/api-client-react';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  delivered:         { bg: '#dcfce7', text: '#15803d' },
  in_transit:        { bg: '#dbeafe', text: '#1d4ed8' },
  out_for_delivery:  { bg: '#ede9fe', text: '#6d28d9' },
  customs_review:    { bg: '#fef9c3', text: '#a16207' },
  held:              { bg: '#fee2e2', text: '#b91c1c' },
  pending:           { bg: '#f1f5f9', text: '#475569' },
  default:           { bg: '#f1f5f9', text: '#475569' },
};

function statusColor(status: string) {
  return STATUS_COLORS[status] ?? STATUS_COLORS.default;
}

function formatStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function ShipmentCard({ item, onPress, onUnsave }: {
  item: SavedShipment;
  onPress: () => void;
  onUnsave: () => void;
}) {
  const colors = useColors();
  const s = item.shipment;
  const sc = statusColor(s?.status ?? 'default');

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <Text style={[styles.trackingNum, { color: colors.foreground }]}>
            {s?.trackingNumber ?? '—'}
          </Text>
          {item.nickname ? (
            <Text style={[styles.nickname, { color: colors.secondary }]}>{item.nickname}</Text>
          ) : null}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusText, { color: sc.text }]}>
            {s?.customStatus ?? formatStatus(s?.status ?? 'unknown')}
          </Text>
        </View>
      </View>

      {s && (
        <View style={styles.routeRow}>
          <Feather name="map-pin" size={12} color={colors.mutedForeground} />
          <Text style={[styles.routeText, { color: colors.mutedForeground }]}>
            {s.originCity}, {s.originCountry}
          </Text>
          <Feather name="arrow-right" size={12} color={colors.mutedForeground} />
          <Text style={[styles.routeText, { color: colors.mutedForeground }]}>
            {s.destinationCity}, {s.destinationCountry}
          </Text>
        </View>
      )}

      <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
        <Text style={[styles.savedDate, { color: colors.mutedForeground }]}>
          Saved {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={onUnsave} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="bookmark" size={16} color={colors.secondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function SavedScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const { data, isLoading, isError, error, refetch, isFetching } = useGetMySavedShipments({
    query: {
      retry: false,
      queryKey: getGetMySavedShipmentsQueryKey(),
    },
  });

  const { mutateAsync: unsave } = useUnsaveShipment();

  const handleUnsave = useCallback(async (savedId: string, trackingNumber: string) => {
    Alert.alert(
      'Remove Saved Shipment',
      `Remove ${trackingNumber} from your saved shipments?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await unsave({ savedId });
            qc.invalidateQueries({ queryKey: ['/api/customers/me/saved-shipments'] });
          },
        },
      ],
    );
  }, [unsave, qc]);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : 0;

  const isAuthError =
    isError && (error as { status?: number })?.status === 401;

  return (
    <View style={[{ flex: 1, backgroundColor: colors.background, paddingBottom: bottomPad }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#1a2744', paddingTop: topInset + 16 }]}>
        <Text style={styles.headerTitle}>Saved Shipments</Text>
        <Text style={styles.headerSub}>Your bookmarked tracking numbers</Text>
      </View>

      {isAuthError ? (
        <View style={styles.centerState}>
          <View style={[styles.stateIcon, { backgroundColor: colors.muted }]}>
            <Feather name="lock" size={28} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.stateTitle, { color: colors.foreground }]}>Sign in to see saved shipments</Text>
          <Text style={[styles.stateSub, { color: colors.mutedForeground }]}>
            Visit the Sinovera portal on the web to sign in, then your saved shipments will appear here.
          </Text>
        </View>
      ) : isLoading ? (
        <View style={styles.centerState}>
          <View style={[styles.stateIcon, { backgroundColor: colors.muted }]}>
            <Feather name="loader" size={28} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.stateTitle, { color: colors.foreground }]}>Loading…</Text>
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          scrollEnabled={!!(data && data.length > 0)}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={colors.secondary}
            />
          }
          renderItem={({ item }) => (
            <ShipmentCard
              item={item}
              onPress={() => {
                if (item.shipment?.trackingNumber) {
                  router.push(`/track/${item.shipment.trackingNumber}`);
                }
              }}
              onUnsave={() =>
                handleUnsave(item.id, item.shipment?.trackingNumber ?? item.id)
              }
            />
          )}
          ListEmptyComponent={
            <View style={styles.centerState}>
              <View style={[styles.stateIcon, { backgroundColor: colors.muted }]}>
                <Feather name="bookmark" size={28} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.stateTitle, { color: colors.foreground }]}>No saved shipments</Text>
              <Text style={[styles.stateSub, { color: colors.mutedForeground }]}>
                Track a shipment and tap "Save" to keep it here for quick access.
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    marginBottom: 4,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  listContent: {
    padding: 16,
    gap: 12,
    flexGrow: 1,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 10,
  },
  cardLeft: {
    flex: 1,
    gap: 2,
  },
  trackingNum: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontVariant: ['tabular-nums'],
  },
  nickname: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  routeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  savedDate: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  stateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stateTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  stateSub: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    textAlign: 'center',
    lineHeight: 21,
  },
});
