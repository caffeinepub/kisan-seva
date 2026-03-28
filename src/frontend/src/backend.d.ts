import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Tractor {
    id: bigint;
    status: TractorStatus;
    driverId?: bigint;
    model: string;
    name: string;
    ratePerHour: bigint;
}
export interface Party {
    id: bigint;
    name: string;
    creditBalance: bigint;
    address: string;
    phone: string;
}
export interface Driver {
    id: bigint;
    assignedTractorId?: bigint;
    name: string;
    performanceNotes: string;
    phone: string;
}
export interface Payment {
    id: bigint;
    method: PaymentMethod;
    bookingId: bigint;
    date: bigint;
    notes: string;
    amount: bigint;
}
export interface Expense {
    id: bigint;
    driverId: bigint;
    date: bigint;
    tractorId: bigint;
    notes: string;
    category: ExpenseCategory;
    amount: bigint;
}
export interface UserProfile {
    ownerName: string;
    businessName: string;
    address: string;
    phone: string;
}
export interface Booking {
    id: bigint;
    status: BookingStatus;
    workType: string;
    driverId: bigint;
    paymentMethod: PaymentMethod;
    hours: bigint;
    date: bigint;
    tractorId: bigint;
    ratePerHour: bigint;
    totalAmount: bigint;
    notes: string;
    advancePaid: bigint;
    partyId: bigint;
}
export enum BookingStatus {
    cancelled = "cancelled",
    pending = "pending",
    completed = "completed"
}
export enum ExpenseCategory {
    other = "other",
    driverPayment = "driverPayment",
    maintenance = "maintenance",
    diesel = "diesel"
}
export enum PaymentMethod {
    upi = "upi",
    cash = "cash",
    split = "split"
}
export enum TractorStatus {
    busy = "busy",
    free = "free"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignDriverToTractor(tractorId: bigint, driverId: bigint | null): Promise<void>;
    createBooking(tractorId: bigint, driverId: bigint, partyId: bigint, workType: string, date: bigint, hours: bigint, ratePerHour: bigint, advancePaid: bigint, paymentMethod: PaymentMethod, notes: string): Promise<bigint>;
    createDriver(name: string, phone: string, performanceNotes: string): Promise<bigint>;
    createExpense(tractorId: bigint, driverId: bigint, category: ExpenseCategory, amount: bigint, date: bigint, notes: string): Promise<bigint>;
    createParty(name: string, phone: string, address: string): Promise<bigint>;
    createPayment(bookingId: bigint, amount: bigint, method: PaymentMethod, date: bigint, notes: string): Promise<bigint>;
    createTractor(name: string, model: string, ratePerHour: bigint): Promise<bigint>;
    deleteBooking(id: bigint): Promise<void>;
    deleteDriver(id: bigint): Promise<void>;
    deleteExpense(id: bigint): Promise<void>;
    deleteParty(id: bigint): Promise<void>;
    deletePayment(id: bigint): Promise<void>;
    deleteTractor(id: bigint): Promise<void>;
    getAllBookings(): Promise<Array<Booking>>;
    getAllDrivers(): Promise<Array<Driver>>;
    getAllExpenses(): Promise<Array<Expense>>;
    getAllParties(): Promise<Array<Party>>;
    getAllPayments(): Promise<Array<Payment>>;
    getAllTractors(): Promise<Array<Tractor>>;
    getBooking(id: bigint): Promise<Booking | null>;
    getBookingsByDateRange(startDate: bigint, endDate: bigint): Promise<Array<Booking>>;
    getBookingsByParty(partyId: bigint): Promise<Array<Booking>>;
    getBookingsByTractor(tractorId: bigint): Promise<Array<Booking>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDriver(id: bigint): Promise<Driver | null>;
    getEarningsThisMonth(): Promise<bigint>;
    getEarningsToday(): Promise<bigint>;
    getExpense(id: bigint): Promise<Expense | null>;
    getExpensesByDriver(driverId: bigint): Promise<bigint>;
    getExpensesByTractor(tractorId: bigint): Promise<bigint>;
    getNetProfit(startDate: bigint, endDate: bigint): Promise<bigint>;
    getPartiesWithPendingCredit(): Promise<Array<Party>>;
    getParty(id: bigint): Promise<Party | null>;
    getPayment(id: bigint): Promise<Payment | null>;
    getTotalEarnings(): Promise<bigint>;
    getTractor(id: bigint): Promise<Tractor | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateBooking(id: bigint, tractorId: bigint, driverId: bigint, partyId: bigint, workType: string, date: bigint, hours: bigint, ratePerHour: bigint, advancePaid: bigint, paymentMethod: PaymentMethod, status: BookingStatus, notes: string): Promise<void>;
    updateDriver(id: bigint, name: string, phone: string, performanceNotes: string): Promise<void>;
    updateExpense(id: bigint, tractorId: bigint, driverId: bigint, category: ExpenseCategory, amount: bigint, date: bigint, notes: string): Promise<void>;
    updateParty(id: bigint, name: string, phone: string, address: string): Promise<void>;
    updatePayment(id: bigint, bookingId: bigint, amount: bigint, method: PaymentMethod, date: bigint, notes: string): Promise<void>;
    updateTractor(id: bigint, name: string, model: string, ratePerHour: bigint): Promise<void>;
    updateTractorStatus(id: bigint, status: TractorStatus): Promise<void>;
}
