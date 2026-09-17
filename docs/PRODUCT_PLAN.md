# GüvenilirMi — Ürün ve Deneyim Planı

## 1. Ürün fikri

**GüvenilirMi**, kullanıcının ziyaret etmeyi düşündüğü bir web sitesini teknik ve açıkça açıklanabilir sinyaller üzerinden analiz eden web uygulamasıdır.

Ana cümle:

> **AI tahmini değil. Ölçülebilir sinyaller.**

Sistem hiçbir zaman “bu site %100 güvenlidir” garantisi vermez. Bunun yerine gözlemlediği sinyalleri, puana etkilerini ve belirsizlikleri açıklar.

---

## 2. Deneyim hedefi

Arayüz sıradan bir güvenlik paneli gibi görünmemeli. Kullanıcı ana sayfada aşağı indikçe ürünün nasıl düşündüğünü görmeli.

Referans alınan tasarım prensibi Oryzo.ai'daki sürekli scroll etkileşimi ve her bölümde yeni bir mikro-deneyim sunulmasıdır. Görsel dil veya içerik kopyalanmayacaktır.

### Ana sayfa akışı

1. **Hero — “Bir siteye güvenmeden önce bak.”**
   - Büyük URL alanı.
   - Koyu, güven veren, premium görsel dil.
   - Arka planda hafif ağ / domain / sinyal animasyonları.

2. **MacBook deneyimi — güvenli senaryo**
   - Sticky MacBook maketi.
   - Ekrana `guvenilirmi.com` yazılır.
   - Tarama çizgisi ekranı geçer.
   - Sonuç yeşile döner.
   - Örnek sinyaller: TLS geçerli, yönlendirme temiz, güvenlik başlıkları, domain sinyalleri.

3. **MacBook deneyimi — riskli senaryo**
   - Scroll devam edince aynı laptop yeni bir domaini tarar.
   - Ekran kırmızı / amber tonlarına geçer.
   - “Yeni domain”, “şüpheli yönlendirme”, “harici form hedefi” gibi sinyaller belirir.
   - Bu bölüm açıkça **ürün demosu** olarak etiketlenir; gerçek bir üçüncü taraf hakkında sahte iddia üretilmez.

4. **“Bir skor yetmez.” bölümü**
   - Güven skorunun katmanları ekranda ayrışır.
   - Domain, TLS, HTTP, sayfa yapısı, form davranışı, güvenlik başlıkları.
   - Kullanıcı her kartın üstüne geldiğinde puan etkisini görür.

5. **Neden gerekli? — kaynaklı veriler**
   - Türkiye: TÜİK 2025 Suç Mağduriyeti Araştırması — son bir yılda bireylerin %3,5'i bilişim suçlarına, %2,8'i tüketici dolandırıcılığına maruz kaldı.
   - Uluslararası bağlam: FTC 2025 verilerinde yaklaşık 3 milyon fraud bildirimi ve 15,9 milyar dolar bildirilen kayıp.
   - Her sayı yanında kaynak ve yıl bulunur. Kaynaksız sayaç kullanılmaz.

6. **Nasıl çalışır?**
   - URL normalize edilir.
   - Güvenli DNS çözümleme yapılır.
   - TLS / HTTP / redirect analizi yapılır.
   - Sayfa yapısı sınırlı ve güvenli biçimde incelenir.
   - Sinyaller deterministik skor motoruna girer.
   - Kullanıcıya puan + kanıt + açıklama gösterilir.

7. **Final CTA**
   - Yeniden URL alanı.
   - “Kontrol etmeden tıklama.” mesajı.

---

## 3. Görsel yön

- Arka plan: neredeyse siyah / grafit.
- Ana nötr: kırık beyaz.
- Güven: parlak ama neon olmayan yeşil.
- Risk: kontrollü kırmızı.
- Belirsizlik: amber.
- Kartlar: cam efekti yerine daha fiziksel, katmanlı yüzeyler.
- Büyük tipografi, bol boşluk, yüksek kontrast.
- Scroll animasyonları anlam taşımalı; yalnızca dekorasyon olmamalı.
- `prefers-reduced-motion` desteği zorunlu.
- Mobilde 3D yerine hafif CSS perspektifleri ve basitleştirilmiş geçişler kullanılabilir.

---

## 4. İlk teknik mimari

### Web
- Next.js 16 Active LTS
- React 19
- TypeScript
- Motion (scroll-linked ve mikro etkileşimler)

### Tarama motoru — AI yok

İlk gerçek tarayıcı aşağıdaki kaynaklardan skor çıkaracaktır:

- URL / hostname yapısı
- DNS A / AAAA kayıtları
- TLS sertifikası ve geçerlilik süresi
- HTTPS zorlaması
- Redirect zinciri
- HTTP güvenlik başlıkları
- HSTS
- CSP
- X-Content-Type-Options
- X-Frame-Options / `frame-ancestors`
- Referrer-Policy
- Form sayısı ve hedef domainleri
- Password alanları
- Harici iframe / script yoğunluğu (bağlama duyarlı)
- İletişim, gizlilik ve iade benzeri sayfaların varlığı (tek başına güven kanıtı sayılmaz)
- RDAP üzerinden alan adı kayıt sinyalleri

İleride ücretsiz/açık tehdit listeleri eklenebilir; ürün bunlara bağımlı tasarlanmayacaktır.

---

## 5. Skorlama prensibi

Skor `0–100` aralığında olacak ancak tek başına karar olarak sunulmayacaktır.

Örnek sınıflar:

- `80–100`: düşük gözlemlenen risk
- `60–79`: bazı sinyaller incelenmeli
- `40–59`: dikkat
- `0–39`: yüksek gözlemlenen risk

Her kural şunları taşır:

```ts
{
  id: "tls.valid",
  status: "pass" | "warn" | "fail" | "unknown",
  scoreDelta: 8,
  evidence: "Sertifika 2027-01-14 tarihine kadar geçerli.",
  explanation: "Geçerli TLS bağlantıyı şifreler; sitenin ticari güvenilirliğini tek başına kanıtlamaz."
}
```

**Unknown ≠ fail.** Veri alınamaması otomatik olarak dolandırıcılık sinyali sayılmaz.

---

## 6. Tarayıcı güvenliği — kritik

Kullanıcı tarafından girilen URL sunucumuzdan çağrılacağı için SSRF savunması bir özellik değil, temel gereksinimdir.

Zorunlu kontroller:

- yalnızca `http:` ve `https:`
- kullanıcı adı / parola içeren URL reddi
- beklenmeyen portları reddet
- hostname'i DNS ile çöz ve tüm A/AAAA adreslerini doğrula
- loopback, private, link-local, multicast ve reserved IP aralıklarını engelle
- `169.254.169.254` ve cloud metadata hedeflerini engelle
- her redirect sonrası DNS / IP kontrolünü yeniden yap
- maksimum redirect sınırı
- bağlantı ve toplam istek timeout'u
- maksimum indirilecek HTML boyutu
- dosya / binary indirmeme
- tarayıcı çalıştırılırsa sandbox + ağ politikaları

---

## 7. Yol haritası

### P0 — Foundation
- [x] Ürün ilkeleri
- [x] Görsel akış planı
- [ ] Next.js iskeleti
- [ ] Ana sayfa ilk görsel prototipi

### P1 — Interactive Landing
- Hero URL alanı
- Sticky MacBook
- Scroll ile güvenli → riskli → açıklamalı demo
- Kaynaklı istatistik bölümü
- Responsive ve reduced-motion

### P2 — Scanner Core
- URL normalizer
- SSRF guard
- DNS analyzer
- TLS analyzer
- HTTP / redirect analyzer
- Security header analyzer
- HTML signal analyzer
- Deterministik score engine

### P3 — Gerçek Sonuç Sayfası
- `/analiz/[domain]`
- skor özeti
- sinyal listesi
- kanıtlar
- teknik detaylar
- tarama zamanı ve veri tazeliği

### P4 — Veri ve büyüme
- PostgreSQL
- geçmiş taramalar
- aynı domain için cache / yeniden tarama politikası
- indekslenebilir domain raporlarında hukuki/SEO değerlendirmesi
- abuse / rate limiting

### P5 — Gelişmiş sinyaller
- açık tehdit listeleri
- phishing feed'leri
- favicon / marka taklidi sinyalleri
- sertifika geçmişi
- domain değişim geçmişi

---

## 8. Veri kaynakları

İstatistikler kaynak dosyasından yönetilecek; UI içine rastgele sayılar gömülmeyecek.

İlk doğrulanmış kaynaklar:

- TÜİK — Türkiye Suç Mağduriyeti Araştırması 2025: https://veriportali.tuik.gov.tr/tr/press/62061
- FTC — 2025 fraud verileri: https://www.ftc.gov/news-events/news/press-releases/2026/03/ftc-testifies-joint-economic-committee-agencys-efforts-combat-fraud

---

## 9. Başarı ölçütleri

İlk public sürüm için:

- kullanıcı 5 saniye içinde ürünün ne yaptığını anlamalı
- ilk ekranda URL girişi görünmeli
- mobil Lighthouse performansı görsel kalite uğruna çökertilmemeli
- her gerçek skor sinyali açıklanabilir olmalı
- kullanıcı verisi olmadan tarama yapılabilmeli
- AI / ücretli model API maliyeti `0`
