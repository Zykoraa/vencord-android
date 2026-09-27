export interface ReactNativeComponents {
    View: any;
    Text: any;
    Pressable: any;
    TouchableOpacity: any;
    ScrollView: any;
    Switch: any;
    TextInput: any;
    StyleSheet: any;
}
export declare class UIManager {
    private rnCache;
    /**
     * Resolves React Native core components from Metro.
     */
    getReactNative(): ReactNativeComponents;
    /**
     * Resolves Discord's native theme tokens and colors.
     */
    getTheme(): {
        theme: any;
        colors: any;
    };
}
export declare const ui: UIManager;
//# sourceMappingURL=ui.d.ts.map