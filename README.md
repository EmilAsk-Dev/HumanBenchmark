# HumanBenchmark

Monorepo med:
- **API**: ASP.NET Core (.NET 10) i `apps/Api`
- **Webb**: React + Vite i `apps/Web`

Projektet använder en `.env`-fil i repo-roten för portar och connection string.

---

## Förkrav

Installera följande:

- **Node.js** (rekommenderat LTS)
- **.NET SDK 10.0**
- (Valfritt men rekommenderat) **dotnet-ef** för migrationer:
  ```bash
  dotnet tool install --global dotnet-ef


