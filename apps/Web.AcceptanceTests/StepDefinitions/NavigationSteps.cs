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

    [When(@"the user selects the ""(.*)"" test")]
    public async Task WhenUserSelectsTest(string testName)
    {
        // Navigera direkt till test-sidan baserat på namn
        var path = testName.ToLower() switch
        {
            "reaction time" => "/tests/reaction",
            "reaction"      => "/tests/reaction",
            "typing"        => "/tests/typing",
            "chimp"         => "/tests/chimp",
            "sequence"      => "/tests/sequence",
            _               => $"/tests/{testName.ToLower()}"
        };
        await _page.GotoAsync($"{TestSettings.WebBaseUrl}{path}");
    }

    [Then(@"the Reaction Time page should be displayed")]
    public async Task ThenReactionTimePageDisplayed()
    {
        // Vänta på att "Reaction Time"-texten visas på sidan
        var heading = _page.GetByText("Reaction Time", new() { Exact = false });
        await heading.WaitForAsync(new() { Timeout = 8000 });
        Assert.True(await heading.IsVisibleAsync(), "Expected Reaction page to be visible.");
    }
}
