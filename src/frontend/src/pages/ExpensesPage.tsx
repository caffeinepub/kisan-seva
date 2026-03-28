import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Menu, Plus, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../App";
import {
  type Driver,
  type Expense,
  ExpenseCategory,
  type Tractor,
  type backendInterface,
} from "../backend";
import { saveCashFlowEntries } from "../lib/cashFlowUtils";

type Props = { actor: backendInterface; onOpenSidebar?: () => void };

type FilterCategory = ExpenseCategory | "all";

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.driverPayment]:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  [ExpenseCategory.diesel]:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  [ExpenseCategory.maintenance]:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  [ExpenseCategory.other]:
    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export default function ExpensesPage({ actor, onOpenSidebar }: Props) {
  const { t, goBack } = useApp();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tractors, setTractors] = useState<Tractor[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [form, setForm] = useState({
    tractorId: "",
    driverId: "",
    category: ExpenseCategory.diesel as ExpenseCategory,
    amount: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [editId, setEditId] = useState<bigint | null>(null);
  const [saving, setSaving] = useState(false);
  const [expensePayMethod, setExpensePayMethod] = useState<"cash" | "upi">(
    "cash",
  );

  const load = async () => {
    const [exp, tr, dr] = await Promise.all([
      actor.getAllExpenses(),
      actor.getAllTractors(),
      actor.getAllDrivers(),
    ]);
    setExpenses(exp.sort((a, b) => Number(b.date - a.date)));
    setTractors(tr);
    setDrivers(dr);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: actor is stable
  useEffect(() => {
    load();
  }, [actor]);

  const isDriverPayment = form.category === ExpenseCategory.driverPayment;

  const resetForm = () => {
    setForm({
      tractorId: "",
      driverId: "",
      category: ExpenseCategory.diesel,
      amount: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setEditId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.amount) {
      toast.error(t.amountRequiredMsg);
      return;
    }
    if (isDriverPayment && !form.driverId) {
      toast.error(t.selectDriverRequired || "Select a driver");
      return;
    }
    setSaving(true);
    try {
      const dateMs = BigInt(new Date(form.date).getTime());
      const tractorId = form.tractorId ? BigInt(form.tractorId) : 0n;
      const driverId = form.driverId ? BigInt(form.driverId) : 0n;
      if (editId !== null) {
        await actor.updateExpense(
          editId,
          tractorId,
          driverId,
          form.category,
          BigInt(form.amount),
          dateMs,
          form.notes,
        );
        toast.success(t.updatedMsg);
      } else {
        await actor.createExpense(
          tractorId,
          driverId,
          form.category,
          BigInt(form.amount),
          dateMs,
          form.notes,
        );
        toast.success(t.expenseAdded);
        saveCashFlowEntries([
          {
            id: `cf_exp_${Date.now()}`,
            date: form.date,
            time: "",
            label: `${getCategoryLabel(form.category)}${form.notes ? ` - ${form.notes}` : ""}`,
            amount: Number(form.amount),
            paymentMethod: expensePayMethod,
            type: "out",
            source: "expense",
          },
        ]);
      }
      resetForm();
      await load();
    } catch {
      toast.error(t.errorSavingMsg);
    }
    setSaving(false);
  };

  const handleDelete = async (id: bigint) => {
    if (!confirm(`${t.delete}?`)) return;
    await actor.deleteExpense(id);
    toast.success(t.deletedMsg);
    await load();
  };

  const getTractorName = (id: bigint) =>
    id === 0n
      ? "—"
      : tractors.find((tr) => tr.id === id)?.name || id.toString();

  const getDriverName = (id: bigint) =>
    id === 0n ? "—" : drivers.find((d) => d.id === id)?.name || id.toString();

  const getCategoryLabel = (cat: ExpenseCategory): string => {
    if (cat === ExpenseCategory.driverPayment)
      return t.driverPayment || "Driver Payment";
    if (cat === ExpenseCategory.diesel) return t.diesel;
    if (cat === ExpenseCategory.maintenance) return t.maintenance;
    return t.other;
  };

  // Apply filters
  const filtered = expenses.filter((e) => {
    if (filterCategory !== "all" && e.category !== filterCategory) return false;
    const d = Number(e.date);
    if (filterFrom) {
      const from = new Date(filterFrom).getTime();
      if (d < from) return false;
    }
    if (filterTo) {
      const to = new Date(filterTo).getTime() + 86400000;
      if (d > to) return false;
    }
    return true;
  });

  const total = filtered.reduce((sum, e) => sum + e.amount, 0n);

  // Category breakdown for "all" filter
  const breakdown: Partial<Record<ExpenseCategory, bigint>> = {};
  if (filterCategory === "all") {
    for (const e of filtered) {
      breakdown[e.category] = (breakdown[e.category] ?? 0n) + e.amount;
    }
  }

  const categories: { value: FilterCategory; label: string }[] = [
    { value: "all", label: t.allCategories || "All" },
    { value: ExpenseCategory.maintenance, label: t.maintenance },
    {
      value: ExpenseCategory.driverPayment,
      label: t.driverPayment || "Driver Payment",
    },
    { value: ExpenseCategory.diesel, label: t.diesel },
    { value: ExpenseCategory.other, label: t.other },
  ];

  if (showForm) {
    return (
      <div className="flex flex-col min-h-full bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <button
            type="button"
            onClick={resetForm}
            className="p-1"
            data-ocid="expenses.form.close_button"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="font-bold text-lg text-gray-900 dark:text-gray-100">
            {editId ? t.edit : t.addExpense}
          </h1>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {/* Category */}
          <div>
            <Label className="text-gray-700 dark:text-gray-300">
              {t.category}
            </Label>
            <Select
              value={form.category}
              onValueChange={(v) =>
                setForm((f) => ({
                  ...f,
                  category: v as ExpenseCategory,
                  tractorId: "",
                  driverId: "",
                }))
              }
            >
              <SelectTrigger data-ocid="expenses.category.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ExpenseCategory.diesel}>
                  {t.diesel}
                </SelectItem>
                <SelectItem value={ExpenseCategory.maintenance}>
                  {t.maintenance}
                </SelectItem>
                <SelectItem value={ExpenseCategory.driverPayment}>
                  {t.driverPayment || "Driver Payment"}
                </SelectItem>
                <SelectItem value={ExpenseCategory.other}>{t.other}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Driver dropdown — only for driverPayment */}
          {isDriverPayment && (
            <div>
              <Label className="text-gray-700 dark:text-gray-300">
                {t.selectDriverRequired || "Driver *"}
              </Label>
              <Select
                value={form.driverId}
                onValueChange={(v) => setForm((f) => ({ ...f, driverId: v }))}
              >
                <SelectTrigger data-ocid="expenses.driver.select">
                  <SelectValue placeholder={t.selectDriver} />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((d) => (
                    <SelectItem key={d.id.toString()} value={d.id.toString()}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tractor dropdown — for non-driverPayment */}
          {!isDriverPayment && (
            <div>
              <Label className="text-gray-700 dark:text-gray-300">
                {t.tractor} ({t.optionalLabel})
              </Label>
              <Select
                value={form.tractorId}
                onValueChange={(v) => setForm((f) => ({ ...f, tractorId: v }))}
              >
                <SelectTrigger data-ocid="expenses.tractor.select">
                  <SelectValue placeholder={t.selectTractor} />
                </SelectTrigger>
                <SelectContent>
                  {tractors.map((tr) => (
                    <SelectItem key={tr.id.toString()} value={tr.id.toString()}>
                      {tr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Amount */}
          <div>
            <Label className="text-gray-700 dark:text-gray-300">
              {t.amount} *
            </Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, amount: e.target.value }))
              }
              className="dark:bg-gray-800 dark:border-gray-700"
              data-ocid="expenses.amount.input"
            />
          </div>

          {/* Date */}
          <div>
            <Label className="text-gray-700 dark:text-gray-300">{t.date}</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="dark:bg-gray-800 dark:border-gray-700"
              data-ocid="expenses.date.input"
            />
          </div>

          {/* Notes */}
          <div>
            <Label className="text-gray-700 dark:text-gray-300">
              {t.notes}
            </Label>
            <Textarea
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={2}
              className="dark:bg-gray-800 dark:border-gray-700"
              data-ocid="expenses.notes.textarea"
            />
          </div>

          {/* Payment Method for Expense */}
          <div>
            <p className="text-sm font-medium mb-1">Payment Method</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setExpensePayMethod("cash")}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${expensePayMethod === "cash" ? "bg-green-600 text-white border-green-600" : "bg-gray-100 text-gray-600 border-gray-200"}`}
              >
                💵 Cash
              </button>
              <button
                type="button"
                onClick={() => setExpensePayMethod("upi")}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${expensePayMethod === "upi" ? "bg-blue-600 text-white border-blue-600" : "bg-gray-100 text-gray-600 border-gray-200"}`}
              >
                📱 UPI
              </button>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-700 hover:bg-green-800 text-white w-full py-3 rounded-xl"
            data-ocid="expenses.form.submit_button"
          >
            {saving ? t.savingText : t.save}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            className="p-1"
            data-ocid="expenses.back.button"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            type="button"
            onClick={onOpenSidebar}
            className="p-1"
            data-ocid="expenses.menu.button"
          >
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="font-bold text-lg text-gray-900 dark:text-gray-100">
            {t.expenses}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 bg-green-700 text-white px-3 py-2 rounded-xl text-sm font-semibold"
          data-ocid="expenses.add.primary_button"
        >
          <Plus className="w-4 h-4" /> {t.addExpense}
        </button>
      </div>

      {/* Category filter tabs */}
      <div className="px-4 pt-3 overflow-x-auto">
        <div className="flex gap-2 pb-1" style={{ minWidth: "max-content" }}>
          {categories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setFilterCategory(cat.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                filterCategory === cat.value
                  ? "bg-green-700 text-white border-green-700"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
              }`}
              data-ocid={"expenses.filter.tab"}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date filters */}
      <div className="px-4 pt-2 flex gap-2">
        <div className="flex-1">
          <Input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="text-xs h-8 dark:bg-gray-800 dark:border-gray-700"
            placeholder={t.dateFromLabel}
            data-ocid="expenses.date_from.input"
          />
        </div>
        <div className="flex-1">
          <Input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="text-xs h-8 dark:bg-gray-800 dark:border-gray-700"
            placeholder={t.dateToLabel}
            data-ocid="expenses.date_to.input"
          />
        </div>
        {(filterFrom || filterTo) && (
          <button
            type="button"
            onClick={() => {
              setFilterFrom("");
              setFilterTo("");
            }}
            className="text-xs text-red-500 px-2"
          >
            ✕
          </button>
        )}
      </div>

      {/* Summary bar */}
      {filtered.length > 0 && (
        <div className="mx-4 mt-3 bg-red-50 dark:bg-red-950/30 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t.totalLabel}
              </span>
            </div>
            <span className="font-bold text-red-600 text-lg">
              ₹{total.toString()}
            </span>
          </div>
          {filterCategory === "all" && Object.keys(breakdown).length > 1 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {(Object.entries(breakdown) as [ExpenseCategory, bigint][]).map(
                ([cat, amt]) => (
                  <div
                    key={cat}
                    className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[cat]}`}
                  >
                    {getCategoryLabel(cat)}: ₹{amt.toString()}
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      )}

      {/* Expense list */}
      <div className="p-4 flex flex-col gap-3">
        {filtered.length === 0 && (
          <p
            className="text-gray-400 dark:text-gray-500 text-center py-12"
            data-ocid="expenses.empty_state"
          >
            {t.noExpenses}
          </p>
        )}
        {filtered.map((e, idx) => {
          const isDriverPay = e.category === ExpenseCategory.driverPayment;
          const entityName = isDriverPay
            ? getDriverName(e.driverId)
            : getTractorName(e.tractorId);
          return (
            <div
              key={e.id.toString()}
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm p-4"
              data-ocid={`expenses.item.${idx + 1}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {entityName !== "—"
                      ? entityName
                      : isDriverPay
                        ? t.drivers
                        : t.tractor}
                  </div>
                  <div className="text-sm text-gray-400 dark:text-gray-500">
                    {new Date(Number(e.date)).toLocaleDateString()}
                  </div>
                  {e.notes && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                      {e.notes}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 ml-2">
                  <span className="font-bold text-red-600 text-base">
                    ₹{e.amount.toString()}
                  </span>
                  <Badge
                    className={`text-xs px-2 py-0.5 rounded-full border-0 ${CATEGORY_COLORS[e.category]}`}
                  >
                    {getCategoryLabel(e.category)}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setForm({
                      tractorId:
                        e.tractorId !== 0n ? e.tractorId.toString() : "",
                      driverId: e.driverId !== 0n ? e.driverId.toString() : "",
                      category: e.category,
                      amount: e.amount.toString(),
                      date: new Date(Number(e.date))
                        .toISOString()
                        .split("T")[0],
                      notes: e.notes,
                    });
                    setEditId(e.id);
                    setShowForm(true);
                  }}
                  className="flex-1 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400"
                  data-ocid={`expenses.edit_button.${idx + 1}`}
                >
                  {t.edit}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(e.id)}
                  className="flex-1 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 text-sm text-red-500"
                  data-ocid={`expenses.delete_button.${idx + 1}`}
                >
                  {t.delete}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
