import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bundlePath = path.resolve(__dirname, "../../core/dist/vencord-mobile.bundle.js");
export function startDevServer(port = 4040) {
    const server = http.createServer((req, res) => {
        console.log(`[DevServer] ${req.method} ${req.url}`);
        // CORS headers
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        if (req.method === "OPTIONS") {
            res.writeHead(204);
            res.end();
            return;
        }
        if (req.url === "/vencord-mobile.bundle.js" || req.url === "/bundle.js" || req.url === "/") {
            if (!fs.existsSync(bundlePath)) {
                res.writeHead(404, { "Content-Type": "text/plain" });
                res.end("Bundle not found. Run 'pnpm bundle' in @vencord-mobile/core first.");
                return;
            }
            const bundleContent = fs.readFileSync(bundlePath, "utf-8");
            res.writeHead(200, {
                "Content-Type": "application/javascript; charset=utf-8",
                "Content-Length": Buffer.byteLength(bundleContent),
            });
            res.end(bundleContent);
            return;
        }
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
    });
    server.listen(port, "0.0.0.0", () => {
        console.log(`\n=================================================`);
        console.log(`🚀 Vencord Mobile Dev Server running!`);
        console.log(`   Local URL:    http://127.0.0.1:${port}/vencord-mobile.bundle.js`);
        console.log(`   Android Host: http://10.0.2.2:${port}/vencord-mobile.bundle.js`);
        console.log(`   ADB Forward:  run 'adb reverse tcp:${port} tcp:${port}'`);
        console.log(`=================================================\n`);
    });
    return server;
}
if (process.argv[1] && process.argv[1].endsWith("server.js")) {
    const port = parseInt(process.env.PORT || "4040", 10);
    startDevServer(port);
}
//# sourceMappingURL=server.js.map