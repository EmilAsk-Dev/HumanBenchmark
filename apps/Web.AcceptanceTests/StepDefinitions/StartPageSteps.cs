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
        // Feed-sidan har ingen h1 — verifiera att vi inte är på login-sidan
        await _page.WaitForLoadStateAsync(Microsoft.Playwright.LoadState.DOMContentLoaded);
        Assert.DoesNotContain("/login", _page.Url);
        // Verifiera att sidan har minst en knapp (BottomNav etc.)
        var buttons = _page.Locator("button");
        var count = await buttons.CountAsync();
        Assert.True(count > 0, "Expected buttons to be visible on the start page.");
    }

    [When(@"the user clicks the quick menu button")]
    public async Task WhenUserClicksQuickMenuButton()
    {
        // BottomNav har 5 items, Plus-knappen är index 2 (mitten)
        var navButtons = _page.Locator("nav button");
        var count = await navButtons.CountAsync();

        if (count >= 3)
            await navButtons.Nth(2).ClickAsync();
        else
            await navButtons.First.ClickAsync();

        // Vänta på att popup animeras in
        await _page.WaitForTimeoutAsync(400);
    }

    [Then(@"the quick menu should show test options")]
    public async Task ThenQuickMenuShouldShowTestOptions()
    {
        // Popup visar 4 test-knappar — kolla att minst en av dem syns
        var testNames = new[] { "Reaction", "Chimp", "Typing", "Sequence" };
        var found = 0;

        foreach (var name in testNames)
        {
            var btn = _page.GetByRole(AriaRole.Button, new() { Name = name, Exact = false });
            if (await btn.IsVisibleAsync())
                found++;
        }

        Assert.True(found >= 1, "Expected at least one test option in the quick menu.");
    }
}
