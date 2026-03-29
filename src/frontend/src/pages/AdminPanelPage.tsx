import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Ban,
  CheckCircle,
  ChevronLeft,
  Eye,
  EyeOff,
  Key,
  LogOut,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useApp } from "../App";

const ADMIN_CODE_KEY = "ktp_admin_code";
const BLOCKED_KEY = "ktp_blocked_users";
const ACCOUNTS_KEY = "ktp_accounts";

function getAdminCode(): string {
  return localStorage.getItem(ADMIN_CODE_KEY) || "admin123";
}

function getBlockedUsers(): string[] {
  try {
    return JSON.parse(localStorage.getItem(BLOCKED_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveBlockedUsers(list: string[]) {
  localStorage.setItem(BLOCKED_KEY, JSON.stringify(list));
}

interface Account {
  name: string;
  mobile: string;
  createdAt?: string;
}

function getAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") return JSON.parse(parsed);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

type AdminTab = "users" | "settings";

interface Props {
  onExit: () => void;
  onDeleteUser: (mobile: string) => void;
}

export default function AdminPanelPage({ onExit, onDeleteUser }: Props) {
  const { t } = useApp();
  const [tab, setTab] = useState<AdminTab>("users");
  const [blocked, setBlocked] = useState<string[]>(() => getBlockedUsers());
  const [newCode, setNewCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [codeMsg, setCodeMsg] = useState("");
  const [codeError, setCodeError] = useState("");

  const [accounts, setAccounts] = useState(() => getAccounts());
  const [confirmDeleteMobile, setConfirmDeleteMobile] = useState<string | null>(
    null,
  );

  const refreshAccounts = () => setAccounts(getAccounts());

  const toggleBlock = (mobile: string) => {
    const updated = blocked.includes(mobile)
      ? blocked.filter((m) => m !== mobile)
      : [...blocked, mobile];
    setBlocked(updated);
    saveBlockedUsers(updated);
  };

  const handleDeleteUser = (mobile: string) => {
    onDeleteUser(mobile);
    // Remove from blocked list if present
    const updatedBlocked = blocked.filter((m) => m !== mobile);
    setBlocked(updatedBlocked);
    saveBlockedUsers(updatedBlocked);
    setConfirmDeleteMobile(null);
    refreshAccounts();
  };

  const handleChangeCode = () => {
    setCodeMsg("");
    setCodeError("");
    if (newCode.trim().length < 4) {
      setCodeError("Code must be at least 4 characters.");
      return;
    }
    if (newCode !== confirmCode) {
      setCodeError("Codes do not match.");
      return;
    }
    localStorage.setItem(ADMIN_CODE_KEY, newCode.trim());
    setCodeMsg((t as any).savedMsg || "Admin code updated successfully!");
    setNewCode("");
    setConfirmCode("");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={onExit}
          className="text-gray-400 hover:text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <Shield className="w-6 h-6 text-red-400" />
        <div>
          <h1 className="text-lg font-bold text-white">Admin Panel</h1>
          <p className="text-xs text-gray-400">Kisan Seva Management</p>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="ml-auto text-gray-400 hover:text-red-400"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          type="button"
          onClick={() => setTab("users")}
          className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-semibold transition-colors ${
            tab === "users"
              ? "text-white border-b-2 border-red-400"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          <Users className="w-4 h-4" />
          Users ({accounts.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("settings")}
          className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-semibold transition-colors ${
            tab === "settings"
              ? "text-white border-b-2 border-red-400"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          <Key className="w-4 h-4" />
          Settings
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === "users" && (
          <div className="flex flex-col gap-3">
            {accounts.length === 0 && (
              <div className="text-center text-gray-500 py-10">
                No registered users
              </div>
            )}
            {accounts.map((acc) => {
              const isBlocked = blocked.includes(acc.mobile);
              return (
                <div
                  key={acc.mobile}
                  className={`rounded-xl p-4 border flex items-center justify-between ${
                    isBlocked
                      ? "bg-red-950 border-red-700"
                      : "bg-gray-800 border-gray-700"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-white text-base">
                      {acc.name}
                    </p>
                    <p className="text-sm text-gray-400 mt-0.5">{acc.mobile}</p>
                    {acc.createdAt && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        {acc.createdAt}
                      </p>
                    )}
                    <span
                      className={`mt-1 inline-block text-xs font-bold px-2 py-0.5 rounded-full ${
                        isBlocked
                          ? "bg-red-600 text-white"
                          : "bg-green-700 text-white"
                      }`}
                    >
                      {isBlocked ? "BLOCKED" : "ACTIVE"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => toggleBlock(acc.mobile)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                        isBlocked
                          ? "bg-green-700 hover:bg-green-600 text-white"
                          : "bg-red-700 hover:bg-red-600 text-white"
                      }`}
                    >
                      {isBlocked ? (
                        <>
                          <CheckCircle className="w-4 h-4" /> Unblock
                        </>
                      ) : (
                        <>
                          <Ban className="w-4 h-4" /> Block
                        </>
                      )}
                    </button>
                    {confirmDeleteMobile === acc.mobile ? (
                      <div className="flex flex-col gap-1">
                        <p className="text-xs text-red-400 text-center">
                          Permanently delete?
                        </p>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(acc.mobile)}
                            className="flex-1 px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteMobile(null)}
                            className="flex-1 px-2 py-1 rounded bg-gray-600 hover:bg-gray-500 text-white text-xs"
                          >
                            No
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        data-ocid="admin.delete_button"
                        onClick={() => setConfirmDeleteMobile(acc.mobile)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-gray-700 hover:bg-red-800 text-red-400 hover:text-white transition-all"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "settings" && (
          <div className="flex flex-col gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                <Key className="w-4 h-4 text-yellow-400" />
                Change Admin Access Code
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                This code is entered in the mobile field on the login screen to
                access admin panel.
              </p>

              <div className="flex flex-col gap-3">
                <div>
                  <Label className="text-sm text-gray-300">
                    New Admin Code
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      type={showNew ? "text" : "password"}
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      placeholder="Enter new code (min 4 chars)"
                      className="bg-gray-700 border-gray-600 text-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showNew ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-gray-300">
                    Confirm New Code
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      value={confirmCode}
                      onChange={(e) => setConfirmCode(e.target.value)}
                      placeholder="Confirm new code"
                      className="bg-gray-700 border-gray-600 text-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showConfirm ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {codeError && (
                  <p className="text-red-400 text-sm">{codeError}</p>
                )}
                {codeMsg && <p className="text-green-400 text-sm">{codeMsg}</p>}

                <Button
                  onClick={handleChangeCode}
                  className="w-full bg-red-700 hover:bg-red-600 text-white"
                >
                  Update Admin Code
                </Button>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <h2 className="text-base font-bold text-white mb-1">Summary</h2>
              <p className="text-sm text-gray-400">
                Total users:{" "}
                <span className="text-white font-semibold">
                  {accounts.length}
                </span>
              </p>
              <p className="text-sm text-gray-400">
                Blocked users:{" "}
                <span className="text-red-400 font-semibold">
                  {blocked.length}
                </span>
              </p>
              <p className="text-sm text-gray-400">
                Active users:{" "}
                <span className="text-green-400 font-semibold">
                  {accounts.length - blocked.length}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { getAdminCode, getBlockedUsers };
