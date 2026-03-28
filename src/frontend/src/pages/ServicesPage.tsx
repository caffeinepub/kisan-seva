import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Menu, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../App";

const STORAGE_KEY = "kisan_services_v2";

export type ServiceItem = { name: string; rate: number };

const DEFAULT_SERVICES: ServiceItem[] = [
  { name: "Ploughing", rate: 0 },
  { name: "Rotavator", rate: 0 },
  { name: "Leveling", rate: 0 },
  { name: "Transport", rate: 0 },
  { name: "Other", rate: 0 },
];

export const getStoredServices = (): ServiceItem[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored) as ServiceItem[];
  const old = localStorage.getItem("kisan_services");
  if (old) {
    const oldArr = JSON.parse(old) as string[];
    const migrated = oldArr.map((name) => ({ name, rate: 0 }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SERVICES));
  return DEFAULT_SERVICES;
};

type Props = { onOpenSidebar?: () => void };

export default function ServicesPage({ onOpenSidebar }: Props) {
  const { t } = useApp();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [newName, setNewName] = useState("");
  const [newRate, setNewRate] = useState("");
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editRate, setEditRate] = useState("");

  useEffect(() => {
    setServices(getStoredServices());
  }, []);

  const save = (updated: ServiceItem[]) => {
    setServices(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (services.find((s) => s.name === trimmed)) {
      toast.error(t.serviceExistsMsg);
      return;
    }
    save([...services, { name: trimmed, rate: Number(newRate) || 0 }]);
    setNewName("");
    setNewRate("");
    toast.success(t.serviceAddedMsg);
  };

  const handleDelete = (i: number) => {
    if (!confirm(`Delete "${services[i].name}"?`)) return;
    save(services.filter((_, idx) => idx !== i));
    toast.success(t.deletedMsg);
  };

  const startEdit = (i: number) => {
    setEditIndex(i);
    setEditName(services[i].name);
    setEditRate(String(services[i].rate || ""));
  };

  const confirmEdit = (i: number) => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    const updated = services.map((s, idx) =>
      idx === i ? { name: trimmed, rate: Number(editRate) || 0 } : s,
    );
    save(updated);
    setEditIndex(null);
    toast.success(t.updatedMsg);
  };

  return (
    <div className="flex flex-col min-h-full bg-white">
      <div className="sticky top-0 z-30 flex items-center gap-3 px-4 pt-4 pb-3 border-b bg-white">
        <button
          type="button"
          onClick={onOpenSidebar}
          data-ocid="services.menu.button"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="font-bold text-lg flex-1">{t.services}</h1>
      </div>

      <div className="flex items-center px-4 py-2 bg-gray-50 border-b text-xs text-gray-500 font-medium">
        <span className="flex-1">{t.name}</span>
        <span className="w-28 text-right">{t.ratePerHour}</span>
        <span className="w-16" />
      </div>

      <div
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-2"
        data-ocid="services.list"
      >
        {services.map((s, i) => (
          <div
            key={s.name}
            className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100"
            data-ocid={`services.item.${i + 1}`}
          >
            {editIndex === i ? (
              <>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 h-8 text-sm"
                  autoFocus
                  placeholder={t.name}
                  onKeyDown={(e) => e.key === "Enter" && confirmEdit(i)}
                  data-ocid="services.edit.input"
                />
                <Input
                  type="number"
                  value={editRate}
                  onChange={(e) => setEditRate(e.target.value)}
                  className="w-24 h-8 text-sm"
                  placeholder="₹/hr"
                  min={0}
                  data-ocid="services.edit.rate_input"
                />
                <button
                  type="button"
                  onClick={() => confirmEdit(i)}
                  className="text-green-600 p-1"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditIndex(null)}
                  className="text-gray-400 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium text-gray-800">
                  ⚙️ {s.name}
                </span>
                <span className="w-24 text-right text-sm font-semibold text-green-700">
                  {s.rate > 0 ? (
                    `₹${s.rate}`
                  ) : (
                    <span className="text-gray-400 text-xs">
                      {t.optionalLabel}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => startEdit(i)}
                  className="text-blue-500 p-1"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(i)}
                  className="text-red-400 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="px-4 pb-6 pt-2 border-t bg-white">
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={`${t.name}...`}
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            data-ocid="services.input"
          />
          <Input
            type="number"
            value={newRate}
            onChange={(e) => setNewRate(e.target.value)}
            placeholder="₹/hr"
            className="w-24"
            min={0}
            data-ocid="services.rate.input"
          />
          <Button
            onClick={handleAdd}
            className="bg-green-700 hover:bg-green-800 text-white px-4"
            data-ocid="services.primary_button"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-2">₹/hr = {t.ratePerHour}</p>
      </div>
    </div>
  );
}
