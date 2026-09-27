import { DiscordPatcher } from "./patcher.js";
import { startDevServer } from "./server.js";

export async function runCli() {
    const args = process.argv.slice(2);
    const command = args[0];

    console.log("=========================================");
    console.log("   Vencord Mobile (Android) Patcher CLI   ");
    console.log("=========================================\n");

    const patcher = new DiscordPatcher();

    if (!command || command === "help" || command === "--help" || command === "-h") {
        console.log("Usage:");
        console.log("  vencord-patcher check              Check prerequisites (apktool, java, apksigner)");
        console.log("  vencord-patcher serve [--port N]   Start local bundle live-reload server");
        console.log("  vencord-patcher patch <discord.apk> [output.apk]   Patch a Discord APK with Vencord Mobile");
        return;
    }

    if (command === "check") {
        console.log("Checking prerequisites...");
        const prereqs = patcher.checkPrerequisites();
        console.log(`  apktool:     ${prereqs.apktool ? "✅ Installed" : "❌ Not found (install via apt/pacman/brew or apktool.jar)"}`);
        console.log(`  java:        ${prereqs.java ? "✅ Installed" : "❌ Not found (install OpenJDK)"}`);
        console.log(`  zipalign:    ${prereqs.zipalign ? "✅ Installed" : "⚠️  Not found (recommended for release APKs)"}`);
        console.log(`  apksigner:   ${prereqs.apksigner ? "✅ Installed" : "⚠️  Not found (uber-apk-signer or Android SDK apksigner)"}`);
        return;
    }

    if (command === "serve") {
        const portIdx = args.indexOf("--port");
        const port = portIdx !== -1 && args[portIdx + 1] ? parseInt(args[portIdx + 1], 10) : 4040;
        startDevServer(port);
        return;
    }

    if (command === "patch") {
        const inputApk = args[1];
        const outputApk = args[2] || "discord-vencord-patched.apk";

        if (!inputApk) {
            console.error("Error: Please specify the input Discord APK path.");
            console.error("Example: vencord-patcher patch Discord-250.0.apk");
            process.exit(1);
        }

        try {
            await patcher.patchApk({ inputApk, outputApk });
        } catch (err: any) {
            console.error("\n❌ Patching failed:", err.message || err);
            process.exit(1);
        }
        return;
    }

    console.error(`Unknown command: ${command}`);
    console.log("Run 'vencord-patcher --help' for usage info.");
}

runCli().catch((err) => {
    console.error(err);
    process.exit(1);
});
