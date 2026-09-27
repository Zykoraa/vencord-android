import { metroFinder } from "../metro/finder.js";
function getReact() {
    const g = globalThis;
    if (g.React)
        return g.React;
    const metroReact = metroFinder.findByProps("createElement", "useState");
    if (metroReact)
        return metroReact;
    // Headless / fallback shim
    return {
        createElement: (type, props, ...children) => ({
            type,
            props: { ...props, children: children.length === 1 ? children[0] : children }
        }),
        useState: (init) => [init, () => { }],
        useEffect: () => { },
        useMemo: (fn) => fn(),
        useCallback: (fn) => fn,
        useRef: (init) => ({ current: init }),
    };
}
const ReactInstance = getReact();
export const useState = (init) => (getReact().useState || ReactInstance.useState)(init);
export const useEffect = (fn, deps) => (getReact().useEffect || ReactInstance.useEffect)(fn, deps);
export const useMemo = (fn, deps) => (getReact().useMemo || ReactInstance.useMemo)(fn, deps);
export const useCallback = (fn, deps) => (getReact().useCallback || ReactInstance.useCallback)(fn, deps);
export const useRef = (init) => (getReact().useRef || ReactInstance.useRef)(init);
export const createElement = (...args) => (getReact().createElement || ReactInstance.createElement)(...args);
// JSX runtime helpers
export const jsx = createElement;
export const jsxs = createElement;
export const Fragment = "Fragment";
export default ReactInstance;
//# sourceMappingURL=react.js.map