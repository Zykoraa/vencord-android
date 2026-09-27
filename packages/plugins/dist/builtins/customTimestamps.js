let unpatch = null;
export const customTimestampsPlugin = {
    name: "CustomTimestamps",
    description: "Customizes how message timestamps are rendered across chats.",
    authors: [{ name: "Vencord Mobile Team" }],
    version: "1.0.0",
    tags: ["chat", "appearance"],
    defaultEnabled: false,
    options: {
        format24h: {
            type: "boolean",
            description: "Force 24-hour time format (HH:mm:ss)",
            default: true,
        },
        showSeconds: {
            type: "boolean",
            description: "Display seconds in message timestamps",
            default: false,
        }
    },
    start(ctx) {
        const timeModule = ctx.metro.findByProps("formatTimestamp", "calendarFormat") ||
            ctx.metro.findByProps("dateFormat");
        if (!timeModule) {
            ctx.logger.warn("[CustomTimestamps] Time formatting module not found");
            return;
        }
        const methodName = timeModule.formatTimestamp ? "formatTimestamp" : "dateFormat";
        unpatch = ctx.patcher.after(timeModule, methodName, (args, res) => {
            const format24h = ctx.storage.get("plugin_CustomTimestamps_opt_format24h", true);
            const showSeconds = ctx.storage.get("plugin_CustomTimestamps_opt_showSeconds", false);
            if (typeof res === "string" && format24h) {
                // Example timestamp transformation
                const date = args[0] ? new Date(args[0]) : new Date();
                if (!isNaN(date.getTime())) {
                    const hours = String(date.getHours()).padStart(2, "0");
                    const minutes = String(date.getMinutes()).padStart(2, "0");
                    const seconds = showSeconds ? `:${String(date.getSeconds()).padStart(2, "0")}` : "";
                    return `${hours}:${minutes}${seconds}`;
                }
            }
            return res;
        });
    },
    stop() {
        if (unpatch) {
            unpatch();
            unpatch = null;
        }
    }
};
//# sourceMappingURL=customTimestamps.js.map