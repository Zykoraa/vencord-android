import { metroFinder } from "../metro/finder.js";

function getReact() {
    const g = globalThis as any;
    if (g.React) return g.React;

    const metroReact = metroFinder.findByProps("createElement", "useState");
    if (metroReact) return metroReact;

    // Headless / fallback shim
    return {
        createElement: (type: any, props: any, ...children: any[]) => ({
            type,
            props: { ...props, children: children.length === 1 ? children[0] : children }
        }),
        useState: <T>(init: T): [T, (v: any) => void] => [init, () => {}],
        useEffect: () => {},
        useMemo: (fn: any) => fn(),
        useCallback: (fn: any) => fn,
        useRef: (init: any) => ({ current: init }),
    };
}

const ReactInstance = getReact();

export const useState = <T>(init: T) => (getReact().useState || ReactInstance.useState)(init);
export const useEffect = (fn: any, deps?: any[]) => (getReact().useEffect || ReactInstance.useEffect)(fn, deps);
export const useMemo = (fn: any, deps?: any[]) => (getReact().useMemo || ReactInstance.useMemo)(fn, deps);
export const useCallback = (fn: any, deps?: any[]) => (getReact().useCallback || ReactInstance.useCallback)(fn, deps);
export const useRef = (init: any) => (getReact().useRef || ReactInstance.useRef)(init);
export const createElement = (...args: any[]) => (getReact().createElement || ReactInstance.createElement)(...args);

// JSX runtime helpers
export const jsx = createElement;
export const jsxs = createElement;
export const Fragment = "Fragment";

export default ReactInstance;
