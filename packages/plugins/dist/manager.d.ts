import type { Plugin, PluginContext, PluginRecord, OptionValue } from "./types.js";
type Listener = () => void;
export declare class PluginManager {
    private plugins;
    private listeners;
    private context;
    constructor();
    initialize(context: PluginContext): void;
    register(plugin: Plugin): void;
    unregister(name: string): void;
    enable(name: string): Promise<void>;
    disable(name: string): Promise<void>;
    toggle(name: string): Promise<void>;
    startAll(): Promise<void>;
    stopAll(): Promise<void>;
    private startPlugin;
    private stopPlugin;
    getPlugin(name: string): PluginRecord | undefined;
    getAllPlugins(): PluginRecord[];
    getPluginOption<T = OptionValue>(pluginName: string, optionKey: string, defaultValue: OptionValue): T;
    setPluginOption(pluginName: string, optionKey: string, value: OptionValue): void;
    private getSavedEnabledState;
    private setSavedEnabledState;
    private loadSavedStates;
    subscribe(listener: Listener): () => void;
    private notify;
}
export declare const pluginManager: PluginManager;
export {};
//# sourceMappingURL=manager.d.ts.map