import esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const reactShimPath = path.join(rootDir, "src/api/react.ts");

async function bundle() {
    console.log("[Bundle] Building standalone Vencord Mobile Hermes JS bundle...");

    await esbuild.build({
        entryPoints: [path.join(rootDir, "src/index.ts")],
        bundle: true,
        minify: true,
        format: "iife",
        target: ["es2020"],
        outfile: path.join(rootDir, "dist/vencord-mobile.bundle.js"),
        jsx: "transform",
        jsxFactory: "createElement",
        jsxFragment: "Fragment",
        inject: [reactShimPath],
        alias: {
            "react": reactShimPath,
            "react/jsx-runtime": reactShimPath,
            "react/jsx-dev-runtime": reactShimPath,
        },
        define: {
            "process.env.NODE_ENV": '"production"',
        },
    });

    console.log("[Bundle] Successfully generated dist/vencord-mobile.bundle.js!");
}

bundle().catch((err) => {
    console.error("[Bundle] Build failed:", err);
    process.exit(1);
});
