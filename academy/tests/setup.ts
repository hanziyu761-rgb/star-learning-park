import 'fake-indexeddb/auto';
// jsdom does not implement scrolling.
window.scrollTo = (() => undefined) as typeof window.scrollTo;
