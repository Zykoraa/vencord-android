import { metroFinder } from "../metro/finder.js";

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

export class UIManager {
    private rnCache: ReactNativeComponents | null = null;

    /**
     * Resolves React Native core components from Metro.
     */
    public getReactNative(): ReactNativeComponents {
        if (this.rnCache) return this.rnCache;

        const rn = metroFinder.findByProps("View", "Text", "StyleSheet") ||
                   (globalThis as any).ReactNative;

        if (rn) {
            this.rnCache = {
                View: rn.View,
                Text: rn.Text,
                Pressable: rn.Pressable,
                TouchableOpacity: rn.TouchableOpacity,
                ScrollView: rn.ScrollView,
                Switch: rn.Switch,
                TextInput: rn.TextInput,
                StyleSheet: rn.StyleSheet,
            };
            return this.rnCache;
        }

        // Fallback for test / headless environments
        return {
            View: "View",
            Text: "Text",
            Pressable: "Pressable",
            TouchableOpacity: "TouchableOpacity",
            ScrollView: "ScrollView",
            Switch: "Switch",
            TextInput: "TextInput",
            StyleSheet: {
                create: (styles: any) => styles,
            },
        };
    }

    /**
     * Resolves Discord's native theme tokens and colors.
     */
    public getTheme() {
        const themeStore = metroFinder.findByStoreName("ThemeStore");
        const currentTheme = themeStore?.theme || "dark";

        const colors = metroFinder.findByProps("SemanticColors", "RawColors")?.SemanticColors || {
            BACKGROUND_PRIMARY: currentTheme === "dark" ? "#313338" : "#ffffff",
            BACKGROUND_SECONDARY: currentTheme === "dark" ? "#2b2d31" : "#f2f3f5",
            TEXT_NORMAL: currentTheme === "dark" ? "#dbdee1" : "#313338",
            TEXT_MUTED: currentTheme === "dark" ? "#949ba4" : "#5c5e66",
            BRAND: "#5865f2",
            HEADER_PRIMARY: currentTheme === "dark" ? "#f2f3f5" : "#060607",
        };

        return {
            theme: currentTheme,
            colors,
        };
    }
}

export const ui = new UIManager();
