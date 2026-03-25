import { useCallback, useEffect, useRef, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import { useSidebar } from "../context/sidebar-context";
import {
  DashboardIcon,
  ProductIcon,
  OrderIcon,
  ChatIcon,
  CatalogIcon,
  SettingsIcon,
  ChevronDownIcon,
} from "../components/icons";

interface NavItem {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string }[];
}

const menuItems: NavItem[] = [
  {
    name: "Dashboard",
    icon: <DashboardIcon className="w-5 h-5" />,
    path: "/dashboard",
  },
  {
    name: "Produk",
    icon: <ProductIcon className="w-5 h-5" />,
    path: "/products",
  },
  {
    name: "Pesanan",
    icon: <OrderIcon className="w-5 h-5" />,
    path: "/orders",
  },
  {
    name: "Chat",
    icon: <ChatIcon className="w-5 h-5" />,
    path: "/chats",
  },
  {
    name: "Katalog",
    icon: <CatalogIcon className="w-5 h-5" />,
    path: "/catalogs",
  },
  {
    name: "Pengaturan",
    icon: <SettingsIcon className="w-5 h-5" />,
    path: "/settings",
  },
];

export function Sidebar() {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { url } = usePage();

  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<number, number>>({});
  const subMenuRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => url === path, [url]);
  const isPathActive = useCallback((path: string) => url.startsWith(path), [url]);

  // Auto-expand submenu if current path matches
  useEffect(() => {
    menuItems.forEach((nav, index) => {
      if (nav.subItems) {
        const hasActiveSubItem = nav.subItems.some((sub) => isPathActive(sub.path));
        if (hasActiveSubItem) {
          setOpenSubmenu(index);
        }
      }
    });
  }, [url, isPathActive]);

  // Calculate submenu height for animation
  useEffect(() => {
    if (openSubmenu !== null && subMenuRefs.current[openSubmenu]) {
      setSubMenuHeight((prev) => ({
        ...prev,
        [openSubmenu]: subMenuRefs.current[openSubmenu]?.scrollHeight || 0,
      }));
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number) => {
    setOpenSubmenu((prev) => (prev === index ? null : index));
  };

  const showExpanded = isExpanded || isHovered || isMobileOpen;

  return (
    <aside
      className={`fixed top-0 left-0 z-50 flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out
        ${showExpanded ? "w-64" : "w-20"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b border-gray-200 ${!showExpanded && "justify-center"}`}>
        <Link href="/" className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-green-600 rounded-lg">
            <ChatIcon className="w-6 h-6 text-white" />
          </div>
          {showExpanded && (
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-gray-900">WA SLA</span>
              <span className="text-xs text-gray-500">Management System</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((nav, index) => (
            <li key={nav.name}>
              {nav.subItems ? (
                // Menu with submenu
                <>
                  <button
                    onClick={() => handleSubmenuToggle(index)}
                    className={`flex items-center w-full gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                      ${openSubmenu === index ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-gray-100"}
                      ${!showExpanded && "justify-center"}`}
                  >
                    <span className={openSubmenu === index ? "text-green-600" : "text-gray-500"}>
                      {nav.icon}
                    </span>
                    {showExpanded && (
                      <>
                        <span className="flex-1 text-left">{nav.name}</span>
                        <ChevronDownIcon
                          className={`w-4 h-4 transition-transform duration-200 ${
                            openSubmenu === index ? "rotate-180" : ""
                          }`}
                        />
                      </>
                    )}
                  </button>
                  {showExpanded && (
                    <div
                      ref={(el) => {
                        subMenuRefs.current[index] = el;
                      }}
                      className="overflow-hidden transition-all duration-300"
                      style={{
                        height: openSubmenu === index ? `${subMenuHeight[index]}px` : "0px",
                      }}
                    >
                      <ul className="mt-1 ml-8 space-y-1">
                        {nav.subItems.map((subItem) => (
                          <li key={subItem.name}>
                            <Link
                              href={subItem.path}
                              className={`block px-3 py-2 text-sm rounded-lg transition-colors
                                ${isPathActive(subItem.path) ? "text-green-700 bg-green-50" : "text-gray-600 hover:bg-gray-100"}`}
                            >
                              {subItem.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                // Single menu item
                nav.path && (
                  <Link
                    href={nav.path}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                      ${isActive(nav.path) ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-gray-100"}
                      ${!showExpanded && "justify-center"}`}
                  >
                    <span className={isActive(nav.path) ? "text-green-600" : "text-gray-500"}>
                      {nav.icon}
                    </span>
                    {showExpanded && <span>{nav.name}</span>}
                  </Link>
                )
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {showExpanded ? (
          <p className="text-xs text-center text-gray-400">WhatsApp SLA v1.0</p>
        ) : (
          <p className="text-xs text-center text-gray-400">v1.0</p>
        )}
      </div>
    </aside>
  );
}
