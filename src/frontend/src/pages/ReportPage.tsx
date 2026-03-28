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
  | "driverReport";

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
  const { t, setPage, goBack } = useApp();
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
        <div className="w-8" />
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
