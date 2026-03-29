import { Menu, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../App";
import type { SavedTransactionFull } from "../App";
import type { backendInterface } from "../backend";
import type { Payment } from "../backend";

type Props = {
  actor: backendInterface;
  onOpenSidebar: () => void;
  onEditTransaction?: (txn: SavedTransactionFull) => void;
};

type ActiveTab = "parties" | "transactions" | "services";

interface SavedTxn {
  id: string;
  partyName?: string;
  partyId?: string;
  amount?: number;
  discount?: number;
  receivedAmount?: number;
  [key: string]: unknown;
}

function getSavedTransactions(): SavedTxn[] {
  try {
    const raw = localStorage.getItem("ktp_saved_transactions");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setSavedTransactions(items: SavedTxn[]) {
  localStorage.setItem("ktp_saved_transactions", JSON.stringify(items));
}

export default function Dashboard({
  actor,
  onOpenSidebar,
  onEditTransaction,
}: Props) {
  const { t, setPage } = useApp();
  const [businessName, setBusinessName] = useState("Kisan Seva");
  const [activeTab, setActiveTab] = useState<ActiveTab>("parties");
  const [todayEarnings, setTodayEarnings] = useState<bigint>(0n);
  const [monthEarnings, setMonthEarnings] = useState<bigint>(0n);
  const [totalEarnings, setTotalEarnings] = useState<bigint>(0n);
  const [netProfit, setNetProfit] = useState<bigint>(0n);
  const [pendingParties, setPendingParties] = useState<
    { id: bigint; name: string; creditBalance: bigint }[]
  >([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [services, setServices] = useState<{ name: string; rate: number }[]>(
    [],
  );

  const loadData = async () => {
    try {
      const profile = await actor.getCallerUserProfile();
      if (profile?.businessName) setBusinessName(profile.businessName);
      const [tod, mon, tot, parties, payments] = await Promise.all([
        actor.getEarningsToday(),
        actor.getEarningsThisMonth(),
        actor.getTotalEarnings(),
        actor.getPartiesWithPendingCredit(),
        actor.getAllPayments(),
      ]);
      setTodayEarnings(tod);
      setMonthEarnings(mon);
      setTotalEarnings(tot);
      setNetProfit(mon);
      setPendingParties(parties);
      const sorted = [...payments].sort(
        (a, b) => Number(b.date) - Number(a.date),
      );
      setAllPayments(sorted);
    } catch (e) {
      console.error(e);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: actor is stable
  useEffect(() => {
    loadData();
  }, [actor]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("kisan_services_v2");
      if (raw) {
        setServices(JSON.parse(raw));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Read directly from localStorage — no effect needed
  const getPartyNameForPayment = (pay: Payment): string => {
    const key = `#TXN-${pay.id.toString().padStart(4, "0")}`;
    return (
      getSavedTransactions().find((s) => s.id === key)?.partyName || "Cash"
    );
  };

  const handlePartyClick = (p: {
    id: bigint;
    name: string;
    creditBalance: bigint;
  }) => {
    localStorage.setItem("ktp_open_party_id", p.id.toString());
    setPage("parties");
  };

  const handleDashboardDelete = async (pay: Payment) => {
    if (!confirm("Delete this transaction?")) return;
    const key = `#TXN-${pay.id.toString().padStart(4, "0")}`;
    const all = getSavedTransactions();
    const txnEntry = all.find((s) => s.id === key);

    // Reverse party balance
    if (txnEntry?.partyId && txnEntry.partyId !== "cash_party") {
      const oldBalance = Math.max(
        0,
        (txnEntry.amount || 0) -
          (txnEntry.discount || 0) -
          (txnEntry.receivedAmount || 0),
      );
      if (oldBalance > 0) {
        const udhar = JSON.parse(
          localStorage.getItem("ktp_party_udhar") || "{}",
        );
        udhar[txnEntry.partyId] = Math.max(
          0,
          (udhar[txnEntry.partyId] || 0) - oldBalance,
        );
        localStorage.setItem("ktp_party_udhar", JSON.stringify(udhar));
      }
    }

    const updated = all.filter((s) => s.id !== key);
    setSavedTransactions(updated);

    try {
      await (actor as any).deletePayment(pay.id);
    } catch {
      // ignore
    }

    toast.success(t.deletedMsg || "Deleted");
    await loadData();
  };

  const stats = [
    {
      label: t.todayEarnings,
      value: todayEarnings,
      color: "text-green-600",
      border: "border-green-100",
      icon: "⬇",
      iconColor: "text-green-500",
    },
    {
      label: t.thisMonth,
      value: monthEarnings,
      color: "text-orange-500",
      border: "border-orange-100",
      icon: "₹",
      iconColor: "text-orange-500",
    },
    {
      label: t.totalEarnings,
      value: totalEarnings,
      color: "text-blue-600",
      border: "border-blue-100",
      icon: "⬆",
      iconColor: "text-blue-500",
    },
    {
      label: t.netProfit,
      value: netProfit,
      color: "text-purple-600",
      border: "border-purple-100",
      icon: "📊",
      iconColor: "text-purple-500",
    },
  ];

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: "parties", label: t.partyDue },
    { key: "transactions", label: t.allTransactions },
    { key: "services", label: t.serviceList },
  ];

  const renderTabContent = () => {
    if (activeTab === "parties") {
      return (
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <span>👥</span> {t.parties}
            </h2>
            <button
              type="button"
              onClick={() => setPage("parties")}
              className="text-green-600 text-xs font-medium"
              data-ocid="dashboard.parties.link"
            >
              {t.seeAll}
            </button>
          </div>
          {pendingParties.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">
              {t.noPendingCredit}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {pendingParties.map((p, i) => (
                <button
                  key={p.id.toString()}
                  type="button"
                  onClick={() => handlePartyClick(p)}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer w-full text-left"
                  data-ocid={`dashboard.parties.item.${i + 1}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-800 dark:text-gray-200 text-sm font-medium">
                      {p.name}
                    </span>
                  </div>
                  <span className="font-bold text-red-500 text-sm">
                    ₹{p.creditBalance.toString()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === "transactions") {
      return (
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <span>🧾</span> {t.transaction}
            </h2>
            <button
              type="button"
              onClick={() => setPage("allTransactions")}
              className="text-green-600 text-xs font-medium"
              data-ocid="dashboard.transactions.link"
            >
              {t.seeAll}
            </button>
          </div>
          {allPayments.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">
              {t.noTransactions}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {allPayments.map((pay, i) => {
                const date = new Date(Number(pay.date) / 1_000_000);
                const dateStr = date.toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                });
                const partyName = getPartyNameForPayment(pay);
                return (
                  <div
                    key={pay.id.toString()}
                    className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700"
                    data-ocid={`dashboard.transactions.item.${i + 1}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                          {partyName}
                        </span>
                        <span className="text-green-700 font-mono bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full text-xs w-fit">
                          #TXN-{pay.id.toString().padStart(4, "0")}
                        </span>
                        <span className="text-gray-400 dark:text-gray-500 text-xs">
                          {dateStr}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                          ₹{pay.amount.toString()}
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const key = `#TXN-${pay.id.toString().padStart(4, "0")}`;
                              const txn = getSavedTransactions().find(
                                (s) => s.id === key,
                              );
                              if (txn && onEditTransaction) {
                                onEditTransaction(
                                  txn as unknown as SavedTransactionFull,
                                );
                              }
                            }}
                            className="p-1 text-blue-500 rounded border border-blue-200 hover:bg-blue-50"
                            title="Edit"
                            data-ocid={`dashboard.transactions.edit_button.${i + 1}`}
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDashboardDelete(pay)}
                            className="p-1 text-red-500 rounded border border-red-200 hover:bg-red-50"
                            title="Delete"
                            data-ocid={`dashboard.transactions.delete_button.${i + 1}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === "services") {
      return (
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <span>🔧</span> {t.serviceList}
            </h2>
            <button
              type="button"
              onClick={() => setPage("services")}
              className="text-green-600 text-xs font-medium"
              data-ocid="dashboard.services.link"
            >
              {t.seeAll}
            </button>
          </div>
          {services.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">
              {t.noServices}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {services.map((svc, i) => (
                <div
                  key={svc.name}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700"
                  data-ocid={`dashboard.services.item.${i + 1}`}
                >
                  <span className="text-gray-800 dark:text-gray-200 text-sm font-medium">
                    {svc.name}
                  </span>
                  <span className="font-bold text-green-700 text-sm">
                    ₹{svc.rate}/hr
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col min-h-full bg-white dark:bg-gray-900 pb-4">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100 dark:border-gray-700">
        <button type="button" onClick={onOpenSidebar} className="p-1">
          <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        </button>
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-800 dark:text-gray-200 text-base">
            {businessName}
          </span>
        </div>
        <div className="w-8" />
      </div>

      {/* Stats Cards */}
      <div className="px-4 pt-4 mb-2">
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`bg-white dark:bg-gray-900 rounded-2xl border ${s.border} p-3 shadow-sm`}
            >
              <div className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                <span className={s.iconColor}>{s.icon}</span>
                <span>{s.label}</span>
              </div>
              <div className={`text-2xl font-bold ${s.color}`}>
                ₹{s.value.toString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Middle Tab Bar */}
      <div className="px-4 mb-1">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 text-xs font-semibold py-2 px-1 rounded-lg transition-all ${
                activeTab === tab.key
                  ? "bg-white dark:bg-gray-900 text-green-700 shadow-sm border-b-2 border-green-500"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
              data-ocid={`dashboard.${tab.key}.tab`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">{renderTabContent()}</div>
    </div>
  );
}
