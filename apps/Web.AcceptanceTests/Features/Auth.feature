Feature: Authentication
  As a user
  I want to log in
  So that I can access protected pages

  Scenario: User logs in successfully
    Given the user is on the login page
    When the user logs in with valid credentials
    Then the user should be redirected away from the login page
