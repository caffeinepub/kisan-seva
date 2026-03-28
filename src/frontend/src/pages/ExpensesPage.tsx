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
import { ArrowLeft, Menu, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../App";
import {
  type Expense,
  ExpenseCategory,
  type Tractor,
  type backendInterface,
} from "../backend";

type Props = { actor: backendInterface; onOpenSidebar?: () => void };

export default function ExpensesPage({ actor, onOpenSidebar }: Props) {
  const { t } = useApp();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tractors, setTractors] = useState<Tractor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    tractorId: "",
    category: ExpenseCategory.diesel,
    amount: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [editId, setEditId] = useState<bigint | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [exp, tr] = await Promise.all([
      actor.getAllExpenses(),
      actor.getAllTractors(),
    ]);
    setExpenses(exp.sort((a, b) => Number(b.date - a.date)));
    setTractors(tr);
  };
  // biome-ignore lint/correctness/useExhaustiveDependencies: actor is stable
  useEffect(() => {
    load();
  }, [actor]);

  const handleSave = async () => {
    if (!form.tractorId || !form.amount) {
      toast.error("Fill required fields");
      return;
    }
    setSaving(true);
    try {
      const dateMs = BigInt(new Date(form.date).getTime());
      if (editId !== null) {
        await actor.updateExpense(
          editId,
          BigInt(form.tractorId),
          form.category,
          BigInt(form.amount),
          dateMs,
          form.notes,
        );
        toast.success("Updated");
      } else {
        await actor.createExpense(
          BigInt(form.tractorId),
          form.category,
          BigInt(form.amount),
          dateMs,
          form.notes,
        );
        toast.success("Expense added");
      }
      setShowForm(false);
      setEditId(null);
      setForm({
        tractorId: "",
        category: ExpenseCategory.diesel,
        amount: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      await load();
    } catch {
      toast.error("Error");
    }
    setSaving(false);
  };

  const handleDelete = async (id: bigint) => {
    if (!confirm("Delete?")) return;
    await actor.deleteExpense(id);
    toast.success("Deleted");
    await load();
  };

  const getTractorName = (id: bigint) =>
    tractors.find((t) => t.id === id)?.name || id.toString();
  const total = expenses.reduce((sum, e) => sum + e.amount, 0n);

  const catColors: Record<ExpenseCategory, string> = {
    [ExpenseCategory.diesel]: "bg-yellow-100 text-yellow-700",
    [ExpenseCategory.maintenance]: "bg-blue-100 text-blue-700",
    [ExpenseCategory.other]: "bg-gray-100 text-gray-600",
  };

  if (showForm) {
    return (
      <div className="flex flex-col min-h-full bg-white">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b">
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setEditId(null);
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">
            {editId ? t.edit : t.addExpense}
          </h1>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <div>
            <Label>{t.tractor} *</Label>
            <Select
              value={form.tractorId}
              onValueChange={(v) => setForm((f) => ({ ...f, tractorId: v }))}
            >
              <SelectTrigger>
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
          <div>
            <Label>{t.category}</Label>
            <Select
              value={form.category}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, category: v as ExpenseCategory }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ExpenseCategory.diesel}>
                  {t.diesel}
                </SelectItem>
                <SelectItem value={ExpenseCategory.maintenance}>
                  {t.maintenance}
                </SelectItem>
                <SelectItem value={ExpenseCategory.other}>{t.other}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t.amount} *</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, amount: e.target.value }))
              }
            />
          </div>
          <div>
            <Label>{t.date}</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div>
            <Label>{t.notes}</Label>
            <Textarea
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={2}
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-700 hover:bg-green-800 text-white w-full py-3 rounded-xl"
          >
            {saving ? "Saving..." : t.save}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-white">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="p-1"
            data-ocid="expenses.menu.button"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="font-bold text-lg text-gray-900">{t.expenses}</h1>
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
      {expenses.length > 0 && (
        <div className="mx-4 mt-3 bg-red-50 rounded-xl px-4 py-2 flex justify-between items-center">
          <span className="text-sm text-gray-500">Total</span>
          <span className="font-bold text-red-600">₹{total.toString()}</span>
        </div>
      )}
      <div className="p-4 flex flex-col gap-3">
        {expenses.length === 0 && (
          <p className="text-gray-400 text-center py-12">{t.noExpenses}</p>
        )}
        {expenses.map((e) => (
          <div
            key={e.id.toString()}
            className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-gray-900">
                  {getTractorName(e.tractorId)}
                </div>
                <div className="text-sm text-gray-400">
                  {new Date(Number(e.date)).toLocaleDateString()}
                </div>
                {e.notes && (
                  <div className="text-xs text-gray-400">{e.notes}</div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="font-bold text-red-600">
                  ₹{e.amount.toString()}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${catColors[e.category]}`}
                >
                  {t[e.category]}
                </span>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => {
                  setForm({
                    tractorId: e.tractorId.toString(),
                    category: e.category,
                    amount: e.amount.toString(),
                    date: new Date(Number(e.date)).toISOString().split("T")[0],
                    notes: e.notes,
                  });
                  setEditId(e.id);
                  setShowForm(true);
                }}
                className="flex-1 py-1.5 rounded-lg border text-sm text-gray-600"
              >
                {t.edit}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(e.id)}
                className="flex-1 py-1.5 rounded-lg border border-red-200 text-sm text-red-500"
              >
                {t.delete}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
