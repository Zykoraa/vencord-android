export class PluginManager {
    plugins = new Map();
    listeners = new Set();
    context = null;
    constructor() { }
    initialize(context) {
        this.context = context;
        this.loadSavedStates();
    }
    register(plugin) {
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
    unregister(name) {
        const record = this.plugins.get(name);
        if (!record)
            return;
        if (record.started) {
            this.stopPlugin(name);
        }
        this.plugins.delete(name);
        this.notify();
    }
    async enable(name) {
        const record = this.plugins.get(name);
        if (!record || record.enabled)
            return;
        record.enabled = true;
        this.setSavedEnabledState(name, true);
        await this.startPlugin(name);
        this.notify();
    }
    async disable(name) {
        const record = this.plugins.get(name);
        if (!record || !record.enabled)
            return;
        record.enabled = false;
        this.setSavedEnabledState(name, false);
        await this.stopPlugin(name);
        this.notify();
    }
    async toggle(name) {
        const record = this.plugins.get(name);
        if (!record)
            return;
        if (record.enabled) {
            await this.disable(name);
        }
        else {
            await this.enable(name);
        }
    }
    async startAll() {
        if (!this.context)
            return;
        for (const [name, record] of this.plugins.entries()) {
            if (record.enabled && !record.started) {
                await this.startPlugin(name);
            }
        }
    }
    async stopAll() {
        for (const [name, record] of this.plugins.entries()) {
            if (record.started) {
                await this.stopPlugin(name);
            }
        }
    }
    async startPlugin(name) {
        const record = this.plugins.get(name);
        if (!record || record.started || !this.context)
            return;
        try {
            const result = record.plugin.start(this.context);
            if (result && typeof result.then === "function") {
                await result;
            }
            record.started = true;
            record.error = undefined;
            this.context.logger.info(`[PluginManager] Started plugin: ${name}`);
        }
        catch (err) {
            record.error = err;
            record.started = false;
            this.context.logger.error(`[PluginManager] Failed to start ${name}:`, err);
        }
    }
    async stopPlugin(name) {
        const record = this.plugins.get(name);
        if (!record || !record.started || !this.context)
            return;
        try {
            const result = record.plugin.stop(this.context);
            if (result && typeof result.then === "function") {
                await result;
            }
            record.started = false;
            record.error = undefined;
            this.context.logger.info(`[PluginManager] Stopped plugin: ${name}`);
        }
        catch (err) {
            record.error = err;
            this.context.logger.error(`[PluginManager] Failed to stop ${name}:`, err);
        }
    }
    getPlugin(name) {
        return this.plugins.get(name);
    }
    getAllPlugins() {
        return Array.from(this.plugins.values());
    }
    getPluginOption(pluginName, optionKey, defaultValue) {
        if (!this.context)
            return defaultValue;
        return this.context.storage.get(`plugin_${pluginName}_opt_${optionKey}`, defaultValue);
    }
    setPluginOption(pluginName, optionKey, value) {
        if (!this.context)
            return;
        this.context.storage.set(`plugin_${pluginName}_opt_${optionKey}`, value);
        this.notify();
    }
    getSavedEnabledState(name, defaultVal) {
        if (!this.context)
            return defaultVal;
        return this.context.storage.get(`plugin_${name}_enabled`, defaultVal);
    }
    setSavedEnabledState(name, enabled) {
        if (!this.context)
            return;
        this.context.storage.set(`plugin_${name}_enabled`, enabled);
    }
    loadSavedStates() {
        for (const [name, record] of this.plugins.entries()) {
            record.enabled = this.getSavedEnabledState(name, record.plugin.defaultEnabled ?? false);
        }
    }
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    notify() {
        for (const listener of this.listeners) {
            try {
                listener();
            }
            catch (e) {
                console.error("[PluginManager] Error in listener callback:", e);
            }
        }
    }
}
export const pluginManager = new PluginManager();
//# sourceMappingURL=manager.js.map