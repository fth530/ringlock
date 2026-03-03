module.exports = {
    preset: "jest-expo",
    setupFiles: ["./jest.setup.js"],
    transformIgnorePatterns: [
        "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|expo-haptics|@react-native-async-storage|expo-asset|react-native-worklets)",
    ],
};
