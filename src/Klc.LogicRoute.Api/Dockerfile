FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

COPY Klc.LogicRoute.Domain/Klc.LogicRoute.Domain.csproj Klc.LogicRoute.Domain/
COPY Klc.LogicRoute.Application/Klc.LogicRoute.Application.csproj Klc.LogicRoute.Application/
COPY Klc.LogicRoute.Infrastructure/Klc.LogicRoute.Infrastructure.csproj Klc.LogicRoute.Infrastructure/
COPY Klc.LogicRoute.Api/Klc.LogicRoute.Api.csproj Klc.LogicRoute.Api/
RUN dotnet restore Klc.LogicRoute.Api/Klc.LogicRoute.Api.csproj

COPY . .
RUN dotnet publish Klc.LogicRoute.Api/Klc.LogicRoute.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS runtime
WORKDIR /app
COPY --from=build /app/publish .

COPY Klc.LogicRoute.Infrastructure/Persistence/Migrations/ /app/Persistence/Migrations/
COPY Klc.LogicRoute.Infrastructure/Persistence/AuthMigrations/ /app/Persistence/AuthMigrations/

EXPOSE 8080
ENTRYPOINT ["dotnet", "Klc.LogicRoute.Api.dll"]
