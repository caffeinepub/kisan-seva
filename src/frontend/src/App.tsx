import { Toaster } from "@/components/ui/sonner";
import { ArrowDownCircle, BookOpen, FileText } from "lucide-react";
import { createContext, useContext, useEffect, useState } from "react";
import { UserRole, type backendInterface } from "./backend";
import Sidebar from "./components/Sidebar";
import { useActor } from "./hooks/useActor";
import { type LocalUser, useLocalAuth } from "./hooks/useLocalAuth";
import { type Lang, getT } from "./i18n";
import AllTransactionsPage from "./pages/AllTransactionsPage";
import BalanceSheetPage from "./pages/BalanceSheetPage";
import BookingsPage from "./pages/BookingsPage";
import CashFlowPage from "./pages/CashFlowPage";
import Dashboard from "./pages/Dashboard";
import DriversPage from "./pages/DriversPage";
import ExpensesPage from "./pages/ExpensesPage";
import LoginPage from "./pages/LoginPage";
import NotificationsPage from "./pages/NotificationsPage";
import PartiesPage from "./pages/PartiesPage";
import PaymentInPage from "./pages/PaymentInPage";
import ReportPage from "./pages/ReportPage";
import ServicesPage from "./pages/ServicesPage";
import SettingsPage from "./pages/SettingsPage";
import TractorsPage from "./pages/TractorsPage";
import TransactionsPage from "./pages/TransactionsPage";

export type Page =
  | "home"
  | "bookings"
  | "bookingList"
  | "transactions"
  | "parties"
  | "tractors"
  | "drivers"
  | "expenses"
  | "settings"
  | "services"
  | "report"
  | "notifications"
  | "allTransactions"
  | "paymentIn"
  | "cashFlow"
  | "balanceSheet";

type AppCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: ReturnType<typeof getT>;
  page: Page;
  setPage: (p: Page) => void;
  navigateTo: (p: Page) => void;
  goBack: () => void;
  isGuest: boolean;
  logout: () => void;
  actor: backendInterface | null;
  currentUser: LocalUser | null;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
};

export const AppContext = createContext<AppCtx>({} as AppCtx);
export const useApp = () => useContext(AppContext);

type BookingPrefill = {
  partyId: string;
  partyName: string;
  serviceType: string;
  bookingRef?: string;
} | null;

function createMockActor(): backendInterface {
  const voidFn = () => Promise.resolve();
  const emptyArr = () => Promise.resolve([]);
  const zeroBig = () => Promise.resolve(BigInt(0));
  const nullFn = () => Promise.resolve(null);
  const falseFn = () => Promise.resolve(false);
  return {
    _initializeAccessControlWithSecret: voidFn,
    assignCallerUserRole: voidFn,
    assignDriverToTractor: voidFn,
    createBooking: zeroBig,
    createDriver: zeroBig,
    createExpense: zeroBig,
    createParty: zeroBig,
    createPayment: zeroBig,
    createTractor: zeroBig,
    deleteBooking: voidFn,
    deleteDriver: voidFn,
    deleteExpense: voidFn,
    deleteParty: voidFn,
    deletePayment: voidFn,
    deleteTractor: voidFn,
    getAllBookings: emptyArr,
    getAllDrivers: emptyArr,
    getAllExpenses: emptyArr,
    getAllParties: emptyArr,
    getAllPayments: emptyArr,
    getAllTractors: emptyArr,
    getBooking: nullFn,
    getBookingsByDateRange: emptyArr,
    getBookingsByParty: emptyArr,
    getBookingsByTractor: emptyArr,
    getCallerUserProfile: nullFn,
    getCallerUserRole: () => Promise.resolve(UserRole.guest),
    getDriver: nullFn,
    getEarningsThisMonth: zeroBig,
    getEarningsToday: zeroBig,
    getExpense: nullFn,
    getExpensesByDriver: zeroBig,
    getExpensesByTractor: zeroBig,
    getNetProfit: zeroBig,
    getPartiesWithPendingCredit: emptyArr,
    getParty: nullFn,
    getPayment: nullFn,
    getTotalEarnings: zeroBig,
    getTractor: nullFn,
    getUserProfile: nullFn,
    isCallerAdmin: falseFn,
    saveCallerUserProfile: voidFn,
    updateBooking: voidFn,
    updateDriver: voidFn,
    updateExpense: voidFn,
    updateParty: voidFn,
    updatePayment: voidFn,
    updateTractor: voidFn,
    updateTractorStatus: voidFn,
  };
}

export default function App() {
  const {
    isLoggedIn,
    isGuest,
    currentUser,
    createAccount,
    loginWithMobile,
    guestLogin,
    logout,
    changePassword,
    getSecurityQuestion,
  } = useLocalAuth();
  const { actor: realActor } = useActor();
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem("ktp_lang") as Lang) || "en";
  });
  const [page, setPage] = useState<Page>("home");
  const [pageHistory, setPageHistory] = useState<Page[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookingPrefill, setBookingPrefill] = useState<BookingPrefill>(null);
  const [darkMode, setDarkModeState] = useState<boolean>(() => {
    return localStorage.getItem("ktp_dark") === "true";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("ktp_lang", l);
  };

  const setDarkMode = (v: boolean) => {
    setDarkModeState(v);
    localStorage.setItem("ktp_dark", String(v));
  };

  const navigateTo = (p: Page) => {
    setPageHistory((prev) => [...prev, page]);
    setPage(p);
  };

  const goBack = () => {
    if (pageHistory.length > 0) {
      const prev = pageHistory[pageHistory.length - 1];
      setPageHistory((h) => h.slice(0, -1));
      setPage(prev);
    } else {
      setPage("home");
    }
  };

  const t = getT(lang);

  useEffect(() => {
    document.title = "Kisan Seva";
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const contextValue = {
    lang,
    setLang,
    t,
    page,
    setPage,
    navigateTo,
    goBack,
    isGuest: false,
    logout,
    actor: null,
    currentUser: null,
    darkMode,
    setDarkMode,
  };

  if (!isLoggedIn && !isGuest) {
    return (
      <AppContext.Provider value={contextValue}>
        <LoginPage
          onCreateAccount={createAccount}
          onLogin={loginWithMobile}
          onGuestLogin={guestLogin}
          onChangePassword={changePassword}
          getSecurityQuestion={getSecurityQuestion}
        />
        <Toaster />
      </AppContext.Provider>
    );
  }

  const actor: backendInterface = isGuest
    ? createMockActor()
    : (realActor as backendInterface);

  const handleCompleteBooking = (b: {
    partyId: bigint;
    workType: string;
    id: bigint;
  }) => {
    setBookingPrefill({
      partyId: b.partyId.toString(),
      partyName: b.partyId.toString(),
      serviceType: b.workType,
      bookingRef: `BKG-${b.id.toString().padStart(4, "0")}`,
    });
    navigateTo("transactions");
  };

  const renderPage = () => {
    if (!actor && !isGuest)
      return (
        <div className="p-4 text-center text-muted-foreground">Loading...</div>
      );
    switch (page) {
      case "home":
        return (
          <Dashboard actor={actor} onOpenSidebar={() => setSidebarOpen(true)} />
        );
      case "bookings":
        return (
          <BookingsPage
            actor={actor}
            onOpenSidebar={() => setSidebarOpen(true)}
            onCompleteBooking={handleCompleteBooking}
          />
        );
      case "bookingList":
        return (
          <BookingsPage
            actor={actor}
            onOpenSidebar={() => setSidebarOpen(true)}
            listOnly
            onCompleteBooking={handleCompleteBooking}
          />
        );
      case "transactions":
        return (
          <TransactionsPage
            actor={actor}
            onOpenSidebar={() => setSidebarOpen(true)}
            prefill={bookingPrefill}
            onClearPrefill={() => setBookingPrefill(null)}
          />
        );
      case "report":
        return (
          <ReportPage
            actor={actor}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        );
      case "parties":
        return (
          <PartiesPage
            actor={actor}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        );
      case "tractors":
        return (
          <TractorsPage
            actor={actor}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        );
      case "drivers":
        return (
          <DriversPage
            actor={actor}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        );
      case "expenses":
        return (
          <ExpensesPage
            actor={actor}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        );
      case "services":
        return <ServicesPage onOpenSidebar={() => setSidebarOpen(true)} />;
      case "settings":
        return <SettingsPage actor={actor} />;
      case "notifications":
        return <NotificationsPage onOpenSidebar={() => setSidebarOpen(true)} />;
      case "paymentIn":
        return (
          <PaymentInPage
            actor={actor}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        );
      case "allTransactions":
        return (
          <AllTransactionsPage
            actor={actor}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        );
      case "cashFlow":
        return (
          <CashFlowPage
            actor={actor}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        );
      case "balanceSheet":
        return (
          <BalanceSheetPage
            actor={actor}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        );
      default:
        return null;
    }
  };

  const bottomNavItems = [
    { key: "paymentIn" as Page, label: "Payment In", icon: ArrowDownCircle },
    { key: "transactions" as Page, label: t.transaction, icon: FileText },
    { key: "bookings" as Page, label: t.bookings, icon: BookOpen },
  ];

  const fullCtx = {
    lang,
    setLang,
    t,
    page,
    setPage,
    navigateTo,
    goBack,
    isGuest,
    logout,
    actor,
    currentUser,
    darkMode,
    setDarkMode,
  };

  return (
    <AppContext.Provider value={fullCtx}>
      <div className="flex justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <div className="relative w-full max-w-[430px] bg-background flex flex-col min-h-screen shadow-xl">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <main className="flex-1 overflow-y-auto pb-[120px]">
            {renderPage()}
          </main>

          {/* Guest Banner */}
          {isGuest && (
            <div className="fixed bottom-[60px] left-1/2 -translate-x-1/2 w-full max-w-[430px] z-20">
              <div className="bg-orange-500 text-white text-xs px-4 py-2 flex items-center justify-between">
                <span>{t.guestBannerText}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="underline font-semibold whitespace-nowrap ml-2"
                  data-ocid="guest.button"
                >
                  {t.loginButtonText}
                </button>
              </div>
            </div>
          )}

          {/* Fixed Bottom Navigation */}
          <div
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-30 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg"
            style={{ height: "60px" }}
          >
            <div className="grid grid-cols-3 h-full">
              {bottomNavItems.map(({ key, label, icon: Icon }) => {
                const isActive = page === key;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => navigateTo(key)}
                    className={`flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors relative ${
                      isActive
                        ? "text-green-700"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                    }`}
                    data-ocid={`nav.${label.toLowerCase().replace(/ /g, "_")}.button`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isActive
                          ? "text-green-700"
                          : "text-gray-400 dark:text-gray-500"
                      }`}
                    />
                    <span>{label}</span>
                    {isActive && (
                      <span className="w-1 h-1 rounded-full bg-green-600 absolute bottom-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </AppContext.Provider>
  );
}
