using Dapper;
using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Domain.Interfaces;
using Klc.LogicRoute.Infrastructure.Persistence;
using Klc.LogicRoute.Infrastructure.Persistence.Repositories;
using Klc.LogicRoute.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;

namespace Klc.LogicRoute.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Enable Dapper snake_case to PascalCase mapping
        DefaultTypeMap.MatchNamesWithUnderscores = true;

        // PostgreSQL
        services.AddSingleton<IPostgresConnectionFactory, PostgresConnectionFactory>();
        services.AddSingleton<DatabaseInitializer>();
        services.AddSingleton<AuthDatabaseInitializer>();

        // Redis
        var redisConnection = configuration.GetConnectionString("Redis") ?? "localhost:2703";
        services.AddSingleton<IConnectionMultiplexer>(ConnectionMultiplexer.Connect(redisConnection));

        // Repositories — Auth
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IRoleRepository, RoleRepository>();

        // Repositories — Logistics
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IProviderRepository, ProviderRepository>();
        services.AddScoped<IContractRepository, ContractRepository>();
        services.AddScoped<IErpConnectionRepository, ErpConnectionRepository>();

        // Repositories — Shipments & Decision Engine
        services.AddScoped<IShipmentRepository, ShipmentRepository>();
        services.AddScoped<IRecommendationRepository, RecommendationRepository>();
        services.AddScoped<ICargoDetailRepository, CargoDetailRepository>();

        // ERP Adapters
        services.AddScoped<IErpAdapter, ExternalServices.Erp.SapAdapter>();
        services.AddScoped<IErpAdapter, ExternalServices.Erp.GenericErpAdapter>();

        // Provider API Adapters
        services.AddScoped<ExternalServices.Providers.IProviderApiAdapter, ExternalServices.Providers.YoldaProviderAdapter>();

        // Repositories — Dashboard & Notifications
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<ICarrierPerformanceRepository, CarrierPerformanceRepository>();
        services.AddScoped<IDashboardRepository, DashboardRepository>();

        // Cargo Calculation & Decision Engine
        services.AddScoped<Application.CargoCalculation.ICargoCalculationService, Application.CargoCalculation.CargoCalculationService>();
        services.AddScoped<Application.DecisionEngine.IDecisionEngineService, Application.DecisionEngine.DecisionEngineService>();

        // Repositories — Audit, Webhook, Invoice, Routing
        services.AddScoped<IAuditLogRepository, AuditLogRepository>();
        services.AddScoped<IInvoiceAuditRepository, InvoiceAuditRepository>();
        services.AddScoped<IWebhookEventRepository, WebhookEventRepository>();
        services.AddScoped<IRoutingRuleRepository, RoutingRuleRepository>();

        // CO2 & Notifications
        services.AddScoped<Application.CO2.ICO2CalculationService, Application.CO2.CO2CalculationService>();
        services.AddScoped<Application.Notifications.INotificationService, Application.Notifications.NotificationService>();

        // Invoice Audit & Routing Rules
        services.AddScoped<Application.InvoiceAudit.IInvoiceAuditService, Application.InvoiceAudit.InvoiceAuditService>();
        services.AddScoped<Application.RoutingRules.IRoutingRuleEngine, Application.RoutingRules.RoutingRuleEngine>();

        // Services
        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddScoped<ICacheService, CacheService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        return services;
    }
}
