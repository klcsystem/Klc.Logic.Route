using Dapper;
using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Geocoding;
using Klc.LogicRoute.Domain.Interfaces;
using Klc.LogicRoute.Application.CustomerEta.Services;
using Klc.LogicRoute.Application.ML.Pipeline;
using Klc.LogicRoute.Application.ML.Services;
using Klc.LogicRoute.Application.RouteOptimization.Services;
using Klc.LogicRoute.Application.Simulation.Services;
using Klc.LogicRoute.Application.DriverSkillMatching;
using Klc.LogicRoute.Application.TerritoryPlanning;
using Klc.LogicRoute.Infrastructure.ML;
using Klc.LogicRoute.Infrastructure.BackgroundJobs;
using Klc.LogicRoute.Infrastructure.ExternalServices.Email;
using Klc.LogicRoute.Infrastructure.ExternalServices.Routing;
using Klc.LogicRoute.Infrastructure.ExternalServices.Sms;
using Klc.LogicRoute.Infrastructure.Messaging;
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
        services.AddSingleton<SeedDataGenerator>();

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
        services.AddHttpClient("SapOData")
            .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback = (_, _, _, _) => true // SAP self-signed certs
            });
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

        // Repositories — Fleet (Vehicles + Drivers)
        services.AddScoped<IVehicleRepository, VehicleRepository>();
        services.AddScoped<IDriverRepository, DriverRepository>();

        // Repositories — Audit, Webhook, Invoice, Routing
        services.AddScoped<IAuditLogRepository, AuditLogRepository>();
        services.AddScoped<IInvoiceAuditRepository, InvoiceAuditRepository>();
        services.AddScoped<IWebhookEventRepository, WebhookEventRepository>();
        services.AddScoped<IRoutingRuleRepository, RoutingRuleRepository>();

        // CO2 & Notifications
        services.AddScoped<Application.CO2.ICO2CalculationService, Application.CO2.CO2CalculationService>();
        services.AddScoped<Application.Notifications.INotificationService, Application.Notifications.NotificationService>();

        // Geofencing
        services.AddScoped<Application.Geofencing.IGeofenceService, Application.Geofencing.GeofenceService>();

        // Invoice Audit & Routing Rules
        services.AddScoped<Application.InvoiceAudit.IInvoiceAuditService, Application.InvoiceAudit.InvoiceAuditService>();
        services.AddScoped<Application.RoutingRules.IRoutingRuleEngine, Application.RoutingRules.RoutingRuleEngine>();

        // Geocoding (decorator pattern: CachedGeocodingProvider -> NominatimGeocodingProvider)
        var nominatimBaseUrl = configuration["Geocoding:NominatimBaseUrl"] ?? "https://nominatim.openstreetmap.org/";
        services.AddHttpClient<NominatimGeocodingProvider>(client =>
        {
            client.BaseAddress = new Uri(nominatimBaseUrl);
            client.DefaultRequestHeaders.Add("User-Agent", "KlcLogicRoute/1.0");
            client.DefaultRequestHeaders.Add("Accept-Language", "tr");
            client.Timeout = TimeSpan.FromSeconds(10);
        });
        services.AddScoped<IGeocodingProvider, CachedGeocodingProvider>();
        services.AddScoped<IGeocodingService, GeocodingService>();

        // Services
        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddScoped<ICacheService, CacheService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        // Mobile — Driver Location, Proof of Delivery, Package Scanning
        services.AddScoped<IDriverLocationRepository, DriverLocationRepository>();
        services.AddScoped<IProofOfDeliveryRepository, ProofOfDeliveryRepository>();
        services.AddScoped<IPackageScanRepository, PackageScanRepository>();
        services.AddScoped<IFileStorageService, FileStorageService>();

        // Delivery Slots
        services.AddScoped<IDeliverySlotRepository, DeliverySlotRepository>();

        // Customer Tracking
        services.AddScoped<ICustomerTrackingRepository, CustomerTrackingRepository>();
        services.AddScoped<IEtaCalculationService, EtaCalculationService>();

        // Route Optimization
        services.AddScoped<IRouteOptimizationRepository, RouteOptimizationRepository>();
        services.AddScoped<IRecurringRouteRepository, RecurringRouteRepository>();
        services.AddScoped<IVrpSolverService, OrToolsVrpSolverService>();
        services.AddHttpClient<OsrmDistanceMatrixProvider>();
        services.AddScoped<OsrmDistanceMatrixProvider>();
        services.AddScoped<IDistanceMatrixProvider, TrafficAwareDistanceProvider>();
        services.AddScoped<IPlannedVsActualService, PlannedVsActualService>();
        services.AddScoped<IDynamicRerouteService, DynamicRerouteService>();

        // SMS Provider
        services.AddHttpClient<NetGsmSmsProvider>();
        services.AddScoped<ISmsProvider, NetGsmSmsProvider>();

        // Email Provider
        services.AddScoped<IEmailProvider, SmtpEmailProvider>();

        // Event Bus (RabbitMQ)
        services.AddSingleton<IEventBus, RabbitMqEventBus>();

        // Background Jobs
        services.AddHostedService<EtaCalculationJob>();

        // ML Services
        services.AddScoped<IMLModelRepository, MLModelRepository>();
        services.AddScoped<IPredictionLogRepository, PredictionLogRepository>();
        services.AddScoped<IMLPredictionService, DeliveryTimePredictionService>();
        services.AddSingleton<IMLModelStore, MLNetModelStore>();
        services.AddSingleton<ModelTrainingJob>();
        services.AddHostedService(sp => sp.GetRequiredService<ModelTrainingJob>());

        // Simulation (Digital Twin)
        services.AddScoped<ISimulationRepository, SimulationRepository>();
        services.AddScoped<ISimulationEngine, SimulationEngine>();

        // Territory Planning (K-means clustering)
        services.AddScoped<ITerritoryPlanningService, TerritoryPlanningService>();

        return services;
    }
}
