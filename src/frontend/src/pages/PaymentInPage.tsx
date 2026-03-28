import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../App";
import type { Party, backendInterface } from "../backend";
import { CASH_PARTY_ID } from "../lib/cashParty";

type Props = { actor: backendInterface; onOpenSidebar?: () => void };

function getUdharMap(): Record<string, number> {
  return JSON.parse(localStorage.getItem("ktp_party_udhar") || "{}");
}

function setUdharMap(map: Record<string, number>) {
  localStorage.setItem("ktp_party_udhar", JSON.stringify(map));
}

export default function PaymentInPage({ actor, onOpenSidebar }: Props) {
  const { setPage } = useApp();
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [receiveAmount, setReceiveAmount] = useState("");
  const [discount, setDiscount] = useState("");
  const [saving, setSaving] = useState(false);
  const [paidSuccess, setPaidSuccess] = useState(false);

  useEffect(() => {
    actor.getAllParties().then(setParties);
  }, [actor]);

  const udharMap = getUdharMap();
  const partiesWithDue = parties
    .filter((p) => p.id.toString() !== CASH_PARTY_ID)
    .map((p) => ({
      ...p,
      totalDue: Number(p.creditBalance) + (udharMap[p.id.toString()] || 0),
    }))
    .filter((p) => p.totalDue > 0)
    .sort((a, b) => b.totalDue - a.totalDue);

  const handlePaymentReceive = () => {
    if (!selectedParty) return;
    const amt = Number(receiveAmount) || 0;
    const disc = Number(discount) || 0;
    const totalReduction = amt + disc;
    if (totalReduction <= 0) {
      toast.error("Amount required");
      return;
    }
    setSaving(true);
    const map = getUdharMap();
    const partyKey = selectedParty.id.toString();
    const currentDue =
      (map[partyKey] || 0) + Number(selectedParty.creditBalance);
    const newDue = Math.max(0, currentDue - totalReduction);
    // Store adjusted udhar (subtracting backend creditBalance)
    const backendBalance = Number(selectedParty.creditBalance);
    map[partyKey] = Math.max(0, newDue - backendBalance);
    setUdharMap(map);

    // Save to ktp_saved_transactions as a payment-in record
    const savedTxns: object[] = JSON.parse(
      localStorage.getItem("ktp_saved_transactions") || "[]",
    );
    const businessName =
      localStorage.getItem("ktp_business_name") || "Kisan Seva";
    savedTxns.unshift({
      id: `#PMT-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      time: `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`,
      partyId: partyKey,
      partyName: selectedParty.name,
      partyMobile: selectedParty.phone,
      partyAddress: selectedParty.address,
      workType: "Payment Received",
      hours: 0,
      minutes: 0,
      rate: 0,
      amount: amt,
      discount: disc,
      receivedAmount: amt,
      paymentMethod: "cash",
      txType: "payment_in",
    });
    localStorage.setItem("ktp_saved_transactions", JSON.stringify(savedTxns));

    toast.success(`₹${amt} received from ${selectedParty.name}`);
    setPaidSuccess(true);
    setSaving(false);

    // WhatsApp receipt option
    const _businessMobile = localStorage.getItem("ktp_business_mobile") || "";
    const msg = `✅ Payment Received\n${businessName}\n\nParty: ${selectedParty.name}\nReceived: ₹${amt}${disc ? `\nDiscount: ₹${disc}` : ""}\nRemaining Due: ₹${Math.max(0, currentDue - totalReduction)}\n\n— Kisan Seva`;

    if (selectedParty.phone) {
      const cleanMobile = selectedParty.phone.replace(/\D/g, "").slice(-10);
      const whatsappUrl = `https://wa.me/91${cleanMobile}?text=${encodeURIComponent(msg)}`;
      // Auto-open WhatsApp after a short delay
      setTimeout(() => {
        if (confirm("Send receipt on WhatsApp?")) {
          window.open(whatsappUrl, "_blank");
        }
      }, 300);
    }
  };

  const handleReset = () => {
    setSelectedParty(null);
    setReceiveAmount("");
    setDiscount("");
    setPaidSuccess(false);
  };

  const sendReminder = (p: (typeof partiesWithDue)[0]) => {
    const businessName =
      localStorage.getItem("ktp_business_name") || "Kisan Seva";
    const _businessMobile = localStorage.getItem("ktp_business_mobile") || "";
    const msg = `Namaskar ${p.name}, aapka ₹${p.totalDue} baaki hai. Kripya jald payment karein. ${businessName} ${_businessMobile} — Kisan Seva`;
    if (p.phone) {
      const cleanMobile = p.phone.replace(/\D/g, "").slice(-10);
      window.open(
        `https://wa.me/91${cleanMobile}?text=${encodeURIComponent(msg)}`,
        "_blank",
      );
    } else {
      navigator.clipboard.writeText(msg);
      toast.success("Copied!");
    }
  };

  // Detail view for a selected party
  if (selectedParty) {
    const udhar = getUdharMap();
    const totalDue =
      Number(selectedParty.creditBalance) +
      (udhar[selectedParty.id.toString()] || 0);
    const amt = Number(receiveAmount) || 0;
    const disc = Number(discount) || 0;
    const remaining = Math.max(0, totalDue - amt - disc);

    return (
      <div className="flex flex-col min-h-full bg-gray-50">
        <div className="sticky top-0 z-30 bg-green-700 text-white px-4 py-3 flex items-center gap-3">
          <button type="button" onClick={handleReset}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="font-bold text-base">{selectedParty.name}</div>
            <div className="text-xs text-green-200">{selectedParty.phone}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-green-200">Total Due</div>
            <div className="font-bold text-lg">₹{totalDue}</div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {paidSuccess ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-3">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
              <div className="font-bold text-green-800 text-lg">
                Payment Received!
              </div>
              <div className="text-sm text-gray-600">
                ₹{receiveAmount} received from {selectedParty.name}
              </div>
              <div className="text-sm font-medium text-gray-700">
                Remaining Due: ₹{remaining}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="py-3 rounded-xl bg-green-600 text-white font-semibold text-sm"
                >
                  Next Payment
                </button>
                <button
                  type="button"
                  onClick={() => setPage("home")}
                  className="py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm"
                >
                  Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Party Info Card */}
              <div className="bg-white rounded-2xl border p-4 space-y-1">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-gray-900">
                      {selectedParty.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedParty.phone}
                    </div>
                    {selectedParty.address && (
                      <div className="text-xs text-gray-400">
                        {selectedParty.address}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Total Due</div>
                    <div className="text-2xl font-bold text-red-600">
                      ₹{totalDue}
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount to Receive */}
              <div className="bg-white rounded-2xl border p-4 space-y-3">
                <div className="font-semibold text-gray-800">
                  Receive Payment
                </div>
                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">
                    Amount Received (₹) *
                  </Label>
                  <Input
                    type="number"
                    value={receiveAmount}
                    onChange={(e) => setReceiveAmount(e.target.value)}
                    placeholder="0"
                    className="text-lg font-bold border-2 border-green-300 focus:border-green-500"
                    autoFocus
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">
                    Discount (₹)
                  </Label>
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="0"
                  />
                </div>

                {/* Quick Amount Buttons */}
                {totalDue > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs text-gray-500 w-full">Quick:</span>
                    {[
                      totalDue,
                      Math.round(totalDue / 2),
                      Math.round(totalDue / 4),
                    ]
                      .filter((v, i, a) => a.indexOf(v) === i && v > 0)
                      .map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setReceiveAmount(String(val))}
                          className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-700"
                        >
                          ₹{val}
                        </button>
                      ))}
                  </div>
                )}

                {/* Remaining Preview */}
                {(amt > 0 || disc > 0) && (
                  <div
                    className={`rounded-xl px-4 py-3 text-center ${remaining <= 0 ? "bg-green-50" : "bg-orange-50"}`}
                  >
                    <span className="text-sm text-gray-500">
                      Remaining Due:{" "}
                    </span>
                    <span
                      className={`text-xl font-bold ${remaining <= 0 ? "text-green-700" : "text-orange-600"}`}
                    >
                      ₹{remaining}
                    </span>
                  </div>
                )}

                <Button
                  onClick={handlePaymentReceive}
                  disabled={saving || !receiveAmount}
                  className="w-full py-4 text-base font-bold rounded-2xl bg-green-600 hover:bg-green-700 text-white"
                >
                  {saving ? "Saving..." : "✓ Mark as Received"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-green-700 text-white px-4 py-3 flex items-center gap-3">
        <button type="button" onClick={onOpenSidebar} className="p-1">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-lg flex-1">💰 Payment In</h1>
        <button
          type="button"
          onClick={() => setPage("home")}
          className="text-xs text-green-200 underline"
        >
          Dashboard
        </button>
      </div>

      <div className="p-4 space-y-3">
        {partiesWithDue.length === 0 ? (
          <div className="text-center py-16 text-gray-400 space-y-2">
            <CheckCircle className="w-12 h-12 mx-auto text-green-400" />
            <p className="font-medium text-gray-600">No pending dues!</p>
            <p className="text-sm">All parties are up to date.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-500 font-medium">
              {partiesWithDue.length} parties with pending dues — tap to receive
              payment
            </p>
            {partiesWithDue.map((p) => (
              <div
                key={p.id.toString()}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setSelectedParty(p)}
                  className="w-full p-4 text-left flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-gray-900">{p.name}</div>
                    <div className="text-sm text-gray-500">{p.phone}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Due</div>
                    <div className="text-xl font-bold text-red-600">
                      ₹{p.totalDue}
                    </div>
                  </div>
                </button>
                <div className="px-4 pb-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedParty(p)}
                    className="flex-1 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold"
                  >
                    Receive Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => sendReminder(p)}
                    className="px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-semibold"
                  >
                    📱 Remind
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
