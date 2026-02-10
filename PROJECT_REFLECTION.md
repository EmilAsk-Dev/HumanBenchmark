Användarnas lösning
Viktigaste användarflödena (som faktiskt finns i koden)
Registrera/logga in via ASP.NET Identity (cookie/session) → React-route guards (ProtectedRoute) → Feed.
Köra test → spara attempts → posta till feed (kopplat till AttemptId) → like/comment.
Friends: skicka/ta emot requests → acceptera → chat/konversationer + notiser via SignalR.
Leaderboards: hämta topplistor per game/scope/timeframe.
Saker som medvetet inte byggdes / ofullständigt
“Riktig” observability (health/metrics/alerts) är inte färdig i programmet.
Policy/roll-baserad auktorisering per feature är i praktiken inte utbyggd (mest bara [Authorize]).
Arkitektur & ansvar
Övergripande arkitektur
Monorepo: apps/Api (ASP.NET Core) + apps/web (React/Vite). Web byggs in i API wwwroot i pipeline.
Kommunikation mellan systemdelar
Frontend → API med fetch och credentials: "include" (cookie-auth).
Realtime: SignalR hubs /hubs/notifications och /hubs/chat.
Ansvar mellan moduler
Backend: Controllers = endpoints, Services = affärslogik/DB (EF Core).
Frontend: pages + hooks (AuthProvider, useFeed, useFriends, useLeaderboard) + UI-komponenter.
Validering (nuvarande läge)
Frontend: finns tydligare register-validering (email, password, confirm, osv).
Backend: finns en del validering i services (t.ex. CommentService trim/längd + moderation), men inte konsekvent via t.ex. DataAnnotations på request DTOs överallt.
AI-process
AI-stöd syns mest som felsökning/refaktor av flöden (auth-cache, reconnect-loopar, UI/DTO-justeringar) snarare än “AI-arkitektur” från noll.
Teknisk skuld
Tydlig skuld (från kodbasen)
Auth är blandat: ni kör cookie/session i praktiken, men frontend har kvar auth_token-logik och backend login returnerar token → otydligt kontrakt och lätt att få buggar.
Leaderboard-hooken var känslig för re-render (fixad nu), men visar att hooks behöver stabilare mönster/test.
README nämner /health, men API mappar ingen health endpoint just nu (dokumentation driftar från verkligheten).
Prioritering (enkelt → svårt)
Enhetlig auth-modell (cookie eller token, inte båda) → hög prio.
Standardiserat fel-format (ProblemDetails) + validering på request DTOs → hög prio.
Städa casing/duplicerade paths (apps/Web vs apps/web) → medel.
Testskuld
Testas idag
Backend: dotnet test kör (Api.Tests).
Frontend: vitest kör (routing m.m.).
Testas inte (eller väldigt lite)
E2E: register → login → feed → friends → chat → notiser.
SignalR integration (reconnect/logout edge cases) som riktiga integrationstester.
Svårast fel att upptäcka
Race conditions i auth + SignalR + navigation, och “dev vs prod”-skillnader (cookies, proxy, https).
Säkerhetsskuld
Realistiska attackytor
/api/auth/* (bruteforce/credential stuffing), feed/posts/comments (spam, flood), SignalR hubs (connect/flood).
Skydd som finns
[Authorize] på controllers/hubs.
Rate limiting policy (“fixed”) på controllers + identity endpoints.
Prod: HSTS/HTTPS redirect + grundläggande security headers.
Logging med correlation id.
Kvarstående risk
CSRF är fortfarande en grej när man kör cookie-auth (ni har ingen tydlig antiforgery-strategi i koden just nu).
Validering/fel-format är inte konsekvent (vissa endpoints kastar ArgumentException → risk för 500 om inget globalt exception-filter tar det snyggt).
CI/CD & pipeline
Pipeline-flöde (från repo)
Bygger web (npm ci, npm run build) + kör frontend-test → kör dotnet test → kör EF migrations → publish API → kopierar dist till wwwroot → zip artifact.
Svaga punkter
Trigger är bara på main (inte PR) → risk att fel hamnar i main utan pre-merge feedback.
EF migrations-steget kan fallera “sent” och vara knepigt att felsöka om connection/secrets är fel.
Monitorering & drift
Hur ni ser att det funkar
RequestLoggingMiddleware loggar alla requests med status/latency + correlation id.
I prod kopplas App Insights på, men det kräver att Azure-sidan faktiskt är konfigurerad.
Vad kan gå fel utan att ni märker
DB-problem (latency/locks), rate limit som slår fel, SignalR reconnect-loopar, moderation-service som felar.
Health check?
Nej – inte i koden just nu. Program.cs har ingen AddHealthChecks() eller MapHealthChecks("/health"), trots att README listar /health.
Reflektion
Svårast att förstå i efterhand (i er kod)
Auth-livscykeln + realtime-anslutningar (när ska SignalR starta/stoppa, vad händer vid logout).
Vad ni borde prioriterat annorlunda
Bestäm auth-kontrakt tidigt (cookie vs token) + standardisera fel/validering.
Lägg 1–2 E2E “smoke tests” tidigt.
Farligaste skulden att missa tidigt
Säkerhet runt auth/cookies/realtid + inkonsekventa kontrakt mellan frontend/backend.