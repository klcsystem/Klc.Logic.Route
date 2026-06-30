using FluentValidation;
using Klc.LogicRoute.Application.Analytics;
using Klc.LogicRoute.Application.Common.Behaviors;
using Klc.LogicRoute.Application.Fleet;
using Klc.LogicRoute.Application.Insurance;
using Klc.LogicRoute.Application.Learning;
using Klc.LogicRoute.Application.Marketplace;
using Klc.LogicRoute.Application.RouteOptimization.Services;
using Klc.LogicRoute.Application.Sustainability;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace Klc.LogicRoute.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = typeof(DependencyInjection).Assembly;

        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(assembly));
        services.AddValidatorsFromAssembly(assembly);
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

        // Analytics
        services.AddScoped<IDemandForecastService, DemandForecastService>();

        // Truck routing constraints
        services.AddScoped<ITruckRoutingService, TruckRoutingService>();

        // Self-Learning Engine
        services.AddScoped<ServiceTimeLearningService>();
        services.AddScoped<AddressLearningService>();
        services.AddScoped<TrafficPatternLearningService>();
        services.AddScoped<ILearningService, LearningService>();

        // Driver Familiarity Learning
        services.AddScoped<IDriverFamiliarityService, DriverFamiliarityService>();

        // Mid-Route Stop Addition
        services.AddScoped<IMidRouteStopService, MidRouteStopService>();

        // Faz F: Collaborative Logistics — Capacity Marketplace
        services.AddScoped<ICapacityMatchingService, CapacityMatchingService>();

        // Faz G: Carbon Credits — Sustainability & ESG
        services.AddScoped<ICarbonCreditService, CarbonCreditService>();

        // Faz H1: Insurance Marketplace
        services.AddScoped<IRiskScoringService, RiskScoringService>();
        services.AddScoped<IInsuranceService, InsuranceService>();

        // Hybrid Fleet / 3P Carrier Network
        services.AddScoped<IHybridFleetService, HybridFleetService>();

        return services;
    }
}
