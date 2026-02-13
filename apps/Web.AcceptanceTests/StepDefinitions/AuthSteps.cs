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
        
        await _page.Locator("input[type='email']").FillAsync(Email);
        await _page.Locator("input[type='password']").FillAsync(Password);


        var loginButton = _page.GetByRole(AriaRole.Button, new() { Name = "Login" });
        if (!await loginButton.IsVisibleAsync())
            loginButton = _page.GetByRole(AriaRole.Button, new() { Name = "Sign in" });

        await loginButton.ClickAsync();
    }

    [Then(@"the user should be redirected away from the login page")]
    public async Task ThenRedirectedAway()
    {
        await _page.WaitForTimeoutAsync(500);
        Assert.DoesNotContain("/login", _page.Url);
    }
}
