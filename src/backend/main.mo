import Time "mo:core/Time";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

// Upgrade migration

actor {
  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Type
  public type UserProfile = {
    businessName : Text;
    ownerName : Text;
    phone : Text;
    address : Text;
  };

  // Entity Types
  public type TractorStatus = {
    #free;
    #busy;
  };

  public type Tractor = {
    id : Nat;
    name : Text;
    model : Text;
    ratePerHour : Nat;
    status : TractorStatus;
    driverId : ?Nat;
  };

  public type Driver = {
    id : Nat;
    name : Text;
    phone : Text;
    assignedTractorId : ?Nat;
    performanceNotes : Text;
  };

  public type Party = {
    id : Nat;
    name : Text;
    phone : Text;
    address : Text;
    creditBalance : Int;
  };

  public type PaymentMethod = {
    #cash;
    #upi;
    #split;
  };

  public type BookingStatus = {
    #pending;
    #completed;
    #cancelled;
  };

  public type Booking = {
    id : Nat;
    tractorId : Nat;
    driverId : Nat;
    partyId : Nat;
    workType : Text;
    date : Int;
    hours : Nat;
    ratePerHour : Nat;
    totalAmount : Nat;
    advancePaid : Nat;
    paymentMethod : PaymentMethod;
    status : BookingStatus;
    notes : Text;
  };

  public type ExpenseCategory = {
    #diesel;
    #maintenance;
    #driverPayment;
    #other;
  };

  public type Expense = {
    id : Nat;
    tractorId : Nat;
    driverId : Nat;
    category : ExpenseCategory;
    amount : Nat;
    date : Int;
    notes : Text;
  };

  public type Payment = {
    id : Nat;
    bookingId : Nat;
    amount : Nat;
    method : PaymentMethod;
    date : Int;
    notes : Text;
  };

  // State - All data scoped by owner Principal
  let userProfiles = Map.empty<Principal, UserProfile>();
  let tractors = Map.empty<Principal, Map.Map<Nat, Tractor>>();
  let drivers = Map.empty<Principal, Map.Map<Nat, Driver>>();
  let parties = Map.empty<Principal, Map.Map<Nat, Party>>();
  let bookings = Map.empty<Principal, Map.Map<Nat, Booking>>();
  let expenses = Map.empty<Principal, Map.Map<Nat, Expense>>();
  let payments = Map.empty<Principal, Map.Map<Nat, Payment>>();

  // ID counters per owner
  let nextTractorId = Map.empty<Principal, Nat>();
  let nextDriverId = Map.empty<Principal, Nat>();
  let nextPartyId = Map.empty<Principal, Nat>();
  let nextBookingId = Map.empty<Principal, Nat>();
  let nextExpenseId = Map.empty<Principal, Nat>();
  let nextPaymentId = Map.empty<Principal, Nat>();

  // Helper functions
  func getOrCreateMap<K, V>(map : Map.Map<Principal, Map.Map<K, V>>, owner : Principal) : Map.Map<K, V> {
    switch (map.get(owner)) {
      case (?m) { m };
      case (null) {
        let newMap = Map.empty<K, V>();
        map.add(owner, newMap);
        newMap;
      };
    };
  };

  func getNextId(counterMap : Map.Map<Principal, Nat>, owner : Principal) : Nat {
    let current = switch (counterMap.get(owner)) {
      case (?n) { n };
      case (null) { 0 };
    };
    counterMap.add(owner, current + 1);
    current;
  };

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Tractor CRUD
  public shared ({ caller }) func createTractor(name : Text, model : Text, ratePerHour : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create tractors");
    };
    let ownerTractors = getOrCreateMap(tractors, caller);
    let id = getNextId(nextTractorId, caller);
    let tractor : Tractor = {
      id;
      name;
      model;
      ratePerHour;
      status = #free;
      driverId = null;
    };
    ownerTractors.add(id, tractor);
    id;
  };

  public query ({ caller }) func getTractor(id : Nat) : async ?Tractor {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view tractors");
    };
    let ownerTractors = getOrCreateMap(tractors, caller);
    ownerTractors.get(id);
  };

  public query ({ caller }) func getAllTractors() : async [Tractor] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view tractors");
    };
    let ownerTractors = getOrCreateMap(tractors, caller);
    ownerTractors.values().toArray();
  };

  public shared ({ caller }) func updateTractor(id : Nat, name : Text, model : Text, ratePerHour : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update tractors");
    };
    let ownerTractors = getOrCreateMap(tractors, caller);
    switch (ownerTractors.get(id)) {
      case (null) { Runtime.trap("Tractor not found") };
      case (?tractor) {
        let updated : Tractor = {
          tractor with
          name;
          model;
          ratePerHour;
        };
        ownerTractors.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteTractor(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete tractors");
    };
    let ownerTractors = getOrCreateMap(tractors, caller);
    ownerTractors.remove(id);
  };

  public shared ({ caller }) func updateTractorStatus(id : Nat, status : TractorStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update tractor status");
    };
    let ownerTractors = getOrCreateMap(tractors, caller);
    switch (ownerTractors.get(id)) {
      case (null) { Runtime.trap("Tractor not found") };
      case (?tractor) {
        let updated : Tractor = { tractor with status };
        ownerTractors.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func assignDriverToTractor(tractorId : Nat, driverId : ?Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can assign drivers");
    };
    let ownerTractors = getOrCreateMap(tractors, caller);
    let ownerDrivers = getOrCreateMap(drivers, caller);

    switch (ownerTractors.get(tractorId)) {
      case (null) { Runtime.trap("Tractor not found") };
      case (?tractor) {
        switch (driverId) {
          case (null) {
            let updated : Tractor = { tractor with driverId = null };
            ownerTractors.add(tractorId, updated);
          };
          case (?did) {
            switch (ownerDrivers.get(did)) {
              case (null) { Runtime.trap("Driver not found") };
              case (?driver) {
                let updatedTractor : Tractor = { tractor with driverId = ?did };
                let updatedDriver : Driver = { driver with assignedTractorId = ?tractorId };
                ownerTractors.add(tractorId, updatedTractor);
                ownerDrivers.add(did, updatedDriver);
              };
            };
          };
        };
      };
    };
  };

  // Driver CRUD
  public shared ({ caller }) func createDriver(name : Text, phone : Text, performanceNotes : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create drivers");
    };
    let ownerDrivers = getOrCreateMap(drivers, caller);
    let id = getNextId(nextDriverId, caller);
    let driver : Driver = {
      id;
      name;
      phone;
      assignedTractorId = null;
      performanceNotes;
    };
    ownerDrivers.add(id, driver);
    id;
  };

  public query ({ caller }) func getDriver(id : Nat) : async ?Driver {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view drivers");
    };
    let ownerDrivers = getOrCreateMap(drivers, caller);
    ownerDrivers.get(id);
  };

  public query ({ caller }) func getAllDrivers() : async [Driver] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view drivers");
    };
    let ownerDrivers = getOrCreateMap(drivers, caller);
    ownerDrivers.values().toArray();
  };

  public shared ({ caller }) func updateDriver(id : Nat, name : Text, phone : Text, performanceNotes : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update drivers");
    };
    let ownerDrivers = getOrCreateMap(drivers, caller);
    switch (ownerDrivers.get(id)) {
      case (null) { Runtime.trap("Driver not found") };
      case (?driver) {
        let updated : Driver = {
          driver with
          name;
          phone;
          performanceNotes;
        };
        ownerDrivers.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteDriver(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete drivers");
    };
    let ownerDrivers = getOrCreateMap(drivers, caller);
    ownerDrivers.remove(id);
  };

  // Party CRUD
  public shared ({ caller }) func createParty(name : Text, phone : Text, address : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create parties");
    };
    let ownerParties = getOrCreateMap(parties, caller);
    let id = getNextId(nextPartyId, caller);
    let party : Party = {
      id;
      name;
      phone;
      address;
      creditBalance = 0;
    };
    ownerParties.add(id, party);
    id;
  };

  public query ({ caller }) func getParty(id : Nat) : async ?Party {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view parties");
    };
    let ownerParties = getOrCreateMap(parties, caller);
    ownerParties.get(id);
  };

  public query ({ caller }) func getAllParties() : async [Party] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view parties");
    };
    let ownerParties = getOrCreateMap(parties, caller);
    ownerParties.values().toArray();
  };

  public shared ({ caller }) func updateParty(id : Nat, name : Text, phone : Text, address : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update parties");
    };
    let ownerParties = getOrCreateMap(parties, caller);
    switch (ownerParties.get(id)) {
      case (null) { Runtime.trap("Party not found") };
      case (?party) {
        let updated : Party = {
          party with
          name;
          phone;
          address;
        };
        ownerParties.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteParty(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete parties");
    };
    let ownerParties = getOrCreateMap(parties, caller);
    ownerParties.remove(id);
  };

  public query ({ caller }) func getPartiesWithPendingCredit() : async [Party] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view parties");
    };
    let ownerParties = getOrCreateMap(parties, caller);
    ownerParties.values().toList<Party>().filter(func(p : Party) : Bool { p.creditBalance > 0 }).toArray();
  };

  // Booking CRUD
  public shared ({ caller }) func createBooking(
    tractorId : Nat,
    driverId : Nat,
    partyId : Nat,
    workType : Text,
    date : Int,
    hours : Nat,
    ratePerHour : Nat,
    advancePaid : Nat,
    paymentMethod : PaymentMethod,
    notes : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create bookings");
    };
    let ownerBookings = getOrCreateMap(bookings, caller);
    let id = getNextId(nextBookingId, caller);
    let totalAmount = hours * ratePerHour;
    let booking : Booking = {
      id;
      tractorId;
      driverId;
      partyId;
      workType;
      date;
      hours;
      ratePerHour;
      totalAmount;
      advancePaid;
      paymentMethod;
      status = #pending;
      notes;
    };
    ownerBookings.add(id, booking);
    id;
  };

  public query ({ caller }) func getBooking(id : Nat) : async ?Booking {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view bookings");
    };
    let ownerBookings = getOrCreateMap(bookings, caller);
    ownerBookings.get(id);
  };

  public query ({ caller }) func getAllBookings() : async [Booking] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view bookings");
    };
    let ownerBookings = getOrCreateMap(bookings, caller);
    ownerBookings.values().toArray();
  };

  public shared ({ caller }) func updateBooking(
    id : Nat,
    tractorId : Nat,
    driverId : Nat,
    partyId : Nat,
    workType : Text,
    date : Int,
    hours : Nat,
    ratePerHour : Nat,
    advancePaid : Nat,
    paymentMethod : PaymentMethod,
    status : BookingStatus,
    notes : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update bookings");
    };
    let ownerBookings = getOrCreateMap(bookings, caller);
    switch (ownerBookings.get(id)) {
      case (null) { Runtime.trap("Booking not found") };
      case (?booking) {
        let totalAmount = hours * ratePerHour;
        let updated : Booking = {
          id;
          tractorId;
          driverId;
          partyId;
          workType;
          date;
          hours;
          ratePerHour;
          totalAmount;
          advancePaid;
          paymentMethod;
          status;
          notes;
        };
        ownerBookings.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteBooking(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete bookings");
    };
    let ownerBookings = getOrCreateMap(bookings, caller);
    ownerBookings.remove(id);
  };

  public query ({ caller }) func getBookingsByDateRange(startDate : Int, endDate : Int) : async [Booking] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view bookings");
    };
    let ownerBookings = getOrCreateMap(bookings, caller);
    ownerBookings.values().toList<Booking>().filter(func(b : Booking) : Bool {
      b.date >= startDate and b.date <= endDate
    }).toArray();
  };

  public query ({ caller }) func getBookingsByTractor(tractorId : Nat) : async [Booking] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view bookings");
    };
    let ownerBookings = getOrCreateMap(bookings, caller);
    ownerBookings.values().toList<Booking>().filter(func(b : Booking) : Bool {
      b.tractorId == tractorId
    }).toArray();
  };

  public query ({ caller }) func getBookingsByParty(partyId : Nat) : async [Booking] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view bookings");
    };
    let ownerBookings = getOrCreateMap(bookings, caller);
    ownerBookings.values().toList<Booking>().filter(func(b : Booking) : Bool {
      b.partyId == partyId
    }).toArray();
  };

  // Expense CRUD
  public shared ({ caller }) func createExpense(
    tractorId : Nat,
    driverId : Nat,
    category : ExpenseCategory,
    amount : Nat,
    date : Int,
    notes : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create expenses");
    };
    let ownerExpenses = getOrCreateMap(expenses, caller);
    let id = getNextId(nextExpenseId, caller);
    let expense : Expense = {
      id;
      tractorId;
      driverId;
      category;
      amount;
      date;
      notes;
    };
    ownerExpenses.add(id, expense);
    id;
  };

  public query ({ caller }) func getExpense(id : Nat) : async ?Expense {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expenses");
    };
    let ownerExpenses = getOrCreateMap(expenses, caller);
    ownerExpenses.get(id);
  };

  public query ({ caller }) func getAllExpenses() : async [Expense] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expenses");
    };
    let ownerExpenses = getOrCreateMap(expenses, caller);
    ownerExpenses.values().toArray();
  };

  public shared ({ caller }) func updateExpense(
    id : Nat,
    tractorId : Nat,
    driverId : Nat,
    category : ExpenseCategory,
    amount : Nat,
    date : Int,
    notes : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update expenses");
    };
    let ownerExpenses = getOrCreateMap(expenses, caller);
    switch (ownerExpenses.get(id)) {
      case (null) { Runtime.trap("Expense not found") };
      case (?expense) {
        let updated : Expense = {
          id;
          tractorId;
          driverId;
          category;
          amount;
          date;
          notes;
        };
        ownerExpenses.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteExpense(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete expenses");
    };
    let ownerExpenses = getOrCreateMap(expenses, caller);
    ownerExpenses.remove(id);
  };

  public query ({ caller }) func getExpensesByTractor(tractorId : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expenses");
    };
    let ownerExpenses = getOrCreateMap(expenses, caller);
    var total : Nat = 0;
    for (expense in ownerExpenses.values()) {
      if (expense.tractorId == tractorId) {
        total += expense.amount;
      };
    };
    total;
  };

  public query ({ caller }) func getExpensesByDriver(driverId : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expenses");
    };
    let ownerExpenses = getOrCreateMap(expenses, caller);
    var total : Nat = 0;
    for (expense in ownerExpenses.values()) {
      if (expense.driverId == driverId and expense.category == #driverPayment) {
        total += expense.amount;
      };
    };
    total;
  };

  // Payment CRUD
  public shared ({ caller }) func createPayment(
    bookingId : Nat,
    amount : Nat,
    method : PaymentMethod,
    date : Int,
    notes : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create payments");
    };
    let ownerPayments = getOrCreateMap(payments, caller);
    let id = getNextId(nextPaymentId, caller);
    let payment : Payment = {
      id;
      bookingId;
      amount;
      method;
      date;
      notes;
    };
    ownerPayments.add(id, payment);
    id;
  };

  public query ({ caller }) func getPayment(id : Nat) : async ?Payment {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view payments");
    };
    let ownerPayments = getOrCreateMap(payments, caller);
    ownerPayments.get(id);
  };

  public query ({ caller }) func getAllPayments() : async [Payment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view payments");
    };
    let ownerPayments = getOrCreateMap(payments, caller);
    ownerPayments.values().toArray();
  };

  public shared ({ caller }) func updatePayment(
    id : Nat,
    bookingId : Nat,
    amount : Nat,
    method : PaymentMethod,
    date : Int,
    notes : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update payments");
    };
    let ownerPayments = getOrCreateMap(payments, caller);
    switch (ownerPayments.get(id)) {
      case (null) { Runtime.trap("Payment not found") };
      case (?payment) {
        let updated : Payment = {
          id;
          bookingId;
          amount;
          method;
          date;
          notes;
        };
        ownerPayments.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deletePayment(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete payments");
    };
    let ownerPayments = getOrCreateMap(payments, caller);
    ownerPayments.remove(id);
  };

  // Analytics Functions
  public query ({ caller }) func getEarningsToday() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view earnings");
    };
    let ownerBookings = getOrCreateMap(bookings, caller);
    let now = Time.now();
    let dayStart = now - (now % 86400000000000);
    var total : Nat = 0;
    for (booking in ownerBookings.values()) {
      if (booking.date >= dayStart and booking.status == #completed) {
        total += booking.totalAmount;
      };
    };
    total;
  };

  public query ({ caller }) func getEarningsThisMonth() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view earnings");
    };
    let ownerBookings = getOrCreateMap(bookings, caller);
    let now = Time.now();
    let monthStart = now - (now % 2592000000000000);
    var total : Nat = 0;
    for (booking in ownerBookings.values()) {
      if (booking.date >= monthStart and booking.status == #completed) {
        total += booking.totalAmount;
      };
    };
    total;
  };

  public query ({ caller }) func getTotalEarnings() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view earnings");
    };
    let ownerBookings = getOrCreateMap(bookings, caller);
    var total : Nat = 0;
    for (booking in ownerBookings.values()) {
      if (booking.status == #completed) {
        total += booking.totalAmount;
      };
    };
    total;
  };

  public query ({ caller }) func getNetProfit(startDate : Int, endDate : Int) : async Int {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profit");
    };
    let ownerBookings = getOrCreateMap(bookings, caller);
    let ownerExpenses = getOrCreateMap(expenses, caller);

    var earnings : Nat = 0;
    for (booking in ownerBookings.values()) {
      if (booking.date >= startDate and booking.date <= endDate and booking.status == #completed) {
        earnings += booking.totalAmount;
      };
    };

    var expenseTotal : Nat = 0;
    for (expense in ownerExpenses.values()) {
      if (expense.date >= startDate and expense.date <= endDate) {
        expenseTotal += expense.amount;
      };
    };

    Int.fromNat(earnings) - Int.fromNat(expenseTotal);
  };
};

