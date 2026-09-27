import type { Plugin, PluginContext, PluginRecord, OptionValue } from "./types.js";

type Listener = () => void;

export class PluginManager {
    private plugins = new Map<string, PluginRecord>();
    private listeners = new Set<Listener>();
    private context: PluginContext | null = null;

    constructor() {}

    public initialize(context: PluginContext) {
        this.context = context;
        this.loadSavedStates();
    }

    public register(plugin: Plugin) {
        if (this.plugins.has(plugin.name)) {
            return;
        }

        const enabled = this.getSavedEnabledState(plugin.name, plugin.defaultEnabled ?? false);
        this.plugins.set(plugin.name, {
            plugin,
            enabled,
            started: false,
        });

        if (enabled && this.context) {
            this.startPlugin(plugin.name);
        }

        this.notify();
    }

    public unregister(name: string) {
        const record = this.plugins.get(name);
        if (!record) return;

        if (record.started) {
            this.stopPlugin(name);
        }
        this.plugins.delete(name);
        this.notify();
    }

    public async enable(name: string) {
        const record = this.plugins.get(name);
        if (!record || record.enabled) return;

        record.enabled = true;
        this.setSavedEnabledState(name, true);
        await this.startPlugin(name);
        this.notify();
    }

    public async disable(name: string) {
        const record = this.plugins.get(name);
        if (!record || !record.enabled) return;

        record.enabled = false;
        this.setSavedEnabledState(name, false);
        await this.stopPlugin(name);
        this.notify();
    }

    public async toggle(name: string) {
        const record = this.plugins.get(name);
        if (!record) return;
        if (record.enabled) {
            await this.disable(name);
        } else {
            await this.enable(name);
        }
    }

    public async startAll() {
        if (!this.context) return;
        for (const [name, record] of this.plugins.entries()) {
            if (record.enabled && !record.started) {
                await this.startPlugin(name);
            }
        }
    }

    public async stopAll() {
        for (const [name, record] of this.plugins.entries()) {
            if (record.started) {
                await this.stopPlugin(name);
            }
        }
    }

    private async startPlugin(name: string) {
        const record = this.plugins.get(name);
        if (!record || record.started || !this.context) return;

        try {
            const result = record.plugin.start(this.context);
            if (result && typeof (result as any).then === "function") {
                await result;
            }
            record.started = true;
            record.error = undefined;
            this.context.logger.info(`[PluginManager] Started plugin: ${name}`);
        } catch (err: any) {
            record.error = err;
            record.started = false;
            this.context.logger.error(`[PluginManager] Failed to start ${name}:`, err);
        }
    }

    private async stopPlugin(name: string) {
        const record = this.plugins.get(name);
        if (!record || !record.started || !this.context) return;

        try {
            const result = record.plugin.stop(this.context);
            if (result && typeof (result as any).then === "function") {
                await result;
            }
            record.started = false;
            record.error = undefined;
            this.context.logger.info(`[PluginManager] Stopped plugin: ${name}`);
        } catch (err: any) {
            record.error = err;
            this.context.logger.error(`[PluginManager] Failed to stop ${name}:`, err);
        }
    }

    public getPlugin(name: string): PluginRecord | undefined {
        return this.plugins.get(name);
    }

    public getAllPlugins(): PluginRecord[] {
        return Array.from(this.plugins.values());
    }

    public getPluginOption<T = OptionValue>(pluginName: string, optionKey: string, defaultValue: OptionValue): T {
        if (!this.context) return defaultValue as unknown as T;
        return this.context.storage.get(`plugin_${pluginName}_opt_${optionKey}`, defaultValue) as T;
    }

    public setPluginOption(pluginName: string, optionKey: string, value: OptionValue) {
        if (!this.context) return;
        this.context.storage.set(`plugin_${pluginName}_opt_${optionKey}`, value);
        this.notify();
    }

    private getSavedEnabledState(name: string, defaultVal: boolean): boolean {
        if (!this.context) return defaultVal;
        return this.context.storage.get(`plugin_${name}_enabled`, defaultVal);
    }

    private setSavedEnabledState(name: string, enabled: boolean) {
        if (!this.context) return;
        this.context.storage.set(`plugin_${name}_enabled`, enabled);
    }

    private loadSavedStates() {
        for (const [name, record] of this.plugins.entries()) {
            record.enabled = this.getSavedEnabledState(name, record.plugin.defaultEnabled ?? false);
        }
    }

    public subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify() {
        for (const listener of this.listeners) {
            try {
                listener();
            } catch (e) {
                console.error("[PluginManager] Error in listener callback:", e);
            }
        }
    }
}

export const pluginManager = new PluginManager();
