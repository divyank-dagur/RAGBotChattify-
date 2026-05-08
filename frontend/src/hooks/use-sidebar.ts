"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  createElement,
  type ReactNode,
} from "react";

interface SidebarState {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarState>({
  isOpen: true,
  toggle: () => {},
  open: () => {},
  close: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return createElement(
    SidebarContext.Provider,
    { value: { isOpen, toggle, open, close } },
    children,
  );
}

export function useSidebar(): SidebarState {
  return useContext(SidebarContext);
}
