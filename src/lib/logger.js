const PREFIX = "[StressTest]";

function timestamp() {
  return new Date().toISOString();
}

function enabled() {
  try {
    const forced = localStorage.getItem("STRESS_DEBUG_LOGS");
    if (forced === "0") return false;
    if (forced === "1") return true;
  } catch {
    // ignore
  }
  return true;
}

function fmt(scope, event) {
  return `${PREFIX}[${timestamp()}][${scope}] ${event}`;
}

export function logInfo(scope, event, details = undefined) {
  if (!enabled()) return;
  if (details === undefined) console.log(fmt(scope, event));
  else console.log(fmt(scope, event), details);
}

export function logWarn(scope, event, details = undefined) {
  if (!enabled()) return;
  if (details === undefined) console.warn(fmt(scope, event));
  else console.warn(fmt(scope, event), details);
}

export function logError(scope, event, details = undefined) {
  if (!enabled()) return;
  if (details === undefined) console.error(fmt(scope, event));
  else console.error(fmt(scope, event), details);
}

