import {
  db,
  warehousesTable,
  carriersTable,
  shipmentsTable,
  trackingEventsTable,
  cmsContentTable,
  newsArticlesTable,
  customersTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

const WAREHOUSES = [
  { name: "STG Shanghai Gateway", code: "SHA-GW", address: "No. 1 Logistics Blvd, Pudong New Area", city: "Shanghai", country: "CN", contactEmail: "sha@sinovera.com", contactPhone: "+86-21-5000-8888" },
  { name: "STG Shenzhen Hub", code: "SZX-HUB", address: "8 Free Trade Zone, Qianhai", city: "Shenzhen", country: "CN", contactEmail: "szx@sinovera.com", contactPhone: "+86-755-3000-9999" },
  { name: "STG Beijing Distribution", code: "BJS-DIST", address: "22 Capital Logistics Park, Shunyi", city: "Beijing", country: "CN", contactEmail: "bjs@sinovera.com", contactPhone: "+86-10-6500-7777" },
  { name: "STG Guangzhou Freight", code: "CAN-FRT", address: "45 Baiyun Airport Industrial Zone", city: "Guangzhou", country: "CN", contactEmail: "can@sinovera.com", contactPhone: "+86-20-8800-6666" },
];

const CARRIERS = [
  { name: "STG Air Express", code: "STG-AIR", contactEmail: "air@sinovera.com", contactPhone: "+86-400-100-2001", trackingUrl: "https://track.sinovera.com" },
  { name: "STG Ocean Lines", code: "STG-OCN", contactEmail: "ocean@sinovera.com", contactPhone: "+86-400-100-2002", trackingUrl: null },
  { name: "STG Rail Logistics", code: "STG-RAIL", contactEmail: "rail@sinovera.com", contactPhone: "+86-400-100-2003", trackingUrl: null },
  { name: "China Freight Alliance", code: "CFA", contactEmail: "ops@cfa-logistics.com", contactPhone: "+86-21-9000-1111", trackingUrl: null },
];

const DEMO_SHIPMENTS = [
  {
    trackingNumber: "STG-CN-2026-84XH92",
    senderName: "Shenzhen Electronics Ltd",
    senderPhone: "+86-755-1234-5678",
    receiverName: "John Smith",
    receiverPhone: "+1-212-555-0192",
    receiverEmail: "j.smith@email.com",
    originCity: "Shenzhen",
    originCountry: "CN",
    destinationCity: "New York",
    destinationCountry: "US",
    shippingMethod: "air_freight" as const,
    serviceType: "Express Air",
    status: "in_transit" as const,
    weightKg: "2.500",
    numberOfPackages: 3,
    description: "Consumer Electronics - Smartphones",
    declaredValue: "1500.00",
    currency: "USD",
    currentLocation: "Frankfurt Airport",
    currentFacility: "Lufthansa Cargo Terminal",
    currentCity: "Frankfurt",
    currentCountry: "DE",
    events: [
      { status: "shipment_created", description: "Shipment registered and order confirmed.", city: "Shenzhen", country: "CN", daysAgo: 5 },
      { status: "collected", description: "Package collected from sender.", city: "Shenzhen", country: "CN", daysAgo: 4 },
      { status: "at_warehouse", description: "Arrived at Shenzhen Gateway facility. Processing initiated.", city: "Shenzhen", country: "CN", daysAgo: 4 },
      { status: "at_airport", description: "Shipment checked in at Shenzhen Bao'an International Airport.", city: "Shenzhen", country: "CN", daysAgo: 3 },
      { status: "departed_airport", description: "Flight departed Shenzhen. Estimated arrival Frankfurt in 11 hours.", city: "Shenzhen", country: "CN", daysAgo: 3 },
      { status: "arrived_at_transit_hub", description: "Arrived at Frankfurt transit hub. Customs pre-clearance in progress.", city: "Frankfurt", country: "DE", daysAgo: 2 },
      { status: "in_transit", description: "Cleared customs. Connecting flight to New York confirmed.", city: "Frankfurt", country: "DE", daysAgo: 1 },
    ],
  },
  {
    trackingNumber: "STG-CN-2026-KP73MQ",
    senderName: "Yiwu Trading Co.",
    senderPhone: "+86-579-8765-4321",
    receiverName: "Maria Garcia",
    receiverPhone: "+44-20-7946-0958",
    receiverEmail: "m.garcia@shopuk.co.uk",
    originCity: "Yiwu",
    originCountry: "CN",
    destinationCity: "London",
    destinationCountry: "GB",
    shippingMethod: "ocean_freight" as const,
    serviceType: "Standard Ocean LCL",
    status: "customs_review" as const,
    weightKg: "85.000",
    numberOfPackages: 12,
    description: "Handicrafts and Decorative Items",
    declaredValue: "3200.00",
    currency: "USD",
    currentLocation: "Port of Felixstowe",
    currentFacility: "Container Terminal B",
    currentCity: "Felixstowe",
    currentCountry: "GB",
    events: [
      { status: "shipment_created", description: "LCL shipment consolidated and order confirmed.", city: "Yiwu", country: "CN", daysAgo: 22 },
      { status: "at_warehouse", description: "Goods received at Yiwu consolidation warehouse.", city: "Yiwu", country: "CN", daysAgo: 21 },
      { status: "departed_warehouse", description: "Container loaded and sealed. Departs for Shanghai Port.", city: "Yiwu", country: "CN", daysAgo: 19 },
      { status: "in_transit", description: "Vessel MSC MAYA departed Shanghai Port. ETA Felixstowe 28 days.", city: "Shanghai", country: "CN", daysAgo: 18 },
      { status: "arrived_at_transit_hub", description: "Vessel arrived at Port of Felixstowe. Berthing scheduled.", city: "Felixstowe", country: "GB", daysAgo: 2 },
      { status: "customs_review", description: "Shipment referred for UK Customs examination.", city: "Felixstowe", country: "GB", daysAgo: 1 },
    ],
  },
  {
    trackingNumber: "STG-CN-2026-ZT55WR",
    senderName: "Foshan Furniture Factory",
    senderPhone: "+86-757-2345-6789",
    receiverName: "Ahmed Al-Rashidi",
    receiverPhone: "+971-4-555-0193",
    receiverEmail: "ahmed@interior-dubai.ae",
    originCity: "Foshan",
    originCountry: "CN",
    destinationCity: "Dubai",
    destinationCountry: "AE",
    shippingMethod: "ocean_freight" as const,
    serviceType: "Full Container Load",
    status: "delivered" as const,
    weightKg: "1200.000",
    numberOfPackages: 45,
    description: "Furniture - Sofas and Dining Sets",
    declaredValue: "28000.00",
    currency: "USD",
    currentLocation: "Dubai Client Premises",
    currentFacility: "Final Delivery",
    currentCity: "Dubai",
    currentCountry: "AE",
    events: [
      { status: "shipment_created", description: "FCL shipment booked. Container allocated.", city: "Foshan", country: "CN", daysAgo: 45 },
      { status: "collected", description: "Factory pickup complete. Goods loaded into 20ft container.", city: "Foshan", country: "CN", daysAgo: 44 },
      { status: "at_warehouse", description: "Container sealed and inspected at Guangzhou facility.", city: "Guangzhou", country: "CN", daysAgo: 43 },
      { status: "departed_airport", description: "Vessel departed Guangzhou Nansha Port.", city: "Guangzhou", country: "CN", daysAgo: 40 },
      { status: "in_transit", description: "Vessel in transit via Strait of Malacca.", city: "South China Sea", country: "CN", daysAgo: 32 },
      { status: "arrived_at_transit_hub", description: "Arrived Jebel Ali Port, Dubai.", city: "Dubai", country: "AE", daysAgo: 10 },
      { status: "customs_review", description: "UAE Customs documentation review.", city: "Dubai", country: "AE", daysAgo: 8 },
      { status: "released", description: "Customs cleared. Released for delivery.", city: "Dubai", country: "AE", daysAgo: 6 },
      { status: "out_for_delivery", description: "Last-mile delivery vehicle dispatched.", city: "Dubai", country: "AE", daysAgo: 3 },
      { status: "delivered", description: "Delivery completed. Signed by Ahmed A.", city: "Dubai", country: "AE", daysAgo: 2 },
    ],
  },
  {
    trackingNumber: "STG-CN-2026-NX28BF",
    senderName: "Ningbo Auto Parts Co.",
    senderPhone: "+86-574-3456-7890",
    receiverName: "Kowalski Industries",
    receiverPhone: "+48-22-500-9876",
    receiverEmail: "logistics@kowalski.pl",
    originCity: "Ningbo",
    originCountry: "CN",
    destinationCity: "Warsaw",
    destinationCountry: "PL",
    shippingMethod: "rail_freight" as const,
    serviceType: "China-Europe Rail Express",
    status: "in_transit" as const,
    weightKg: "650.000",
    numberOfPackages: 8,
    description: "Automotive Components",
    declaredValue: "45000.00",
    currency: "EUR",
    currentLocation: "Malaszewicze Rail Terminal",
    currentFacility: "PL-EU Entry Point",
    currentCity: "Malaszewicze",
    currentCountry: "PL",
    events: [
      { status: "shipment_created", description: "Rail shipment booked on China-Europe block train.", city: "Ningbo", country: "CN", daysAgo: 18 },
      { status: "at_warehouse", description: "Goods packed and loaded at Ningbo Rail Terminal.", city: "Ningbo", country: "CN", daysAgo: 17 },
      { status: "departed_warehouse", description: "Train departed Ningbo. First leg to Zhengzhou hub.", city: "Ningbo", country: "CN", daysAgo: 16 },
      { status: "in_transit", description: "Cross-border transit through Kazakhstan.", city: "Almaty", country: "KZ", daysAgo: 10 },
      { status: "in_transit", description: "Cross-border transit through Belarus.", city: "Minsk", country: "BY", daysAgo: 4 },
      { status: "arrived_at_transit_hub", description: "Arrived at Poland border terminal. EU customs entry.", city: "Malaszewicze", country: "PL", daysAgo: 1 },
    ],
  },
];

const CMS_DEFAULTS = [
  // Company info
  { section: "company", key: "name", value: "Sinovera Transit Global", label: "Company Name" },
  { section: "company", key: "short_name", value: "STG", label: "Short Name" },
  { section: "company", key: "tagline", value: "Delivering Beyond Borders.", label: "Tagline" },
  { section: "company", key: "mission", value: "To provide secure, transparent and reliable international shipping from China to customers across the globe.", label: "Mission Statement" },
  { section: "company", key: "founded", value: "2018", label: "Founded Year" },
  { section: "company", key: "hq_address", value: "1288 Lujiazui Ring Road, Pudong New Area, Shanghai 200120, China", label: "HQ Address" },
  { section: "company", key: "phone_cn", value: "+86-400-100-8888", label: "China Phone" },
  { section: "company", key: "phone_intl", value: "+852-2100-5555", label: "International Phone" },
  { section: "company", key: "email_support", value: "support@sinovera.com", label: "Support Email" },
  { section: "company", key: "email_sales", value: "sales@sinovera.com", label: "Sales Email" },
  { section: "company", key: "email_info", value: "info@sinovera.com", label: "General Email" },

  // Social media
  { section: "social", key: "linkedin", value: "https://linkedin.com/company/sinovera-transit-global", label: "LinkedIn" },
  { section: "social", key: "twitter", value: "https://twitter.com/SinoveraSTG", label: "Twitter/X" },
  { section: "social", key: "wechat", value: "SinoveraSTG", label: "WeChat ID" },
  { section: "social", key: "facebook", value: "https://facebook.com/sinoveratransit", label: "Facebook" },

  // Statistics (homepage)
  { section: "stats", key: "countries_served", value: "180+", label: "Countries Served" },
  { section: "stats", key: "shipments_delivered", value: "2.4M+", label: "Shipments Delivered" },
  { section: "stats", key: "years_experience", value: "8+", label: "Years Experience" },
  { section: "stats", key: "on_time_rate", value: "98.7%", label: "On-Time Delivery Rate" },
  { section: "stats", key: "team_members", value: "850+", label: "Team Members" },

  // Homepage hero
  { section: "homepage_hero", key: "headline", value: "China's Most Trusted International Logistics Partner", label: "Hero Headline" },
  { section: "homepage_hero", key: "subheadline", value: "From factory floor to your door — precision logistics across 180+ countries.", label: "Hero Subheadline" },

  // About
  { section: "about", key: "intro", value: "Sinovera Transit Global is a premier international logistics provider headquartered in Shanghai, China. Founded in 2018, we specialize in moving parcels, freight, cargo and documents from China to every corner of the world.", label: "About Introduction" },
  { section: "about", key: "vision", value: "To be the world's most trusted bridge between Chinese commerce and global markets.", label: "Vision" },

  // Services descriptions
  { section: "services", key: "air_freight_desc", value: "Express air cargo solutions connecting China's major airports to destinations worldwide. Fastest transit times with full tracking visibility.", label: "Air Freight Description" },
  { section: "services", key: "ocean_freight_desc", value: "Cost-effective sea freight for large shipments — FCL and LCL options available from all major Chinese ports.", label: "Ocean Freight Description" },
  { section: "services", key: "road_freight_desc", value: "Cross-border road transport connecting China with Southeast Asia, Central Asia, and Europe via dedicated truck corridors.", label: "Road Freight Description" },
  { section: "services", key: "rail_freight_desc", value: "China-Europe rail express services offering a balance of speed and cost — faster than ocean, more economical than air.", label: "Rail Freight Description" },
  { section: "services", key: "customs_clearance_desc", value: "Expert customs brokerage and compliance services in China and destination countries, ensuring smooth clearance every time.", label: "Customs Clearance Description" },
  { section: "services", key: "warehousing_desc", value: "Strategically located bonded warehouses across China offering storage, consolidation, repacking, and inventory management.", label: "Warehousing Description" },
  { section: "services", key: "international_shipping_desc", value: "End-to-end international shipping solutions tailored for businesses of all sizes, from SMEs to Fortune 500 companies.", label: "International Shipping Description" },

  // Legal pages
  { section: "legal", key: "privacy_policy", value: "# Privacy Policy\n\nLast updated: January 2026\n\n## 1. Information We Collect\n\nSinovera Transit Global collects information you provide directly to us when using our services, including name, email address, shipping addresses, and tracking preferences.\n\n## 2. How We Use Your Information\n\nWe use the information we collect to process shipments, provide customer support, send tracking notifications, and improve our services.\n\n## 3. Information Sharing\n\nWe do not sell or rent your personal information to third parties. We may share information with carriers, customs authorities, and service partners as necessary to fulfill shipments.\n\n## 4. Data Security\n\nWe implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, or destruction.\n\n## 5. Contact Us\n\nFor privacy-related inquiries, contact privacy@sinovera.com.", label: "Privacy Policy" },
  { section: "legal", key: "terms_conditions", value: "# Terms & Conditions\n\nLast updated: January 2026\n\n## 1. Acceptance of Terms\n\nBy using Sinovera Transit Global services, you agree to these terms and conditions.\n\n## 2. Services\n\nSTG provides international freight and logistics services subject to availability, applicable laws, and these terms.\n\n## 3. Liability\n\nSTG's liability is limited to the declared value of the shipment up to applicable legal limits.\n\n## 4. Prohibited Items\n\nShipments must not contain dangerous goods, prohibited items, or goods requiring special permits without prior written approval.", label: "Terms and Conditions" },
  { section: "legal", key: "shipping_policy", value: "# Shipping Policy\n\nLast updated: January 2026\n\n## Transit Times\n\nTransit times are estimates and not guaranteed. Air freight: 3-7 business days. Ocean freight: 15-35 business days. Rail freight: 14-21 business days.\n\n## Packaging Requirements\n\nAll goods must be properly packed and labeled. STG is not liable for damage due to inadequate packaging.", label: "Shipping Policy" },
  { section: "legal", key: "restricted_items", value: "# Restricted Items\n\nThe following items require special permits or are prohibited:\n\n- Dangerous goods (IATA/IMDG classified)\n- Lithium batteries (restrictions apply)\n- Perishable goods (temperature controlled only)\n- Pharmaceuticals (license required)\n- Weapons and ammunition\n- Counterfeit goods\n- Endangered species products\n- Currency and negotiable instruments", label: "Restricted Items" },
  { section: "legal", key: "claims_policy", value: "# Claims Policy\n\nLast updated: January 2026\n\n## Filing a Claim\n\nClaims for loss or damage must be filed within 14 days of delivery (or expected delivery for loss claims).\n\n## Required Documentation\n\nClaim forms, proof of value, photographs of damage, and original shipping documents are required.\n\n## Contact\n\nSubmit claims to claims@sinovera.com or through your account portal.", label: "Claims Policy" },
  { section: "legal", key: "cookie_policy", value: "# Cookie Policy\n\nSinovera Transit Global uses cookies to enhance your browsing experience, analyze site traffic, and personalize content. You can manage cookie preferences in your browser settings.", label: "Cookie Policy" },

  // FAQ entries (stored as JSON array)
  { section: "faq", key: "items", value: null, label: "FAQ Items", jsonValue: [
    { q: "How do I track my shipment?", a: "Enter your STG tracking number (format: STG-CN-YYYY-XXXXXX) in the tracking search bar on our homepage or the Track page. Real-time updates are available 24/7." },
    { q: "What countries does STG ship to?", a: "STG ships to over 180 countries worldwide. Contact us for specific destinations or remote area surcharges." },
    { q: "How long does shipping take from China?", a: "Air freight: 3-7 business days. Ocean freight: 15-35 business days depending on destination. Rail to Europe: 14-21 days." },
    { q: "How do I request a shipping quote?", a: "Use our Request Quote form, or contact our sales team at sales@sinovera.com. We typically respond within 24 business hours." },
    { q: "What happens if my shipment is delayed?", a: "Our tracking system will reflect the delay with a reason code. You'll receive a notification, and our support team proactively monitors all delayed shipments." },
    { q: "Can I change the delivery address after shipment?", a: "Address changes may be possible depending on the shipment stage. Contact support immediately with your tracking number and new address details." },
    { q: "What documents do I need for international shipping from China?", a: "Standard documents include: commercial invoice, packing list, bill of lading/airway bill, and certificate of origin. Customs requirements vary by destination country." },
    { q: "Does STG handle customs clearance?", a: "Yes — STG offers full customs brokerage services in China and at most destination countries. Our team ensures compliance with all import/export regulations." },
  ]},

  // Testimonials
  { section: "testimonials", key: "items", value: null, label: "Testimonials", jsonValue: [
    { name: "David Kowalski", role: "Procurement Director", company: "Kowalski Industries, Poland", rating: 5, text: "STG's China-Europe rail service has transformed our supply chain. Consistent 18-day transit times and impeccable tracking transparency." },
    { name: "Sarah Chen", role: "E-Commerce Manager", company: "StyleHub, Australia", rating: 5, text: "We ship 500+ parcels a week through STG. The dashboard is intuitive, the team is responsive, and we've never had a tracking gap." },
    { name: "Ahmed Al-Rashidi", role: "Operations Manager", company: "Dubai Interior Group, UAE", rating: 5, text: "Three years and dozens of FCL shipments. STG understands the Middle East market and always ensures smooth customs clearance." },
    { name: "Priya Sharma", role: "Founder", company: "Spice Origins, United Kingdom", rating: 5, text: "As a small business, I was nervous about importing directly from China. STG made the entire process stress-free from day one." },
  ]},
];

const NEWS_ARTICLES = [
  {
    title: "Sinovera Transit Global Expands Rail Freight Network to 12 New European Destinations",
    slug: "stg-expands-rail-freight-europe-2026",
    excerpt: "STG announces the expansion of its China-Europe rail express service to include 12 new destination cities, cutting transit times to Central Europe.",
    content: "SHANGHAI — Sinovera Transit Global (STG) today announced a major expansion of its China-Europe rail freight network, adding direct rail connections to 12 new cities across Central and Eastern Europe.\n\nThe expansion, effective from August 2026, adds destinations including Vienna, Prague, Budapest, Bucharest, Sofia, and Zagreb to STG's growing European rail network, which already serves major cities including Warsaw, Berlin, Hamburg, Rotterdam, and Madrid.\n\n\"This expansion reflects our commitment to providing Chinese exporters with more cost-efficient alternatives to airfreight while maintaining competitive transit times,\" said STG CEO Michael Zhang. \"Our rail service delivers goods from China to Central Europe in just 14-18 days — faster than any ocean freight alternative.\"\n\nThe new routes will serve e-commerce, automotive parts, electronics, and consumer goods sectors. STG's rail express services depart weekly from Chengdu, Xi'an, Yiwu, Zhengzhou, and Chongqing.",
    category: "company-news",
    tags: ["rail-freight", "europe", "expansion"],
    isPublished: true,
  },
  {
    title: "STG Launches Real-Time Customs Pre-Clearance for Air Freight to United States",
    slug: "stg-customs-pre-clearance-usa-2026",
    excerpt: "New automated customs pre-clearance system reduces US import processing times by up to 60%.",
    content: "SHANGHAI — Sinovera Transit Global has launched an automated customs pre-clearance system for air freight shipments destined for the United States, dramatically reducing port processing times.\n\nThe new system, developed in partnership with a leading customs technology provider, electronically transmits shipping documentation to US Customs and Border Protection (CBP) up to 24 hours before cargo arrival, enabling pre-arrival processing.\n\nIn pilot testing, the system reduced average customs processing times by 58%, with 74% of participating shipments receiving automated clearance without manual intervention.\n\n\"Speed at the border is one of the biggest bottlenecks in US-bound freight from China,\" noted STG Head of Customs Operations Lisa Wang. \"This technology lets us handle the paperwork long before the plane lands.\"\n\nThe system is available to all STG customers shipping commercial goods valued over $800 to the United States.",
    category: "technology",
    tags: ["customs", "usa", "air-freight", "technology"],
    isPublished: true,
  },
  {
    title: "Sinovera Transit Global Reports Record Growth in Q2 2026",
    slug: "stg-q2-2026-results",
    excerpt: "STG handled 640,000 shipments in Q2 2026, representing 34% year-on-year growth, driven by e-commerce and manufacturing sectors.",
    content: "SHANGHAI — Sinovera Transit Global today reported record operational results for the second quarter of 2026, processing 640,000 international shipments — a 34% increase compared to Q2 2025.\n\nThe growth was driven primarily by e-commerce volumes from Guangdong and Zhejiang provinces, along with strong demand in the automotive parts and electronics sectors.\n\nKey Q2 2026 highlights:\n- 640,000 shipments processed (+34% YoY)\n- 98.9% on-time delivery rate for air freight\n- 23 new corporate accounts onboarded\n- Average tracking event updates per shipment: 12.4\n\nSTG launched four new destination offices during the quarter, in Nairobi, Lagos, São Paulo, and Mexico City, expanding its global network to 42 offices in 38 countries.\n\nThe company also announced a new warehousing facility in Ningbo, adding 28,000 sqm of bonded warehouse capacity to serve the growing demand from Zhejiang exporters.",
    category: "company-news",
    tags: ["growth", "results", "q2-2026"],
    isPublished: true,
  },
];

export async function seedDatabase(): Promise<void> {
  logger.info("Starting database seed...");

  // Seed warehouses
  for (const wh of WAREHOUSES) {
    const existing = await db.select().from(warehousesTable).where(eq(warehousesTable.code, wh.code)).limit(1);
    if (existing.length === 0) {
      await db.insert(warehousesTable).values(wh);
      logger.info({ code: wh.code }, "Seeded warehouse");
    }
  }

  // Seed carriers
  for (const carrier of CARRIERS) {
    const existing = await db.select().from(carriersTable).where(eq(carriersTable.code, carrier.code)).limit(1);
    if (existing.length === 0) {
      await db.insert(carriersTable).values(carrier);
      logger.info({ code: carrier.code }, "Seeded carrier");
    }
  }

  // Seed demo customers
  const demoCustomers = [
    { email: "j.smith@email.com", firstName: "John", lastName: "Smith", phone: "+1-212-555-0192", country: "US" },
    { email: "m.garcia@shopuk.co.uk", firstName: "Maria", lastName: "Garcia", phone: "+44-20-7946-0958", country: "GB" },
    { email: "ahmed@interior-dubai.ae", firstName: "Ahmed", lastName: "Al-Rashidi", phone: "+971-4-555-0193", country: "AE" },
    { email: "logistics@kowalski.pl", firstName: "David", lastName: "Kowalski", phone: "+48-22-500-9876", country: "PL" },
  ];

  for (const cust of demoCustomers) {
    const existing = await db.select().from(customersTable).where(eq(customersTable.email, cust.email)).limit(1);
    if (existing.length === 0) {
      await db.insert(customersTable).values(cust);
    }
  }

  // Seed demo shipments
  const [carrier] = await db.select().from(carriersTable).where(eq(carriersTable.code, "STG-AIR")).limit(1);
  const [warehouse] = await db.select().from(warehousesTable).where(eq(warehousesTable.code, "SZX-HUB")).limit(1);

  for (const s of DEMO_SHIPMENTS) {
    const existing = await db.select().from(shipmentsTable).where(eq(shipmentsTable.trackingNumber, s.trackingNumber)).limit(1);
    if (existing.length > 0) continue;

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);

    const { events, ...shipmentData } = s;
    const [shipment] = await db.insert(shipmentsTable).values({
      ...shipmentData,
      carrierId: carrier?.id ?? null,
      warehouseId: warehouse?.id ?? null,
      estimatedDelivery,
    }).returning();

    // Insert tracking events
    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      const eventTime = new Date();
      eventTime.setDate(eventTime.getDate() - ev.daysAgo);
      eventTime.setHours(8 + (i * 3) % 12, 0, 0, 0);

      await db.insert(trackingEventsTable).values({
        shipmentId: shipment.id,
        status: ev.status,
        description: ev.description,
        city: ev.city,
        country: ev.country,
        eventTime,
        isPublic: true,
        sortOrder: i,
      });
    }
    logger.info({ trackingNumber: shipment.trackingNumber }, "Seeded shipment");
  }

  // Seed CMS defaults
  for (const item of CMS_DEFAULTS) {
    const existing = await db.select().from(cmsContentTable)
      .where(eq(cmsContentTable.section, item.section))
      .limit(100);
    const existingItem = existing.find(e => e.key === item.key);
    if (!existingItem) {
      await db.insert(cmsContentTable).values({
        section: item.section,
        key: item.key,
        value: item.value ?? null,
        jsonValue: (item as Record<string, unknown>).jsonValue ?? null,
        label: item.label,
        isPublished: true,
      });
    }
  }

  // Seed news articles
  for (const article of NEWS_ARTICLES) {
    const existing = await db.select().from(newsArticlesTable).where(eq(newsArticlesTable.slug, article.slug)).limit(1);
    if (existing.length === 0) {
      await db.insert(newsArticlesTable).values({
        ...article,
        publishedAt: article.isPublished ? new Date() : null,
      });
      logger.info({ slug: article.slug }, "Seeded news article");
    }
  }

  logger.info("Database seed complete.");
}
