# GüvenilirMi

Bir web sitesine güvenmeden önce teknik sinyallerini kontrol eden, **AI kullanmadan** çalışan deterministik web güvenilirlik analiz platformu.

> **Ürün prensibi:** AI tahmini değil. Ölçülebilir sinyaller.

## Şu an çalışan kapsam

- Oryzo benzeri sürekli etkileşim fikrinden esinlenen özgün scroll tabanlı landing deneyimi
- Canlı URL analiz ekranı (`/analiz`)
- Node.js tabanlı gerçek tarama endpoint'i (`POST /api/analyze`)
- URL normalizasyonu ve SSRF savunması
- Public DNS çözümleme
- RDAP domain kayıt geçmişi (best effort)
- HTTPS/TLS sertifika sinyalleri
- Redirect zinciri ve hostname değişimi analizi
- Güvenlik header kontrolleri
- HTML form hedefleri, iframe/script ve görünür politika bağlantıları
- Deterministik 0–100 skor + ayrı confidence değeri
- Her puan etkisi için kullanıcıya gösterilen kanıt ve açıklama
- Basit rate limit ve 10 dakikalık instance cache
- Vitest testleri + GitHub Actions test/typecheck/build doğrulaması

## Güvenlik modeli

Tarayıcı kullanıcı tarafından verilen URL'lere sunucu tarafından istek attığı için SSRF ana tehditlerden biridir. Bu nedenle:

- yalnızca `http:` ve `https:` kabul edilir,
- `localhost`, özel ağ isimleri ve kullanıcı bilgili URL'ler reddedilir,
- private, loopback, link-local, CGNAT ve dokümantasyon/rezerve IP blokları reddedilir,
- hostname önce DNS ile çözülür,
- çözülen adres public değilse tarama yapılmaz,
- HTTP isteği doğrulanan IP'ye pinlenir,
- her redirect hedefi yeniden doğrulanır,
- redirect sayısı ve indirilen body boyutu sınırlıdır,
- bağlantı timeout ile kesilir.

Bu korumalar savunma derinliği sağlar; internetten URL fetch eden servisler üretimde ayrıca ağ seviyesinde egress politikaları ve gözlemleme ile korunmalıdır.

## Skor nasıl çalışır?

Skor bir yapay zeka çıktısı değildir. Sabit bir başlangıç puanına, ölçülen sinyallerin tanımlı etkileri eklenir/çıkarılır. Örneğin geçerli HTTPS/TLS olumlu sinyal üretirken, HTTP üzerinde parola alanı veya harici form hedefi güçlü risk sinyali üretir.

**Bilinmeyen veri otomatik olarak negatif kabul edilmez.** RDAP verisinin alınamaması gibi durumlar `info` olarak gösterilir ve puanı düşürmez. Ayrıca sonuçtan bağımsız bir `confidence` değeri hesaplanır; yeterli sinyal yoksa sistem zorla güvenli/güvensiz hükmü üretmez.

GüvenilirMi hiçbir zaman “bu site kesin güvenlidir” garantisi veya sertifikası vermez. Sonuç, tarama anında gözlemlenen teknik sinyallerin açıklanabilir değerlendirmesidir.

## Yerel geliştirme

Node.js 24 önerilir.

```bash
npm install
npm run dev
```

Ardından `http://localhost:3000` adresini aç.

Kalite kontrolleri:

```bash
npm test
npm run typecheck
npm run build
```

## API

```http
POST /api/analyze
Content-Type: application/json

{"url":"example.com"}
```

Endpoint bir analiz raporu veya açıklanabilir hata kodu döndürür. Servis exploit, brute force, login veya aktif saldırı yapmaz; herkese açık web katmanını okur.

## Teknik yığın

- Next.js 16
- React 19
- TypeScript
- Motion
- Node.js `dns`, `http`, `https`, `tls`, `net`
- Vitest

Ayrıntılı ürün planı: [`docs/PRODUCT_PLAN.md`](docs/PRODUCT_PLAN.md)
