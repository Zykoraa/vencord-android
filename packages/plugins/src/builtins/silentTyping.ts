import type { Plugin, PluginContext } from "../types.js";

let unpatch: (() => void) | null = null;

export const silentTypingPlugin: Plugin = {
    name: "SilentTyping",
    description: "Prevents Discord from broadcasting that you are typing a message.",
    authors: [{ name: "Vencord Mobile Team" }],
    version: "1.0.0",
    tags: ["privacy", "chat"],
    defaultEnabled: true,

    start(ctx: PluginContext) {
        // Find typing API module in Metro
        const typingModule = ctx.metro.findByProps("startTyping", "stopTyping") ||
                             ctx.metro.findByProps("sendTyping");

        if (!typingModule) {
            ctx.logger.warn("[SilentTyping] Typing module not found yet; will register delayed patch");
            ctx.metro.waitFor((m: any) => m && (m.startTyping || m.sendTyping)).then((mod: any) => {
                const targetFunc = mod.startTyping ? "startTyping" : "sendTyping";
                unpatch = ctx.patcher.instead(mod, targetFunc, () => {
                    // Suppress sending typing packet
                    ctx.logger.log("[SilentTyping] Typing indicator suppressed");
                });
            });
            return;
        }

        const targetFunc = typingModule.startTyping ? "startTyping" : "sendTyping";
        unpatch = ctx.patcher.instead(typingModule, targetFunc, () => {
            ctx.logger.log("[SilentTyping] Typing indicator suppressed");
        });
    },

    stop() {
        if (unpatch) {
            unpatch();
            unpatch = null;
        }
    }
};
