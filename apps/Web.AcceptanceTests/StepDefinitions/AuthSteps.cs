using Microsoft.Playwright;
using TechTalk.SpecFlow;
using Web.AcceptanceTests.Support;
using Xunit;

namespace Web.AcceptanceTests.StepDefinitions;

[Binding]
public class AuthSteps
{
    private readonly IPage _page;

    public AuthSteps(ScenarioContext context)
    {
        _page = (IPage)context["page"];
    }

    private static string Email =>
        Environment.GetEnvironmentVariable("E2E_EMAIL")
        ?? throw new Exception("Missing env var: E2E_EMAIL");

    private static string Password =>
        Environment.GetEnvironmentVariable("E2E_PASSWORD")
        ?? throw new Exception("Missing env var: E2E_PASSWORD");

    [Given(@"the user is on the login page")]
    public async Task GivenUserIsOnLoginPage()
    {
        await _page.GotoAsync($"{TestSettings.WebBaseUrl}/login");
    }

    [When(@"the user logs in with valid credentials")]
    public async Task WhenUserLogsIn()
    {
        
        await _page.Locator("#email").FillAsync(Email);
        await _page.Locator("#password").FillAsync(Password);


        await _page.Locator("button[type='submit']").ClickAsync();
    }

    [Then(@"the user should be redirected away from the login page")]
    public async Task ThenRedirectedAway()
    {
        await _page.WaitForURLAsync(url => !url.Contains("/login"), new() { Timeout = 10000 });
        Assert.DoesNotContain("/login", _page.Url);
    }
}
