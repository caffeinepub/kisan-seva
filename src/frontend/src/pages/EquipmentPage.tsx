import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Menu, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../App";

interface Equipment {
  id: string;
  name: string;
  purchasePrice: number;
  purchaseDate: string;
  sold: boolean;
  soldPrice?: number;
  soldDate?: string;
}

const STORAGE_KEY = "ktp_equipment_assets";

function loadEquipment(): Equipment[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveEquipment(list: Equipment[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

type Props = { onOpenSidebar?: () => void };

export default function EquipmentPage({ onOpenSidebar }: Props) {
  const { t, goBack, darkMode } = useApp();
  const [equipment, setEquipment] = useState<Equipment[]>(loadEquipment);
  const [view, setView] = useState<"list" | "add" | "edit" | "sell">("list");
  const [editTarget, setEditTarget] = useState<Equipment | null>(null);
  const [sellTarget, setSellTarget] = useState<Equipment | null>(null);

  const [form, setForm] = useState({
    name: "",
    purchasePrice: "",
    purchaseDate: new Date().toISOString().split("T")[0],
  });

  const [sellForm, setSellForm] = useState({
    soldPrice: "",
    soldDate: new Date().toISOString().split("T")[0],
  });

  const bg = darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900";
  const cardBg = darkMode
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-gray-200";
  const inputCls = darkMode ? "bg-gray-700 border-gray-600 text-white" : "";

  const refresh = () => setEquipment(loadEquipment());

  const openAdd = () => {
    setForm({
      name: "",
      purchasePrice: "",
      purchaseDate: new Date().toISOString().split("T")[0],
    });
    setView("add");
  };

  const openEdit = (eq: Equipment) => {
    setEditTarget(eq);
    setForm({
      name: eq.name,
      purchasePrice: eq.purchasePrice.toString(),
      purchaseDate: eq.purchaseDate,
    });
    setView("edit");
  };

  const openSell = (eq: Equipment) => {
    setSellTarget(eq);
    setSellForm({
      soldPrice: "",
      soldDate: new Date().toISOString().split("T")[0],
    });
    setView("sell");
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error((t as any).nameRequiredMsg || "Name is required");
      return;
    }
    const list = loadEquipment();
    if (view === "add") {
      const newEq: Equipment = {
        id: Date.now().toString(),
        name: form.name.trim(),
        purchasePrice: Number(form.purchasePrice) || 0,
        purchaseDate: form.purchaseDate,
        sold: false,
      };
      list.push(newEq);
      toast.success((t as any).savedMsg || "Equipment added");
    } else if (view === "edit" && editTarget) {
      const idx = list.findIndex((e) => e.id === editTarget.id);
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          name: form.name.trim(),
          purchasePrice: Number(form.purchasePrice) || 0,
          purchaseDate: form.purchaseDate,
        };
      }
      toast.success((t as any).updatedMsg || "Equipment updated");
    }
    saveEquipment(list);
    refresh();
    setView("list");
  };

  const handleSell = () => {
    if (!sellForm.soldPrice) {
      toast.error((t as any).amountRequired || "Sell price is required");
      return;
    }
    if (!sellTarget) return;
    const list = loadEquipment();
    const idx = list.findIndex((e) => e.id === sellTarget.id);
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        sold: true,
        soldPrice: Number(sellForm.soldPrice),
        soldDate: sellForm.soldDate,
      };
    }
    saveEquipment(list);
    refresh();
    setView("list");
    toast.success((t as any).soldMsg || "Equipment sold");
  };

  const handleDelete = (id: string) => {
    if (!confirm((t as any).confirmDelete || "Delete this equipment?")) return;
    const list = loadEquipment().filter((e) => e.id !== id);
    saveEquipment(list);
    refresh();
    toast.success((t as any).deletedMsg || "Deleted");
  };

  // --- Form view (add/edit) ---
  if (view === "add" || view === "edit") {
    return (
      <div className={`flex flex-col min-h-screen ${bg}`}>
        <header
          className={`flex items-center gap-3 px-4 py-3 shadow-sm sticky top-0 z-10 ${darkMode ? "bg-gray-800" : "bg-green-600"}`}
        >
          <button
            type="button"
            onClick={() => setView("list")}
            className="text-white p-1"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-white font-semibold text-lg flex-1">
            {view === "edit"
              ? (t as any).edit || "Edit"
              : (t as any).addEquipment || "Add Equipment"}
          </h1>
        </header>
        <div className="p-4 flex flex-col gap-4">
          <div>
            <Label className={darkMode ? "text-gray-200" : ""}>
              {(t as any).equipmentName || "Equipment Name"} *
            </Label>
            <Input
              className={`mt-1 ${inputCls}`}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder={(t as any).equipmentName || "Equipment Name"}
              data-ocid="equipment.input"
            />
          </div>
          <div>
            <Label className={darkMode ? "text-gray-200" : ""}>
              {(t as any).purchasePrice || "Purchase Price (₹)"}
            </Label>
            <Input
              className={`mt-1 ${inputCls}`}
              type="number"
              value={form.purchasePrice}
              onChange={(e) =>
                setForm((f) => ({ ...f, purchasePrice: e.target.value }))
              }
              placeholder="0"
              data-ocid="equipment.purchase_price.input"
            />
          </div>
          <div>
            <Label className={darkMode ? "text-gray-200" : ""}>
              {(t as any).purchaseDate || "Purchase Date"}
            </Label>
            <Input
              className={`mt-1 ${inputCls}`}
              type="date"
              value={form.purchaseDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, purchaseDate: e.target.value }))
              }
              data-ocid="equipment.purchase_date.input"
            />
          </div>
          <Button
            onClick={handleSave}
            className="bg-green-700 hover:bg-green-800 text-white w-full py-3 rounded-xl"
            data-ocid="equipment.submit_button"
          >
            {(t as any).save || "Save"}
          </Button>
        </div>
      </div>
    );
  }

  // --- Sell form ---
  if (view === "sell" && sellTarget) {
    return (
      <div className={`flex flex-col min-h-screen ${bg}`}>
        <header
          className={`flex items-center gap-3 px-4 py-3 shadow-sm sticky top-0 z-10 ${darkMode ? "bg-gray-800" : "bg-orange-600"}`}
        >
          <button
            type="button"
            onClick={() => setView("list")}
            className="text-white p-1"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-white font-semibold text-lg flex-1">
            {(t as any).sellEquipment || "Sell Equipment"} — {sellTarget.name}
          </h1>
        </header>
        <div className="p-4 flex flex-col gap-4">
          <div
            className={`rounded-xl p-3 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-orange-50 border-orange-200"}`}
          >
            <p className="text-sm text-orange-700 dark:text-orange-300">
              {(t as any).purchasePrice || "Purchase Price"}: ₹
              {sellTarget.purchasePrice.toLocaleString("en-IN")}
            </p>
          </div>
          <div>
            <Label className={darkMode ? "text-gray-200" : ""}>
              {(t as any).sellPrice || "Sell Price (₹)"} *
            </Label>
            <Input
              className={`mt-1 ${inputCls}`}
              type="number"
              value={sellForm.soldPrice}
              onChange={(e) =>
                setSellForm((f) => ({ ...f, soldPrice: e.target.value }))
              }
              placeholder="0"
              data-ocid="equipment.sell_price.input"
            />
          </div>
          <div>
            <Label className={darkMode ? "text-gray-200" : ""}>
              {(t as any).sellDate || "Sell Date"}
            </Label>
            <Input
              className={`mt-1 ${inputCls}`}
              type="date"
              value={sellForm.soldDate}
              onChange={(e) =>
                setSellForm((f) => ({ ...f, soldDate: e.target.value }))
              }
              data-ocid="equipment.sell_date.input"
            />
          </div>
          <Button
            onClick={handleSell}
            className="bg-orange-600 hover:bg-orange-700 text-white w-full py-3 rounded-xl"
            data-ocid="equipment.sell_confirm.primary_button"
          >
            {(t as any).confirmSell || "Confirm Sale"}
          </Button>
        </div>
      </div>
    );
  }

  // --- List view ---
  return (
    <div className={`flex flex-col min-h-screen ${bg}`}>
      <header
        className={`flex items-center gap-3 px-4 py-3 shadow-sm sticky top-0 z-10 ${darkMode ? "bg-gray-800" : "bg-green-600"}`}
      >
        <button
          type="button"
          onClick={goBack}
          className="text-white p-1"
          data-ocid="equipment.back.button"
        >
          <ArrowLeft size={22} />
        </button>
        {onOpenSidebar && (
          <button
            type="button"
            onClick={onOpenSidebar}
            className="text-white p-1"
            data-ocid="equipment.menu.button"
          >
            <Menu size={22} />
          </button>
        )}
        <h1 className="text-white font-semibold text-lg flex-1">
          {(t as any).equipment || "Equipment"}
        </h1>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-1 bg-white text-green-700 px-3 py-1.5 rounded-lg text-sm font-semibold"
          data-ocid="equipment.add.primary_button"
        >
          <Plus size={16} /> {(t as any).add || "Add"}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-3 pb-8">
        {equipment.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 text-gray-400"
            data-ocid="equipment.empty_state"
          >
            <Package size={48} className="mb-3 opacity-40" />
            <p>{(t as any).noEquipment || "No equipment added yet"}</p>
          </div>
        ) : (
          equipment.map((eq, idx) => (
            <div
              key={eq.id}
              className={`rounded-2xl border shadow-sm p-4 ${cardBg}`}
              data-ocid={`equipment.item.${idx + 1}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Package
                      size={18}
                      className={eq.sold ? "text-gray-400" : "text-green-600"}
                    />
                    <span className="font-semibold text-base">{eq.name}</span>
                    {eq.sold && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                        SOLD
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 space-y-0.5">
                    <p>
                      {(t as any).purchasePrice || "Purchase"}:{" "}
                      <span className="font-medium text-green-700 dark:text-green-400">
                        ₹{eq.purchasePrice.toLocaleString("en-IN")}
                      </span>{" "}
                      · {eq.purchaseDate}
                    </p>
                    {eq.sold && eq.soldPrice !== undefined && (
                      <p>
                        {(t as any).soldFor || "Sold"}:{" "}
                        <span className="font-medium text-orange-600">
                          ₹{eq.soldPrice.toLocaleString("en-IN")}
                        </span>{" "}
                        · {eq.soldDate}
                      </p>
                    )}
                    {eq.sold && eq.soldPrice !== undefined && (
                      <p
                        className={`font-semibold ${
                          eq.soldPrice >= eq.purchasePrice
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {(t as any).gainLoss || "Net"}:{" "}
                        {eq.soldPrice >= eq.purchasePrice ? "+" : "-"}₹
                        {Math.abs(
                          eq.soldPrice - eq.purchasePrice,
                        ).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {!eq.sold && (
                  <>
                    <button
                      type="button"
                      onClick={() => openEdit(eq)}
                      className={`flex items-center gap-1 flex-1 py-1.5 rounded-lg border text-sm justify-center ${darkMode ? "border-gray-600 text-gray-300" : "text-gray-600"}`}
                      data-ocid={`equipment.edit_button.${idx + 1}`}
                    >
                      <Pencil size={13} /> {(t as any).edit || "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => openSell(eq)}
                      className="flex items-center gap-1 flex-1 py-1.5 rounded-lg border border-orange-300 text-orange-600 text-sm justify-center"
                      data-ocid={`equipment.sell_button.${idx + 1}`}
                    >
                      💰 {(t as any).sell || "Sell"}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(eq.id)}
                  className="flex items-center gap-1 py-1.5 px-3 rounded-lg border border-red-200 text-red-500 text-sm justify-center"
                  data-ocid={`equipment.delete_button.${idx + 1}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
