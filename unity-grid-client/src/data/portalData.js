export const stats = [
  { icon: '🩸', value: '340+', label: 'Active donors', note: '210 available today', tone: 'rose' },
  { icon: '🚤', value: '28', label: 'Rescue & relief teams', note: 'Across 6 districts', tone: 'blue' },
  { icon: '🎓', value: '15+', label: 'Campus clubs & depts', note: 'Working together', tone: 'violet' },
  { icon: '৳', value: '৳4,85,000', label: 'Verified relief fund', note: 'Every taka accounted for', tone: 'green' },
]

export const portalSections = {
  blood: {
    icon: '✚',
    category: 'BLOOD NETWORK',
    shortTitle: 'Blood requests',
    title: 'Find a blood donor',
    description: 'Browse urgent blood requests and connect with people who can help.',
    action: 'I can donate',
    items: [
      { symbol: 'O+', title: 'O+ donor needed', subtitle: 'Sylhet MAG Osmani Medical College Hospital', meta: 'Within 3 hours · 2 bags', badge: 'URGENT', tone: 'rose' },
      { symbol: 'B−', title: 'B− donor needed', subtitle: 'Ibn Sina Hospital, Sylhet', meta: 'Today, before 8 PM · 1 bag', badge: 'TODAY', tone: 'blue' },
    ],
  },
  crisis: {
    icon: '⌁',
    category: 'CRISIS & FLOOD HUB',
    shortTitle: 'Crisis & flood hub',
    title: 'Relief teams on the ground',
    description: 'See active community SOS requests and the support needed in each area.',
    action: 'Offer support',
    items: [
      { symbol: 'TA', title: 'Sunamganj · Tahirpur', subtitle: 'Rescue boat & dry food', meta: 'Team Alpha assigned', badge: 'TEAM ASSIGNED', tone: 'green' },
      { symbol: '!', title: 'Nabiganj · Habiganj', subtitle: 'Drinking water & medicine', meta: 'Volunteers needed', badge: 'NEEDS HELP', tone: 'amber' },
    ],
  },
  events: {
    icon: '✳',
    category: 'CAMPUS EVENTS',
    shortTitle: 'Club events',
    title: 'Find your next campus event',
    description: 'Meet your people, learn something new, and volunteer on campus.',
    action: 'Apply as volunteer',
    items: [
      { symbol: '✳', title: 'SWE Tech Fest 2025', subtitle: 'SUST Central Auditorium', meta: 'NOV 22 · 10:00 AM · 12/20 volunteers', badge: 'TECHNOLOGY', tone: 'blue' },
      { symbol: '✚', title: 'Winter Blood Donation Camp', subtitle: 'SUST Medical Center', meta: 'NOV 25 · 9:00 AM · 8/16 volunteers', badge: 'COMMUNITY', tone: 'rose' },
    ],
  },
  ledger: {
    icon: '▤',
    category: 'TRANSPARENCY LEDGER',
    shortTitle: 'Public ledger',
    title: 'Every contribution, accounted for',
    description: 'Review recent relief spending and its supporting verification details.',
    items: [
      { symbol: '৳', title: '200 dry food & saline packs', subtitle: 'Emergency flood relief · Sunamganj', meta: 'NOV 12, 2025 · VOUCHER #UG-0248', badge: '−৳35,000', tone: 'green', note: 'Receipt verified by Gemini Vision · Sample entry' },
    ],
  },
}
