Feature: Navigation
  As a user
  I want to navigate from the start page to a test
  So that I can play the selected benchmark

  Scenario: User navigates to Reaction Time from the start page
    Given the user is on the login page
    When the user logs in with valid credentials
    Then the user should be redirected away from the login page
    When the user selects the "Reaction Time" test
    Then the Reaction Time page should be displayed
