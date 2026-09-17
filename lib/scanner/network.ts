import dns from "node:dns/promises";
import net from "node:net";

export class ScannerInputError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "INVALID_URL"
      | "BLOCKED_TARGET"
      | "UNRESOLVABLE_HOST"
      | "FETCH_FAILED",
  ) {
    super(message);
    this.name = "ScannerInputError";
  }
}

const BLOCKED_HOST_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".home",
  ".lan",
  ".test",
  ".invalid",
];

export function normalizeInputUrl(input: string): URL {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 2048) {
    throw new ScannerInputError("Geçerli bir web sitesi adresi gir.", "INVALID_URL");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new ScannerInputError("URL biçimi geçerli değil.", "INVALID_URL");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new ScannerInputError("Yalnızca HTTP ve HTTPS adresleri analiz edilebilir.", "INVALID_URL");
  }

  if (url.username || url.password) {
    throw new ScannerInputError("Kullanıcı bilgisi içeren URL'ler desteklenmiyor.", "INVALID_URL");
  }

  url.hash = "";
  url.hostname = url.hostname.toLowerCase().replace(/\.$/, "");

  assertHostnameAllowed(url.hostname);
  return url;
}

export function assertHostnameAllowed(hostname: string): void {
  const host = hostname.toLowerCase().replace(/\.$/, "");

  if (!host || host === "localhost" || host === "localhost.localdomain") {
    throw new ScannerInputError("Yerel ağ hedefleri analiz edilemez.", "BLOCKED_TARGET");
  }

  if (BLOCKED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    throw new ScannerInputError("Özel veya yerel alan adları analiz edilemez.", "BLOCKED_TARGET");
  }

  if (net.isIP(host) && !isPublicIp(host)) {
    throw new ScannerInputError("Özel IP adresleri analiz edilemez.", "BLOCKED_TARGET");
  }
}

export interface ResolvedTarget {
  hostname: string;
  addresses: Array<{ address: string; family: 4 | 6 }>;
}

export async function resolvePublicTarget(hostname: string): Promise<ResolvedTarget> {
  assertHostnameAllowed(hostname);

  if (net.isIP(hostname)) {
    if (!isPublicIp(hostname)) {
      throw new ScannerInputError("Özel IP adresleri analiz edilemez.", "BLOCKED_TARGET");
    }
    return {
      hostname,
      addresses: [{ address: hostname, family: net.isIP(hostname) as 4 | 6 }],
    };
  }

  let resolved: dns.LookupAddress[];
  try {
    resolved = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new ScannerInputError("Alan adı çözümlenemedi.", "UNRESOLVABLE_HOST");
  }

  const addresses = resolved
    .map((entry) => ({ address: entry.address, family: entry.family as 4 | 6 }))
    .filter((entry) => entry.family === 4 || entry.family === 6);

  if (!addresses.length) {
    throw new ScannerInputError("Alan adı için kullanılabilir IP adresi bulunamadı.", "UNRESOLVABLE_HOST");
  }

  if (addresses.some((entry) => !isPublicIp(entry.address))) {
    throw new ScannerInputError(
      "Alan adı özel, yerel veya rezerve edilmiş bir IP adresine çözümleniyor.",
      "BLOCKED_TARGET",
    );
  }

  return { hostname, addresses };
}

export function isPublicIp(address: string): boolean {
  const family = net.isIP(address);
  if (family === 4) return isPublicIpv4(address);
  if (family === 6) return isPublicIpv6(address);
  return false;
}

function isPublicIpv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((value) => Number.isNaN(value) || value < 0 || value > 255)) {
    return false;
  }

  const [a, b, c] = parts;

  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 192 && b === 0 && c === 0) return false;
  if (a === 192 && b === 0 && c === 2) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a === 198 && b === 51 && c === 100) return false;
  if (a === 203 && b === 0 && c === 113) return false;

  return true;
}

function isPublicIpv6(address: string): boolean {
  const normalized = address.toLowerCase();

  if (normalized === "::" || normalized === "::1") return false;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return false;
  if (/^fe[89ab]/.test(normalized)) return false;
  if (normalized.startsWith("ff")) return false;
  if (normalized.startsWith("2001:db8")) return false;

  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPublicIpv4(mapped[1]);

  return true;
}

export function sameSiteHost(a: string, b: string): boolean {
  const normalize = (host: string) => host.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  return normalize(a) === normalize(b);
}
