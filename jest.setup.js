// Jest setup — Expo SDK 54 runtime globals
// These must be available before Expo's winter runtime tries to polyfill them

if (typeof globalThis.structuredClone === "undefined") {
    globalThis.structuredClone = (val) => JSON.parse(JSON.stringify(val));
}

if (typeof globalThis.__ExpoImportMetaRegistry === "undefined") {
    globalThis.__ExpoImportMetaRegistry = {};
}
