# Bidra till HumanBenchmark

Tack för att du vill bidra — här förklarar vi hur du snabbt kommer igång och vad vi förväntar oss av bidrag.

## Snabbstart ✅

1. Forka repot och skapa en feature-branch(lägg till första bokstaven av ditt namn och efternamn): `git checkout -b AG/kort-beskrivning`
2. Installera beroenden: `npm run install:all`
3. Kör projektet lokalt: `npm run dev`
4. Lägg till tester och öppna en PR mot `main` med en tydlig beskrivning och eventuella skärmbilder.

## Kodstandard & kvalitet 🔧

- Följ befintlig kodstandard (C# för API, TypeScript/React + Tailwind för webben).
- Kör linters/tester innan PR: `npm --prefix apps/Web run lint`, `dotnet test apps/Api.Tests`.
- Använd beskrivande commit-meddelanden (Conventional Commits rekommenderas):
  - feat(scope): kort beskrivning
  - fix(scope): kort beskrivning
  - chore: dokumentations- eller byggändringar

## Branching & PR:er 🔁

- Branchformat: `feat/...`, `fix/...`, `chore/...`.
- Baser PR:er på `main`; små och fokuserade PR:er föredras.
- Inkludera en kort sammanfattning, motivationen bakom ändringen och eventuella manuella teststeg.
- Lägg till granskare och invänta minst ett godkännande innan merge.

## Tester & CI ✅

- API-tester: `dotnet test apps/Api.Tests/Api.Tests.csproj`
- Webbtester: `npm --prefix apps/Web run test`
- Alla CI-kontroller måste vara godkända innan merge.

## Databas / Migreringar 🗄️

- Lägg till EF Core-migreringar från repots rot: `npm run db:add -- MigrationName`
- Tillämpa lokalt: `npm run db:update`
- Ångra senaste migreringen: `npm run db:remove`

## Rapportera säkerhetsproblem 🔒

- Öppna inte en publik issue för säkerhetssårbarheter. Kontakta repositoryts underhållare privat.

---

Tack — dina bidrag hjälper till att hålla projektet stabilt och användbart!
