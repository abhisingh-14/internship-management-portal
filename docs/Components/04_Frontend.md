# Frontend Boilerplate

## Objective

This component builds the generic, resource-agnostic frontend architecture
on top of `client/`'s skeleton from the Project Setup component: the
routed application layout (Navbar, Sidebar, Footer composed via
`MainLayout`), a small set of reusable presentational components, generic
(non-auth, non-API) custom hooks, and a generic Axios error-normalization
layer. No authentication and no resource-specific API calls are introduced
in this component, per `Project_Components.md`'s explicit exclusions for
Component 04.

This component directly completes Phase 5 ("Frontend Foundation") from the
roadmap defined in `docs/00_Project_Overview.md`, laying the groundwork for
Phase 6 ("Frontend Role Dashboards").

---

## Features Implemented

- A fully routed application shell: `AppRoutes.jsx` now nests every route
  under a shared `MainLayout`, replacing the single placeholder route left
  by the Project Setup component.
- `MainLayout` — composes `Navbar`, a collapsible `Sidebar`, the routed
  page content (`<Outlet />`), and `Footer` into a consistent full-height
  page shell, per the component hierarchy in
  `docs/04_Project_Architecture.md` §11.
- `Navbar` — a responsive Bootstrap navbar with a brand link, a
  collapsible mobile menu, and a sidebar-toggle button. Role-agnostic by
  design: it does not reference authentication state, since `AuthContext`
  does not exist yet.
- `Sidebar` — a reusable, prop-driven side navigation column. Accepts an
  `items` array rather than hard-coding role-specific links, so
  Student/Company/Admin dashboard components (later components) can supply
  their own navigation without modifying this component. Behaves as a
  slide-in overlay on mobile widths and a persistent column on desktop
  widths.
- `Footer` — a static, presentational footer with no dead links to
  not-yet-built pages.
- `Loader` and `AlertMessage` — small, reusable, Bootstrap-based UI
  components (spinner and dismissible alert) that every future
  data-fetching page/component can reuse instead of reimplementing loading
  and error display.
- Three generic custom hooks (`useToggle`, `useWindowWidth`,
  `useClickOutside`) extracted so the layout components don't duplicate
  toggle-state, resize-listener, or outside-click-detection logic, per
  `docs/05_Coding_Standards.md` §13's guidance to extract shared logic into
  custom hooks.
- Three shared, role-agnostic pages: `Home` (public landing page),
  `NotFound` (404 catch-all), and `Unauthorized` (static 403 view, ready
  to be used by the `RoleRoute` guard once the Authentication component
  introduces it).
- A generic Axios response interceptor (`normalizeApiError`) added to the
  existing `services/api.js` instance, converting any Axios error —
  network failure, timeout, or a server error envelope per
  `docs/03_API_Design.md` §5 — into a single predictable
  `{ status, message, errors }` shape for use with `AlertMessage`.
- Minimal, scoped custom CSS (`index.css`) implementing the responsive
  sidebar overlay/transition behavior that Bootstrap's utility classes
  alone cannot express, per `docs/05_Coding_Standards.md` §12.
- `prop-types` added as a frontend dependency and used on every new shared
  component, per `docs/05_Coding_Standards.md` §13.

---

## Folder Structure

```
internship-management-portal/
└── client/
    ├── package.json                        (modified — added prop-types)
    └── src/
        ├── index.css                       (modified — layout CSS)
        ├── components/
        │   └── common/
        │       ├── Navbar.jsx              (new)
        │       ├── Sidebar.jsx             (new)
        │       ├── Footer.jsx              (new)
        │       ├── MainLayout.jsx          (new)
        │       ├── Loader.jsx              (new)
        │       └── AlertMessage.jsx        (new)
        ├── hooks/                          (new directory)
        │   ├── useToggle.js                (new)
        │   ├── useWindowWidth.js           (new)
        │   └── useClickOutside.js          (new)
        ├── pages/
        │   └── shared/
        │       ├── Home.jsx                (new)
        │       ├── NotFound.jsx            (new)
        │       └── Unauthorized.jsx        (new)
        ├── routes/
        │   └── AppRoutes.jsx               (modified — real route tree)
        └── services/
            └── api.js                      (modified — error normalization)
```

`client/src/hooks/` is a new top-level directory under `src/`, added
alongside the existing `assets/`, `components/`, `context/`, `pages/`,
`routes/`, `services/`, and `utils/` folders scaffolded by the Project
Setup component. It holds reusable custom hooks referenced by name in
`docs/05_Coding_Standards.md` §13 (`useAuth`, `usePagination`,
`useDebounce`, etc.) — the same precedent the Database component set when
it added a new `server/database/` directory not present in the original
folder listing.

`client/src/context/` remains untouched (still `.gitkeep`-only), reserved
for `AuthContext.jsx`, exactly as the Project Setup component left it. See
**Notes** below for why no new Context was introduced here.

---

## Files Created

| File | Purpose |
|------|---------|
| `client/src/hooks/useToggle.js` | Generic boolean-toggle hook (value, toggle, setValue) used for Sidebar/mobile-menu open state. |
| `client/src/hooks/useWindowWidth.js` | Tracks viewport width on resize; used by `MainLayout` to auto-close the mobile Sidebar overlay at desktop widths. |
| `client/src/hooks/useClickOutside.js` | Detects pointer events outside a ref'd element; used by `Sidebar` to close on outside click/tap. |
| `client/src/components/common/Loader.jsx` | Reusable Bootstrap spinner (`fullPage`, `size`, `label` props) for future loading states. |
| `client/src/components/common/AlertMessage.jsx` | Reusable dismissible Bootstrap alert (`type`, `message`, `title`, `onClose` props) for future error/success/info display. |
| `client/src/components/common/Navbar.jsx` | Responsive top navigation bar with mobile menu collapse and sidebar-toggle button. |
| `client/src/components/common/Sidebar.jsx` | Reusable, prop-driven collapsible side navigation column. |
| `client/src/components/common/Footer.jsx` | Static application footer. |
| `client/src/components/common/MainLayout.jsx` | Root layout shell composing Navbar, Sidebar, routed content (`<Outlet />`), and Footer. |
| `client/src/pages/shared/Home.jsx` | Public landing page. |
| `client/src/pages/shared/NotFound.jsx` | Generic 404 page for the catch-all route. |
| `client/src/pages/shared/Unauthorized.jsx` | Generic 403 page, ready for future `RoleRoute` redirects. |
| `docs/Components/04_Frontend.md` | This document. |

---

## Files Modified

| File | Change | Reason |
|------|--------|--------|
| `client/src/routes/AppRoutes.jsx` | Replaced the single placeholder route from Project Setup with a real route tree: `MainLayout` as the layout route, nesting `index` (`Home`), `unauthorized` (`Unauthorized`), and `*` (`NotFound`). | Project Setup explicitly deferred "all real pages" and route structure to later components; this is that component. |
| `client/src/services/api.js` | Added a response interceptor (`normalizeApiError`) that converts any Axios error into a consistent `{ status, message, errors }` shape. Request interceptor (Authorization header) and 401-specific global-logout handling are still **not** added. | Project Setup deferred all interceptors to Authentication. This component adds only the auth-independent half (generic error shape normalization) so `AlertMessage`-driven error display can be built consistently starting now; the auth-dependent half remains correctly scoped to Component 05. |
| `client/src/index.css` | Added CSS custom properties (`--sidebar-width`, `--navbar-height`) and the responsive fixed-position/transform rules needed for the Sidebar's mobile slide-in overlay and backdrop. | Project Setup reserved this file for "brand-level CSS variable overrides only"; the Sidebar's responsive overlay behavior cannot be expressed with Bootstrap utility classes alone, and Coding Standards §12 permits minimal, scoped custom CSS for exactly this kind of case. |
| `client/package.json` | Added `prop-types` (`^15.8.1`) to `dependencies`. | Required by the `PropTypes` validation now present on every new shared component (`Navbar`, `Sidebar`, `Loader`, `AlertMessage`), per Coding Standards §13. |

No changes were made to `client/src/App.jsx`, `client/src/main.jsx`,
`client/vite.config.js`, `client/index.html`, or any file under `server/`
— none required modification for this component.

---

## Dependencies Used

| Package | Type | Reason |
|---------|------|--------|
| `prop-types` | dependency (new) | Lightweight runtime prop validation for shared, reusable components (`Navbar`, `Sidebar`, `Loader`, `AlertMessage`), per `docs/05_Coding_Standards.md` §13. |
| `react-router-dom` | dependency (existing) | Powers the now fully-built-out `AppRoutes.jsx` route tree and layout nesting via `<Outlet />`. |
| `axios` | dependency (existing) | Underlies the enhanced `services/api.js` instance and its new response interceptor. |
| `bootstrap` | dependency (existing) | Sole styling framework for every new component; only its CSS is imported (no Bootstrap JS bundle), since all interactive behavior (menu collapse, sidebar toggle) is implemented with React state rather than Bootstrap's `data-bs-*` JS widgets. |

---

## Database Changes

None. This component contains no backend code, models, or SQL of any kind.

---

## API Endpoints

None. No new routes, controllers, or models are introduced. No
resource-specific frontend service files (e.g. `internshipService.js`)
are created — per this component's explicit exclusion of "APIs," the only
change to the service layer is the generic, resource-agnostic error
normalization in `services/api.js`.

---

## Frontend Components

| Component/Page | File | Description |
|------------------|------|--------------|
| `MainLayout` | `client/src/components/common/MainLayout.jsx` | Root layout shell; composes Navbar, Sidebar, `<Outlet />`, Footer; owns local sidebar-open state. |
| `Navbar` | `client/src/components/common/Navbar.jsx` | Top navigation bar with responsive collapse and a sidebar-toggle button. |
| `Sidebar` | `client/src/components/common/Sidebar.jsx` | Reusable, prop-driven collapsible side navigation. |
| `Footer` | `client/src/components/common/Footer.jsx` | Static footer. |
| `Loader` | `client/src/components/common/Loader.jsx` | Reusable Bootstrap spinner. |
| `AlertMessage` | `client/src/components/common/AlertMessage.jsx` | Reusable dismissible Bootstrap alert. |
| `Home` | `client/src/pages/shared/Home.jsx` | Public landing page. |
| `NotFound` | `client/src/pages/shared/NotFound.jsx` | Generic 404 page. |
| `Unauthorized` | `client/src/pages/shared/Unauthorized.jsx` | Generic 403 page. |
| `AppRoutes` | `client/src/routes/AppRoutes.jsx` | Central route configuration, now with real layout nesting. |

`ProtectedRoute` and `RoleRoute` (listed under `common/` in
`docs/04_Project_Architecture.md` §5/§11) were **not** created in this
component — both inherently require `AuthContext` to know whether a user is
authenticated and what role they hold, so they are correctly deferred to
the Authentication component (Component 05).

---

## Security Considerations

- **No new attack surface.** This component adds no forms, no user input
  handling, and no new database or API access — it is purely presentational
  and routing infrastructure.
- **No dead/fake links.** `Navbar`, `Sidebar`, and `Footer` link only to
  routes that actually exist (`/`) in this component; links to
  not-yet-built pages (Login, Register, Browse Internships) are
  intentionally omitted rather than pointing at placeholder content, and
  will be added by the components that build those pages.
- **Error messages stay generic and safe.** `normalizeApiError` only ever
  surfaces `message`/`errors` fields already sanitized by the backend's
  centralized error handler (per `docs/05_Coding_Standards.md` §9); it does
  not expose raw Axios internals, stack traces, or request payloads to the
  UI.
- **No premature auth assumptions.** No component in this boilerplate
  reads or assumes the existence of a token, user object, or role,
  preventing subtle bugs where a later `AuthContext` integration must
  retrofit code that already (incorrectly) assumed authentication state.

---

## Testing Checklist

- [ ] `cd client && npm install` completes successfully and installs
      `prop-types` alongside the existing dependencies.
- [ ] `npm run dev` starts the Vite dev server without errors.
- [ ] Visiting `http://localhost:5173/` renders the Navbar, Sidebar
      (visible on desktop widths, hidden by default on mobile widths),
      the `Home` page content, and the Footer, with no console errors or
      warnings.
- [ ] Resizing the browser below `768px` hides the Sidebar by default;
      clicking the hamburger button in the Navbar slides it in as an
      overlay with a dark backdrop.
- [ ] Clicking the backdrop, or clicking a Sidebar link, closes the mobile
      Sidebar overlay (via `useClickOutside` / `onClose`).
- [ ] Resizing the browser back above `768px` while the mobile Sidebar
      overlay is open automatically closes the overlay state (Sidebar
      becomes the persistent desktop column instead).
- [ ] Visiting `http://localhost:5173/unauthorized` renders the
      `Unauthorized` page inside the same `MainLayout` shell.
- [ ] Visiting any undefined route (e.g. `http://localhost:5173/does-not-exist`)
      renders the `NotFound` page inside the same `MainLayout` shell, with
      a working "Back to Home" link.
- [ ] Bootstrap's default styling is visibly applied to the navbar, alerts,
      spinners, and buttons; no visual regressions from Component 01's
      baseline styling.
- [ ] Temporarily rendering `<Loader fullPage label="Testing..." />` on the
      `Home` page displays a centered Bootstrap spinner with the given
      label, then can be removed without residual console errors.
- [ ] Temporarily rendering `<AlertMessage type="danger" message="Test error" onClose={() => {}} />`
      on the `Home` page displays a dismissible Bootstrap alert that
      disappears when its close button is clicked (state managed by the
      test caller, not the component itself).
- [ ] `npm run lint` passes on the frontend, including the new
      `hooks/`, `components/common/`, and `pages/shared/` files.

---

## Future Dependencies

- **Authentication component (Component 05)** — will populate
  `client/src/context/AuthContext.jsx`; add a request interceptor to
  `client/src/services/api.js` (Authorization header attachment) alongside
  the response interceptor already added here; add global `401` handling
  (clear `AuthContext`, redirect to `/login`) to that same response
  interceptor; create `ProtectedRoute` and `RoleRoute` in
  `components/common/`; add `pages/auth/Login.jsx` and
  `pages/auth/Register.jsx`; and extend `Navbar` to conditionally render
  Login/Register vs. a user menu/Logout button based on `AuthContext`.
- **Frontend Role Dashboards component** — will add
  `pages/student/Dashboard.jsx`, `pages/company/Dashboard.jsx`, and
  `pages/admin/Dashboard.jsx`, each supplying its own role-specific
  `items` array to `Sidebar` (replacing `MainLayout`'s current generic
  default) and registering new nested routes in `AppRoutes.jsx` under
  `RoleRoute` guards.
- **Internship Listing / Internship Management components** — will
  introduce the first real resource service files (e.g.
  `internshipService.js`) built on top of the `api` instance and
  `normalizeApiError` shape established here, and will likely introduce a
  `usePagination`-style hook alongside the ones added in this component.
- **Any future data-fetching page** — will reuse `Loader` (while a request
  is in flight) and `AlertMessage` (to surface `normalizeApiError`'s
  `message`/`errors`) rather than reimplementing loading/error UI.

---

## Notes

- **Design choice — no new global Context.** `docs/04_Project_Architecture.md`
  §12 states that `AuthContext` is meant to be the *only* piece of
  application-wide state, with everything else scoped to the
  component/page that owns it. The Sidebar's open/closed state is exactly
  this kind of layout-local concern, so it is implemented as local state
  inside `MainLayout` via the new `useToggle` hook rather than as a new
  global `SidebarContext`/`UIContext`. This satisfies the architectural
  intent behind the "Context" item in `Project_Components.md`'s Component
  04 scope without violating the single-global-context rule or
  encroaching on the Authentication component's ownership of
  `client/src/context/`.
- **Design choice — no Bootstrap JS bundle.** Only `bootstrap/dist/css/bootstrap.min.css`
  is imported (unchanged from Project Setup). The Navbar's mobile collapse
  and the Sidebar's toggle/overlay behavior are implemented with React
  state and conditional class names rather than Bootstrap's
  `data-bs-toggle` JavaScript widgets, keeping all interactivity
  React-idiomatic and testable, and avoiding an additional JS dependency.
- **Assumption:** `client/package.json`'s prior content matched the
  dependency/script list documented in
  `docs/Components/01_Project_Setup.md` (the file itself was not available
  to read directly in this session). The version shown above reconstructs
  that documented state with `prop-types` added; if the actual repository
  file differs, only the `prop-types` entry needs to be merged in.
- **Limitation:** `Sidebar`'s default `items` prop (`[{ label: 'Home', path: '/' }]`)
  is a placeholder-free but intentionally minimal default — it is
  immediately meaningful (a working link) rather than a stub, and is
  expected to be overridden by every future role dashboard.
- **Limitation:** No automated test files/framework are introduced here —
  automated test tooling is explicitly deferred to Component 16 (Testing)
  per `Project_Components.md`.

---

*End of Document — 04_Frontend.md*
