import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Menu, Pencil, Trash2, X } from "lucide-react";
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
  partyMobile?: string;
  partyAddress?: string;
  workType?: string;
  hours?: number;
  minutes?: number;
  rate?: number;
  amount?: number;
  discount?: number;
  receivedAmount?: number;
  paymentMethod?: string | { cash?: null; upi?: null; split?: null };
  splitCash?: number;
  splitUpi?: number;
  driverId?: string;
  driverName?: string;
  tractorId?: string;
  tractorName?: string;
  date?: string;
  time?: string;
  notes?: string;
  txType?: string;
  bookingRef?: string;
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

function getPaymentMethodLabel(pm: unknown): string {
  if (!pm) return "Cash";
  if (typeof pm === "string") {
    if (pm === "cash") return "Cash";
    if (pm === "upi") return "UPI";
    if (pm === "split") return "Split";
    return pm;
  }
  if (typeof pm === "object" && pm !== null) {
    if ("cash" in pm) return "Cash";
    if ("upi" in pm) return "UPI";
    if ("split" in pm) return "Split";
  }
  return "Cash";
}

function getPaymentBadgeClass(pm: unknown): string {
  const label = getPaymentMethodLabel(pm);
  if (label === "UPI")
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
  if (label === "Split")
    return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300";
  return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
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
  const [detailTxn, setDetailTxn] = useState<SavedTxn | null>(null);

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

  const getFullTxnForPayment = (pay: Payment): SavedTxn | null => {
    const key = `#TXN-${pay.id.toString().padStart(4, "0")}`;
    return getSavedTransactions().find((s) => s.id === key) || null;
  };

  const getPartyNameForPayment = (pay: Payment): string => {
    return getFullTxnForPayment(pay)?.partyName || "Cash";
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

    // Cascade: delete connected booking
    if (txnEntry) {
      const bookingRef = txnEntry.bookingRef || key.replace("TXN", "BKG");
      const afterRemove = all.filter(
        (s) => s.id !== key && s.id !== bookingRef,
      );
      setSavedTransactions(afterRemove);
      // Clean up bkg_num keys
      const bkgNumMatch = (bookingRef as string)?.match(/#BKG-(\d+)/);
      if (bkgNumMatch) {
        for (let i = 0; i < localStorage.length; i++) {
          const lsKey = localStorage.key(i);
          if (
            lsKey?.startsWith("ktp_bkg_num_") &&
            localStorage.getItem(lsKey) === bkgNumMatch[1]
          ) {
            localStorage.removeItem(lsKey);
            break;
          }
        }
      }
    } else {
      setSavedTransactions(all.filter((s) => s.id !== key));
    }

    // Remove cash flow entries for this txn
    try {
      const cfRaw = localStorage.getItem("ktp_cash_flow_entries");
      if (cfRaw) {
        const cf = JSON.parse(cfRaw);
        const filtered = cf.filter((e: any) => e.txnId !== key);
        localStorage.setItem("ktp_cash_flow_entries", JSON.stringify(filtered));
      }
    } catch {
      // ignore
    }

    try {
      await (actor as any).deletePayment(pay.id);
    } catch {
      // ignore
    }

    toast.success(t.deletedMsg || "Deleted");
    await loadData();
  };

  const handleTxnCardClick = (pay: Payment) => {
    const txn = getFullTxnForPayment(pay);
    if (txn) {
      setDetailTxn(txn);
    } else {
      // Minimal detail from Payment object
      setDetailTxn({
        id: `#TXN-${pay.id.toString().padStart(4, "0")}`,
        partyName: "Cash",
        amount: Number(pay.amount),
        date: new Date(Number(pay.date) / 1_000_000).toISOString().slice(0, 10),
      });
    }
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
                const fullTxn = getFullTxnForPayment(pay);
                const pmLabel = getPaymentMethodLabel(fullTxn?.paymentMethod);
                const pmBadge = getPaymentBadgeClass(fullTxn?.paymentMethod);
                const txnKey = `#TXN-${pay.id.toString().padStart(4, "0")}`;
                return (
                  <div
                    key={pay.id.toString()}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden"
                    data-ocid={`dashboard.transactions.item.${i + 1}`}
                  >
                    {/* Clickable main area */}
                    <button
                      type="button"
                      onClick={() => handleTxnCardClick(pay)}
                      className="w-full text-left px-4 pt-3 pb-2 flex items-start justify-between gap-2"
                    >
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <span className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">
                          {partyName}
                        </span>
                        <span className="text-green-700 font-mono bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full text-xs w-fit">
                          {txnKey}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${pmBadge}`}
                          >
                            {pmLabel}
                          </span>
                          {fullTxn?.workType && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                              {fullTxn.workType}
                            </span>
                          )}
                          {(fullTxn?.hours || fullTxn?.minutes) && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {fullTxn.hours || 0}h {fullTxn.minutes || 0}m
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <span className="font-bold text-gray-800 dark:text-gray-200 text-base">
                          ₹{pay.amount.toString()}
                        </span>
                        <span className="text-gray-400 dark:text-gray-500 text-xs">
                          {dateStr}
                        </span>
                      </div>
                    </button>
                    {/* Actions row */}
                    <div className="flex items-center justify-end gap-1 px-3 pb-2 pt-0 border-t border-gray-50 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => {
                          const txn = getSavedTransactions().find(
                            (s) => s.id === txnKey,
                          );
                          if (txn && onEditTransaction) {
                            onEditTransaction(
                              txn as unknown as SavedTransactionFull,
                            );
                          }
                        }}
                        className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2 py-1 rounded transition-colors"
                        data-ocid={`dashboard.transactions.edit_button.${i + 1}`}
                      >
                        <Pencil className="w-3 h-3" /> {t.edit || "Edit"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDashboardDelete(pay)}
                        className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 px-2 py-1 rounded transition-colors"
                        data-ocid={`dashboard.transactions.delete_button.${i + 1}`}
                      >
                        <Trash2 className="w-3 h-3" /> {t.delete || "Delete"}
                      </button>
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

      {/* Transaction Detail Modal */}
      <Dialog
        open={!!detailTxn}
        onOpenChange={(open) => !open && setDetailTxn(null)}
      >
        <DialogContent
          className="max-w-[90vw] w-full max-h-[80vh] overflow-y-auto rounded-2xl p-0"
          data-ocid="dashboard.transactions.dialog"
        >
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
                {detailTxn?.id || "Transaction Details"}
              </DialogTitle>
              <button
                type="button"
                onClick={() => setDetailTxn(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                data-ocid="dashboard.transactions.close_button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </DialogHeader>
          {detailTxn && (
            <div className="px-5 py-4 flex flex-col gap-3">
              <DetailRow label="Party Name" value={detailTxn.partyName} />
              {detailTxn.partyMobile && (
                <DetailRow label="Mobile" value={detailTxn.partyMobile} />
              )}
              {detailTxn.partyAddress && (
                <DetailRow label="Address" value={detailTxn.partyAddress} />
              )}
              {detailTxn.workType && (
                <DetailRow label="Service / Work" value={detailTxn.workType} />
              )}
              {(detailTxn.hours !== undefined ||
                detailTxn.minutes !== undefined) && (
                <DetailRow
                  label="Duration"
                  value={`${detailTxn.hours || 0}h ${detailTxn.minutes || 0}m`}
                />
              )}
              {detailTxn.rate !== undefined && (
                <DetailRow label="Rate" value={`₹${detailTxn.rate}/hr`} />
              )}
              {detailTxn.amount !== undefined && (
                <DetailRow
                  label="Total Amount"
                  value={`₹${detailTxn.amount}`}
                  highlight
                />
              )}
              {detailTxn.discount !== undefined && detailTxn.discount > 0 && (
                <DetailRow label="Discount" value={`₹${detailTxn.discount}`} />
              )}
              {detailTxn.receivedAmount !== undefined && (
                <DetailRow
                  label="Received"
                  value={`₹${detailTxn.receivedAmount}`}
                />
              )}
              {detailTxn.amount !== undefined &&
                detailTxn.receivedAmount !== undefined && (
                  <DetailRow
                    label="Balance Due"
                    value={`₹${Math.max(0, (detailTxn.amount || 0) - (detailTxn.discount || 0) - (detailTxn.receivedAmount || 0))}`}
                    highlight
                  />
                )}
              <DetailRow
                label="Payment Method"
                value={getPaymentMethodLabel(detailTxn.paymentMethod)}
              />
              {getPaymentMethodLabel(detailTxn.paymentMethod) === "Split" && (
                <>
                  <DetailRow
                    label="Cash"
                    value={`₹${detailTxn.splitCash || 0}`}
                  />
                  <DetailRow
                    label="UPI"
                    value={`₹${detailTxn.splitUpi || 0}`}
                  />
                </>
              )}
              {detailTxn.driverName && (
                <DetailRow label="Driver" value={detailTxn.driverName} />
              )}
              {detailTxn.tractorName && (
                <DetailRow label="Tractor" value={detailTxn.tractorName} />
              )}
              {detailTxn.date && (
                <DetailRow label="Date" value={detailTxn.date} />
              )}
              {detailTxn.time && (
                <DetailRow label="Time" value={detailTxn.time} />
              )}
              {detailTxn.notes && (
                <DetailRow label="Notes" value={detailTxn.notes as string} />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value?: string | number;
  highlight?: boolean;
}) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">
        {label}
      </span>
      <span
        className={`text-sm font-semibold text-right ${
          highlight
            ? "text-green-700 dark:text-green-400"
            : "text-gray-800 dark:text-gray-200"
        }`}
      >
        {String(value)}
      </span>
    </div>
  );
}
