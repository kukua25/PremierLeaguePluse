// Routes alert/confirm UI through AlertProvider's in-app modal instead of
// Alert.alert (native-only, no-op on web) or window.alert (jarring browser
// chrome). AlertProvider registers itself as the handler on mount.
let handler = null;

export function registerAlertHandler(fn) {
  handler = fn;
}

export function showAlert(title, message, buttons) {
  if (!handler) {
    console.warn('showAlert called before AlertProvider mounted:', title, message);
    return;
  }
  handler(title, message, buttons);
}
