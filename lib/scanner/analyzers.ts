import dns from "node:dns/promises";
import type { IncomingHttpHeaders } from "node:http";
import { resolvePublicTarget, sameSiteHost } from "./network";
import type {
  AnalysisSignal,
  DnsSummary,
  DomainSummary,
  PageSummary,
  RedirectHop,
  TlsSummary,
} from "./types";

const RDAP_TIMEOUT_MS = 4_000;

export async function analyzeDns(hostname: string): Promise<{ summary: DnsSummary; signals: AnalysisSignal[] }> {
  const resolved = await resolvePublicTarget(hostname);

  const [nsResult, mxResult, txtResult] = await Promise.allSettled([
    dns.resolveNs(hostname),
    dns.resolveMx(hostname),
    dns.resolveTxt(hostname),
  ]);

  const nameservers = nsResult.status === "fulfilled" ? nsResult.value : [];
  const mx = mxResult.status === "fulfilled" ? mxResult.value : [];
  const txt = txtResult.status === "fulfilled" ? txtResult.value : [];

  const signals: AnalysisSignal[] = [
    {
      id: "dns-resolves",
      category: "dns",
      label: "DNS çözümleme",
      status: "pass",
      impact: 4,
      evidence: `${resolved.addresses.length} public IP adresi çözümlendi`,
      explanation: "Alan adının public internette çözümlenebilmesi temel erişilebilirlik sinyalidir; tek başına güvenilirlik kanıtı değildir.",
    },
  ];

  if (nameservers.length >= 2) {
    signals.push({
      id: "dns-nameservers",
      category: "dns",
      label: "Nameserver çeşitliliği",
      status: "pass",
      impact: 2,
      evidence: `${nameservers.length} nameserver kaydı bulundu`,
      explanation: "Birden fazla nameserver kaydı operasyonel dayanıklılık sinyali olabilir.",
    });
  } else {
    signals.push({
      id: "dns-nameservers",
      category: "dns",
      label: "Nameserver kaydı",
      status: "info",
      impact: 0,
      evidence: nameservers.length ? "Tek nameserver bulundu" : "Nameserver bilgisi alınamadı",
      explanation: "Bu veri eksik olduğunda site otomatik olarak riskli sayılmaz.",
    });
  }

  return {
    summary: {
      addresses: resolved.addresses.map((entry) => entry.address),
      nameservers,
      mxCount: mx.length,
      txtCount: txt.length,
    },
    signals,
  };
}

export async function analyzeRdap(hostname: string): Promise<{ summary: DomainSummary; signals: AnalysisSignal[] }> {
  const empty: DomainSummary = {
    registrationDate: null,
    ageDays: null,
    expirationDate: null,
    dnssec: null,
    rdapAvailable: false,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RDAP_TIMEOUT_MS);

  try {
    const response = await fetch(`https://rdap.org/domain/${encodeURIComponent(hostname)}`, {
      signal: controller.signal,
      redirect: "follow",
      headers: { accept: "application/rdap+json,application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        summary: empty,
        signals: [unknownRdapSignal()],
      };
    }

    const data = (await response.json()) as {
      events?: Array<{ eventAction?: string; eventDate?: string }>;
      secureDNS?: { delegationSigned?: boolean };
    };

    const registrationDate = findEvent(data.events, ["registration", "registered"]);
    const expirationDate = findEvent(data.events, ["expiration", "expiry"]);
    const ageDays = registrationDate
      ? Math.max(0, Math.floor((Date.now() - new Date(registrationDate).getTime()) / 86_400_000))
      : null;
    const dnssec = typeof data.secureDNS?.delegationSigned === "boolean" ? data.secureDNS.delegationSigned : null;

    const signals: AnalysisSignal[] = [];

    if (ageDays === null || !Number.isFinite(ageDays)) {
      signals.push({
        ...unknownRdapSignal(),
        evidence: "Kayıt tarihi RDAP yanıtında bulunamadı",
      });
    } else if (ageDays < 30) {
      signals.push({
        id: "domain-age",
        category: "domain",
        label: "Alan adı yaşı",
        status: "fail",
        impact: -18,
        evidence: `Yaklaşık ${ageDays} günlük domain`,
        explanation: "Çok yeni alan adları tek başına kötü niyet kanıtı değildir; ancak diğer risk sinyalleriyle birlikte dikkat gerektirir.",
      });
    } else if (ageDays < 180) {
      signals.push({
        id: "domain-age",
        category: "domain",
        label: "Alan adı yaşı",
        status: "warn",
        impact: -8,
        evidence: `Yaklaşık ${ageDays} günlük domain`,
        explanation: "Yeni sayılabilecek bir domain. Bu bulgu yalnız başına olumsuz hüküm üretmez.",
      });
    } else if (ageDays >= 365) {
      signals.push({
        id: "domain-age",
        category: "domain",
        label: "Alan adı geçmişi",
        status: "pass",
        impact: 6,
        evidence: `Yaklaşık ${Math.floor(ageDays / 365)} yıllık domain`,
        explanation: "Uzun süredir kayıtlı olmak olumlu bir süreklilik sinyalidir; sitenin bugün güvenli olduğuna tek başına garanti vermez.",
      });
    } else {
      signals.push({
        id: "domain-age",
        category: "domain",
        label: "Alan adı yaşı",
        status: "info",
        impact: 0,
        evidence: `Yaklaşık ${ageDays} günlük domain`,
        explanation: "Domain yaşı bağlam için gösterilir; bu aralıkta tek başına puan etkisi uygulanmaz.",
      });
    }

    if (dnssec === true) {
      signals.push({
        id: "dnssec",
        category: "dns",
        label: "DNSSEC",
        status: "pass",
        impact: 2,
        evidence: "RDAP verisinde delegasyon imzalı",
        explanation: "DNSSEC, DNS yanıtlarının bütünlüğünü doğrulamaya yardımcı olur.",
      });
    } else if (dnssec === false) {
      signals.push({
        id: "dnssec",
        category: "dns",
        label: "DNSSEC",
        status: "info",
        impact: 0,
        evidence: "Delegasyon imzalı görünmüyor",
        explanation: "DNSSEC olmaması tek başına güvensizlik göstergesi değildir.",
      });
    }

    return {
      summary: {
        registrationDate,
        ageDays: Number.isFinite(ageDays) ? ageDays : null,
        expirationDate,
        dnssec,
        rdapAvailable: true,
      },
      signals,
    };
  } catch {
    return { summary: empty, signals: [unknownRdapSignal()] };
  } finally {
    clearTimeout(timer);
  }
}

export function analyzeTransport(
  initialUrl: URL,
  finalUrl: URL,
  tls: TlsSummary,
  redirects: RedirectHop[],
): AnalysisSignal[] {
  const signals: AnalysisSignal[] = [];

  if (finalUrl.protocol === "https:") {
    signals.push({
      id: "https",
      category: "transport",
      label: "HTTPS bağlantısı",
      status: "pass",
      impact: 10,
      evidence: initialUrl.protocol === "http:" ? "HTTP isteği HTTPS'e yönlendirildi" : "Site HTTPS üzerinden açıldı",
      explanation: "HTTPS bağlantıyı şifreler; fakat tek başına sitenin güvenilir olduğunu göstermez.",
    });
  } else {
    signals.push({
      id: "https",
      category: "transport",
      label: "HTTPS bağlantısı",
      status: "fail",
      impact: -20,
      evidence: "Son sayfa HTTP üzerinden sunuluyor",
      explanation: "Şifrelenmemiş HTTP üzerinde girilen bilgiler ağ üzerinde daha kolay ele geçirilebilir.",
    });
  }

  if (tls.used) {
    if (tls.authorized) {
      signals.push({
        id: "tls-cert",
        category: "transport",
        label: "TLS sertifikası",
        status: "pass",
        impact: 8,
        evidence: tls.issuer ? `Doğrulandı · ${tls.issuer}` : "Sertifika zinciri doğrulandı",
        explanation: "Tarayıcının güven zincirine göre sertifika doğrulanabiliyor.",
      });
    } else {
      signals.push({
        id: "tls-cert",
        category: "transport",
        label: "TLS sertifikası",
        status: "fail",
        impact: -20,
        evidence: "Sertifika zinciri doğrulanamadı",
        explanation: "Geçersiz veya doğrulanamayan sertifika bağlantının kimlik doğrulamasını zayıflatır.",
      });
    }

    if (tls.daysRemaining !== null && tls.daysRemaining < 0) {
      signals.push({
        id: "tls-expiry",
        category: "transport",
        label: "Sertifika süresi",
        status: "fail",
        impact: -16,
        evidence: "Sertifikanın süresi dolmuş görünüyor",
        explanation: "Süresi geçmiş sertifikalar ciddi bağlantı uyarılarına neden olur.",
      });
    } else if (tls.daysRemaining !== null && tls.daysRemaining < 14) {
      signals.push({
        id: "tls-expiry",
        category: "transport",
        label: "Sertifika süresi",
        status: "warn",
        impact: -4,
        evidence: `${tls.daysRemaining} gün içinde sona eriyor`,
        explanation: "Sertifikanın yenilenme zamanı çok yakın.",
      });
    }
  }

  const crossHost = redirects.filter((hop) => hop.hostChanged);
  if (redirects.length > 0 && crossHost.length === 0) {
    signals.push({
      id: "redirect-chain",
      category: "redirect",
      label: "Yönlendirme zinciri",
      status: "pass",
      impact: 2,
      evidence: `${redirects.length} aynı-site yönlendirmesi`,
      explanation: "www veya HTTP→HTTPS gibi aynı site içindeki yönlendirmeler normal davranıştır.",
    });
  } else if (crossHost.length > 0) {
    signals.push({
      id: "redirect-chain",
      category: "redirect",
      label: "Alan adı değişen yönlendirme",
      status: crossHost.length > 1 ? "fail" : "warn",
      impact: crossHost.length > 1 ? -10 : -4,
      evidence: `${crossHost.length} yönlendirmede hostname değişti`,
      explanation: "Farklı alan adlarına yönlendirme meşru olabilir; ödeme ve giriş akışlarında özellikle kontrol edilmelidir.",
    });
  }

  if (redirects.length >= 4) {
    signals.push({
      id: "redirect-depth",
      category: "redirect",
      label: "Uzun yönlendirme zinciri",
      status: "warn",
      impact: -4,
      evidence: `${redirects.length} yönlendirme adımı`,
      explanation: "Uzun yönlendirme zincirleri kullanıcıdan gerçek hedefi gizleyebilir veya yanlış yapılandırmaya işaret edebilir.",
    });
  }

  if (!sameSiteHost(initialUrl.hostname, finalUrl.hostname)) {
    signals.push({
      id: "final-host-change",
      category: "redirect",
      label: "Son hedef alan adı",
      status: "warn",
      impact: -3,
      evidence: `${initialUrl.hostname} → ${finalUrl.hostname}`,
      explanation: "Girilen adres ile son açılan adres farklı. Kullanıcı son alan adını ayrıca kontrol etmelidir.",
    });
  }

  return signals;
}

export function analyzeHeaders(headers: IncomingHttpHeaders, isHttps: boolean, hasForms: boolean): AnalysisSignal[] {
  const signals: AnalysisSignal[] = [];
  const csp = header(headers, "content-security-policy");
  const hsts = header(headers, "strict-transport-security");
  const xcto = header(headers, "x-content-type-options");
  const frame = header(headers, "x-frame-options") || (csp?.includes("frame-ancestors") ? "CSP frame-ancestors" : null);
  const referrer = header(headers, "referrer-policy");

  signals.push(
    csp
      ? signal("csp", "headers", "Content Security Policy", "pass", 4, "CSP başlığı mevcut", "CSP, tarayıcıda çalışabilecek kaynakları sınırlandırarak bazı içerik enjeksiyonu risklerini azaltır.")
      : signal("csp", "headers", "Content Security Policy", hasForms ? "warn" : "info", hasForms ? -3 : 0, "CSP başlığı bulunamadı", "CSP eksikliği tek başına kötü niyet göstergesi değildir; form içeren sayfalarda savunma derinliğini azaltabilir."),
  );

  if (isHttps) {
    signals.push(
      hsts
        ? signal("hsts", "headers", "HSTS", "pass", 4, "Strict-Transport-Security mevcut", "HSTS tarayıcıyı sonraki bağlantılarda HTTPS kullanmaya zorlar.")
        : signal("hsts", "headers", "HSTS", "info", 0, "HSTS bulunamadı", "HSTS olmaması tek başına güvensizlik kararı üretmez."),
    );
  }

  if (xcto?.toLowerCase().includes("nosniff")) {
    signals.push(signal("nosniff", "headers", "MIME sniffing koruması", "pass", 2, "X-Content-Type-Options: nosniff", "Tarayıcının içerik türünü tahmin etmesini sınırlar."));
  }

  if (frame) {
    signals.push(signal("frame-protection", "headers", "Frame koruması", "pass", 2, frame, "Clickjacking riskini azaltmaya yardımcı olan bir frame politikası bulundu."));
  }

  if (referrer) {
    signals.push(signal("referrer-policy", "headers", "Referrer Policy", "pass", 1, referrer, "Başka sitelere gönderilen referrer bilgisini sınırlandıran bir politika mevcut."));
  }

  return signals;
}

export function analyzePage(
  body: string,
  pageUrl: URL,
  statusCode: number,
  contentType: string | null,
  bodyTruncated: boolean,
): { summary: PageSummary; signals: AnalysisSignal[] } {
  const title = firstMatch(body, /<title[^>]*>([\s\S]*?)<\/title>/i)?.replace(/<[^>]+>/g, "").trim() || null;
  const forms = [...body.matchAll(/<form\b[^>]*>/gi)];
  const passwordFields = [...body.matchAll(/<input\b[^>]*type\s*=\s*["']?password["']?[^>]*>/gi)].length;
  const formActions = forms
    .map((match) => attribute(match[0], "action"))
    .filter((value): value is string => Boolean(value));

  const externalFormActions: string[] = [];
  for (const action of formActions) {
    try {
      const target = new URL(action, pageUrl);
      if ((target.protocol === "http:" || target.protocol === "https:") && !sameSiteHost(target.hostname, pageUrl.hostname)) {
        externalFormActions.push(target.hostname);
      }
    } catch {
      // malformed actions are ignored as unknown rather than treated as malicious
    }
  }

  const iframes = [...body.matchAll(/<iframe\b[^>]*>/gi)];
  const externalIframes = iframes.reduce((count, match) => {
    const src = attribute(match[0], "src");
    if (!src) return count;
    try {
      return !sameSiteHost(new URL(src, pageUrl).hostname, pageUrl.hostname) ? count + 1 : count;
    } catch {
      return count;
    }
  }, 0);

  const scripts = [...body.matchAll(/<script\b[^>]*\bsrc\s*=\s*["'][^"']+["'][^>]*>/gi)];
  const externalScripts = scripts.reduce((count, match) => {
    const src = attribute(match[0], "src");
    if (!src) return count;
    try {
      return !sameSiteHost(new URL(src, pageUrl).hostname, pageUrl.hostname) ? count + 1 : count;
    } catch {
      return count;
    }
  }, 0);

  const hrefs = [...body.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map(
    (match) => `${match[1]} ${match[2].replace(/<[^>]+>/g, " ")}`.toLocaleLowerCase("tr-TR"),
  );
  const haystack = hrefs.join(" ");

  const hasContactLink = /(iletişim|iletisim|contact|hakkımızda|hakkimizda)/i.test(haystack);
  const hasPrivacyLink = /(gizlilik|privacy|kvkk|kişisel ver|kisisel ver)/i.test(haystack);
  const hasTermsLink = /(koşullar|kosullar|şartlar|sartlar|terms|kullanım|kullanim)/i.test(haystack);
  const hasRefundLink = /(iade|refund|cayma|iptal)/i.test(haystack);

  const signals: AnalysisSignal[] = [];

  if (statusCode >= 200 && statusCode < 400) {
    signals.push(signal("http-status", "content", "Sayfa erişimi", "pass", 3, `HTTP ${statusCode}`, "Sayfa normal bir HTTP yanıtı verdi."));
  } else if (statusCode >= 400) {
    signals.push(signal("http-status", "content", "Sayfa erişimi", "warn", -5, `HTTP ${statusCode}`, "Hata yanıtı, analizin görebildiği içeriği sınırlar."));
  }

  if (pageUrl.protocol === "http:" && passwordFields > 0) {
    signals.push(signal("password-http", "content", "Şifre alanı şifrelenmemiş bağlantıda", "fail", -25, `${passwordFields} parola alanı HTTP sayfasında`, "Şifrelerin HTTP üzerinden gönderilmesi ciddi bir güvenlik riskidir."));
  }

  if (externalFormActions.length > 0) {
    signals.push(signal("external-form", "content", "Harici form hedefi", "fail", -18, [...new Set(externalFormActions)].join(", "), "Form verileri görünen siteden farklı bir hostname'e gönderiliyor. Meşru ödeme sağlayıcıları mümkün olsa da kullanıcı hedefi doğrulamalıdır."));
  } else if (forms.length > 0) {
    signals.push(signal("form-targets", "content", "Form hedefleri", "pass", 3, `${forms.length} formda harici hostname görülmedi`, "İncelenen HTML içindeki form hedefleri aynı site sınırında görünüyor."));
  }

  if (externalIframes >= 3) {
    signals.push(signal("iframes", "content", "Harici iframe yoğunluğu", "warn", -3, `${externalIframes} harici iframe`, "Çok sayıda harici iframe sayfanın görünür içeriğini başka kaynaklardan yükleyebilir; kaynaklar ayrıca incelenmelidir."));
  }

  if (hasContactLink) {
    signals.push(signal("contact-link", "identity", "İletişim / kurumsal bağlantı", "pass", 2, "İletişim veya hakkında bağlantısı görüldü", "Kurumsal bilgiye erişim olumlu bir şeffaflık sinyalidir; içeriğin doğruluğunu garanti etmez."));
  }
  if (hasPrivacyLink) {
    signals.push(signal("privacy-link", "identity", "Gizlilik / KVKK bağlantısı", "pass", 2, "Gizlilik veya KVKK bağlantısı görüldü", "Veri işleme politikasının görünür olması olumlu bir şeffaflık sinyalidir."));
  }
  if (hasTermsLink) {
    signals.push(signal("terms-link", "identity", "Kullanım koşulları", "pass", 1, "Koşul veya şart bağlantısı görüldü", "Kullanım koşullarının görünür olması kullanıcıya işlem çerçevesini açıklar."));
  }

  if (pageUrl.hostname.startsWith("xn--") || pageUrl.hostname.includes(".xn--")) {
    signals.push(signal("punycode-host", "domain", "Punycode alan adı", "warn", -4, pageUrl.hostname, "Uluslararası alan adları meşru olabilir; benzer görünen karakterlerle taklit saldırılarında da kullanılabildiği için dikkat gerektirir."));
  }

  return {
    summary: {
      title,
      statusCode,
      contentType,
      forms: forms.length,
      passwordFields,
      externalFormActions: [...new Set(externalFormActions)],
      externalIframes,
      externalScripts,
      hasContactLink,
      hasPrivacyLink,
      hasTermsLink,
      hasRefundLink,
      bodyTruncated,
    },
    signals,
  };
}

function unknownRdapSignal(): AnalysisSignal {
  return {
    id: "domain-age",
    category: "domain",
    label: "Alan adı kayıt geçmişi",
    status: "info",
    impact: 0,
    evidence: "RDAP verisi alınamadı",
    explanation: "Kayıt verisinin alınamaması puanı düşürmez; bilinmeyen veri risk sinyali olarak kabul edilmez.",
  };
}

function findEvent(
  events: Array<{ eventAction?: string; eventDate?: string }> | undefined,
  actions: string[],
): string | null {
  if (!events) return null;
  const event = events.find((entry) => entry.eventAction && actions.includes(entry.eventAction.toLowerCase()));
  return event?.eventDate ?? null;
}

function header(headers: IncomingHttpHeaders, name: string): string | null {
  const value = headers[name];
  if (Array.isArray(value)) return value.join(", ");
  return value ?? null;
}

function firstMatch(input: string, pattern: RegExp): string | null {
  const match = input.match(pattern);
  return match?.[1] ?? null;
}

function attribute(tag: string, name: string): string | null {
  const quoted = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  if (quoted) return quoted[1];
  const bare = tag.match(new RegExp(`\\b${name}\\s*=\\s*([^\\s>]+)`, "i"));
  return bare?.[1] ?? null;
}

function signal(
  id: string,
  category: AnalysisSignal["category"],
  label: string,
  status: AnalysisSignal["status"],
  impact: number,
  evidence: string,
  explanation: string,
): AnalysisSignal {
  return { id, category, label, status, impact, evidence, explanation };
}
