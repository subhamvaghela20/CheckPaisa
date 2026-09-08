const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');
const React = require('react');
global.IS_REACT_ACT_ENVIRONMENT = true;

function loadModule(filename, mocks = {}, globals = {}) {
  const cache = new Map();
  function load(file) {
    const absolute = path.resolve(file);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const module = { exports: {} }; cache.set(absolute, module);
    const { code } = babel.transformSync(fs.readFileSync(absolute, 'utf8'), {
      filename: absolute, configFile: false, babelrc: false,
      plugins: ['@babel/plugin-transform-modules-commonjs', ['@babel/plugin-transform-react-jsx', { runtime: 'classic' }]],
    });
    const localRequire = (name) => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.startsWith('.')) return load(path.resolve(path.dirname(absolute), name.endsWith('.js') ? name : `${name}.js`));
      return require(name);
    };
    vm.runInNewContext(code, { module, exports: module.exports, require: localRequire, console, Date, Set, Map, Math, Promise, setTimeout, clearTimeout, setInterval, clearInterval, ...globals }, { filename: absolute });
    return module.exports;
  }
  return load(filename);
}

function nativeMocks(extra = {}) {
  const alerts = [];
  const rn = Object.fromEntries(['View', 'Text', 'Pressable', 'TextInput', 'ScrollView', 'Switch', 'Modal', 'KeyboardAvoidingView', 'SafeAreaView', 'FlatList', 'ActivityIndicator'].map((name) => [name, name]));
  Object.assign(rn, {
    Platform: { OS: 'android' }, Alert: { alert: (...args) => alerts.push(args) },
    Keyboard: { addListener: () => ({ remove() {} }), dismiss() {} },
    BackHandler: { addEventListener: () => ({ remove() {} }) },
    AppState: { currentState: 'active', addEventListener: () => ({ remove() {} }) },
    StyleSheet: { create: (styles) => styles }, Dimensions: { get: () => ({ width: 320, height: 568 }) },
  });
  return { alerts, mocks: {
    'react-native': rn,
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 24, bottom: 24, left: 0, right: 0 }), SafeAreaProvider: 'SafeAreaProvider', SafeAreaView: 'SafeAreaView' },
    '@react-native-community/datetimepicker': { __esModule: true, default: 'DateTimePicker' },
    'expo-linear-gradient': { LinearGradient: 'LinearGradient' },
    '../components/AppIcon': { AppIcon: 'AppIcon' },
    '../components/CustomAlertModal': { CustomAlertModal: 'CustomAlertModal' },
    ...extra,
  } };
}
module.exports = { loadModule, nativeMocks, React };
