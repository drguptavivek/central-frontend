# Development Server Setup

This document outlines how to run the ODK Central Frontend in development mode, connecting to a backend server (local or remote).

## Prerequisites

-   **Backend**: You must have a running ODK Central Backend. This can be:
    -   A local Dockerized instance (e.g., running via `make dev` at `https://central-dev` or `http://localhost:8383`).
    -   A remote server.

## Option 1: Dockerized Dev Environment (Recommended)

This option runs the frontend (Vite + Nginx) inside a Docker container. It provides a consistent environment and avoids the need to install Nginx locally.

### Setup
1.  Ensure your backend is running.
2.  If your backend is at `https://central-dev`, ensure `central-dev` is mapped in your `/etc/hosts` or accessible via Docker network.

### Running
Run the `client-dev` service:
```bash
docker compose up -d client-dev
```

### Access
-   **URL**: `http://localhost:8989`
-   **HMR**: Hot Module Replacement is enabled. Changes to files in `client/` will automatically update the browser.

### Configuration
-   **Dockerfile**: `client/Dockerfile.dev`
-   **Compose Service**: `client-dev` in `docker-compose.override.yml`
-   **Ports**:
    -   `8989`: Exposed to host (Vite/App).
    -   `8686`: Internal Nginx proxy.
    -   `80`: **Not used** (avoids conflicts with main Central server).

---

## Option 2: Local Environment (`npm run dev`)

This option runs the frontend directly on your host machine.

### Prerequisites
-   **Node.js**: Version 18+ (see `.nvmrc` or `package.json`).
-   **Nginx**: Must be installed on your system (e.g., `brew install nginx`).

### Configuration
The local Nginx proxy is configured in `client/main.nginx.conf`. By default, it is set up to proxy API requests to `https://central-dev`.

To change the backend target, edit `client/main.nginx.conf`:
```nginx
location ~ ^/v\d {
  # Change this to your backend URL
  proxy_pass https://central-dev;
  # ...
}
```

### Running
1.  Navigate to the client directory: `cd client`
2.  Install dependencies: `npm install`
3.  Start the server: `npm run dev`

### Access
-   **URL**: `http://localhost:8989`
