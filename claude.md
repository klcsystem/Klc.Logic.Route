# Klc.Logic.Route

Rota Optimizasyon ve Lojistik Yonetim Platformu.

## Mimari
- Clean Architecture: Domain / Application / Infrastructure / Api
- Gate.Aml pattern birebir (Dapper + Npgsql, EF Core YOK)
- Multi-tenant (TenantId her entity'de)
- CQRS: MediatR 14.1.0
- Validation: FluentValidation 12.1.1
- Auth: JWT Bearer (HS256), BCrypt password hashing
- DB: PostgreSQL 16 + Dapper (snake_case mapping)
- Cache: Redis 7
- Queue: RabbitMQ 3 (MassTransit sonraki fazda)

## Proje Yapisi
```
Klc.Logic.Route/
├── Klc.Logic.Route.sln
├── docker-compose.yml
├── src/
│   ├── Klc.LogicRoute.Api/        (port 2701)
│   ├── Klc.LogicRoute.Application/
│   ├── Klc.LogicRoute.Domain/
│   └── Klc.LogicRoute.Infrastructure/
├── tests/
│   ├── Klc.LogicRoute.Tests.Unit/
│   └── Klc.LogicRoute.Tests.Integration/
└── web/                            (port 2700)
```

## Docker Portlari
- 2700: Web (frontend)
- 2701: API
- 2702: PostgreSQL
- 2703: Redis
- 2704: RabbitMQ (AMQP)
- 2705: RabbitMQ (Management UI)

## Roller
Admin, LogisticsManager, OperationsSpecialist, Finance, Executive

## Varsayilan Kullanici
- ibrahim.kilic@klcsystem.com / Admin123!

## Build
```bash
dotnet build Klc.Logic.Route.sln
```

## Komutlar
```bash
docker compose up -d          # Tum servisleri baslat
dotnet run --project src/Klc.LogicRoute.Api  # API'yi lokal calistir
```
