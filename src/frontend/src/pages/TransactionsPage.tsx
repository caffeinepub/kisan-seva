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
import { ArrowLeft, Camera, Menu, Mic, Share2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../App";
import {
  BookingStatus,
  type Driver,
  type Party,
  PaymentMethod,
  type Tractor,
  type backendInterface,
} from "../backend";
import PartySelector from "../components/PartySelector";
import { saveCashFlowEntries } from "../lib/cashFlowUtils";
import { CASH_PARTY_ID } from "../lib/cashParty";
import { getStoredServices } from "./ServicesPage";

type Props = {
  actor: backendInterface;
  onOpenSidebar?: () => void;
  prefill?: {
    partyId: string;
    partyName: string;
    serviceType: string;
    bookingRef?: string;
  } | null;
  onClearPrefill?: () => void;
};

type TransactionType = "cash" | "credit";

interface InvoiceData {
  txNumber: string;
  date: string;
  time: string;
  partyName: string;
  partyMobile: string;
  partyAddress: string;
  workType: string;
  hours: number;
  minutes: number;
  rate: number;
  amount: number;
  discount: number;
  receivedAmount: number;
  paymentMethod: PaymentMethod;
  splitCash: string;
  splitUpi: string;
  businessName: string;
  businessMobile: string;
  partyId: string;
}

// Shared global counter for transactions and bookings
export function peekNextGlobalCounter(): number {
  return (
    Number.parseInt(localStorage.getItem("ktp_global_counter") || "0", 10) + 1
  );
}

export function getNextGlobalCounter(): number {
  const current = Number.parseInt(
    localStorage.getItem("ktp_global_counter") || "0",
    10,
  );
  const next = current + 1;
  localStorage.setItem("ktp_global_counter", String(next));
  return next;
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
      year: "numeric",
    });
  } catch {
    return `${dateStr} ${timeStr}`;
  }
}

function methodLabel(m: PaymentMethod): string {
  switch (m) {
    case PaymentMethod.cash:
      return "Cash";
    case PaymentMethod.upi:
      return "UPI";
    case PaymentMethod.split:
      return "Split";
    default:
      return "Cash";
  }
}

function InvoiceModal({
  data,
  onClose,
  onNew,
}: { data: InvoiceData; onClose: () => void; onNew: () => void }) {
  const balanceDue = Math.max(
    0,
    data.amount - data.discount - data.receivedAmount,
  );
  const dateTimeStr = fmt12(data.date, data.time);
  const hoursMinStr = `${data.hours}h ${data.minutes}m`;

  const invoiceText = `🧾 *${data.txNumber}*
${data.businessName}
📞 ${data.businessMobile}

Party: ${data.partyName}
Mobile: ${data.partyMobile || "-"}
Date: ${dateTimeStr}
Service: ${data.workType} | ${hoursMinStr} @ ₹${data.rate}/hr

Total: ₹${data.amount}${data.discount ? `\nDiscount: ₹${data.discount}` : ""}
Received: ₹${data.receivedAmount}
*Balance Due: ₹${balanceDue}*

Payment: ${methodLabel(data.paymentMethod)}${data.paymentMethod === PaymentMethod.split ? `\n  Cash: ₹${data.splitCash || 0} | UPI: ₹${data.splitUpi || 0}` : ""}

— Kisan Seva`;

  const hasMobile =
    data.partyMobile &&
    data.partyMobile.length >= 10 &&
    data.partyId !== CASH_PARTY_ID;
  const cleanMobile = data.partyMobile.replace(/\D/g, "").slice(-10);

  const handleWhatsApp = () => {
    const url = `https://wa.me/91${cleanMobile}?text=${encodeURIComponent(invoiceText)}`;
    window.open(url, "_blank");
  };

  const handleSms = () => {
    const url = `sms:${cleanMobile}?body=${encodeURIComponent(invoiceText)}`;
    window.open(url, "_self");
  };

  const handleCopy = () => {
    navigator.clipboard
      .writeText(invoiceText)
      .then(() => toast.success("Copied!"));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-t-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-green-700 text-white px-4 py-3 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="font-bold text-base">🧾 Invoice / बिल</h2>
            <p className="text-xs text-green-200">{data.txNumber}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Content */}
        <div className="p-4 space-y-3">
          {/* Business Info */}
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-100 rounded-xl p-3">
            <div className="font-bold text-green-800 text-sm">
              {data.businessName}
            </div>
            <div className="text-xs text-green-600">
              📞 {data.businessMobile}
            </div>
          </div>

          {/* Party & Date */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 space-y-1">
            <div className="grid grid-cols-2 gap-1 text-sm">
              <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">
                Party:
              </span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {data.partyName}
              </span>
              {data.partyMobile && (
                <>
                  <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">
                    Mobile:
                  </span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {data.partyMobile}
                  </span>
                </>
              )}
              {data.partyAddress && (
                <>
                  <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">
                    Address:
                  </span>
                  <span className="text-gray-900 dark:text-gray-100 text-xs">
                    {data.partyAddress}
                  </span>
                </>
              )}
              <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">
                Date:
              </span>
              <span className="text-gray-900 dark:text-gray-100 text-xs">
                {dateTimeStr}
              </span>
            </div>
          </div>

          {/* Service Details */}
          <div className="bg-blue-50 rounded-xl p-3 space-y-1">
            <div className="font-semibold text-blue-800 text-sm mb-1">
              Service Details
            </div>
            <div className="grid grid-cols-2 gap-1 text-sm">
              <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">
                Service:
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {data.workType}
              </span>
              <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">
                Time:
              </span>
              <span className="text-gray-900 dark:text-gray-100">
                {hoursMinStr}
              </span>
              {data.rate > 0 && (
                <>
                  <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">
                    Rate:
                  </span>
                  <span className="text-gray-900 dark:text-gray-100">
                    ₹{data.rate}/hr
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-2">
            <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
              Payment Summary
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">
                Total Amount:
              </span>
              <span className="font-bold text-gray-900 dark:text-gray-100">
                ₹{data.amount}
              </span>
            </div>
            {data.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">
                  Discount:
                </span>
                <span className="text-green-600">- ₹{data.discount}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">
                Received:
              </span>
              <span className="text-blue-700 font-medium">
                ₹{data.receivedAmount}
              </span>
            </div>
            {data.paymentMethod === PaymentMethod.split && (
              <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 ml-2">
                Cash: ₹{data.splitCash || 0} | UPI: ₹{data.splitUpi || 0}
              </div>
            )}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between">
              <span className="font-bold text-gray-800 dark:text-gray-200">
                Balance Due:
              </span>
              <span
                className={`font-bold text-lg ${balanceDue > 0 ? "text-red-600" : "text-green-600"}`}
              >
                ₹{balanceDue}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">
                Method:
              </span>
              <span className="font-medium">
                {methodLabel(data.paymentMethod)}
              </span>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 font-medium flex items-center gap-1">
              <Share2 className="w-3 h-3" /> Share Invoice:
            </p>
            {hasMobile ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="bg-green-500 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                >
                  📱 WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleSms}
                  className="bg-blue-500 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                >
                  💬 SMS
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleCopy}
                className="w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl text-sm font-semibold"
              >
                📋 Copy Invoice
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-gray-500"
            >
              Close
            </button>
            <button
              type="button"
              onClick={onNew}
              className="py-3 rounded-xl bg-green-600 text-white text-sm font-semibold"
            >
              + New Transaction
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TransactionsPage({
  actor,
  onOpenSidebar,
  prefill,
  onClearPrefill,
}: Props) {
  const { t, goBack } = useApp();
  const [parties, setParties] = useState<Party[]>([]);
  const [tractors, setTractors] = useState<Tractor[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

  const [workTypes] = useState(() => getStoredServices());

  const [txType, setTxType] = useState<TransactionType>("cash");
  const [partyId, setPartyId] = useState("");
  const [partyMobile, setPartyMobile] = useState("");
  const [txNumber, setTxNumber] = useState("");
  const txNumberGeneratedRef = useRef(false);
  const txNumberCounterRef = useRef(0);
  const [workType, setWorkType] = useState(
    () => workTypes[0]?.name || "Ploughing",
  );
  const [tractorId, setTractorId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [amount, setAmount] = useState("");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [discount, setDiscount] = useState("");
  const [splitCash, setSplitCash] = useState("");
  const [splitUpi, setSplitUpi] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.cash,
  );
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });

  const isCashParty = partyId === CASH_PARTY_ID;

  const load = async () => {
    const [pa, tr, dr] = await Promise.all([
      actor.getAllParties(),
      actor.getAllTractors(),
      actor.getAllDrivers(),
    ]);
    setParties(pa);
    setTractors(tr);
    setDrivers(dr);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: actor is stable
  useEffect(() => {
    load();
  }, [actor]);

  // Auto-select Cash party when txType is "cash"
  useEffect(() => {
    if (txType === "cash") {
      setPartyId(CASH_PARTY_ID);
    } else {
      setPartyId((prev) => (prev === CASH_PARTY_ID ? "" : prev));
    }
  }, [txType]);

  // Auto-fill mobile from selected party
  useEffect(() => {
    if (!partyId || partyId === CASH_PARTY_ID) {
      setPartyMobile("");
      return;
    }
    const party = parties.find((p) => p.id.toString() === partyId);
    if (party) setPartyMobile(party.phone || "");
  }, [partyId, parties]);

  // Auto-generate transaction number when party first selected (using shared global counter)
  useEffect(() => {
    if (partyId && !txNumberGeneratedRef.current) {
      txNumberGeneratedRef.current = true;
      const counter = peekNextGlobalCounter();
      txNumberCounterRef.current = counter;
      setTxNumber(`#TXN-${String(counter).padStart(4, "0")}`);
    } else if (!partyId) {
      txNumberGeneratedRef.current = false;
      setTxNumber("");
    }
  }, [partyId]);

  useEffect(() => {
    if (prefill) {
      setPartyId(prefill.partyId);
      setWorkType(prefill.serviceType);
      setBookingRef(prefill.bookingRef || null);
      onClearPrefill?.();
    }
  }, [prefill, onClearPrefill]);

  useEffect(() => {
    const service = workTypes.find((s) => s.name === workType);
    if (service && service.rate > 0 && (hours > 0 || minutes > 0)) {
      const total = service.rate * hours + (minutes / 60) * service.rate;
      setAmount(String(Math.round(total)));
    }
  }, [workType, hours, minutes, workTypes]);

  useEffect(() => {
    if (paymentMethod === PaymentMethod.split) {
      const total = (Number(splitCash) || 0) + (Number(splitUpi) || 0);
      if (total > 0) setReceivedAmount(String(total));
    }
  }, [splitCash, splitUpi, paymentMethod]);

  // Cash mode: auto-fill received amount from bill amount
  useEffect(() => {
    if (txType === "cash" && paymentMethod !== PaymentMethod.split) {
      const net = Math.max(0, Number(amount) - (Number(discount) || 0));
      if (amount) setReceivedAmount(String(net));
    }
  }, [txType, amount, discount, paymentMethod]);

  const selectedService = workTypes.find((s) => s.name === workType);
  const serviceRate = selectedService?.rate || 0;
  const selectedTractor = tractors.find((tr) => tr.id.toString() === tractorId);

  const resetForm = () => {
    setTxType("cash");
    setPartyMobile("");
    setTxNumber("");
    txNumberGeneratedRef.current = false;
    setWorkType(workTypes[0]?.name || "Ploughing");
    setTractorId("");
    setDriverId("");
    setHours(0);
    setMinutes(0);
    setStartTime("");
    setEndTime("");
    setAmount("");
    setReceivedAmount("");
    setDiscount("");
    setSplitCash("");
    setSplitUpi("");
    setPaymentMethod(PaymentMethod.cash);
    const now = new Date();
    setDate(now.toISOString().slice(0, 10));
    setTime(
      `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    );
    setSavedOnce(false);
  };

  const handleSave = async () => {
    if (!amount) {
      toast.error(t.amountRequiredMsg);
      return;
    }
    setSaving(true);
    try {
      const dateTimeMs = BigInt(new Date(`${date}T${time}`).getTime());
      const amtBig = BigInt(amount || "0");

      let bookingId = BigInt(0);
      if (
        txType === "credit" &&
        partyId &&
        partyId !== "none" &&
        partyId !== CASH_PARTY_ID
      ) {
        const selectedTr =
          tractorId && tractorId !== "none" ? BigInt(tractorId) : BigInt(0);
        const selectedDr =
          driverId && driverId !== "none" ? BigInt(driverId) : BigInt(0);
        const rate = selectedTractor ? selectedTractor.ratePerHour : BigInt(0);
        bookingId = await actor.createBooking(
          selectedTr,
          selectedDr,
          BigInt(partyId),
          workType,
          dateTimeMs,
          BigInt(hours),
          rate,
          BigInt(0),
          paymentMethod,
          "",
        );
        await actor.updateBooking(
          bookingId,
          selectedTr,
          selectedDr,
          BigInt(partyId),
          workType,
          dateTimeMs,
          BigInt(hours),
          rate,
          BigInt(0),
          paymentMethod,
          BookingStatus.completed,
          "",
        );
      }

      const splitNote =
        paymentMethod === PaymentMethod.split
          ? ` | Cash: ₹${splitCash || 0} | UPI: ₹${splitUpi || 0}`
          : "";

      await actor.createPayment(
        bookingId,
        amtBig,
        paymentMethod,
        dateTimeMs,
        `${workType}${discount ? ` | Discount: ₹${discount}` : ""}${receivedAmount ? ` | Received: ₹${receivedAmount}` : ""}${splitNote}`,
      );

      toast.success(t.transactionSavedMsg);

      // Commit the global counter on save
      localStorage.setItem(
        "ktp_global_counter",
        String(txNumberCounterRef.current),
      );

      // Auto-add udhar if partial payment
      const totalAmt = Number(amount);
      const receivedAmt = Number(receivedAmount) || 0;
      const netAmt = Math.max(0, totalAmt - (Number(discount) || 0));
      if (receivedAmt < netAmt && partyId && partyId !== CASH_PARTY_ID) {
        const balance = netAmt - receivedAmt;
        const existingUdhar = JSON.parse(
          localStorage.getItem("ktp_party_udhar") || "{}",
        );
        existingUdhar[partyId] = (existingUdhar[partyId] || 0) + balance;
        localStorage.setItem("ktp_party_udhar", JSON.stringify(existingUdhar));
      }

      // Get party info for invoice
      const selectedParty = parties.find((p) => p.id.toString() === partyId);
      const businessName =
        localStorage.getItem("ktp_business_name") || "Kisan Seva";
      const businessMobile =
        localStorage.getItem("ktp_business_mobile") ||
        localStorage.getItem("ktp_current_user_mobile") ||
        "";

      // Save to ktp_saved_transactions for party detail view
      const savedTxns: object[] = JSON.parse(
        localStorage.getItem("ktp_saved_transactions") || "[]",
      );
      savedTxns.unshift({
        id: txNumber,
        date,
        time,
        partyId,
        partyName: selectedParty?.name || "Cash",
        partyMobile: partyMobile || selectedParty?.phone || "",
        partyAddress: selectedParty?.address || "",
        workType,
        hours,
        minutes,
        rate: serviceRate,
        amount: totalAmt,
        discount: Number(discount) || 0,
        receivedAmount: receivedAmt,
        paymentMethod,
        splitCash: Number(splitCash) || 0,
        splitUpi: Number(splitUpi) || 0,
        txType,
        driverId: driverId && driverId !== "none" ? driverId : "",
      });
      localStorage.setItem("ktp_saved_transactions", JSON.stringify(savedTxns));

      // Save to cash flow
      if (receivedAmt > 0) {
        const cfEntries: import("../lib/cashFlowUtils").CashFlowEntry[] = [];
        const partyLabel = selectedParty?.name || "Cash";
        if (paymentMethod === PaymentMethod.cash) {
          cfEntries.push({
            id: `cf_tx_${Date.now()}_c`,
            date,
            time,
            partyName: partyLabel,
            label: `${workType} - ${partyLabel}`,
            amount: receivedAmt,
            paymentMethod: "cash" as const,
            type: "in" as const,
            source: "transaction" as const,
          });
        } else if (paymentMethod === PaymentMethod.upi) {
          cfEntries.push({
            id: `cf_tx_${Date.now()}_u`,
            date,
            time,
            partyName: partyLabel,
            label: `${workType} - ${partyLabel}`,
            amount: receivedAmt,
            paymentMethod: "upi" as const,
            type: "in" as const,
            source: "transaction" as const,
          });
        } else if (paymentMethod === PaymentMethod.split) {
          const sc = Number(splitCash) || 0;
          const su = Number(splitUpi) || 0;
          if (sc > 0)
            cfEntries.push({
              id: `cf_tx_${Date.now()}_sc`,
              date,
              time,
              partyName: partyLabel,
              label: `${workType} - ${partyLabel}`,
              amount: sc,
              paymentMethod: "cash" as const,
              type: "in" as const,
              source: "transaction" as const,
            });
          if (su > 0)
            cfEntries.push({
              id: `cf_tx_${Date.now()}_su`,
              date,
              time,
              partyName: partyLabel,
              label: `${workType} - ${partyLabel}`,
              amount: su,
              paymentMethod: "upi" as const,
              type: "in" as const,
              source: "transaction" as const,
            });
        }
        if (cfEntries.length > 0) saveCashFlowEntries(cfEntries);
      }

      // Build invoice data and show modal
      setInvoiceData({
        txNumber,
        date,
        time,
        partyName: selectedParty?.name || "Cash",
        partyMobile: partyMobile || selectedParty?.phone || "",
        partyAddress: selectedParty?.address || "",
        workType,
        hours,
        minutes,
        rate: serviceRate,
        amount: totalAmt,
        discount: Number(discount) || 0,
        receivedAmount: receivedAmt,
        paymentMethod,
        splitCash,
        splitUpi,
        businessName,
        businessMobile,
        partyId,
      });
      setShowInvoice(true);
      setSavedOnce(true);
    } catch {
      toast.error(t.errorSavingMsg);
    }
    setSaving(false);
  };

  // Auto-calculate hours/minutes from start/end time
  useEffect(() => {
    if (startTime && endTime) {
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      let totalMin = eh * 60 + em - (sh * 60 + sm);
      if (totalMin < 0) totalMin += 24 * 60; // handle overnight
      if (totalMin > 0) {
        setHours(Math.floor(totalMin / 60));
        setMinutes(totalMin % 60);
      }
    }
  }, [startTime, endTime]);

  const netAmount = Math.max(0, Number(amount) - (Number(discount) || 0));
  const balanceDue = amount
    ? Math.max(0, netAmount - (Number(receivedAmount) || 0))
    : null;

  const isSaveDisabled =
    saving ||
    savedOnce ||
    (txType !== "credit" &&
      paymentMethod !== PaymentMethod.split &&
      !receivedAmount.trim());

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-800">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b flex items-center justify-between px-4 pt-4 pb-3">
        <button
          type="button"
          onClick={goBack}
          className="p-1"
          data-ocid="transactions.back.button"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <button
          type="button"
          onClick={onOpenSidebar}
          className="p-1"
          data-ocid="transactions.menu.button"
        >
          <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <h1 className="font-bold text-base text-gray-900 dark:text-gray-100">
          {t.newTransaction}
        </h1>
        <button type="button" className="p-1 text-gray-400 dark:text-gray-500">
          <Mic className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-20">
        {/* TRANSACTION NO. & BOOKING REF */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1 block">
              {t.transactionNoLabel}
            </Label>
            <div
              className={`border rounded-md px-3 py-2 text-sm font-mono ${
                txNumber
                  ? "bg-blue-50 border-blue-200 text-blue-700 font-semibold"
                  : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500"
              }`}
            >
              {txNumber || t.autoLabel}
            </div>
          </div>
          {bookingRef && (
            <div>
              <Label className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1 block">
                {t.bookingRefLabel}
              </Label>
              <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-sm text-blue-700 font-mono">
                {bookingRef}
              </div>
            </div>
          )}
        </div>

        {/* DATE & TIME */}
        <div>
          <Label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
            {t.dateAndTime}
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1 block">
                {t.dateLabel}
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-white dark:bg-gray-900"
                data-ocid="transactions.date.input"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1 block">
                {t.timeLabel}
              </Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-white dark:bg-gray-900"
                data-ocid="transactions.time.input"
              />
            </div>
          </div>
        </div>

        {/* Cash / Credit Toggle */}
        <div className="grid grid-cols-2 gap-2">
          {(["cash", "credit"] as TransactionType[]).map((tt) => (
            <button
              key={tt}
              type="button"
              onClick={() => setTxType(tt)}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                txType === tt
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 dark:text-gray-500"
              }`}
              data-ocid={`transactions.${tt}.toggle`}
            >
              {tt === "cash" ? t.cashToggle : t.creditToggle}
            </button>
          ))}
        </div>

        {/* Party */}
        <div>
          <Label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
            {t.customerParty} {txType === "credit" ? "*" : t.optionalLabel}
          </Label>
          <PartySelector
            actor={actor}
            parties={parties}
            value={partyId}
            onChange={(id) => setPartyId(id)}
            onPartiesUpdate={setParties}
          />
        </div>

        {/* Party Mobile */}
        <div>
          <Label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
            {t.partyMobileLabel}{" "}
            {!isCashParty && txType === "credit" ? "*" : ""}
          </Label>
          <Input
            type="tel"
            value={partyMobile}
            onChange={(e) => setPartyMobile(e.target.value)}
            placeholder="Mobile Number"
            disabled={isCashParty}
            className={
              isCashParty
                ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                : "bg-white dark:bg-gray-900"
            }
            data-ocid="transactions.party_mobile.input"
          />
        </div>

        {/* Service / Work Type */}
        <div>
          <Label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
            {t.workType}
          </Label>
          <Select value={workType} onValueChange={setWorkType}>
            <SelectTrigger
              className="bg-white dark:bg-gray-900"
              data-ocid="transactions.worktype.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {workTypes.map((wt) => (
                <SelectItem key={wt.name} value={wt.name}>
                  {wt.name}
                  {wt.rate > 0 ? ` (₹${wt.rate}/hr)` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {serviceRate > 0 && (
            <p className="text-xs text-green-700 mt-1">
              ✓ ₹{serviceRate}/hr — {t.autoFillHint}
            </p>
          )}
        </div>

        {/* Tractor */}
        <div>
          <Label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
            {t.tractor} {t.optionalLabel}
          </Label>
          <Select value={tractorId} onValueChange={setTractorId}>
            <SelectTrigger
              className="bg-white dark:bg-gray-900"
              data-ocid="transactions.tractor.select"
            >
              <SelectValue placeholder={t.selectTractor} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t.emptySlot}</SelectItem>
              {tractors.map((tr) => (
                <SelectItem key={tr.id.toString()} value={tr.id.toString()}>
                  {tr.name} ({tr.model})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Driver */}
        <div>
          <Label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
            {t.drivers} {t.optionalLabel}
          </Label>
          <Select value={driverId} onValueChange={setDriverId}>
            <SelectTrigger
              className="bg-white dark:bg-gray-900"
              data-ocid="transactions.driver.select"
            >
              <SelectValue placeholder={t.selectDriver} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t.emptySlot}</SelectItem>
              {drivers.map((dr) => (
                <SelectItem key={dr.id.toString()} value={dr.id.toString()}>
                  {dr.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Start Time & End Time */}
        <div>
          <Label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
            {t.startTime} / {t.endTime}
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                {t.startTime}
              </Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-white dark:bg-gray-900"
                data-ocid="transactions.start_time.input"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                {t.endTime}
              </Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-white dark:bg-gray-900"
                data-ocid="transactions.end_time.input"
              />
            </div>
          </div>
        </div>

        {/* Hours & Minutes */}
        <div>
          <Label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
            {t.workTime}
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1 block">
                {t.hours}
              </Label>
              <Input
                type="number"
                min={0}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="bg-white dark:bg-gray-900"
                data-ocid="transactions.hours.input"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1 block">
                {t.minutesLabel}
              </Label>
              <Input
                type="number"
                min={0}
                max={59}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                className="bg-white dark:bg-gray-900"
                data-ocid="transactions.minutes.input"
              />
            </div>
          </div>
        </div>

        {/* Total Amount */}
        <div>
          <Label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
            {t.totalAmountLabel}
          </Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="bg-white dark:bg-gray-900"
            data-ocid="transactions.amount.input"
          />
        </div>

        {/* Payment Method */}
        <div>
          <Label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">
            {t.paymentMethodLabel}
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { val: PaymentMethod.cash, label: t.cashToggle },
                { val: PaymentMethod.upi, label: "📱 UPI" },
                { val: PaymentMethod.split, label: `📊 ${t.split}` },
              ] as const
            ).map(({ val, label }) => (
              <button
                key={val}
                type="button"
                onClick={() => setPaymentMethod(val)}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-all border-2 ${
                  paymentMethod === val
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700"
                }`}
                data-ocid={`transactions.${val}.toggle`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Split Payment Fields */}
          {paymentMethod === PaymentMethod.split && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-col gap-3">
              <p className="text-xs text-blue-700 font-semibold">
                {t.splitPaymentTitle}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-1 block">
                    {t.splitCashLabel}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={splitCash}
                    onChange={(e) => setSplitCash(e.target.value)}
                    placeholder="0"
                    className="bg-white dark:bg-gray-900"
                    data-ocid="transactions.split_cash.input"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-1 block">
                    {t.splitUpiLabel}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={splitUpi}
                    onChange={(e) => setSplitUpi(e.target.value)}
                    placeholder="0"
                    className="bg-white dark:bg-gray-900"
                    data-ocid="transactions.split_upi.input"
                  />
                </div>
              </div>
              {(splitCash || splitUpi) && (
                <p className="text-xs text-blue-800 font-medium">
                  {t.totalReceivedLabel}: ₹
                  {(Number(splitCash) || 0) + (Number(splitUpi) || 0)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Payment Received — shown for non-split; for cash only received+discount */}
        {paymentMethod !== PaymentMethod.split && (
          <div>
            <Label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
              {t.receivedAmountLabel} *
            </Label>
            <Input
              type="number"
              value={receivedAmount}
              onChange={(e) => setReceivedAmount(e.target.value)}
              placeholder="0"
              className="bg-white dark:bg-gray-900 border-2 border-blue-200 focus:border-blue-400"
              data-ocid="transactions.received_amount.input"
            />
          </div>
        )}

        {/* Balance Due */}
        {amount && receivedAmount && (
          <div
            className={`rounded-xl px-4 py-3 text-center ${
              netAmount - Number(receivedAmount) <= 0
                ? "bg-green-50 dark:bg-green-900/30"
                : "bg-red-50"
            }`}
          >
            <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
              {t.balanceDueLabel}:{" "}
            </span>
            <span
              className={`text-xl font-bold ${
                netAmount - Number(receivedAmount) <= 0
                  ? "text-green-700"
                  : "text-red-600"
              }`}
            >
              ₹{balanceDue}
            </span>
          </div>
        )}

        {/* Discount */}
        <div>
          <Label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
            {t.discountLabel}
          </Label>
          <Input
            type="number"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="0"
            className="bg-white dark:bg-gray-900"
            data-ocid="transactions.discount.input"
          />
        </div>

        {/* Photo */}
        <div>
          <button
            type="button"
            className="flex items-center gap-2 w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl py-3 px-4 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:border-gray-400 transition-colors bg-white dark:bg-gray-900"
            data-ocid="transactions.photo.upload_button"
          >
            <Camera className="w-4 h-4" />
            {t.photoButtonLabel}
          </button>
        </div>

        {/* Save hint when blocked */}
        {isSaveDisabled && !saving && !savedOnce && txType !== "credit" && (
          <p className="text-xs text-orange-600 text-center">
            ⚠️ {t.receivedAmountLabel} fill karo to Save active hoga
          </p>
        )}

        <Button
          onClick={handleSave}
          disabled={isSaveDisabled}
          className={`w-full py-4 text-base font-bold rounded-2xl mt-2 text-white ${
            savedOnce
              ? "bg-green-400 cursor-not-allowed"
              : isSaveDisabled
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
          }`}
          data-ocid="transactions.save.submit_button"
        >
          {saving
            ? t.savingText
            : savedOnce
              ? `✓ ${t.transactionSavedMsg}`
              : t.saveButton}
        </Button>
        <div className="h-4" />
      </div>

      {/* Invoice Modal */}
      {showInvoice && invoiceData && (
        <InvoiceModal
          data={invoiceData}
          onClose={() => setShowInvoice(false)}
          onNew={() => {
            setShowInvoice(false);
            resetForm();
          }}
        />
      )}
    </div>
  );
}
