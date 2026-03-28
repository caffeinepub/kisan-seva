// Utility to save entries to ktp_cash_flow unified store

export type CashFlowEntry = {
  id: string;
  date: string;
  time: string;
  partyName?: string;
  label: string;
  amount: number;
  paymentMethod: "cash" | "upi";
  type: "in" | "out";
  source: "transaction" | "payment_in" | "expense";
};

export function saveCashFlowEntries(entries: CashFlowEntry[]) {
  const existing: CashFlowEntry[] = JSON.parse(
    localStorage.getItem("ktp_cash_flow_v2") || "[]",
  );
  const updated = [...entries, ...existing];
  localStorage.setItem("ktp_cash_flow_v2", JSON.stringify(updated));
}

export function getCashFlowEntries(): CashFlowEntry[] {
  return JSON.parse(localStorage.getItem("ktp_cash_flow_v2") || "[]");
}
