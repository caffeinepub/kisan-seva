import {
  BookingStatus,
  ExpenseCategory,
  PaymentMethod,
  TractorStatus,
  UserRole,
  type backendInterface,
} from "../backend";

// ── Storage Keys ─────────────────────────────────────────────
const KEYS = {
  parties: "ktp_ls_parties",
  tractors: "ktp_ls_tractors",
  drivers: "ktp_ls_drivers",
  payments: "ktp_ls_payments",
  bookings: "ktp_ls_bookings",
  expenses: "ktp_ls_expenses",
  userProfile: "ktp_ls_profile",
  counters: "ktp_ls_counters",
};

// ── ID Counter ────────────────────────────────────────────────
function getNextId(entity: string): number {
  const counters = JSON.parse(localStorage.getItem(KEYS.counters) || "{}");
  const next = (counters[entity] || 0) + 1;
  counters[entity] = next;
  localStorage.setItem(KEYS.counters, JSON.stringify(counters));
  return next;
}

// ── Generic helpers ───────────────────────────────────────────
function getList<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function setList<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

// ── Internal LS types (number instead of bigint for JSON) ─────
interface LSParty {
  id: number;
  name: string;
  phone: string;
  address: string;
  creditBalance: number;
}
interface LSTractor {
  id: number;
  name: string;
  model: string;
  ratePerHour: number;
  status: string;
  driverId: number | null;
}
interface LSDriver {
  id: number;
  name: string;
  phone: string;
  assignedTractorId: number | null;
  performanceNotes: string;
}
interface LSPayment {
  id: number;
  bookingId: number;
  method: string;
  date: number;
  notes: string;
  amount: number;
}
interface LSBooking {
  id: number;
  tractorId: number;
  driverId: number;
  partyId: number;
  workType: string;
  date: number;
  hours: number;
  ratePerHour: number;
  totalAmount: number;
  notes: string;
  advancePaid: number;
  status: string;
  paymentMethod: string;
}
interface LSExpense {
  id: number;
  tractorId: number;
  driverId: number;
  date: number;
  notes: string;
  category: string;
  amount: number;
}

// ── Converters ────────────────────────────────────────────────
function toParty(p: LSParty) {
  return {
    id: BigInt(p.id),
    name: p.name,
    phone: p.phone,
    address: p.address,
    creditBalance: BigInt(Math.round(p.creditBalance)),
  };
}

function toTractor(t: LSTractor) {
  return {
    id: BigInt(t.id),
    name: t.name,
    model: t.model,
    ratePerHour: BigInt(Math.round(t.ratePerHour || 0)),
    status: t.status === "busy" ? TractorStatus.busy : TractorStatus.free,
    driverId:
      t.driverId != null
        ? ([BigInt(t.driverId)] as [bigint])
        : ([] as unknown as []),
  };
}

function toDriver(d: LSDriver) {
  return {
    id: BigInt(d.id),
    name: d.name,
    phone: d.phone,
    assignedTractorId:
      d.assignedTractorId != null
        ? ([BigInt(d.assignedTractorId)] as [bigint])
        : ([] as unknown as []),
    performanceNotes: d.performanceNotes,
  };
}

function toPaymentMethod(m: string): PaymentMethod {
  if (m === "upi") return PaymentMethod.upi;
  if (m === "split") return PaymentMethod.split;
  return PaymentMethod.cash;
}

function fromPaymentMethod(m: PaymentMethod): string {
  if (m === PaymentMethod.upi) return "upi";
  if (m === PaymentMethod.split) return "split";
  return "cash";
}

function toBookingStatus(s: string): BookingStatus {
  if (s === "completed") return BookingStatus.completed;
  if (s === "cancelled") return BookingStatus.cancelled;
  return BookingStatus.pending;
}

function fromBookingStatus(s: BookingStatus): string {
  if (s === BookingStatus.completed) return "completed";
  if (s === BookingStatus.cancelled) return "cancelled";
  return "pending";
}

function toExpenseCategory(c: string): ExpenseCategory {
  if (c === "driverPayment") return ExpenseCategory.driverPayment;
  if (c === "maintenance") return ExpenseCategory.maintenance;
  if (c === "diesel") return ExpenseCategory.diesel;
  return ExpenseCategory.other;
}

function fromExpenseCategory(c: ExpenseCategory): string {
  if (c === ExpenseCategory.driverPayment) return "driverPayment";
  if (c === ExpenseCategory.maintenance) return "maintenance";
  if (c === ExpenseCategory.diesel) return "diesel";
  return "other";
}

function toPayment(p: LSPayment) {
  return {
    id: BigInt(p.id),
    bookingId: BigInt(p.bookingId),
    method: toPaymentMethod(p.method),
    date: BigInt(p.date),
    notes: p.notes,
    amount: BigInt(Math.round(p.amount)),
  };
}

function toBooking(b: LSBooking) {
  return {
    id: BigInt(b.id),
    tractorId: BigInt(b.tractorId),
    driverId: BigInt(b.driverId),
    partyId: BigInt(b.partyId),
    workType: b.workType,
    date: BigInt(b.date),
    hours: BigInt(b.hours),
    ratePerHour: BigInt(b.ratePerHour),
    totalAmount: BigInt(b.totalAmount),
    notes: b.notes,
    advancePaid: BigInt(b.advancePaid),
    status: toBookingStatus(b.status),
    paymentMethod: toPaymentMethod(b.paymentMethod),
  };
}

function toExpense(e: LSExpense) {
  return {
    id: BigInt(e.id),
    tractorId: BigInt(e.tractorId),
    driverId: BigInt(e.driverId),
    date: BigInt(e.date),
    notes: e.notes,
    category: toExpenseCategory(e.category),
    amount: BigInt(Math.round(e.amount)),
  };
}

// ── Earnings (from ktp_saved_transactions) ────────────────────
interface SavedTx {
  date: string;
  amount: number;
  receivedAmount: number;
}

function getSavedTxns(): SavedTx[] {
  try {
    return JSON.parse(localStorage.getItem("ktp_saved_transactions") || "[]");
  } catch {
    return [];
  }
}

// ── Factory ───────────────────────────────────────────────────
export function createLocalActor(): backendInterface {
  return {
    _initializeAccessControlWithSecret: async (_s: string) => {},
    assignCallerUserRole: async (_p: unknown, _r: unknown) => {},
    getCallerUserRole: async () => UserRole.admin,
    isCallerAdmin: async () => true,

    // User Profile
    getCallerUserProfile: async () => {
      const raw = localStorage.getItem(KEYS.userProfile);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },
    getUserProfile: async (_user: unknown) => null,
    saveCallerUserProfile: async (profile: {
      ownerName: string;
      businessName: string;
      address: string;
      phone: string;
    }) => {
      localStorage.setItem(KEYS.userProfile, JSON.stringify(profile));
      if (profile.businessName)
        localStorage.setItem("ktp_business_name", profile.businessName);
      if (profile.phone)
        localStorage.setItem("ktp_business_mobile", profile.phone);
    },

    // Parties
    getAllParties: async () =>
      getList<LSParty>(KEYS.parties).map(toParty) as any,
    getParty: async (id: bigint) => {
      const found = getList<LSParty>(KEYS.parties).find(
        (p) => p.id === Number(id),
      );
      return found ? (toParty(found) as any) : null;
    },
    createParty: async (name: string, phone: string, address: string) => {
      const list = getList<LSParty>(KEYS.parties);
      const id = getNextId("party");
      list.push({ id, name, phone, address, creditBalance: 0 });
      setList(KEYS.parties, list);
      return BigInt(id);
    },
    updateParty: async (
      id: bigint,
      name: string,
      phone: string,
      address: string,
    ) => {
      const list = getList<LSParty>(KEYS.parties);
      const idx = list.findIndex((p) => p.id === Number(id));
      if (idx >= 0) {
        list[idx] = { ...list[idx], name, phone, address };
        setList(KEYS.parties, list);
      }
    },
    deleteParty: async (id: bigint) => {
      setList(
        KEYS.parties,
        getList<LSParty>(KEYS.parties).filter((p) => p.id !== Number(id)),
      );
    },
    getPartiesWithPendingCredit: async () => {
      const udharMap: Record<string, number> = JSON.parse(
        localStorage.getItem("ktp_party_udhar") || "{}",
      );
      return getList<LSParty>(KEYS.parties)
        .filter((p) => (udharMap[p.id.toString()] || 0) + p.creditBalance > 0)
        .map((p) => ({
          id: BigInt(p.id),
          name: p.name,
          creditBalance: BigInt(
            Math.round((udharMap[p.id.toString()] || 0) + p.creditBalance),
          ),
        })) as any;
    },

    // Tractors
    getAllTractors: async () =>
      getList<LSTractor>(KEYS.tractors).map(toTractor) as any,
    getTractor: async (id: bigint) => {
      const found = getList<LSTractor>(KEYS.tractors).find(
        (t) => t.id === Number(id),
      );
      return found ? (toTractor(found) as any) : null;
    },
    createTractor: async (name: string, model: string, ratePerHour: bigint) => {
      const list = getList<LSTractor>(KEYS.tractors);
      const id = getNextId("tractor");
      list.push({
        id,
        name,
        model,
        ratePerHour: Number(ratePerHour),
        status: "free",
        driverId: null,
      });
      setList(KEYS.tractors, list);
      return BigInt(id);
    },
    updateTractor: async (
      id: bigint,
      name: string,
      model: string,
      ratePerHour: bigint,
    ) => {
      const list = getList<LSTractor>(KEYS.tractors);
      const idx = list.findIndex((t) => t.id === Number(id));
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          name,
          model,
          ratePerHour: Number(ratePerHour),
        };
        setList(KEYS.tractors, list);
      }
    },
    deleteTractor: async (id: bigint) => {
      setList(
        KEYS.tractors,
        getList<LSTractor>(KEYS.tractors).filter((t) => t.id !== Number(id)),
      );
    },
    updateTractorStatus: async (id: bigint, status: any) => {
      const list = getList<LSTractor>(KEYS.tractors);
      const idx = list.findIndex((t) => t.id === Number(id));
      if (idx >= 0) {
        list[idx].status = status === TractorStatus.busy ? "busy" : "free";
        setList(KEYS.tractors, list);
      }
    },
    assignDriverToTractor: async (tractorId: bigint, driverIdOpt: any) => {
      const tractors = getList<LSTractor>(KEYS.tractors);
      const tidx = tractors.findIndex((t) => t.id === Number(tractorId));
      const dId =
        Array.isArray(driverIdOpt) && driverIdOpt.length > 0
          ? Number(driverIdOpt[0])
          : null;
      if (tidx >= 0) {
        tractors[tidx].driverId = dId;
        setList(KEYS.tractors, tractors);
      }
      const drivers = getList<LSDriver>(KEYS.drivers);
      for (const d of drivers) {
        if (d.assignedTractorId === Number(tractorId))
          d.assignedTractorId = null;
      }
      if (dId != null) {
        const di = drivers.findIndex((d) => d.id === dId);
        if (di >= 0) drivers[di].assignedTractorId = Number(tractorId);
      }
      setList(KEYS.drivers, drivers);
    },

    // Drivers
    getAllDrivers: async () =>
      getList<LSDriver>(KEYS.drivers).map(toDriver) as any,
    getDriver: async (id: bigint) => {
      const found = getList<LSDriver>(KEYS.drivers).find(
        (d) => d.id === Number(id),
      );
      return found ? (toDriver(found) as any) : null;
    },
    createDriver: async (
      name: string,
      phone: string,
      performanceNotes: string,
    ) => {
      const list = getList<LSDriver>(KEYS.drivers);
      const id = getNextId("driver");
      list.push({ id, name, phone, performanceNotes, assignedTractorId: null });
      setList(KEYS.drivers, list);
      return BigInt(id);
    },
    updateDriver: async (
      id: bigint,
      name: string,
      phone: string,
      performanceNotes: string,
    ) => {
      const list = getList<LSDriver>(KEYS.drivers);
      const idx = list.findIndex((d) => d.id === Number(id));
      if (idx >= 0) {
        list[idx] = { ...list[idx], name, phone, performanceNotes };
        setList(KEYS.drivers, list);
      }
    },
    deleteDriver: async (id: bigint) => {
      setList(
        KEYS.drivers,
        getList<LSDriver>(KEYS.drivers).filter((d) => d.id !== Number(id)),
      );
    },

    // Payments
    getAllPayments: async () =>
      getList<LSPayment>(KEYS.payments).map(toPayment) as any,
    getPayment: async (id: bigint) => {
      const found = getList<LSPayment>(KEYS.payments).find(
        (p) => p.id === Number(id),
      );
      return found ? (toPayment(found) as any) : null;
    },
    createPayment: async (
      bookingId: bigint,
      amount: bigint,
      method: PaymentMethod,
      date: bigint,
      notes: string,
    ) => {
      const list = getList<LSPayment>(KEYS.payments);
      const id = getNextId("payment");
      list.push({
        id,
        bookingId: Number(bookingId),
        amount: Number(amount),
        method: fromPaymentMethod(method),
        date: Number(date),
        notes,
      });
      setList(KEYS.payments, list);
      return BigInt(id);
    },
    updatePayment: async (
      id: bigint,
      bookingId: bigint,
      amount: bigint,
      method: PaymentMethod,
      date: bigint,
      notes: string,
    ) => {
      const list = getList<LSPayment>(KEYS.payments);
      const idx = list.findIndex((p) => p.id === Number(id));
      if (idx >= 0) {
        list[idx] = {
          id: Number(id),
          bookingId: Number(bookingId),
          amount: Number(amount),
          method: fromPaymentMethod(method),
          date: Number(date),
          notes,
        };
        setList(KEYS.payments, list);
      }
    },
    deletePayment: async (id: bigint) => {
      setList(
        KEYS.payments,
        getList<LSPayment>(KEYS.payments).filter((p) => p.id !== Number(id)),
      );
    },

    // Bookings
    getAllBookings: async () =>
      getList<LSBooking>(KEYS.bookings).map(toBooking) as any,
    getBooking: async (id: bigint) => {
      const found = getList<LSBooking>(KEYS.bookings).find(
        (b) => b.id === Number(id),
      );
      return found ? (toBooking(found) as any) : null;
    },
    createBooking: async (
      tractorId: bigint,
      driverId: bigint,
      partyId: bigint,
      workType: string,
      date: bigint,
      hours: bigint,
      ratePerHour: bigint,
      advancePaid: bigint,
      paymentMethod: PaymentMethod,
      notes: string,
    ) => {
      const list = getList<LSBooking>(KEYS.bookings);
      const id = getNextId("booking");
      const totalAmount = Number(hours) * Number(ratePerHour);
      list.push({
        id,
        tractorId: Number(tractorId),
        driverId: Number(driverId),
        partyId: Number(partyId),
        workType,
        date: Number(date),
        hours: Number(hours),
        ratePerHour: Number(ratePerHour),
        totalAmount,
        notes,
        advancePaid: Number(advancePaid),
        status: "pending",
        paymentMethod: fromPaymentMethod(paymentMethod),
      });
      setList(KEYS.bookings, list);
      return BigInt(id);
    },
    updateBooking: async (
      id: bigint,
      tractorId: bigint,
      driverId: bigint,
      partyId: bigint,
      workType: string,
      date: bigint,
      hours: bigint,
      ratePerHour: bigint,
      advancePaid: bigint,
      paymentMethod: PaymentMethod,
      status: BookingStatus,
      notes: string,
    ) => {
      const list = getList<LSBooking>(KEYS.bookings);
      const idx = list.findIndex((b) => b.id === Number(id));
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          tractorId: Number(tractorId),
          driverId: Number(driverId),
          partyId: Number(partyId),
          workType,
          date: Number(date),
          hours: Number(hours),
          ratePerHour: Number(ratePerHour),
          advancePaid: Number(advancePaid),
          paymentMethod: fromPaymentMethod(paymentMethod),
          status: fromBookingStatus(status),
          notes,
        };
        setList(KEYS.bookings, list);
      }
    },
    deleteBooking: async (id: bigint) => {
      setList(
        KEYS.bookings,
        getList<LSBooking>(KEYS.bookings).filter((b) => b.id !== Number(id)),
      );
    },
    getBookingsByDateRange: async (from: bigint, to: bigint) =>
      getList<LSBooking>(KEYS.bookings)
        .filter((b) => b.date >= Number(from) && b.date <= Number(to))
        .map(toBooking) as any,
    getBookingsByParty: async (partyId: bigint) =>
      getList<LSBooking>(KEYS.bookings)
        .filter((b) => b.partyId === Number(partyId))
        .map(toBooking) as any,
    getBookingsByTractor: async (tractorId: bigint) =>
      getList<LSBooking>(KEYS.bookings)
        .filter((b) => b.tractorId === Number(tractorId))
        .map(toBooking) as any,

    // Expenses
    getAllExpenses: async () =>
      getList<LSExpense>(KEYS.expenses).map(toExpense) as any,
    getExpense: async (id: bigint) => {
      const found = getList<LSExpense>(KEYS.expenses).find(
        (e) => e.id === Number(id),
      );
      return found ? (toExpense(found) as any) : null;
    },
    createExpense: async (
      tractorId: bigint,
      driverId: bigint,
      category: ExpenseCategory,
      amount: bigint,
      date: bigint,
      notes: string,
    ) => {
      const list = getList<LSExpense>(KEYS.expenses);
      const id = getNextId("expense");
      list.push({
        id,
        tractorId: Number(tractorId),
        driverId: Number(driverId),
        date: Number(date),
        notes,
        category: fromExpenseCategory(category),
        amount: Number(amount),
      });
      setList(KEYS.expenses, list);
      return BigInt(id);
    },
    updateExpense: async (
      id: bigint,
      tractorId: bigint,
      driverId: bigint,
      category: ExpenseCategory,
      amount: bigint,
      date: bigint,
      notes: string,
    ) => {
      const list = getList<LSExpense>(KEYS.expenses);
      const idx = list.findIndex((e) => e.id === Number(id));
      if (idx >= 0) {
        list[idx] = {
          id: Number(id),
          tractorId: Number(tractorId),
          driverId: Number(driverId),
          date: Number(date),
          notes,
          category: fromExpenseCategory(category),
          amount: Number(amount),
        };
        setList(KEYS.expenses, list);
      }
    },
    deleteExpense: async (id: bigint) => {
      setList(
        KEYS.expenses,
        getList<LSExpense>(KEYS.expenses).filter((e) => e.id !== Number(id)),
      );
    },
    getExpensesByDriver: async (driverId: bigint) =>
      BigInt(
        getList<LSExpense>(KEYS.expenses)
          .filter((e) => e.driverId === Number(driverId))
          .reduce((s, e) => s + e.amount, 0),
      ),
    getExpensesByTractor: async (tractorId: bigint) =>
      BigInt(
        getList<LSExpense>(KEYS.expenses)
          .filter((e) => e.tractorId === Number(tractorId))
          .reduce((s, e) => s + e.amount, 0),
      ),

    // Earnings (calculated from ktp_saved_transactions)
    getEarningsToday: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const total = getSavedTxns()
        .filter((t) => t.date === today)
        .reduce((s, t) => s + (t.receivedAmount || t.amount || 0), 0);
      return BigInt(Math.round(total));
    },
    getEarningsThisMonth: async () => {
      const now = new Date();
      const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const total = getSavedTxns()
        .filter((t) => t.date?.startsWith(ym))
        .reduce((s, t) => s + (t.receivedAmount || t.amount || 0), 0);
      return BigInt(Math.round(total));
    },
    getTotalEarnings: async () => {
      const total = getSavedTxns().reduce(
        (s, t) => s + (t.receivedAmount || t.amount || 0),
        0,
      );
      return BigInt(Math.round(total));
    },
    getNetProfit: async () => {
      const income = getSavedTxns().reduce(
        (s, t) => s + (t.receivedAmount || t.amount || 0),
        0,
      );
      const expTotal = getList<LSExpense>(KEYS.expenses).reduce(
        (s, e) => s + e.amount,
        0,
      );
      return BigInt(Math.round(Math.max(0, income - expTotal)));
    },
  } as unknown as backendInterface;
}
