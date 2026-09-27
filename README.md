# Vencord Mobile (Android)

A lightweight, modular, TypeScript-first client modification framework for Discord on Android (React Native / Hermes).

---

## Architecture Overview

Desktop Discord and Android Discord operate on completely different runtime engines:

| Feature | Desktop Discord (Vencord) | Mobile Discord (Vencord Android) |
| :--- | :--- | :--- |
| **Host Runtime** | Electron (Node.js + Chromium) | Android ART + React Native (Hermes VM) |
| **Bundler** | Webpack (`webpackChunkdiscord_app`) | Metro (`global.__d`, `global.__r`) |
| **Rendering Target** | HTML DOM (`div`, `span`, CSS stylesheets) | React Native Yoga Flexbox (`<View>`, `<Text>`) |
| **Hook Vector** | `app.asar` / Electron preload | `ReactNativeHost.getJSBundleFile()` / Smali hook |

---

## Monorepo Layout

```
vencord-android/
├── packages/
│   ├── core/               # Main runtime: Metro interceptor, module finder, patcher, UI & settings
│   │   ├── src/metro/      # Intercepts __d & __r; provides findByProps, findByName, findByStoreName
│   │   ├── src/patcher/    # Monkey-patching engine (before, after, instead, unpatchAll)
│   │   ├── src/api/        # Storage, React Native & theme abstractions
│   │   └── src/ui/         # React Native Settings UI component
│   ├── plugins/            # Plugin manager and built-in mobile plugins
│   │   ├── src/manager.ts  # Lifecycle (start, stop, toggle, option persistence)
│   │   └── src/builtins/   # SilentTyping, CustomTimestamps, ShowHiddenChannels, DeveloperTools
│   ├── loader-android/     # Smali hooks and native Android injection scripts
│   │   └── smali/          # ReactNativeHost.getJSBundleFile Smali injection
│   └── patcher/            # Node.js CLI & dev server for bundling and APK patching
│       ├── bin/cli.js      # CLI command runner (check, serve, patch)
│       └── src/server.ts   # Live bundle server for instant hot reload
└── tests/                  # Vitest suite verifying Metro finder, patcher & plugins
```

---

## Getting Started

### 1. Build & Run Tests
```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run unit tests
pnpm test

# Generate standalone Hermes JS bundle (dist/vencord-mobile.bundle.js)
pnpm bundle
```

### 2. Live Development Server
Start the local development server to serve the bundle directly to your Android device or emulator:
```bash
pnpm dev
# Or: node packages/patcher/bin/cli.js serve --port 4040
```
On emulator or device over USB:
```bash
adb reverse tcp:4040 tcp:4040
```

### 3. Check Patching Prerequisites
```bash
node packages/patcher/bin/cli.js check
```

---

## Writing a Mobile Plugin

Creating a plugin is simple and mirrors Vencord's clean API:

```ts
import type { Plugin, PluginContext } from "@vencord-mobile/plugins";

let unpatch: (() => void) | null = null;

export const myPlugin: Plugin = {
    name: "MyMobilePlugin",
    description: "An example mobile plugin.",
    authors: [{ name: "Eve" }],
    version: "1.0.0",
    defaultEnabled: true,

    start(ctx: PluginContext) {
        // Find modules via Metro
        const messageActions = ctx.metro.findByProps("sendMessage", "editMessage");

        // Monkey-patch functions
        unpatch = ctx.patcher.before(messageActions, "sendMessage", (args) => {
            console.log("Sending message:", args);
        });
    },

    stop() {
        if (unpatch) {
            unpatch();
            unpatch = null;
        }
    }
};
```

---

## License
MIT
