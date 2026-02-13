using Microsoft.Playwright;
using TechTalk.SpecFlow;
using Web.AcceptanceTests.Support;

namespace Web.AcceptanceTests.StepDefinitions;

[Binding]
public class CommonSteps
{
    private readonly IPage _page;

    public CommonSteps(ScenarioContext context)
    {
        _page = (IPage)context["page"];
    }

    [Given(@"the user opens the start page")]
    public async Task GivenTheUserOpensTheStartPage()
    {
        await _page.GotoAsync($"{TestSettings.WebBaseUrl}/");
    }
}
