import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "../api/react.js";
import { ui } from "../api/ui.js";
import { pluginManager } from "@vencord-mobile/plugins";
import { metroFinder } from "../metro/finder.js";
export function SettingsView() {
    const { View, Text, ScrollView, Switch, TouchableOpacity, StyleSheet } = ui.getReactNative();
    const { colors } = ui.getTheme();
    const [, setTick] = useState(0);
    useEffect(() => {
        const unsubscribe = pluginManager.subscribe(() => {
            setTick((t) => t + 1);
        });
        return unsubscribe;
    }, []);
    const plugins = pluginManager.getAllPlugins();
    const moduleCount = metroFinder.modules.size;
    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.BACKGROUND_PRIMARY,
            padding: 16,
        },
        header: {
            marginBottom: 20,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.BACKGROUND_SECONDARY,
        },
        title: {
            fontSize: 22,
            fontWeight: "bold",
            color: colors.HEADER_PRIMARY,
        },
        subtitle: {
            fontSize: 13,
            color: colors.TEXT_MUTED,
            marginTop: 4,
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: "700",
            color: colors.TEXT_MUTED,
            textTransform: "uppercase",
            marginBottom: 12,
            marginTop: 16,
        },
        pluginCard: {
            backgroundColor: colors.BACKGROUND_SECONDARY,
            borderRadius: 10,
            padding: 14,
            marginBottom: 10,
        },
        pluginRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
        },
        pluginInfo: {
            flex: 1,
            marginRight: 10,
        },
        pluginName: {
            fontSize: 16,
            fontWeight: "600",
            color: colors.HEADER_PRIMARY,
        },
        pluginDesc: {
            fontSize: 13,
            color: colors.TEXT_NORMAL,
            marginTop: 4,
        },
        pluginMeta: {
            fontSize: 11,
            color: colors.TEXT_MUTED,
            marginTop: 6,
        },
        errorText: {
            color: "#fa7a7a",
            fontSize: 12,
            marginTop: 4,
        },
        button: {
            backgroundColor: colors.BRAND,
            padding: 12,
            borderRadius: 8,
            alignItems: "center",
            marginTop: 10,
        },
        buttonText: {
            color: "#ffffff",
            fontWeight: "bold",
            fontSize: 14,
        }
    });
    return (_jsxs(ScrollView, { style: styles.container, children: [_jsxs(View, { style: styles.header, children: [_jsx(Text, { style: styles.title, children: "Vencord Mobile" }), _jsx(Text, { style: styles.subtitle, children: "React Native Discord Client Modification \u2022 v0.1.0" })] }), _jsxs(Text, { style: styles.sectionTitle, children: ["Plugins (", plugins.length, ")"] }), plugins.map((record) => (_jsx(View, { style: styles.pluginCard, children: _jsxs(View, { style: styles.pluginRow, children: [_jsxs(View, { style: styles.pluginInfo, children: [_jsx(Text, { style: styles.pluginName, children: record.plugin.name }), _jsx(Text, { style: styles.pluginDesc, children: record.plugin.description }), _jsxs(Text, { style: styles.pluginMeta, children: ["By ", record.plugin.authors.map((a) => a.name).join(", "), record.plugin.version ? ` • v${record.plugin.version}` : ""] }), record.error && (_jsxs(Text, { style: styles.errorText, children: ["Error: ", record.error.message || String(record.error)] }))] }), _jsx(Switch, { value: record.enabled, onValueChange: () => pluginManager.toggle(record.plugin.name) })] }) }, record.plugin.name))), _jsx(Text, { style: styles.sectionTitle, children: "Diagnostics" }), _jsxs(View, { style: styles.pluginCard, children: [_jsxs(Text, { style: styles.pluginDesc, children: ["Metro Modules Captured: ", moduleCount] }), _jsx(TouchableOpacity, { style: styles.button, onPress: () => {
                            const reloadModule = metroFinder.findByProps("reload", "reloadApp");
                            if (reloadModule?.reload)
                                reloadModule.reload();
                        }, children: _jsx(Text, { style: styles.buttonText, children: "Restart Discord" }) })] })] }));
}
//# sourceMappingURL=SettingsView.js.map