# Projektanalys – HumanBenchmark

Datum: 2026-02-11

## 1. Användarnas lösning

### Viktigaste användarflödena
- **Registrera / logga in** via `POST /api/auth/register` och `POST /api/auth/login` (ASP.NET Identity cookie) → frontend hämtar session via `GET /api/auth/me`.
- **Köra tester** (Reaction/Typing/Sequence/Chimp) → spara resultat/attempts i API → visa resultat i UI.
- **Feed**: skapa post kopplad till attempt → se feed → likea → kommentera (inkl. svarstrådar).
- **Friends**: skicka/ta emot friend requests → acceptera/ta bort vän → se vänner och deras status.
- **Meddelanden & notiser (realtime)**: chat och notifications via SignalR (`/hubs/chat`, `/hubs/notifications`).
- **Leaderboards**: hämta topplistor per spel och tidsfilter (frontend hook + API service).
- **Profil**: se profil (nu begränsad till “self eller friend”).

### Saker som medvetet inte byggdes / begränsningar
- **Roller/policies** per feature är inte utbyggt i någon större grad (mest `[Authorize]` + specifika “friendship checks”).
- **E2E-testning** (smoke tests för auth → feed → friends → chat) saknas.
- **Full observability** (dashboards/alerts, metrics, SLO) är inte färdig – endast grundläggande loggning + App Insights i prod.
- **MFA / e-postverifiering / password reset** finns inte som komplett produktflöde.

## 2. Arkitektur & ansvar

### Övergripande arkitektur
- **Monorepo** med två huvudappar:
  - `apps/Api` = ASP.NET Core API (EF Core + Identity + SignalR).
  - `apps/web` = React + Vite + shadcn/ui (byggs och kopieras till API:s `wwwroot` i pipeline).
- API:t är **feature-organiserat** (`apps/Api/Features/*`) med controllers + services + DTOs.

### Kommunikation mellan systemdelar
- **Frontend → API**: HTTP (fetch) med `credentials: "include"` (cookie-baserad auth).
- **Realtime**: SignalR hubs för chat och notifications.
- **Extern tjänst (AI)**: Content moderation via `Azure.AI.OpenAI` (styrt av env-var `AZURE_OPENAI_API_KEY`).

### Ansvar mellan moduler/komponenter
- **Backend**
  - Controllers: endpoints + authz-gräns.
  - Services: affärslogik och datalager (EF Core).
  - Domain: entiteter (t.ex. Post/Comment/Friendship).
- **Frontend**
  - Pages: route-nivå (`src/pages/*`).
  - Hooks/contexts: datafetch/auth/realtime (`AuthProvider`, feed/friends/leaderboard hooks, notifications context).
  - Components: UI/komposition (`src/components/*`).

### Var/hur hanteras validering?
- **Frontend**
  - Form-hantering via `react-hook-form` och klientnära validering (t.ex. register/login).
- **Backend**
  - Identity validerar credentials (lösenordsregler osv) och returnerar felkoder.
  - Viss validering sker i services (t.ex. trim/längd/moderation på innehåll).
  - DataAnnotations finns på vissa domänobjekt, men request-DTO-validering är inte helt konsekvent över alla endpoints.

### AI-stöd i arbetssättet (om relevant)
- AI används dels som **extern service** (moderation), dels som **utvecklingsstöd** (felsökning, refaktorering, förbättring av auth/SignalR/CSRF-flöden).

## 3. Teknisk skuld

### Medveten teknisk skuld
- **Blandad auth-modell i frontend**: cookie-session används i praktiken, men det finns även `auth_token`-logik (localStorage) som kan skapa oklarhet och buggrisk.
- **Fel-/valideringsformat**: flera endpoints returnerar egna `{ message: ... }` och vissa fel kommer från Identity/ProblemDetails-liknande strukturer → klienten behöver hantera flera format.
- **Case-sensitivitet**: repo innehåller både `apps/Web` och `apps/web` i praktiken (Windows vs Linux) → kan bli en CI/deploy-fälla om paths inte är konsekventa.

### Prioritering (högst först)
1. Enhetlig auth-kontrakt: **cookie-only** (eller token-only), men inte båda samtidigt.
2. Standardisera fel/validering (t.ex. ProblemDetails + konsekventa request-DTO-regler).
3. Stabilare realtime-livscykel (start/stop på login/logout, backoff, tydlig cache av “me”).
4. Konsolidera casing/paths så CI på Linux aldrig överraskar.

### Hur trygga är vi med AI-genererad kod?
- Trygghet är högre i “små, verifierbara refactors” (t.ex. CSRF/SignalR-guardrails) än i “stora, nya features”.
- Risken ligger främst i **edge cases** (auth state + reconnect + navigation) och **inconsistency** mellan frontend/backend-kontrakt.

## 4. Testskuld

### Vad som testas idag
- **Backend**: service-nära tester i `apps/Api.Tests` (Attempts/Comments/Feed/Leaderboard/Likes/Posts/Profile).
- **Frontend**: vitest (bl.a. route/render-tester).

### Vad som inte testas (eller testas lite)
- Controllers/endpoints som integrationstester (auth cookies, statuskoder, DTO-kontrakt).
- SignalR hubs (authz, reconnect/logout edge cases) som integrationstester.
- E2E-flöden i browser (Cypress/Playwright) saknas.
- Säkerhetstester: CSRF/XSS/rate-limit per endpoint, samt prestanda/flood-tester.

### Svårast fel att upptäcka
- Race conditions i auth + realtime (t.ex. logout → reconnect-loopar).
- Skillnader mellan Dev/Prod (HTTPS, cookies SameSite/Secure, proxies).
- “Rätt behörighet” i alla hörnfall (self vs friend vs stranger).

### AI-tjänst i lösningen – hur testas den?
- Moderation (Azure OpenAI) bör testas via “adapter + mock” (unit tests) och kontraktstester; i nuläget är den mest testad via manuell körning.

## 5. Säkerhetsskuld

### Realistiska attackytor
- Auth endpoints (`/api/auth/*`): credential stuffing, lockout-bypass-försök.
- Innehåll (posts/comments): spam/flood, innehållsmanipulation, ev. XSS-inmatning.
- SignalR hubs: connect/flood, försök att ansluta till andras konversationer.
- “Privacy/IDOR”: försök läsa profiler eller konversationer utan vänskap/medlemskap.

### Skydd som finns idag
- `[Authorize]` på API-features (förutom register/login).
- **CSRF-skydd** för state-changing `/api/*` när användaren är autentiserad (token + middleware-validate).
- **Rate limiting** (“fixed”) applicerat på controllers (och CSRF-endpoint).
- **HTTPS/HSTS + säkerhetsheaders** i Production.
- **Authz checks** för friends/profil/meddelanden/hubs (friendship/medlemskap).
- Grundläggande request-loggning med correlation id.

### Kvarstående risk (även om skydd finns)
- Auth/token-kontraktet i frontend (localStorage token) ökar riskytan vid XSS om det används fel i framtiden.
- Rate limit är global policy; vissa endpoints kan behöva striktare limiter (t.ex. auth, post/comment).
- Begränsad automatisk säkerhetstestning (SAST/DAST/CSRF/XSS/abuse) – mest “best effort” i kod.

## 6. CI/CD & pipeline

### Pipelineflöde (från commit till deploy)
- Trigger på `main` → install Node/.NET → `npm ci` → `npm audit` → build web → kör frontend-test → restore API (locked mode) → NuGet vulnerability scan → API tests → EF migrations → publish API → kopiera web `dist` till `wwwroot` → zip artifact → deploy till Azure Web App.

### Var kan pipelinen fallera utan tydlig feedback?
- **EF migrations**: fel i connection string/secrets eller schema-konflikt dyker upp sent i pipelinen.
- **SCA steg**: `npm audit` eller NuGet-vulnerability kan faila utan att det är uppenbart “vilken dependency som orsakade”.

### Minst en manuell eller svag punkt
- Trigger saknar PR-flöde (endast `main`) → risk att fel når main utan pre-merge feedback.
- Deploy och DB-migration sker i samma pipeline → rollback-scenario behöver vara tydligt definierat.

## 7. Monitorering & drift

### Hur vet vi att systemet fungerar just nu?
- `GET /api/health` returnerar “healthy” (grundläggande API-upp).
- Request logging ger status/latency per request.
- I Production: Application Insights är inkopplat (förutsatt korrekt Azure-konfiguration).

### Vad hade kunnat gå fel utan att ni märker det?
- DB-latency/locks eller partial outages (utan tydliga larm).
- SignalR reconnect-loopar eller 401-spam om auth state och realtime-livscykel glider isär.
- Moderation-tjänsten kan vara avstängd (saknad API-nyckel) och bara ge “degraderat skydd”.

### Loggar/mätvärden som saknas (om man hade haft mer tid)
- Metrics för 429-rate-limit hits per endpoint.
- SignalR: aktiva connections, reconnects, negotiation failures.
- Readiness-check som testar DB-anslutning och (ev.) migrationsläge.

## 8. Reflektion

### Svårast att förstå i efterhand
- Sambandet mellan **cookie-auth**, **CSRF**, **frontend cache av `/me`** och **SignalR start/stop**.
- “Vem får se vad?” (self vs friend vs stranger) när profiler, feed och meddelanden kopplas ihop.

### Vad hade vi prioriterat annorlunda om vi började om?
- Bestäm auth-modell tidigt och håll den konsekvent i både API och web.
- Lägg 1–2 E2E smoke tests tidigt.
- PR-trigger i CI + tydligare separation av build/test vs deploy/migrations.

### Vilken typ av skuld är farligast att missa tidigt?
- **Säkerhets- och integritetsskuld** (auth/CSRF/IDOR/realtime) eftersom den är dyr att rätta i efterhand och påverkar hela arkitekturen.

