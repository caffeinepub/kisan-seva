import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../App";
import type { Party, backendInterface } from "../backend";
import { saveCashFlowEntries } from "../lib/cashFlowUtils";
import { CASH_PARTY_ID } from "../lib/cashParty";

type Props = { actor: backendInterface; onOpenSidebar?: () => void };

function getUdharMap(): Record<string, number> {
  return JSON.parse(localStorage.getItem("ktp_party_udhar") || "{}");
}

function setUdharMap(map: Record<string, number>) {
  localStorage.setItem("ktp_party_udhar", JSON.stringify(map));
}

function getCurrentDateTime(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

type PayMethod = "cash" | "upi" | "split";

export default function PaymentInPage({ actor, onOpenSidebar }: Props) {
  const { t, goBack, darkMode } = useApp();
  const [parties, setParties] = useState<Party[]>([]);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [amount, setAmount] = useState("");
  const [discount, setDiscount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PayMethod>("cash");
  const [splitCash, setSplitCash] = useState("");
  const [splitUpi, setSplitUpi] = useState("");
  const [dateTime, setDateTime] = useState(getCurrentDateTime());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    actor.getAllParties().then((fetched) => {
      const localRaw = localStorage.getItem("ktp_saved_parties");
      const local: Party[] = localRaw ? JSON.parse(localRaw) : [];
      const merged = [...fetched];
      for (const lp of local) {
        if (!merged.find((p) => p.id.toString() === lp.id.toString())) {
          merged.push(lp);
        }
      }
      setParties(merged.filter((p) => p.id.toString() !== CASH_PARTY_ID));
    });
  }, [actor]);

  const filtered = search
    ? parties.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.phone?.includes(search),
      )
    : parties;

  const handleSelectParty = (p: Party) => {
    setSelectedParty(p);
    setSearch(p.name);
    setShowDropdown(false);
  };

  // Auto-sum split
  const splitTotal = (Number(splitCash) || 0) + (Number(splitUpi) || 0);

  const handleSave = () => {
    if (!selectedParty) {
      toast.error((t as any).selectPartyFirst || "Please select a customer");
      return;
    }
    const disc = Number(discount) || 0;

    let totalAmt: number;
    let cashAmt = 0;
    let upiAmt = 0;

    if (paymentMethod === "split") {
      cashAmt = Number(splitCash) || 0;
      upiAmt = Number(splitUpi) || 0;
      totalAmt = cashAmt + upiAmt;
      if (totalAmt <= 0) {
        toast.error((t as any).amountRequiredMsg || "Enter payment amount");
        return;
      }
    } else {
      totalAmt = Number(amount);
      if (totalAmt <= 0) {
        toast.error((t as any).amountRequiredMsg || "Enter payment amount");
        return;
      }
      if (paymentMethod === "cash") cashAmt = totalAmt;
      else upiAmt = totalAmt;
    }

    setSaving(true);

    // Update party udhar
    const udharMap = getUdharMap();
    const partyId = selectedParty.id.toString();
    const currentDue = udharMap[partyId] || 0;
    const netReceived = totalAmt - disc;
    const newDue = currentDue - netReceived;
    udharMap[partyId] = newDue;
    setUdharMap(udharMap);

    // Dates
    const dt = new Date(dateTime);
    const dateStr = dt.toISOString().split("T")[0];
    const timeStr = dt.toLocaleTimeString("en-IN", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
    });

    // Save to unified cash flow
    const cfEntries: import("../lib/cashFlowUtils").CashFlowEntry[] = [];
    if (cashAmt > 0) {
      cfEntries.push({
        id: `cf_payin_${Date.now()}_c`,
        date: dateStr,
        time: timeStr,
        partyName: selectedParty.name,
        label: `Payment In - ${selectedParty.name}`,
        amount: cashAmt - (paymentMethod === "cash" ? disc : 0),
        paymentMethod: "cash" as const,
        type: "in" as const,
        source: "payment_in" as const,
      });
    }
    if (upiAmt > 0) {
      cfEntries.push({
        id: `cf_payin_${Date.now()}_u`,
        date: dateStr,
        time: timeStr,
        partyName: selectedParty.name,
        label: `Payment In - ${selectedParty.name}`,
        amount: upiAmt - (paymentMethod === "upi" ? disc : 0),
        paymentMethod: "upi" as const,
        type: "in" as const,
        source: "payment_in" as const,
      });
    }
    if (cfEntries.length > 0) saveCashFlowEntries(cfEntries);

    // Save to ktp_saved_transactions
    const txEntry = {
      id: `payin_${Date.now()}`,
      date: dateStr,
      time: timeStr,
      partyId,
      partyName: selectedParty.name,
      partyMobile: selectedParty.phone || "",
      workType: "Payment In",
      hours: 0,
      minutes: 0,
      rate: 0,
      amount: totalAmt,
      discount: disc,
      receivedAmount: netReceived,
      paymentMethod,
      splitCash: cashAmt,
      splitUpi: upiAmt,
      txType: "payment_in",
    };
    const existingTx: unknown[] = JSON.parse(
      localStorage.getItem("ktp_saved_transactions") || "[]",
    );
    existingTx.unshift(txEntry);
    localStorage.setItem("ktp_saved_transactions", JSON.stringify(existingTx));

    toast.success((t as any).savedSuccess || "Payment saved!");

    // Reset form
    setSelectedParty(null);
    setSearch("");
    setAmount("");
    setDiscount("");
    setSplitCash("");
    setSplitUpi("");
    setPaymentMethod("cash");
    setDateTime(getCurrentDateTime());
    setSaving(false);
  };

  const darkBg = darkMode
    ? "bg-gray-900 text-white"
    : "bg-gray-50 text-gray-900";
  const cardBg = darkMode
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-gray-200";
  const inputCls = darkMode
    ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
    : "bg-white border-gray-300 text-gray-900";

  return (
    <div className={`min-h-screen flex flex-col ${darkBg}`}>
      {/* Header */}
      <header
        className={`flex items-center gap-3 px-4 py-3 shadow-sm sticky top-0 z-10 ${
          darkMode ? "bg-gray-800" : "bg-green-600"
        }`}
      >
        <button
          type="button"
          onClick={goBack}
          className="text-white p-1"
          data-ocid="payment_in.link"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-white font-semibold text-lg flex-1">
          {(t as any).paymentReceive || "ચૂકવણી લો"}
        </h1>
        {onOpenSidebar && (
          <button
            type="button"
            onClick={onOpenSidebar}
            className="text-white p-1"
          >
            <Menu size={22} />
          </button>
        )}
      </header>

      {/* Form */}
      <main className="flex-1 p-4 space-y-4 overflow-y-auto pb-32">
        {/* Customer search */}
        <div className={`rounded-xl border p-4 space-y-2 ${cardBg}`}>
          <Label className="font-medium">
            {(t as any).customerName || "ગ્રાહકનું નામ"} *
          </Label>
          <div className="relative">
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowDropdown(true);
                if (!e.target.value) setSelectedParty(null);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder={(t as any).searchParty || "Search customer..."}
              className={inputCls}
              data-ocid="payment_in.search_input"
            />
            {showDropdown && filtered.length > 0 && (
              <div
                className={`absolute top-full left-0 right-0 z-20 border rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1 ${
                  darkMode
                    ? "bg-gray-800 border-gray-600"
                    : "bg-white border-gray-200"
                }`}
              >
                {filtered.map((p) => {
                  const udharMap = getUdharMap();
                  const due =
                    (udharMap[p.id.toString()] || 0) +
                    Number(p.creditBalance || 0);
                  return (
                    <div
                      key={p.id.toString()}
                      className={`px-3 py-2 cursor-pointer flex justify-between items-center ${
                        darkMode ? "hover:bg-gray-700" : "hover:bg-green-50"
                      }`}
                      onMouseDown={() => handleSelectParty(p)}
                    >
                      <span className="font-medium">{p.name}</span>
                      {due > 0 && (
                        <span className="text-xs text-red-500 font-semibold">
                          ₹{due} {(t as any).due || "due"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {selectedParty && (
            <p className="text-xs text-green-600 dark:text-green-400">
              ✓ {selectedParty.name}{" "}
              {selectedParty.phone ? `(${selectedParty.phone})` : ""}
            </p>
          )}
        </div>

        {/* Payment Method */}
        <div className={`rounded-xl border p-4 space-y-3 ${cardBg}`}>
          <Label className="font-medium">
            {(t as any).paymentMethod || "ચૂકવણી પદ્ધતિ"}
          </Label>
          <div className="flex gap-2">
            {(["cash", "upi", "split"] as PayMethod[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPaymentMethod(m)}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  paymentMethod === m
                    ? m === "cash"
                      ? "bg-green-600 text-white shadow-md"
                      : m === "upi"
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-purple-600 text-white shadow-md"
                    : darkMode
                      ? "bg-gray-700 text-gray-300 border border-gray-600"
                      : "bg-gray-100 text-gray-600 border border-gray-200"
                }`}
                data-ocid="payment_in.toggle"
              >
                {m === "cash"
                  ? `💵 ${(t as any).totalCash || "Cash"}`
                  : m === "upi"
                    ? "📱 UPI"
                    : "🔀 Split"}
              </button>
            ))}
          </div>

          {/* Amount fields based on method */}
          {paymentMethod === "split" ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-500">💵 Cash (₹)</Label>
                  <Input
                    type="number"
                    value={splitCash}
                    onChange={(e) => setSplitCash(e.target.value)}
                    placeholder="0"
                    className={inputCls}
                    data-ocid="payment_in.input"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">📱 UPI (₹)</Label>
                  <Input
                    type="number"
                    value={splitUpi}
                    onChange={(e) => setSplitUpi(e.target.value)}
                    placeholder="0"
                    className={inputCls}
                    data-ocid="payment_in.input"
                  />
                </div>
              </div>
              {splitTotal > 0 && (
                <p className="text-xs text-green-600 font-medium">
                  Total: ₹{splitTotal}
                </p>
              )}
            </div>
          ) : (
            <div>
              <Label className="text-xs text-gray-500">
                {(t as any).paymentAmount || "Amount"} *
              </Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="₹ 0"
                className={inputCls}
                data-ocid="payment_in.input"
              />
            </div>
          )}
        </div>

        {/* Discount */}
        <div className={`rounded-xl border p-4 space-y-2 ${cardBg}`}>
          <Label className="font-medium">
            {(t as any).discount || "Discount (₹)"}
          </Label>
          <Input
            type="number"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="₹ 0"
            className={inputCls}
            data-ocid="payment_in.input"
          />
        </div>

        {/* Date & Time */}
        <div className={`rounded-xl border p-4 space-y-2 ${cardBg}`}>
          <Label className="font-medium">
            {(t as any).dateTime || "Date & Time"}
          </Label>
          <Input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className={inputCls}
            data-ocid="payment_in.input"
          />
        </div>
      </main>

      {/* Save Button */}
      <div
        className={`fixed bottom-0 left-0 right-0 p-4 border-t ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 text-lg font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl"
          data-ocid="payment_in.submit_button"
        >
          {saving ? "..." : (t as any).save || "સાચવો"}
        </Button>
      </div>
    </div>
  );
}
