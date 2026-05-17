/**
 * Deterministic demo payloads for the Fan Experience storytelling layer.
 * Not backed by production APIs — drives UI differentiation only.
 */

export type DemoEngagementTier = "low" | "medium" | "high" | "extreme";

export type DemoCampaignAccent = "brand" | "success" | "neutral";

export interface DemoSponsorAffinity {
  /** Partner display name */
  name: string;
  /** Short category for demo chips */
  category: string;
}

export interface DemoCampaignCard {
  title: string;
  subtitle: string;
  cta: string;
  /** Optional ribbon e.g. “Cierra en 4 h” */
  urgency?: string;
  accent: DemoCampaignAccent;
}

export interface DemoRewardsBlock {
  headline: string;
  detail: string;
  tierLabel: string;
  unlocked: boolean;
  /** Points toward next unlock — omit when max tier */
  progress?: { current: number; target: number };
}

export interface DemoExperienceItem {
  title: string;
  description: string;
}

export interface DemoFanPersona {
  id: string;
  displayName: string;
  initials: string;
  /** Shown in-app greeting */
  greeting: string;
  /** Hero line under club name */
  heroTagline: string;
  /** Numeric signal for gamification level (1–5) */
  levelRank: number;
  levelLabel: string;
  segmentLabel: string;
  engagementPercent: number;
  engagementTier: DemoEngagementTier;
  sponsorAffinity: DemoSponsorAffinity[];
  campaigns: DemoCampaignCard[];
  rewards: DemoRewardsBlock;
  experiences: DemoExperienceItem[];
}

export const FAN_EXPERIENCE_DEMO_PERSONAS: DemoFanPersona[] = [
  {
    id: "premium-stadium",
    displayName: "María V.",
    initials: "MV",
    greeting: "Hola, María",
    heroTagline: "Tu acceso VIP para el domingo ya está activo.",
    levelRank: 4,
    levelLabel: "Oro",
    segmentLabel: "Abonada premium",
    engagementPercent: 92,
    engagementTier: "high",
    sponsorAffinity: [
      { name: "Macro Arena Bank", category: "Finanzas premium" },
      { name: "Velocity Motors", category: "Automoción" },
    ],
    campaigns: [
      {
        title: "Palco institucional · Copa",
        subtitle: "Invitación doble + hospitality cerrado antes del partido.",
        cta: "Confirmar asistencia",
        urgency: "Cupos limitados",
        accent: "brand",
      },
      {
        title: "Predicción Libertadores",
        subtitle: "Multiplicador x3 en puntos si acertás el marcador exacto.",
        cta: "Armar predicción",
        accent: "success",
      },
    ],
    rewards: {
      headline: "Nivel Leyenda desbloqueado",
      detail: "Carnet digital animado + ingreso preferencial a fan zone cerrada.",
      tierLabel: "Leyenda",
      unlocked: true,
    },
    experiences: [
      {
        title: "Túnel de jugadores",
        description: "Cronograma de salida y punto de encuentro con escolta.",
      },
      {
        title: "Lounge sponsor Macro",
        description: "Coctelería + meet greet reducido post-partido.",
      },
    ],
  },
  {
    id: "digital-core",
    displayName: "Lucas R.",
    initials: "LR",
    greeting: "Hey, Lucas",
    heroTagline: "Seguí sumando desde casa — el estadio también te espera.",
    levelRank: 2,
    levelLabel: "Plata",
    segmentLabel: "Digital-first",
    engagementPercent: 54,
    engagementTier: "medium",
    sponsorAffinity: [
      { name: "RápidoFood", category: "Delivery" },
      { name: "PlayStream+", category: "Streaming" },
    ],
    campaigns: [
      {
        title: "Trivia diaria · 60 s",
        subtitle: "Racha de 5 días para boost de puntos en tienda oficial.",
        cta: "Jugar ahora",
        accent: "neutral",
      },
      {
        title: "Fan Token Drop",
        subtitle: "Canje anticipado para socios digitales nivel Plata o superior.",
        cta: "Ver requisitos",
        urgency: "Cierra en 12 h",
        accent: "brand",
      },
    ],
    rewards: {
      headline: "Próximo hito: Oro",
      detail: "Te faltan puntos para desbloquear predicciones premium.",
      tierLabel: "Plata",
      unlocked: false,
      progress: { current: 620, target: 900 },
    },
    experiences: [
      {
        title: "Cámara 360 · Vestuario",
        description: "Contenido extendido solo en la app el día del partido.",
      },
      {
        title: "Audio táctico alternativo",
        description: "Segunda señal con análisis táctico en vivo.",
      },
    ],
  },
  {
    id: "family-occasional",
    displayName: "Camila P.",
    initials: "CP",
    greeting: "Camila, bienvenida",
    heroTagline: "Armamos un plan familiar para tu próxima visita al Monumental.",
    levelRank: 1,
    levelLabel: "Bronce",
    segmentLabel: "Familia ocasional",
    engagementPercent: 38,
    engagementTier: "low",
    sponsorAffinity: [
      { name: "SnackCo", category: "Snacks" },
      { name: "KidsWear", category: "Retail infantil" },
    ],
    campaigns: [
      {
        title: "Tribuna norte familiar",
        subtitle: "Mapa de servicios + kit hincha junior sin cargo.",
        cta: "Reservar cupos",
        accent: "success",
      },
      {
        title: "Sorteo merchandising",
        subtitle: "Participás automático al escanear entrada digital.",
        cta: "Ver premios",
        accent: "neutral",
      },
    ],
    rewards: {
      headline: "Sticker pack digital",
      detail: "Canjealo en tienda oficial con tu próxima compra online.",
      tierLabel: "Bronce",
      unlocked: true,
      progress: { current: 120, target: 400 },
    },
    experiences: [
      {
        title: "Fila rápida gastronómica",
        description: "Menú familiar pre-armado en puntos señalados.",
      },
      {
        title: "Meet mascota",
        description: "Turno express después del calentamiento.",
      },
    ],
  },
  {
    id: "ultra-organized",
    displayName: "Diego M.",
    initials: "DM",
    greeting: "Diego",
    heroTagline: "La hinchada organizada lidera la tabla de impacto en vivo.",
    levelRank: 5,
    levelLabel: "Platino",
    segmentLabel: "Ultra · grupo organizado",
    engagementPercent: 98,
    engagementTier: "extreme",
    sponsorAffinity: [
      { name: "Cerveza del Estadio", category: "Bebidas" },
      { name: "Urban Outfit Riv", category: "Lifestyle" },
    ],
    campaigns: [
      {
        title: "Coreografía sector visitante",
        subtitle: "Ensayo cerrado + puntaje extra por sincronía validada.",
        cta: "Sincronizar bloque",
        urgency: "Ensayo mañana",
        accent: "brand",
      },
      {
        title: "Ranking de barras",
        subtitle: "Tu grupo sube si completás retos de asistencia y seguridad.",
        cta: "Ver posición",
        accent: "success",
      },
    ],
    rewards: {
      headline: "NFT carnet temporada",
      detail: "Edición ultra numerada con beneficios en previas oficiales.",
      tierLabel: "Platino",
      unlocked: true,
    },
    experiences: [
      {
        title: "Previa oficial ultra",
        description: "Coordenadas de ingreso y briefing de seguridad digital.",
      },
      {
        title: "Despliegue de telón",
        description: "Check-in obligatorio 90 minutos antes del pitazo.",
      },
    ],
  },
];
