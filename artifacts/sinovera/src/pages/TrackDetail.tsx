import { Helmet } from "react-helmet-async";
import { useRoute, Link } from "wouter";
import { useTrackShipment } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Package, MapPin, Calendar, AlertTriangle, CheckCircle,
  Clock, Truck, ChevronLeft, Globe, Weight, Boxes
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const STATUS_COLORS: Record<string, string> = {
  delivered: "bg-green-100 text-green-800 border-green-200",
  customs_review: "bg-yellow-100 text-yellow-800 border-yellow-200",
  held: "bg-red-100 text-red-800 border-red-200",
  in_transit: "bg-blue-100 text-blue-800 border-blue-200",
  out_for_delivery: "bg-purple-100 text-purple-800 border-purple-200",
  default: "bg-slate-100 text-slate-700 border-slate-200",
};

function statusColor(status: string) {
  return STATUS_COLORS[status] ?? STATUS_COLORS.default;
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="font-semibold text-primary text-sm">{value}</span>
    </div>
  );
}

export default function TrackDetail() {
  const [, params] = useRoute("/track/:trackingNumber");
  const trackingNumber = params?.trackingNumber ?? "";

  const { data, isLoading, isError } = useTrackShipment(trackingNumber, {
    query: { queryKey: ["track", trackingNumber], enabled: !!trackingNumber },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-48 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-2xl text-center">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
          <Package className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-primary mb-3">Shipment Not Found</h1>
        <p className="text-muted-foreground mb-8">
          We couldn't find a shipment with tracking number <strong className="font-mono">{trackingNumber}</strong>. Please check the number and try again.
        </p>
        <Link href="/track"><Button variant="outline"><ChevronLeft className="w-4 h-4 mr-2" /> Back to Tracking</Button></Link>
      </div>
    );
  }

  const events = [...(data.trackingEvents ?? [])].sort(
    (a, b) => (b.sortOrder ?? 0) - (a.sortOrder ?? 0)
  );

  const completedStatuses = ["delivered", "return_delivered"];
  const isDelivered = completedStatuses.includes(data.status);
  const pct = isDelivered ? 100 : data.status === "pending" ? 5 : data.status === "picked_up" ? 20 : data.status === "in_transit" ? 55 : data.status === "customs_review" ? 70 : data.status === "out_for_delivery" ? 90 : 40;

  return (
    <div className="bg-[#f8fafc] min-h-screen">
      <Helmet>
        <title>Tracking {data.trackingNumber} | Sinovera Transit Global</title>
        <meta name="description" content={`Track shipment ${data.trackingNumber} — ${data.originCity ?? ''} to ${data.destinationCity ?? ''}. Current status: ${formatStatus(data.status)}.`} />
        <meta name="robots" content="noindex" />
      </Helmet>
      {/* Header bar */}
      <div className="bg-primary text-white py-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link href="/track" className="inline-flex items-center text-white/60 hover:text-white text-sm mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Tracking
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="text-white/60 text-sm mb-1">Tracking Number</div>
              <h1 className="text-2xl md:text-3xl font-extrabold font-mono tracking-wider">{data.trackingNumber}</h1>
            </div>
            <Badge className={`text-sm font-semibold px-4 py-2 border ${statusColor(data.status)} self-start sm:self-auto`}>
              {data.customStatus ?? formatStatus(data.status)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">

        {/* Hold Warning */}
        {data.isHeld && data.activeHold && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-5 border-red-200 bg-red-50">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-red-800 mb-1">Shipment On Hold — {formatStatus(data.activeHold.reason)}</h3>
                  <p className="text-red-700 text-sm">{data.activeHold.publicMessage}</p>
                  {data.activeHold.expectedResolutionDate && (
                    <p className="text-red-600 text-xs mt-2">
                      Expected resolution: {format(new Date(data.activeHold.expectedResolutionDate), "MMM d, yyyy")}
                    </p>
                  )}
                  {(data.activeHold.city || data.activeHold.country) && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {[data.activeHold.city, data.activeHold.country].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <div className="mt-3">
                    <Link href="/contact">
                      <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">Contact Support</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Progress */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-primary">Delivery Progress</span>
            <span className="text-sm text-muted-foreground">{pct}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-secondary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Origin</span>
            <span>In Transit</span>
            <span>Destination</span>
          </div>
        </Card>

        {/* Shipment Details */}
        <Card className="p-6">
          <h2 className="font-bold text-primary mb-5 flex items-center gap-2">
            <Package className="w-4 h-4 text-secondary" /> Shipment Details
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <InfoRow label="Origin" value={`${data.originCity}, ${data.originCountry}`} />
            <InfoRow label="Destination" value={`${data.destinationCity}, ${data.destinationCountry}`} />
            <InfoRow label="Shipping Method" value={formatStatus(data.shippingMethod)} />
            {data.currentLocation && <InfoRow label="Current Location" value={data.currentLocation} />}
            {(data.currentCity || data.currentCountry) && (
              <InfoRow label="Current City" value={[data.currentCity, data.currentCountry].filter(Boolean).join(", ")} />
            )}
            {data.estimatedDelivery && (
              <InfoRow label="Est. Delivery" value={format(new Date(data.estimatedDelivery), "MMM d, yyyy")} />
            )}
            {data.actualDelivery && (
              <InfoRow label="Delivered On" value={format(new Date(data.actualDelivery), "MMM d, yyyy")} />
            )}
            {data.weightKg && <InfoRow label="Weight" value={`${data.weightKg} kg`} />}
            <InfoRow label="Packages" value={String(data.numberOfPackages)} />
            {data.senderNameMasked && <InfoRow label="Sender" value={data.senderNameMasked} />}
            {data.receiverNameMasked && <InfoRow label="Receiver" value={data.receiverNameMasked} />}
          </div>
        </Card>

        {/* Tracking Timeline */}
        <Card className="p-6">
          <h2 className="font-bold text-primary mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4 text-secondary" /> Tracking History
          </h2>
          {events.length === 0 ? (
            <p className="text-muted-foreground text-sm">No tracking events yet.</p>
          ) : (
            <div className="relative">
              <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-slate-100" />
              <div className="space-y-6">
                {events.map((event, idx) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    className="relative flex gap-5 pl-12"
                  >
                    <div className={`absolute left-2.5 top-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${idx === 0 ? "border-secondary bg-secondary" : "border-slate-300 bg-white"}`}>
                      {idx === 0 && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <div className="font-semibold text-primary text-sm">
                          {event.customStatus ?? formatStatus(event.status)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(event.eventTime), "MMM d, yyyy · h:mm a")}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{event.description}</p>
                      {event.location && (
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {[event.location, event.city, event.country].filter(Boolean).join(", ")}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {isDelivered && (
          <Card className="p-6 bg-green-50 border-green-200 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-bold text-green-800 text-lg">Shipment Delivered!</h3>
            <p className="text-green-700 text-sm mt-1">
              Your shipment has been successfully delivered{data.actualDelivery ? ` on ${format(new Date(data.actualDelivery), "MMMM d, yyyy")}` : ""}.
            </p>
          </Card>
        )}

        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground mb-4">Need assistance with your shipment?</p>
          <div className="flex justify-center gap-4">
            <Link href="/contact"><Button variant="outline">Contact Support</Button></Link>
            <Link href="/quote"><Button className="bg-secondary text-primary hover:bg-secondary/90 font-bold">New Quote</Button></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
