using Microsoft.Playwright;
using TechTalk.SpecFlow;
using Web.AcceptanceTests.Support;
using Xunit;

namespace Web.AcceptanceTests.StepDefinitions;

[Binding]
public class LeaderboardSteps
{
    private readonly IPage _page;

    public LeaderboardSteps(ScenarioContext context)
    {
        _page = (IPage)context["page"];
    }

    [When(@"the user navigates to the leaderboard page")]
    public async Task WhenUserNavigatesToLeaderboard()
    {
        await _page.GotoAsync($"{TestSettings.WebBaseUrl}/leaderboards");
    }

    [Then(@"the leaderboard page should be displayed")]
    public async Task ThenLeaderboardPageShouldBeDisplayed()
    {
        // Vänta på att sidan laddas och rubriken "Leaderboards" visas
        await _page.WaitForLoadStateAsync(Microsoft.Playwright.LoadState.DOMContentLoaded);
        var heading = _page.Locator("h1").Filter(new() { HasText = "Leaderboard" });
        await heading.WaitForAsync(new() { Timeout = 8000 });
        Assert.True(await heading.IsVisibleAsync(), "Expected the leaderboard heading to be visible.");
    }

    [Then(@"the leaderboard should show game type options")]
    public async Task ThenLeaderboardShouldShowGameTypeOptions()
    {
        // Leaderboards-sidan har tabs/knappar för varje game type
        var gameNames = new[] { "Reaction", "Typing", "Chimp", "Sequence" };
        var found = 0;

        foreach (var name in gameNames)
        {
            var el = _page.GetByText(name, new() { Exact = false });
            if (await el.IsVisibleAsync())
                found++;
        }

        Assert.True(found >= 1, "Expected at least one game type option on the leaderboard page.");
    }
}
