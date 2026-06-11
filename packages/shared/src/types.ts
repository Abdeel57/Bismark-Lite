// DTOs de respuesta de la API (lo que el backend serializa y el frontend consume).
import type {
  UserRole,
  UserStatus,
  RiferoStatus,
  PlanStatus,
  SubscriptionStatus,
  RaffleStatus,
  TicketStatus,
  OrderStatus,
  PaymentMethod,
  PaymentProofStatus,
} from './enums.js';

export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
}

export interface AuthUserDTO {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  hasProfile: boolean;
  riferoId: string | null;
  slug: string | null;
}

export interface AuthResponse {
  user: AuthUserDTO;
  token?: string; // sólo si el cliente usa Bearer; con cookies httpOnly se omite
}

export interface PlanDTO {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  billingPeriod: string;
  maxActiveRaffles: number;
  maxTicketsPerRaffle: number;
  allowProofUpload: boolean;
  allowMultipleWinners: boolean;
  allowReportsExcel: boolean;
  allowReportsPdf: boolean;
  allowVerificationBadge: boolean;
  allowDigitalDraw: boolean;
  allowCustomDomainFuture: boolean;
  features: string[];
  status: PlanStatus;
  sortOrder: number;
}

export interface SubscriptionDTO {
  id: string;
  riferoId: string;
  planId: string;
  plan?: PlanDTO;
  status: SubscriptionStatus;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
}

export interface RiferoProfileDTO {
  id: string;
  userId: string;
  publicName: string;
  slug: string;
  subdomain: string;
  customDomain: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  description: string | null;
  whatsapp: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  primaryColor: string;
  secondaryColor: string;
  templateKey: string;
  logoScale: number;
  logoGlow: boolean;
  payHolderName: string | null;
  payBank: string | null;
  payClabe: string | null;
  payCardNumber: string | null;
  payConcept: string | null;
  payInstructions: string | null;
  payWhatsapp: string | null;
  defaultReserveMinutes: number;
  allowProofUpload: boolean;
  showWinners: boolean;
  useDigitalDraw: boolean;
  status: RiferoStatus;
  verified: boolean;
  // Derivados
  hasActivePlan: boolean;
  activePlan?: PlanDTO | null;
  subscriptionStatus: SubscriptionStatus | null;
  createdAt: string;
}

// Vista pública (datos sensibles de pago omitidos según contexto)
export interface PublicRiferoDTO {
  id: string;
  publicName: string;
  slug: string;
  logoUrl: string | null;
  coverUrl: string | null;
  description: string | null;
  whatsapp: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  primaryColor: string;
  secondaryColor: string;
  templateKey: string;
  logoScale: number;
  logoGlow: boolean;
  verified: boolean;
  raffles: PublicRaffleSummaryDTO[];
}

export interface RaffleImageDTO {
  id: string;
  url: string;
  sortOrder: number;
}

export interface RaffleDTO {
  id: string;
  riferoId: string;
  eventNumber: number;
  eventLabel: string; // "E1"
  title: string;
  slug: string;
  description: string | null;
  prize: string | null;
  ticketPrice: number;
  totalTickets: number;
  ticketFormat: number;
  ticketStart: number;
  ticketEnd: number;
  maxTicketsPerOrder: number | null;
  startDate: string | null;
  endDate: string | null;
  drawDate: string | null;
  status: RaffleStatus;
  terms: string | null;
  paymentInstructions: string | null;
  reserveMinutes: number;
  allowWinnerPublication: boolean;
  useDigitalDraw: boolean;
  images: RaffleImageDTO[];
  // Stats
  soldCount: number; // pagados
  reservedCount: number;
  availableCount: number;
  estimatedRevenue: number;
  createdAt: string;
}

export interface PublicRaffleSummaryDTO {
  id: string;
  eventNumber: number;
  eventLabel: string;
  title: string;
  prize: string | null;
  ticketPrice: number;
  totalTickets: number;
  soldCount: number;
  coverUrl: string | null;
  status: RaffleStatus;
  drawDate: string | null;
}

export interface PublicRaffleDTO extends RaffleDTO {
  rifero: PublicRiferoDTO;
  winners: WinnerDTO[];
  // instrucciones de pago públicas (del perfil del rifero)
  paymentProfile: {
    holderName: string | null;
    bank: string | null;
    clabe: string | null;
    cardNumber: string | null;
    concept: string | null;
    instructions: string | null;
    whatsapp: string | null;
  };
}

// Boleto liviano para la cuadrícula pública (no exponer comprador)
export interface TicketLiteDTO {
  number: number;
  displayNumber: string;
  status: TicketStatus;
}

export interface TicketDTO extends TicketLiteDTO {
  id: string;
  reservedUntil: string | null;
  paidAt: string | null;
  // Sólo visible para el rifero dueño:
  buyer?: BuyerDTO | null;
  orderId?: string | null;
}

export interface BuyerDTO {
  id: string;
  fullName: string;
  phone: string;
  whatsapp: string | null;
  state: string | null;
}

export interface OrderDTO {
  id: string;
  code: string;
  raffleId: string;
  raffleTitle: string;
  eventLabel: string;
  buyer: BuyerDTO;
  ticketNumbers: string[]; // formateados
  totalAmount: number;
  status: OrderStatus;
  expiresAt: string | null;
  paidAt: string | null;
  hasProof: boolean;
  proof?: PaymentProofDTO | null;
  digitalTicketCode: string | null;
  createdAt: string;
}

// Resumen mostrado al comprador tras apartar (sin datos de otros)
export interface OrderReceiptDTO {
  code: string;
  raffleTitle: string;
  eventLabel: string;
  ticketNumbers: string[];
  totalAmount: number;
  status: OrderStatus;
  expiresAt: string | null;
  digitalTicketCode: string | null;
  paymentProfile: PublicRaffleDTO['paymentProfile'];
  riferoWhatsapp: string | null;
  riferoPublicName: string;
}

export interface PaymentProofDTO {
  id: string;
  method: PaymentMethod;
  fileUrl: string;
  note: string | null;
  status: PaymentProofStatus;
  uploadedAt: string;
  reviewedAt: string | null;
}

export interface WinnerDTO {
  id: string;
  raffleId: string;
  position: number;
  prizeDescription: string | null;
  ticketDisplayNumber: string;
  published: boolean;
  evidenceUrl: string | null;
  // sólo para el rifero dueño:
  buyer?: BuyerDTO | null;
}

export interface DigitalTicketDTO {
  code: string;
  raffleTitle: string;
  riferoPublicName: string;
  eventLabel: string;
  ticketNumbers: string[];
  buyerName: string;
  status: OrderStatus;
  createdAt: string;
  totalAmount: number;
  pdfUrl: string | null;
  verifyUrl: string;
  // Marca del rifero (para la página de pago con su identidad).
  riferoSlug: string;
  riferoLogoUrl: string | null;
  riferoVerified: boolean;
  primaryColor: string;
  secondaryColor: string;
  logoScale: number;
  logoGlow: boolean;
  // Pago: folio de la orden (para subir comprobante), precio unitario, vencimiento,
  // si el rifero acepta comprobantes en la plataforma, y sus datos de pago.
  orderCode: string;
  ticketPrice: number;
  expiresAt: string | null;
  allowProofUpload: boolean;
  riferoWhatsapp: string | null;
  paymentProfile: PublicRaffleDTO['paymentProfile'];
}

export interface ValidationResultDTO {
  found: boolean;
  riferoPublicName?: string;
  raffleTitle?: string;
  eventLabel?: string;
  status?: OrderStatus;
  ticketNumbers?: string[];
  totalAmount?: number;
  createdAt?: string;
}

// Dashboard
export interface DashboardSummaryDTO {
  pendingOrders: number;
  paidOrders: number;
  totalOrders: number;
  activeRaffles: number;
  upcomingDraws: number;
  soldTickets: number;
  reservedTickets: number;
  estimatedRevenue: number;
}

// Admin
export interface AdminRiferoDTO {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  publicName: string;
  slug: string;
  status: RiferoStatus;
  verified: boolean;
  subscriptionStatus: SubscriptionStatus | null;
  activePlanName: string | null;
  raffleCount: number;
  estimatedRevenue: number;
  createdAt: string;
}

export interface AdminMetricsDTO {
  totalUsers: number;
  totalRiferos: number;
  activeRiferos: number;
  totalRaffles: number;
  publishedRaffles: number;
  totalOrders: number;
  paidOrders: number;
  estimatedGmv: number;
  activeSubscriptions: number;
  pendingSubscriptions: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
