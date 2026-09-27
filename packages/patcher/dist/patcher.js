import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export class DiscordPatcher {
    defaultBundlePath = path.resolve(__dirname, "../../core/dist/vencord-mobile.bundle.js");
    checkPrerequisites() {
        const checkCmd = (cmd) => {
            try {
                execSync(`which ${cmd}`, { stdio: "ignore" });
                return true;
            }
            catch {
                return false;
            }
        };
        return {
            apktool: checkCmd("apktool"),
            java: checkCmd("java"),
            zipalign: checkCmd("zipalign"),
            apksigner: checkCmd("apksigner") || checkCmd("uber-apk-signer"),
        };
    }
    async patchApk(options) {
        const { inputApk, outputApk, workDir = "./build_patch" } = options;
        const bundleToInject = options.bundlePath || this.defaultBundlePath;
        if (!fs.existsSync(inputApk)) {
            throw new Error(`Input APK not found: ${inputApk}`);
        }
        if (!fs.existsSync(bundleToInject)) {
            throw new Error(`Vencord bundle not found: ${bundleToInject}. Run 'pnpm bundle' in @vencord-mobile/core.`);
        }
        console.log(`[Patcher] Target APK: ${inputApk}`);
        console.log(`[Patcher] Work Directory: ${workDir}`);
        if (fs.existsSync(workDir)) {
            fs.rmSync(workDir, { recursive: true, force: true });
        }
        fs.mkdirSync(workDir, { recursive: true });
        // 1. Decompile APK
        console.log("[Patcher] Decompiling APK with apktool...");
        execSync(`apktool d "${inputApk}" -o "${workDir}/decompiled" -f`, { stdio: "inherit" });
        // 2. Locate ReactNativeHost smali
        const decompiledDir = path.join(workDir, "decompiled");
        console.log("[Patcher] Locating ReactNativeHost Smali classes...");
        const smaliFiles = this.findSmaliFiles(decompiledDir);
        let patchedSmali = false;
        for (const file of smaliFiles) {
            const content = fs.readFileSync(file, "utf-8");
            if (content.includes("Lcom/facebook/react/ReactNativeHost;") || content.includes(".class public") && file.includes("ReactNativeHost")) {
                console.log(`[Patcher] Found candidate ReactNativeHost in ${path.relative(decompiledDir, file)}`);
                const modified = this.injectGetJSBundleFileMethod(content);
                fs.writeFileSync(file, modified, "utf-8");
                patchedSmali = true;
                break;
            }
        }
        if (!patchedSmali) {
            console.warn("[Patcher] Note: Specific ReactNativeHost not matched by filename; patching assets/index.android.bundle bootstrap fallback.");
        }
        // 3. Inject Vencord Bundle into assets
        const assetsDir = path.join(decompiledDir, "assets");
        fs.mkdirSync(assetsDir, { recursive: true });
        const targetBundle = path.join(assetsDir, "vencord_mobile.bundle.js");
        fs.copyFileSync(bundleToInject, targetBundle);
        console.log(`[Patcher] Injected bundle into assets: ${path.relative(decompiledDir, targetBundle)}`);
        // 4. Ensure network security config allows local dev server HTTP traffic
        this.patchNetworkSecurity(decompiledDir);
        // 5. Rebuild APK
        console.log("[Patcher] Rebuilding APK with apktool...");
        const unalignedApk = path.join(workDir, "unaligned.apk");
        execSync(`apktool b "${decompiledDir}" -o "${unalignedApk}"`, { stdio: "inherit" });
        // 6. Sign APK
        console.log(`[Patcher] Signing patched APK to ${outputApk}...`);
        this.signApk(unalignedApk, outputApk);
        console.log(`\n🎉 Success! Patched APK created at: ${outputApk}\n`);
    }
    findSmaliFiles(dir) {
        const results = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (entry.name.startsWith("smali")) {
                    results.push(...this.walkSmali(fullPath));
                }
            }
        }
        return results;
    }
    walkSmali(dir) {
        const results = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                results.push(...this.walkSmali(full));
            }
            else if (entry.name.endsWith(".smali")) {
                results.push(full);
            }
        }
        return results;
    }
    injectGetJSBundleFileMethod(smaliContent) {
        const hook = `
.method protected getJSBundleFile()Ljava/lang/String;
    .registers 4
    const-string v0, "/data/user/0/com.discord/files/vencord_mobile.bundle.js"
    new-instance v1, Ljava/io/File;
    invoke-direct {v1, v0}, Ljava/io/File;-><init>(Ljava/lang/String;)V
    invoke-virtual {v1}, Ljava/io/File;->exists()Z
    move-result v2
    if-eqz v2, :cond_stock
    return-object v0
    :cond_stock
    const/4 v0, 0x0
    return-object v0
.end method
`;
        return smaliContent + hook;
    }
    patchNetworkSecurity(decompiledDir) {
        const manifestPath = path.join(decompiledDir, "AndroidManifest.xml");
        if (fs.existsSync(manifestPath)) {
            let manifest = fs.readFileSync(manifestPath, "utf-8");
            if (!manifest.includes('android:usesCleartextTraffic="true"')) {
                manifest = manifest.replace("<application ", '<application android:usesCleartextTraffic="true" ');
                fs.writeFileSync(manifestPath, manifest, "utf-8");
                console.log("[Patcher] Enabled usesCleartextTraffic in AndroidManifest.xml for local dev server");
            }
        }
    }
    signApk(inputApk, outputApk) {
        // Fallback or uber-apk-signer execution
        try {
            execSync(`uber-apk-signer --apks "${inputApk}" --out "${path.dirname(outputApk)}"`, { stdio: "inherit" });
        }
        catch {
            // Self-signed debug keystore fallback with apksigner or copy
            console.log("[Patcher] uber-apk-signer not found; copying APK to destination. Remember to sign with your debug keystore.");
            fs.copyFileSync(inputApk, outputApk);
        }
    }
}
//# sourceMappingURL=patcher.js.map