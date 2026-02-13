using Microsoft.Playwright;
using TechTalk.SpecFlow;
using Xunit;

namespace Web.AcceptanceTests.StepDefinitions;

[Binding]
public class StartPageSteps
{
    private readonly IPage _page;

    public StartPageSteps(ScenarioContext context)
    {
        _page = (IPage)context["page"];
    }

    [Then(@"the start page should show a title")]
    public async Task ThenStartPageShouldShowATitle()
    {
        
        var h1 = _page.Locator("h1");
        var count = await h1.CountAsync();
        Assert.True(count > 0, "Expected an H1 title on the start page.");
    }

    [Then(@"the start page should show at least one test option")]
    public async Task ThenStartPageShouldShowAtLeastOneTestOption()
    {
        
        var links = _page.Locator("a, button");
        var count = await links.CountAsync();
        Assert.True(count > 0, "Expected at least one link or button on the start page.");
    }
}
