# Integritet / Privacy (HumanBenchmark)

Det här är en kort, praktisk sammanställning för att kunna motivera vår databehandling i projektet.

## Personuppgifter vi kan lagra

- E-post och användarnamn (konto/inloggning)
- Avatar (profilbild)
- Födelsedatum och kön (om användaren fyller i det)
- Testresultat och statistik
- Inlägg, kommentarer och likes
- Vänrelationer och meddelanden (om funktionerna används)

## Varför vi lagrar data

- Autentisering och att kunna visa ett konto
- Visa profiler och statistik över tester
- Sociala funktioner (feed, interaktioner)
- Meddelanden och notifieringar

## Teknisk data

- Inloggning sker via sessions-cookie (API + web kör same-origin i prod och via proxy i dev).
- Servern kan behandla IP-adress för rate limiting och felsökning (loggar/telemetri).

## Minimera och skydda

- Logga inte mer än nödvändigt (undvik känsliga fält i loggar).
- Kör alltid HTTPS i produktion.
- Begränsa åtkomst till skyddade endpoints med auth/authorization.

