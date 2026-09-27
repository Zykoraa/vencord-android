export declare class Storage {
    private cache;
    private nativeStorageModule;
    constructor();
    private init;
    get<T = any>(key: string, defaultValue?: T): T;
    set(key: string, value: any): void;
    delete(key: string): void;
    clear(): void;
    private persist;
}
export declare const storage: Storage;
//# sourceMappingURL=storage.d.ts.map