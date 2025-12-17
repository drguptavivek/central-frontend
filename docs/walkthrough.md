# App User Management Improvements Walkthrough

This document outlines the changes made to streamline App User management, including improved creation flow, phone number support, username visibility, login response updates, and bug fixes for revocation and form access.

## Changes

### 1. Streamlined App User Creation
- **Auto-generated Passwords**: The "Create App User" modal now automatically generates a strong password upon submission, removing the need for manual input.
- **Phone Number Field**: Added a "Phone Number" field with validation pattern `(+xx) xxxxxxxxxx` (allowing 1-3 digit country codes and optional spaces).
- **QR Panel**: The generated password and username are displayed on screen for manual entry. **Note**: Credentials are NOT included in the QR code for security reasons.

### 2. Password Reset Improvements
- **Simplified Flow**: The "Reset Password" flow now also auto-generates a new password and displays it, consistent with the creation flow.
- **Revocation Check**: Password reset is now blocked for revoked (inactive) users.

### 3. Username and Phone Visibility
- **List View**: Added "Username" and "Phone" columns to the App User list table.
- **QR Panel**: The QR panel now explicitly shows the "Username" (login name) in addition to the Display Name.

### 4. Revocation and Restoration
- **Correct Deactivation**: The "Revoke Access" action now correctly sets the user as inactive (`vg_active = false`) in the database.
- **Restore Access**: Added a "Restore Access" action for revoked users, allowing them to be reactivated.
- **Session Termination**: Existing sessions are terminated upon revocation.

### 5. Login Response and Self-Revoke
- **Login Payload**: `POST /projects/:projectId/app-users/login` now returns `id`, `token`, `projectId`, and `expiresAt`. Clients can use the returned `id` to call self-revoke and password-change endpoints without out-of-band IDs.
- **Form Access UI**: App users are now visible in the Project → Form Access grid even with short-lived tokens (active users are listed regardless of stored tokens), so per-form assignment works as expected.

### Admin Settings UI
- Navigate to **System > App User Settings**.
- Verify that you can see "Session TTL (Days)" and "Max Sessions per User".
- Change the values and click "Save Settings".
- Verify that the changes persist after reloading the page.
- Verify that non-admin users cannot access this page (should see 404 or redirect).
- **Fixes Verified**:
    - Settings load correctly (fixed `ifPresent` error).
    - Saving works (fixed 404 error).
    - Success alert is green (fixed styling).
    - Input validation prevents values < 1.

## Verification Results
- **Phone Number**: Verified that phone numbers are validated and displayed correctly.
- **Username**: Verified that usernames are displayed in the list and QR panel (conditionally).
- **Password**: Verified that passwords are auto-generated and meet complexity requirements.
- **Revocation**: Verified that revoking access terminates sessions and prevents password reset.
- **Restoration**: Verified that "Restore Access" works and allows the user to log in again.
- **QR Code**: Verified that QR code does not contain credentials.
- **Admin Settings**: Verified that session settings can be configured by admins.

## Screenshots
(No screenshots available in this text-based walkthrough, but UI changes were verified by the user)
