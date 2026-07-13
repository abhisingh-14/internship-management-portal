# Component 17 — Deployment

## Overview

Component 17 completes the Internship Management Portal lifecycle by configuring the project for production use. It establishes a root-level workspace script interface for single-command builds and setup, updates the Express API server to dynamically serve compiled static assets and manage client-side SPA routing fallbacks, and updates the repository setup documentation for deployment scenarios.

---

## Scope

- **Root Monorepo Configuration:** Created workspace-level convenience controls to automate multi-directory package installations, compilation, and bootstrap.
- **Express Static Hosting:** Configured the Express backend to host React static output when `NODE_ENV=production`.
- **SPA Client Routing Fallback:** Added regex-based client-side routing logic inside Express to redirect unmatched non-API/non-upload paths back to the client bundle root (`index.html`).
- **Production Settings Verification:** Performed compilation checks via Vite and verified environment parity controls.
- **README & Operational Documentation:** Created deployment checklists and updated project startup guidelines.

---

## Files Changed / Created

### New Files

| File | Purpose |
|------|---------|
| `package.json` | Root monorepo script manager. Encompasses setup, build, and run scripts for the entire workspace. |
| `docs/Components/17_Deployment.md` | Deployment component documentation file (this file). |

### Modified Files

| File | Change |
|------|--------|
| `server/app.js` | Configured to serve static assets from `client/dist` and redirect non-API routes to `index.html` under production environments. |
| `README.md` | Overhauled with complete production guides, tech stacks, folder architecture, and build-and-run directions. |

---

## Deployment Configuration & Static Hosting

### 1. Root Script Management (`package.json`)
The root `package.json` simplifies deployment on PaaS providers by exposing a unified script interface:
```json
"scripts": {
  "install:server": "cd server && npm install",
  "install:client": "cd client && npm install",
  "install-all": "npm run install:server && npm run install:client",
  "build:client": "cd client && npm run build",
  "start": "cd server && npm start",
  "dev:server": "cd server && npm run dev",
  "dev:client": "cd client && npm run dev"
}
```

### 2. Express Server Static Assets config (`server/app.js`)
The backend serves the React SPA statically when `NODE_ENV` is set to `production`. A RegExp match pattern ensures standard routing is handled by the client-side React Router while API requests and upload endpoints fall through correctly:
```javascript
// Serve React SPA in production
if (env.isProduction) {
  const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientBuildPath));
  
  // Fallback to index.html for all non-API/non-upload client routes
  app.get(/^(?!\/(api|uploads|health)).*$/, (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
  logger.info('Production static file serving initialized.');
}
```

---

## Deployment Verification Checklist

### Pre-Deployment Checks
- [x] Verify database schema and views are loaded.
- [x] Create client and server production variables (`.env`).
- [x] Verify that CORS matches the deployment domain.
- [x] Run frontend builder checks (`npm run build`).
- [x] Ensure that `BCRYPT_SALT_ROUNDS` is set to standard security levels (10).

### Build & Serving Verification
1. Run `npm run build:client` from the root workspace to compile the Vite build.
2. Confirm the presence of output files inside `client/dist/` (includes CSS chunks, JS assets, and `index.html`).
3. Set `NODE_ENV=production` inside `server/.env`.
4. Run `npm start` from the root workspace.
5. Open `http://localhost:5000` in a browser.
6. Verify that the React page renders correctly, login/registration flows remain active, and navigation back and forth preserves client-side state without browser errors.

---

## Database Changes

None. Component 17 handles deployment configuration and static serving without modifying schema definitions.
