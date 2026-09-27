import { metroInterceptor, type MetroInterceptor, type MetroModuleEntry } from "./interceptor.js";

export type ModuleFilter = (mod: any, id: number | string) => boolean;

export class MetroFinder {
    constructor(private interceptor: MetroInterceptor = metroInterceptor) {}

    /**
     * Find the first module matching the filter function.
     */
    public find<T = any>(filter: ModuleFilter): T | undefined {
        // First check already initialized exports
        for (const [id, exp] of this.interceptor.exportsCache.entries()) {
            if (!exp) continue;
            if (filter(exp, id)) return exp;
            if (exp.default && filter(exp.default, id)) return exp.default;
        }

        // Second, try requiring uninitialized modules
        for (const [id, entry] of this.interceptor.modules.entries()) {
            if (entry.isInitialized) continue;
            try {
                const exp = this.interceptor.requireModule(id);
                if (exp) {
                    if (filter(exp, id)) return exp;
                    if (exp.default && filter(exp.default, id)) return exp.default;
                }
            } catch {
                // Ignore modules that fail on eager evaluation
            }
        }

        return undefined;
    }

    /**
     * Find all modules matching the filter function.
     */
    public findAll<T = any>(filter: ModuleFilter): T[] {
        const results: T[] = [];

        for (const [id, exp] of this.interceptor.exportsCache.entries()) {
            if (!exp) continue;
            if (filter(exp, id)) results.push(exp);
            else if (exp.default && filter(exp.default, id)) results.push(exp.default);
        }

        return results;
    }

    /**
     * Find a module containing all specified property names.
     */
    public findByProps<T = any>(...props: string[]): T | undefined {
        return this.find((mod) => {
            if (!mod || (typeof mod !== "object" && typeof mod !== "function")) return false;
            return props.every((p) => p in mod);
        });
    }

    /**
     * Find all modules containing all specified property names.
     */
    public findAllByProps<T = any>(...props: string[]): T[] {
        return this.findAll((mod) => {
            if (!mod || (typeof mod !== "object" && typeof mod !== "function")) return false;
            return props.every((p) => p in mod);
        });
    }

    /**
     * Find a React component or function by its name.
     */
    public findByName<T = any>(name: string, defaultOnly: boolean = false): T | undefined {
        return this.find((mod) => {
            if (!mod) return false;
            if (mod.name === name) return true;
            if (!defaultOnly && mod.default?.name === name) return true;
            return false;
        });
    }

    /**
     * Find a React component by its displayName.
     */
    public findByDisplayName<T = any>(displayName: string): T | undefined {
        return this.find((mod) => {
            if (!mod) return false;
            if (mod.displayName === displayName) return true;
            if (mod.default?.displayName === displayName) return true;
            return false;
        });
    }

    /**
     * Find a Discord Flux store by its store name (e.g. "UserStore", "MessageStore").
     */
    public findByStoreName<T = any>(name: string): T | undefined {
        return this.find((mod) => {
            if (!mod) return false;
            if (typeof mod.getName === "function" && mod.getName() === name) return true;
            if (mod.default && typeof mod.default.getName === "function" && mod.default.getName() === name) {
                return true;
            }
            return false;
        });
    }

    /**
     * Wait for a module matching the filter to be registered and initialized.
     */
    public waitFor<T = any>(filter: ModuleFilter, timeoutMs: number = 10000): Promise<T> {
        const existing = this.find<T>(filter);
        if (existing) return Promise.resolve(existing);

        return new Promise<T>((resolve, reject) => {
            let timer: any = null;

            const cleanup = this.interceptor.onModuleDefined((entry: MetroModuleEntry) => {
                if (entry.exports) {
                    if (filter(entry.exports, entry.id)) {
                        if (timer) clearTimeout(timer);
                        cleanup();
                        resolve(entry.exports);
                    } else if (entry.exports.default && filter(entry.exports.default, entry.id)) {
                        if (timer) clearTimeout(timer);
                        cleanup();
                        resolve(entry.exports.default);
                    }
                }
            });

            if (timeoutMs > 0) {
                timer = setTimeout(() => {
                    cleanup();
                    reject(new Error(`Timed out waiting for Metro module after ${timeoutMs}ms`));
                }, timeoutMs);
            }
        });
    }

    public get modules() {
        return this.interceptor.modules;
    }
}

export const metroFinder = new MetroFinder();
