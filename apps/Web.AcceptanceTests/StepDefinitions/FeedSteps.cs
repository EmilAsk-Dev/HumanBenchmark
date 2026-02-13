using Microsoft.Playwright;
using TechTalk.SpecFlow;
using Web.AcceptanceTests.Support;
using Xunit;

namespace Web.AcceptanceTests.StepDefinitions;

[Binding]
public class FeedSteps
{
    private readonly IPage _page;

    public FeedSteps(ScenarioContext context)
    {
        _page = (IPage)context["page"];
    }

    [Then(@"the feed page should be displayed")]
    public async Task ThenFeedPageShouldBeDisplayed()
    {
        await _page.WaitForURLAsync($"{TestSettings.WebBaseUrl}/", new() { Timeout = 5000 });
        Assert.Contains("/", _page.Url);
        Assert.DoesNotContain("/login", _page.Url);
    }

    [Then(@"the feed page should show filter options")]
    public async Task ThenFeedPageShouldShowFilterOptions()
    {
        // FeedFilters renderar filter-knappar (t.ex. "All", "Friends" etc.)
        var buttons = _page.Locator("button");
        var count = await buttons.CountAsync();
        Assert.True(count > 0, "Expected filter buttons to be visible on the feed page.");
    }
}
