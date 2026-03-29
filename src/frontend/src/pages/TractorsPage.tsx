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
import { ArrowLeft, Menu, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../App";
import {
  type Driver,
  type Tractor,
  TractorStatus,
  type backendInterface,
} from "../backend";

type Props = { actor: backendInterface; onOpenSidebar?: () => void };

export default function TractorsPage({ actor, onOpenSidebar }: Props) {
  const { t, goBack } = useApp();
  const [tractors, setTractors] = useState<Tractor[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", model: "" });
  const [editId, setEditId] = useState<bigint | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [tr, dr] = await Promise.all([
      actor.getAllTractors(),
      actor.getAllDrivers(),
    ]);
    setTractors(tr);
    setDrivers(dr);
  };
  // biome-ignore lint/correctness/useExhaustiveDependencies: actor is stable
  useEffect(() => {
    load();
  }, [actor]);

  const handleSave = async () => {
    if (!form.name) {
      toast.error(t.nameRequiredMsg);
      return;
    }
    setSaving(true);
    try {
      if (editId !== null) {
        await actor.updateTractor(editId, form.name, form.model, 0n);
        toast.success(t.updatedMsg);
      } else {
        await actor.createTractor(form.name, form.model, 0n);
        toast.success(t.tractorAddedMsg);
      }
      setShowForm(false);
      setForm({ name: "", model: "" });
      setEditId(null);
      await load();
    } catch {
      toast.error(t.errorSavingMsg);
    }
    setSaving(false);
  };

  const handleStatusToggle = async (id: bigint, current: TractorStatus) => {
    const next =
      current === TractorStatus.free ? TractorStatus.busy : TractorStatus.free;
    await actor.updateTractorStatus(id, next);
    await load();
  };

  const handleAssignDriver = async (tractorId: bigint, driverId: string) => {
    await actor.assignDriverToTractor(
      tractorId,
      driverId ? BigInt(driverId) : null,
    );
    toast.success(t.driverAssignedMsg);
    await load();
  };

  const handleDelete = async (id: bigint) => {
    if (!confirm("Delete?")) return;
    await actor.deleteTractor(id);
    toast.success(t.deletedMsg);
    await load();
  };

  if (showForm) {
    return (
      <div className="flex flex-col min-h-full bg-white dark:bg-gray-900">
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
            {editId ? t.edit : t.addTractor}
          </h1>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <div>
            <Label>{t.name} *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <Label>{t.model}</Label>
            <Input
              value={form.model}
              onChange={(e) =>
                setForm((f) => ({ ...f, model: e.target.value }))
              }
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-700 hover:bg-green-800 text-white w-full py-3 rounded-xl"
          >
            {saving ? t.savingText : t.save}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            className="p-1"
            data-ocid="tractors.back.button"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            type="button"
            onClick={onOpenSidebar}
            className="p-1"
            data-ocid="tractors.menu.button"
          >
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="font-bold text-lg text-gray-900 dark:text-gray-100">
            {t.tractors}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 bg-green-700 text-white px-3 py-2 rounded-xl text-sm font-semibold"
          data-ocid="tractors.add.primary_button"
        >
          <Plus className="w-4 h-4" /> {t.addTractor}
        </button>
      </div>
      <div className="p-4 flex flex-col gap-3">
        {tractors.length === 0 && (
          <p className="text-gray-400 dark:text-gray-500 text-center py-12">
            {t.noTractors}
          </p>
        )}
        {tractors.map((tr) => (
          <div
            key={tr.id.toString()}
            className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  {tr.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {tr.model}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleStatusToggle(tr.id, tr.status)}
                className={`text-xs px-3 py-1 rounded-full font-bold ${
                  tr.status === TractorStatus.free
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-600"
                }`}
              >
                {tr.status === TractorStatus.free ? t.free : t.busy}
              </button>
            </div>
            <div className="mt-3">
              <Label className="text-xs">{t.assignDriver}</Label>
              <Select
                value={tr.driverId?.toString() || ""}
                onValueChange={(v) => handleAssignDriver(tr.id, v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t.selectDriver} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t.emptySlot}</SelectItem>
                  {drivers.map((d) => (
                    <SelectItem key={d.id.toString()} value={d.id.toString()}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => {
                  setForm({
                    name: tr.name,
                    model: tr.model,
                  });
                  setEditId(tr.id);
                  setShowForm(true);
                }}
                className="flex-1 py-1.5 rounded-lg border text-sm text-gray-600 dark:text-gray-400"
              >
                {t.edit}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(tr.id)}
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
