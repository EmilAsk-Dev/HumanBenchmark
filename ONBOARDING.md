# Onboarding — Snabbguide för nya bidragsgivare

Välkommen! Den här filen hjälper dig att köra projektet lokalt och pekar ut viktiga delar i kodbasen.

## 1) Förutsättningar

- .NET SDK 10 (`dotnet --version`)
- Node.js (>=18 rekommenderas) + npm
- Valfritt: Visual Studio / VS Code

## 2) Klona & initial konfiguration

Kör följande kommandon:

    git clone <repo-url>
    cd HumanBenchmark
    npm run install:all

## 3) Miljövariabler

Skapa följande filer och värden:

- `apps/Api/.env` (exempel)
  - ASPNETCORE_ENVIRONMENT=Development
  - ASPNETCORE_URLS=http://localhost:5014
  - CONNECTION_STRING=Server=(localdb)\\MSSQLLocalDB;Database=HumanBenchmarkDb;Trusted_Connection=True;TrustServerCertificate=True;

- `apps/Web/.env` (exempel)
  - VITE_PORT=5173
  - VITE_API_BASE_URL=http://localhost:5014

## 4) Kör lokalt

- Starta båda apparna: `npm run dev`
- Starta endast API: `npm run dev:api`
- Starta endast Web: `npm run dev:web`

Öppna: `http://localhost:5173/` (webb) — API-hälsa: `http://localhost:5014/health`

## 5) Tester

- API: `npm run test:api` (kör `dotnet test`)
- Web: `npm --prefix apps/Web run test` (vitest)

## 6) Vanliga utvecklaruppgifter

- Lägg till EF-migrering: `npm run db:add -- <Namn>`
- Tillämpa migreringar: `npm run db:update`
- Bygg webb för produktion: `npm --prefix apps/Web run build`

## 7) Var du ska titta i repot

- `apps/Api/` — backend (C#, EF Core, OpenAPI)
- `apps/Web/` — frontend (React + Vite + TypeScript)
- `apps/Api.Tests/` — enhets- och integrationstester för API

## 8) Hjälpsamma länkar

- API OpenAPI-specifikation: `http://localhost:5014/openapi/index.json`
