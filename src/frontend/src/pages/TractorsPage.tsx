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

interface TractorAsset {
  tractorId: string;
  purchasePrice: number;
  purchaseDate: string;
  sold: boolean;
  soldPrice?: number;
  soldDate?: string;
}

function loadAssets(): Record<string, TractorAsset> {
  try {
    return JSON.parse(localStorage.getItem("ktp_tractor_assets") || "{}");
  } catch {
    return {};
  }
}

function saveAssets(map: Record<string, TractorAsset>) {
  localStorage.setItem("ktp_tractor_assets", JSON.stringify(map));
}

type Props = { actor: backendInterface; onOpenSidebar?: () => void };

export default function TractorsPage({ actor, onOpenSidebar }: Props) {
  const { t, goBack, darkMode } = useApp();
  const [tractors, setTractors] = useState<Tractor[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    model: "",
    purchasePrice: "",
    purchaseDate: "",
  });
  const [editId, setEditId] = useState<bigint | null>(null);
  const [saving, setSaving] = useState(false);
  const [sellTarget, setSellTarget] = useState<Tractor | null>(null);
  const [sellForm, setSellForm] = useState({
    soldPrice: "",
    soldDate: new Date().toISOString().split("T")[0],
  });

  const inputCls = darkMode ? "bg-gray-700 border-gray-600 text-white" : "";

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
      let savedId: bigint | null = null;
      if (editId !== null) {
        await actor.updateTractor(editId, form.name, form.model, 0n);
        savedId = editId;
        toast.success(t.updatedMsg);
      } else {
        savedId = await actor.createTractor(form.name, form.model, 0n);
        // id is the returned bigint
        toast.success(t.tractorAddedMsg);
      }
      // Save asset info
      if (savedId !== null) {
        const assets = loadAssets();
        const key = savedId.toString();
        assets[key] = {
          tractorId: key,
          purchasePrice: Number(form.purchasePrice) || 0,
          purchaseDate: form.purchaseDate || "",
          sold: assets[key]?.sold || false,
          soldPrice: assets[key]?.soldPrice,
          soldDate: assets[key]?.soldDate,
        };
        saveAssets(assets);
      }
      setShowForm(false);
      setForm({ name: "", model: "", purchasePrice: "", purchaseDate: "" });
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
    // Remove asset entry too
    const assets = loadAssets();
    delete assets[id.toString()];
    saveAssets(assets);
    toast.success(t.deletedMsg);
    await load();
  };

  const handleSellConfirm = (tractor: Tractor) => {
    if (!sellForm.soldPrice) {
      toast.error((t as any).amountRequired || "Sell price is required");
      return;
    }
    const assets = loadAssets();
    const key = tractor.id.toString();
    assets[key] = {
      ...(assets[key] || {
        tractorId: key,
        purchasePrice: 0,
        purchaseDate: "",
        sold: false,
      }),
      sold: true,
      soldPrice: Number(sellForm.soldPrice),
      soldDate: sellForm.soldDate,
    };
    saveAssets(assets);
    setSellTarget(null);
    setSellForm({
      soldPrice: "",
      soldDate: new Date().toISOString().split("T")[0],
    });
    toast.success((t as any).soldMsg || "Tractor marked as sold");
    load();
  };

  const assets = loadAssets();

  if (sellTarget) {
    const asset = assets[sellTarget.id.toString()];
    return (
      <div
        className={`flex flex-col min-h-full ${darkMode ? "bg-gray-900" : "bg-white"}`}
      >
        <div
          className={`flex items-center gap-3 px-4 py-3 shadow-sm sticky top-0 z-10 ${darkMode ? "bg-gray-800" : "bg-orange-600"}`}
        >
          <button
            type="button"
            onClick={() => setSellTarget(null)}
            className="text-white p-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg text-white">
            {(t as any).sellTractor || "Sell Tractor"} — {sellTarget.name}
          </h1>
        </div>
        <div className="p-4 flex flex-col gap-4">
          {asset && asset.purchasePrice > 0 && (
            <div
              className={`rounded-xl p-3 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-orange-50 border-orange-200"}`}
            >
              <p className="text-sm text-orange-700 dark:text-orange-300">
                {(t as any).purchasePrice || "Purchase Price"}: ₹
                {asset.purchasePrice.toLocaleString("en-IN")}
              </p>
            </div>
          )}
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
              data-ocid="tractors.sell_price.input"
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
              data-ocid="tractors.sell_date.input"
            />
          </div>
          <Button
            onClick={() => handleSellConfirm(sellTarget)}
            className="bg-orange-600 hover:bg-orange-700 text-white w-full py-3 rounded-xl"
            data-ocid="tractors.sell_confirm.primary_button"
          >
            {(t as any).confirmSell || "Confirm Sale"}
          </Button>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div
        className={`flex flex-col min-h-full ${darkMode ? "bg-gray-900" : "bg-white"}`}
      >
        <div
          className={`flex items-center gap-3 px-4 py-3 shadow-sm sticky top-0 z-10 ${darkMode ? "bg-gray-800" : "bg-green-600"}`}
        >
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setEditId(null);
            }}
            className="text-white p-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg text-white">
            {editId ? t.edit : t.addTractor}
          </h1>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <div>
            <Label className={darkMode ? "text-gray-200" : ""}>
              {t.name} *
            </Label>
            <Input
              className={`mt-1 ${inputCls}`}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <Label className={darkMode ? "text-gray-200" : ""}>{t.model}</Label>
            <Input
              className={`mt-1 ${inputCls}`}
              value={form.model}
              onChange={(e) =>
                setForm((f) => ({ ...f, model: e.target.value }))
              }
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
              data-ocid="tractors.purchase_price.input"
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
              data-ocid="tractors.purchase_date.input"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-700 hover:bg-green-800 text-white w-full py-3 rounded-xl"
            data-ocid="tractors.submit_button"
          >
            {saving ? t.savingText : t.save}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col min-h-full ${darkMode ? "bg-gray-900" : "bg-white"}`}
    >
      <div
        className={`flex items-center justify-between px-4 py-3 shadow-sm sticky top-0 z-10 ${darkMode ? "bg-gray-800" : "bg-green-600"}`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            className="text-white p-1"
            data-ocid="tractors.back.button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onOpenSidebar}
            className="text-white p-1"
            data-ocid="tractors.menu.button"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-lg text-white">{t.tractors}</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 bg-white text-green-700 px-3 py-1.5 rounded-lg text-sm font-semibold"
          data-ocid="tractors.add.primary_button"
        >
          <Plus className="w-4 h-4" /> {t.addTractor}
        </button>
      </div>
      <div className="p-4 flex flex-col gap-3">
        {tractors.length === 0 && (
          <p
            className="text-gray-400 dark:text-gray-500 text-center py-12"
            data-ocid="tractors.empty_state"
          >
            {t.noTractors}
          </p>
        )}
        {tractors.map((tr, idx) => {
          const asset = assets[tr.id.toString()];
          const isSold = asset?.sold === true;
          return (
            <div
              key={tr.id.toString()}
              className={`rounded-2xl border shadow-sm p-4 ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-100"
              }`}
              data-ocid={`tractors.item.${idx + 1}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {tr.name}
                    </span>
                    {isSold && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                        SOLD
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {tr.model}
                  </div>
                  {asset && asset.purchasePrice > 0 && (
                    <div className="mt-1 text-xs text-gray-400 dark:text-gray-500 space-y-0.5">
                      <span>
                        {(t as any).purchasePrice || "Purchase"}: ₹
                        {asset.purchasePrice.toLocaleString("en-IN")}
                      </span>
                      {asset.purchaseDate && (
                        <span className="ml-2">· {asset.purchaseDate}</span>
                      )}
                      {isSold && asset.soldPrice !== undefined && (
                        <div
                          className={`font-medium ${
                            asset.soldPrice >= asset.purchasePrice
                              ? "text-green-600"
                              : "text-red-500"
                          }`}
                        >
                          {(t as any).soldFor || "Sold"}: ₹
                          {asset.soldPrice.toLocaleString("en-IN")} (
                          {asset.soldDate})
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {!isSold && (
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
                )}
              </div>
              {!isSold && (
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
                        <SelectItem
                          key={d.id.toString()}
                          value={d.id.toString()}
                        >
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex gap-2 mt-3">
                {!isSold && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const existing = assets[tr.id.toString()];
                        setForm({
                          name: tr.name,
                          model: tr.model,
                          purchasePrice:
                            existing?.purchasePrice?.toString() || "",
                          purchaseDate: existing?.purchaseDate || "",
                        });
                        setEditId(tr.id);
                        setShowForm(true);
                      }}
                      className={`flex-1 py-1.5 rounded-lg border text-sm ${
                        darkMode
                          ? "border-gray-600 text-gray-300"
                          : "text-gray-600"
                      }`}
                      data-ocid={`tractors.edit_button.${idx + 1}`}
                    >
                      {t.edit}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSellTarget(tr);
                        setSellForm({
                          soldPrice: "",
                          soldDate: new Date().toISOString().split("T")[0],
                        });
                      }}
                      className="flex-1 py-1.5 rounded-lg border border-orange-300 text-orange-600 text-sm"
                      data-ocid={`tractors.sell_button.${idx + 1}`}
                    >
                      💰 {(t as any).sell || "Sell"}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(tr.id)}
                  className="flex-1 py-1.5 rounded-lg border border-red-200 text-sm text-red-500"
                  data-ocid={`tractors.delete_button.${idx + 1}`}
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
