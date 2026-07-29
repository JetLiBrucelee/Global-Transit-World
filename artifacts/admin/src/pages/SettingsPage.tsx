import { useState } from 'react';
import {
  useListCmsContent, useUpsertCmsSection,
  getListCmsContentQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Save, Building2, Bell, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

// Each setting is stored as CmsContent: { section, key, value }
const COMPANY_FIELDS: { section: string; key: string; label: string; multiline?: boolean }[] = [
  { section: 'company', key: 'name', label: 'Company Name' },
  { section: 'company', key: 'tagline', label: 'Tagline' },
  { section: 'company', key: 'email', label: 'Email' },
  { section: 'company', key: 'phone', label: 'Phone' },
  { section: 'company', key: 'address', label: 'Address', multiline: true },
  { section: 'company', key: 'website', label: 'Website' },
  { section: 'social', key: 'facebook', label: 'Facebook URL' },
  { section: 'social', key: 'linkedin', label: 'LinkedIn URL' },
  { section: 'social', key: 'twitter', label: 'Twitter/X URL' },
  { section: 'social', key: 'instagram', label: 'Instagram URL' },
  { section: 'footer', key: 'copyright', label: 'Footer Copyright Text' },
  { section: 'footer', key: 'tagline', label: 'Footer Tagline' },
];

const NOTIF_FIELDS: { section: string; key: string; label: string; placeholder: string }[] = [
  { section: 'notifications', key: 'shipment_created', label: 'Shipment Created', placeholder: 'Your shipment {trackingNumber} has been created.' },
  { section: 'notifications', key: 'in_transit', label: 'In Transit', placeholder: 'Your shipment {trackingNumber} is now in transit.' },
  { section: 'notifications', key: 'out_for_delivery', label: 'Out for Delivery', placeholder: 'Your shipment {trackingNumber} is out for delivery today.' },
  { section: 'notifications', key: 'delivered', label: 'Delivered', placeholder: 'Your shipment {trackingNumber} has been delivered.' },
  { section: 'notifications', key: 'delayed', label: 'Delayed', placeholder: 'Your shipment {trackingNumber} has been delayed. We apologize.' },
  { section: 'notifications', key: 'hold_placed', label: 'Hold Placed', placeholder: 'Your shipment {trackingNumber} is on hold: {holdReason}.' },
  { section: 'notifications', key: 'customs_review', label: 'Customs Review', placeholder: 'Your shipment {trackingNumber} is under customs review.' },
];

const PREF_FIELDS: { section: string; key: string; label: string; placeholder: string }[] = [
  { section: 'preferences', key: 'tracking_prefix', label: 'Tracking Number Prefix', placeholder: 'STG' },
  { section: 'preferences', key: 'default_currency', label: 'Default Currency', placeholder: 'USD' },
  { section: 'preferences', key: 'timezone', label: 'Timezone', placeholder: 'UTC' },
  { section: 'preferences', key: 'items_per_page', label: 'Items Per Page (default)', placeholder: '20' },
];

export default function SettingsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'company' | 'notifications' | 'system'>('company');
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const { data: cmsData, isLoading } = useListCmsContent();
  const upsert = useUpsertCmsSection();

  // cmsData is CmsContent[] — each has { section, key, value }
  const rows: any[] = Array.isArray(cmsData) ? cmsData : [];

  function cmsKey(section: string, key: string) { return `${section}::${key}`; }
  function getCmsValue(section: string, key: string): string {
    const k = cmsKey(section, key);
    if (localValues[k] !== undefined) return localValues[k];
    const row = rows.find((r: any) => r.section === section && r.key === key);
    return row?.value ?? '';
  }
  function setLocalValue(section: string, key: string, val: string) {
    setLocalValues(prev => ({ ...prev, [cmsKey(section, key)]: val }));
  }

  function saveField(section: string, key: string) {
    const value = getCmsValue(section, key);
    const k = cmsKey(section, key);
    setSaving(s => ({ ...s, [k]: true }));
    upsert.mutate({ section, data: { items: [{ key, value, isPublished: true }] } }, {
      onSuccess: () => { toast({ title: 'Saved' }); qc.invalidateQueries({ queryKey: getListCmsContentQueryKey() }); },
      onError: () => toast({ title: 'Save failed', variant: 'destructive' }),
      onSettled: () => setSaving(s => ({ ...s, [k]: false })),
    });
  }

  function saveAll(fields: { section: string; key: string }[]) {
    // Group by section for efficient batching
    const groups: Record<string, { key: string; value: string }[]> = {};
    fields.forEach(({ section, key }) => {
      if (!groups[section]) groups[section] = [];
      groups[section].push({ key, value: getCmsValue(section, key) });
    });
    let saved = 0;
    const total = Object.keys(groups).length;
    Object.entries(groups).forEach(([section, items]) => {
      upsert.mutate({ section, data: { items: items.map(i => ({ ...i, isPublished: true })) } }, {
        onSuccess: () => {
          saved++;
          if (saved === total) {
            qc.invalidateQueries({ queryKey: getListCmsContentQueryKey() });
            toast({ title: 'All settings saved' });
          }
        },
        onError: () => toast({ title: 'Save failed for some fields', variant: 'destructive' }),
      });
    });
  }

  const tabs = [
    { id: 'company', label: 'Company Profile', icon: Building2 },
    { id: 'notifications', label: 'Notification Templates', icon: Bell },
    { id: 'system', label: 'System Preferences', icon: SettingsIcon },
  ] as const;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage company profile, notification templates, and system preferences.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : (
        <>
          {activeTab === 'company' && (
            <div className="bg-card rounded-xl border border-border p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-sm">Company Information</h2>
                <Button size="sm" onClick={() => saveAll(COMPANY_FIELDS)}>
                  <Save size={13} className="mr-1" />Save All
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {COMPANY_FIELDS.map(({ section, key, label, multiline }) => (
                  <div key={cmsKey(section, key)}>
                    <Label className="text-xs">{label}</Label>
                    {multiline ? (
                      <Textarea
                        className="text-sm mt-1"
                        rows={2}
                        value={getCmsValue(section, key)}
                        onChange={e => setLocalValue(section, key, e.target.value)}
                        onBlur={() => saveField(section, key)}
                      />
                    ) : (
                      <Input
                        className="h-8 text-sm mt-1"
                        value={getCmsValue(section, key)}
                        onChange={e => setLocalValue(section, key, e.target.value)}
                        onBlur={() => saveField(section, key)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-card rounded-xl border border-border p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-sm">Notification Templates</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Use {'{trackingNumber}'}, {'{holdReason}'}, {'{customerName}'} as placeholders.</p>
                </div>
                <Button size="sm" onClick={() => saveAll(NOTIF_FIELDS)}>
                  <Save size={13} className="mr-1" />Save All
                </Button>
              </div>
              <div className="space-y-5">
                {NOTIF_FIELDS.map(({ section, key, label, placeholder }) => (
                  <div key={cmsKey(section, key)}>
                    <Label className="text-xs">{label}</Label>
                    <div className="flex gap-2 mt-1">
                      <Textarea
                        className="text-sm flex-1"
                        rows={2}
                        placeholder={placeholder}
                        value={getCmsValue(section, key)}
                        onChange={e => setLocalValue(section, key, e.target.value)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="self-start"
                        onClick={() => saveField(section, key)}
                        disabled={saving[cmsKey(section, key)]}
                      >
                        <Save size={12} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="bg-card rounded-xl border border-border p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-sm">System Preferences</h2>
                <Button size="sm" onClick={() => saveAll(PREF_FIELDS)}>
                  <Save size={13} className="mr-1" />Save All
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {PREF_FIELDS.map(({ section, key, label, placeholder }) => (
                  <div key={cmsKey(section, key)}>
                    <Label className="text-xs">{label}</Label>
                    <Input
                      className="h-8 text-sm mt-1"
                      placeholder={placeholder}
                      value={getCmsValue(section, key)}
                      onChange={e => setLocalValue(section, key, e.target.value)}
                      onBlur={() => saveField(section, key)}
                    />
                  </div>
                ))}
              </div>
              <div className="rounded-lg bg-muted/40 border border-border p-4 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">About System Preferences</p>
                <p>These settings are stored in the CMS content table and apply globally across the platform. Changes take effect immediately on next save.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
