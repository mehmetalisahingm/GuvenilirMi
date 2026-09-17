# GüvenilirMi — Visual System V2

Bu doküman tasarımın kendisi değil; kod içinde uygulanan görsel sistemin kısa kaydıdır.

## Yön

- Ana sayfa artık klasik SaaS landing değil, ürünün analiz motorunu sahneleyen sinematik bir deneyimdir.
- Merkez obje metalik dizüstü bilgisayar sahnesidir; ekranın içinde gerçek ürün dili kullanılır.
- Scroll ilerledikçe ürün üç duruma geçer: düşük risk, yüksek risk, kanıt katmanı.
- Renk sistemi güven/risk durumuna göre ortam ışığını değiştirir; yalnızca kart rengini değiştirmez.
- Büyük tipografi, düşük kontrast grid/noise, cam yüzeyler ve ince metalik highlight'lar görsel derinlik üretir.
- Hareketler içerikten bağımsız dekorasyon değil; tarama, puanlama ve sinyal ilişkisini anlatır.

## Ana deneyim katmanları

1. Hero + gerçek URL araması
2. Etkileşimli MacBook analiz sahnesi
3. Güven ilkeleri strip'i
4. Sticky üç aşamalı scroll hikâyesi
5. Teknik sinyal laboratuvarı
6. Kaynaklı istatistikler
7. Deterministik skor motoru görselleştirmesi
8. Canlı analize final CTA

## Erişilebilirlik ve performans

- `prefers-reduced-motion` desteklenir.
- Mobilde floating dekorasyonlar azaltılır ve cihaz kompozisyonu sadeleşir.
- Ana görseller CSS/HTML tabanlıdır; hero için ağır video veya büyük raster asset zorunluluğu yoktur.
- Kullanıcı URL araması doğrudan gerçek `/analiz` akışına bağlanır.
