import http, { type IncomingHttpHeaders } from "node:http";
import https from "node:https";
import { type PeerCertificate, TLSSocket } from "node:tls";
import { resolvePublicTarget, sameSiteHost, ScannerInputError } from "./network";
import type { RedirectHop, TlsSummary } from "./types";

const REQUEST_TIMEOUT_MS = 8_000;
const MAX_BODY_BYTES = 1_000_000;
const MAX_REDIRECTS = 5;

export interface SafeFetchResult {
  finalUrl: URL;
  statusCode: number;
  headers: IncomingHttpHeaders;
  body: string;
  bodyTruncated: boolean;
  redirects: RedirectHop[];
  tls: TlsSummary;
}

interface SingleResponse {
  statusCode: number;
  headers: IncomingHttpHeaders;
  body: string;
  bodyTruncated: boolean;
  tls: TlsSummary;
}

export async function safeFetchPage(initialUrl: URL): Promise<SafeFetchResult> {
  let current = new URL(initialUrl);
  const redirects: RedirectHop[] = [];

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const response = await requestOnce(current);
    const location = firstHeader(response.headers.location);
    const isRedirect = [301, 302, 303, 307, 308].includes(response.statusCode) && Boolean(location);

    if (!isRedirect || !location) {
      return {
        finalUrl: current,
        statusCode: response.statusCode,
        headers: response.headers,
        body: response.body,
        bodyTruncated: response.bodyTruncated,
        redirects,
        tls: response.tls,
      };
    }

    if (hop === MAX_REDIRECTS) {
      throw new ScannerInputError("Site çok fazla yönlendirme yapıyor.", "FETCH_FAILED");
    }

    let next: URL;
    try {
      next = new URL(location, current);
    } catch {
      throw new ScannerInputError("Site geçersiz bir yönlendirme adresi döndürdü.", "FETCH_FAILED");
    }

    if (next.protocol !== "http:" && next.protocol !== "https:") {
      throw new ScannerInputError("HTTP dışındaki yönlendirmeler güvenlik nedeniyle izlenmez.", "BLOCKED_TARGET");
    }

    await resolvePublicTarget(next.hostname);

    redirects.push({
      url: current.toString(),
      status: response.statusCode,
      location: next.toString(),
      hostChanged: !sameSiteHost(current.hostname, next.hostname),
    });

    current = next;
  }

  throw new ScannerInputError("Yönlendirme zinciri tamamlanamadı.", "FETCH_FAILED");
}

async function requestOnce(url: URL): Promise<SingleResponse> {
  const target = await resolvePublicTarget(url.hostname);
  const selected = target.addresses[0];
  const transport = url.protocol === "https:" ? https : http;

  return new Promise<SingleResponse>((resolve, reject) => {
    let settled = false;

    const request = transport.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || undefined,
        path: `${url.pathname}${url.search}`,
        method: "GET",
        servername: url.protocol === "https:" ? url.hostname : undefined,
        lookup: (_hostname, _options, callback) => {
          callback(null, selected.address, selected.family);
        },
        headers: {
          accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.7",
          "accept-language": "tr-TR,tr;q=0.9,en;q=0.5",
          "user-agent": "GuvenilirMiBot/0.1 (+https://github.com/mehmetalisahingm/GuvenilirMi)",
          "cache-control": "no-cache",
          pragma: "no-cache",
        },
        timeout: REQUEST_TIMEOUT_MS,
        rejectUnauthorized: false,
      },
      (response) => {
        const chunks: Buffer[] = [];
        let bytes = 0;
        let truncated = false;

        response.on("data", (chunk: Buffer) => {
          if (truncated) return;
          const remaining = MAX_BODY_BYTES - bytes;
          if (remaining <= 0) {
            truncated = true;
            return;
          }
          const slice = chunk.length > remaining ? chunk.subarray(0, remaining) : chunk;
          chunks.push(slice);
          bytes += slice.length;
          if (chunk.length > remaining) truncated = true;
        });

        response.on("end", () => {
          if (settled) return;
          settled = true;
          resolve({
            statusCode: response.statusCode ?? 0,
            headers: response.headers,
            body: Buffer.concat(chunks).toString("utf8"),
            bodyTruncated: truncated,
            tls: extractTlsSummary(response.socket),
          });
        });
      },
    );

    request.on("timeout", () => {
      request.destroy(new Error("timeout"));
    });

    request.on("error", () => {
      if (settled) return;
      settled = true;
      reject(new ScannerInputError("Siteye güvenli bağlantı kurulamadı.", "FETCH_FAILED"));
    });

    request.end();
  });
}

function extractTlsSummary(socket: NodeJS.ReadableStream): TlsSummary {
  if (!(socket instanceof TLSSocket)) {
    return {
      used: false,
      authorized: null,
      protocol: null,
      validFrom: null,
      validTo: null,
      issuer: null,
      subject: null,
      daysRemaining: null,
    };
  }

  const certificate = socket.getPeerCertificate() as PeerCertificate;
  const validTo = certificate.valid_to || null;
  const validFrom = certificate.valid_from || null;
  const daysRemaining = validTo
    ? Math.ceil((new Date(validTo).getTime() - Date.now()) / 86_400_000)
    : null;

  return {
    used: true,
    authorized: socket.authorized,
    protocol: socket.getProtocol(),
    validFrom,
    validTo,
    issuer: certificate.issuer?.O ?? certificate.issuer?.CN ?? null,
    subject: certificate.subject?.CN ?? null,
    daysRemaining: Number.isFinite(daysRemaining) ? daysRemaining : null,
  };
}

function firstHeader(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
