export class Storage {
    private cache = new Map<string, any>();
    private nativeStorageModule: any = null;

    constructor() {
        this.init();
    }

    private init() {
        // Attempt to find React Native NativeModules in the global context
        const g = globalThis as any;
        if (g?.nativeModuleProxy?.AsyncLocalStorage || g?.NativeModules?.AsyncLocalStorage) {
            this.nativeStorageModule = g?.nativeModuleProxy?.AsyncLocalStorage || g?.NativeModules?.AsyncLocalStorage;
        }
    }

    public get<T = any>(key: string, defaultValue?: T): T {
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        return defaultValue as T;
    }

    public set(key: string, value: any) {
        this.cache.set(key, value);
        this.persist(key, value);
    }

    public delete(key: string) {
        this.cache.delete(key);
        if (this.nativeStorageModule?.multiRemove) {
            try {
                this.nativeStorageModule.multiRemove([`vencord_${key}`]);
            } catch {
                // Ignore background persistence errors
            }
        }
    }

    public clear() {
        this.cache.clear();
    }

    private persist(key: string, value: any) {
        if (this.nativeStorageModule?.multiSet) {
            try {
                const serialized = JSON.stringify(value);
                this.nativeStorageModule.multiSet([[`vencord_${key}`, serialized]]);
            } catch {
                // Ignore background persistence errors
            }
        }
    }
}

export const storage = new Storage();
