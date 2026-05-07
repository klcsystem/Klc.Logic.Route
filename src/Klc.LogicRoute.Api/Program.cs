using System.Text;
using Klc.LogicRoute.Api.Hubs;
using Klc.LogicRoute.Api.Middleware;
using Klc.LogicRoute.Api.Services;
using Klc.LogicRoute.Application;
using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Infrastructure;
using Klc.LogicRoute.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Serilog
builder.Host.UseSerilog((context, config) =>
    config.ReadFrom.Configuration(context.Configuration));

// Services
builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        o.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Klc LogicRoute API",
        Version = "v1",
        Description = "Rota Optimizasyon ve Lojistik Yonetim Platformu API"
    });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header. Example: 'Bearer {token}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// JWT Authentication
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "LogicRoute-Super-Secret-Key-2026-Must-Be-At-Least-32-Characters!";
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.MapInboundClaims = false;

    // Allow SignalR to receive JWT via query string
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "LogicRoute",
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "LogicRoute",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        NameClaimType = "name",
        RoleClaimType = "role"
    };
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins(
            builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? ["http://localhost:1640"])
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ITenantProvider, TenantProvider>();

// SignalR
builder.Services.AddSignalR();

// Clean Architecture layers
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

// Initialize databases (two-phase)
using (var scope = app.Services.CreateScope())
{
    var dbInitializer = scope.ServiceProvider.GetRequiredService<DatabaseInitializer>();
    try
    {
        await dbInitializer.InitializeAsync();
    }
    catch (Exception ex)
    {
        Log.Warning(ex, "PostgreSQL schema initialization skipped - may not be available");
    }

    var authInitializer = scope.ServiceProvider.GetRequiredService<AuthDatabaseInitializer>();
    try
    {
        await authInitializer.InitializeAsync();
    }
    catch (Exception ex)
    {
        Log.Warning(ex, "PostgreSQL auth initialization skipped - may not be available");
    }

    // Seed realistic Turkish logistics data (idempotent — skips if data exists)
    var seedGenerator = scope.ServiceProvider.GetRequiredService<SeedDataGenerator>();
    try
    {
        await seedGenerator.SeedAsync();
    }
    catch (Exception ex)
    {
        Log.Warning(ex, "Seed data generation skipped - may not be available");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Klc LogicRoute API v1"));
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<AuditLogMiddleware>();
app.MapControllers();

// SignalR Hubs
app.MapHub<TrackingHub>("/hubs/tracking");
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHub<SimulationHub>("/hubs/simulation");

Log.Information("Klc LogicRoute API starting...");
app.Run();
