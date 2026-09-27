/**
 * Metro Interceptor for Discord React Native / Hermes
 *
 * Metro bundler encapsulates modules inside:
 * __d(factory, moduleId, dependencyMap)
 *
 * and requires them using:
 * __r(moduleId)
 */
export type MetroModuleFactory = (global: any, require: any, metroImportDefault: any, metroImportAll: any, module: {
    exports: any;
}, exports: any, dependencyMap: any[]) => void;
export interface MetroModuleEntry {
    id: number | string;
    factory: MetroModuleFactory;
    dependencyMap?: any[];
    exports?: any;
    isInitialized: boolean;
}
export declare class MetroInterceptor {
    modules: Map<string | number, MetroModuleEntry>;
    exportsCache: Map<string | number, any>;
    private originalDefine;
    private originalRequire;
    private listeners;
    private targetScope;
    constructor(target?: any);
    install(): void;
    uninstall(): void;
    requireModule(id: number | string): any;
    onModuleDefined(listener: (entry: MetroModuleEntry) => void): () => void;
    private notifyListeners;
}
export declare const metroInterceptor: MetroInterceptor;
//# sourceMappingURL=interceptor.d.ts.map