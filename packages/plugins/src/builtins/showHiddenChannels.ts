import type { Plugin, PluginContext } from "../types.js";

let unpatches: (() => void)[] = [];

export const showHiddenChannelsPlugin: Plugin = {
    name: "ShowHiddenChannels",
    description: "Displays locked and inaccessible channels in the guild channel list.",
    authors: [{ name: "Vencord Mobile Team" }],
    version: "1.0.0",
    tags: ["guilds", "channels"],
    defaultEnabled: false,

    start(ctx: PluginContext) {
        const permissionsModule = ctx.metro.findByProps("can", "computePermissions") ||
                                  ctx.metro.findByProps("getChannelPermissions");

        if (permissionsModule && permissionsModule.can) {
            // Channel VIEW_CHANNEL permission constant in Discord is 1024n (0x400)
            const VIEW_CHANNEL = 1024n;

            const unpatch = ctx.patcher.after(permissionsModule, "can", (args: any[], res: any) => {
                const [permission] = args;
                if (permission === VIEW_CHANNEL || permission === 1024) {
                    // Pretend user can view channel in the list
                    return true;
                }
                return res;
            });
            unpatches.push(unpatch);
        }
    },

    stop() {
        for (const unpatch of unpatches) {
            unpatch();
        }
        unpatches = [];
    }
};
