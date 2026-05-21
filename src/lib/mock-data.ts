// ─── KPI Data ─────────────────────────────────────────────────────────────────

export const kpiData = {
  revenue: {
    value: 2847500,
    change: +18.4,
    period: "vs mes anterior",
    formatted: "$2.84M",
  },
  activeFans: {
    value: 147832,
    change: +12.7,
    period: "vs mes anterior",
    formatted: "147.8K",
  },
  sponsors: {
    value: 23,
    change: +4,
    period: "vs trimestre anterior",
    formatted: "23",
  },
  ticketsSold: {
    value: 38450,
    change: +6.2,
    period: "vs último partido",
    formatted: "38.4K",
  },
  engagement: {
    value: 73.4,
    change: +5.1,
    period: "vs mes anterior",
    formatted: "73.4%",
  },
  avgSpend: {
    value: 124,
    change: +9.3,
    period: "por fan activo",
    formatted: "$124",
  },
};

// ─── Revenue Chart ─────────────────────────────────────────────────────────────

export const revenueData = [
  { month: "Jul", tickets: 420000, merch: 180000, digital: 95000, sponsors: 320000 },
  { month: "Ago", tickets: 580000, merch: 210000, digital: 120000, sponsors: 340000 },
  { month: "Sep", tickets: 510000, merch: 195000, digital: 108000, sponsors: 355000 },
  { month: "Oct", tickets: 690000, merch: 245000, digital: 145000, sponsors: 380000 },
  { month: "Nov", tickets: 740000, merch: 270000, digital: 162000, sponsors: 410000 },
  { month: "Dic", tickets: 920000, merch: 315000, digital: 198000, sponsors: 450000 },
  { month: "Ene", tickets: 650000, merch: 228000, digital: 135000, sponsors: 420000 },
  { month: "Feb", tickets: 780000, merch: 260000, digital: 155000, sponsors: 440000 },
  { month: "Mar", tickets: 860000, merch: 290000, digital: 178000, sponsors: 480000 },
  { month: "Abr", tickets: 950000, merch: 320000, digital: 210000, sponsors: 510000 },
  { month: "May", tickets: 1020000, merch: 348000, digital: 235000, sponsors: 540000 },
  { month: "Jun", tickets: 1150000, merch: 380000, digital: 278000, sponsors: 580000 },
];

// ─── Fan Engagement Funnel ────────────────────────────────────────────────────

export const engagementFunnel = [
  { stage: "Awareness", value: 850000, pct: 100 },
  { stage: "Registrados", value: 520000, pct: 61.2 },
  { stage: "Activos", value: 147832, pct: 17.4 },
  { stage: "Premium", value: 42100, pct: 4.95 },
  { stage: "VIP Elite", value: 8750, pct: 1.03 },
];

// ─── Fan Segments Donut ───────────────────────────────────────────────────────

export const fanSegments = [
  { name: "Ultra VIP", value: 8750, color: "#FF2D55" },
  { name: "Premium", value: 33350, color: "#FF6B6B" },
  { name: "Core", value: 65000, color: "#3B82F6" },
  { name: "Casual", value: 40732, color: "#8888AA" },
];

// ─── Real-time Activity ───────────────────────────────────────────────────────

export const realtimeActivity = [
  { id: 1, type: "purchase", user: "Carlos M.", action: "Compró entrada Platina", amount: "$85", time: "hace 2min", avatar: "CM" },
  { id: 2, type: "sponsor", user: "Nike AR", action: "Activó campaña Q3 2026", amount: "$120K", time: "hace 5min", avatar: "NK" },
  { id: 3, type: "merch", user: "Ana García", action: "Camiseta + Pack Premium", amount: "$240", time: "hace 8min", avatar: "AG" },
  { id: 4, type: "upgrade", user: "Diego Torres", action: "Upgrade a Fan VIP Elite", amount: "$499/año", time: "hace 12min", avatar: "DT" },
  { id: 5, type: "purchase", user: "Valentina R.", action: "Pack familia (4 entradas)", amount: "$280", time: "hace 15min", avatar: "VR" },
  { id: 6, type: "sponsor", user: "Adidas Lat", action: "Renovó contrato anual", amount: "$350K", time: "hace 18min", avatar: "AD" },
  { id: 7, type: "merch", user: "Facundo L.", action: "Edición limitada Champions", amount: "$180", time: "hace 22min", avatar: "FL" },
  { id: 8, type: "upgrade", user: "Sofía Méndez", action: "Upgrade a Fan Premium", amount: "$149/año", time: "hace 28min", avatar: "SM" },
];

// ─── Heatmap (hour x day) ────────────────────────────────────────────────────

export const heatmapDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export const heatmapHours = ["00", "03", "06", "09", "12", "15", "18", "21"];

export const heatmapData: number[][] = [
  [5, 3, 2, 8, 45, 62, 78, 42],
  [4, 2, 3, 10, 52, 70, 82, 48],
  [6, 3, 2, 12, 48, 65, 75, 44],
  [5, 4, 3, 9, 50, 68, 80, 46],
  [7, 3, 4, 15, 60, 85, 95, 72],
  [12, 8, 6, 25, 80, 98, 100, 88],
  [10, 6, 4, 20, 72, 90, 95, 80],
];

// ─── Fans Table ───────────────────────────────────────────────────────────────

export type FanLevel = "Ultra VIP" | "Premium" | "Core" | "Casual";

export interface Fan {
  id: string;
  name: string;
  email: string;
  level: FanLevel;
  segment: string;
  spend: number;
  engagement: number;
  matches: number;
  lastActive: string;
  location: string;
  joinDate: string;
  badges: string[];
}

export const fans: Fan[] = [
  {
    id: "F001",
    name: "Carlos Mendoza",
    email: "c.mendoza@gmail.com",
    level: "Ultra VIP",
    segment: "Temporada Completa",
    spend: 4850,
    engagement: 98,
    matches: 42,
    lastActive: "hace 1h",
    location: "Buenos Aires",
    joinDate: "2019-03-14",
    badges: ["🏟️ Abonado", "🔥 Streak 42", "💎 VIP Elite", "📱 Digital Fan"],
  },
  {
    id: "F002",
    name: "Valentina Ríos",
    email: "v.rios@hotmail.com",
    level: "Ultra VIP",
    segment: "Familia VIP",
    spend: 3920,
    engagement: 95,
    matches: 38,
    lastActive: "hace 3h",
    location: "Rosario",
    joinDate: "2020-08-22",
    badges: ["🏟️ Abonado", "👨‍👩‍👧 Familia", "💎 VIP Elite"],
  },
  {
    id: "F003",
    name: "Diego Torres",
    email: "dtorres@outlook.com",
    level: "Premium",
    segment: "Hincha Digital",
    spend: 1240,
    engagement: 87,
    matches: 28,
    lastActive: "hace 6h",
    location: "Córdoba",
    joinDate: "2021-01-10",
    badges: ["⭐ Premium", "📱 Digital Fan", "🎯 Predictor"],
  },
  {
    id: "F004",
    name: "Ana García",
    email: "ana.g@gmail.com",
    level: "Premium",
    segment: "Merch Lover",
    spend: 2100,
    engagement: 82,
    matches: 22,
    lastActive: "hace 2h",
    location: "Mendoza",
    joinDate: "2020-05-18",
    badges: ["⭐ Premium", "👕 Merch King", "🛒 Top Buyer"],
  },
  {
    id: "F005",
    name: "Facundo López",
    email: "facu.lopez@gmail.com",
    level: "Core",
    segment: "Hincha Local",
    spend: 580,
    engagement: 74,
    matches: 18,
    lastActive: "hace 1d",
    location: "Buenos Aires",
    joinDate: "2022-02-28",
    badges: ["🎫 Core Fan", "📍 Local"],
  },
  {
    id: "F006",
    name: "Sofía Méndez",
    email: "s.mendez@yahoo.com",
    level: "Core",
    segment: "Social Fan",
    spend: 340,
    engagement: 68,
    matches: 12,
    lastActive: "hace 2d",
    location: "La Plata",
    joinDate: "2022-09-05",
    badges: ["🎫 Core Fan", "📣 Social Star"],
  },
  {
    id: "F007",
    name: "Matías Fernández",
    email: "mati.f@gmail.com",
    level: "Casual",
    segment: "Esporádico",
    spend: 120,
    engagement: 42,
    matches: 5,
    lastActive: "hace 5d",
    location: "Tucumán",
    joinDate: "2023-06-12",
    badges: ["🌱 Nuevo"],
  },
  {
    id: "F008",
    name: "Luciana Paredes",
    email: "lu.paredes@gmail.com",
    level: "Casual",
    segment: "Esporádico",
    spend: 85,
    engagement: 35,
    matches: 3,
    lastActive: "hace 8d",
    location: "Salta",
    joinDate: "2023-11-20",
    badges: ["🌱 Nuevo"],
  },
];

// ─── Sponsors ─────────────────────────────────────────────────────────────────

export interface Sponsor {
  id: string;
  name: string;
  logo: string;
  category: string;
  investment: number;
  roi: number;
  impressions: number;
  activations: number;
  status: "active" | "negotiating" | "renewing";
  contractEnd: string;
  campaigns: number;
}

export const sponsors: Sponsor[] = [
  {
    id: "S001",
    name: "Nike Argentina",
    logo: "NK",
    category: "Indumentaria",
    investment: 1200000,
    roi: 3.8,
    impressions: 48500000,
    activations: 24,
    status: "active",
    contractEnd: "2027-06-30",
    campaigns: 8,
  },
  {
    id: "S002",
    name: "Banco Santander",
    logo: "BS",
    category: "Financiero",
    investment: 850000,
    roi: 2.9,
    impressions: 32000000,
    activations: 18,
    status: "active",
    contractEnd: "2026-12-31",
    campaigns: 6,
  },
  {
    id: "S003",
    name: "Pepsi Co.",
    logo: "PP",
    category: "Bebidas",
    investment: 620000,
    roi: 4.2,
    impressions: 28500000,
    activations: 32,
    status: "renewing",
    contractEnd: "2026-08-31",
    campaigns: 12,
  },
  {
    id: "S004",
    name: "Toyota Argentina",
    logo: "TY",
    category: "Automotriz",
    investment: 750000,
    roi: 2.4,
    impressions: 22000000,
    activations: 15,
    status: "active",
    contractEnd: "2027-03-31",
    campaigns: 5,
  },
  {
    id: "S005",
    name: "Claro Argentina",
    logo: "CL",
    category: "Telecom",
    investment: 480000,
    roi: 3.1,
    impressions: 18500000,
    activations: 20,
    status: "negotiating",
    contractEnd: "2026-09-30",
    campaigns: 7,
  },
  {
    id: "S006",
    name: "Adidas Latam",
    logo: "AD",
    category: "Indumentaria",
    investment: 390000,
    roi: 3.5,
    impressions: 15000000,
    activations: 14,
    status: "active",
    contractEnd: "2027-01-31",
    campaigns: 4,
  },
];

// ─── Sponsor ROI Chart ────────────────────────────────────────────────────────

export const sponsorRoiData = [
  { name: "Nike", roi: 3.8, investment: 1200, impressions: 48.5 },
  { name: "Santander", roi: 2.9, investment: 850, impressions: 32 },
  { name: "Pepsi", roi: 4.2, investment: 620, impressions: 28.5 },
  { name: "Toyota", roi: 2.4, investment: 750, impressions: 22 },
  { name: "Claro", roi: 3.1, investment: 480, impressions: 18.5 },
  { name: "Adidas", roi: 3.5, investment: 390, impressions: 15 },
];

// ─── Sponsor Activation Timeline ─────────────────────────────────────────────

export const activationData = [
  { month: "Ene", digital: 12, physical: 8, live: 5 },
  { month: "Feb", digital: 15, physical: 10, live: 7 },
  { month: "Mar", digital: 18, physical: 12, live: 9 },
  { month: "Abr", digital: 22, physical: 14, live: 12 },
  { month: "May", digital: 28, physical: 16, live: 14 },
  { month: "Jun", digital: 32, physical: 20, live: 18 },
];

// ─── Fan Engagement Radar ─────────────────────────────────────────────────────

export const engagementRadar = [
  { metric: "Asistencia", A: 95, B: 72, fullMark: 100 },
  { metric: "Digital", A: 88, B: 60, fullMark: 100 },
  { metric: "Merch", A: 76, B: 48, fullMark: 100 },
  { metric: "Social", A: 92, B: 65, fullMark: 100 },
  { metric: "Predictor", A: 68, B: 40, fullMark: 100 },
  { metric: "Community", A: 84, B: 58, fullMark: 100 },
];

// ─── Fan Spend Trend ──────────────────────────────────────────────────────────

export const fanSpendTrend = [
  { month: "Jul", vip: 380, premium: 210, core: 85, casual: 28 },
  { month: "Ago", vip: 420, premium: 235, core: 92, casual: 32 },
  { month: "Sep", vip: 395, premium: 220, core: 88, casual: 30 },
  { month: "Oct", vip: 460, premium: 255, core: 98, casual: 35 },
  { month: "Nov", vip: 510, premium: 280, core: 105, casual: 38 },
  { month: "Dic", vip: 620, premium: 340, core: 125, casual: 45 },
  { month: "Ene", vip: 445, premium: 248, core: 95, casual: 33 },
  { month: "Feb", vip: 490, premium: 268, core: 100, casual: 36 },
  { month: "Mar", vip: 535, premium: 295, core: 112, casual: 40 },
  { month: "Abr", vip: 580, premium: 318, core: 118, casual: 42 },
  { month: "May", vip: 625, premium: 345, core: 128, casual: 46 },
  { month: "Jun", vip: 720, premium: 395, core: 145, casual: 52 },
];

// ─── Community Pulse ──────────────────────────────────────────────────────────

export const communityPulse = [
  {
    id: "active",
    label: "Hinchas Activos",
    value: "147.8K",
    raw: 147832,
    trend: +12.7,
    trendLabel: "este mes",
    icon: "Users",
    accent: true,
  },
  {
    id: "new",
    label: "Nuevos Registros",
    value: "1,240",
    raw: 1240,
    trend: +8.4,
    trendLabel: "hoy",
    icon: "UserPlus",
    accent: false,
  },
  {
    id: "members",
    label: "Socios al Día",
    value: "38,450",
    raw: 38450,
    trend: +3.2,
    trendLabel: "vs semana ant.",
    icon: "ShieldCheck",
    accent: false,
  },
  {
    id: "churn",
    label: "Riesgo Abandono",
    value: "1,150",
    raw: 1150,
    trend: -4.8,
    trendLabel: "vs mes ant.",
    icon: "UserMinus",
    accent: false,
    warning: true,
  },
  {
    id: "points",
    label: "Puntos Entregados",
    value: "4.2M",
    raw: 4200000,
    trend: +22.1,
    trendLabel: "este mes",
    icon: "Zap",
    accent: false,
  },
];

// ─── Last Match ───────────────────────────────────────────────────────────────

export const lastMatch = {
  homeTeam: { name: "Toluca FC", abbr: "TOL", score: 3 },
  awayTeam: { name: "Monterrey", abbr: "MON", score: 1 },
  date: "Sáb 27 Abr 2026",
  time: "21:00",
  stadium: "El Monumental",
  competition: "Liga Profesional · Fecha 28",
  attendance: { value: 82340, capacity: 84567, pct: 97.4 },
  checkins: { value: 61480, pct: 74.7 },
  pointsAwarded: 128400,
  topSponsor: { name: "Nike AR", campaign: "Champions Pack", activations: 42 },
  topProduct: { name: "Camiseta Edición Clásico", units: 1840, revenue: "$156.4K" },
  trivia: { participants: 24800, correct: 68.4, question: "¿Cuántos goles marcó Gallardo en el 2019?" },
  highlights: [
    { minute: 12, type: "goal", player: "M. Borja", team: "home" },
    { minute: 34, type: "goal", player: "M. Borja", team: "home" },
    { minute: 58, type: "goal", player: "L. Romero", team: "away" },
    { minute: 77, type: "goal", player: "F. Girotti", team: "home" },
  ],
};

// ─── Top Fans ─────────────────────────────────────────────────────────────────

export const topFans = [
  {
    rank: 1,
    name: "Carlos Mendoza",
    initials: "CM",
    points: 48200,
    level: "Leyenda",
    badges: ["👑", "🔥", "💎"],
    streak: 42,
    location: "Buenos Aires",
  },
  {
    rank: 2,
    name: "Valentina Ríos",
    initials: "VR",
    points: 41800,
    level: "Elite",
    badges: ["🔥", "⭐"],
    streak: 38,
    location: "Rosario",
  },
  {
    rank: 3,
    name: "Diego Torres",
    initials: "DT",
    points: 38500,
    level: "Elite",
    badges: ["⚡", "🎯"],
    streak: 28,
    location: "Córdoba",
  },
  {
    rank: 4,
    name: "Ana García",
    initials: "AG",
    points: 29100,
    level: "Gold",
    badges: ["⭐", "👕"],
    streak: 22,
    location: "Mendoza",
  },
  {
    rank: 5,
    name: "Facundo López",
    initials: "FL",
    points: 22400,
    level: "Gold",
    badges: ["🎫"],
    streak: 18,
    location: "CABA",
  },
];

// ─── Smart Alerts ─────────────────────────────────────────────────────────────

export type AlertType = "danger" | "warning" | "info" | "action";

export interface SmartAlert {
  id: number;
  type: AlertType;
  title: string;
  description: string;
  cta: string;
  time: string;
  metric?: string;
}

export const smartAlerts: SmartAlert[] = [
  {
    id: 1,
    type: "danger",
    title: "1,150 fans en riesgo de churn",
    description: "Sin actividad > 60 días. Probabilidad de abandono: 84%.",
    cta: "Activar campaña",
    time: "hace 1h",
    metric: "84% riesgo",
  },
  {
    id: 2,
    type: "warning",
    title: "Contrato Pepsi vence en 30 días",
    description: "El acuerdo de sponsoreo finaliza el 31 de agosto 2026.",
    cta: "Ver contrato",
    time: "hace 3h",
    metric: "30 días",
  },
  {
    id: 3,
    type: "action",
    title: "890 fans listos para upgrade VIP",
    description: "Comportamiento de compra indica alta propensión al upgrade.",
    cta: "Crear oferta",
    time: "hace 5h",
    metric: "$445K est.",
  },
  {
    id: 4,
    type: "info",
    title: "Revenue superó meta mensual +13.6%",
    description: "Mayo 2026 cerró en $2.84M vs meta de $2.5M.",
    cta: "Ver reporte",
    time: "hace 12h",
    metric: "+$340K",
  },
];

// ─── Recent Timeline ──────────────────────────────────────────────────────────

export type TimelineEventType = "fan" | "sponsor" | "reward" | "campaign" | "game";

export interface TimelineEvent {
  id: number;
  type: TimelineEventType;
  title: string;
  description: string;
  time: string;
  amount?: string;
}

export const recentTimeline: TimelineEvent[] = [
  {
    id: 1,
    type: "fan",
    title: "1,240 nuevos registros",
    description: "Pico de ingreso post-clásico",
    time: "hace 2h",
    amount: "+1,240",
  },
  {
    id: 2,
    type: "sponsor",
    title: "Nike activó campaña Champions",
    description: "42 activaciones · 48.5M impresiones",
    time: "hace 4h",
    amount: "$120K",
  },
  {
    id: 3,
    type: "reward",
    title: "128,400 puntos entregados",
    description: "Post-partido El Monumental",
    time: "hace 6h",
    amount: "128.4K XP",
  },
  {
    id: 4,
    type: "campaign",
    title: "Campaña Upgrade VIP lanzada",
    description: "Segmento: 33,350 fans Premium",
    time: "hace 8h",
    amount: "$445K est.",
  },
  {
    id: 5,
    type: "game",
    title: "Trivia River vs Boca · 24.8K part.",
    description: "68.4% de respuestas correctas",
    time: "hace 10h",
    amount: "24.8K",
  },
  {
    id: 6,
    type: "fan",
    title: "890 upgrades a VIP Elite",
    description: "Nuevo récord mensual",
    time: "ayer",
    amount: "890",
  },
];
