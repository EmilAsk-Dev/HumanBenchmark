using Microsoft.Playwright;
using TechTalk.SpecFlow;

namespace Web.AcceptanceTests.Hooks;

[Binding]
public class PlaywrightHooks
{
    private readonly ScenarioContext _scenarioContext;

    public PlaywrightHooks(ScenarioContext scenarioContext)
    {
        _scenarioContext = scenarioContext;
    }

    [BeforeScenario]
    public async Task BeforeScenario()
    {
        var playwright = await Playwright.CreateAsync();
        var browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
        {
            Headless = true
        });

        var context = await browser.NewContextAsync();
        var page = await context.NewPageAsync();

        _scenarioContext["playwright"] = playwright;
        _scenarioContext["browser"] = browser;
        _scenarioContext["context"] = context;
        _scenarioContext["page"] = page;
    }

    [AfterScenario]
    public async Task AfterScenario()
    {
        if (_scenarioContext.TryGetValue("page", out var p) && p is IPage page)
            await page.CloseAsync();

        if (_scenarioContext.TryGetValue("context", out var c) && c is IBrowserContext context)
            await context.CloseAsync();

        if (_scenarioContext.TryGetValue("browser", out var b) && b is IBrowser browser)
            await browser.CloseAsync();

        if (_scenarioContext.TryGetValue("playwright", out var pl) && pl is IPlaywright playwright)
            playwright.Dispose();
    }
}
