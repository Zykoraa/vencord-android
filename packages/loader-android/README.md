# Vencord Mobile Android Loader

This package contains the native Android injection components for loading Vencord Mobile into Discord's React Native environment.

## How Injection Works

Discord for Android runs React Native using the **Hermes** JavaScript engine.
The native Java/Kotlin Android runtime initializes React Native through a class implementing `com.facebook.react.ReactNativeHost`.

By default, React Native invokes `ReactNativeHost.getJSBundleFile()`.
- If `getJSBundleFile()` returns `null`, React Native loads `assets://index.android.bundle` (the stock Discord bundle).
- If `getJSBundleFile()` returns a valid file path string (e.g. `/data/user/0/com.discord/files/vencord_mobile.bundle.js`), Hermes will execute that file instead!

## Injection Methods

### 1. Rootless (APK Smali Patching)
Using `apktool`, decompile the Discord APK and replace or augment the `getJSBundleFile()` method in `com/discord/app/AppReactNativeHost.smali` with `ReactNativeHostHook.smali`.

### 2. Rooted (LSPosed / Xposed Module)
In an Xposed module, hook `com.facebook.react.ReactNativeHost`:
```kotlin
XposedHelpers.findAndHookMethod(
    "com.facebook.react.ReactNativeHost",
    lpparam.classLoader,
    "getJSBundleFile",
    object : XC_MethodHook() {
        override fun afterHookedMethod(param: MethodHookParam) {
            param.result = "/data/user/0/com.discord/files/vencord_mobile.bundle.js"
        }
    }
)
```
