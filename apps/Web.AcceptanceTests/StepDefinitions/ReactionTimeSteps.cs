using Microsoft.Playwright;
using TechTalk.SpecFlow;
using Web.AcceptanceTests.Support;
using Xunit;

namespace Web.AcceptanceTests.StepDefinitions;

[Binding]
public class ReactionTimeSteps
{
    private readonly IPage _page;

    public ReactionTimeSteps(ScenarioContext context)
    {
        _page = (IPage)context["page"];
    }

    [Given(@"the user is on the Reaction Time page")]
    public async Task GivenUserIsOnReactionTimePage()
    {
        // Rätt route enligt er Router
        await _page.GotoAsync($"{TestSettings.WebBaseUrl}/tests/reaction");

        // Om man inte är inloggad kommer ProtectedRoute nästan säkert skicka till /login
        // Då failar vi med tydlig info (så ni vet att ni måste köra login-scenario först)
        if (_page.Url.Contains("/login"))
        {
            Assert.True(false,
                "You were redirected to /login (ProtectedRoute). " +
                "Run the login steps before opening /tests/reaction, or ensure WEB_BASE_URL points to a session where you're logged in.");
        }
    }

    [When(@"the user starts the test")]
    public async Task WhenUserStartsTheTest()
    {
        
        var startBtn = _page.GetByRole(AriaRole.Button, new() { Name = "Start" });

        if (await startBtn.IsVisibleAsync())
        {
            await startBtn.ClickAsync();
            return;
        }

        
        var startTextBtn = _page.Locator("button:has-text(\"Start\")");
        if (await startTextBtn.IsVisibleAsync())
        {
            await startTextBtn.ClickAsync();
            return;
        }

        Assert.True(false, "Could not find a Start button on the Reaction test page.");
    }

    [Then(@"the test should enter a waiting state")]
    public async Task ThenWaitingState()
    {
       
        await _page.WaitForTimeoutAsync(200);

        var waitText = _page.GetByText("Wait", new() { Exact = false });
        var waitVisible = await waitText.IsVisibleAsync();

        Assert.True(waitVisible,
            "Expected a waiting state after starting the test (text containing 'Wait'). " +
            "If your UI uses different copy, update this assertion.");
    }

    [When(@"the user waits for the go signal")]
    public async Task WhenWaitForGoSignal()
    {
   
        var goSelectors = new[]
        {
            "text=/Click/i",
            "text=/Go/i",
            "text=/Now/i"
        };

        Exception? last = null;
        foreach (var sel in goSelectors)
        {
            try
            {
                await _page.WaitForSelectorAsync(sel, new() { Timeout = 10000 });
                return;
            }
            catch (Exception ex)
            {
                last = ex;
            }
        }

        throw new TimeoutException(
            "Did not detect a go signal within 10s. " +
            "Update selectors in WhenWaitForGoSignal() to match your UI.", last);
    }

    [When(@"the user clicks to react")]
    public async Task WhenUserClicksToReact()
    {
        
        await _page.ClickAsync("body");
    }

    [Then(@"the user should see a result in milliseconds")]
    public async Task ThenUserSeesMsResult()
    {
        
        await _page.WaitForTimeoutAsync(200);

    
        var visible = await _page.GetByText("ms", new() { Exact = false }).IsVisibleAsync();
        Assert.True(visible,
            "Expected a result containing 'ms'. If results are rendered differently, update this assertion/selector.");
    }
}
