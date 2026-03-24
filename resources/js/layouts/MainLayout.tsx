import type { ReactNode } from "react";
import { SidebarProvider, useSidebar } from "../context/sidebar-context";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Backdrop } from "./Backdrop";

interface LayoutContentProps {
  children: ReactNode;
}

function LayoutContent({ children }: LayoutContentProps) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      <Backdrop />

      {/* Main content */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out
          ${isExpanded || isHovered ? "lg:ml-64" : "lg:ml-20"}
          ${isMobileOpen ? "ml-0" : ""}`}
      >
        <Header />

        {/* Page content */}
        <main className="flex-1 p-4 mx-auto w-full max-w-screen-2xl md:p-6">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
}

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}

export default MainLayout;
