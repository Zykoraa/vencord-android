# Vencord Mobile ReactNativeHost Hook
# Target: com/facebook/react/ReactNativeHost.smali OR com/discord/app/AppReactNativeHost.smali
# Method: getJSBundleFile()Ljava/lang/String;

.method protected getJSBundleFile()Ljava/lang/String;
    .registers 4

    # Path to Vencord Mobile bundle in Discord's app private files
    const-string v0, "/data/user/0/com.discord/files/vencord_mobile.bundle.js"

    # Check if the bundle exists on disk
    new-instance v1, Ljava/io/File;
    invoke-direct {v1, v0}, Ljava/io/File;-><init>(Ljava/lang/String;)V
    invoke-virtual {v1}, Ljava/io/File;->exists()Z
    move-result v2

    if-eqz v2, :cond_stock

    # Return custom bundle path to React Native Hermes engine
    return-object v0

    :cond_stock
    # Fallback to stock assets/index.android.bundle
    const/4 v0, 0x0
    return-object v0
.end method
