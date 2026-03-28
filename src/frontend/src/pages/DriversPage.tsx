import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Menu, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../App";
import type { Driver, backendInterface } from "../backend";

type Props = { actor: backendInterface; onOpenSidebar?: () => void };

export default function DriversPage({ actor, onOpenSidebar }: Props) {
  const { t } = useApp();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    performanceNotes: "",
  });
  const [editId, setEditId] = useState<bigint | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setDrivers(await actor.getAllDrivers());
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
        await actor.updateDriver(
          editId,
          form.name,
          form.phone,
          form.performanceNotes,
        );
        toast.success(t.updatedMsg);
      } else {
        await actor.createDriver(form.name, form.phone, form.performanceNotes);
        toast.success(t.driverAddedMsg);
      }
      setShowForm(false);
      setForm({ name: "", phone: "", performanceNotes: "" });
      setEditId(null);
      await load();
    } catch {
      toast.error(t.errorSavingMsg);
    }
    setSaving(false);
  };

  const handleDelete = async (id: bigint) => {
    if (!confirm("Delete?")) return;
    await actor.deleteDriver(id);
    toast.success(t.deletedMsg);
    await load();
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
          <h1 className="font-bold text-lg">{editId ? t.edit : t.addDriver}</h1>
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
            <Label>{t.phone}</Label>
            <Input
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
            />
          </div>
          <div>
            <Label>{t.performance}</Label>
            <Textarea
              value={form.performanceNotes}
              onChange={(e) =>
                setForm((f) => ({ ...f, performanceNotes: e.target.value }))
              }
              rows={2}
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
    <div className="flex flex-col min-h-full bg-white">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="p-1"
            data-ocid="drivers.menu.button"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="font-bold text-lg text-gray-900">{t.drivers}</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 bg-green-700 text-white px-3 py-2 rounded-xl text-sm font-semibold"
          data-ocid="drivers.add.primary_button"
        >
          <Plus className="w-4 h-4" /> {t.addDriver}
        </button>
      </div>
      <div className="p-4 flex flex-col gap-3">
        {drivers.length === 0 && (
          <p className="text-gray-400 text-center py-12">{t.noDrivers}</p>
        )}
        {drivers.map((d) => (
          <div
            key={d.id.toString()}
            className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4"
          >
            <div className="font-semibold text-gray-900">{d.name}</div>
            <div className="text-sm text-gray-500">{d.phone}</div>
            {d.performanceNotes && (
              <div className="text-xs text-gray-400 mt-1">
                {d.performanceNotes}
              </div>
            )}
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => {
                  setForm({
                    name: d.name,
                    phone: d.phone,
                    performanceNotes: d.performanceNotes,
                  });
                  setEditId(d.id);
                  setShowForm(true);
                }}
                className="flex-1 py-1.5 rounded-lg border text-sm text-gray-600"
              >
                {t.edit}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(d.id)}
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
