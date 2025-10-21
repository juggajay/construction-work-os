# Authentication Capability

## ADDED Requirements

### Requirement: User Registration
The system SHALL allow new users to register with email and password.

#### Scenario: Successful registration with email confirmation
- **WHEN** a user provides valid email and password (8+ characters, 1 uppercase, 1 number)
- **THEN** the system creates a user account in pending state
- **AND** sends a confirmation email with a time-limited token (24 hours)
- **AND** displays a message "Check your email to confirm your account"

#### Scenario: Email already registered
- **WHEN** a user attempts to register with an email that already exists
- **THEN** the system returns an error "This email is already registered"
- **AND** suggests using the login or password reset flow

#### Scenario: Weak password rejected
- **WHEN** a user provides a password shorter than 8 characters or missing required complexity
- **THEN** the system returns validation errors listing the requirements
- **AND** does not create a user account

### Requirement: Email Confirmation
The system SHALL require email confirmation before allowing full access.

#### Scenario: User confirms email within 24 hours
- **WHEN** a user clicks the confirmation link in their email
- **THEN** the system marks the account as confirmed
- **AND** redirects to the org creation page (if no org memberships)
- **AND** sets an authenticated session cookie

#### Scenario: Confirmation link expired
- **WHEN** a user clicks a confirmation link older than 24 hours
- **THEN** the system displays "This link has expired"
- **AND** provides a button to resend confirmation email

### Requirement: Email/Password Login
The system SHALL authenticate users with email and password.

#### Scenario: Successful login with confirmed email
- **WHEN** a user provides valid email and password for a confirmed account
- **THEN** the system creates an authenticated session (1-hour access token, 7-day refresh token)
- **AND** sets httpOnly, secure, sameSite=lax session cookies
- **AND** redirects to the last visited page or dashboard home

#### Scenario: Unconfirmed email login attempt
- **WHEN** a user with an unconfirmed email attempts to log in
- **THEN** the system returns "Please confirm your email first"
- **AND** provides a link to resend confirmation email

#### Scenario: Invalid credentials
- **WHEN** a user provides incorrect email or password
- **THEN** the system returns "Invalid email or password" (do not reveal which is wrong)
- **AND** does not create a session

### Requirement: Magic Link Login
The system SHALL support passwordless authentication via email magic links.

#### Scenario: Magic link request
- **WHEN** a user enters their email on the magic link page
- **THEN** the system sends an email with a one-time login link (valid 15 minutes)
- **AND** displays "Check your email for a login link"
- **AND** rate-limits requests to 3 per hour per email

#### Scenario: Magic link authentication
- **WHEN** a user clicks a valid magic link
- **THEN** the system creates an authenticated session
- **AND** redirects to the dashboard
- **AND** invalidates the magic link (single-use only)

#### Scenario: Expired magic link
- **WHEN** a user clicks a magic link older than 15 minutes
- **THEN** the system displays "This link has expired"
- **AND** prompts to request a new magic link

### Requirement: Password Reset
The system SHALL allow users to reset forgotten passwords.

#### Scenario: Password reset request
- **WHEN** a user enters their email on the reset password page
- **THEN** the system sends a reset link (valid 1 hour) to that email
- **AND** displays "If that email exists, you'll receive reset instructions"
- **AND** does not reveal whether the email is registered (security)

#### Scenario: Password reset completion
- **WHEN** a user clicks a valid reset link and submits a new password meeting requirements
- **THEN** the system updates the password hash
- **AND** invalidates all existing sessions for that user
- **AND** logs the user in with a new session
- **AND** displays "Your password has been reset"

#### Scenario: Reset link expired
- **WHEN** a user clicks a reset link older than 1 hour
- **THEN** the system displays "This link has expired"
- **AND** prompts to request a new reset link

### Requirement: Session Management
The system SHALL manage authenticated sessions with automatic refresh.

#### Scenario: Access token refresh before expiry
- **WHEN** a user makes a request and their access token has <10 minutes until expiry
- **THEN** the middleware automatically refreshes the access token using the refresh token
- **AND** updates the session cookies
- **AND** allows the request to proceed without user action

#### Scenario: Refresh token expired
- **WHEN** a user's refresh token has expired (>7 days since last activity)
- **THEN** the system clears the session cookies
- **AND** redirects to the login page with a message "Your session has expired"

#### Scenario: Manual logout
- **WHEN** a user clicks the logout button
- **THEN** the system revokes the refresh token in the database
- **AND** clears session cookies
- **AND** redirects to the login page

### Requirement: Role-Based Access Control (RBAC)
The system SHALL enforce role-based permissions at the database level.

#### Scenario: User queries their accessible organizations
- **WHEN** an authenticated user queries the `organizations` table
- **THEN** the database RLS policy returns only organizations where the user is a member
- **AND** does not return organizations the user does not belong to
- **AND** logs denied access attempts if the user tries to bypass RLS

#### Scenario: User attempts unauthorized project access
- **WHEN** a user queries a project they do not have access to
- **THEN** the database RLS policy rejects the query with an empty result set
- **AND** does not reveal the project exists
- **AND** logs the attempt in audit logs

### Requirement: SSO Foundation (OIDC)
The system SHALL support OpenID Connect (OIDC) for enterprise SSO.

#### Scenario: SSO login redirect (Google example)
- **WHEN** a user clicks "Sign in with Google"
- **THEN** the system redirects to Google's OAuth consent page
- **AND** includes the client_id, redirect_uri, and requested scopes (email, profile)

#### Scenario: SSO callback handling
- **WHEN** the SSO provider redirects back with an authorization code
- **THEN** the system exchanges the code for an access token and ID token
- **AND** extracts email and profile from the ID token
- **AND** creates or links a user account (email-based matching)
- **AND** creates an authenticated session

#### Scenario: SSO email mismatch
- **WHEN** an SSO provider returns an unverified email
- **THEN** the system requires email confirmation before granting access
- **AND** sends a verification email to the SSO-provided address

### Requirement: Security Hardening
The system SHALL implement security best practices for authentication.

#### Scenario: CSRF protection on auth endpoints
- **WHEN** a user submits a login or signup form
- **THEN** the system validates a CSRF token embedded in the form
- **AND** rejects requests without a valid token

#### Scenario: Rate limiting on auth endpoints
- **WHEN** the same IP address makes >10 failed login attempts in 5 minutes
- **THEN** the system blocks further login attempts from that IP for 15 minutes
- **AND** logs the rate-limit event for security monitoring

#### Scenario: Secure cookie attributes
- **WHEN** the system sets session cookies
- **THEN** cookies include `httpOnly=true`, `secure=true`, `sameSite=lax`
- **AND** have appropriate expiry times (1 hour for access, 7 days for refresh)
