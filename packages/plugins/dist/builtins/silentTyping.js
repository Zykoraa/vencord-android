let unpatch = null;
export const silentTypingPlugin = {
    name: "SilentTyping",
    description: "Prevents Discord from broadcasting that you are typing a message.",
    authors: [{ name: "Vencord Mobile Team" }],
    version: "1.0.0",
    tags: ["privacy", "chat"],
    defaultEnabled: true,
    start(ctx) {
        // Find typing API module in Metro
        const typingModule = ctx.metro.findByProps("startTyping", "stopTyping") ||
            ctx.metro.findByProps("sendTyping");
        if (!typingModule) {
            ctx.logger.warn("[SilentTyping] Typing module not found yet; will register delayed patch");
            ctx.metro.waitFor((m) => m && (m.startTyping || m.sendTyping)).then((mod) => {
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
//# sourceMappingURL=silentTyping.js.map