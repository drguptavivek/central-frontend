# VG Component: Short-Token App User Authentication

## Overview
This document details the frontend implementation of the new App User Authentication System, which transitions from long-lived tokens to a more secure, short-lived token system backed by username/password credentials.

## Architecture

### Core Concepts
-   **Short-Lived Tokens**: Tokens are no longer generated at creation time and stored indefinitely. Instead, they are obtained via a login process and have a limited lifespan (3 days).
-   **Password-Based Auth**: App Users are now created with a username and password. These credentials are used by the client (e.g., ODK Collect) to authenticate and obtain tokens.
-   **Namespacing**: To ensure modularity and minimize impact on the existing codebase, all new components for this feature are namespaced with the `vg-` prefix.

### API Integration
The frontend interacts with the following new/updated API endpoints (defined in `client/src/util/request.js`):

-   `POST /projects/:projectId/app-users`: Create a new App User (now accepts `username` and `password`).
-   `POST /projects/:projectId/app-users/login`: Authenticate an App User to get a token.
-   `POST /projects/:projectId/app-users/:id/password/reset`: Reset an App User's password.
-   `POST /projects/:projectId/app-users/:id/revoke-admin`: Revoke all sessions for an App User.
-   `POST /projects/:projectId/app-users/:id/active`: Activate/deactivate an App User.

## Components

The implementation introduces a set of new Vue components located in `client/src/components/field-key/`.

### 1. `vg-list.vue` (`VgFieldKeyList`)
-   **Purpose**: The main container for managing App Users.
-   **Changes**: Replaces the standard `FieldKeyList`. It integrates the `vg-` namespaced sub-components and handles the display logic for the new auth flow.
-   **Integration**: Loaded via `client/src/util/load-async.js` to replace the default `FieldKeyList`.

### 2. `vg-new.vue` (`VgFieldKeyNew`)
-   **Purpose**: Modal for creating new App Users.
-   **Changes**:
    -   Adds input fields for `Username` and `Password`.
    -   Submits these credentials to the backend.
    -   Passes the credentials to `vg-qr-panel` upon success.

### 3. `vg-row.vue` (`VgFieldKeyRow`)
-   **Purpose**: Represents a single App User in the list.
-   **Changes**:
    -   Removes the "See code" link (as tokens are not available in the list).
    -   Adds a "Reset Password" action to the dropdown menu.
    -   Updates "Access revoked" display logic.

### 4. `vg-qr-panel.vue` (`VgFieldKeyQrPanel`)
-   **Purpose**: Generates the configuration QR code for ODK Collect.
-   **Changes**:
    -   Accepts `username` and `password` props.
    -   Constructs a configuration object that embeds these credentials instead of a token.
    -   Sets the `server_url` to the project root (e.g., `/v1/projects/:id`) rather than the key-based URL.

### 5. `vg-revoke.vue` (`VgFieldKeyRevoke`)
-   **Purpose**: Modal for revoking App User access.
-   **Changes**: Uses the `revoke-admin` endpoint to invalidate all sessions for the user.

### 6. `vg-reset-password.vue` (`VgFieldKeyResetPassword`)
-   **Purpose**: Modal for resetting an App User's password.
-   **Changes**:
    -   New component.
    -   Allows admins to set a new password.
    -   Displays a QR code with the new credentials upon success.

## Authentication Flow

### User Creation
1.  Admin opens `VgFieldKeyNew` modal.
2.  Admin enters Display Name, Username, and Password.
3.  Frontend calls `POST /app-users`.
4.  On success, `VgFieldKeyQrPanel` is shown, generating a QR code containing the Username and Password.
5.  ODK Collect scans the QR code and uses the credentials to log in.

### Password Reset
1.  Admin selects "Reset Password" from `VgFieldKeyRow`.
2.  Admin enters a new password in `VgFieldKeyResetPassword`.
3.  Frontend calls `POST /password/reset`.
4.  On success, a QR code with the new password is shown.

### Revocation
1.  Admin selects "Revoke access" from `VgFieldKeyRow`.
2.  Frontend calls `POST /revoke-admin`.
3.  Backend invalidates all existing tokens for that user.

## Integration Strategy

To use these new components, the `FieldKeyList` loader in `client/src/util/load-async.js` was updated to point to `vg-list.vue`. This ensures that the application loads the new interface when navigating to the App Users page, while keeping the original files intact for reference or fallback.

```javascript
// client/src/util/load-async.js
.set('FieldKeyList', loader(() => import(
  /* webpackChunkName: "component-field-key-list" */
  '../components/field-key/vg-list.vue'
)))
```
