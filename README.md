# HumanBenchmark

Monorepo med:

- **API**: ASP.NET Core (.NET 10) i `apps/Api`
- **Webb**: React + Vite i `apps/Web`
  för att köra med prod kör I root "dotnet publish .\apps\Api -c Release -o .\apps\Api\out"

Projektet är byggt för att du ska kunna köra **allt från repo-roten** med npm-scripts.

---

## Förkrav

Installera följande innan du börjar:

- **.NET SDK 10**  
  Kontrollera:
  dotnet --version
  Har du en tidigare version än 10.0.100 Installera
  -> https://dotnet.microsoft.com/en-us/download/dotnet/thank-you/sdk-10.0.101-windows-x64-installer

### 2) Skapa `.env` i repo-roten (obligatoriskt)

Skapa filen `HumanBenchmark/apps/Api/Api.env`.

#Api
ASPNETCORE_ENVIRONMENT=Development
ASPNETCORE_URLS=http://localhost:5014
CONNECTION_STRING=Server=(localdb)\MSSQLLocalDB;Database=HumanBenchmarkDb;Trusted_Connection=True;TrustServerCertificate=True;

Skapa filen `HumanBenchmark/apps/Web/Api.env`.

#Web
VITE_PORT=5173
VITE_API_BASE_URL=http://localhost:5014

---

## Installera beroenden

Allt du behöver (root + webb + .NET restore) kör du med:

```bash
npm run install:all
```

Det scriptet gör:

- `npm install` (repo-roten)
- `npm --prefix apps/Web install` (React/Vite)
- `dotnet restore apps/Api` (API)

---

## Starta projektet

### Starta API + Webb (öppnar båda i webbläsaren)

```bash
npm run dev
```

Startar:

- API: `dotnet run --project apps/Api`
- Webb: `npm --prefix apps/Web run dev`
- Öppnar web + api via `scripts/open-dev.mjs`

### Starta bara API (öppnar API)

```bash
npm run dev:api
```

### Starta bara Webb (öppnar webb)

```bash
npm run dev:web
```

---

## URL:er

Default enligt `.env`:

- **Webb:** `http://localhost:5173/`
- **API (Scalar på /):** `http://localhost:5014/`
- **Health endpoint:** `http://localhost:5014/health`

---

## Databas & migrationer (EF Core)

> Alla kommandon körs från repo-roten och laddar `.env` automatiskt.

### Skapa en migration

Du anger namnet efter `--`:

```bash
npm run db:add -- InitIdentity
```

Exempel:

```bash
npm run db:add -- AddScores
```

### Uppdatera databasen (apply migrations)

```bash
npm run db:update
```

### Ta bort senaste migrationen

```bash
npm run db:remove
```

---

## Scripts (package.json)

Dessa scripts finns i repo-roten:

- `npm run dev`
  - Startar API + Webb och kör `scripts/open-dev.mjs`

- `npm run dev:api`
  - Startar bara API och kör `scripts/open-api.mjs`

- `npm run dev:web`
  - Startar bara Webb och kör `scripts/open-web.mjs`

- `npm run install:all`
  - Installerar dependencies i root + web och kör `dotnet restore` för API

- `npm run db:add -- <MigrationName>`
  - Skapar en ny EF Core migration

- `npm run db:update`
  - Kör `dotnet ef database update`

- `npm run db:remove`
  - Tar bort senaste migrationen

---
