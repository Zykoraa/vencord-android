import type React from "react";
export interface Author {
    name: string;
    id?: string;
}
export type OptionValue = boolean | string | number;
export interface PluginOption {
    type: "boolean" | "string" | "number" | "select";
    description: string;
    default: OptionValue;
    options?: {
        label: string;
        value: OptionValue;
    }[];
}
export interface SettingsProps {
    plugin: Plugin;
    getOption: <T = OptionValue>(key: string) => T;
    setOption: (key: string, value: OptionValue) => void;
}
export interface Logger {
    log(...args: any[]): void;
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
}
export interface PluginContext {
    metro: any;
    patcher: any;
    storage: any;
    ui: any;
    logger: Logger;
}
export interface Plugin {
    name: string;
    description: string;
    authors: Author[];
    version?: string;
    tags?: string[];
    defaultEnabled?: boolean;
    start: (ctx: PluginContext) => void | Promise<void>;
    stop: (ctx: PluginContext) => void | Promise<void>;
    settings?: React.ComponentType<SettingsProps>;
    options?: Record<string, PluginOption>;
}
export interface PluginRecord {
    plugin: Plugin;
    enabled: boolean;
    started: boolean;
    error?: Error;
}
//# sourceMappingURL=types.d.ts.map