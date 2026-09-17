# GüvenilirMi

Bir web sitesine güvenmeden önce teknik sinyallerini kontrol eden, AI kullanmadan çalışan deterministik web güvenilirlik analiz platformu.

> **Ürün prensibi:** AI tahmini değil. Ölçülebilir sinyaller.

## Durum

Proje başlangıç aşamasında. İlk hedef, etkileşimli ürün hikâyesi + gerçek teknik tarama motorunun güvenli temellerini oluşturmak.

## Hedef deneyim

Kullanıcı bir URL girer; sistem alan adı, TLS/HTTPS, DNS, HTTP yönlendirmeleri, güvenlik başlıkları, sayfa yapısı ve açık web sinyallerini inceleyerek açıklanabilir bir güven skoru üretir.

Skor hiçbir zaman “bu site kesin güvenlidir” garantisi olarak sunulmaz. Sonuç, gözlemlenen sinyallerin risk değerlendirmesidir.

## İlkeler

- AI / LLM API yok.
- Ücretli analiz API'sine bağımlılık yok.
- Her puan değişiminin kullanıcıya açıklanabilir nedeni var.
- SSRF ve zararlı URL savunmaları, tarama motorunun temel parçası.
- İstatistikler yalnızca doğrulanabilir ve kaynak gösterilebilir verilerden gelir.
- Görsel deneyim; scroll, mikro-etkileşim ve veri görselleştirmeleriyle ürünün nasıl çalıştığını anlatır.

Ayrıntılı plan: `docs/PRODUCT_PLAN.md`.
