Feature: Start page
  As a user
  I want to see the start page
  So that I can start a benchmark test

  Scenario: Start page shows a heading
    Given the user opens the start page
    Then the start page should show a title

  Scenario: Start page lists available tests
    Given the user opens the start page
    Then the start page should show at least one test option
