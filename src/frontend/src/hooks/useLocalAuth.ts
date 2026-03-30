import { useState } from "react";

export interface LocalUser {
  name: string;
  mobile: string;
}

interface AccountRecord {
  name: string;
  mobile: string;
  password: string;
  pin: string;
  securityQuestion: string;
  securityAnswer: string;
}

const ACCOUNTS_KEY = "ktp_accounts";
const SESSION_KEY = "ktp_session";

function getAccounts(): AccountRecord[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") {
      return JSON.parse(parsed);
    }
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: AccountRecord[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function getSession(): { user: LocalUser; isGuest: boolean } | null {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function useLocalAuth() {
  const [session, setSession] = useState(() => getSession());

  const isLoggedIn = session !== null && !session.isGuest;
  const isGuest = session?.isGuest === true;
  const currentUser = session?.user ?? null;

  function createAccount(data: {
    name: string;
    mobile: string;
    password: string;
    pin: string;
    securityQuestion: string;
    securityAnswer: string;
  }): boolean {
    const accounts = getAccounts();
    if (accounts.find((a) => a.mobile.trim() === data.mobile.trim()))
      return false;
    accounts.push({
      name: data.name,
      mobile: data.mobile.trim(),
      password: data.password,
      pin: data.pin,
      securityQuestion: data.securityQuestion,
      securityAnswer: data.securityAnswer,
    });
    saveAccounts(accounts);
    return true;
  }

  function loginWithMobile(
    mobile: string,
    password: string,
  ): "ok" | "mobile_not_found" | "wrong_password" | "blocked" {
    const accounts = getAccounts();
    const byMobile = accounts.find((a) => a.mobile.trim() === mobile.trim());
    if (!byMobile) return "mobile_not_found";
    try {
      const blocked: string[] = JSON.parse(
        localStorage.getItem("ktp_blocked_users") || "[]",
      );
      if (blocked.includes(byMobile.mobile)) return "blocked";
    } catch {
      /* ignore */
    }
    if (byMobile.password !== password) return "wrong_password";
    const newSession = {
      user: { name: byMobile.name, mobile: byMobile.mobile },
      isGuest: false,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    setSession(newSession);
    return "ok";
  }

  function verifyPin(mobile: string, pin: string): boolean {
    const accounts = getAccounts();
    const account = accounts.find((a) => a.mobile.trim() === mobile.trim());
    return account?.pin === pin;
  }

  function changePin(mobile: string, oldPin: string, newPin: string): boolean {
    const accounts = getAccounts();
    const idx = accounts.findIndex((a) => a.mobile.trim() === mobile.trim());
    if (idx === -1) return false;
    if (accounts[idx].pin !== oldPin) return false;
    accounts[idx] = { ...accounts[idx], pin: newPin };
    saveAccounts(accounts);
    return true;
  }

  function resetPinViaSecurity(
    mobile: string,
    securityAnswer: string,
    newPin: string,
  ): boolean {
    const accounts = getAccounts();
    const idx = accounts.findIndex((a) => a.mobile.trim() === mobile.trim());
    if (idx === -1) return false;
    if (
      accounts[idx].securityAnswer.trim().toLowerCase() !==
      securityAnswer.trim().toLowerCase()
    )
      return false;
    accounts[idx] = { ...accounts[idx], pin: newPin };
    saveAccounts(accounts);
    return true;
  }

  function guestLogin() {
    const newSession = { user: { name: "Guest", mobile: "" }, isGuest: true };
    setSession(newSession);
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  }

  function changePassword(
    mobile: string,
    securityAnswer: string,
    newPassword: string,
  ): boolean {
    const accounts = getAccounts();
    const idx = accounts.findIndex((a) => a.mobile.trim() === mobile.trim());
    if (idx === -1) return false;
    const account = accounts[idx];
    if (
      account.securityAnswer.trim().toLowerCase() !==
      securityAnswer.trim().toLowerCase()
    )
      return false;
    accounts[idx] = { ...account, password: newPassword };
    saveAccounts(accounts);
    return true;
  }

  function changePasswordWithOldPw(
    mobile: string,
    oldPassword: string,
    newPassword: string,
  ): boolean {
    const accounts = getAccounts();
    const idx = accounts.findIndex((a) => a.mobile.trim() === mobile.trim());
    if (idx === -1) return false;
    if (accounts[idx].password !== oldPassword) return false;
    accounts[idx] = { ...accounts[idx], password: newPassword };
    saveAccounts(accounts);
    return true;
  }

  function getSecurityQuestion(mobile: string): string | null {
    const accounts = getAccounts();
    const account = accounts.find((a) => a.mobile.trim() === mobile.trim());
    return account?.securityQuestion ?? null;
  }

  function deleteAccount(mobile: string, pin: string): boolean {
    const accounts = getAccounts();
    const idx = accounts.findIndex(
      (a) => a.mobile.trim() === mobile.trim() && a.pin === pin,
    );
    if (idx === -1) return false;
    accounts.splice(idx, 1);
    saveAccounts(accounts);
    localStorage.removeItem(SESSION_KEY);
    const keysToRemove = Object.keys(localStorage).filter(
      (k) =>
        k.startsWith("ktp_") &&
        k !== ACCOUNTS_KEY &&
        k !== "ktp_admin_code" &&
        k !== "ktp_blocked_users",
    );
    for (const k of keysToRemove) localStorage.removeItem(k);
    return true;
  }

  function deleteUserByAdmin(mobile: string): boolean {
    const accounts = getAccounts();
    const filtered = accounts.filter((a) => a.mobile.trim() !== mobile.trim());
    if (filtered.length === accounts.length) return false;
    saveAccounts(filtered);
    const keysToRemove = Object.keys(localStorage).filter(
      (k) =>
        k.startsWith("ktp_") &&
        k !== ACCOUNTS_KEY &&
        k !== "ktp_admin_code" &&
        k !== "ktp_blocked_users",
    );
    for (const k of keysToRemove) localStorage.removeItem(k);
    return true;
  }

  return {
    isLoggedIn,
    isGuest,
    currentUser,
    createAccount,
    loginWithMobile,
    guestLogin,
    logout,
    changePassword,
    changePasswordWithOldPw,
    getSecurityQuestion,
    deleteAccount,
    deleteUserByAdmin,
    verifyPin,
    changePin,
    resetPinViaSecurity,
  };
}
