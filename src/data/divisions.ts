export interface DivisionHardwareItem {
  name: string;
  role: string;
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
  brief: string;
}

/**
 * Single source of truth for the three APEN 2026 divisions — shared by the
 * competition overview (Apen2026.tsx) and each division's dedicated detail
 * page (DivisionDetail.tsx). SDG titles are the UN's own official goal
 * names; everything else is pulled from the Competition Handbook.
 *
 * `brief` is a short in-page synopsis for the detail hero. A fuller
 * project brief (build stages, mentor notes, example submissions) is
 * expected from the organizer's source doc and will extend this record.
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
    brief:
      'The hardest division on judgment: teams have to teach the AI what actually counts as a threat, not just motion.',
  },
];

export function getDivisionBySlug(slug: string | undefined): Division | undefined {
  return DIVISIONS.find((d) => d.slug === slug);
}
