import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { CheckCircle, HelpCircle, MessageSquare, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PortalLayout } from "./PortalLayout";
import { useGetMySavedShipments, useCreateQuote } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const SUBJECTS = [
  "Shipment delayed",
  "Customs clearance issue",
  "Missing or damaged item",
  "Invoice query",
  "Tracking not updating",
  "General enquiry",
  "Other",
];

export default function PortalSupport() {
  const { user } = useUser();
  const [location] = useLocation();
  const qc = useQueryClient();
  const { mutateAsync: submitQuote, isPending } = useCreateQuote();

  const { data: savedShipments } = useGetMySavedShipments();

  // Pre-fill tracking number if passed as a query param
  const params = new URLSearchParams(location.split("?")[1] ?? "");
  const prefillTracking = params.get("ref") ?? "";

  const [trackingNumber, setTrackingNumber] = useState(prefillTracking);
  const [subject, setSubject] = useState(SUBJECTS[6]);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";
  const firstName = user?.firstName ?? "";
  const lastName = user?.lastName ?? "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    try {
      // Use the quote endpoint as a support request channel —
      // the subject/message go in specialRequirements and cargoDescription.
      await submitQuote({
        data: {
          contactName: `${firstName} ${lastName}`.trim() || "Customer",
          contactEmail: email,
          originCity: "N/A",
          originCountry: "N/A",
          destinationCity: "N/A",
          destinationCountry: "N/A",
          serviceType: "support",
          specialRequirements: `[SUPPORT REQUEST] Subject: ${subject}${trackingNumber ? ` | Tracking: ${trackingNumber}` : ""}\n\n${message}`,
        }
      });
      setSent(true);
    } catch (err) {
      setSubmitError("Failed to send your message. Please try again or contact us directly at support@sinoveratransit.com.");
    }
  }

  if (sent) {
    return (
      <PortalLayout title="Contact Support">
        <Card className="p-12 text-center max-w-lg mx-auto">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-primary mb-2">Message Sent!</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Our support team will respond to <strong>{email}</strong> within 2 business hours.
          </p>
          <Button variant="outline" onClick={() => setSent(false)}>
            Send Another Message
          </Button>
        </Card>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="Contact Support">
      <Helmet>
        <title>Contact Support | Sinovera Transit Global</title>
        <meta name="description" content="Submit a support request to the Sinovera Transit Global team for help with your shipments or account." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="p-6">
            <h2 className="font-bold text-primary flex items-center gap-2 mb-5">
              <MessageSquare className="w-4 h-4 text-secondary" /> Send a Message
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Pre-populated from Clerk */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Your Name</Label>
                  <Input
                    value={`${firstName} ${lastName}`.trim() || "Customer"}
                    disabled
                    className="mt-1 bg-muted/50"
                  />
                </div>
                <div>
                  <Label>Your Email</Label>
                  <Input
                    value={email}
                    disabled
                    className="mt-1 bg-muted/50"
                  />
                </div>
              </div>

              {/* Shipment reference */}
              <div>
                <Label htmlFor="trackingNumber">Tracking Number (optional)</Label>
                <div className="relative mt-1">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="trackingNumber"
                    value={trackingNumber}
                    onChange={e => setTrackingNumber(e.target.value)}
                    placeholder="e.g. STG-20260001"
                    className="pl-9"
                    list="saved-tracking-numbers"
                  />
                  <datalist id="saved-tracking-numbers">
                    {(savedShipments ?? []).map(s => (
                      s.shipment?.trackingNumber && (
                        <option key={s.id} value={s.shipment.trackingNumber} />
                      )
                    ))}
                  </datalist>
                </div>
                {(savedShipments ?? []).length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Your saved shipments are suggested above.
                  </p>
                )}
              </div>

              {/* Subject */}
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Message */}
              <div>
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  required
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Please describe your issue in detail…"
                  className="mt-1 min-h-[140px]"
                />
              </div>

              {submitError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {submitError}
                </p>
              )}
              <Button
                type="submit"
                disabled={isPending || !message.trim()}
                className="w-full bg-secondary text-primary font-bold hover:bg-secondary/90"
              >
                {isPending ? "Sending…" : "Send Message"}
              </Button>
            </form>
          </Card>
        </div>

        {/* Info panel */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-bold text-primary flex items-center gap-2 mb-3">
              <HelpCircle className="w-4 h-4 text-secondary" /> Support Info
            </h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>📧 <strong className="text-foreground">Email:</strong> support@sinoveratransit.com</p>
              <p>📞 <strong className="text-foreground">Phone:</strong> +86 400 123 4567</p>
              <p>🕐 <strong className="text-foreground">Hours:</strong> 24/7 operations support</p>
            </div>
          </Card>

          {(savedShipments ?? []).length > 0 && (
            <Card className="p-5">
              <h3 className="font-bold text-primary text-sm mb-3">My Saved Shipments</h3>
              <div className="space-y-2">
                {(savedShipments ?? []).slice(0, 5).map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setTrackingNumber(s.shipment?.trackingNumber ?? "")}
                    className="w-full text-left text-xs font-mono text-secondary hover:underline truncate block"
                  >
                    {s.shipment?.trackingNumber}
                    {s.nickname && <span className="text-muted-foreground font-sans ml-1">— {s.nickname}</span>}
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
