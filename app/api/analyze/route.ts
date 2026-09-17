import { NextRequest, NextResponse } from "next/server";
import { analyzeSite, ScannerInputError, type AnalysisErrorPayload, type AnalysisResult } from "@/lib/scanner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 12;
const CACHE_TTL_MS = 10 * 60_000;

type Bucket = { count: number; resetAt: number };
type CacheEntry = { expiresAt: number; result: AnalysisResult };
type HeaderRecord = Record<string, string>;

const globalState = globalThis as typeof globalThis & {
  __guvenilirMiRateBuckets?: Map<string, Bucket>;
  __guvenilirMiAnalysisCache?: Map<string, CacheEntry>;
};

const buckets = globalState.__guvenilirMiRateBuckets ?? new Map<string, Bucket>();
const cache = globalState.__guvenilirMiAnalysisCache ?? new Map<string, CacheEntry>();
globalState.__guvenilirMiRateBuckets = buckets;
globalState.__guvenilirMiAnalysisCache = cache;

export async function POST(request: NextRequest) {
  const clientKey = clientIdentifier(request);
  const rate = consumeRateLimit(clientKey);

  if (!rate.allowed) {
    return errorResponse(
      { error: "Çok fazla analiz isteği gönderildi. Kısa süre sonra tekrar dene.", code: "RATE_LIMITED" },
      429,
      { "Retry-After": String(Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))) },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse({ error: "İstek gövdesi geçerli JSON değil.", code: "BAD_REQUEST" }, 400);
  }

  const url =
    typeof payload === "object" && payload !== null && "url" in payload && typeof payload.url === "string"
      ? payload.url.trim()
      : "";

  if (!url || url.length > 2048) {
    return errorResponse({ error: "Analiz edilecek geçerli bir URL gönder.", code: "BAD_REQUEST" }, 400);
  }

  const cacheKey = url.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(
      { ...cached.result, cache: { hit: true, ttlSeconds: Math.ceil((cached.expiresAt - Date.now()) / 1000) } },
      { headers: responseHeaders(rate.remaining) },
    );
  }
  if (cached) cache.delete(cacheKey);

  try {
    const result = await analyzeSite(url);
    cache.set(cacheKey, { result, expiresAt: Date.now() + CACHE_TTL_MS });
    pruneCaches();

    return NextResponse.json(
      { ...result, cache: { hit: false, ttlSeconds: CACHE_TTL_MS / 1000 } },
      { headers: responseHeaders(rate.remaining) },
    );
  } catch (error) {
    if (error instanceof ScannerInputError) {
      const status = error.code === "BLOCKED_TARGET" ? 403 : error.code === "FETCH_FAILED" ? 502 : 400;
      return errorResponse({ error: error.message, code: error.code }, status);
    }

    console.error("[GuvenilirMi] analysis failed", error);
    return errorResponse(
      { error: "Analiz sırasında beklenmeyen bir hata oluştu.", code: "INTERNAL_ERROR" },
      500,
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: "GuvenilirMi scanner",
    status: "ok",
    version: "0.1.0",
    ai: false,
  });
}

function consumeRateLimit(key: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const bucket = { count: 1, resetAt: now + WINDOW_MS };
    buckets.set(key, bucket);
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetAt: bucket.resetAt };
  }

  existing.count += 1;
  const allowed = existing.count <= MAX_REQUESTS_PER_WINDOW;
  return {
    allowed,
    remaining: Math.max(0, MAX_REQUESTS_PER_WINDOW - existing.count),
    resetAt: existing.resetAt,
  };
}

function clientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "anonymous";
}

function responseHeaders(remaining: number): HeaderRecord {
  return {
    "Cache-Control": "no-store",
    "X-RateLimit-Limit": String(MAX_REQUESTS_PER_WINDOW),
    "X-RateLimit-Remaining": String(Math.max(0, remaining)),
    "X-Content-Type-Options": "nosniff",
  };
}

function errorResponse(payload: AnalysisErrorPayload, status: number, extraHeaders: HeaderRecord = {}) {
  return NextResponse.json(payload, {
    status,
    headers: { ...responseHeaders(0), ...extraHeaders },
  });
}

function pruneCaches() {
  const now = Date.now();
  if (cache.size > 250) {
    for (const [key, value] of cache) {
      if (value.expiresAt <= now) cache.delete(key);
    }
  }

  if (buckets.size > 2_000) {
    for (const [key, value] of buckets) {
      if (value.resetAt <= now) buckets.delete(key);
    }
  }
}
