# Klc.Logic.Route — Business Analysis

## 1. Vizyon & Pozisyonlama

### S: Klc.Logic.Route ne yapıyor?
**C:** Lojistik sektöründe bir ara katman (middleware/aggregator). Tıpkı iyzico'nun şirketleri bankalarla entegre olma yükünden kurtarması gibi, Klc.Logic.Route da şirketleri lojistik sağlayıcılarla (Yolda, Tırport vb.) tek tek API entegrasyonu yapma yükünden kurtarıyor.

### S: Problem ne?
**C:** Bir şirket (örn. Çatom) atık sevkiyatı yapacağında, şu an Yolda gibi tek bir lojistik firmasıyla çalışıyor. Yüke göre tır veya kamyon çağırıyor. Ancak alternatif firmalar devreye girdiğinde, hangi firmadan hangi araçla daha uygun taşıma yapılacağını karşılaştırmak manuel ve zahmetli bir süreç.

### S: Çözüm ne?
**C:** Klc.Logic.Route, şirketlerin ERP sistemleri (SAP, Logo vb.) veya başka uygulamalarıyla entegre oluyor. Taşıma ihtiyacı doğduğunda:
1. Birden fazla lojistik sağlayıcıdan otomatik teklif alıyor
2. Fiyat, araç tipi, teslimat süresi bazında karşılaştırma yapıyor
3. En optimal seçeneği otomatik belirliyor veya öneriyor
4. Şirket tek entegrasyonla tüm lojistik provider'lara erişiyor

### S: İş modeli ne?
**C:** SaaS (aylık abonelik), muhtemelen kullanım bazlı fiyatlandırma da olabilir.

### S: Hedef müşteriler kim?
**C:** Büyük şirketler — üreticiler, ihracatçılar, distribütörler. Atık yönetimi firmaları (Çatom örneği), üretim şirketleri, lojistik yoğun sektörler.

### S: Referans platformlar?
**C:**
- **Transporeon** — Avrupa'nın en büyük lojistik platformu, taşıyıcı-gönderici eşleştirme
- **SAP Transportation Management (SAP TM)** — ERP entegreli taşıma yönetimi
- **Project44** — Supply chain visibility, gerçek zamanlı takip
- **FourKites** — Real-time supply chain visibility

---

## 2. Temel Akış (DOĞRU MODEL)

> **KRİTİK ANLAYIŞ:** Bu sistem teklif toplama platformu DEĞİL. Firmalar zaten lojistik
> provider'larla anlaşma yapmış durumda. Sistem, mevcut anlaşma şartlarını karşılaştırarak
> en uygun seçeneği anında hesaplıyor. Teklif bekleme süreci yok.

### Ana Akış
```
1. Firma lojistik provider'larla anlaşma yapıyor (Yolda, Murat Lojistik vb.)
2. Anlaşma şartları sisteme tanımlanıyor (fiyat tarifesi, bölge, araç tipi, SLA)
3. Sevkiyat ihtiyacı doğuyor (ERP'den veya manuel)
4. Sistem anlaşma şartlarını karşılaştırıyor → en uygun provider + araç tipini hesaplıyor
5. Otomatik veya onaylı olarak sevkiyat emri provider API'sine iletiliyor
6. Takip başlıyor → Teslim → Tamamlandı
```

### Sevkiyat Durumları (Status Pipeline)
```
Taslak → Hesaplandı → Onay Bekliyor → Onaylandı → Provider'a İletildi → Araç Atandı → Yükleme → Yolda → Teslim Edildi → Tamamlandı
```
- İptal durumları: Pending aşamada ücretsiz, InTransit aşamada ücretli/engelli

### Anlaşma Şartları Tanımlama
Her provider için fiyat tarifesi çok boyutlu tanımlanacak:
- **Bölge bazlı:** Çıkış-varış kombinasyonları (İstanbul-Ankara: X TL/ton)
- **Araç tipi bazlı:** TIR, kamyon, parsiyel vb. için farklı tarifeler
- **Mesafe bazlı:** km başına ücret seçeneği
- **Ağırlık/hacim bazlı:** Kademe fiyatlandırma (0-5 ton: A TL, 5-10 ton: B TL)
- **Özel koşullar:** ADR surcharge, frigo surcharge, acil surcharge, hafta sonu farkı
- Kombinasyonlar desteklenecek (bölge + araç + ağırlık)

### Provider'a Sevkiyat İletimi
Sevkiyat emri provider API'si üzerinden otomatik oluşturulacak:
- Yolda → Yolda API'si (POST /shipments/v1)
- Diğer provider'lar → Kendi API'leri üzerinden
- Her provider adapter'ı sevkiyat oluşturma, durum sorgulama, takip fonksiyonlarını içerecek

---

## 3. Sipariş & Sevkiyat Detayları

### S: Sipariş kaynağı nereden geliyor?
**C:** Her ikisi de olacak:
- ERP entegrasyonu ile otomatik akış (SAP, Logo vb.)
- Platform üzerinden manuel giriş
- Farklı uygulamalardan API ile giriş

### S: Bir sipariş = bir sevkiyat mı? Konsolidasyon var mı?
**C:** Her ikisi de olacak:
- Tek sipariş = tek sevkiyat olabilir
- Birden fazla sipariş birleştirilerek tek sevkiyat (konsolidasyon) yapılabilir

### S: Bir sipariş birden fazla sevkiyata bölünebilir mi (parsiyel)?
**C:** Evet, her ikisi de desteklenecek. Hem konsolidasyon hem parsiyel bölme mümkün.

### S: Sevkiyat otomatik mi oluşuyor yoksa kullanıcı mı tetikliyor?
**C:** (CEVAP BEKLENİYOR — ERP'den gelen otomatik + manuel tetikleme her ikisi de mi?)

### S: Çıkış ve varış noktaları sabit mi yoksa değişken mi?
**C:** Her seferinde farklı olacak. Dinamik çıkış ve varış noktaları — sabit fabrika/depo varsayımı yok.

---

## 3. Taşıyıcı Seçim Süreci

### S: Karar mekanizması nasıl çalışıyor?
**C:** Her ikisi de desteklenecek:
- **Otomatik mod:** Kurallara göre sistem en uygun taşıyıcıyı otomatik seçer
- **Öneri modu:** Sistem seçenekleri sıralar, kullanıcı onaylar veya farklı seçer
- Firma bazlı konfigürasyon — bazı firmalar tam otomatik, bazıları manuel onay isteyebilir

### S: Kriter öncelikleri ne? Firma bazlı değişiyor mu?
**C:** Firma bazlı değişebilir. Her firma kendi öncelik ağırlıklarını belirleyebilecek:
- Fiyat (ağırlık: firma ayarlı)
- Teslimat süresi (ağırlık: firma ayarlı)
- Güvenilirlik / geçmiş performans (ağırlık: firma ayarlı)
- Araç uygunluğu (ADR, soğuk zincir vb.)

Örnek: Çatom → %60 fiyat, %25 süre, %15 güvenilirlik. Başka firma → %40 fiyat, %40 süre, %20 güvenilirlik.

### S: Fiyatlandırma modeli ne?
**C:** Anlaşma bazlı fiyatlandırma — firma zaten provider'larla anlaşmış durumda:
- **Ana model:** Önceden anlaşılmış tarifeler sisteme tanımlanır, sistem bu tarifeler üzerinden karşılaştırma yapar
- **Spot seçeneği:** İleride eklenebilir, ama ana akış anlaşma bazlı
- Teklif toplama/bekleme süreci YOK — hesaplama anında yapılıyor

### S: Kural bazlı otomatik atama var mı?
**C:** Evet, ancak kuralları müşteri kendisi belirleyecek. Kural motoru:
- Müşteri kendi tenant'ında kurallar tanımlayabilecek
- Örnek kurallar:
  - "İstanbul-Ankara arası → her zaman X Taşıyıcı"
  - "ADR yük → sadece Y ve Z Taşıyıcı arasından seç"
  - "10 ton üstü → TIR, otomatik en ucuz teklifi kabul et"
  - "Acil sevkiyat → sadece A Taşıyıcı"
- Kural öncelik sırası: özel kural > genel kural > sistem önerisi
- Kurallar Lojistik Müdürü veya Admin tarafından yönetilecek

---

## 4. Kargo & Araç Tipi Hesaplama

### S: Yük bilgisi nasıl tanımlanıyor?
**C:** SAP'deki tüm yük bilgileri olması gerekiyor:
- Ağırlık (brüt/net kg)
- Hacim (m3)
- Desi
- Palet sayısı, palet tipi
- Kutu/koli adedi
- Mal cinsi, ürün kategorisi
- Tehlikeli madde sınıfı (varsa)
- Sıcaklık gereksinimi (varsa)
- İstiflenebilirlik durumu

### S: Araç tipleri neler?
**C:** Tüm araç tipleri desteklenecek:
- Tır (TIR/mega/standart)
- Kamyon (çeşitli tonajlar)
- Parsiyel
- ADR (tehlikeli madde)
- Frigo (soğuk zincir)
- Tenteli
- Açık kasa
- Lowbed (ağır/gabari dışı yük)
- Konteyner taşıyıcı
- Ve diğerleri — provider'ın sunduğu tüm araç tipleri

### S: Araç seçim kuralı nasıl işliyor?
**C:** Tüm kombinasyonlar dikkate alınacak:
- Ağırlık eşikleri
- Hacim eşikleri
- Mal cinsi gereksinimleri (ADR, frigo, vb.)
- Palet/koli boyutları
- Konfigüre edilebilir kural seti

### S: Sadece atık sektörü mü?
**C:** Hayır, tüm sektörlere hitap edecek. Çatom bir örnek — sistem sektör bağımsız olacak. Yolda, Murat Lojistik gibi şirketlerin çalışabildiği tüm sektörlerle (üretim, ihracat, perakende, atık, inşaat, gıda, kimya vb.) çalışabilir olmalıyız. Sektöre özel kurallar (ADR belgesi, gıda taşıma sertifikası vb.) konfigürasyon ile tanımlanacak.

---

## 5. Entegrasyon Katmanı

### S: ERP entegrasyonu nasıl çalışacak?
**C:** 
- **SAP:** SOAP servisleri ile entegre olunacak. SAP tarafını kullanıcı (İbrahim) kendisi yazacak.
- **Logo, Netsis vb.:** İlerleyen fazlarda eklenecek, benzer SOAP/REST adapter pattern ile
- Müşteri ERP'si → SOAP → Klc.Logic.Route akışı

### S: Lojistik provider entegrasyonu nasıl çalışacak?
**C:**
- **Yolda:** API mevcut — https://apidocs.alfa.yolda.io/#tag/ShipmentsShipper/paths/~1shipments~1v1/post
- **Tırport ve diğerleri:** Tüm provider entegrasyonları bizim tarafımızdan yapılacak
- Her provider için özel adapter geliştirilecek (Yolda adapter, Tırport adapter, vb.)
- Bu bizim ana değer önerimiz — müşteri hiçbir provider ile uğraşmıyor, biz hepsini entegre ediyoruz
- Yeni provider eklemek = yeni adapter yazmak

### S: Takip (tracking) bilgisi provider'lardan çekilecek mi?
**C:** Evet, provider'lardan çekilecek. Araç konumu, teslimat durumu, tahmini varış süresi gibi bilgiler provider API'lerinden alınıp müşteriye tek ekranda gösterilecek.

---

## 6. Kullanıcı Rolleri & Yetkilendirme

### S: Hangi roller var?
**C:** Tüm roller desteklenecek:
- **Lojistik Müdürü** — tüm kararları görür/verir, taşıyıcı seçimi onaylar
- **Operasyon Uzmanı** — sevkiyat oluşturur, takip eder, günlük operasyonlar
- **Finans/Muhasebe** — raporları görür, maliyet analizleri, fatura takibi
- **Üst Yönetim (C-level)** — dashboard/KPI, özet raporlar
- **Sistem Admin** — provider yönetimi, ERP bağlantı ayarları, kullanıcı yönetimi, sistem konfigürasyonu

### S: Multi-tenant mi?
**C:** Evet, multi-tenant olacak. Her firma (Çatom, vb.) kendi tenant'ında izole çalışacak. Kendi verilerini, kendi ayarlarını, kendi kullanıcılarını görecek.

### S: Bir firmada birden fazla kullanıcı olabilir mi?
**C:** Evet. Bir tenant altında birden fazla kullanıcı farklı rollerle çalışabilir. Örneğin Çatom'dan 5 kişi: 1 lojistik müdürü, 2 operasyon uzmanı, 1 finans, 1 yönetici.

### S: Ekran bazlı yetkilendirme var mı? (read/write/görüntüleme)
**C:** Evet olacak. Rol bazlı ekran ve işlem yetkilendirmesi:

| Ekran | Üst Yönetim | Lojistik Müdürü | Operasyon Uzmanı | Finans | Admin |
|-------|:-----------:|:---------------:|:----------------:|:------:|:-----:|
| Dashboard | Kendi | Tam | Kendi | Kendi | Tam |
| Siparişler | Read | Read/Write | Read/Write | Read | Tam |
| Sevkiyatlar | Read | Read/Write | Read/Write | Read | Tam |
| Taşıyıcı Seçimi | - | Onay | Oluştur/Öner | - | Tam |
| Taşıyıcı Yönetimi | - | Read/Write | Read | - | Tam |
| Raporlar | Read | Read | Read | Read | Tam |
| Ayarlar | - | Kısıtlı | - | - | Tam |
| Kullanıcı Yönetimi | - | - | - | - | Tam |
| ERP Bağlantı | - | Read | - | - | Tam |
| Kural Yönetimi | - | Read/Write | Read | - | Tam |

---

## 7. Fiyatlandırma & Maliyet

---

## 11. Anlaşma Yönetimi

### S: Anlaşmaları kim girecek?
**C:** Müşteri kendisi girecek (self-service). Provider anlaşma şartlarını, fiyat tarifelerini müşteri tanımlayacak.

### S: Karar algoritması nasıl çalışacak?
**C:** Çok kriterli karar ama **öncelik en ucuz fiyat:**
1. Tüm uygun provider'lar filtrelenir (bölge, araç tipi, SLA uyumu)
2. Her provider'ın anlaşma tarifesinden fiyat hesaplanır
3. **Birincil kriter: En ucuz fiyat** (baz alınacak)
4. İkincil kriterler: Teslimat süresi, geçmiş performans (zamanında teslimat %)
5. Firma kendi ağırlıklarını değiştirebilir ama default = fiyat öncelikli
6. Sonuç: Sıralı öneri listesi (1. en uygun, 2. alternatif, 3. alternatif...)

### S: Anlaşma süresi var mı?
**C:** (CEVAP BEKLENİYOR — başlangıç/bitiş tarihi, otomatik yenileme?)

### S: Fiyatlandırma km bazlı mı?
**C:** Evet. Saha yöneticisi Esra Hanım'dan gelen bilgi: "Belli km'lere göre tır fiyatlarımız var, anlaşmalı." Yani fiyat tarife yapısı:
- **Km kademe bazlı:** 0-100 km → X TL, 100-300 km → Y TL, 300-500 km → Z TL gibi
- **Araç tipi bazlı:** Tır, kamyon, kamyonet için farklı tarifeler
- **Anlaşmalı sabit fiyatlar** — spot değil, önceden belirlenmiş km kademe fiyatları

**Etki:** ContractRate entity'sinde km kademe desteği eklendi (minDistanceKm/maxDistanceKm).

**Gerçek Tarife Örneği (Esra Hanım'dan):**
Tır için km bazlı TL/km fiyatları:
- 1-12 km: 5.410 TL/km (sabit baz fiyat)
- 13 km: 5.429 | 14 km: 5.466 | 15 km: 5.504
- 16 km: 5.541 | 17 km: 5.579 | 18 km: 5.616
- 19 km: 5.654 | 20 km: 5.691 | 21 km: 5.728
- 22 km: 5.766 | 23 km: 5.803 | 24 km: 5.841 | 25 km: 5.878
- 26 km: 7.246 | 27 km: 7.284 | 28 km: 7.321 | 29 km: 7.358 | 30 km: 7.396
Not: 25→26 km'de büyük fiyat sıçraması var (şehirlerarası tarife geçişi olabilir).
Hesaplama: Toplam fiyat = mesafe(km) × TL/km tarife

---

## 19. Provider Portal & Multi-Tenant Yapı

### S: Provider firmaları sisteme nasıl dahil olacak?
**C:** Her lojistik firma kendi tenant'ına sahip olacak:
- Kendi admin kullanıcısını oluşturabilir
- Kendi altına kullanıcı ekleyebilir
- Gelen siparişleri görebilir
- Sabit fiyat tarifelerini girebilir
- Teklif verebilir (gelen sipariş için)
- Şoför ve araç bilgilerini yönetebilir
- Sevkiyat durumlarını güncelleyebilir

### S: Provider portalında neler görünecek?
**C:** Provider firma portalı:
- Gelen siparişler listesi (teklif verilebilir)
- Sabit km/araç bazlı tarife tablosu girişi
- Araç filosu yönetimi (plaka, tip, tonaj, sigorta)
- Şoför yönetimi (ad, telefon, ehliyet)
- Atanmış sevkiyatlar + durum güncelleme
- Kendi performans metrikleri
- NOT: Fiyat bilgilerini, müşteri bilgilerini, diğer provider bilgilerini GÖRMEZ

### S: Provider firma admin ekranı nasıl olacak?
**C:** Her provider firmanın kendi tenant'ı olacak:
- Provider admin → kendi firması altına kullanıcı oluşturabilir
- Kullanıcılar sadece kendi firmasının verilerini görebilir
- Multi-tenant izolasyon — Yolda, Murat Lojistik her biri ayrı tenant

---

## 12. Müşteri Onboarding

### S: Yeni müşteri nasıl sisteme dahil oluyor?
**C:** Self-service stepper wizard ile müşteri kendisi kurulum yapacak:

**Adım 1 — Firma Bilgileri:**
- Şirket adı, vergi no, adres, sektör
- İletişim bilgileri
- Kullanıcı hesapları (admin + roller)

**Adım 2 — ERP Bağlantısı:**
- ERP tipi seçimi (SAP, Logo, Netsis, Diğer)
- Bağlantı bilgileri (SOAP endpoint, credentials)
- Bağlantı testi
- ERP kullanmıyorsa atlanabilir (manuel giriş)

**Adım 3 — Provider Seçimi & Anlaşma Tanımlama:**
- Çalıştığı lojistik provider'ları seçme (Yolda, Murat Lojistik, vb.)
- Her provider için anlaşma şartlarını girme:
  - Fiyat tarifeleri (bölge/araç/ağırlık bazlı)
  - SLA koşulları
  - Anlaşma başlangıç/bitiş tarihi
- İstediği kadar provider ekleyebilir

**Adım 4 — Tercihler & Kurallar:**
- Karar önceliği ayarları (fiyat ağırlığı, süre ağırlığı, vb.)
- Varsa özel kurallar (opsiyonel, sonra da eklenebilir)

**Adım 5 — Özet & Başlat:**
- Tüm bilgilerin özeti
- Onay → Sistem kullanıma hazır

---

## 14. Platform Yönetimi (Super Admin)

### S: Klc tarafında tüm tenant'ları yöneten bir admin paneli olacak mı?
**C:** Evet olacak. Super Admin paneli:
- Tüm tenant'ları listeleme (şirket bilgileri, aktif/pasif, kayıt tarihi)
- Tenant bazlı istatistikler (sevkiyat sayısı, provider kullanımı)
- Provider kataloğu yönetimi (yeni provider entegrasyonu ekleme/çıkarma)
- Faturalandırma durumu (tenant bazlı SaaS/usage raporları)
- Sistem sağlığı monitoring
- Tenant oluşturma/askıya alma/silme

---

## 15. Provider Kataloğu

### S: Provider seçimi nasıl çalışacak?
**C:** Hazır entegre provider kataloğu olacak:
- Sistem tarafında entegre edilmiş provider'lar bir katalogda listelenir (Yolda, Tırport, Murat Lojistik vb.)
- Müşteri onboarding'de veya sonradan provider seçer
- Müşteri kendi provider credentials'larını girer (API key, kullanıcı adı/şifre vb.)
- Bağlantı otomatik kurulur ve test edilir
- Fiyat tarifelerini müşteri tanımlar

**Provider ekleme akışı (müşteri tarafı):**
1. Katalogdan provider seç (örn. "Yolda")
2. Yolda'dan aldığı API credentials'larını gir
3. Bağlantı testi → başarılı
4. Anlaşma fiyat tarifelerini gir
5. Aktif et

**Yeni provider ekleme (Klc tarafı):**
- Klc ekibi yeni provider API'sini entegre eder (adapter yazar)
- Kataloga ekler
- Tüm tenant'lar artık bu provider'ı seçebilir

---

## 16. Dil Desteği

### S: Çoklu dil desteği var mı?
**C:** Evet, TR + EN desteklenecek:
- Türkçe (varsayılan)
- İngilizce (uluslararası müşteriler için)
- Gate.Aml'deki i18n pattern'i kullanılacak (I18nContext, translations objesi)
- Kullanıcı bazlı dil tercihi

---

## 18. Mobil Uygulama

### S: Mobil uygulama olacak mı?
**C:** İhtiyaç olursa evet:
- **Teknoloji:** Kotlin Compose Multiplatform (KMP) — iOS + Android tek kod tabanı
- **Öncelik:** Web önce, mobil ihtiyaç doğduğunda
- **Hedef kullanıcılar:** Operasyon uzmanları (sahada takip), üst yönetim (KPI görüntüleme)
- **Minimum özellikler:** Canlı takip, bildirimler, sevkiyat durumu, onay akışları

---

## 13. Fiyatlandırma & Maliyet

### S: Müşteriye faturalandırma nasıl?
**C:** Firma bazlı esnek fiyatlandırma — hepsi olabilir, şirkete göre değişir:
- **Sabit abonelik** — aylık/yıllık baz ücret
- **İşlem bazlı** — sevkiyat başına ücret
- **Hibrit** — baz ücret + işlem ücreti
- **Komisyon bazlı** — sağlanan tasarruf üzerinden yüzde
- Tenant ayarlarında fiyatlandırma modeli konfigüre edilecek

### S: Tasarruf hesaplama nasıl yapılacak?
**C:** (Karar: Üç katmanlı tasarruf hesaplama modeli)
1. **Teklif karşılaştırma tasarrufu:** Seçilen teklif vs. en pahalı teklif farkı (anlık)
2. **Dönemsel karşılaştırma:** Bu ayın ortalama birim maliyeti vs. önceki aylar (trend)
3. **Piyasa benchmark:** Sektör ortalamasına göre pozisyon (ilerleyen fazlarda, yeterli veri toplandığında)

---

## 8. Raporlama & Analytics

### S: Hangi KPI'lar önemli ve raporlar kimin için?
**C:** Rol bazlı farklı dashboard'lar gösterilecek:

**Üst Yönetim (C-level) Dashboard:**
- Toplam maliyet tasarrufu (TL + %)
- Aylık sevkiyat trendi
- Taşıyıcı bazlı maliyet dağılımı (pie chart)
- Bölge bazlı sevkiyat haritası
- SLA uyum oranı (genel)

**Lojistik Müdürü Dashboard:**
- Aktif sevkiyat sayısı ve durumları
- Taşıyıcı performans karşılaştırması (zamanında teslimat %)
- Araç tipi kullanım dağılımı
- Bekleyen onaylar
- Ortalama maliyet/sevkiyat trendi

**Operasyon Uzmanı Dashboard:**
- Bugünkü sevkiyatlar (timeline/kanban)
- Teklif bekleyen talepler
- Aktif takip (araçlar nerede)
- Geciken sevkiyatlar (alert)

**Finans/Muhasebe Dashboard:**
- Aylık/haftalık maliyet raporu
- Taşıyıcı bazlı fatura durumu
- Bütçe vs gerçekleşen karşılaştırma
- Tasarruf raporu detaylı

---

## 9. Özel Durumlar & Edge Cases

### S: İptal/değişiklik süreci nasıl?
**C:** Duruma göre değişen iptal kuralları:
- **Araç yola çıkmadan:** İptal edilebilir (ücretsiz veya şirket/provider politikasına göre)
- **Araç yola çıktıysa:** İptal edilemez. Gerçekten zorunlu ise iptal ücreti seçeneği sunulacak
- İptal ücreti şirkete ve sürece göre değişir — konfigüre edilebilir
- Sevkiyat durumuna göre iptal kuralları: Pending → ücretsiz iptal, Confirmed → koşullu, InTransit → ücretli/engelli

### S: Uluslararası taşımacılık var mı?
**C:** Evet, hepsi olacak:
- Yurtiçi taşımacılık
- İhracat (Türkiye → yurtdışı)
- İthalat (yurtdışı → Türkiye)
- Transit
- Gümrük süreçleri ile entegrasyon ihtiyacı doğabilir (ilerleyen fazlarda)

### S: Acil sevkiyat desteği var mı?
**C:** Evet olabilir. Acil talepler için:
- "Acil" öncelik seviyesi — normal sürecin dışında hızlandırılmış akış
- Farklı fiyat seçeneği (acil surcharge)
- Provider'lara acil flag ile teklif gönderme
- Öncelik seviyeleri: Normal, Öncelikli, Acil

### S: İade/geri dönüş yükü var mı?
**C:** Evet, ek seçenek olarak eklenecek:
- Geri dönüş yükü eşleştirme (boş araç geri dönmesin)
- Round-trip (gidiş-dönüş) sevkiyat oluşturma
- Bu özellik ilerleyen fazlarda optimize edilebilir (birden fazla müşterinin geri dönüş yüklerini eşleştirme)

### S: Tehlikeli madde (ADR) taşımacılığı var mı?
**C:** Evet, tüm sektörlere hitap edilecek — ADR, frigo, özel izin gerektiren tüm taşıma tipleri desteklenecek. Sektöre özel kurallar konfigürasyon ile tanımlanacak.

### S: Soğuk zincir (frigo) gereksinimi var mı?
**C:** Evet, araç tipleri arasında frigo da var. Sıcaklık gereksinimleri yük bilgisinde tanımlanacak.

---

## 10. Bildirim Sistemi

### S: Bildirimler ne zaman ve nasıl gidecek?
**C:** Tüm bildirim kanalları ve tetikleyiciler desteklenecek:

**Tetikleyiciler:**
- Yeni teklif geldiğinde
- Sevkiyat durumu değiştiğinde (onaylandı, yola çıktı, teslim edildi)
- Gecikme olduğunda (alert)
- Teklif süresi dolmak üzereyken
- İptal/değişiklik olduğunda
- ERP senkronizasyon durumu (başarılı/hatalı)

**Kanallar:**
- In-app bildirim (NotificationDropdown)
- Email bildirimi
- Her ikisi birden

Bildirim tercihleri kullanıcı/rol bazlı konfigüre edilebilir.

---

## 17. Rakip & Referans Platform Analizi

### Araştırılan Platformlar (12 adet)

| Platform | Ülke | Pozisyon | Ne Yapar |
|----------|------|----------|----------|
| **Transporeon** | Almanya | Nakliye pazar yeri | 1500+ gönderici, 210K taşıyıcı, AI otonom alım, fatura denetimi |
| **Project44** | ABD | Karar zekası | 700M+ günlük lojistik olay, AI ajanlar, çoklu mod TMS, tahminsel ETA |
| **FourKites** | ABD | Otonom kontrol kulesi | AI ajanlar (5 dijital çalışan), 1.1M taşıyıcı, %85 otonom çözüm |
| **Uber Freight** | ABD | Yönetilen taşımacılık | Fortune 500'ün 1/3'ü müşteri, $17B+ hacim, tahminsel ağ zekası |
| **Sennder** | Almanya | Dijital forwarder | 40K+ nakliyeci, 250K+ araç, sürdürülebilirlik metrikleri, CO2 takibi |
| **TIMOCOM** | Almanya | Dijital pazar yeri | 156K üye, 46 ülke, 20 saniyede teklif, 273K takip edilebilir araç |
| **Freightos** | İsrail | Dijital booking | 125+ nakliyeci, anlık fiyat karşılaştırma, Baltic Index, gümrük aracılığı |
| **Eurosender** | Slovenya | Kargo agregator | %70'e kadar indirim, 600K+ işletme, toplu satın alma modeli |
| **Flexport** | ABD | Global lojistik | Fabrika-kapı koordinasyonu, gümrük, kontrol kulesi, 10K+ müşteri |
| **Convoy** | ABD | Dijital pazar | Akıllı eşleştirme, mobil-ilk, broker araçları (DAT tarafından satın alındı) |

---

### Klc.Logic.Route İçin Uyarlanabilir Özellikler

> **Prensip:** Kendi vizyonumuza (anlaşma bazlı hesaplama motoru + provider agregator) sadık kalarak,
> rakiplerden sadece ürünümüzü güçlendirecek özellikleri alıyoruz.

#### A. Kesinlikle Ekleyelim (MVP veya Erken Fazlar)

| # | Özellik | Kaynak | Neden Uygun | Nasıl Uyarlanır |
|---|---------|--------|-------------|-----------------|
| 1 | **Tahminsel ETA (Predicted ETA)** | Project44, FourKites | Müşteriye "tahmini varış: 14:30" göstermek büyük değer | Provider tracking + geçmiş veri ile basit ETA tahmini |
| 2 | **Gecikme Uyarısı (Proaktif Alert)** | FourKites, Uber Freight | "Sevkiyat X gecikecek" bildirimi — reaktif değil proaktif | ETA vs. planlanan süre karşılaştırma → otomatik alert |
| 3 | **CO2 Emisyon Hesaplama** | Sennder | Sürdürülebilirlik raporu — büyük firmalar ESG için buna ihtiyaç duyuyor | Mesafe × araç tipi × yakıt tüketim katsayısı ile basit hesaplama |
| 4 | **Dijital CMR / e-İrsaliye** | Transporeon | Kağıtsız teslimat belgesi — yasal gereklilik yönünde ilerliyor | Dijital imza + PDF oluşturma, provider'dan belge çekme |
| 5 | **Otomatik Fatura Denetimi** | Transporeon | Anlaşma tarifesi vs. provider faturası karşılaştırma → tutarsızlık tespiti | Anlaşma fiyatı vs. gelen fatura otomatik eşleştirme |
| 6 | **Harita Üzerinde Canlı Takip** | Project44, FourKites, TIMOCOM | Tüm aktif sevkiyatları haritada görmek — operasyon için kritik | Provider tracking API → harita katmanı (Leaflet/Mapbox) |
| 7 | **Mobil Bildirim / Responsive** | Convoy | Operasyon uzmanları sahada, mobil erişim şart | Progressive Web App (PWA) veya responsive design |

#### B. Dahil Edilecek (İleri Fazlarda)

| # | Özellik | Kaynak | Nasıl Uyarlanır |
|---|---------|--------|-----------------|
| 8 | **AI Karar Önerisi** | Project44, FourKites | Geçmiş veri analizi → "bu rota için X provider %15 daha hızlı" önerisi, anomali tespiti |
| 9 | **Dönüş Yükü Eşleştirme (Backhaul)** | Convoy, TIMOCOM | Önce tek tenant içi round-trip, sonra cross-tenant eşleştirme |
| 10 | **Gümrük Entegrasyonu** | Freightos, Flexport | Uluslararası sevkiyatlarda gümrük belge yönetimi, HS kodu eşleştirme |
| 11 | **Taşıyıcı Puanlama Sistemi** | Uber Freight, Sennder | Zamanında teslimat %, hasar oranı, iletişim kalitesi → otomatik skor kartı |
| 12 | **Kontrol Kulesi Görünümü** | FourKites, Flexport | Tüm sevkiyatlar tek ekranda: harita + liste + filtre + alert'ler, multi-provider birleşik izleme |
| 13 | **Pazar İstihbaratı (Market Intelligence)** | Freightos (Baltic Index) | Platform üzerindeki anonimleştirilmiş veriden bölge/araç bazlı fiyat endeksi, trend gösterimi |
| 14 | **Sigorta Entegrasyonu** | Flexport | Sevkiyat oluşturulurken otomatik sigorta teklifi, partner sigorta şirketleri ile entegrasyon, yük değerine göre prim hesaplama |

#### C. Bizim İçin Uygun Değil (Almıyoruz)

| Özellik | Kaynak | Neden Almıyoruz |
|---------|--------|-----------------|
| Spot pazar yeri (yük ilanı) | TIMOCOM, Convoy | Biz pazar yeri değiliz, anlaşma bazlı çalışıyoruz |
| Taşıyıcı onboarding/doğrulama | Sennder, Uber Freight | Biz taşıyıcıyla değil, müşteri şirketle çalışıyoruz |
| Kargo forwarding | Flexport, Eurosender | Biz forwarder değiliz, karar motoru + agregatorüz |
| Broker araçları | Convoy | Broker iş modeli değiliz |
| Toplu satın alma ile indirim | Eurosender | Müşteriler kendi anlaşmalarını kullanıyor |

---

### Rakiplerden Öğrenilen Mimari Kararlar

1. **Telematics entegrasyonu** (TIMOCOM): Provider'ların telematics verisi (GPS, sıcaklık, kapı durumu) varsa çekilebilir
2. **Webhook tabanlı durum güncellemeleri** (Transporeon): Provider'lar bize durum değişikliğini push etsin (polling yerine)
3. **API-first yaklaşım** (Freightos): Müşteriler kendi uygulamalarından da bizi çağırabilsin (headless mod)
4. **Multi-modal destek** (Project44): Karayolu + denizyolu + havayolu — ilerleyen fazlarda
5. **Otonom karar ajanları** (FourKites): "Gecikme tespit edildi → otomatik alternatif provider'a yönlendir" — AI fazında
