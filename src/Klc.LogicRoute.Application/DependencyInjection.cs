using FluentValidation;
using Klc.LogicRoute.Application.Analytics;
using Klc.LogicRoute.Application.Common.Behaviors;
using Klc.LogicRoute.Application.Learning;
using Klc.LogicRoute.Application.RouteOptimization.Services;
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

        return services;
    }
}
