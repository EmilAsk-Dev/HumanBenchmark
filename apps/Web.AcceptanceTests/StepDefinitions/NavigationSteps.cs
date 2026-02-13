using Microsoft.Playwright;
using TechTalk.SpecFlow;
using Web.AcceptanceTests.Support;
using Xunit;

namespace Web.AcceptanceTests.StepDefinitions;

[Binding]
public class NavigationSteps
{
    private readonly IPage _page;

    public NavigationSteps(ScenarioContext context)
    {
        _page = (IPage)context["page"];
    }

    [When(@"the user opens the Reaction Time test")]
    public async Task WhenUserOpensReactionTime()
    {
        await _page.GotoAsync($"{TestSettings.WebBaseUrl}/tests/reaction");
    }

    [Then(@"the Reaction Time page should be displayed")]
    public async Task ThenReactionTimePageDisplayed()
    {
        
        var visible = await _page.GetByText("Reaction", new() { Exact = false }).IsVisibleAsync();
        Assert.True(visible, "Expected Reaction page to be visible.");
    }
}
