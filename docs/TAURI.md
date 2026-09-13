# Akademia — Tauri Desktop Integration

This document describes how the Akademia web application is packaged
as a native Windows desktop application via **Tauri v2**, and how the
client-server integration works in desktop mode.

---

## 1. Architecture overview

```
┌──────────────────────────────────────────┐
│  Desktop Window (Tauri Webview)          │
│  ┌────────────────────────────────────┐  │
│  │  React SPA (Vite build → dist/)    │  │
│  │  - Auth (Supabase JS client)       │  │
│  │  - Axios → http://localhost:5000   │  │
│  │  - All UI, routing, state          │  │
│  └────────────────────────────────────┘  │
│         Webview (HTML/CSS/JS)            │
└──────────────┬───────────────────────────┘
               │ HTTP (localhost:5000)
┌──────────────▼───────────────────────────┐
│  Akademia API Server (Node/Express)      │
│  - Auth (Supabase Admin JWT verification)│
│  - Tenant-scoped CRUD                    │
│  - PDF generation, email, SMS, payments  │
└──────────────────────────────────────────┘
```

**Key principle:** The desktop app is a thin webview shell. It loads the
same React SPA that runs in a browser, and talks to the API server
over HTTP — exactly like the browser version. No business logic moves
into the Rust side. This keeps the codebase simple and means the web
and desktop versions are always in sync.

---

## 2. What exists today

| File | Purpose |
|---|---|
| `client/src-tauri/tauri.conf.json` | Tauri app configuration (name, version, window, build targets, icons) |
| `client/src-tauri/Cargo.toml` | Rust manifest — Tauri v2 + log plugin + serde |
| `client/src-tauri/src/main.rs` | Entry point — calls `app_lib::run()` |
| `client/src-tauri/src/lib.rs` | Tauri builder — registers the log plugin (dev only) and runs the app |
| `client/src-tauri/build.rs` | Build script — calls `tauri_build::build()` |
| `client/src-tauri/capabilities/default.json` | Default system permissions for the main window |
| `client/src-tauri/icons/` | App icons (PNG, ICO, ICNS) for Windows/macOS/Linux bundles |
| `client/src-tauri/.gitignore` | Ignores `target/` and generated `gen/schemas/` |
| `client/package.json` | DevDependency: `@tauri-apps/cli` v2.11.4 |

---

## 3. How the client talks to the server

The React app uses `axios` with a base URL set via `VITE_API_URL`
(default: `http://localhost:5000/api/v1`).

| Mode | Client URL | Server URL |
|---|---|---|
| **Browser dev** | `http://localhost:5173` | `http://localhost:5000` (running in terminal) |
| **Tauri dev** | Loaded from `devUrl` in tauri.conf.json | `http://localhost:5000` (must be running) |
| **Tauri production** | Bundled `dist/` inside .exe | Deployed API server (e.g. `https://akademia.app`) |

Authentication flows through Supabase's JS client (browser-based OAuth
/ magic link / password), then the server validates the Supabase JWT
on every request via `supabaseAdmin.auth.getUser()`. The desktop
webview has the same Supabase session as the browser — no extra auth
work is needed.

---

## 4. Build & run commands

### Prerequisites

- **Rust** (https://rustup.rs) — Tauri's desktop shell is written in Rust
- **Visual Studio C++ Build Tools** — required for linking on Windows
- **Node.js 18+** — for the Vite build and Tauri CLI

### Development (desktop window)

```bash
cd client
npx tauri dev
```

This starts the Vite dev server, then opens a native window pointing at
it. You can also press `Ctrl+D` in the Tauri window to open the
browser version, or `Ctrl+Shift+I` for dev tools.

### Production build

```bash
cd client
npm run build          # Vite bundles the React app → dist/
npx tauri build        # Bundles dist/ into native executable
```

**Output:** `client/src-tauri/target/release/bundle/windows/Akademia_*.msi`
(Windows installer) or `Akademia_*.exe` (portable executable).

### Running the server alongside

The desktop app needs the API server running. Start it separately:

```bash
cd server
npm run dev            # Starts on http://localhost:5000
```

For production packaging, update `tauri.conf.json` → `build.devUrl` to
point to your deployed server instead of `http://localhost:5173`.

---

## 5. Configuration reference

### `tauri.conf.json` — key fields

```json
{
  "productName": "Akademia",          // Shown in window title & installer
  "version": "0.1.0",                // Semantic version
  "identifier": "com.tauri.dev",     // Reverse-DNS bundle ID
  "build": {
    "frontendDist": "../dist",       // Where Vite outputs the bundle
    "devUrl": "http://localhost:5173", // URL for tauri dev mode
    "beforeDevCommand": "npm run dev", // Starts Vite before Tauri window
    "beforeBuildCommand": "npm run build" // Bundles before Tauri build
  },
  "app": {
    "windows": [{ "title": "...", "width": 800, "height": 600 }],
    "security": { "csp": null }      // Content Security Policy (null = relaxed)
  },
  "bundle": {
    "active": true,
    "targets": "all",                // Build all platform bundles
    "icon": ["icons/..."]            // App icons (multiple sizes)
  }
}
```

### Environment variables in desktop mode

The desktop app reads the **same** `.env` files as the browser version:

- `client/.env` — `VITE_*` variables (e.g. `VITE_API_URL`,
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`)
- `server/.env` — server-only secrets (NOT embedded in the desktop app)

**⚠️ Security:** The `VITE_` prefix means these are bundled into the
desktop app and visible to anyone inspecting it. For production, set
`VITE_API_URL` to your deployed API URL and use the Supabase
publishable key (safe to expose — RLS enforces permissions server-side).
Never embed `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, or any
server secrets in the client bundle.

---

## 6. Permissions & capabilities

Tauri v2 uses a **capabilities system** — explicit permission sets that
control what the app can do. Currently:

**`capabilities/default.json`** — grants `core:default` permissions:
- Basic window management
- Dialog open/save (if needed)
- Standard webview functionality

The desktop app currently only needs these default permissions because
it communicates with a remote API (no local file system access, no
native OS integrations). If you later add offline storage or local
features, you'll need to add capabilities like:

- `fs:allow-read` / `fs:allow-write` — file system access
- `shell:allow-open` — open external URLs
- `notification` — native OS notifications
- `updater` — auto-update checks

Each capability is a JSON file in `capabilities/` referenced from
`tauri.conf.json` → `app.security.perissions`.

---

## 7. Rust side — what the code does

### `src/lib.rs` (the application entry point)

```rust
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
```

- **`tauri::Builder`** — creates the Tauri application
- **`setup`** — runs once at startup; registers the log plugin in dev
  mode only (production doesn't need it)
- **`tauri::generate_context!()`** — a Rust macro that reads
  `tauri.conf.json` at compile time and generates a `Context` struct
  containing all app configuration (windows, bundle info, capabilities)
- **`run()`** — starts the event loop, creates the webview window, and
  serves the bundled frontend

### `src/main.rs` — entry point

```rust
fn main() {
  app_lib::run();
}
```

This delegates to `lib.rs` so that `lib.rs` can be tested independently
and the binary is a thin wrapper.

### No custom Tauri commands yet

Currently there are **no `#[tauri::command]` functions** in the Rust
side. The desktop app is a pure webview — all logic runs in the React
SPA or the remote API. This is intentional:

- Keeps the Rust code minimal (just window management + logging)
- No FFI boundary to maintain
- Web and desktop behave identically
- Business logic stays in TypeScript/Node.js where it's easier to test

Future enhancements (offline storage, file system integration, native
dialogs) would add commands via `#[tauri::command]`.

---

## 8. Production deployment checklist

Before building the production `.exe`/`.msi`:

- [ ] Set `VITE_API_URL` in `client/.env` to your deployed API URL
  (e.g. `https://api.akademia.app`)
- [ ] Use your verified Supabase publishable key in `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] Update `tauri.conf.json` → `build.devUrl` if needed for dev mode
- [ ] Test the production build in browser first: `cd client && npm run build && npm run preview`
- [ ] Verify all API endpoints are reachable from the bundled app (CORS, HTTPS)
- [ ] Build Rust toolchain is installed and working (`rustc --version`)
- [ ] Test on a clean Windows machine (not just dev machine)
- [ ] Set proper `productName`, `version`, and `identifier` in `tauri.conf.json`
- [ ] Verify app icons render correctly at all sizes

---

## 9. Troubleshooting

### `cargo` not found
Rust isn't installed or not in PATH. Install from https://rustup.rs
and restart your terminal.

### `npx tauri dev` says "no workspace"
Run `npm install` in `client/` first to install `@tauri-apps/cli`.

### Tauri window shows blank page
The Vite dev server isn't running (for `tauri dev`), or the `dist/`
directory is stale (for `tauri build`). Run `npm run dev` or
`npm run build` in `client/` first.

### Build fails with linker errors
Install Visual Studio C++ Build Tools from
https://visualstudio.microsoft.com/visual-cpp-build-tools/ and select
"Desktop development with C++" workload.

### CORS errors in production desktop app
The desktop app makes HTTP requests to `VITE_API_URL`. If that URL is
on a different origin, the server must allow it via CORS. Check
`server/.env` → `CLIENT_URL` includes the API server's origin.

### Port 5000 already in use
The Tauri dev window and your terminal server both need port 5000.
Either run them on different ports or use one at a time.

### `.exe` is too large
The first build includes the Rust toolchain runtime. Subsequent builds
are smaller. Run `cargo clean` in `client/src-tauri/` to force a fresh
build if you need to reduce size further.

---

## 10. Future enhancements (roadmap)

| Enhancement | Benefit | Complexity |
|---|---|---|
| Offline storage (SQLite via Tauri) | Grade entry & attendance work without internet | Medium |
| File system access (read/write PDFs locally) | Download report cards to a chosen folder | Low |
| Native notifications | Reminders for fee deadlines, new results | Low |
| Auto-updater | Push desktop app updates without manual installs | Low |
| System tray (minimize to tray) | Keep running in background for notifications | Medium |
| Native file picker for imports | CSV student import from local files | Low |
| Print support (native print) | Print report cards without browser dialog | Medium |
| Single sign-on (Windows Integrated Auth) | SSO for school domain-joined machines | High |

Each of these would add a Tauri command (`#[tauri::command]` in Rust,
`invoke()` from TypeScript) and a capability in `capabilities/`.

---

*Last updated: September 2026 · Akademia v1.0*
