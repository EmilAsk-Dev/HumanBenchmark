namespace Web.AcceptanceTests.Support;

public static class TestSettings
{
    public static string WebBaseUrl =>
        Environment.GetEnvironmentVariable("WEB_BASE_URL")
        ?? "http://localhost:5173";
}
