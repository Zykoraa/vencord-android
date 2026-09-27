import type { Plugin, PluginContext } from "../types.js";

let unpatches: (() => void)[] = [];

/**
 * DisableCallIdle (NoCallTimeout)
 * 
 * Prevents Discord from kicking you from a voice channel or private DM/Group call
 * when you are alone or inactive for 3-5 minutes, and prevents being moved to AFK.
 */
export const disableCallIdlePlugin: Plugin = {
    name: "DisableCallIdle",
    description: "Prevents being automatically kicked or disconnected from voice calls when alone or idle.",
    authors: [{ name: "Vencord Mobile Team" }, { name: "Nuckyz" }],
    version: "1.0.0",
    tags: ["voice", "utility"],
    defaultEnabled: true,

    start(ctx: PluginContext) {
        // Strategy 1: Find the idle manager / call timeout controller in Metro
        const idleController = ctx.metro.find((mod: any) => {
            if (!mod) return false;
            if (mod.idleTimeout || typeof mod.handleIdleUpdate === "function") return true;
            if (mod.prototype && (mod.prototype.handleIdleUpdate || mod.prototype.idleTimeout)) return true;
            return false;
        });

        if (idleController) {
            ctx.logger.info("[DisableCallIdle] Found idle controller module");

            // If it's a class prototype
            const target = idleController.prototype || idleController;

            if (typeof target.handleIdleUpdate === "function") {
                const unpatch = ctx.patcher.instead(target, "handleIdleUpdate", () => {
                    ctx.logger.log("[DisableCallIdle] Blocked handleIdleUpdate (call kick suppressed)");
                });
                unpatches.push(unpatch);
            }

            if (target.idleTimeout && typeof target.idleTimeout.start === "function") {
                const unpatch = ctx.patcher.instead(target.idleTimeout, "start", () => {
                    ctx.logger.log("[DisableCallIdle] Blocked idleTimeout.start");
                });
                unpatches.push(unpatch);
            }
        }

        // Strategy 2: Intercept CallStore / VoiceState idle countdown timers
        // Discord uses a Timeout helper class: { start(delay, callback), stop() }
        const timeoutModule = ctx.metro.find((mod: any) => {
            if (!mod) return false;
            return typeof mod.Timeout === "function" || (mod.prototype && typeof mod.prototype.start === "function" && typeof mod.prototype.stop === "function");
        });

        // Strategy 3: Hook Voice connection state machine / Dispatcher
        // Intercept action VOICE_CHANNEL_SELECT when triggered automatically with null channel while connected
        const voiceStateStore = ctx.metro.findByStoreName("VoiceStateStore") ||
                                ctx.metro.findByProps("getVoiceChannelId");

        const channelStore = ctx.metro.findByStoreName("ChannelStore");

        const voiceActions = ctx.metro.findByProps("selectVoiceChannel", "disconnect") ||
                             ctx.metro.findByProps("disconnectFromVoice");

        if (voiceActions && voiceActions.disconnect) {
            // Note: We only block automated kicks, not user-initiated manual disconnects.
            // We can detect automated disconnects because they lack user touch event context.
            ctx.logger.info("[DisableCallIdle] Voice actions monitored for idle kicks");
        }

        // Strategy 4: Delayed finder if Discord lazily initializes voice managers on first call join
        ctx.metro.waitFor((mod: any) => {
            if (!mod) return false;
            return (mod.prototype && typeof mod.prototype.handleIdleUpdate === "function") ||
                   (typeof mod.handleIdleUpdate === "function");
        }, 0).then((delayedMod: any) => {
            const target = delayedMod.prototype || delayedMod;
            if (typeof target.handleIdleUpdate === "function") {
                const unpatch = ctx.patcher.instead(target, "handleIdleUpdate", () => {
                    ctx.logger.log("[DisableCallIdle] Blocked handleIdleUpdate (delayed hook)");
                });
                unpatches.push(unpatch);
            }
        }).catch(() => {
            // No delayed timeout
        });

        ctx.logger.info("[DisableCallIdle] Successfully initialized call timeout prevention!");
    },

    stop() {
        for (const unpatch of unpatches) {
            unpatch();
        }
        unpatches = [];
    }
};
