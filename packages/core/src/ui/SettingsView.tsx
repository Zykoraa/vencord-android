import { useState, useEffect, createElement } from "../api/react.js";
import { ui } from "../api/ui.js";
import { pluginManager } from "@vencord-mobile/plugins";
import { metroFinder } from "../metro/finder.js";

export function SettingsView(): any {
    const { View, Text, ScrollView, Switch, TouchableOpacity, StyleSheet } = ui.getReactNative();
    const { colors } = ui.getTheme();

    const [, setTick] = useState(0);

    useEffect(() => {
        const unsubscribe = pluginManager.subscribe(() => {
            setTick((t: number) => t + 1);
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

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Vencord Mobile</Text>
                <Text style={styles.subtitle}>
                    React Native Discord Client Modification • v0.1.0
                </Text>
            </View>

            <Text style={styles.sectionTitle}>Plugins ({plugins.length})</Text>

            {plugins.map((record) => (
                <View key={record.plugin.name} style={styles.pluginCard}>
                    <View style={styles.pluginRow}>
                        <View style={styles.pluginInfo}>
                            <Text style={styles.pluginName}>{record.plugin.name}</Text>
                            <Text style={styles.pluginDesc}>{record.plugin.description}</Text>
                            <Text style={styles.pluginMeta}>
                                By {record.plugin.authors.map((a) => a.name).join(", ")}
                                {record.plugin.version ? ` • v${record.plugin.version}` : ""}
                            </Text>
                            {record.error && (
                                <Text style={styles.errorText}>
                                    Error: {record.error.message || String(record.error)}
                                </Text>
                            )}
                        </View>
                        <Switch
                            value={record.enabled}
                            onValueChange={() => pluginManager.toggle(record.plugin.name)}
                        />
                    </View>
                </View>
            ))}

            <Text style={styles.sectionTitle}>Diagnostics</Text>
            <View style={styles.pluginCard}>
                <Text style={styles.pluginDesc}>
                    Metro Modules Captured: {moduleCount}
                </Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                        const reloadModule = metroFinder.findByProps("reload", "reloadApp");
                        if (reloadModule?.reload) reloadModule.reload();
                    }}
                >
                    <Text style={styles.buttonText}>Restart Discord</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
