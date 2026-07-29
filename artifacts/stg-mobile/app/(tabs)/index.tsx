import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const RECENT_KEY = 'stg:recent_searches';
const MAX_RECENT = 8;

export default function TrackScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(RECENT_KEY).then((raw) => {
      if (raw) setRecent(JSON.parse(raw));
    });
  }, []);

  const saveRecent = useCallback(async (tn: string) => {
    const next = [tn, ...recent.filter((r) => r !== tn)].slice(0, MAX_RECENT);
    setRecent(next);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
  }, [recent]);

  const handleSearch = useCallback(async (tn: string) => {
    const cleaned = tn.trim().toUpperCase();
    if (!cleaned) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await saveRecent(cleaned);
    Keyboard.dismiss();
    router.push(`/track/${cleaned}`);
  }, [saveRecent, router]);

  const removeRecent = useCallback(async (tn: string) => {
    const next = recent.filter((r) => r !== tn);
    setRecent(next);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
  }, [recent]);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : 0;

  const styles = makeStyles(colors);

  return (
    <View style={[styles.container, { paddingBottom: bottomPad }]}>
      {/* Hero header */}
      <LinearGradient
        colors={['#0f1727', '#1a2744', '#1e3a6e']}
        style={[styles.hero, { paddingTop: topInset + 24 }]}
      >
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Feather name="globe" size={18} color="#f5a623" />
          </View>
          <Text style={styles.logoText}>Sinovera Transit Global</Text>
        </View>
        <Text style={styles.heroTitle}>Track Your{'\n'}Shipment</Text>
        <Text style={styles.heroSub}>
          Enter your tracking number to see real-time updates
        </Text>

        {/* Search bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Feather name="search" size={18} color={colors.mutedForeground} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="e.g. STG-20250101-0001"
              placeholderTextColor={colors.mutedForeground}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="characters"
              returnKeyType="search"
              onSubmitEditing={() => handleSearch(query)}
              testID="input-tracking-number"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.searchBtn, !query.trim() && styles.searchBtnDisabled]}
            onPress={() => handleSearch(query)}
            disabled={!query.trim()}
            testID="button-track"
          >
            <Feather name="arrow-right" size={20} color="#1a2744" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Recent searches */}
      <FlatList
        data={recent}
        keyExtractor={(item) => item}
        scrollEnabled={!!recent.length}
        ListHeaderComponent={
          recent.length > 0 ? (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <TouchableOpacity
                onPress={async () => {
                  setRecent([]);
                  await AsyncStorage.removeItem(RECENT_KEY);
                }}
              >
                <Text style={styles.clearAll}>Clear all</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name="package" size={32} color={colors.mutedForeground} />
            </View>
            <Text style={styles.emptyTitle}>Track any shipment</Text>
            <Text style={styles.emptySub}>
              Enter a tracking number above. Your recent searches will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.recentItem}
            onPress={() => handleSearch(item)}
            activeOpacity={0.7}
          >
            <View style={styles.recentLeft}>
              <Feather name="clock" size={15} color={colors.mutedForeground} />
              <Text style={styles.recentText}>{item}</Text>
            </View>
            <TouchableOpacity
              onPress={() => removeRecent(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof import('@/hooks/useColors').useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    hero: {
      paddingHorizontal: 20,
      paddingBottom: 32,
    },
    logoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 20,
    },
    logoIcon: {
      width: 30,
      height: 30,
      borderRadius: 8,
      backgroundColor: 'rgba(245,166,35,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoText: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 13,
      fontFamily: 'PlusJakartaSans_600SemiBold',
      letterSpacing: 0.3,
    },
    heroTitle: {
      color: '#ffffff',
      fontSize: 34,
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      lineHeight: 40,
      marginBottom: 8,
    },
    heroSub: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: 14,
      fontFamily: 'PlusJakartaSans_400Regular',
      marginBottom: 24,
    },
    searchRow: {
      flexDirection: 'row',
      gap: 10,
    },
    searchBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ffffff',
      borderRadius: 12,
      paddingHorizontal: 14,
      height: 50,
      gap: 10,
    },
    searchIcon: {
      opacity: 0.6,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: '#1a2744',
      fontFamily: 'PlusJakartaSans_500Medium',
    },
    searchBtn: {
      width: 50,
      height: 50,
      borderRadius: 12,
      backgroundColor: '#f5a623',
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchBtnDisabled: {
      opacity: 0.5,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 12,
    },
    sectionTitle: {
      fontSize: 13,
      fontFamily: 'PlusJakartaSans_600SemiBold',
      color: colors.mutedForeground,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    clearAll: {
      fontSize: 13,
      fontFamily: 'PlusJakartaSans_500Medium',
      color: colors.secondary,
    },
    recentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      backgroundColor: colors.card,
    },
    recentLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    recentText: {
      fontSize: 15,
      fontFamily: 'PlusJakartaSans_600SemiBold',
      color: colors.foreground,
      fontVariant: ['tabular-nums'],
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginLeft: 20 + 15 + 12,
    },
    emptyState: {
      paddingTop: 60,
      paddingHorizontal: 40,
      alignItems: 'center',
    },
    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.muted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontFamily: 'PlusJakartaSans_700Bold',
      color: colors.foreground,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySub: {
      fontSize: 14,
      fontFamily: 'PlusJakartaSans_400Regular',
      color: colors.mutedForeground,
      textAlign: 'center',
      lineHeight: 21,
    },
    listContent: {
      flexGrow: 1,
    },
  });
}
