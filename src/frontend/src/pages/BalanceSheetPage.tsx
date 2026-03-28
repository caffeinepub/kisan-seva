import {
  ArrowLeft,
  Menu,
  Tractor,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../App";
import type { Party, backendInterface } from "../backend";

type Props = { actor: backendInterface; onOpenSidebar?: () => void };

interface SavedTx {
  id: string;
  receivedAmount?: number;
  amount?: number;
  txType?: string;
}

interface ExpenseEntry {
  id: string;
  date: string;
  category: string;
  amount: number;
}

export default function BalanceSheetPage({ actor, onOpenSidebar }: Props) {
  const { t, goBack, darkMode } = useApp();
  const [tractorCount, setTractorCount] = useState(0);
  const [parties, setParties] = useState<Party[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    Promise.all([actor.getAllTractors(), actor.getAllParties()]).then(
      ([tractors, fetchedParties]) => {
        setTractorCount(tractors.length);
        setParties(fetchedParties);
      },
    );

    const txRaw = localStorage.getItem("ktp_saved_transactions");
    const txList: SavedTx[] = txRaw ? JSON.parse(txRaw) : [];
    const income = txList.reduce(
      (s, tx) => s + (Number(tx.receivedAmount) || 0),
      0,
    );
    setTotalIncome(income);

    const expRaw = localStorage.getItem("ktp_expenses");
    const expList: ExpenseEntry[] = expRaw ? JSON.parse(expRaw) : [];
    const expenses = expList.reduce((s, e) => s + Number(e.amount), 0);
    setTotalExpenses(expenses);
  }, [actor]);

  const netProfit = totalIncome - totalExpenses;

  const udharMap: Record<string, number> = JSON.parse(
    localStorage.getItem("ktp_party_udhar") || "{}",
  );

  const partiesWithDue = parties
    .map((p) => ({
      ...p,
      due: (udharMap[p.id.toString()] || 0) + Number(p.creditBalance || 0),
    }))
    .filter((p) => p.due > 0)
    .sort((a, b) => b.due - a.due);

  const totalDues = partiesWithDue.reduce((s, p) => s + p.due, 0);

  const darkBg = darkMode
    ? "bg-gray-900 text-white"
    : "bg-gray-50 text-gray-900";
  const cardBg = darkMode
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-gray-200";
  const secHeader = darkMode ? "text-green-400" : "text-green-700";

  const maxBar = Math.max(totalIncome, totalExpenses, 1);

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
          data-ocid="balance_sheet.link"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-white font-semibold text-lg flex-1">
          {(t as any).balanceSheet || "Balance Sheet"}
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

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-8">
        {/* Section 1: Total Assets */}
        <div className={`rounded-xl border p-4 ${cardBg}`}>
          <h2 className={`font-bold text-base mb-3 ${secHeader}`}>
            🏦 {(t as any).totalAssets || "Total Assets"}
          </h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Tractor size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{tractorCount}</p>
              <p className="text-sm text-gray-500">
                {t.tractors || "Tractors"}
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Income vs Expenses */}
        <div className={`rounded-xl border p-4 ${cardBg}`}>
          <h2 className={`font-bold text-base mb-3 ${secHeader}`}>
            📊 {(t as any).totalIncome || "Income"} vs{" "}
            {(t as any).totalExpenses || "Expenses"}
          </h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-1">
                  <TrendingUp size={14} className="text-green-500" />
                  {(t as any).totalIncome || "Total Income"}
                </span>
                <span className="font-bold text-green-600">
                  ₹{totalIncome.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${(totalIncome / maxBar) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-1">
                  <TrendingDown size={14} className="text-red-500" />
                  {(t as any).totalExpenses || "Total Expenses"}
                </span>
                <span className="font-bold text-red-500">
                  ₹{totalExpenses.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all"
                  style={{ width: `${(totalExpenses / maxBar) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Net Profit/Loss */}
        <div
          className={`rounded-xl border p-4 ${
            netProfit >= 0
              ? darkMode
                ? "bg-green-900/40 border-green-700"
                : "bg-green-50 border-green-200"
              : darkMode
                ? "bg-red-900/40 border-red-700"
                : "bg-red-50 border-red-200"
          }`}
        >
          <h2
            className={`font-bold text-base mb-2 ${netProfit >= 0 ? "text-green-700" : "text-red-600"}`}
          >
            {netProfit >= 0
              ? `✅ ${(t as any).netProfit || "Net Profit"}`
              : `⚠️ ${(t as any).netLoss || "Net Loss"}`}
          </h2>
          <p
            className={`text-3xl font-bold ${
              netProfit >= 0 ? "text-green-600" : "text-red-500"
            }`}
          >
            {netProfit < 0 && "−"}₹{Math.abs(netProfit).toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ₹{totalIncome.toLocaleString()} − ₹{totalExpenses.toLocaleString()}
          </p>
        </div>

        {/* Section 4: Party-wise Dues */}
        <div className={`rounded-xl border p-4 ${cardBg}`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className={`font-bold text-base ${secHeader}`}>
              <Users size={16} className="inline mr-1" />
              {(t as any).partyDues || "Party Dues"}
            </h2>
            {totalDues > 0 && (
              <span className="text-sm font-bold text-red-500">
                ₹{totalDues.toLocaleString("en-IN")}
              </span>
            )}
          </div>
          {partiesWithDue.length === 0 ? (
            <p
              className="text-sm text-gray-400 text-center py-4"
              data-ocid="balance_sheet.empty_state"
            >
              {t.noPendingCredit || "No pending dues"}
            </p>
          ) : (
            <div className="space-y-2">
              {partiesWithDue.map((p, idx) => (
                <div
                  key={p.id.toString()}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    darkMode ? "bg-gray-700" : "bg-gray-50"
                  }`}
                  data-ocid={`balance_sheet.item.${idx + 1}`}
                >
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    {p.phone && (
                      <p className="text-xs text-gray-500">{p.phone}</p>
                    )}
                  </div>
                  <span className="text-red-500 font-bold text-sm">
                    ₹{p.due.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
