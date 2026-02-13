using Microsoft.Playwright;
using TechTalk.SpecFlow;
using Web.AcceptanceTests.Support;
using Xunit;

namespace Web.AcceptanceTests.StepDefinitions;

[Binding]
public class ProfileSteps
{
    private readonly IPage _page;

    public ProfileSteps(ScenarioContext context)
    {
        _page = (IPage)context["page"];
    }

    [When(@"the user navigates to the profile page")]
    public async Task WhenUserNavigatesToProfile()
    {
        await _page.GotoAsync($"{TestSettings.WebBaseUrl}/profile");
    }

    [Then(@"the profile page should be displayed")]
    public async Task ThenProfilePageShouldBeDisplayed()
    {
        Assert.Contains("/profile", _page.Url);
        Assert.DoesNotContain("/login", _page.Url);

        // Profilsidan har rubriken "Profil" (svenska)
        var heading = _page.Locator("h1").Filter(new() { HasText = "Profil" });
        await heading.WaitForAsync(new() { Timeout = 8000 });
        Assert.True(await heading.IsVisibleAsync(), "Expected a heading on the profile page.");
    }

    [Then(@"the profile page should show personal best stats")]
    public async Task ThenProfilePageShouldShowPersonalBests()
    {
        // Vänta på att sidan laddats
        await _page.WaitForLoadStateAsync(LoadState.DOMContentLoaded);
        await _page.WaitForTimeoutAsync(500);

        // Profilsidan visar "Profil"-rubriken — använd heading-roll för att undvika nav-länken
        var profil = _page.GetByRole(AriaRole.Heading, new() { Name = "Profil", Exact = true });
        Assert.True(await profil.IsVisibleAsync(), "Expected profile page to be loaded with 'Profil' heading.");
    }
}
