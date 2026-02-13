Feature: Profile
  As a logged in user
  I want to see my profile
  So that I can view my stats and personal bests

  Scenario: Profile page is displayed
    Given the user is on the login page
    When the user logs in with valid credentials
    Then the user should be redirected away from the login page
    When the user navigates to the profile page
    Then the profile page should be displayed

  Scenario: Profile page shows personal bests
    Given the user is on the login page
    When the user logs in with valid credentials
    Then the user should be redirected away from the login page
    When the user navigates to the profile page
    Then the profile page should show personal best stats
