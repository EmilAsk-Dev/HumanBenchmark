# Projektstatus mot kravlista – HumanBenchmark

Datum: 2026-02-11

Legend:
- ✅ = uppfyllt
- ⚠️ = delvis / behöver förbättras
- ❌ = saknas / ej implementerat
- N/A = inte relevant (p.g.a. valt upplägg)

## 1. App & arkitektur
- ✅ Arkitektur stöttar fortsatt utveckling med features: feature-mappar i `apps/Api/Features/*` + tydliga services/DTOs och frontend hooks/pages.
- ✅ API med tydliga endpoints: controllers per feature (t.ex. `api/auth`, `api/feed`, `api/friends`, `api/messages`, `api/leaderboards`).
- ✅ DTO:er/kontrakt används: request/response DTOs finns i flera features (t.ex. `FeedItemDto`, `LeaderboardDto`, `CreatePostRequest`).
- ⚠️ Input valideras både i frontend och backend:
  - Frontend har formvalidering (t.ex. register/login).
  - Backend har viss validering (Identity + service-nivå), men saknar mer konsekvent request-DTO-validering för alla endpoints.

## 2. Git & arbetssätt
- ✅ Git används genomgående: repo har aktiv historik med feature-fixar.
- ✅ Feature branches: arbete sker i branch (ex. `Ea/General-Bug-Fixes`).
- ✅ Begripliga commits: nyare commits är tydligt namngivna (säkerhet, pipeline, features).
- ✅ Arbetat feature-by-feature: commits grupperar arbete per område (friends, auth, feed, pipeline).
- ⚠️ Spårbarhet för hur appen vuxit fram:
  - Delvis bra via commit-historik, men äldre commits är ibland generiska (“fix”, “smal fixes”).

## 3. CI – bygg & test
- ❌ Pipeline körs automatiskt vid push / PR:
  - `azure-pipelines.yml` triggar på `main` push, men saknar `pr:` trigger.
- ✅ Build + test körs i pipeline: `npm run build`, `npm run test`, `dotnet test`.
- ✅ Builden failar vid fel: pipeline-steg är “fail fast” (exit code ≠ 0 stoppar).
- ✅ Kod-/dependency-kontroll (SCA) finns:
  - `npm audit --audit-level=high`
  - `dotnet list package --vulnerable --include-transitive`
  - NuGet lockfile (`apps/Api/packages.lock.json`) + restore i locked mode.

## 4. Konfiguration & secrets
- ⚠️ Inga hemligheter i repo:
  - `.Env` finns lokalt i repo-roten men ska vara ignorerad av git; viktigt att den aldrig committas.
- ✅ Miljövariabler används:
  - API läser t.ex. DB-connection string och `AZURE_OPENAI_API_KEY` från env.
  - Web läser `VITE_*` i dev.
- ✅ Skillnad på Development och Production:
  - `Env.Load()` i dev, App Insights + HSTS/HTTPS redirect + headers i prod.
- ⚠️ Appen går att köra utan att hårdkoda något:
  - Kräver att env-variabler/connection strings finns (lokalt eller i pipeline/Azure).
  - Bra, men onboarding-dokumentation kan göras tydligare (vilka env vars som krävs).

## 5. Auth & behörighet
- ✅ Autentisering finns: ASP.NET Identity med cookie/session (frontend använder `credentials: "include"`).
- N/A Tokens valideras korrekt (JWT): projektet använder inte JWT som primär auth.
- N/A Claims används (JWT): JWT används inte, men claims används i cookie-context (t.ex. rate limiting partitionering på user-id).
- ❌ Auktorisering via policies / roller:
  - `AddAuthorization()` finns men inga tydliga policies/roller kopplade till endpoints i nuläget.
- ✅ Skyddade endpoints skyddas:
  - Features har i stor utsträckning `[Authorize]` och extra kontroller (t.ex. friendship/medlemskap).

## 6. API-säkerhet
- ✅ Endpoints är inte öppna i onödan: de flesta features kräver auth, och profil är begränsad till “self eller friend”.
- ⚠️ Input saneras / valideras:
  - Finns på vissa ställen (trim/längd/moderation), men ej helt konsekvent överallt.
- ✅ CORS rimligt konfigurerat:
  - Production är same-origin (web build i API `wwwroot`).
  - Development använder Vite proxy (`apps/web/vite.config.ts`), så CORS behövs normalt inte.
- ⚠️ Attack-vektorer undersökta uttömmande:
  - Ni har hanterat flera konkreta problem (CSRF, realtime authz, privacy/IDOR, rate limiting), men “uttömmande” kräver normalt mer (E2E/DAST, threat model, per-endpoint limiter).
- ⚠️ Planerat för vanliga attacker:
  - Injection: EF Core minskar risk, men inputvalidering behöver vara mer konsekvent.
  - Flood: rate limiting finns, men kan behöva per-endpoint policy (t.ex. striktare för auth/post/comment/hubs).
  - Manipulation/IDOR: förbättrat via friendship/medlemskap-checks.

## 7. Deployment & moln
- ✅ Appen är deployad i Azure.
- ✅ Deployment sker via pipeline: AzureWebApp ZIP deploy i `azure-pipelines.yml`.
- ⚠️ Miljöer är tydliga (dev/prod):
  - Kod skiljer på dev/prod, men pipeline beskriver bara “prod deploy” (ingen separat dev-miljö definierad här).
- ✅ Förstå deploy-flödet:
  - Pipeline gör build/test → migrerar DB → publish → packar → deploy.

## 8. API Management (konceptuellt eller praktiskt)
- ❌ APIM framför API:t: inte implementerat.
- ✅ Rate limiting / quotas: rate limiting i API (fixed window).
- ❌ Backend exponeras inte “helt öppet”:
  - Utan APIM/front door är API:t samma publika entrypoint som web.
- ⚠️ Explicita policies implementerade:
  - Vissa policies finns i kod (rate limiting, security headers), men inga APIM-policies.

## 9. Loggning & monitoring
- ⚠️ Loggar/rapporter/larm:
  - Request logging finns.
  - App Insights är på i prod, men alerts/dashboards är inte “kodifierade” i repo.
- ✅ Grundläggande monitoring/health: `GET /api/health`.
- ⚠️ Vi vet hur vi märker att något gått fel:
  - Loggar finns, men definierade larm/alerting-trösklar saknas i repo.

## 10. Integritet, Privacy & GDPR
- ⚠️ Vi vet vilken persondata vi hanterar:
  - Dokumenterat i `PRIVACY.md` (email/username/avatar/dob/gender/attempts/posts/comments/likes/friends/messages).
- ⚠️ Samlar inte in mer data än nödvändigt:
  - Rimligt för funktionerna, men retention/deletion är inte tydligt definierat.
- ⚠️ Hanterar integritetsrisker rimligt:
  - Profil åtkomst begränsad till vänner, vilket är bra.
  - Saknar tydlig “data export/delete account” funktion.
- ⚠️ Loggar inte känslig data i onödan:
  - RequestLogging loggar metod/path/status/latency (bra), men andra loggar (t.ex. auth) behöver kontinuerlig review.
- ⚠️ Kan motivera databehandling och informera användare:
  - Privacy text finns, men kan förbättras med ändamål, lagringstid och användarrättigheter.

## 11. Hardening
- ⚠️ Dependencies är uppdaterade:
  - Ni har SCA och lockfiler, men “uppdaterade” kräver rutin (t.ex. regelbundna bump PRs).
- ✅ Dependencies kan endast uppdateras explicit före pipeline:
  - `package-lock.json` + `packages.lock.json` + locked restore i CI.
- ✅ HTTPS används: redirect + HSTS i prod (och Azure termination).
- ✅ HSTS / säkerhetsheaders finns: HSTS + headers i prod.
- ✅ Authorization är korrekt satt: `[Authorize]` + extra authz-checks för friend/konversation/profil.
- ✅ Onödiga endpoints/features borttagna: t.ex. borttagna gamla test-endpoints och dev-only routes ligger bakom dev-guard.

## 12. Redo för demo
- ⚠️ Appen går att köra utan handpåläggning:
  - Kräver DB-connection string och ev. `AZURE_OPENAI_API_KEY` för moderation.
  - Bra att ha en “Demo setup”-sektion i `README.md` med exakta env vars.
- ✅ Vi kan visa: arkitektur, pipeline, deployment, säkerhet.
- ⚠️ Alla i gruppen kan förklara processen:
  - Rekommenderat: en kort “talk track” per del (auth, CSRF, rate limiting, realtime, pipeline, deploy).

## Snabbaste förbättringarna (hög effekt / låg insats)
- Lägg till PR-trigger i `azure-pipelines.yml` (`pr:`) så ni får build/test före merge.
- Standardisera backend-validering för request DTOs (minskar buggar och förbättrar säkerhet).
- Ta bort eller tydliggör `auth_token`-logik i frontend så auth-modellen blir 100% cookie/session.
- Lägg till kort “Demo setup” i `README.md` med env vars och körkommandon.

