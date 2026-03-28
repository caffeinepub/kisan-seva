import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Menu, ReceiptText, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../App";
import type { backendInterface } from "../backend";
import { type Payment, PaymentMethod } from "../backend";

interface Props {
  actor: backendInterface;
  onOpenSidebar?: () => void;
}

interface SavedTransaction {
  id: string;
  partyName?: string;
  partyId?: string;
  bookingRef?: string;
  bookingId?: string;
  [key: string]: unknown;
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

function getSavedTransactions(): SavedTransaction[] {
  try {
    const raw = localStorage.getItem("ktp_saved_transactions");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setSavedTransactions(items: SavedTransaction[]) {
  localStorage.setItem("ktp_saved_transactions", JSON.stringify(items));
}

function getTxnKey(id: bigint): string {
  return `#TXN-${id.toString().padStart(4, "0")}`;
}

export default function AllTransactionsPage({ actor, onOpenSidebar }: Props) {
  const { t, goBack } = useApp();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [savedTxns, setSavedTxns] = useState<SavedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = () => {
    setLoading(true);
    actor
      .getAllPayments()
      .then((pays) => {
        const sorted = [...pays].sort(
          (a, b) => Number(b.date) - Number(a.date),
        );
        setPayments(sorted);
        setSavedTxns(getSavedTransactions());
      })
      .finally(() => setLoading(false));
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: actor is stable
  useEffect(() => {
    loadData();
  }, [actor]);

  const getPartyName = (payment: Payment): string => {
    const key = getTxnKey(payment.id);
    const saved = savedTxns.find((s) => s.id === key);
    return saved?.partyName || "";
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const key = getTxnKey(deleteTarget.id);
      const all = getSavedTransactions();
      const txnEntry = all.find((s) => s.id === key);

      // Cascade: delete connected booking from localStorage
      if (txnEntry) {
        const bookingRef =
          txnEntry.bookingRef ||
          txnEntry.bookingId ||
          key.replace("TXN", "BKG");
        const afterRemoveTxn = all.filter(
          (s) => s.id !== key && s.id !== bookingRef,
        );
        setSavedTransactions(afterRemoveTxn);

        // Also try to delete booking from backend
        const bkgNumMatch = bookingRef?.match(/#BKG-(\d+)/);
        if (bkgNumMatch) {
          try {
            for (let i = 0; i < localStorage.length; i++) {
              const lsKey = localStorage.key(i);
              if (
                lsKey?.startsWith("ktp_bkg_num_") &&
                localStorage.getItem(lsKey) === bkgNumMatch[1]
              ) {
                const bkgId = BigInt(lsKey.replace("ktp_bkg_num_", ""));
                await (actor as any).deleteBooking(bkgId).catch(() => {});
                localStorage.removeItem(lsKey);
                break;
              }
            }
          } catch {
            // ignore
          }
        }
      } else {
        const afterRemove = all.filter((s) => s.id !== key);
        setSavedTransactions(afterRemove);
      }

      // Try to delete from backend
      try {
        await (actor as any).deletePayment(deleteTarget.id);
      } catch {
        // Backend may not support delete — ignore
      }

      toast.success(t.deletedMsg || "Deleted successfully");
      setDeleteTarget(null);
      loadData();
    } catch (e) {
      console.error(e);
      toast.error(t.errorSavingMsg || "Delete failed");
    }
    setDeleting(false);
  };

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
          payments.map((payment, idx) => {
            const partyName = getPartyName(payment);
            return (
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
                    {partyName ? (
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-0.5">
                        {partyName}
                      </p>
                    ) : null}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {fmt12(payment.date)}
                    </p>
                    {payment.notes ? (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">
                        {payment.notes}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      ₹{payment.amount.toString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(payment)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
                      data-ocid={`all_transactions.delete_button.${idx + 1}`}
                      title={t.delete || "Delete"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </main>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent data-ocid="all_transactions.dialog">
          <DialogHeader>
            <DialogTitle>{t.delete || "Delete Transaction"}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? If it is linked
              to a booking, the booking will also be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              data-ocid="all_transactions.cancel_button"
            >
              {t.cancel || "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
              data-ocid="all_transactions.confirm_button"
            >
              {deleting ? "Deleting..." : t.delete || "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
