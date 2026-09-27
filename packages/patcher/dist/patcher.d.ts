export interface PatchOptions {
    inputApk: string;
    outputApk: string;
    devServerUrl?: string;
    bundlePath?: string;
    workDir?: string;
}
export declare class DiscordPatcher {
    private defaultBundlePath;
    checkPrerequisites(): {
        apktool: boolean;
        java: boolean;
        zipalign: boolean;
        apksigner: boolean;
    };
    patchApk(options: PatchOptions): Promise<void>;
    private findSmaliFiles;
    private walkSmali;
    private injectGetJSBundleFileMethod;
    private patchNetworkSecurity;
    private signApk;
}
//# sourceMappingURL=patcher.d.ts.map