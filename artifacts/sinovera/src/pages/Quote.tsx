import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useCreateQuote } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle, Plane, Anchor, Train, Truck, ShieldCheck, Package } from "lucide-react";
import { useState } from "react";

const schema = z.object({
  contactName: z.string().min(2, "Name is required"),
  contactEmail: z.string().email("Valid email required"),
  contactPhone: z.string().optional(),
  companyName: z.string().optional(),
  originCity: z.string().min(1, "Origin city required"),
  originCountry: z.string().min(1, "Origin country required"),
  destinationCity: z.string().min(1, "Destination city required"),
  destinationCountry: z.string().min(1, "Destination country required"),
  serviceType: z.string().min(1, "Please select a service"),
  weightKg: z.string().optional(),
  dimensions: z.string().optional(),
  cargoDescription: z.string().optional(),
  declaredValue: z.string().optional(),
  currency: z.string().optional(),
  specialRequirements: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const SERVICES = [
  { value: "air_freight", label: "Air Freight", icon: Plane },
  { value: "ocean_freight", label: "Ocean Freight (FCL)", icon: Anchor },
  { value: "ocean_freight_lcl", label: "Ocean Freight (LCL)", icon: Anchor },
  { value: "rail_freight", label: "Rail Freight", icon: Train },
  { value: "road_freight", label: "Road Freight", icon: Truck },
  { value: "customs_clearance", label: "Customs Clearance", icon: ShieldCheck },
  { value: "warehousing", label: "Warehousing & FBA", icon: Package },
];

export default function Quote() {
  const [submitted, setSubmitted] = useState(false);
  const [refNumber, setRefNumber] = useState("");
  const { mutate: createQuote, isPending } = useCreateQuote();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currency: "USD" },
  });

  const selectedService = watch("serviceType");

  const onSubmit = (data: FormValues) => {
    createQuote({ body: data }, {
      onSuccess: (result) => {
        setRefNumber(result.referenceNumber ?? "STG-Q-" + Date.now());
        setSubmitted(true);
      },
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1a2744] to-[#1e3a6e] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <Card className="p-10">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-extrabold text-primary mb-3">Quote Request Received!</h1>
            <p className="text-muted-foreground mb-4">
              Thank you! Our team will review your requirements and respond with a competitive quote within 2 business hours.
            </p>
            {refNumber && (
              <div className="bg-slate-50 rounded-lg p-3 mb-6">
                <div className="text-xs text-muted-foreground mb-1">Reference Number</div>
                <div className="font-mono font-bold text-primary text-lg">{refNumber}</div>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              We'll contact you at the email address provided. For urgent inquiries, call us at +86 400 123 4567.
            </p>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen">
      <Helmet>
        <title>Get a Freight Quote | Sinovera Transit Global</title>
        <meta name="description" content="Request a free freight quote from Sinovera Transit Global. Tell us your origin, destination, and cargo details — we respond with a competitive rate within 2 business hours." />
        <meta property="og:title" content="Free Freight Quote — Sinovera Transit Global" />
        <meta property="og:description" content="Get a competitive China freight quote in under 2 hours. Air, ocean, rail, road and customs clearance." />
        <meta property="og:type" content="website" />
      </Helmet>
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0f172a] via-[#1a2744] to-[#1e3a6e] text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#f5a623] rounded-full" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-[#f5a623] rounded-full translate-y-1/2" />
        </div>
        <div className="container mx-auto px-4 text-center max-w-2xl relative z-10">
          <Badge className="bg-[#f5a623]/20 text-[#f5a623] border-[#f5a623]/40 mb-4">Free Quote</Badge>
          <h1 className="text-4xl font-extrabold mb-4">Request a Freight Quote</h1>
          <p className="text-white/70 text-lg">
            Tell us about your shipment and we'll respond with a competitive rate within 2 business hours.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" data-testid="form-quote">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Details */}
            <Card className="p-6">
              <h2 className="font-bold text-primary text-lg mb-5">Contact Information</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="contactName">Full Name *</Label>
                  <Input id="contactName" {...register("contactName")} placeholder="John Smith" className="mt-1" data-testid="input-contact-name" />
                  {errors.contactName && <p className="text-destructive text-xs mt-1">{errors.contactName.message}</p>}
                </div>
                <div>
                  <Label htmlFor="contactEmail">Email Address *</Label>
                  <Input id="contactEmail" type="email" {...register("contactEmail")} placeholder="john@company.com" className="mt-1" data-testid="input-contact-email" />
                  {errors.contactEmail && <p className="text-destructive text-xs mt-1">{errors.contactEmail.message}</p>}
                </div>
                <div>
                  <Label htmlFor="contactPhone">Phone (with country code)</Label>
                  <Input id="contactPhone" {...register("contactPhone")} placeholder="+49 123 456 7890" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input id="companyName" {...register("companyName")} placeholder="Acme Corp GmbH" className="mt-1" />
                </div>
              </div>
            </Card>

            {/* Route */}
            <Card className="p-6">
              <h2 className="font-bold text-primary text-lg mb-5">Route Details</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="originCity">Origin City *</Label>
                    <Input id="originCity" {...register("originCity")} placeholder="Shenzhen" className="mt-1" />
                    {errors.originCity && <p className="text-destructive text-xs mt-1">{errors.originCity.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="originCountry">Origin Country *</Label>
                    <Input id="originCountry" {...register("originCountry")} placeholder="China" className="mt-1" />
                    {errors.originCountry && <p className="text-destructive text-xs mt-1">{errors.originCountry.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="destinationCity">Destination City *</Label>
                    <Input id="destinationCity" {...register("destinationCity")} placeholder="Frankfurt" className="mt-1" />
                    {errors.destinationCity && <p className="text-destructive text-xs mt-1">{errors.destinationCity.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="destinationCountry">Destination Country *</Label>
                    <Input id="destinationCountry" {...register("destinationCountry")} placeholder="Germany" className="mt-1" />
                    {errors.destinationCountry && <p className="text-destructive text-xs mt-1">{errors.destinationCountry.message}</p>}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Service Selection */}
          <Card className="p-6">
            <h2 className="font-bold text-primary text-lg mb-5">Service Type *</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {SERVICES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue("serviceType", value, { shouldValidate: true })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all text-sm font-medium cursor-pointer ${
                    selectedService === value
                      ? "border-[#0f172a] bg-[#0f172a] text-white shadow-lg"
                      : "border-slate-200 bg-white hover:border-[#0f172a]/40 hover:bg-slate-50 text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`service-option-${value}`}
                >
                  <Icon className={`w-6 h-6 ${selectedService === value ? "text-[#f5a623]" : "text-slate-400"}`} />
                  {label}
                </button>
              ))}
            </div>
            {errors.serviceType && <p className="text-destructive text-xs mt-2">{errors.serviceType.message}</p>}
          </Card>

          {/* Cargo Details */}
          <Card className="p-6">
            <h2 className="font-bold text-primary text-lg mb-5">Cargo Details</h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="weightKg">Total Weight (kg)</Label>
                <Input id="weightKg" {...register("weightKg")} placeholder="e.g. 500" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="dimensions">Dimensions (L×W×H cm per unit)</Label>
                <Input id="dimensions" {...register("dimensions")} placeholder="e.g. 60×40×30" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="declaredValue">Declared Value</Label>
                <div className="flex gap-2 mt-1">
                  <Input {...register("declaredValue")} placeholder="e.g. 10000" />
                  <select {...register("currency")} className="border rounded-md px-3 text-sm bg-background">
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CNY">CNY</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="cargoDescription">Cargo Description</Label>
                <Input id="cargoDescription" {...register("cargoDescription")} placeholder="e.g. Electronic components" className="mt-1" />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="specialRequirements">Special Requirements</Label>
                <Textarea
                  id="specialRequirements"
                  {...register("specialRequirements")}
                  placeholder="Dangerous goods, temperature control, urgent delivery, etc."
                  className="mt-1 min-h-[80px]"
                />
              </div>
            </div>
          </Card>

          <div className="text-center">
            <Button
              type="submit"
              disabled={isPending}
              className="bg-secondary text-primary font-bold hover:bg-secondary/90 px-12 py-3 text-base"
              data-testid="button-submit-quote"
            >
              {isPending ? "Submitting..." : "Submit Quote Request"}
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              We typically respond within 2 business hours. Your information is kept confidential.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
