import { useApp } from "../App";

export default function BottomNav() {
  const { t, setPage, page } = useApp();

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t px-4 py-2 flex gap-2 z-30">
      <button
        type="button"
        onClick={() => setPage("transactions")}
        className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${
          page === "transactions"
            ? "bg-orange-500 text-white"
            : "bg-green-700 text-white"
        }`}
      >
        {t.takePayment}
      </button>
      <button
        type="button"
        onClick={() => setPage("transactions")}
        className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${
          page === "transactions"
            ? "bg-orange-500 text-white"
            : "bg-orange-500 text-white"
        }`}
      >
        {t.transaction}
      </button>
      <button
        type="button"
        onClick={() => setPage("bookings")}
        className={`flex-1 py-2.5 rounded-full text-sm font-bold border-2 transition-all ${
          page === "bookings"
            ? "bg-green-700 text-white border-green-700"
            : "bg-white text-green-700 border-green-700"
        }`}
      >
        {t.booking}
      </button>
    </div>
  );
}
