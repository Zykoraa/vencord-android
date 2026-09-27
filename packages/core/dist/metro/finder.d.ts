import { type MetroInterceptor, type MetroModuleEntry } from "./interceptor.js";
export type ModuleFilter = (mod: any, id: number | string) => boolean;
export declare class MetroFinder {
    private interceptor;
    constructor(interceptor?: MetroInterceptor);
    /**
     * Find the first module matching the filter function.
     */
    find<T = any>(filter: ModuleFilter): T | undefined;
    /**
     * Find all modules matching the filter function.
     */
    findAll<T = any>(filter: ModuleFilter): T[];
    /**
     * Find a module containing all specified property names.
     */
    findByProps<T = any>(...props: string[]): T | undefined;
    /**
     * Find all modules containing all specified property names.
     */
    findAllByProps<T = any>(...props: string[]): T[];
    /**
     * Find a React component or function by its name.
     */
    findByName<T = any>(name: string, defaultOnly?: boolean): T | undefined;
    /**
     * Find a React component by its displayName.
     */
    findByDisplayName<T = any>(displayName: string): T | undefined;
    /**
     * Find a Discord Flux store by its store name (e.g. "UserStore", "MessageStore").
     */
    findByStoreName<T = any>(name: string): T | undefined;
    /**
     * Wait for a module matching the filter to be registered and initialized.
     */
    waitFor<T = any>(filter: ModuleFilter, timeoutMs?: number): Promise<T>;
    get modules(): Map<string | number, MetroModuleEntry>;
}
export declare const metroFinder: MetroFinder;
//# sourceMappingURL=finder.d.ts.map