import type { Plugin, PluginContext } from "@vencord-mobile/plugins";
import { metroFinder } from "../metro/finder.js";
import { patcher } from "../patcher/index.js";

export interface VencordPatch {
    find: string | RegExp;
    replacement: {
        match: string | RegExp;
        replace: string | ((...args: any[]) => string);
    } | Array<{ match: string | RegExp; replace: string | ((...args: any[]) => string) }>;
}

export interface VencordDesktopPlugin {
    name: string;
    description: string;
    authors?: any[];
    tags?: string[];
    patches?: VencordPatch[];
    start?: (ctx?: any) => void | Promise<void>;
    stop?: (ctx?: any) => void | Promise<void>;
    [key: string]: any;
}

/**
 * Adapts an existing desktop Vencord plugin into a mobile Vencord Android plugin.
 */
export function adaptVencordPlugin(desktopPlugin: VencordDesktopPlugin): Plugin {
    const unpatches: (() => void)[] = [];

    const mobilePlugin: Plugin = {
        name: desktopPlugin.name,
        description: desktopPlugin.description || "Adapted Vencord Plugin",
        authors: Array.isArray(desktopPlugin.authors)
            ? desktopPlugin.authors.map((a: any) => ({ name: typeof a === "string" ? a : a?.name || "Unknown" }))
            : [{ name: "Vencord Community" }],
        tags: desktopPlugin.tags || ["Vencord", "Adapted"],
        defaultEnabled: false,

        async start(ctx: PluginContext) {
            // Bind desktop plugin functions to self
            const pluginSelf = { ...desktopPlugin };

            // 1. Process runtime patch hints from desktop plugin patches if possible
            if (Array.isArray(desktopPlugin.patches)) {
                for (const p of desktopPlugin.patches) {
                    const findStr = typeof p.find === "string" ? p.find : p.find.source;

                    // Example: Handle call idle patches
                    if (findStr.includes("idleTimeout") || findStr.includes("handleIdleUpdate")) {
                        const target = ctx.metro.find((m: any) => {
                            if (!m) return false;
                            return m.idleTimeout || m.handleIdleUpdate || (m.prototype && (m.prototype.handleIdleUpdate || m.prototype.idleTimeout));
                        });

                        if (target) {
                            const mod = target.prototype || target;
                            if (typeof mod.handleIdleUpdate === "function") {
                                const unpatch = ctx.patcher.instead(mod, "handleIdleUpdate", () => {
                                    ctx.logger.log(`[${desktopPlugin.name}] Suppressed handleIdleUpdate`);
                                });
                                unpatches.push(unpatch);
                            }
                            if (mod.idleTimeout && typeof mod.idleTimeout.start === "function") {
                                const unpatch = ctx.patcher.instead(mod.idleTimeout, "start", () => {
                                    ctx.logger.log(`[${desktopPlugin.name}] Suppressed idleTimeout.start`);
                                });
                                unpatches.push(unpatch);
                            }
                        }
                    }
                }
            }

            // 2. Invoke start() if defined on the plugin
            if (typeof desktopPlugin.start === "function") {
                await desktopPlugin.start.call(pluginSelf, ctx);
            }
        },

        async stop(ctx: PluginContext) {
            // Restore any patches applied by the adapter
            for (const unpatch of unpatches) {
                unpatch();
            }
            unpatches.length = 0;

            // Invoke stop() if defined on the plugin
            if (typeof desktopPlugin.stop === "function") {
                await desktopPlugin.stop.call(desktopPlugin, ctx);
            }
        }
    };

    return mobilePlugin;
}

/**
 * Creates the global Vencord compatibility object mirroring desktop Vencord API.
 * Allows Vencord plugins targeting Vencord.Webpack / Vencord.Patcher to run directly.
 */
export function setupVencordCompatAPI() {
    const g = globalThis as any;

    g.Vencord = g.Vencord || {};
    g.Vencord.Webpack = {
        find: (filter: any) => metroFinder.find(filter),
        findAll: (filter: any) => metroFinder.findAll(filter),
        findByProps: (...props: string[]) => metroFinder.findByProps(...props),
        findByStoreName: (name: string) => metroFinder.findByStoreName(name),
        findStore: (name: string) => metroFinder.findByStoreName(name),
        findByName: (name: string) => metroFinder.findByName(name),
        findByDisplayName: (name: string) => metroFinder.findByDisplayName(name),
        waitFor: (filter: any, timeoutMs?: number) => metroFinder.waitFor(filter, timeoutMs),
        Common: {
            get UserStore() { return metroFinder.findByStoreName("UserStore"); },
            get ChannelStore() { return metroFinder.findByStoreName("ChannelStore"); },
            get GuildStore() { return metroFinder.findByStoreName("GuildStore"); },
            get SelectedChannelStore() { return metroFinder.findByStoreName("SelectedChannelStore"); },
            get VoiceStateStore() { return metroFinder.findByStoreName("VoiceStateStore"); },
            get Dispatcher() { return metroFinder.findByProps("dispatch", "subscribe"); },
        }
    };

    g.Vencord.Patcher = {
        before: (parent: any, key: string, patch: any) => patcher.before(parent, key, patch),
        after: (parent: any, key: string, patch: any) => patcher.after(parent, key, patch),
        instead: (parent: any, key: string, patch: any) => patcher.instead(parent, key, patch),
        unpatchAll: () => patcher.unpatchAll(),
    };
}
