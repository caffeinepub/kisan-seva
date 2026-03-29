import { Menu, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../App";
import type { backendInterface } from "../backend";
import type { Payment } from "../backend";

type Props = {
  actor: backendInterface;
  onOpenSidebar: () => void;
};

type ActiveTab = "parties" | "transactions" | "services";

interface SavedTxn {
  id: string;
  partyName?: string;
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

export default function Dashboard({ actor, onOpenSidebar }: Props) {
  const { t, setPage } = useApp();
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: actor is stable
  useEffect(() => {
    const load = async () => {
      try {
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
    load();
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
    return getSavedTransactions().find((s) => s.id === key)?.partyName || "";
  };

  const handlePartyClick = (p: {
    id: bigint;
    name: string;
    creditBalance: bigint;
  }) => {
    localStorage.setItem("ktp_open_party_id", p.id.toString());
    setPage("parties");
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
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700"
                    data-ocid={`dashboard.transactions.item.${i + 1}`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-green-700 font-mono bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full text-xs w-fit">
                        #TXN-{pay.id.toString().padStart(4, "0")}
                      </span>
                      {partyName ? (
                        <span className="text-gray-700 dark:text-gray-300 text-xs font-semibold">
                          {partyName}
                        </span>
                      ) : null}
                      <span className="text-gray-400 dark:text-gray-500 text-xs">
                        {dateStr}
                      </span>
                    </div>
                    <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                      ₹{pay.amount.toString()}
                    </span>
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
            Kisan Seva
          </span>
          <Pencil className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="w-8" />
      </div>

      {/* Stats Cards */}
      <div className="px-4 pt-4 mb-2">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`flex-shrink-0 bg-white dark:bg-gray-900 rounded-2xl border ${s.border} p-3 shadow-sm w-36`}
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
