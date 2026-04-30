# Klc.Logic.Route

Lojistiğin iyzico'su — Tek entegrasyon ile tüm taşıyıcılara erişim platformu.

## Canlı Demo

| Ortam | URL |
|-------|-----|
| **Production** | https://logicroute.klcsystem.com |
| **Local Frontend** | http://localhost:1640 |
| **Local API** | http://localhost:1641 |
| **Swagger** | http://localhost:1641/swagger |

---

## Giriş Bilgileri

### Varsayılan Admin Kullanıcı

| Alan | Değer |
|------|-------|
| **Email** | `admin@logicroute.com` |
| **Şifre** | `admin123` |
| **Rol** | Admin |
| **Tenant** | LogicRoute Default |
| **Tenant ID** | `00000000-0000-0000-0000-000000000001` |

### Kullanıcı Rolleri

| Rol | Açıklama | Yetkiler |
|-----|----------|----------|
| **Admin** | Tam sistem erişimi | Tüm modüller (CRUD + yönetim) |
| **LogisticsManager** | Lojistik yönetici | Sipariş, rota, araç, sürücü yönetimi + raporlar |
| **OperationsSpecialist** | Operasyon uzmanı | Sipariş/rota görüntüleme + yönetim |
| **Finance** | Finans/muhasebe | Anlaşma, fatura, rapor yönetimi |
| **Executive** | Üst yönetim | Sadece görüntüleme + rapor export |

---

## Altyapı Bilgileri

### Local Docker (docker-compose.yml)

| Servis | Port | Image | Kullanıcı | Şifre |
|--------|------|-------|-----------|-------|
| **Frontend** | `1640` | nginx:alpine | - | - |
| **API (.NET 10)** | `1641` | custom build | - | - |
| **PostgreSQL** | `1642` | postgres:16-alpine | `logicroute` | `logicroute123` |
| **Redis** | `1643` | redis:7-alpine | - | - |
| **RabbitMQ AMQP** | `1644` | rabbitmq:3-management-alpine | `logicroute` | `logicroute2026` |
| **RabbitMQ UI** | `1645` | (aynı container) | `logicroute` | `logicroute2026` |

### PostgreSQL Bağlantı Bilgileri (Local)

```
Host=localhost
Port=1642
Database=logicroute
Username=logicroute
Password=logicroute123
```

**Connection String:**
```
Host=localhost;Port=1642;Database=logicroute;Username=logicroute;Password=logicroute123
```

### PostgreSQL Bağlantı Bilgileri (Production)

```
Host=shared-postgres
Port=5432
Database=logicroute_db
Username=logicroute
Password=logicroute2026
```

### Redis Bağlantı Bilgileri

| Ortam | Bağlantı |
|-------|----------|
| Local | `localhost:1643` |
| Production | `shared-redis:6379` |

### RabbitMQ Bağlantı Bilgileri

| Ortam | Host | Port | Kullanıcı | Şifre | Management UI |
|-------|------|------|-----------|-------|---------------|
| Local | `localhost` | `1644` | `logicroute` | `logicroute2026` | http://localhost:1645 |
| Production | `shared-rabbitmq` | `5672` | `logicroute` | `logicroute2026` | - |

### JWT Ayarları

| Alan | Değer |
|------|-------|
| **Secret** | `LogicRoute-Super-Secret-Key-2026-Must-Be-At-Least-32-Characters!` |
| **Issuer** | `LogicRoute` |
| **Audience** | `LogicRoute` |
| **Expiration** | 60 dakika |
| **Algorithm** | HS256 |

---

## Çalıştırma

### Local Geliştirme

```bash
# Tüm servisleri başlat (PostgreSQL, Redis, RabbitMQ, API, Frontend)
docker compose up --build -d

# Sadece frontend dev server (hot reload)
cd web && npm run dev    # → http://localhost:3000

# Sadece backend
cd src && dotnet run --project Klc.LogicRoute.Api

# Testleri çalıştır
dotnet test    # → 323 test
```

### Production Deploy

```bash
# Sunucuda (shared-infra kullanır, kendi DB/Redis yok)
docker compose -f docker-compose.prod.yml up -d
```

---

## API Endpoint'leri

**Base URL:** `http://localhost:1641/api` (local) | `https://logicroute.klcsystem.com/api` (prod)

### Auth

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| POST | `/api/auth/login` | Giriş yap (email + password) | - |
| POST | `/api/auth/register` | Kayıt ol | - |
| GET | `/api/auth/me` | Mevcut kullanıcı bilgisi | Bearer |
| POST | `/api/auth/refresh` | Token yenile | Bearer |

### Siparişler

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| GET | `/api/orders` | Sipariş listesi | Bearer |
| GET | `/api/orders/{id}` | Sipariş detay | Bearer |
| POST | `/api/orders` | Yeni sipariş | Bearer |
| PUT | `/api/orders/{id}` | Sipariş güncelle | Bearer |
| PATCH | `/api/orders/{id}/status` | Durum güncelle | Bearer |
| DELETE | `/api/orders/{id}` | Sipariş sil | Bearer |
| GET | `/api/orders/count` | Sipariş sayısı | Bearer |

### Sevkiyatlar

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| GET | `/api/shipments` | Sevkiyat listesi | Bearer |
| GET | `/api/shipments/{id}` | Sevkiyat detay | Bearer |
| POST | `/api/shipments` | Yeni sevkiyat | Bearer |
| POST | `/api/shipments/{id}/calculate` | Karar motoru çalıştır | Bearer |
| POST | `/api/shipments/{id}/approve` | Sevkiyat onayla | Bearer |
| POST | `/api/shipments/{id}/send-to-provider` | Provider'a gönder | Bearer |
| GET | `/api/shipments/{id}/tracking` | Canlı takip | Bearer |
| POST | `/api/shipments/{id}/cancel` | İptal et | Bearer |
| PATCH | `/api/shipments/{id}/status` | Durum güncelle | Bearer |
| DELETE | `/api/shipments/{id}` | Sevkiyat sil | Bearer |
| GET | `/api/shipments/{id}/recommendation` | Öneri detay | Bearer |

### Kargo Hesaplama

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| POST | `/api/cargo/calculate/{orderId}` | Kargo hesapla (desi, chargeable weight) | Bearer |
| GET | `/api/cargo/detail/{orderId}` | Hesaplama sonucu | Bearer |

### Taşıyıcılar (Provider)

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| GET | `/api/providers` | Provider listesi | Bearer |
| GET | `/api/providers/{id}` | Provider detay | Bearer |
| POST | `/api/providers` | Yeni provider | Bearer |
| PUT | `/api/providers/{id}` | Provider güncelle | Bearer |
| DELETE | `/api/providers/{id}` | Provider sil | Bearer |

### Anlaşmalar (Contract)

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| GET | `/api/contracts` | Anlaşma listesi | Bearer |
| GET | `/api/contracts/{id}` | Anlaşma detay | Bearer |
| POST | `/api/contracts` | Yeni anlaşma | Bearer |
| PUT | `/api/contracts/{id}` | Anlaşma güncelle | Bearer |
| DELETE | `/api/contracts/{id}` | Anlaşma sil | Bearer |
| GET | `/api/contracts/{id}/rates` | Tarife listesi | Bearer |
| POST | `/api/contracts/{id}/rates` | Yeni tarife | Bearer |
| PUT | `/api/contracts/rates/{rateId}` | Tarife güncelle | Bearer |
| DELETE | `/api/contracts/rates/{rateId}` | Tarife sil | Bearer |

### Dashboard

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| GET | `/api/dashboard/summary` | Genel özet KPI'lar | Bearer |
| GET | `/api/dashboard/monthly-costs` | Aylık maliyet grafiği | Bearer |
| GET | `/api/dashboard/provider-costs` | Provider bazlı maliyet | Bearer |

### Raporlar

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| GET | `/api/reports/carrier-performance` | Taşıyıcı performans | Bearer |
| GET | `/api/reports/carrier-performance/{providerId}` | Tek taşıyıcı detay | Bearer |
| POST | `/api/reports/co2/calculate` | CO2 emisyon hesapla | Bearer |
| GET | `/api/reports/co2/shipment/{shipmentId}` | Sevkiyat CO2 | Bearer |

### Bildirimler

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| GET | `/api/notifications` | Bildirim listesi | Bearer |
| GET | `/api/notifications/unread-count` | Okunmamış sayısı | Bearer |
| PATCH | `/api/notifications/{id}/read` | Okundu işaretle | Bearer |
| PATCH | `/api/notifications/read-all` | Tümünü okundu | Bearer |

### Kullanıcı Yönetimi

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| GET | `/api/users` | Kullanıcı listesi | Bearer |
| GET | `/api/users/{id}` | Kullanıcı detay | Bearer |
| PUT | `/api/users/{id}` | Kullanıcı güncelle | Bearer |
| DELETE | `/api/users/{id}` | Kullanıcı sil | Bearer |
| GET | `/api/users/count` | Kullanıcı sayısı | Bearer |
| GET | `/api/users/roles` | Rol listesi | Bearer |

### Kural Motoru

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| GET | `/api/routing-rules` | Kural listesi | Bearer |
| GET | `/api/routing-rules/{id}` | Kural detay | Bearer |
| POST | `/api/routing-rules` | Yeni kural | Bearer |
| PUT | `/api/routing-rules/{id}` | Kural güncelle | Bearer |
| DELETE | `/api/routing-rules/{id}` | Kural sil | Bearer |

### Fatura Denetimi

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| GET | `/api/invoice-audits` | Fatura denetim listesi | Bearer |
| POST | `/api/invoice-audits/audit` | Fatura doğrula | Bearer |
| PATCH | `/api/invoice-audits/{id}/review` | İncelendi işaretle | Bearer |

### Audit Log

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| GET | `/api/audit` | Audit log listesi | Bearer |
| GET | `/api/audit/entity/{type}/{id}` | Entity bazlı log | Bearer |

### Webhook

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| POST | `/api/webhooks/receive/{providerCode}` | Provider webhook | Anonymous |
| GET | `/api/webhooks/events` | Webhook event listesi | Bearer |

### ERP Ayarları

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| GET | `/api/settings/erp-connections` | ERP bağlantı listesi | Bearer |
| GET | `/api/settings/erp-connections/{id}` | Bağlantı detay | Bearer |
| POST | `/api/settings/erp-connections` | Yeni bağlantı | Bearer |
| PUT | `/api/settings/erp-connections/{id}` | Bağlantı güncelle | Bearer |
| DELETE | `/api/settings/erp-connections/{id}` | Bağlantı sil | Bearer |
| POST | `/api/settings/erp-connections/{id}/test` | Bağlantı test | Bearer |
| POST | `/api/settings/erp-connections/{id}/sync` | Senkronizasyon | Bearer |

### Health Check

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| GET | `/api/health` | Sağlık kontrolü | - |
| GET | `/api/health/ready` | Hazırlık kontrolü | - |

---

## Veritabanı Şeması

### Schema: `auth`

| Tablo | Açıklama |
|-------|----------|
| `auth.tenants` | Multi-tenant firma bilgileri |
| `auth.users` | Kullanıcılar (email, password_hash, role) |
| `auth.operation_claims` | Roller (Admin, LogisticsManager, vb.) |
| `auth.user_operation_claims` | Rol-permission eşleştirme |

### Schema: `logistics`

| Tablo | Açıklama |
|-------|----------|
| `logistics.providers` | Lojistik sağlayıcılar (Yolda, Murat Lojistik vb.) |
| `logistics.contracts` | Anlaşmalar (provider ile sözleşme) |
| `logistics.contract_rates` | Tarife kalemleri (bölge/araç/ağırlık bazlı fiyat) |
| `logistics.orders` | Siparişler (ERP'den veya manuel) |
| `logistics.order_lines` | Sipariş kalemleri |
| `logistics.erp_connections` | ERP bağlantı ayarları |
| `logistics.shipments` | Sevkiyatlar |
| `logistics.shipment_items` | Sevkiyat kalemleri |
| `logistics.cargo_details` | Kargo hesaplama sonuçları |
| `logistics.recommendations` | Karar motoru önerileri |
| `logistics.carrier_performances` | Taşıyıcı performans metrikleri |
| `logistics.notifications` | Bildirimler |
| `logistics.audit_logs` | İşlem kayıtları |
| `logistics.invoice_audits` | Fatura denetim kayıtları |
| `logistics.webhook_events` | Webhook event'leri |
| `logistics.routing_rules` | Kural motoru kuralları |

### Migration Dosyaları

```
src/Klc.LogicRoute.Infrastructure/Persistence/
├── Migrations/
│   ├── 000_InitialSchema.sql      → auth schema (tenant, user, role, permission)
│   ├── 001_LogisticsSchema.sql    → provider, contract, order, erp_connection
│   ├── 002_ShipmentSchema.sql     → shipment, cargo_detail, recommendation
│   ├── 003_DashboardSchema.sql    → carrier_performance, notification
│   └── 004_AuditWebhookSchema.sql → audit_log, invoice_audit, webhook_event, routing_rule
└── AuthMigrations/
    └── 000_AuthSchema.sql         → Seed: 5 rol + admin kullanıcı + permission'lar
```

---

## Frontend Sayfaları (24 sayfa)

| Sayfa | Rota | Açıklama |
|-------|------|----------|
| Landing | `/` | Ana sayfa (beyaz-turuncu, Tirport tarzı) |
| Login | `/login` | Giriş (Gate.Aml split layout) |
| Dashboard | `/dashboard` | Rol bazlı dashboard (4 farklı görünüm) |
| Siparişler | `/orders` | Sipariş listesi + ERP sync |
| Sevkiyatlar | `/shipments` | Sevkiyat listesi + status pipeline |
| Sevkiyat Detay | `/shipments/:id` | Kargo kartları + recommendation + timeline |
| Rota Optimizasyon | `/route-optimization` | Provider karşılaştırma + scoring slider |
| Taşıyıcılar | `/carriers` | Provider CRUD |
| Anlaşmalar | `/contracts` | Anlaşma + tarife yönetimi |
| Onboarding | `/onboarding` | 5 adımlı kurulum wizard |
| Raporlar | `/reports` | Sekmeli: Maliyet / Performans / Teslimat |
| CO2 Raporu | `/co2` | Emisyon takibi + trend |
| Taşıyıcı Puanlama | `/carrier-scorecard` | Provider skorlama kartları |
| Pazar İstihbaratı | `/market-intelligence` | Pazar karşılaştırma |
| Canlı Takip | `/tracking` | Harita + araç listesi |
| Bildirimler | `/notifications` | Bildirim listesi + okundu yönetimi |
| Kullanıcılar | `/users` | Kullanıcı CRUD + rol atama |
| Kurallar | `/rules` | Kural builder (IF/THEN) |
| Ayarlar | `/settings` | Hub: ERP, bildirim, karar motoru ağırlıkları |
| ERP Bağlantı | `/settings/erp` | ERP bağlantı yönetimi |
| Fatura Denetimi | `/invoices` | Anlaşma vs fatura karşılaştırma |
| Audit Log | `/audit-logs` | İşlem geçmişi (Admin only) |

---

## Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| Backend | .NET 10, Clean Architecture, MediatR/CQRS, Dapper |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Messaging | RabbitMQ 3 + MassTransit |
| Auth | JWT Bearer (HS256) |
| Frontend | React 19, TypeScript, Vite, TailwindCSS 4 |
| Charts | Recharts |
| Router | React Router |
| Data Fetching | TanStack React Query |
| Docker | docker-compose, Nginx |
| CI/CD | GitHub Actions → DigitalOcean |
| Testler | xUnit, FluentAssertions, NSubstitute (323 test) |

---

## Proje Yapısı

```
Klc.Logic.Route/
├── src/
│   ├── Klc.LogicRoute.Api/           → 15 controller, 55+ endpoint
│   ├── Klc.LogicRoute.Application/   → CQRS handlers, 6 service
│   ├── Klc.LogicRoute.Domain/        → 21 entity, 13 enum
│   └── Klc.LogicRoute.Infrastructure/→ 16 repository, 3 adapter, 5 migration
├── tests/
│   ├── Klc.LogicRoute.Domain.Tests/
│   └── Klc.LogicRoute.Application.Tests/
├── web/                               → React 19 frontend (24 sayfa)
├── docs/
│   └── business-analysis.md           → İş analizi (18 bölüm + rakip analizi)
├── docker-compose.yml                 → Local geliştirme (port 1640-1645)
├── docker-compose.prod.yml            → Production (shared-infra)
└── .github/workflows/deploy.yml       → CI/CD
```

---

## Sunucu Bilgileri

| Alan | Değer |
|------|-------|
| **Sunucu** | DigitalOcean Droplet |
| **IP** | 139.59.209.134 |
| **Domain** | logicroute.klcsystem.com |
| **SSL** | Let's Encrypt (otomatik) |
| **Dizin** | /opt/logicroute |
| **Container'lar** | logicroute-api, logicroute-web |
| **Network** | shared-net (external) |
| **Reverse Proxy** | trustgate-nginx |
