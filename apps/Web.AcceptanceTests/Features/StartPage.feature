Feature: Start page
  As a user
  I want to see the start page
  So that I can start a benchmark test

  Scenario: Start page shows a heading
    Given the user is on the login page
    When the user logs in with valid credentials
    Then the user should be redirected away from the login page
    Then the start page should show a title

  Scenario: Start page lists available tests via quick menu
    Given the user is on the login page
    When the user logs in with valid credentials
    Then the user should be redirected away from the login page
    When the user clicks the quick menu button
    Then the quick menu should show test options
