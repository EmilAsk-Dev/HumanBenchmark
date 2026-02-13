Feature: Feed
  As a logged in user
  I want to see and interact with the feed
  So that I can follow my friends' test results

  Scenario: Feed page is displayed after login
    Given the user is on the login page
    When the user logs in with valid credentials
    Then the user should be redirected away from the login page
    Then the feed page should be displayed

  Scenario: Feed page shows filter options
    Given the user is on the login page
    When the user logs in with valid credentials
    Then the user should be redirected away from the login page
    Then the feed page should show filter options
