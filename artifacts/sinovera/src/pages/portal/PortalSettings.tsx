import { useState, useEffect } from "react";
import { useUser, useClerk, useAuth } from "@clerk/react";
import { CheckCircle, User, Bell, Lock, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalLayout } from "./PortalLayout";
import {
  useGetMyCustomerProfile,
  useUpdateMyCustomerProfile,
  getGetMyCustomerProfileQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function PortalSettings() {
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const qc = useQueryClient();

  const { getToken } = useAuth();
  const { data: profile, isLoading, isError, error } = useGetMyCustomerProfile({
    query: { retry: false, queryKey: getGetMyCustomerProfileQueryKey() }
  });
  const { mutateAsync: updateProfile, isPending: saving } = useUpdateMyCustomerProfile();
  const [creating, setCreating] = useState(false);

  async function createProfile(body: Record<string, unknown>) {
    setCreating(true);
    try {
      const token = await getToken();
      const resp = await fetch("/api/customers/me", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error(await resp.text());
      return resp.json();
    } finally {
      setCreating(false);
    }
  }

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [saved, setSaved] = useState(false);

  const needs404Provision = isError && (error as { status?: number })?.status === 404;

  // Populate from profile when loaded
  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName ?? "");
      setLastName(profile.lastName ?? "");
      setPhone(profile.phone ?? "");
      setCountry(profile.country ?? "");
      setNotifyEmail(profile.notifyEmail ?? true);
    } else if (needs404Provision && user) {
      // Pre-fill from Clerk
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
    }
  }, [profile, needs404Provision, user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (needs404Provision) {
        // Create the customer profile via self-registration endpoint
        await createProfile({
          email: user?.emailAddresses?.[0]?.emailAddress ?? "",
          firstName,
          lastName,
          phone: phone || undefined,
          country: country || undefined,
        });
      } else {
        await updateProfile({
          data: { firstName, lastName, phone: phone || undefined, country: country || undefined, notifyEmail }
        });
      }
      qc.invalidateQueries({ queryKey: ["/api/customers/me"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // handled by error state
    }
  }

  return (
    <PortalLayout title="Profile & Settings">
      <div className="space-y-6 max-w-2xl">

        {/* Profile form */}
        <Card className="p-6">
          <h2 className="font-bold text-primary flex items-center gap-2 mb-5">
            <User className="w-4 h-4 text-secondary" /> Personal Information
          </h2>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.emailAddresses?.[0]?.emailAddress ?? ""}
                  disabled
                  className="mt-1 bg-muted/50 cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email is managed by your account.{" "}
                  <button type="button" onClick={() => openUserProfile()} className="text-secondary hover:underline font-medium">
                    Change in account settings
                  </button>
                </p>
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+1 555 000 0000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  placeholder="e.g. China, United States"
                  className="mt-1"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="submit"
                  disabled={saving || creating}
                  className="bg-primary text-white hover:bg-primary/90 font-bold"
                >
                  {saving || creating ? "Saving…" : "Save Changes"}
                </Button>
                {saved && (
                  <span className="text-sm text-green-600 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Saved!
                  </span>
                )}
              </div>
            </form>
          )}
        </Card>

        {/* Notification preferences */}
        <Card className="p-6">
          <h2 className="font-bold text-primary flex items-center gap-2 mb-5">
            <Bell className="w-4 h-4 text-secondary" /> Notification Preferences
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Email notifications</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Receive shipment status updates via email
                </p>
              </div>
              <Switch
                checked={notifyEmail}
                onCheckedChange={async (checked) => {
                  setNotifyEmail(checked);
                  if (profile) {
                    await updateProfile({ data: { notifyEmail: checked } });
                    qc.invalidateQueries({ queryKey: ["/api/customers/me"] });
                  }
                }}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between opacity-50">
              <div>
                <p className="font-medium text-sm">SMS notifications</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Coming soon — SMS alerts for your shipments
                </p>
              </div>
              <Switch checked={false} disabled />
            </div>
            <div className="flex items-center justify-between opacity-50">
              <div>
                <p className="font-medium text-sm">WhatsApp notifications</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Coming soon — WhatsApp updates
                </p>
              </div>
              <Switch checked={false} disabled />
            </div>
          </div>
        </Card>

        {/* Password / account security */}
        <Card className="p-6">
          <h2 className="font-bold text-primary flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-secondary" /> Account Security
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Manage your password and linked social accounts via your Clerk account settings.
          </p>
          <Button
            variant="outline"
            onClick={() => openUserProfile()}
            className="gap-2"
          >
            <AlertCircle className="w-4 h-4" /> Open Account Settings
          </Button>
        </Card>
      </div>
    </PortalLayout>
  );
}
