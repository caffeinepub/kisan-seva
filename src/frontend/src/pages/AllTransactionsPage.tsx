import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Menu, ReceiptText } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../App";
import type { backendInterface } from "../backend";
import { type Party, type Payment, PaymentMethod } from "../backend";

interface Props {
  actor: backendInterface;
  onOpenSidebar?: () => void;
}

function fmt12(dateMs: bigint) {
  return new Date(Number(dateMs)).toLocaleString("default", {
    hour12: true,
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function methodLabel(m: PaymentMethod) {
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

function methodColor(m: PaymentMethod): string {
  switch (m) {
    case PaymentMethod.cash:
      return "bg-emerald-100 text-emerald-700";
    case PaymentMethod.upi:
      return "bg-blue-100 text-blue-700";
    case PaymentMethod.split:
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
  }
}

export default function AllTransactionsPage({ actor, onOpenSidebar }: Props) {
  const { t, goBack } = useApp();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([actor.getAllPayments(), actor.getAllParties()])
      .then(([pays, _parts]) => {
        if (cancelled) return;
        const sorted = [...pays].sort(
          (a, b) => Number(b.date) - Number(a.date),
        );
        setPayments(sorted);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [actor]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-green-700 text-white shadow-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="p-1 rounded-lg hover:bg-green-600"
            data-ocid="all_transactions.open_modal_button"
          >
            <Menu className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={goBack}
            className="p-1 rounded-lg hover:bg-green-600"
            data-ocid="all_transactions.back.button"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold flex-1">{t.allTransactions}</h1>
          <span className="text-sm bg-green-600 px-2 py-0.5 rounded-full">
            {payments.length}
          </span>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {loading && (
          <div
            className="flex flex-col gap-2 mt-4"
            data-ocid="all_transactions.loading_state"
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && payments.length === 0 && (
          <div
            className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-gray-500"
            data-ocid="all_transactions.empty_state"
          >
            <ReceiptText className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-base font-medium">{t.noTransactions}</p>
          </div>
        )}

        {!loading &&
          payments.map((payment, idx) => (
            <div
              key={payment.id.toString()}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3"
              data-ocid={`all_transactions.item.${idx + 1}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-green-700 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                      #TXN-{payment.id.toString().padStart(4, "0")}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${methodColor(payment.method)}`}
                    >
                      {methodLabel(payment.method)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                    {fmt12(payment.date)}
                  </p>
                  {payment.notes ? (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">
                      {payment.notes}
                    </p>
                  ) : null}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    ₹{payment.amount.toString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
      </main>
    </div>
  );
}
