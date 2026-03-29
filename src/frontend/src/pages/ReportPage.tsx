import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Menu,
  Plus,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../App";
import {
  type Driver,
  type Expense,
  ExpenseCategory,
  type Party,
  type Payment,
  type Tractor,
  type backendInterface,
} from "../backend";
import {
  computeMonthSummary,
  computeMonthlyAttendance,
  getDriverSettings,
} from "../utils/driverAttendance";

type Props = {
  actor: backendInterface;
  onOpenSidebar?: () => void;
};

type SubView =
  | null
  | "partyStatement"
  | "sevaEarnings"
  | "byTractor"
  | "monthlySummary"
  | "driverReport"
  | "driverPerformance"
  | "driverWiseProfit"
  | "tractorWiseReport"
  | "tractorWiseProfit"
  | "serviceWiseReport";

type ExpenseFormType = "expense" | "salary";

function fmt12(dateMs: bigint) {
  return new Date(Number(dateMs)).toLocaleString("default", {
    hour12: true,
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface DriverReportTxn {
  driverId?: string;
  date?: string;
  hours?: number;
  minutes?: number;
  workType?: string;
  amount?: number;
}

function DriverReportView({
  drivers,
  transactions,
  onBack,
}: {
  drivers: Array<{ id: bigint; name: string }>;
  transactions: DriverReportTxn[];
  onBack: () => void;
}) {
  const { t } = useApp();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-800">
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b flex items-center gap-3 px-4 pt-4 pb-3">
        <button
          type="button"
          onClick={onBack}
          className="p-1"
          data-ocid="report.back.button"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <h1 className="font-bold text-base text-gray-900 dark:text-gray-100">
          {t.driverReport}
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-20">
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={prevMonth}
            className="p-2 rounded-lg border dark:border-gray-700"
          >
            <ChevronDown className="w-4 h-4 rotate-90" />
          </button>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {t.fullMonths[viewMonth]} {viewYear}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="p-2 rounded-lg border dark:border-gray-700"
          >
            <ChevronDown className="w-4 h-4 -rotate-90" />
          </button>
        </div>

        {drivers.length === 0 && (
          <p className="text-center text-gray-400 dark:text-gray-500 py-8">
            {t.noData}
          </p>
        )}

        {drivers.map((driver) => {
          const driverId = driver.id.toString();
          const settings = getDriverSettings(driverId);
          const driverTxns = transactions.filter((tx) => {
            if (!tx.driverId || tx.driverId !== driverId) return false;
            if (!tx.date) return false;
            const d = new Date(tx.date);
            return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
          });

          let totalHrs = 0;
          for (const tx of driverTxns) {
            totalHrs += (tx.hours || 0) + (tx.minutes || 0) / 60;
          }

          let estimatedPay = 0;
          if (settings) {
            if (settings.attendanceType === "hr") {
              estimatedPay = totalHrs * settings.hourlyRate;
            } else {
              const attendance = computeMonthlyAttendance(
                driverId,
                transactions,
                settings,
                viewYear,
                viewMonth,
              );
              const summary = computeMonthSummary(attendance, settings);
              estimatedPay = summary.estimatedPay;
            }
          }

          const isExpanded = expandedDriver === driverId;

          return (
            <div
              key={driverId}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden"
            >
              <button
                type="button"
                className="w-full flex items-center justify-between p-4"
                onClick={() => setExpandedDriver(isExpanded ? null : driverId)}
              >
                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {driver.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {driverTxns.length} txns · {totalHrs.toFixed(1)}{" "}
                    {t.totalHours}
                    {estimatedPay > 0 && ` · ₹${Math.round(estimatedPay)}`}
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>
              {isExpanded && (
                <div className="border-t dark:border-gray-700 divide-y dark:divide-gray-700">
                  {driverTxns.length === 0 && (
                    <p className="text-center text-gray-400 dark:text-gray-500 py-4 text-sm">
                      {t.noData}
                    </p>
                  )}
                  {driverTxns.map((tx, i) => (
                    <div
                      // biome-ignore lint/suspicious/noArrayIndexKey: index is stable for driver txns
                      key={`${driverId}-${i}`}
                      className="flex items-center justify-between px-4 py-2.5 text-sm"
                    >
                      <div>
                        <div className="text-gray-800 dark:text-gray-200">
                          {tx.workType || "-"}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {tx.date}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-700 dark:text-gray-300">
                          {tx.hours || 0}h {tx.minutes || 0}m
                        </div>
                        {tx.amount ? (
                          <div className="text-xs text-green-700 dark:text-green-400">
                            ₹{tx.amount}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ReportPage({ actor, onOpenSidebar }: Props) {
  const { t, setPage, goBack, darkMode: dm } = useApp();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [tractors, setTractors] = useState<Tractor[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [subView, setSubView] = useState<SubView>(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [expFormType, setExpFormType] = useState<ExpenseFormType>("expense");
  const [expTractorId, setExpTractorId] = useState("");
  const [expDriverId, setExpDriverId] = useState("");
  const [expCategory, setExpCategory] = useState<ExpenseCategory>(
    ExpenseCategory.diesel,
  );
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [expNotes, setExpNotes] = useState("");

  const load = async () => {
    const [p, ex, pa, tr, dr] = await Promise.all([
      actor.getAllPayments(),
      actor.getAllExpenses(),
      actor.getAllParties(),
      actor.getAllTractors(),
      actor.getAllDrivers(),
    ]);
    setPayments(p.sort((a, b) => Number(b.date - a.date)));
    setExpenses(ex.sort((a, b) => Number(b.date - a.date)));
    setParties(pa);
    setTractors(tr);
    setDrivers(dr);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: actor is stable
  useEffect(() => {
    load();
  }, [actor]);

  const now = new Date();
  const thisMonthPayments = payments.filter((p) => {
    const d = new Date(Number(p.date));
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });
  const thisMonthExpenses = expenses.filter((e) => {
    const d = new Date(Number(e.date));
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });

  const monthEarnings = thisMonthPayments.reduce(
    (s, p) => s + Number(p.amount),
    0,
  );
  const monthExpensesTotal = thisMonthExpenses.reduce(
    (s, e) => s + Number(e.amount),
    0,
  );
  const monthNet = monthEarnings - monthExpensesTotal;
  const monthWorkCount = thisMonthPayments.length;

  const getPartyName = (id: bigint) =>
    parties.find((p) => p.id === id)?.name || null;

  const resetExpenseForm = () => {
    setExpFormType("expense");
    setExpTractorId("");
    setExpDriverId("");
    setExpCategory(ExpenseCategory.diesel);
    setExpAmount("");
    setExpDate(new Date().toISOString().slice(0, 10));
    setExpNotes("");
  };

  const handleSaveExpense = async () => {
    if (!expAmount) {
      toast.error(t.amountRequiredMsg);
      return;
    }
    setSaving(true);
    try {
      const dateMs = BigInt(new Date(expDate).getTime());
      const amtBig = BigInt(expAmount);

      if (expFormType === "salary") {
        const driver = drivers.find((d) => d.id.toString() === expDriverId);
        const driverName = driver ? driver.name : "Driver";
        const dId = expDriverId ? BigInt(expDriverId) : 0n;
        await actor.createExpense(
          0n,
          dId,
          ExpenseCategory.driverPayment,
          amtBig,
          dateMs,
          `Driver Salary: ${driverName}${expNotes ? ` | ${expNotes}` : ""}`,
        );
      } else {
        const tId = expTractorId ? BigInt(expTractorId) : BigInt(0);
        await actor.createExpense(
          tId,
          0n,
          expCategory,
          amtBig,
          dateMs,
          expNotes,
        );
      }

      toast.success(t.expenseSavedMsg);
      resetExpenseForm();
      setShowExpenseForm(false);
      await load();
    } catch {
      toast.error(t.errorSavingMsg);
    }
    setSaving(false);
  };

  // ── Expense Form ──────────────────────────────────────────────────────────
  if (showExpenseForm) {
    return (
      <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-800">
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b flex items-center justify-between px-4 pt-4 pb-3">
          <button
            type="button"
            onClick={() => setShowExpenseForm(false)}
            className="p-1"
            data-ocid="expense.back.button"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="font-bold text-base text-gray-900 dark:text-gray-100">
            {t.newExpenseAdd}
          </h1>
          <div className="w-7" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-20">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setExpFormType("expense")}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                expFormType === "expense"
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 dark:text-gray-500"
              }`}
              data-ocid="expense.type_expense.toggle"
            >
              {t.expenseTypeLabel}
            </button>
            <button
              type="button"
              onClick={() => setExpFormType("salary")}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                expFormType === "salary"
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 dark:text-gray-500"
              }`}
              data-ocid="expense.type_salary.toggle"
            >
              {t.salaryTypeLabel}
            </button>
          </div>

          {expFormType === "expense" ? (
            <>
              <div>
                <Label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
                  {t.tractorRequired}
                </Label>
                <Select value={expTractorId} onValueChange={setExpTractorId}>
                  <SelectTrigger
                    className="bg-white dark:bg-gray-900"
                    data-ocid="expense.tractor.select"
                  >
                    <SelectValue placeholder={t.selectTractor} />
                  </SelectTrigger>
                  <SelectContent>
                    {tractors.map((tr) => (
                      <SelectItem
                        key={tr.id.toString()}
                        value={tr.id.toString()}
                      >
                        {tr.name} ({tr.model})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
                  {t.expenseTypeCategory}
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { val: ExpenseCategory.diesel, label: `⛽ ${t.diesel}` },
                      {
                        val: ExpenseCategory.maintenance,
                        label: `🔧 ${t.maintenance}`,
                      },
                      { val: ExpenseCategory.other, label: `📦 ${t.other}` },
                    ] as const
                  ).map(({ val, label }) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setExpCategory(val)}
                      className={`py-2.5 rounded-xl text-sm font-semibold transition-all border-2 ${
                        expCategory === val
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700"
                      }`}
                      data-ocid={`expense.${val}.toggle`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div>
              <Label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
                {t.drivers}
              </Label>
              <Select value={expDriverId} onValueChange={setExpDriverId}>
                <SelectTrigger
                  className="bg-white dark:bg-gray-900"
                  data-ocid="expense.driver.select"
                >
                  <SelectValue placeholder={t.selectDriver} />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((dr) => (
                    <SelectItem key={dr.id.toString()} value={dr.id.toString()}>
                      {dr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
              {t.amountRequired2}
            </Label>
            <Input
              type="number"
              value={expAmount}
              onChange={(e) => setExpAmount(e.target.value)}
              placeholder="0"
              className="bg-white dark:bg-gray-900"
              data-ocid="expense.amount.input"
            />
          </div>
          <div>
            <Label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
              {t.date}
            </Label>
            <input
              type="date"
              value={expDate}
              onChange={(e) => setExpDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900"
              data-ocid="expense.date.input"
            />
          </div>
          <div>
            <Label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
              {t.optionalNotes}
            </Label>
            <Input
              value={expNotes}
              onChange={(e) => setExpNotes(e.target.value)}
              placeholder={t.notes}
              className="bg-white dark:bg-gray-900"
              data-ocid="expense.notes.input"
            />
          </div>
          <Button
            onClick={handleSaveExpense}
            disabled={saving}
            className="w-full py-4 text-base font-bold bg-red-600 hover:bg-red-700 text-white rounded-2xl mt-2"
            data-ocid="expense.save.submit_button"
          >
            {saving ? t.savingText : t.saveButton}
          </Button>
        </div>
      </div>
    );
  }

  // ── Sub Views ─────────────────────────────────────────────────────────────
  if (subView === "partyStatement") {
    const grouped: Record<string, { name: string; items: Payment[] }> = {};
    for (const p of payments) {
      const pName = getPartyName(p.bookingId) || t.cashEntryLabel;
      const key = p.bookingId.toString();
      if (!grouped[key]) grouped[key] = { name: pName, items: [] };
      grouped[key].items.push(p);
    }
    return (
      <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-800">
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b flex items-center gap-3 px-4 pt-4 pb-3">
          <button
            type="button"
            onClick={() => setSubView(null)}
            className="p-1"
            data-ocid="report.back.button"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="font-bold text-base text-gray-900 dark:text-gray-100">
            {t.partyStatement}
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto pb-8">
          {Object.values(grouped).length === 0 && (
            <p
              className="text-gray-400 dark:text-gray-500 text-center py-12"
              data-ocid="report.partystatement.empty_state"
            >
              {t.noTransactions}
            </p>
          )}
          {Object.values(grouped).map((g) => (
            <div key={g.name}>
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-gray-500">
                {g.name}
              </div>
              {g.items.map((p, idx) => (
                <div
                  key={p.id.toString()}
                  className="bg-white dark:bg-gray-900 px-4 py-3 border-b flex items-center justify-between"
                  data-ocid={`report.partystatement.item.${idx + 1}`}
                >
                  <div>
                    <span className="text-xs font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mb-1 inline-block">{`#TXN-${p.id.toString().padStart(4, "0")}`}</span>
                    <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                      {fmt12(p.date)}
                    </div>
                    {p.notes && (
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {p.notes}
                      </div>
                    )}
                  </div>
                  <span className="font-bold text-green-700">
                    ₹{p.amount.toString()}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (subView === "sevaEarnings") {
    const grouped: Record<string, number> = {};
    for (const p of payments) {
      const key = p.notes?.trim() || t.other;
      grouped[key] = (grouped[key] || 0) + Number(p.amount);
    }
    return (
      <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-800">
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b flex items-center gap-3 px-4 pt-4 pb-3">
          <button
            type="button"
            onClick={() => setSubView(null)}
            className="p-1"
            data-ocid="report.back.button"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="font-bold text-base text-gray-900 dark:text-gray-100">
            {t.sevaEarnings}
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto pb-8">
          {Object.keys(grouped).length === 0 && (
            <p
              className="text-gray-400 dark:text-gray-500 text-center py-12"
              data-ocid="report.sevaearnings.empty_state"
            >
              {t.noTransactions}
            </p>
          )}
          {Object.entries(grouped).map(([service, total], idx) => (
            <div
              key={service}
              className="bg-white dark:bg-gray-900 px-4 py-4 border-b flex items-center justify-between"
              data-ocid={`report.sevaearnings.item.${idx + 1}`}
            >
              <div className="flex items-center gap-3">
                <Star className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span className="text-gray-800 dark:text-gray-200 font-medium">
                  {service}
                </span>
              </div>
              <span className="font-bold text-green-700">
                ₹{total.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (subView === "byTractor") {
    const tractorData: Record<string, { name: string; expense: number }> = {};
    for (const tr of tractors) {
      tractorData[tr.id.toString()] = { name: tr.name, expense: 0 };
    }
    for (const e of expenses) {
      const key = e.tractorId.toString();
      if (!tractorData[key]) tractorData[key] = { name: key, expense: 0 };
      tractorData[key].expense += Number(e.amount);
    }
    return (
      <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-800">
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b flex items-center gap-3 px-4 pt-4 pb-3">
          <button
            type="button"
            onClick={() => setSubView(null)}
            className="p-1"
            data-ocid="report.back.button"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="font-bold text-base text-gray-900 dark:text-gray-100">
            {t.byTractor}
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto pb-8">
          {Object.values(tractorData).filter((v) => v.expense > 0).length ===
            0 && (
            <p
              className="text-gray-400 dark:text-gray-500 text-center py-12"
              data-ocid="report.bytractor.empty_state"
            >
              {t.noData}
            </p>
          )}
          {Object.entries(tractorData)
            .filter(([, v]) => v.expense > 0)
            .map(([key, v], idx) => (
              <div
                key={key}
                className="bg-white dark:bg-gray-900 px-4 py-4 border-b flex items-center justify-between"
                data-ocid={`report.bytractor.item.${idx + 1}`}
              >
                <div className="flex items-center gap-3">
                  <Star className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                    🚜 {v.name}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-600">
                    ₹{v.expense.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {t.expenseLabel}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  if (subView === "monthlySummary") {
    return (
      <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-800">
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b flex items-center gap-3 px-4 pt-4 pb-3">
          <button
            type="button"
            onClick={() => setSubView(null)}
            className="p-1"
            data-ocid="report.back.button"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="font-bold text-base text-gray-900 dark:text-gray-100">
            {t.monthlySummary}
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-20">
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5 flex flex-col gap-3"
            data-ocid="report.monthly.card"
          >
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">
                {t.incomeLabel}
              </span>
              <span className="font-bold text-green-700 text-lg">
                ₹{monthEarnings.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">
                {t.outcomeLabel}
              </span>
              <span className="font-bold text-red-600 text-lg">
                ₹{monthExpensesTotal.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">
                {t.profitLabel}
              </span>
              <span
                className={`font-bold text-lg ${monthNet >= 0 ? "text-green-700" : "text-red-600"}`}
              >
                ₹{monthNet.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">
                {t.workLabel}
              </span>
              <span className="font-bold text-gray-800 dark:text-gray-200 text-lg">
                {monthWorkCount}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowExpenseForm(true)}
            className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-xl font-semibold"
            data-ocid="report.add_expense.primary_button"
          >
            <Plus className="w-4 h-4" /> {t.addExpenseBtn} {t.expenseLabel}
          </button>
        </div>
      </div>
    );
  }

  if (subView === "driverReport") {
    // Read transactions from localStorage
    const savedTxns: Array<{
      driverId?: string;
      date?: string;
      hours?: number;
      minutes?: number;
      workType?: string;
      amount?: number;
    }> = (() => {
      try {
        return JSON.parse(
          localStorage.getItem("ktp_saved_transactions") || "[]",
        );
      } catch {
        return [];
      }
    })();

    return (
      <DriverReportView
        drivers={drivers}
        transactions={savedTxns}
        onBack={() => setSubView(null)}
      />
    );
  }

  // ── Helper: Date Range Filter ─────────────────────────────────────────────
  type DateFilter = "thisMonth" | "thisYear" | "custom";

  function DateRangeFilter({
    filter,
    setFilter,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    darkMode,
  }: {
    filter: DateFilter;
    setFilter: (f: DateFilter) => void;
    fromDate: string;
    setFromDate: (d: string) => void;
    toDate: string;
    setToDate: (d: string) => void;
    darkMode: boolean;
  }) {
    const labels: Record<DateFilter, string> = {
      thisMonth: (t as any).thisMonthFilter || "This Month",
      thisYear: (t as any).thisYearFilter || "This Year",
      custom: (t as any).customRangeFilter || "Custom",
    };
    return (
      <div
        className={`flex flex-wrap gap-2 p-3 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        {(["thisMonth", "thisYear", "custom"] as DateFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === f
                ? "bg-green-600 text-white"
                : darkMode
                  ? "bg-gray-700 text-gray-300"
                  : "bg-gray-100 text-gray-600"
            }`}
          >
            {labels[f]}
          </button>
        ))}
        {filter === "custom" && (
          <div className="flex gap-2 w-full mt-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className={`flex-1 border rounded px-2 py-1 text-sm ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white"}`}
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className={`flex-1 border rounded px-2 py-1 text-sm ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white"}`}
            />
          </div>
        )}
      </div>
    );
  }

  function filterTxnsByDate(
    txns: any[],
    filter: DateFilter,
    fromDate: string,
    toDate: string,
  ): any[] {
    const now = new Date();
    return txns.filter((tx) => {
      if (!tx.date) return false;
      const d = new Date(tx.date);
      if (filter === "thisMonth")
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      if (filter === "thisYear") return d.getFullYear() === now.getFullYear();
      if (filter === "custom") {
        if (fromDate && d < new Date(fromDate)) return false;
        if (toDate && d > new Date(toDate)) return false;
      }
      return true;
    });
  }

  function filterExpensesByDate(
    exps: Expense[],
    filter: DateFilter,
    fromDate: string,
    toDate: string,
  ): Expense[] {
    const now = new Date();
    return exps.filter((e) => {
      const d = new Date(Number(e.date));
      if (filter === "thisMonth")
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      if (filter === "thisYear") return d.getFullYear() === now.getFullYear();
      if (filter === "custom") {
        if (fromDate && d < new Date(fromDate)) return false;
        if (toDate && d > new Date(toDate)) return false;
      }
      return true;
    });
  }

  const getLocalTxns = () => {
    try {
      return JSON.parse(localStorage.getItem("ktp_saved_transactions") || "[]");
    } catch {
      return [];
    }
  };

  // ── Sub View: Driver Performance ──────────────────────────────────────────
  if (subView === "driverPerformance") {
    function DriverPerformanceView() {
      const [dpFilter, setDpFilter] = useState<DateFilter>("thisMonth");
      const [dpFrom, setDpFrom] = useState("");
      const [dpTo, setDpTo] = useState("");
      const allTxns = getLocalTxns();
      const filteredTxns = filterTxnsByDate(allTxns, dpFilter, dpFrom, dpTo);

      return (
        <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-800">
          <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b flex items-center gap-3 px-4 pt-4 pb-3">
            <button
              type="button"
              onClick={() => setSubView(null)}
              className="p-1"
              data-ocid="report.back.button"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="font-bold text-base text-gray-900 dark:text-gray-100">
              {(t as any).driverPerformanceReport || "Driver Performance"}
            </h1>
          </div>
          <DateRangeFilter
            filter={dpFilter}
            setFilter={setDpFilter}
            fromDate={dpFrom}
            setFromDate={setDpFrom}
            toDate={dpTo}
            setToDate={setDpTo}
            darkMode={dm}
          />
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-20">
            {drivers.length === 0 && (
              <p
                className="text-center text-gray-400 py-12"
                data-ocid="report.driverperf.empty_state"
              >
                {t.noData}
              </p>
            )}
            {drivers.map((driver, idx) => {
              const driverId = driver.id.toString();
              const driverTxns = filteredTxns.filter(
                (tx: { driverId?: string }) => tx.driverId === driverId,
              );
              let totalHrs = 0;
              let totalRevenue = 0;
              for (const tx of driverTxns) {
                totalHrs +=
                  ((tx as { hours?: number }).hours || 0) +
                  ((tx as { minutes?: number }).minutes || 0) / 60;
                totalRevenue += (tx as { amount?: number }).amount || 0;
              }
              const settings = getDriverSettings(driverId);
              let presentCnt = 0;
              let halfCnt = 0;
              let absentCnt = 0;
              if (settings) {
                const now2 = new Date();
                const attendance = computeMonthlyAttendance(
                  driverId,
                  filteredTxns,
                  settings,
                  now2.getFullYear(),
                  now2.getMonth(),
                );
                for (const day of Object.values(attendance)) {
                  const s = day as { status: string };
                  if (s.status === "present") presentCnt++;
                  else if (s.status === "halfDay") halfCnt++;
                  else if (s.status === "absent") absentCnt++;
                }
              }
              return (
                <div
                  key={driverId}
                  className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-4"
                  data-ocid={`report.driverperf.item.${idx + 1}`}
                >
                  <div className="font-bold text-gray-900 dark:text-gray-100 mb-3">
                    🚗 {driver.name}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-2">
                      <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                        {driverTxns.length}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(t as any).totalTransactions || "Transactions"}
                      </div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-2">
                      <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                        {totalHrs.toFixed(1)}h
                      </div>
                      <div className="text-xs text-gray-500">
                        {t.totalHours}
                      </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-2">
                      <div className="text-lg font-bold text-green-700 dark:text-green-300">
                        ₹{totalRevenue.toLocaleString("en-IN")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(t as any).revenueGenerated || "Revenue"}
                      </div>
                    </div>
                  </div>
                  {settings && (
                    <div className="grid grid-cols-3 gap-2 text-center mt-2">
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-2">
                        <div className="text-base font-bold text-green-600">
                          {presentCnt}
                        </div>
                        <div className="text-xs text-gray-500">
                          {(t as any).presentCount || "Present"}
                        </div>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-2">
                        <div className="text-base font-bold text-yellow-600">
                          {halfCnt}
                        </div>
                        <div className="text-xs text-gray-500">
                          {(t as any).halfDayCount || "Half Day"}
                        </div>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-2">
                        <div className="text-base font-bold text-red-600">
                          {absentCnt}
                        </div>
                        <div className="text-xs text-gray-500">
                          {(t as any).absentCount || "Absent"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return <DriverPerformanceView />;
  }

  // ── Sub View: Driver Wise Profit ──────────────────────────────────────────
  if (subView === "driverWiseProfit") {
    function DriverWiseProfitView() {
      const [dpFilter, setDpFilter] = useState<DateFilter>("thisMonth");
      const [dpFrom, setDpFrom] = useState("");
      const [dpTo, setDpTo] = useState("");
      const allTxns = getLocalTxns();
      const filteredTxns = filterTxnsByDate(allTxns, dpFilter, dpFrom, dpTo);
      const filteredExpenses = filterExpensesByDate(
        expenses,
        dpFilter,
        dpFrom,
        dpTo,
      );

      return (
        <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-800">
          <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b flex items-center gap-3 px-4 pt-4 pb-3">
            <button
              type="button"
              onClick={() => setSubView(null)}
              className="p-1"
              data-ocid="report.back.button"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="font-bold text-base text-gray-900 dark:text-gray-100">
              {(t as any).driverWiseProfit || "Driver Profit"}
            </h1>
          </div>
          <DateRangeFilter
            filter={dpFilter}
            setFilter={setDpFilter}
            fromDate={dpFrom}
            setFromDate={setDpFrom}
            toDate={dpTo}
            setToDate={setDpTo}
            darkMode={dm}
          />
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-20">
            {drivers.length === 0 && (
              <p
                className="text-center text-gray-400 py-12"
                data-ocid="report.driverprofit.empty_state"
              >
                {t.noData}
              </p>
            )}
            {drivers.map((driver, idx) => {
              const driverId = driver.id.toString();
              const revenue = filteredTxns
                .filter((tx: any) => tx.driverId === driverId)
                .reduce(
                  (s: number, tx: { amount?: number }) => s + (tx.amount || 0),
                  0,
                );
              const payout = filteredExpenses
                .filter((e) => e.driverId.toString() === driverId)
                .reduce((s, e) => s + Number(e.amount), 0);
              const netProfit = revenue - payout;
              return (
                <div
                  key={driverId}
                  className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-4"
                  data-ocid={`report.driverprofit.item.${idx + 1}`}
                >
                  <div className="font-bold text-gray-900 dark:text-gray-100 mb-3">
                    🚗 {driver.name}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-2">
                      <div className="text-lg font-bold text-green-700 dark:text-green-300">
                        ₹{revenue.toLocaleString("en-IN")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(t as any).revenueGenerated || "Revenue"}
                      </div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/30 rounded-xl p-2">
                      <div className="text-lg font-bold text-red-600 dark:text-red-300">
                        ₹{payout.toLocaleString("en-IN")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(t as any).salaryPayout || "Salary"}
                      </div>
                    </div>
                    <div
                      className={`rounded-xl p-2 ${netProfit >= 0 ? "bg-blue-50 dark:bg-blue-900/30" : "bg-orange-50 dark:bg-orange-900/30"}`}
                    >
                      <div
                        className={`text-lg font-bold ${netProfit >= 0 ? "text-blue-700 dark:text-blue-300" : "text-orange-600 dark:text-orange-300"}`}
                      >
                        {netProfit < 0 ? "−" : ""}₹
                        {Math.abs(netProfit).toLocaleString("en-IN")}
                      </div>
                      <div className="text-xs text-gray-500">{t.netProfit}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return <DriverWiseProfitView />;
  }

  // ── Sub View: Tractor Wise Report ─────────────────────────────────────────
  if (subView === "tractorWiseReport") {
    function TractorWiseReportView() {
      const [tFilter, setTFilter] = useState<DateFilter>("thisMonth");
      const [tFrom, setTFrom] = useState("");
      const [tTo, setTTo] = useState("");
      const allTxns = getLocalTxns();
      const filteredTxns = filterTxnsByDate(allTxns, tFilter, tFrom, tTo);

      const tractorMap: Record<
        string,
        { name: string; count: number; hours: number; revenue: number }
      > = {};
      for (const tr of tractors) {
        tractorMap[tr.id.toString()] = {
          name: tr.name,
          count: 0,
          hours: 0,
          revenue: 0,
        };
      }
      for (const tx of filteredTxns) {
        const tid = (tx as { tractorId?: string }).tractorId;
        if (!tid) continue;
        if (!tractorMap[tid])
          tractorMap[tid] = {
            name: (tx as { tractorName?: string }).tractorName || tid,
            count: 0,
            hours: 0,
            revenue: 0,
          };
        tractorMap[tid].count++;
        tractorMap[tid].hours +=
          ((tx as { hours?: number }).hours || 0) +
          ((tx as { minutes?: number }).minutes || 0) / 60;
        tractorMap[tid].revenue += (tx as { amount?: number }).amount || 0;
      }

      return (
        <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-800">
          <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b flex items-center gap-3 px-4 pt-4 pb-3">
            <button
              type="button"
              onClick={() => setSubView(null)}
              className="p-1"
              data-ocid="report.back.button"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="font-bold text-base text-gray-900 dark:text-gray-100">
              {(t as any).tractorWiseReport || "Tractor Report"}
            </h1>
          </div>
          <DateRangeFilter
            filter={tFilter}
            setFilter={setTFilter}
            fromDate={tFrom}
            setFromDate={setTFrom}
            toDate={tTo}
            setToDate={setTTo}
            darkMode={dm}
          />
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-20">
            {Object.keys(tractorMap).length === 0 && (
              <p
                className="text-center text-gray-400 py-12"
                data-ocid="report.tractorreport.empty_state"
              >
                {t.noData}
              </p>
            )}
            {Object.entries(tractorMap).map(([tid, v], idx) => (
              <div
                key={tid}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-4"
                data-ocid={`report.tractorreport.item.${idx + 1}`}
              >
                <div className="font-bold text-gray-900 dark:text-gray-100 mb-3">
                  🚜 {v.name}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-2">
                    <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                      {v.count}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(t as any).totalTransactions || "Transactions"}
                    </div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-2">
                    <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                      {v.hours.toFixed(1)}h
                    </div>
                    <div className="text-xs text-gray-500">{t.totalHours}</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-2">
                    <div className="text-lg font-bold text-green-700 dark:text-green-300">
                      ₹{v.revenue.toLocaleString("en-IN")}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(t as any).revenueGenerated || "Revenue"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return <TractorWiseReportView />;
  }

  // ── Sub View: Tractor Wise Profit ─────────────────────────────────────────
  if (subView === "tractorWiseProfit") {
    function TractorWiseProfitView() {
      const [tFilter, setTFilter] = useState<DateFilter>("thisMonth");
      const [tFrom, setTFrom] = useState("");
      const [tTo, setTTo] = useState("");
      const allTxns = getLocalTxns();
      const filteredTxns = filterTxnsByDate(allTxns, tFilter, tFrom, tTo);
      const filteredExpenses = filterExpensesByDate(
        expenses,
        tFilter,
        tFrom,
        tTo,
      );

      return (
        <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-800">
          <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b flex items-center gap-3 px-4 pt-4 pb-3">
            <button
              type="button"
              onClick={() => setSubView(null)}
              className="p-1"
              data-ocid="report.back.button"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="font-bold text-base text-gray-900 dark:text-gray-100">
              {(t as any).tractorWiseProfit || "Tractor Profit"}
            </h1>
          </div>
          <DateRangeFilter
            filter={tFilter}
            setFilter={setTFilter}
            fromDate={tFrom}
            setFromDate={setTFrom}
            toDate={tTo}
            setToDate={setTTo}
            darkMode={dm}
          />
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-20">
            {tractors.length === 0 && (
              <p
                className="text-center text-gray-400 py-12"
                data-ocid="report.tractorprofit.empty_state"
              >
                {t.noData}
              </p>
            )}
            {tractors.map((tr, idx) => {
              const tid = tr.id.toString();
              const revenue = filteredTxns
                .filter((tx: any) => tx.tractorId === tid)
                .reduce(
                  (s: number, tx: { amount?: number }) => s + (tx.amount || 0),
                  0,
                );
              const maintenance = filteredExpenses
                .filter((e) => e.tractorId.toString() === tid)
                .reduce((s, e) => s + Number(e.amount), 0);
              const netProfit = revenue - maintenance;
              return (
                <div
                  key={tid}
                  className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-4"
                  data-ocid={`report.tractorprofit.item.${idx + 1}`}
                >
                  <div className="font-bold text-gray-900 dark:text-gray-100 mb-3">
                    🚜 {tr.name}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-2">
                      <div className="text-lg font-bold text-green-700 dark:text-green-300">
                        ₹{revenue.toLocaleString("en-IN")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(t as any).revenueGenerated || "Revenue"}
                      </div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/30 rounded-xl p-2">
                      <div className="text-lg font-bold text-red-600 dark:text-red-300">
                        ₹{maintenance.toLocaleString("en-IN")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(t as any).maintenanceCost || "Maintenance"}
                      </div>
                    </div>
                    <div
                      className={`rounded-xl p-2 ${netProfit >= 0 ? "bg-blue-50 dark:bg-blue-900/30" : "bg-orange-50 dark:bg-orange-900/30"}`}
                    >
                      <div
                        className={`text-lg font-bold ${netProfit >= 0 ? "text-blue-700 dark:text-blue-300" : "text-orange-600 dark:text-orange-300"}`}
                      >
                        {netProfit < 0 ? "−" : ""}₹
                        {Math.abs(netProfit).toLocaleString("en-IN")}
                      </div>
                      <div className="text-xs text-gray-500">{t.netProfit}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return <TractorWiseProfitView />;
  }

  // ── Sub View: Service Wise Report ─────────────────────────────────────────
  if (subView === "serviceWiseReport") {
    function ServiceWiseReportView() {
      const [sFilter, setSFilter] = useState<DateFilter>("thisMonth");
      const [sFrom, setSFrom] = useState("");
      const [sTo, setSTo] = useState("");
      const allTxns = getLocalTxns();
      const filteredTxns = filterTxnsByDate(allTxns, sFilter, sFrom, sTo);

      const serviceMap: Record<
        string,
        { count: number; hours: number; amount: number }
      > = {};
      for (const tx of filteredTxns) {
        const svc = (tx as { workType?: string }).workType || t.other;
        if (!serviceMap[svc])
          serviceMap[svc] = { count: 0, hours: 0, amount: 0 };
        serviceMap[svc].count++;
        serviceMap[svc].hours +=
          ((tx as { hours?: number }).hours || 0) +
          ((tx as { minutes?: number }).minutes || 0) / 60;
        serviceMap[svc].amount += (tx as { amount?: number }).amount || 0;
      }

      return (
        <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-800">
          <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b flex items-center gap-3 px-4 pt-4 pb-3">
            <button
              type="button"
              onClick={() => setSubView(null)}
              className="p-1"
              data-ocid="report.back.button"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="font-bold text-base text-gray-900 dark:text-gray-100">
              {(t as any).serviceWiseReport || "Service Report"}
            </h1>
          </div>
          <DateRangeFilter
            filter={sFilter}
            setFilter={setSFilter}
            fromDate={sFrom}
            setFromDate={setSFrom}
            toDate={sTo}
            setToDate={setSTo}
            darkMode={dm}
          />
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-20">
            {Object.keys(serviceMap).length === 0 && (
              <p
                className="text-center text-gray-400 py-12"
                data-ocid="report.servicereport.empty_state"
              >
                {t.noData}
              </p>
            )}
            {Object.entries(serviceMap).map(([svc, v], idx) => (
              <div
                key={svc}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-4"
                data-ocid={`report.servicereport.item.${idx + 1}`}
              >
                <div className="font-bold text-gray-900 dark:text-gray-100 mb-3">
                  ⚙️ {svc}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-2">
                    <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                      {v.count}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(t as any).totalTransactions || "Transactions"}
                    </div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-2">
                    <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                      {v.hours.toFixed(1)}h
                    </div>
                    <div className="text-xs text-gray-500">{t.totalHours}</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-2">
                    <div className="text-lg font-bold text-green-700 dark:text-green-300">
                      ₹{v.amount.toLocaleString("en-IN")}
                    </div>
                    <div className="text-xs text-gray-500">{t.totalAmount}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return <ServiceWiseReportView />;
  }

  const handleDownloadReportPdf = () => {
    const totalIncome = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const totalExpenses = expenses.reduce(
      (s, e) => s + Number(e.amount || 0),
      0,
    );
    const getPartyName = (id: string) => {
      if (id === "cash") return "Cash";
      return parties.find((p) => p.id.toString() === id)?.name || id;
    };

    const rows = payments
      .slice()
      .reverse()
      .map(
        (p) => `
    <tr>
      <td>${(p as any).txNumber || ""}</td>
      <td>${getPartyName(String((p as any).partyId || ""))}</td>
      <td>${new Date(Number(p.date || 0)).toLocaleDateString()}</td>
      <td style="text-align:right">₹${p.amount || 0}</td>
      <td style="text-align:right;color:#16a34a">₹${(p as any).receivedAmount || 0}</td>
      <td style="text-align:right;color:${(Number(p.amount || 0) - Number((p as any).receivedAmount || 0)) > 0 ? "#dc2626" : "#16a34a"}">₹${Math.max(0, Number(p.amount || 0) - Number((p as any).receivedAmount || 0))}</td>
    </tr>`,
      )
      .join("");

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Kisan Seva - Report</title>
<style>
  body { font-family: Arial, sans-serif; margin: 20px; color: #222; font-size: 12px; }
  h2 { color: #15803d; margin-bottom: 4px; }
  .summary { display: flex; gap: 20px; margin: 12px 0; flex-wrap: wrap; }
  .card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 16px; min-width: 120px; }
  .card .label { color: #6b7280; font-size: 11px; }
  .card .val { font-size: 16px; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th { background: #15803d; color: white; padding: 8px 6px; text-align: left; font-size: 11px; }
  td { padding: 6px; border-bottom: 1px solid #f3f4f6; }
  tr:nth-child(even) { background: #f9fafb; }
  .footer { text-align: center; font-size: 10px; color: #9ca3af; margin-top: 20px; }
  @media print { body { margin: 10px; } }
</style>
</head>
<body>
<h2>🌾 Kisan Seva — Transaction Report</h2>
<p style="color:#6b7280">Generated: ${new Date().toLocaleString()}</p>
<div class="summary">
  <div class="card"><div class="label">Total Income</div><div class="val" style="color:#16a34a">₹${totalIncome.toLocaleString()}</div></div>
  <div class="card"><div class="label">Total Expenses</div><div class="val" style="color:#dc2626">₹${totalExpenses.toLocaleString()}</div></div>
  <div class="card"><div class="label">Net Profit</div><div class="val" style="color:${totalIncome - totalExpenses >= 0 ? "#16a34a" : "#dc2626"}">₹${(totalIncome - totalExpenses).toLocaleString()}</div></div>
  <div class="card"><div class="label">Transactions</div><div class="val">${payments.length}</div></div>
</div>
<table>
  <thead>
    <tr><th>#</th><th>Party</th><th>Date</th><th>Bill Amt</th><th>Received</th><th>Balance</th></tr>
  </thead>
  <tbody>
    ${rows || '<tr><td colspan="6" style="text-align:center;color:#9ca3af">No transactions</td></tr>'}
  </tbody>
</table>
<div class="footer">Kisan Seva — Powered by Caffeine</div>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 300);
  };

  // ── Main Report Menu ──────────────────────────────────────────────────────
  const sections = [
    {
      title: t.partyReportSection,
      items: [
        {
          label: t.partyStatement,
          action: () => setSubView("partyStatement"),
          ocid: "report.partystatement.button",
        },
        {
          label: t.allParties,
          action: () => setPage("parties"),
          ocid: "report.allparties.button",
        },
      ],
    },
    {
      title: t.sevaReportSection,
      items: [
        {
          label: t.sevaEarnings,
          action: () => setSubView("sevaEarnings"),
          ocid: "report.sevaearnings.button",
        },
      ],
    },
    {
      title: t.tractorReportSection,
      items: [
        {
          label: t.byTractor,
          action: () => setSubView("byTractor"),
          ocid: "report.bytractor.button",
        },
      ],
    },
    {
      title: t.otherSection,
      items: [
        {
          label: t.monthlySummary,
          action: () => setSubView("monthlySummary"),
          ocid: "report.monthlysummary.button",
        },
        {
          label: t.udharCredit,
          action: () => setPage("parties"),
          ocid: "report.udhar.button",
        },
      ],
    },
    {
      title: t.driverReport,
      items: [
        {
          label: t.driverReport,
          action: () => setSubView("driverReport"),
          ocid: "report.driverreport.button",
        },
        {
          label: (t as any).driverPerformanceReport || "Driver Performance",
          action: () => setSubView("driverPerformance"),
          ocid: "report.driverperformance.button",
        },
        {
          label: (t as any).driverWiseProfit || "Driver Profit",
          action: () => setSubView("driverWiseProfit"),
          ocid: "report.driverwiseprofit.button",
        },
      ],
    },
    {
      title: (t as any).tractorWiseReport || "Tractor Reports",
      items: [
        {
          label: (t as any).tractorWiseReport || "Tractor Report",
          action: () => setSubView("tractorWiseReport"),
          ocid: "report.tractorwisereport.button",
        },
        {
          label: (t as any).tractorWiseProfit || "Tractor Profit",
          action: () => setSubView("tractorWiseProfit"),
          ocid: "report.tractorwiseprofit.button",
        },
      ],
    },
    {
      title: (t as any).serviceWiseReport || "Service Report",
      items: [
        {
          label: (t as any).serviceWiseReport || "Service Report",
          action: () => setSubView("serviceWiseReport"),
          ocid: "report.servicewisereport.button",
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-800">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b flex items-center justify-between px-4 pt-4 pb-3">
        <button
          type="button"
          onClick={goBack}
          className="p-1"
          data-ocid="report.back.button"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <button
          type="button"
          onClick={onOpenSidebar}
          className="p-1"
          data-ocid="report.menu.button"
        >
          <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        </button>
        <h1 className="font-bold text-lg text-gray-900 dark:text-gray-100">
          {t.reportTitle}
        </h1>
        <button
          type="button"
          onClick={handleDownloadReportPdf}
          className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1"
          data-ocid="report.pdf.button"
        >
          📄 PDF
        </button>
      </div>

      {/* This Month Summary Card */}
      <div
        className="mx-4 mt-4 bg-green-50 dark:bg-green-900/30 rounded-2xl px-5 py-4 border border-green-100"
        data-ocid="report.month.card"
      >
        <div className="text-xs text-green-700 font-medium mb-2">
          {t.thisMonthLabel}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              ₹{monthEarnings.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-0.5">
              {t.fullEarnings}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {monthWorkCount}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-0.5">
              {t.workLabel}
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto mt-4 pb-8">
        {sections.map((section) => (
          <div key={section.title} className="mb-1">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-gray-500">
              {section.title}
            </div>
            {section.items.map((item) => (
              <button
                key={item.ocid}
                type="button"
                onClick={item.action}
                className="w-full bg-white dark:bg-gray-900 px-4 py-4 border-b flex items-center justify-between text-left"
                data-ocid={item.ocid}
              >
                <div className="flex items-center gap-3">
                  <Star className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                    {item.label}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
