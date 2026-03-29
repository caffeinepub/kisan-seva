import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Cloud,
  Download,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Moon,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../App";
import type { backendInterface } from "../backend";
import { useLocalAuth } from "../hooks/useLocalAuth";

type Props = { actor: backendInterface };

export default function SettingsPage({ actor }: Props) {
  const {
    t,
    lang,
    setLang,
    goBack,
    isGuest,
    logout,
    darkMode,
    setDarkMode,
    currentUser,
  } = useApp();
  const { deleteAccount, changePasswordWithOldPw, changePin } = useLocalAuth();
  const [profile, setProfile] = useState({
    ownerName: "",
    businessName: "",
    address: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);

  // Delete account dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePin, setDeletePin] = useState("");
  const [pinLockEnabled, setPinLockEnabledState] = useState(() => {
    return localStorage.getItem("ktp_pin_lock_enabled") !== "false";
  });
  const [deletePinError, setDeletePinError] = useState("");

  // File input ref for restore
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Change Password state ---
  const [cpOld, setCpOld] = useState("");
  const [cpNew, setCpNew] = useState("");
  const [cpConfirm, setCpConfirm] = useState("");
  const [cpShowOld, setCpShowOld] = useState(false);
  const [cpShowNew, setCpShowNew] = useState(false);
  const [cpShowConfirm, setCpShowConfirm] = useState(false);
  const [cpError, setCpError] = useState("");
  const [cpSuccess, setCpSuccess] = useState("");

  // --- Change PIN state ---
  const [pinOld, setPinOld] = useState("");
  const [pinNew, setPinNew] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState("");

  useEffect(() => {
    actor.getCallerUserProfile().then((p) => {
      if (p)
        setProfile({
          ownerName: p.ownerName,
          businessName: p.businessName,
          address: p.address,
          phone: p.phone,
        });
    });
  }, [actor]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await actor.saveCallerUserProfile(profile);
      toast.success(t.updatedMsg);
    } catch {
      toast.error(t.errorSavingMsg);
    }
    setSaving(false);
  };

  // --- Backup ---
  const handleDownloadBackup = () => {
    const backupData: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("ktp_")) {
        try {
          backupData[key] = JSON.parse(localStorage.getItem(key) || "null");
        } catch {
          backupData[key] = localStorage.getItem(key);
        }
      }
    }
    const json = JSON.stringify(backupData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `kisan-seva-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t.backupDownloaded || "Backup download started ✓");
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        for (const [key, value] of Object.entries(data)) {
          if (key.startsWith("ktp_")) {
            if (typeof value === "string") {
              localStorage.setItem(key, value);
            } else {
              localStorage.setItem(key, JSON.stringify(value));
            }
          }
        }
        toast.success(t.restoreSuccess || "Data restored! Reloading...");
        setTimeout(() => window.location.reload(), 1200);
      } catch {
        toast.error("Invalid backup file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // --- Delete Account ---
  const handleConfirmDelete = () => {
    if (!currentUser?.mobile) return;
    const success = deleteAccount(currentUser.mobile, deletePin);
    if (!success) {
      setDeletePinError(t.wrongPin || "Wrong PIN");
      return;
    }
    setDeleteDialogOpen(false);
    logout();
  };

  // --- Change Password handler ---
  const handleChangePassword = () => {
    setCpError("");
    setCpSuccess("");
    if (cpNew.length < 8) {
      setCpError("New password must be at least 8 characters");
      return;
    }
    if (cpNew !== cpConfirm) {
      setCpError("Passwords do not match");
      return;
    }
    const mobile = currentUser?.mobile ?? "";
    const ok = changePasswordWithOldPw(mobile, cpOld, cpNew);
    if (!ok) {
      setCpError("Current password is incorrect");
      return;
    }
    setCpSuccess("Password updated successfully ✓");
    setCpOld("");
    setCpNew("");
    setCpConfirm("");
  };

  // --- Change PIN handler ---
  const handleChangePin = () => {
    setPinError("");
    setPinSuccess("");
    if (pinNew.length !== 4) {
      setPinError("New PIN must be exactly 4 digits");
      return;
    }
    if (pinNew !== pinConfirm) {
      setPinError("PINs do not match");
      return;
    }
    const mobile = currentUser?.mobile ?? "";
    const ok = changePin(mobile, pinOld, pinNew);
    if (!ok) {
      setPinError("Current PIN is incorrect");
      return;
    }
    setPinSuccess("PIN updated successfully ✓");
    setPinOld("");
    setPinNew("");
    setPinConfirm("");
  };

  return (
    <div className="flex flex-col min-h-full bg-white dark:bg-gray-900">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-200 dark:border-gray-700">
        <button type="button" onClick={goBack}>
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <h1 className="font-bold text-lg text-gray-900 dark:text-gray-100">
          {t.settings}
        </h1>
      </div>
      <div className="p-4 flex flex-col gap-6">
        {/* Language */}
        <div>
          <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
            {t.language}
          </h2>
          <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {(["gu", "hi", "en"] as const).map((l) => (
              <button
                type="button"
                key={l}
                onClick={() => setLang(l)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  lang === l
                    ? "bg-white dark:bg-gray-700 shadow text-green-700"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                }`}
                data-ocid="settings.toggle"
              >
                {l === "gu" ? "ગુજરાતી" : l === "hi" ? "हिन्दी" : "English"}
              </button>
            ))}
          </div>
        </div>

        {/* Dark Mode */}
        <div>
          <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
            {t.darkMode || "Dark Mode"}
          </h2>
          <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-2">
              {darkMode ? (
                <Moon className="w-5 h-5 text-blue-400" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-500" />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {darkMode
                  ? t.darkModeOn || "Dark Mode On"
                  : t.darkModeOff || "Light Mode"}
              </span>
            </div>
            <Switch
              checked={darkMode}
              onCheckedChange={setDarkMode}
              data-ocid="settings.switch"
            />
          </div>
        </div>

        {/* App Lock (PIN) */}
        <div>
          <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
            {(t as any).appLockPin || "App Lock (PIN)"}
          </h2>
          <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-green-600" />
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                  {(t as any).appLockPin || "App Lock (PIN)"}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {(t as any).appLockDesc || "Require PIN every time app opens"}
                </span>
              </div>
            </div>
            <Switch
              checked={pinLockEnabled}
              onCheckedChange={(val) => {
                setPinLockEnabledState(val);
                localStorage.setItem("ktp_pin_lock_enabled", String(val));
              }}
              data-ocid="settings.switch"
            />
          </div>
        </div>

        {/* Security — Change Password & Change PIN */}
        {!isGuest && (
          <div>
            <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
              🔐 {(t as any).security || "Security"}
            </h2>

            {/* Change Password card */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 mb-3">
              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-3 text-sm">
                {(t as any).changePassword || "Change Password"}
              </h3>
              <div className="flex flex-col gap-3">
                {/* Current Password */}
                <div>
                  <Label className="text-gray-700 dark:text-gray-300 text-xs">
                    {(t as any).currentPassword || "Current Password"}
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      type={cpShowOld ? "text" : "password"}
                      value={cpOld}
                      onChange={(e) => {
                        setCpOld(e.target.value);
                        setCpError("");
                        setCpSuccess("");
                      }}
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 pr-10"
                      placeholder="••••••••"
                      data-ocid="settings.input"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      onClick={() => setCpShowOld((v) => !v)}
                    >
                      {cpShowOld ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                {/* New Password */}
                <div>
                  <Label className="text-gray-700 dark:text-gray-300 text-xs">
                    {(t as any).newPassword || "New Password"}
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      type={cpShowNew ? "text" : "password"}
                      value={cpNew}
                      onChange={(e) => {
                        setCpNew(e.target.value);
                        setCpError("");
                        setCpSuccess("");
                      }}
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 pr-10"
                      placeholder="Min 8 characters"
                      data-ocid="settings.input"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      onClick={() => setCpShowNew((v) => !v)}
                    >
                      {cpShowNew ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                {/* Confirm New Password */}
                <div>
                  <Label className="text-gray-700 dark:text-gray-300 text-xs">
                    {(t as any).confirmNewPassword || "Confirm New Password"}
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      type={cpShowConfirm ? "text" : "password"}
                      value={cpConfirm}
                      onChange={(e) => {
                        setCpConfirm(e.target.value);
                        setCpError("");
                        setCpSuccess("");
                      }}
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 pr-10"
                      placeholder="Re-enter new password"
                      data-ocid="settings.input"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      onClick={() => setCpShowConfirm((v) => !v)}
                    >
                      {cpShowConfirm ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                {cpError && (
                  <p
                    className="text-red-500 text-xs"
                    data-ocid="settings.error_state"
                  >
                    {cpError}
                  </p>
                )}
                {cpSuccess && (
                  <p
                    className="text-green-600 text-xs font-medium"
                    data-ocid="settings.success_state"
                  >
                    {cpSuccess}
                  </p>
                )}
                <Button
                  onClick={handleChangePassword}
                  disabled={!cpOld || !cpNew || !cpConfirm}
                  className="bg-green-700 hover:bg-green-800 text-white w-full rounded-lg disabled:opacity-50"
                  data-ocid="settings.save_button"
                >
                  {(t as any).updatePassword || "Update Password"}
                </Button>
              </div>
            </div>

            {/* Change PIN card */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-3 text-sm">
                {(t as any).changePin || "Change PIN"}
              </h3>
              <div className="flex flex-col gap-3">
                <div>
                  <Label className="text-gray-700 dark:text-gray-300 text-xs">
                    {(t as any).currentPin || "Current PIN"}
                  </Label>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    maxLength={4}
                    pattern="[0-9]*"
                    value={pinOld}
                    onChange={(e) => {
                      setPinOld(e.target.value.replace(/\D/g, "").slice(0, 4));
                      setPinError("");
                      setPinSuccess("");
                    }}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 tracking-widest text-center mt-1"
                    placeholder="••••"
                    data-ocid="settings.input"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 dark:text-gray-300 text-xs">
                    {(t as any).newPin || "New PIN"}
                  </Label>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    maxLength={4}
                    pattern="[0-9]*"
                    value={pinNew}
                    onChange={(e) => {
                      setPinNew(e.target.value.replace(/\D/g, "").slice(0, 4));
                      setPinError("");
                      setPinSuccess("");
                    }}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 tracking-widest text-center mt-1"
                    placeholder="••••"
                    data-ocid="settings.input"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 dark:text-gray-300 text-xs">
                    {(t as any).confirmNewPin || "Confirm New PIN"}
                  </Label>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    maxLength={4}
                    pattern="[0-9]*"
                    value={pinConfirm}
                    onChange={(e) => {
                      setPinConfirm(
                        e.target.value.replace(/\D/g, "").slice(0, 4),
                      );
                      setPinError("");
                      setPinSuccess("");
                    }}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 tracking-widest text-center mt-1"
                    placeholder="••••"
                    data-ocid="settings.input"
                  />
                </div>
                {pinError && (
                  <p
                    className="text-red-500 text-xs"
                    data-ocid="settings.error_state"
                  >
                    {pinError}
                  </p>
                )}
                {pinSuccess && (
                  <p
                    className="text-green-600 text-xs font-medium"
                    data-ocid="settings.success_state"
                  >
                    {pinSuccess}
                  </p>
                )}
                <Button
                  onClick={handleChangePin}
                  disabled={!pinOld || !pinNew || !pinConfirm}
                  className="bg-green-700 hover:bg-green-800 text-white w-full rounded-lg disabled:opacity-50"
                  data-ocid="settings.save_button"
                >
                  {(t as any).updatePin || "Update PIN"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Backup & Restore */}
        <div>
          <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
            {t.backupRestore || "Backup & Restore"}
          </h2>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadBackup}
              className="w-full justify-start gap-2 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
              data-ocid="settings.primary_button"
            >
              <Download className="w-4 h-4" />
              {t.downloadBackup || "Download Backup"}
            </Button>
            <Button
              variant="outline"
              onClick={handleRestoreClick}
              className="w-full justify-start gap-2 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
              data-ocid="settings.secondary_button"
            >
              <Upload className="w-4 h-4" />
              {t.restoreBackup || "Restore Backup"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleRestoreFile}
            />
            {!isGuest && (
              <div className="flex items-center gap-2 mt-1 px-1">
                <Cloud className="w-4 h-4 text-green-600" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t.cloudSynced || "Data synced to cloud"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Business Profile */}
        {!isGuest && (
          <div>
            <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
              {t.businessProfile}
            </h2>
            <div className="flex flex-col gap-3">
              <div>
                <Label className="text-gray-700 dark:text-gray-300">
                  {t.ownerName}
                </Label>
                <Input
                  value={profile.ownerName}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, ownerName: e.target.value }))
                  }
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                  data-ocid="settings.input"
                />
              </div>
              <div>
                <Label className="text-gray-700 dark:text-gray-300">
                  {t.businessName}
                </Label>
                <Input
                  value={profile.businessName}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, businessName: e.target.value }))
                  }
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                  data-ocid="settings.input"
                />
              </div>
              <div>
                <Label className="text-gray-700 dark:text-gray-300">
                  {t.phone}
                </Label>
                <Input
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, phone: e.target.value }))
                  }
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                  data-ocid="settings.input"
                />
              </div>
              <div>
                <Label className="text-gray-700 dark:text-gray-300">
                  {t.address}
                </Label>
                <Input
                  value={profile.address}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, address: e.target.value }))
                  }
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                  data-ocid="settings.input"
                />
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="mt-4 bg-green-700 hover:bg-green-800 text-white w-full py-3 rounded-xl"
              data-ocid="settings.save_button"
            >
              {saving ? t.savingText : t.save}
            </Button>
          </div>
        )}

        {/* Logout */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={logout}
            className="w-full border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 rounded-xl py-3"
            data-ocid="settings.delete_button"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isGuest ? t.exitGuestMode : t.logout}
          </Button>
        </div>

        {/* Delete Account (only for logged-in non-guest) */}
        {!isGuest && (
          <div className="pb-4">
            <Button
              variant="outline"
              onClick={() => {
                setDeletePin("");
                setDeletePinError("");
                setDeleteDialogOpen(true);
              }}
              className="w-full border-red-500 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-500 dark:hover:bg-red-900/20 rounded-xl py-3"
              data-ocid="settings.open_modal_button"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t.deleteAccount || "Delete Account"}
            </Button>
          </div>
        )}
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent
          className="dark:bg-gray-900 dark:border-gray-700"
          data-ocid="settings.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              {t.deleteAccount || "Delete Account"}
            </DialogTitle>
            <DialogDescription className="text-gray-700 dark:text-gray-300">
              {t.deleteAccountWarning ||
                "This will permanently delete your account and all data. This cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Label className="text-gray-700 dark:text-gray-300">
              {t.enterPinToConfirm || "Enter PIN to confirm"}
            </Label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={deletePin}
              onChange={(e) => {
                setDeletePin(e.target.value.replace(/\D/g, "").slice(0, 4));
                setDeletePinError("");
              }}
              className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 tracking-widest text-center text-xl"
              data-ocid="settings.input"
            />
            {deletePinError && (
              <p
                className="text-red-500 text-sm text-center"
                data-ocid="settings.error_state"
              >
                {deletePinError}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="dark:border-gray-600 dark:text-gray-300"
              data-ocid="settings.cancel_button"
            >
              {t.cancel || "Cancel"}
            </Button>
            <Button
              disabled={deletePin.length < 4}
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              data-ocid="settings.confirm_button"
            >
              {t.confirmDelete || "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
