export class Storage {
    cache = new Map();
    nativeStorageModule = null;
    constructor() {
        this.init();
    }
    init() {
        // Attempt to find React Native NativeModules in the global context
        const g = globalThis;
        if (g?.nativeModuleProxy?.AsyncLocalStorage || g?.NativeModules?.AsyncLocalStorage) {
            this.nativeStorageModule = g?.nativeModuleProxy?.AsyncLocalStorage || g?.NativeModules?.AsyncLocalStorage;
        }
    }
    get(key, defaultValue) {
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        return defaultValue;
    }
    set(key, value) {
        this.cache.set(key, value);
        this.persist(key, value);
    }
    delete(key) {
        this.cache.delete(key);
        if (this.nativeStorageModule?.multiRemove) {
            try {
                this.nativeStorageModule.multiRemove([`vencord_${key}`]);
            }
            catch {
                // Ignore background persistence errors
            }
        }
    }
    clear() {
        this.cache.clear();
    }
    persist(key, value) {
        if (this.nativeStorageModule?.multiSet) {
            try {
                const serialized = JSON.stringify(value);
                this.nativeStorageModule.multiSet([[`vencord_${key}`, serialized]]);
            }
            catch {
                // Ignore background persistence errors
            }
        }
    }
}
export const storage = new Storage();
//# sourceMappingURL=storage.js.map