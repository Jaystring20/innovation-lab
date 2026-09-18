export interface DivisionHardwareItem {
  name: string;
  role: string;
}

export interface BomLine {
  n: number;
  component: string;
  qty: string;
  price: string;
}

export interface Division {
  slug: string;
  tag: string;
  niche: string;
  project: string;
  challenge: string;
  sdg: string;
  sdgDetail: { code: string; title: string }[];
  price: string;
  hardware: string;
  hardwareBreakdown: DivisionHardwareItem[];
  bom: BomLine[];
  safetyNote?: string;
  brief: string;
}

/**
 * Single source of truth for the three APEN 2026 divisions — shared by the
 * competition overview (Apen2026.tsx) and each division's dedicated detail
 * page (DivisionDetail.tsx). SDG titles are the UN's own official goal
 * names; everything else — including the full `bom` (bill of materials)
 * line items and pricing — is transcribed from the organizer's
 * "APEN 2026 Competition Handbook (Corrected Pricing)".
 *
 * `brief` is a short in-page synopsis for the detail hero.
 *
 * Note on the Agriculture BOM: its line items sum to ₦55,050, ₦5,000 short
 * of the handbook's stated "FINAL TOTAL: ₦60,050 PER TEAM" — the Power and
 * Security tables both include a ₦5,000 "Packaging" line that Agriculture's
 * table is missing (Power and Security's line items do sum exactly to
 * their stated totals). Transcribed faithfully as given rather than
 * inventing the missing row; `price` reflects the handbook's stated total.
 */
export const DIVISIONS: Division[] = [
  {
    slug: 'agriculture',
    tag: 'Primary · Ages 7–12',
    niche: 'Agriculture',
    project: 'Smart Farm Bot + LED Interface',
    challenge:
      "Design a Smart Farm Bot that helps a plant grow using less water, less space, and less human effort, then make it intelligent.",
    sdg: 'SDG 2 · SDG 6',
    sdgDetail: [
      { code: 'SDG 2', title: 'Zero Hunger' },
      { code: 'SDG 6', title: 'Clean Water and Sanitation' },
    ],
    price: '₦60,050',
    hardware: 'ESP32-S3 · soil & water sensors · pump & relay · LED interface',
    hardwareBreakdown: [
      { name: 'ESP32-S3', role: 'The brain — reads sensors and runs the AI logic' },
      { name: 'Soil moisture sensor', role: 'Tells the bot when the plant actually needs water' },
      { name: 'Water level sensor', role: 'Watches the reservoir so the pump never runs dry' },
      { name: 'Pump & relay', role: 'Delivers water only when the sensors say it is needed' },
      { name: 'LED interface', role: 'Shows plant status at a glance — thirsty, healthy, flooded' },
    ],
    bom: [
      { n: 1, component: 'ESP32 38-Pin Type-C Development Board', qty: '1', price: '₦16,000' },
      { n: 2, component: 'USB Type-C Data/Programming Cable', qty: '1', price: '₦3,500' },
      { n: 3, component: 'DHT11 Temperature & Humidity Sensor', qty: '1', price: '₦2,000' },
      { n: 4, component: 'LDR/Photoresistor Light Sensor', qty: '1', price: '₦1,100' },
      { n: 5, component: 'Water-Level Sensor', qty: '1', price: '₦3,500' },
      { n: 6, component: 'Water-Flow Sensor', qty: '1', price: '₦5,500' },
      { n: 7, component: '5V DC Water Pump', qty: '1', price: '₦6,600' },
      { n: 8, component: '1-Channel Relay Module', qty: '1', price: '₦3,400' },
      { n: 9, component: 'Mini DC Fan', qty: '1', price: '₦4,500' },
      { n: 10, component: 'LED Grow Light', qty: '1', price: '₦1,000' },
      { n: 11, component: 'Active Buzzer', qty: '1', price: '₦1,450' },
      { n: 12, component: 'Red LED', qty: '1', price: '₦1,100' },
      { n: 13, component: 'Green LED', qty: '1', price: '₦1,100' },
      { n: 14, component: 'Yellow/Blue LED', qty: '1', price: '₦1,100' },
      { n: 15, component: '400-Hole Mini Breadboard', qty: '1', price: '₦3,200' },
    ],
    brief:
      'A hands-on introduction to closed-loop systems: sense the soil, decide, act, and explain the decision in plain language.',
  },
  {
    slug: 'power',
    tag: 'Secondary · Ages 13–16',
    niche: 'Power',
    project: 'Smart Energy Bot',
    challenge:
      'Monitor electricity consumption, detect energy waste, and use AI to help homes and schools make smarter, greener energy decisions.',
    sdg: 'SDG 7 · SDG 9 · SDG 12',
    sdgDetail: [
      { code: 'SDG 7', title: 'Affordable and Clean Energy' },
      { code: 'SDG 9', title: 'Industry, Innovation and Infrastructure' },
      { code: 'SDG 12', title: 'Responsible Consumption and Production' },
    ],
    price: '₦63,100',
    hardware: 'ESP32 · AC voltage & current sensors · LCD readout',
    hardwareBreakdown: [
      { name: 'ESP32', role: 'Runs the monitoring logic and talks to the AI layer' },
      { name: 'AC voltage sensor', role: 'Reads mains voltage safely, without direct contact' },
      { name: 'AC current sensor', role: 'Measures live draw so waste is visible in real time' },
      { name: 'LCD readout', role: 'Displays consumption and alerts on the device itself' },
    ],
    bom: [
      { n: 1, component: 'ESP32 Development Board – 38 Pin Type-C', qty: '1', price: '₦16,000' },
      { n: 2, component: 'ZMPT101B AC Voltage Sensor', qty: '1', price: '₦6,500' },
      { n: 3, component: 'ACS712 20A Current Sensor', qty: '1', price: '₦4,800' },
      { n: 4, component: '16×2 LCD + I2C Module', qty: '1', price: '₦7,500' },
      { n: 5, component: 'Push Button Tact Switch Module', qty: '1', price: '₦2,100' },
      { n: 6, component: 'MB-102 830-Point Breadboard', qty: '1', price: '₦3,200' },
      { n: 7, component: '400-Hole Mini Breadboard (2 pieces)', qty: '2', price: '₦5,000' },
      { n: 8, component: 'Jumper Wire Set (M-M/M-F/F-F)', qty: '1 Pack', price: '₦6,000' },
      { n: 9, component: '5V USB Power Supply', qty: '1', price: '₦4,500' },
      { n: 10, component: 'USB Type-C Cable', qty: '1', price: '₦2,500' },
      { n: 11, component: 'Packaging', qty: '1', price: '₦5,000' },
    ],
    safetyNote:
      'All power-sensing activities use a low-voltage DC proxy circuit to represent grid power. No team wires directly into live 220V household current.',
    brief:
      'Teams turn raw electrical readings into a story a household can act on — where the waste is, and what to do about it.',
  },
  {
    slug: 'security',
    tag: 'Sixth Form · Ages 16–18',
    niche: 'Security',
    project: 'ESP32-CAM Smart Security Bot',
    challenge:
      'Build an affordable security system that detects movement, captures evidence, alerts a user remotely, and lets AI judge what matters.',
    sdg: 'SDG 9 · SDG 11 · SDG 16',
    sdgDetail: [
      { code: 'SDG 9', title: 'Industry, Innovation and Infrastructure' },
      { code: 'SDG 11', title: 'Sustainable Cities and Communities' },
      { code: 'SDG 16', title: 'Peace, Justice and Strong Institutions' },
    ],
    price: '₦64,400',
    hardware: 'ESP32-CAM · PIR motion sensor · Wi-Fi phone alerts',
    hardwareBreakdown: [
      { name: 'ESP32-CAM', role: 'Captures the evidence and runs the on-device vision logic' },
      { name: 'PIR motion sensor', role: 'Wakes the system only when something actually moves' },
      { name: 'Wi-Fi phone alerts', role: 'Gets the right evidence to a person, not a false-alarm log' },
    ],
    bom: [
      { n: 1, component: 'ESP32-CAM with OV2640 Camera', qty: '1', price: '₦24,000' },
      { n: 2, component: 'ESP32-CAM MB USB Programming Board', qty: '1', price: '₦5,000' },
      { n: 3, component: 'HC-SR501 PIR Motion Sensor', qty: '1', price: '₦3,000' },
      { n: 4, component: '830-Point Solderless Breadboard', qty: '1', price: '₦4,500' },
      { n: 5, component: '140-Piece Mixed Jumper Wire Set', qty: '1 pack', price: '₦7,000' },
      { n: 6, component: 'LM2596 DC-DC Buck Converter', qty: '1', price: '₦3,800' },
      { n: 7, component: '18650 Li-ion Battery (2 pieces)', qty: '2', price: '₦8,000' },
      { n: 8, component: '18650 Battery Holder', qty: '1', price: '₦2,100' },
      { n: 9, component: 'Packaging / Student Kit Case & Labelling', qty: '1 set', price: '₦5,000' },
      { n: 10, component: 'JST/Power Connector Set', qty: '1', price: '₦2,000' },
    ],
    brief:
      'The hardest division on judgment: teams have to teach the AI what actually counts as a threat, not just motion.',
  },
];

export function getDivisionBySlug(slug: string | undefined): Division | undefined {
  return DIVISIONS.find((d) => d.slug === slug);
}

/**
 * The four required submissions per team, straight from the handbook's
 * "Deliverables for Each Team" section — identical across all three
 * divisions (the deliverable *format* is standardized; only the hardware
 * and challenge differ).
 */
export const DELIVERABLES = [
  {
    stage: 'Stage 1',
    name: 'Video Pitch',
    due: 'October 4, 2026',
    detail:
      'A 3-minute video covering your field research and the pain point you found, the kit solution you propose, which SDGs it addresses, and how you plan to build and test it.',
  },
  {
    stage: 'Stage 2',
    name: 'Physical Hardware Prototype',
    due: 'October 23, 2026',
    detail:
      'A fully functional model built strictly with the official division kit — reliable sensor readings and accurate actuator triggers, ready for build-quality judging.',
  },
  {
    stage: 'Stage 3',
    name: 'Final Video Pitch',
    due: 'November 22, 2026',
    detail:
      '3–5 minutes showing the physical hardware in action with the AI layer working seamlessly in real time. Finalists present this live at the Grand Finale BATTLE.',
  },
  {
    stage: 'Stage 3',
    name: 'AI Prompt Log & Design Poster',
    due: 'November 22, 2026',
    detail:
      'A poster summarizing the project journey and circuit design, plus an exhaustive log of every LLM prompt, prompt iteration, Vibe Coding workflow, and Edge AI step used to reach the final code.',
  },
];
