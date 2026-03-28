import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Menu, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../App";
import type { Party, backendInterface } from "../backend";
import { CASH_PARTY_ID } from "../lib/cashParty";

type Props = { actor: backendInterface; onOpenSidebar?: () => void };

interface SavedTx {
  id: string;
  date: string;
  time: string;
  partyId: string;
  partyName: string;
  partyMobile: string;
  workType: string;
  hours: number;
  minutes: number;
  rate: number;
  amount: number;
  discount: number;
  receivedAmount: number;
  paymentMethod: string;
  txType: string;
}

function fmt12(dateStr: string, timeStr: string): string {
  try {
    const dt = new Date(`${dateStr}T${timeStr}`);
    return dt.toLocaleString("default", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    });
  } catch {
    return dateStr;
  }
}

function PartyDetailView({
  party,
  onBack,
}: { party: Party; onBack: () => void }) {
  const udharMap: Record<string, number> = JSON.parse(
    localStorage.getItem("ktp_party_udhar") || "{}",
  );
  const totalDue =
    Number(party.creditBalance) + (udharMap[party.id.toString()] || 0);
  const businessName =
    localStorage.getItem("ktp_business_name") || "Kisan Seva";
  const businessMobile = localStorage.getItem("ktp_business_mobile") || "";

  const allTxns: SavedTx[] = JSON.parse(
    localStorage.getItem("ktp_saved_transactions") || "[]",
  );
  const partyTxns = allTxns.filter((tx) => tx.partyId === party.id.toString());

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minAmt, setMinAmt] = useState("");
  const [maxAmt, setMaxAmt] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = partyTxns.filter((tx) => {
    if (dateFrom && tx.date < dateFrom) return false;
    if (dateTo && tx.date > dateTo) return false;
    if (minAmt && tx.amount < Number(minAmt)) return false;
    if (maxAmt && tx.amount > Number(maxAmt)) return false;
    return true;
  });

  const sendReminder = (via: "whatsapp" | "sms") => {
    const msg = `Namaskar ${party.name}, aapka ₹${totalDue} baaki hai. Kripya jald payment karein. ${businessName} ${businessMobile} — Kisan Seva`;
    const cleanMobile = party.phone.replace(/\D/g, "").slice(-10);
    if (via === "whatsapp") {
      window.open(
        `https://wa.me/91${cleanMobile}?text=${encodeURIComponent(msg)}`,
        "_blank",
      );
    } else {
      window.open(
        `sms:${cleanMobile}?body=${encodeURIComponent(msg)}`,
        "_self",
      );
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-800">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-green-700 text-white px-4 py-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="font-bold text-base">{party.name}</div>
            <div className="text-xs text-green-200">{party.phone}</div>
          </div>
          {totalDue > 0 && (
            <div className="text-right">
              <div className="text-xs text-green-200">Due</div>
              <div className="font-bold text-lg">₹{totalDue}</div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Party Info */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border p-4 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-bold text-gray-900 dark:text-gray-100">
                {party.name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                {party.phone}
              </div>
              {party.address && (
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  {party.address}
                </div>
              )}
            </div>
            {totalDue > 0 && (
              <div className="text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                  Total Due
                </div>
                <div className="text-xl font-bold text-red-600">
                  ₹{totalDue}
                </div>
              </div>
            )}
          </div>

          {/* Reminder Buttons */}
          {totalDue > 0 && party.phone && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-2">
                Send Payment Reminder:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => sendReminder("whatsapp")}
                  className="py-2 bg-green-500 text-white rounded-xl text-sm font-semibold"
                >
                  📱 WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => sendReminder("sms")}
                  className="py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold"
                >
                  💬 SMS
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Transactions Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">
            Transactions ({partyTxns.length})
          </h3>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="text-xs text-green-700 border border-green-200 px-3 py-1.5 rounded-lg"
          >
            🔍 Filter
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border p-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1 block">
                  From Date
                </Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1 block">
                  To Date
                </Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1 block">
                  Min Amount (₹)
                </Label>
                <Input
                  type="number"
                  value={minAmt}
                  onChange={(e) => setMinAmt(e.target.value)}
                  placeholder="0"
                  className="text-xs"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1 block">
                  Max Amount (₹)
                </Label>
                <Input
                  type="number"
                  value={maxAmt}
                  onChange={(e) => setMaxAmt(e.target.value)}
                  placeholder="Any"
                  className="text-xs"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setMinAmt("");
                setMaxAmt("");
              }}
              className="text-xs text-red-500 underline"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Transaction List */}
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-gray-500">
            <p>No transactions found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((tx, i) => {
              const balance = Math.max(
                0,
                tx.amount - tx.receivedAmount - tx.discount,
              );
              return (
                <div
                  key={`${tx.id}-${i}`}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold text-green-700 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                          {tx.id}
                        </span>
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 dark:text-gray-500 px-2 py-0.5 rounded-full capitalize">
                          {tx.paymentMethod}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                        {fmt12(tx.date, tx.time)}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mt-0.5">
                        {tx.workType}
                      </p>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <div className="font-bold text-gray-900 dark:text-gray-100">
                        ₹{tx.amount}
                      </div>
                      <div className="text-xs text-blue-600">
                        Rcvd: ₹{tx.receivedAmount}
                      </div>
                      {balance > 0 && (
                        <div className="text-xs text-red-500 font-medium">
                          Due: ₹{balance}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PartiesPage({ actor, onOpenSidebar }: Props) {
  const { t, goBack } = useApp();
  const [parties, setParties] = useState<Party[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [editId, setEditId] = useState<bigint | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);

  const load = async () => {
    setParties(await actor.getAllParties());
  };
  // biome-ignore lint/correctness/useExhaustiveDependencies: actor is stable
  useEffect(() => {
    load();
  }, [actor]);

  // Filter out Cash party from display
  const displayParties = parties.filter(
    (p) => p.id.toString() !== CASH_PARTY_ID,
  );

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error(t.nameRequiredMsg);
      return;
    }
    if (!form.phone.trim()) {
      toast.error(t.mobileRequiredMsg);
      return;
    }
    setSaving(true);
    try {
      if (editId !== null) {
        await actor.updateParty(editId, form.name, form.phone, form.address);
        toast.success(t.updatedMsg);
      } else {
        await actor.createParty(form.name, form.phone, form.address);
        toast.success(t.partyAddedMsg);
      }
      setShowForm(false);
      setForm({ name: "", phone: "", address: "" });
      setEditId(null);
      await load();
    } catch {
      toast.error(t.errorSavingMsg);
    }
    setSaving(false);
  };

  const handleDelete = async (id: bigint) => {
    if (!confirm("Delete?")) return;
    await actor.deleteParty(id);
    toast.success(t.deletedMsg);
    await load();
  };

  if (selectedParty) {
    return (
      <PartyDetailView
        party={selectedParty}
        onBack={() => setSelectedParty(null)}
      />
    );
  }

  if (showForm) {
    return (
      <div className="flex flex-col min-h-full bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b">
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setEditId(null);
              setForm({ name: "", phone: "", address: "" });
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">{editId ? t.edit : t.addParty}</h1>
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
            <Label>
              {t.phone} * <span className="text-red-500">(required)</span>
            </Label>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
              placeholder={t.mobilePlaceholder}
            />
          </div>
          <div>
            <Label>{t.address}</Label>
            <Textarea
              value={form.address}
              onChange={(e) =>
                setForm((f) => ({ ...f, address: e.target.value }))
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
    <div className="flex flex-col min-h-full bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            className="p-1"
            data-ocid="parties.back.button"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            type="button"
            onClick={onOpenSidebar}
            className="p-1"
            data-ocid="parties.menu.button"
          >
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="font-bold text-lg text-gray-900 dark:text-gray-100">
            {t.parties}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 bg-green-700 text-white px-3 py-2 rounded-xl text-sm font-semibold"
          data-ocid="parties.add.primary_button"
        >
          <Plus className="w-4 h-4" /> {t.addParty}
        </button>
      </div>
      <div className="p-4 flex flex-col gap-3">
        {displayParties.length === 0 && (
          <p className="text-gray-400 dark:text-gray-500 text-center py-12">
            {t.noData}
          </p>
        )}
        {displayParties.map((p) => {
          const udharMap: Record<string, number> = JSON.parse(
            localStorage.getItem("ktp_party_udhar") || "{}",
          );
          const totalDue =
            Number(p.creditBalance) + (udharMap[p.id.toString()] || 0);
          return (
            <div
              key={p.id.toString()}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden"
            >
              {/* Clickable card body */}
              <button
                type="button"
                onClick={() => setSelectedParty(p)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {p.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                      {p.phone}
                    </div>
                    {p.address && (
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {p.address}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {totalDue > 0 && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                        ₹{totalDue} {t.pendingDues}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      Tap to view →
                    </span>
                  </div>
                </div>
              </button>
              <div className="flex gap-2 px-4 pb-3">
                <button
                  type="button"
                  onClick={() => {
                    setForm({
                      name: p.name,
                      phone: p.phone,
                      address: p.address,
                    });
                    setEditId(p.id);
                    setShowForm(true);
                  }}
                  className="flex-1 py-1.5 rounded-lg border text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500"
                >
                  {t.edit}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  className="flex-1 py-1.5 rounded-lg border border-red-200 text-sm text-red-500"
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
