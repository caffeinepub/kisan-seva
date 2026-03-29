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
import { Package, TrendingUp } from "lucide-react";
import { type Page, useApp } from "../App";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

type Props = { open: boolean; onClose: () => void };

export default function Sidebar({ open, onClose }: Props) {
  const { t, navigateTo, page, logout, currentUser, isGuest } = useApp();
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
    { key: "cashFlow", label: t.cashFlow, icon: TrendingUp },
    { key: "balanceSheet", label: t.balanceSheet, icon: BarChart2 },
    {
      key: "equipment" as Page,
      label: (t as any).equipment || "Equipment",
      icon: Package,
    },
  ];

  const handleNav = (key: Page) => {
    navigateTo(key);
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
        className="fixed left-0 top-0 h-full w-72 bg-white dark:bg-gray-900 z-50 shadow-2xl flex flex-col overflow-y-auto"
        style={{ maxWidth: "80vw" }}
        data-ocid="sidebar.panel"
      >
        {/* Header with app name */}
        <div className="flex items-center justify-between px-4 py-3 bg-green-700 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-green-600 rounded-full">
              <Tractor className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg">Kisan Seva</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-green-600"
            data-ocid="sidebar.close_button"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-3 bg-green-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
              {initials}
            </div>
            <div>
              <div className="text-white font-semibold text-sm">
                {isGuest ? "Guest User" : currentUser?.name || "User"}
              </div>
              <div className="text-green-200 text-xs">
                {isGuest ? "" : currentUser?.mobile || ""}
              </div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-2">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleNav(key)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                page === key
                  ? "bg-green-50 dark:bg-green-900/30 text-green-700 border-r-2 border-green-700"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              data-ocid={`sidebar.${key}.link`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Settings & Logout */}
        <div className="border-t border-gray-200 dark:border-gray-700 py-2 shrink-0">
          <button
            type="button"
            onClick={() => handleNav("settings")}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            data-ocid="sidebar.settings.link"
          >
            <Settings className="w-5 h-5" />
            {t.settings}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isGuest) clear();
              logout();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            data-ocid="sidebar.logout.button"
          >
            <LogOut className="w-5 h-5" />
            {isGuest ? t.exitGuestMode : t.logout}
          </button>
        </div>
      </div>
    </>
  );
}
