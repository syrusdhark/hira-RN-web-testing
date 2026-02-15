// #region agent log
console.log('[DEBUG]', { message: 'index.ts bundle executing', timestamp: Date.now() });
// #endregion
import React from 'react';
import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import App from './src/App';

// #region agent log
const log = (msg: string, data: Record<string, unknown>) => {
  const payload = { location: 'index.ts:register', message: msg, data, timestamp: Date.now(), hypothesisId: 'H2' };
  console.log('[DEBUG]', payload);
  fetch('http://127.0.0.1:7242/ingest/873cbf59-1a11-4af9-aa21-381ba69693ce', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {});
};
// #endregion

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
// #region agent log
log('registerRootComponent called', {});
function Root() {
  log('App root component rendering', {});
  return React.createElement(
    SafeAreaProvider,
    { style: { flex: 1 } },
    React.createElement(App, null)
  );
}
registerRootComponent(Root);
// #endregion
