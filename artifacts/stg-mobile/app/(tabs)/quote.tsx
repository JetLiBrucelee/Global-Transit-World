import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useCreateQuote } from '@workspace/api-client-react';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';

const SERVICES = [
  { value: 'air_freight',        label: 'Air Freight',        icon: 'wind' as const },
  { value: 'ocean_freight',      label: 'Ocean FCL',          icon: 'anchor' as const },
  { value: 'ocean_freight_lcl',  label: 'Ocean LCL',          icon: 'anchor' as const },
  { value: 'rail_freight',       label: 'Rail',               icon: 'trending-up' as const },
  { value: 'road_freight',       label: 'Road',               icon: 'truck' as const },
  { value: 'customs_clearance',  label: 'Customs',            icon: 'shield' as const },
  { value: 'warehousing',        label: 'Warehousing',        icon: 'package' as const },
];

type FormState = {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  companyName: string;
  originCity: string;
  originCountry: string;
  destinationCity: string;
  destinationCountry: string;
  serviceType: string;
  weightKg: string;
  cargoDescription: string;
  specialRequirements: string;
};

const EMPTY_FORM: FormState = {
  contactName: '', contactEmail: '', contactPhone: '', companyName: '',
  originCity: '', originCountry: '', destinationCity: '', destinationCountry: '',
  serviceType: '', weightKg: '', cargoDescription: '', specialRequirements: '',
};

type Errors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): Errors {
  const e: Errors = {};
  if (!form.contactName.trim())           e.contactName = 'Name is required';
  if (!form.contactEmail.trim())           e.contactEmail = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail))
                                          e.contactEmail = 'Enter a valid email';
  if (!form.originCity.trim())            e.originCity = 'Required';
  if (!form.originCountry.trim())         e.originCountry = 'Required';
  if (!form.destinationCity.trim())       e.destinationCity = 'Required';
  if (!form.destinationCountry.trim())    e.destinationCountry = 'Required';
  if (!form.serviceType)                  e.serviceType = 'Select a service type';
  return e;
}

function FieldInput({
  label, value, onChangeText, placeholder, keyboardType, error, multiline, required,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  error?: string; multiline?: boolean; required?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[fieldStyles.label, { color: colors.mutedForeground }]}>
        {label}{required ? <Text style={{ color: '#ef4444' }}> *</Text> : null}
      </Text>
      <TextInput
        style={[
          fieldStyles.input,
          { borderColor: error ? '#ef4444' : colors.border, backgroundColor: colors.card, color: colors.foreground },
          multiline && { height: 80, textAlignVertical: 'top', paddingTop: 10 },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType ?? 'default'}
        multiline={multiline}
        autoCorrect={false}
      />
      {error ? <Text style={fieldStyles.error}>{error}</Text> : null}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  label: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: 'PlusJakartaSans_400Regular' },
  error: { color: '#ef4444', fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 4 },
});

export default function QuoteScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [refNumber, setRefNumber] = useState('');

  const { mutate: createQuote, isPending } = useCreateQuote();

  const set = (key: keyof FormState) => (val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = () => {
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    createQuote({ data: form }, {
      onSuccess: (result) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setRefNumber(result.referenceNumber ?? 'STG-Q-' + Date.now());
        setSubmitted(true);
      },
      onError: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      },
    });
  };

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  if (submitted) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1a2744', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <View style={[successStyles.card, { backgroundColor: '#ffffff' }]}>
          <View style={successStyles.iconCircle}>
            <Feather name="check-circle" size={36} color="#15803d" />
          </View>
          <Text style={successStyles.title}>Quote Request Sent!</Text>
          <Text style={successStyles.body}>
            Our team will review your requirements and respond within 2 business hours.
          </Text>
          {refNumber ? (
            <View style={[successStyles.refBox, { backgroundColor: colors.muted }]}>
              <Text style={[successStyles.refLabel, { color: colors.mutedForeground }]}>Reference Number</Text>
              <Text style={[successStyles.refNum, { color: '#1a2744' }]}>{refNumber}</Text>
            </View>
          ) : null}
          <TouchableOpacity
            style={successStyles.btn}
            onPress={() => { setSubmitted(false); setForm(EMPTY_FORM); setErrors({}); }}
          >
            <Text style={successStyles.btnText}>Submit Another Request</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 16, backgroundColor: '#1a2744' }]}>
        <Text style={styles.headerTitle}>Request a Quote</Text>
        <Text style={styles.headerSub}>Freight rates within 2 business hours</Text>
      </View>

      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Contact */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="user" size={16} color={colors.secondary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Contact</Text>
          </View>
          <FieldInput label="Full Name" value={form.contactName} onChangeText={set('contactName')} placeholder="John Smith" error={errors.contactName} required />
          <FieldInput label="Email" value={form.contactEmail} onChangeText={set('contactEmail')} placeholder="john@company.com" keyboardType="email-address" error={errors.contactEmail} required />
          <FieldInput label="Phone" value={form.contactPhone} onChangeText={set('contactPhone')} placeholder="+49 123 456 7890" keyboardType="phone-pad" />
          <FieldInput label="Company" value={form.companyName} onChangeText={set('companyName')} placeholder="Acme Corp GmbH" />
        </View>

        {/* Route */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="navigation" size={16} color={colors.secondary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Route</Text>
          </View>
          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <FieldInput label="Origin City" value={form.originCity} onChangeText={set('originCity')} placeholder="Shenzhen" error={errors.originCity} required />
            </View>
            <View style={{ flex: 1 }}>
              <FieldInput label="Origin Country" value={form.originCountry} onChangeText={set('originCountry')} placeholder="China" error={errors.originCountry} required />
            </View>
          </View>
          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <FieldInput label="Dest. City" value={form.destinationCity} onChangeText={set('destinationCity')} placeholder="Frankfurt" error={errors.destinationCity} required />
            </View>
            <View style={{ flex: 1 }}>
              <FieldInput label="Dest. Country" value={form.destinationCountry} onChangeText={set('destinationCountry')} placeholder="Germany" error={errors.destinationCountry} required />
            </View>
          </View>
        </View>

        {/* Service */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="box" size={16} color={colors.secondary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Service Type</Text>
            {errors.serviceType ? <Text style={{ color: '#ef4444', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular' }}>{errors.serviceType}</Text> : null}
          </View>
          <View style={styles.serviceGrid}>
            {SERVICES.map((svc) => {
              const active = form.serviceType === svc.value;
              return (
                <TouchableOpacity
                  key={svc.value}
                  style={[
                    styles.serviceCard,
                    active
                      ? { backgroundColor: '#1a2744', borderColor: '#1a2744' }
                      : { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                  onPress={() => { set('serviceType')(svc.value); Haptics.selectionAsync(); }}
                  activeOpacity={0.75}
                >
                  <Feather name={svc.icon} size={20} color={active ? '#f5a623' : colors.mutedForeground} />
                  <Text style={[styles.serviceLabel, { color: active ? '#ffffff' : colors.foreground }]}>
                    {svc.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Cargo */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="package" size={16} color={colors.secondary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Cargo Details</Text>
          </View>
          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <FieldInput label="Weight (kg)" value={form.weightKg} onChangeText={set('weightKg')} placeholder="500" keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <FieldInput label="Description" value={form.cargoDescription} onChangeText={set('cargoDescription')} placeholder="Electronics" />
            </View>
          </View>
          <FieldInput label="Special Requirements" value={form.specialRequirements} onChangeText={set('specialRequirements')} placeholder="Dangerous goods, temperature control, etc." multiline />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, isPending && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={isPending}
          testID="button-submit-quote"
        >
          {isPending ? (
            <Text style={styles.submitText}>Submitting…</Text>
          ) : (
            <>
              <Feather name="send" size={18} color="#1a2744" />
              <Text style={styles.submitText}>Submit Quote Request</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          We typically respond within 2 business hours.
        </Text>
      </KeyboardAwareScrollViewCompat>
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
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    flex: 1,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceCard: {
    width: '30%',
    minWidth: 90,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  serviceLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    textAlign: 'center',
  },
  submitBtn: {
    backgroundColor: '#f5a623',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
  },
  submitText: {
    color: '#1a2744',
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  disclaimer: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    textAlign: 'center',
    marginTop: 8,
  },
});

const successStyles = StyleSheet.create({
  card: { borderRadius: 20, padding: 28, width: '100%', alignItems: 'center' },
  iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: '#1a2744', marginBottom: 10, textAlign: 'center' },
  body: { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: '#697589', textAlign: 'center', lineHeight: 21, marginBottom: 20 },
  refBox: { width: '100%', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 20 },
  refLabel: { fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium', textTransform: 'uppercase', letterSpacing: 0.5 },
  refNum: { fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', marginTop: 4, fontVariant: ['tabular-nums'] },
  btn: { backgroundColor: '#1a2744', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28 },
  btnText: { color: '#ffffff', fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold' },
});
