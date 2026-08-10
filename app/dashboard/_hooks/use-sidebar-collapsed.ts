import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-sidebar"] });
  return () => observer.disconnect();
}

function getSnapshot(): boolean {
  return document.documentElement.getAttribute("data-sidebar") === "collapsed";
}

function getServerSnapshot(): boolean {
  return false;
}

export function useSidebarCollapsed() {
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggleCollapsed() {
    const next = !collapsed;
    document.documentElement.setAttribute("data-sidebar", next ? "collapsed" : "expanded");
    try {
      localStorage.setItem("sidebar-collapsed", String(next));
    } catch {
      // localStorage unavailable (private mode, etc.) — state still applies for this session.
    }
  }

  return { collapsed, toggleCollapsed };
}
