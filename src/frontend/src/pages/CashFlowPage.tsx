import { ArrowLeft, Menu, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../App";
import type { backendInterface } from "../backend";
import { type CashFlowEntry, getCashFlowEntries } from "../lib/cashFlowUtils";

type Props = { actor: backendInterface; onOpenSidebar?: () => void };

export default function CashFlowPage({ actor: _actor, onOpenSidebar }: Props) {
  const { t, goBack, darkMode } = useApp();
  const [entries, setEntries] = useState<CashFlowEntry[]>([]);
  const [filter, setFilter] = useState<"all" | "in" | "out">("all");
  const [methodFilter, setMethodFilter] = useState<"all" | "cash" | "upi">(
    "all",
  );

  useEffect(() => {
    setEntries(getCashFlowEntries());
  }, []);

  const cashIn = entries
    .filter((e) => e.type === "in" && e.paymentMethod === "cash")
    .reduce((s, e) => s + e.amount, 0);

  const upiIn = entries
    .filter((e) => e.type === "in" && e.paymentMethod === "upi")
    .reduce((s, e) => s + e.amount, 0);

  const cashOut = entries
    .filter((e) => e.type === "out" && e.paymentMethod === "cash")
    .reduce((s, e) => s + e.amount, 0);

  const upiOut = entries
    .filter((e) => e.type === "out" && e.paymentMethod === "upi")
    .reduce((s, e) => s + e.amount, 0);

  const totalIn = cashIn + upiIn;
  const totalOut = cashOut + upiOut;
  const totalBalance = totalIn - totalOut;
  const cashBalance = cashIn - cashOut;
  const upiBalance = upiIn - upiOut;

  const displayed = entries.filter((e) => {
    if (filter !== "all" && e.type !== filter) return false;
    if (methodFilter !== "all" && e.paymentMethod !== methodFilter)
      return false;
    return true;
  });

  const darkBg = darkMode
    ? "bg-gray-900 text-white"
    : "bg-gray-50 text-gray-900";

  return (
    <div className={`min-h-screen flex flex-col ${darkBg}`}>
      {/* Header */}
      <header
        className={`flex items-center gap-3 px-4 py-3 shadow-sm sticky top-0 z-10 ${
          darkMode ? "bg-gray-800" : "bg-green-600"
        }`}
      >
        <button
          type="button"
          onClick={goBack}
          className="text-white p-1"
          data-ocid="cash_flow.link"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-white font-semibold text-lg flex-1">
          {(t as any).cashFlow || "Cash Flow"}
        </h1>
        {onOpenSidebar && (
          <button
            type="button"
            onClick={onOpenSidebar}
            className="text-white p-1"
          >
            <Menu size={22} />
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto pb-8">
        {/* Summary */}
        <div className="bg-green-600 p-4">
          <div className="text-white text-center mb-3">
            <p className="text-sm opacity-80">Total Balance</p>
            <p
              className={`text-3xl font-bold ${totalBalance >= 0 ? "text-white" : "text-red-200"}`}
            >
              ₹{Math.abs(totalBalance).toLocaleString("en-IN")}
              {totalBalance < 0 && " (−)"}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/20 rounded-xl p-3 text-center">
              <p className="text-white/80 text-xs">💵 Cash</p>
              <p
                className={`font-bold text-base ${cashBalance >= 0 ? "text-white" : "text-red-200"}`}
              >
                ₹{Math.abs(cashBalance).toLocaleString("en-IN")}
                {cashBalance < 0 && " (−)"}
              </p>
              <p className="text-white/60 text-xs">
                In: ₹{cashIn.toLocaleString("en-IN")}
              </p>
              <p className="text-white/60 text-xs">
                Out: ₹{cashOut.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="bg-white/20 rounded-xl p-3 text-center">
              <p className="text-white/80 text-xs">📱 UPI</p>
              <p
                className={`font-bold text-base ${upiBalance >= 0 ? "text-white" : "text-red-200"}`}
              >
                ₹{Math.abs(upiBalance).toLocaleString("en-IN")}
                {upiBalance < 0 && " (−)"}
              </p>
              <p className="text-white/60 text-xs">
                In: ₹{upiIn.toLocaleString("en-IN")}
              </p>
              <p className="text-white/60 text-xs">
                Out: ₹{upiOut.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="bg-white/20 rounded-xl p-3 text-center">
              <p className="text-white/80 text-xs">Total In</p>
              <p className="text-white font-bold text-base">
                ₹{totalIn.toLocaleString("en-IN")}
              </p>
              <p className="text-white/60 text-xs">
                Out: ₹{totalOut.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div
          className={`flex gap-2 flex-wrap p-3 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
        >
          {(["all", "in", "out"] as const).map((f) => (
            <button
              type="button"
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === f
                  ? "bg-green-600 text-white"
                  : darkMode
                    ? "bg-gray-700 text-gray-300"
                    : "bg-gray-100 text-gray-600"
              }`}
              data-ocid="cash_flow.tab"
            >
              {f === "all" ? "All" : f === "in" ? "In (+)" : "Out (−)"}
            </button>
          ))}
          <div className="w-px bg-gray-300" />
          {(["all", "cash", "upi"] as const).map((m) => (
            <button
              type="button"
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                methodFilter === m
                  ? "bg-blue-600 text-white"
                  : darkMode
                    ? "bg-gray-700 text-gray-300"
                    : "bg-gray-100 text-gray-600"
              }`}
              data-ocid="cash_flow.tab"
            >
              {m === "all" ? "All" : m === "cash" ? "💵 Cash" : "📱 UPI"}
            </button>
          ))}
        </div>

        {/* Entry List */}
        <div className="p-3 space-y-2">
          {displayed.length === 0 ? (
            <div
              className="text-center py-12 text-gray-400"
              data-ocid="cash_flow.empty_state"
            >
              <p className="text-4xl mb-2">📊</p>
              <p>{t.noData || "No entries found"}</p>
            </div>
          ) : (
            displayed.map((entry, idx) => (
              <div
                key={entry.id}
                className={`flex items-center gap-3 p-3 rounded-xl border ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
                data-ocid={`cash_flow.item.${idx + 1}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    entry.type === "in" ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  {entry.type === "in" ? (
                    <TrendingUp size={18} className="text-green-600" />
                  ) : (
                    <TrendingDown size={18} className="text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{entry.label}</p>
                  <p className="text-xs text-gray-500">
                    {entry.date} {entry.time}
                    <span
                      className={`ml-2 text-xs font-semibold px-1.5 py-0.5 rounded ${
                        entry.paymentMethod === "cash"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {entry.paymentMethod === "cash" ? "💵 Cash" : "📱 UPI"}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-bold ${
                      entry.type === "in" ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {entry.type === "in" ? "+" : "−"}₹
                    {entry.amount.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
