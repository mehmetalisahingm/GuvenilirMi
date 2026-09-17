export type SignalStatus = "pass" | "warn" | "fail" | "info";

export type SignalCategory =
  | "domain"
  | "dns"
  | "transport"
  | "redirect"
  | "headers"
  | "content"
  | "identity";

export interface AnalysisSignal {
  id: string;
  category: SignalCategory;
  label: string;
  status: SignalStatus;
  impact: number;
  evidence: string;
  explanation: string;
}

export interface RedirectHop {
  url: string;
  status: number;
  location: string | null;
  hostChanged: boolean;
}

export interface DnsSummary {
  addresses: string[];
  nameservers: string[];
  mxCount: number;
  txtCount: number;
}

export interface TlsSummary {
  used: boolean;
  authorized: boolean | null;
  protocol: string | null;
  validFrom: string | null;
  validTo: string | null;
  issuer: string | null;
  subject: string | null;
  daysRemaining: number | null;
}

export interface DomainSummary {
  registrationDate: string | null;
  ageDays: number | null;
  expirationDate: string | null;
  dnssec: boolean | null;
  rdapAvailable: boolean;
}

export interface PageSummary {
  title: string | null;
  statusCode: number;
  contentType: string | null;
  forms: number;
  passwordFields: number;
  externalFormActions: string[];
  externalIframes: number;
  externalScripts: number;
  hasContactLink: boolean;
  hasPrivacyLink: boolean;
  hasTermsLink: boolean;
  hasRefundLink: boolean;
  bodyTruncated: boolean;
}

export type VerdictLevel = "low" | "guarded" | "mixed" | "high" | "insufficient";

export interface AnalysisVerdict {
  level: VerdictLevel;
  title: string;
  summary: string;
}

export interface AnalysisResult {
  id: string;
  inputUrl: string;
  normalizedUrl: string;
  finalUrl: string;
  hostname: string;
  score: number;
  confidence: number;
  verdict: AnalysisVerdict;
  signals: AnalysisSignal[];
  redirects: RedirectHop[];
  dns: DnsSummary;
  tls: TlsSummary;
  domain: DomainSummary;
  page: PageSummary;
  scannedAt: string;
  durationMs: number;
  disclaimer: string;
}

export interface AnalysisErrorPayload {
  error: string;
  code:
    | "INVALID_URL"
    | "BLOCKED_TARGET"
    | "UNRESOLVABLE_HOST"
    | "FETCH_FAILED"
    | "RATE_LIMITED"
    | "BAD_REQUEST"
    | "INTERNAL_ERROR";
}
