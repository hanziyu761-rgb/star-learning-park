import 'fake-indexeddb/auto';
// jsdom does not implement scrolling (and Node-environment tests have no window).
if (typeof window !== 'undefined') window.scrollTo = (() => undefined) as typeof window.scrollTo;
