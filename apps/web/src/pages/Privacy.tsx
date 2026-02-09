import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-10 space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold">Integritet / Privacy</h1>
          <p className="text-sm text-muted-foreground">
            Sammanfattning av vilken data appen hanterar och varför.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Personuppgifter vi kan lagra</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>E-post och användarnamn</li>
            <li>Avatar (profilbild)</li>
            <li>Födelsedatum och kön (om du fyller i det vid registrering/profil)</li>
            <li>Testresultat och statistik</li>
            <li>Inlägg, kommentarer och likes</li>
            <li>Vänrelationer och meddelanden (om du använder funktionerna)</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Teknisk data</h2>
          <p className="text-sm text-muted-foreground">
            För att hålla dig inloggad använder API:t en sessions-cookie. Servern kan även behandla IP-adress för t.ex.
            rate limiting och felsökning i loggar/telemetri.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Varför lagrar vi data?</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>Inloggning och konto</li>
            <li>Visa din profil och statistik</li>
            <li>Feed/sociala funktioner (posts, kommentarer, likes)</li>
            <li>Vänner och meddelanden</li>
          </ul>
        </section>

        <div className="pt-2 text-sm">
          <Link to="/login" className="text-primary hover:underline">
            Tillbaka till login
          </Link>
        </div>
      </div>
    </div>
  );
}

