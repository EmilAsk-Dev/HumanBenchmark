Feature: Leaderboard
  As a logged in user
  I want to see the leaderboard
  So that I can compare my results with others

  Scenario: Leaderboard page is displayed
    Given the user is on the login page
    When the user logs in with valid credentials
    Then the user should be redirected away from the login page
    When the user navigates to the leaderboard page
    Then the leaderboard page should be displayed

  Scenario: Leaderboard shows game type options
    Given the user is on the login page
    When the user logs in with valid credentials
    Then the user should be redirected away from the login page
    When the user navigates to the leaderboard page
    Then the leaderboard should show game type options
