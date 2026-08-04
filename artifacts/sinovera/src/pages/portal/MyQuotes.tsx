import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import {
  FileText, ExternalLink, ChevronRight, Clock, CheckCircle2,
  XCircle, Search, RefreshCw, AlertCircle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalLayout } from "./PortalLayout";
import { useUser } from "@clerk/react";

interface QuoteRecord {
  id: string;
  referenceNumber: string;
  status: string;
  serviceType: string;
  originCity: string;
  originCountry: string;
  destinationCity: string;
  destinationCountry: string;
  quotedPrice: string | null;
  currency: string;
  trackingNumber: string | null;
  shipmentId: string | null;
  adminNotes: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: React.ElementType }> = {
  pending:  { color: "bg-amber-100 text-amber-800 border-amber-200",  label: "Pending Review",   icon: Clock },
  reviewed: { color: "bg-blue-100 text-blue-800 border-blue-200",     label: "Under Review",     icon: RefreshCw },
  quoted:   { color: "bg-purple-100 text-purple-800 border-purple-200", label: "Quote Sent",      icon: FileText },
  accepted: { color: "bg-green-100 text-green-800 border-green-200",  label: "Accepted",         icon: CheckCircle2 },
  declined: { color: "bg-red-100 text-red-800 border-red-200",        label: "Declined",         icon: XCircle },
  expired:  { color: "bg-slate-100 text-slate-600 border-slate-200",  label: "Expired",          icon: AlertCircle },
};

function formatService(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export default function MyQuotes() {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email) return;
    setLoading(true);
    setError(null);
    fetch(`/api/quotes/by-email?email=${encodeURIComponent(email)}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error("Failed to load quotes")))
      .then(data => { setQuotes(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [email]);

  return (
    <PortalLayout title="My Quotes">
      <Helmet>
        <title>My Quotes | Sinovera Transit Global</title>
        <meta name="description" content="View all your freight quote requests and their status." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : error ? (
        <Card className="p-10 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </Card>
      ) : quotes.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-primary mb-2">No quotes yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Submit a freight quote request and we'll get back to you with pricing.
          </p>
          <Link href="/quote">
            <Button className="bg-secondary text-primary font-bold hover:bg-secondary/90">
              Request a Quote
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {quotes.map(q => {
            const cfg = STATUS_CONFIG[q.status] ?? STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            return (
              <Card key={q.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 mt-0.5">
                      <StatusIcon className="w-4 h-4 text-primary/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-primary">{q.referenceNumber}</span>
                        <Badge className={`text-xs border ${cfg.color}`}>{cfg.label}</Badge>
                      </div>
                      <p className="text-sm text-foreground/80 mb-1">
                        {formatService(q.serviceType)} · {q.originCity}, {q.originCountry}
                        <ChevronRight className="w-3 h-3 inline mx-0.5 text-muted-foreground" />
                        {q.destinationCity}, {q.destinationCountry}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                        <span>Submitted {format(new Date(q.createdAt), "MMM d, yyyy")}</span>
                        {q.quotedPrice && (
                          <span className="font-semibold text-green-600">
                            {q.currency} {Number(q.quotedPrice).toLocaleString()} quoted
                          </span>
                        )}
                        {q.trackingNumber && (
                          <span className="font-mono font-semibold text-secondary">
                            {q.trackingNumber}
                          </span>
                        )}
                      </div>
                      {q.adminNotes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">"{q.adminNotes}"</p>
                      )}
                    </div>
                  </div>

                  {/* Track button — only when tracking number is assigned */}
                  {q.trackingNumber && (
                    <div className="shrink-0 pl-0 sm:pl-2">
                      <Link href={`/track/${q.trackingNumber}`}>
                        <Button size="sm" className="bg-secondary text-primary font-bold hover:bg-secondary/90 gap-1.5 text-xs">
                          <ExternalLink className="w-3 h-3" /> Track Shipment
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}

          <div className="pt-2 text-center">
            <Link href="/quote">
              <Button variant="outline" size="sm">Request Another Quote</Button>
            </Link>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
