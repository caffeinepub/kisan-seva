import {
  ArrowLeftRight,
  BarChart2,
  Bell,
  BookOpen,
  ClipboardList,
  Home,
  LogOut,
  Receipt,
  Settings,
  Tractor,
  UserCheck,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { type Page, useApp } from "../App";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

type Props = { open: boolean; onClose: () => void };

export default function Sidebar({ open, onClose }: Props) {
  const { t, setPage, page, logout, currentUser, isGuest } = useApp();
  const { clear } = useInternetIdentity();

  if (!open) return null;

  const navItems: { key: Page; label: string; icon: React.ElementType }[] = [
    { key: "home", label: t.home, icon: Home },
    { key: "bookings", label: t.bookings, icon: BookOpen },
    { key: "bookingList", label: t.bookingList, icon: ClipboardList },
    { key: "allTransactions", label: t.allTransactions, icon: ArrowLeftRight },
    { key: "report", label: t.report, icon: BarChart2 },
    { key: "parties", label: t.parties, icon: Users },
    { key: "tractors", label: t.tractors, icon: Tractor },
    { key: "drivers", label: t.drivers, icon: UserCheck },
    { key: "services", label: t.services, icon: Wrench },
    { key: "expenses", label: t.expenses, icon: Receipt },
    { key: "notifications", label: t.notifications, icon: Bell },
  ];

  const handleNav = (key: Page) => {
    setPage(key);
    onClose();
  };

  const initials = currentUser?.name
    ? currentUser.name
        .trim()
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "G";

  return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        className="fixed inset-0 bg-black/50 z-40 w-full h-full border-0 p-0 cursor-default"
        onClick={onClose}
      />
      <div
        className="fixed left-0 top-0 h-full w-72 bg-white z-50 shadow-2xl flex flex-col overflow-y-auto"
        style={{ maxWidth: "80vw" }}
        data-ocid="sidebar.panel"
      >
        {/* Header with app name */}
        <div className="flex items-center justify-between px-4 py-3 bg-green-700 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full">
              <Tractor className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg">Kisan Seva</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white p-1 rounded"
            data-ocid="sidebar.close_button"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User Info Card */}
        <div className="flex items-center gap-3 px-4 py-3 bg-green-800 shrink-0">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">
              {isGuest ? "Guest User" : currentUser?.name || "User"}
            </p>
            <p className="text-green-200 text-xs truncate">
              {isGuest ? "Guest Mode" : currentUser?.mobile || ""}
            </p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="py-2 flex-1">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              type="button"
              key={key}
              onClick={() => handleNav(key)}
              className={`flex items-center gap-3 w-full px-5 py-3 text-left text-sm font-medium transition-colors ${
                page === key
                  ? "bg-green-50 text-green-700 border-r-4 border-green-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              data-ocid={`sidebar.${key}.link`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </button>
          ))}

          <div className="my-2 border-t border-gray-100" />

          {/* Settings */}
          <button
            type="button"
            onClick={() => handleNav("settings")}
            className={`flex items-center gap-3 w-full px-5 py-3 text-left text-sm font-medium transition-colors ${
              page === "settings"
                ? "bg-green-50 text-green-700 border-r-4 border-green-700"
                : "text-gray-700 hover:bg-gray-50"
            }`}
            data-ocid="sidebar.settings.link"
          >
            <Settings className="w-5 h-5" />
            <span>{t.settings}</span>
          </button>
        </nav>

        {/* Logout */}
        <button
          type="button"
          onClick={() => {
            clear();
            logout();
            onClose();
          }}
          className="flex items-center gap-3 px-5 py-4 text-red-600 hover:bg-red-50 border-t text-sm font-medium shrink-0"
          data-ocid="sidebar.logout.button"
        >
          <LogOut className="w-5 h-5" />
          {t.logout}
        </button>
      </div>
    </>
  );
}
