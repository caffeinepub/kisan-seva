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
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
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
    if (accounts.find((a) => a.mobile === data.mobile)) return false;
    accounts.push({
      name: data.name,
      mobile: data.mobile,
      password: data.password,
      pin: data.pin,
      securityQuestion: data.securityQuestion,
      securityAnswer: data.securityAnswer,
    });
    saveAccounts(accounts);
    return true;
  }

  function loginWithMobile(mobile: string, password: string): boolean {
    const accounts = getAccounts();
    const account = accounts.find(
      (a) => a.mobile === mobile && a.password === password,
    );
    if (!account) return false;
    const newSession = {
      user: { name: account.name, mobile: account.mobile },
      isGuest: false,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    setSession(newSession);
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
    const idx = accounts.findIndex((a) => a.mobile === mobile);
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

  function getSecurityQuestion(mobile: string): string | null {
    const accounts = getAccounts();
    const account = accounts.find((a) => a.mobile === mobile);
    return account?.securityQuestion ?? null;
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
    getSecurityQuestion,
  };
}
