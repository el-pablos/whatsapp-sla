import { useState, useRef, useEffect } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import { useSidebar } from "../context/sidebar-context";
import { MenuIcon, CloseIcon, BellIcon, UserIcon, LogoutIcon, SettingsIcon } from "../components/icons";

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

interface PageProps {
  auth?: {
    user?: User;
  };
}

export function Header() {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { auth } = usePage<PageProps>().props;
  const user = auth?.user;

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const handleLogout = () => {
    router.post("/logout");
  };

  return (
    <header className="sticky top-0 z-40 flex items-center h-16 px-4 bg-white border-b border-gray-200 lg:px-6">
      {/* Left: Toggle button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleToggle}
          className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 lg:hover:bg-gray-100"
          aria-label="Toggle sidebar"
        >
          {isMobileOpen ? (
            <CloseIcon className="w-6 h-6" />
          ) : (
            <MenuIcon className="w-6 h-6" />
          )}
        </button>

        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2 lg:hidden">
          <span className="text-lg font-semibold text-gray-900">WA SLA</span>
        </Link>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <div ref={notificationRef} className="relative">
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="relative p-2 text-gray-500 rounded-lg hover:bg-gray-100"
            aria-label="Notifications"
          >
            <BellIcon className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {isNotificationOpen && (
            <div className="absolute right-0 w-80 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Notifikasi</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="px-4 py-3 hover:bg-gray-50">
                  <p className="text-sm text-gray-700">Pesanan baru dari 628123456789</p>
                  <p className="text-xs text-gray-500 mt-1">2 menit lalu</p>
                </div>
                <div className="px-4 py-3 hover:bg-gray-50">
                  <p className="text-sm text-gray-700">Chat baru menunggu respon</p>
                  <p className="text-xs text-gray-500 mt-1">5 menit lalu</p>
                </div>
              </div>
              <div className="px-4 py-2 border-t border-gray-200">
                <Link href="/notifications" className="text-sm text-green-600 hover:text-green-700">
                  Lihat semua
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
              ) : (
                <UserIcon className="w-5 h-5 text-gray-600" />
              )}
            </div>
            <span className="hidden text-sm font-medium text-gray-700 md:block">
              {user?.name || "User"}
            </span>
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 w-56 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
              <div className="px-4 py-3 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900">{user?.name || "User"}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || "user@example.com"}</p>
              </div>
              <div className="py-1">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <UserIcon className="w-4 h-4" />
                  Profil
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <SettingsIcon className="w-4 h-4" />
                  Pengaturan
                </Link>
              </div>
              <div className="py-1 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogoutIcon className="w-4 h-4" />
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
