# Privacy (HumanBenchmark)

This is a short, practical summary intended to help explain and justify data processing in this project.

## Personal data we may store

- Email address and username (account/login)
- Avatar (profile picture)
- Date of birth and gender (optional, if provided by the user)
- Test results and statistics
- Posts, comments, and likes
- Friends and messages (if the features are used)

## Why we store data

- Authentication and account functionality
- Showing profiles and test statistics
- Social features (feed, interactions)
- Messaging and notifications

## Technical data

- Login is handled via a session cookie (API + web run same-origin in production and via proxy in development).
- The server may process IP address for rate limiting and troubleshooting (logs/telemetry).

## Minimization & protection

- Avoid logging more than necessary (especially sensitive fields).
- Always use HTTPS in production.
- Restrict access to protected endpoints using auth/authorization.
