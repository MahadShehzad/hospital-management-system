# ---- build ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY *.slnx ./
COPY Hospital.Api/Hospital.Api.csproj Hospital.Api/
COPY Hospital.Domain/Hospital.Domain.csproj Hospital.Domain/
COPY Hospital.Infrastructure/Hospital.Infrastructure.csproj Hospital.Infrastructure/
COPY Hospital.Tests/Hospital.Tests.csproj Hospital.Tests/
RUN dotnet restore Hospital.Api/Hospital.Api.csproj
COPY . .
RUN dotnet publish Hospital.Api/Hospital.Api.csproj -c Release -o /app --no-restore

# ---- runtime ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app ./
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "Hospital.Api.dll"]
