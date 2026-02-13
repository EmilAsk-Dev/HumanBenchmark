Feature: Reaction Time
  As a user
  I want to run the reaction time test
  So that I can see my result

  Scenario: User completes an attempt and sees a result
    Given the user is on the login page
    When the user logs in with valid credentials
    Then the user should be redirected away from the login page
    When the user opens the Reaction Time test
    Then the Reaction Time page should be displayed
