import {
  ArrowLeft,
  Menu,
  Package,
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

interface TractorAsset {
  tractorId: string;
  purchasePrice: number;
  purchaseDate: string;
  sold: boolean;
  soldPrice?: number;
  soldDate?: string;
}

interface Equipment {
  id: string;
  name: string;
  purchasePrice: number;
  purchaseDate: string;
  sold: boolean;
  soldPrice?: number;
  soldDate?: string;
}

export default function BalanceSheetPage({ actor, onOpenSidebar }: Props) {
  const { t, goBack, darkMode } = useApp();
  const [tractorCount, setTractorCount] = useState(0);
  const [tractors, setTractors] = useState<{ id: string; name: string }[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    Promise.all([actor.getAllTractors(), actor.getAllParties()]).then(
      ([fetchedTractors, fetchedParties]) => {
        setTractorCount(fetchedTractors.length);
        setTractors(
          fetchedTractors.map((tr) => ({
            id: tr.id.toString(),
            name: tr.name,
          })),
        );
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

  // Load tractor assets
  const tractorAssetsMap: Record<string, TractorAsset> = (() => {
    try {
      return JSON.parse(localStorage.getItem("ktp_tractor_assets") || "{}");
    } catch {
      return {};
    }
  })();

  // Load equipment assets
  const equipmentList: Equipment[] = (() => {
    try {
      return JSON.parse(localStorage.getItem("ktp_equipment_assets") || "[]");
    } catch {
      return [];
    }
  })();

  // Tractor asset calculations
  const tractorTotalPurchase = Object.values(tractorAssetsMap).reduce(
    (s, a) => s + (a.purchasePrice || 0),
    0,
  );
  const tractorTotalSold = Object.values(tractorAssetsMap)
    .filter((a) => a.sold)
    .reduce((s, a) => s + (a.soldPrice || 0), 0);
  const netTractorAssets = tractorTotalPurchase - tractorTotalSold;

  // Equipment asset calculations
  const equipmentTotalPurchase = equipmentList.reduce(
    (s, e) => s + (e.purchasePrice || 0),
    0,
  );
  const equipmentTotalSold = equipmentList
    .filter((e) => e.sold)
    .reduce((s, e) => s + (e.soldPrice || 0), 0);
  const netEquipmentAssets = equipmentTotalPurchase - equipmentTotalSold;

  const totalFixedAssets = netTractorAssets + netEquipmentAssets;

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
  const subBg = darkMode ? "bg-gray-700" : "bg-gray-50";

  const maxBar = Math.max(totalIncome, totalExpenses, 1);

  const getTractorName = (id: string) =>
    tractors.find((tr) => tr.id === id)?.name || `Tractor ${id}`;

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
        {/* ===== Fixed Assets Section ===== */}
        <div className={`rounded-xl border p-4 ${cardBg}`}>
          <h2 className={`font-bold text-base mb-3 ${secHeader}`}>
            🏗️ {(t as any).fixedAssets || "Fixed Assets"}
          </h2>

          {/* Summary card */}
          <div
            className={`rounded-lg p-3 mb-4 ${
              darkMode
                ? "bg-green-900/40 border border-green-700"
                : "bg-green-50 border border-green-200"
            }`}
          >
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {(t as any).totalFixedAssets || "Total Fixed Assets"}
            </p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
              ₹{totalFixedAssets.toLocaleString("en-IN")}
            </p>
            <div className="flex gap-4 mt-1 text-xs text-gray-500">
              <span>
                {(t as any).tractors || "Tractors"}: ₹
                {netTractorAssets.toLocaleString("en-IN")}
              </span>
              <span>
                {(t as any).equipment || "Equipment"}: ₹
                {netEquipmentAssets.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Tractor Assets */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Tractor size={16} className="text-green-600" />
              <h3 className="font-semibold text-sm">
                {(t as any).tractors || "Tractors"}
              </h3>
              <span
                className={`ml-auto text-xs font-bold ${
                  netTractorAssets >= 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                ₹{netTractorAssets.toLocaleString("en-IN")}
              </span>
            </div>
            {Object.keys(tractorAssetsMap).length === 0 ? (
              <p className="text-xs text-gray-400 py-2 text-center">
                {(t as any).noData || "No tractor asset data"}
              </p>
            ) : (
              <div className="space-y-2">
                {Object.values(tractorAssetsMap).map((asset, idx) => (
                  <div
                    key={asset.tractorId}
                    className={`rounded-lg p-2.5 text-sm ${subBg}`}
                    data-ocid={`balance_sheet.tractor.item.${idx + 1}`}
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {getTractorName(asset.tractorId)}
                      </span>
                      {asset.sold ? (
                        <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                          SOLD
                        </span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                          {(t as any).active || "Active"}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                      <div className="flex justify-between">
                        <span>
                          {(t as any).purchased || "Purchased"}:{" "}
                          {asset.purchaseDate || "-"}
                        </span>
                        <span className="font-medium">
                          ₹{(asset.purchasePrice || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                      {asset.sold && asset.soldPrice !== undefined && (
                        <div className="flex justify-between">
                          <span>
                            {(t as any).sold || "Sold"}: {asset.soldDate || "-"}
                          </span>
                          <span className="font-medium text-orange-600">
                            ₹{asset.soldPrice.toLocaleString("en-IN")}
                          </span>
                        </div>
                      )}
                      {asset.sold && asset.soldPrice !== undefined && (
                        <div
                          className={`flex justify-between font-semibold ${
                            asset.soldPrice >= asset.purchasePrice
                              ? "text-green-600"
                              : "text-red-500"
                          }`}
                        >
                          <span>{(t as any).gainLoss || "Net Gain/Loss"}</span>
                          <span>
                            {asset.soldPrice >= asset.purchasePrice ? "+" : "-"}
                            ₹
                            {Math.abs(
                              asset.soldPrice - asset.purchasePrice,
                            ).toLocaleString("en-IN")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Equipment Assets */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package size={16} className="text-blue-600" />
              <h3 className="font-semibold text-sm">
                {(t as any).equipment || "Equipment"}
              </h3>
              <span
                className={`ml-auto text-xs font-bold ${
                  netEquipmentAssets >= 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                ₹{netEquipmentAssets.toLocaleString("en-IN")}
              </span>
            </div>
            {equipmentList.length === 0 ? (
              <p className="text-xs text-gray-400 py-2 text-center">
                {(t as any).noData || "No equipment data"}
              </p>
            ) : (
              <div className="space-y-2">
                {equipmentList.map((eq, idx) => (
                  <div
                    key={eq.id}
                    className={`rounded-lg p-2.5 text-sm ${subBg}`}
                    data-ocid={`balance_sheet.equipment.item.${idx + 1}`}
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">{eq.name}</span>
                      {eq.sold ? (
                        <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                          SOLD
                        </span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                          {(t as any).active || "Active"}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                      <div className="flex justify-between">
                        <span>
                          {(t as any).purchased || "Purchased"}:{" "}
                          {eq.purchaseDate || "-"}
                        </span>
                        <span className="font-medium">
                          ₹{(eq.purchasePrice || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                      {eq.sold && eq.soldPrice !== undefined && (
                        <div className="flex justify-between">
                          <span>
                            {(t as any).sold || "Sold"}: {eq.soldDate || "-"}
                          </span>
                          <span className="font-medium text-orange-600">
                            ₹{eq.soldPrice.toLocaleString("en-IN")}
                          </span>
                        </div>
                      )}
                      {eq.sold && eq.soldPrice !== undefined && (
                        <div
                          className={`flex justify-between font-semibold ${
                            eq.soldPrice >= eq.purchasePrice
                              ? "text-green-600"
                              : "text-red-500"
                          }`}
                        >
                          <span>{(t as any).gainLoss || "Net Gain/Loss"}</span>
                          <span>
                            {eq.soldPrice >= eq.purchasePrice ? "+" : "-"}₹
                            {Math.abs(
                              eq.soldPrice - eq.purchasePrice,
                            ).toLocaleString("en-IN")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 1: Total Assets (tractors count) */}
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
                  className={`flex items-center justify-between p-2 rounded-lg ${subBg}`}
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
