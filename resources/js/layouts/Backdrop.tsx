import { useSidebar } from "../context/sidebar-context";

export function Backdrop() {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  if (!isMobileOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
      onClick={toggleMobileSidebar}
      aria-hidden="true"
    />
  );
}
