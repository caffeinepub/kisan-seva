import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, Tractor, UserCheck } from "lucide-react";
import { useState } from "react";
import { useApp } from "../App";
import PasswordStrengthChecklist, {
  isPasswordValid,
  usePasswordVisibility,
} from "../components/PasswordStrengthChecklist";
import type { useLocalAuth } from "../hooks/useLocalAuth";

type AuthHook = ReturnType<typeof useLocalAuth>;

type Props = {
  onCreateAccount: AuthHook["createAccount"];
  onLogin: AuthHook["loginWithMobile"];
  onGuestLogin: AuthHook["guestLogin"];
  onChangePassword: AuthHook["changePassword"];
  getSecurityQuestion: AuthHook["getSecurityQuestion"];
};

type Tab = "login" | "create" | "change";

function EyeToggle({
  show,
  onToggle,
}: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:text-gray-300"
      tabIndex={-1}
      aria-label={show ? "Hide password" : "Show password"}
    >
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );
}

export default function LoginPage({
  onCreateAccount,
  onLogin,
  onGuestLogin,
  onChangePassword,
  getSecurityQuestion,
}: Props) {
  const { t, lang } = useApp();

  const SECURITY_QUESTIONS_GU = [
    "તમારી માતાનું નામ?",
    "તમારા પ્રાણીનું નામ?",
    "તમારું જન્મ શહેર?",
    "તમારો પ્રિય રંગ?",
    "તમારા પિતાનું નામ?",
  ];
  const SECURITY_QUESTIONS_HI = [
    "आपकी माँ का नाम क्या है?",
    "आपके पालतू जानवर का नाम?",
    "आपका जन्म शहर कौन सा है?",
    "आपका पसंदीदा रंग?",
    "आपके पिता का नाम?",
  ];
  const SECURITY_QUESTIONS_EN = [
    "What is your mother's name?",
    "What is your pet's name?",
    "What city were you born in?",
    "What is your favorite color?",
    "What is your father's name?",
  ];
  const SECURITY_QUESTIONS =
    lang === "gu"
      ? SECURITY_QUESTIONS_GU
      : lang === "hi"
        ? SECURITY_QUESTIONS_HI
        : SECURITY_QUESTIONS_EN;

  const [tab, setTab] = useState<Tab>("login");

  // ── Login ──
  const [loginMobile, setLoginMobile] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showCreateHint, setShowCreateHint] = useState(false);
  const loginPwVis = usePasswordVisibility();

  // ── Create Account ──
  const [cName, setCName] = useState("");
  const [cMobile, setCMobile] = useState("");
  const [cPassword, setCPassword] = useState("");
  const [cConfirmPassword, setCConfirmPassword] = useState("");
  const [cPin, setCPin] = useState("");
  const [cSecQ, setCSecQ] = useState("");
  const [cSecA, setCSecA] = useState("");
  const [cErrors, setCErrors] = useState<Record<string, string>>({});
  const [cSuccess, setCSuccess] = useState("");
  const cPwVis = usePasswordVisibility();
  const cConfirmVis = usePasswordVisibility();

  // ── Change Password ──
  const [chMobile, setChMobile] = useState("");
  const [chStep, setChStep] = useState<1 | 2>(1);
  const [chQuestion, setChQuestion] = useState("");
  const [chAnswer, setChAnswer] = useState("");
  const [chNewPassword, setChNewPassword] = useState("");
  const [chConfirmPassword, setChConfirmPassword] = useState("");
  const [chError, setChError] = useState("");
  const [chSuccess, setChSuccess] = useState("");
  const chPwVis = usePasswordVisibility();
  const chConfirmVis = usePasswordVisibility();

  // Checklist labels from i18n
  const pwLabels = {
    uppercase: (t as any).pwUppercase ?? "Uppercase letter",
    lowercase: (t as any).pwLowercase ?? "Lowercase letter",
    number: (t as any).pwNumber ?? "Number",
    special: (t as any).pwSpecial ?? "Special character (e.g. !?<>@#$%)",
    length: (t as any).pwLength ?? "8 characters or more",
    weakError:
      (t as any).pwWeakError ??
      "Weak password. Use a mix of uppercase, lowercase, numbers and symbols.",
  };

  // ── Handlers ──

  function handleLogin() {
    setLoginError("");
    setShowCreateHint(false);
    if (!/^\d{10}$/.test(loginMobile)) {
      setLoginError(t.mobileInvalid);
      return;
    }
    const result = onLogin(loginMobile, loginPassword);
    if (result === "mobile_not_found") {
      setLoginError(
        (t as any).loginMobileNotFound ??
          "This mobile number is not registered. Please create a new account.",
      );
      setShowCreateHint(true);
    } else if (result === "wrong_password") {
      setLoginError((t as any).loginWrongPassword ?? t.loginWrongCredentials);
      setShowCreateHint(false);
    }
  }

  function handleCreateAccount() {
    const errors: Record<string, string> = {};
    if (!cName.trim()) errors.name = t.fullNameLabel;
    if (!/^\d{10}$/.test(cMobile)) errors.mobile = t.mobileInvalid;
    if (!isPasswordValid(cPassword)) errors.password = t.passwordTooShort;
    if (cPassword !== cConfirmPassword)
      errors.confirmPassword = t.passwordMismatch;
    if (!/^\d{4}$/.test(cPin)) errors.pin = t.pinInvalid;
    if (!cSecQ) errors.secQ = t.secQRequired;
    if (!cSecA.trim()) errors.secA = t.secARequired;

    if (Object.keys(errors).length > 0) {
      setCErrors(errors);
      return;
    }
    setCErrors({});

    const ok = onCreateAccount({
      name: cName.trim(),
      mobile: cMobile,
      password: cPassword,
      pin: cPin,
      securityQuestion: cSecQ,
      securityAnswer: cSecA.trim(),
    });

    if (!ok) {
      setCErrors({ mobile: t.mobileAlreadyRegistered });
      return;
    }

    setCSuccess(t.accountCreatedMsg);
    setLoginMobile(cMobile);
    setTimeout(() => {
      setTab("login");
      setCSuccess("");
    }, 1500);
  }

  function handleFetchQuestion() {
    setChError("");
    if (!/^\d{10}$/.test(chMobile)) {
      setChError(t.mobileInvalid);
      return;
    }
    const q = getSecurityQuestion(chMobile);
    if (!q) {
      setChError(t.mobileNotRegistered);
      return;
    }
    setChQuestion(q);
    setChStep(2);
  }

  function handleChangePassword() {
    setChError("");
    if (!chAnswer.trim()) {
      setChError(t.secARequired);
      return;
    }
    if (!isPasswordValid(chNewPassword)) {
      setChError(t.passwordTooShort);
      return;
    }
    if (chNewPassword !== chConfirmPassword) {
      setChError(t.passwordMismatch);
      return;
    }
    const ok = onChangePassword(chMobile, chAnswer, chNewPassword);
    if (!ok) {
      setChError(t.answerWrong);
      return;
    }
    setChSuccess(t.passwordChangedMsg);
    setTimeout(() => {
      setTab("login");
      setChSuccess("");
      setChStep(1);
      setChMobile("");
      setChAnswer("");
      setChNewPassword("");
      setChConfirmPassword("");
    }, 1500);
  }

  const tabBtn = (tabName: Tab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(tabName)}
      className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
        tab === tabName
          ? "bg-green-700 text-white shadow"
          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:bg-gray-700"
      }`}
      data-ocid="auth.tab"
    >
      {label}
    </button>
  );

  const cPasswordValid = isPasswordValid(cPassword);
  const chPasswordValid = isPasswordValid(chNewPassword);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-green-700 to-green-900 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-5">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center w-16 h-16 bg-green-700 rounded-full shadow-lg">
            <Tractor className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Kisan Seva
          </h1>
          <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm text-center">
            {t.loginSubtitleText}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-1 w-full bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {tabBtn("login", t.loginTabLogin)}
          {tabBtn("create", t.loginTabCreate)}
          {tabBtn("change", t.loginTabPassword)}
        </div>

        {/* ── Tab: Login ── */}
        {tab === "login" && (
          <div className="w-full flex flex-col gap-3">
            <div>
              <Label className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">
                {t.mobileNumberLabel}
              </Label>
              <Input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={loginMobile}
                onChange={(e) => {
                  setLoginMobile(e.target.value.replace(/\D/g, ""));
                  setShowCreateHint(false);
                }}
                placeholder={t.mobileNumberPlaceholder}
                className="mt-1"
                data-ocid="auth.input"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">
                {t.passwordLabel}
              </Label>
              <div className="relative mt-1">
                <Input
                  type={loginPwVis.show ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="pr-10"
                  data-ocid="auth.input"
                />
                <EyeToggle
                  show={loginPwVis.show}
                  onToggle={loginPwVis.toggle}
                />
              </div>
            </div>
            {loginError && (
              <div data-ocid="auth.error_state">
                <p className="text-red-500 text-xs text-center">{loginError}</p>
                {showCreateHint && (
                  <button
                    type="button"
                    onClick={() => {
                      setTab("create");
                      setCMobile(loginMobile);
                      setLoginError("");
                      setShowCreateHint(false);
                    }}
                    className="mt-1 w-full text-xs text-green-700 underline text-center font-medium"
                  >
                    {(t as any).createAccountLink ?? "→ Create New Account"}
                  </button>
                )}
              </div>
            )}
            <Button
              onClick={handleLogin}
              className="w-full bg-green-700 hover:bg-green-800 text-white rounded-xl"
              data-ocid="auth.submit_button"
            >
              {t.loginBtn}
            </Button>
            <button
              type="button"
              onClick={() => setTab("change")}
              className="text-xs text-green-700 underline text-center mt-1"
            >
              {t.forgotPasswordLink}
            </button>
          </div>
        )}

        {/* ── Tab: Create Account ── */}
        {tab === "create" && (
          <div className="w-full flex flex-col gap-3">
            {cSuccess && (
              <div
                className="text-center text-green-700 font-medium text-sm bg-green-50 dark:bg-green-900/30 rounded-lg py-2"
                data-ocid="auth.success_state"
              >
                {cSuccess}
              </div>
            )}

            {/* Name */}
            <div>
              <Label className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">
                {t.fullNameLabel}
              </Label>
              <Input
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                placeholder={t.fullNamePlaceholder}
                className="mt-1"
                data-ocid="auth.input"
              />
              {cErrors.name && (
                <p
                  className="text-red-500 text-xs mt-1"
                  data-ocid="auth.error_state"
                >
                  {cErrors.name}
                </p>
              )}
            </div>

            {/* Mobile */}
            <div>
              <Label className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">
                {t.mobileNumberLabel}
              </Label>
              <Input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={cMobile}
                onChange={(e) => setCMobile(e.target.value.replace(/\D/g, ""))}
                placeholder={t.mobileNumberPlaceholder}
                className="mt-1"
                data-ocid="auth.input"
              />
              {cErrors.mobile && (
                <p
                  className="text-red-500 text-xs mt-1"
                  data-ocid="auth.error_state"
                >
                  {cErrors.mobile}
                </p>
              )}
            </div>

            {/* Password with strength checklist */}
            <PasswordStrengthChecklist
              password={cPassword}
              labels={pwLabels}
              show={cPwVis.show}
              onToggleShow={cPwVis.toggle}
              onChange={setCPassword}
              label={t.passwordMinLabel}
              placeholder={t.passwordPlaceholder}
              inputOcid="auth.input"
            />
            {cErrors.password && (
              <p className="text-red-500 text-xs" data-ocid="auth.error_state">
                {cErrors.password}
              </p>
            )}

            {/* Confirm Password */}
            <div>
              <Label className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">
                {t.confirmPasswordLabel}
              </Label>
              <div className="relative mt-1">
                <Input
                  type={cConfirmVis.show ? "text" : "password"}
                  value={cConfirmPassword}
                  onChange={(e) => setCConfirmPassword(e.target.value)}
                  placeholder={t.confirmPasswordPlaceholder}
                  className="pr-10"
                  data-ocid="auth.input"
                />
                <EyeToggle
                  show={cConfirmVis.show}
                  onToggle={cConfirmVis.toggle}
                />
              </div>
              {cErrors.confirmPassword && (
                <p
                  className="text-red-500 text-xs mt-1"
                  data-ocid="auth.error_state"
                >
                  {cErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* PIN */}
            <div>
              <Label className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">
                {t.pinLabel}
              </Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={cPin}
                onChange={(e) => setCPin(e.target.value.replace(/\D/g, ""))}
                placeholder={t.pinPlaceholder}
                className="mt-1"
                data-ocid="auth.input"
              />
              {cErrors.pin && (
                <p
                  className="text-red-500 text-xs mt-1"
                  data-ocid="auth.error_state"
                >
                  {cErrors.pin}
                </p>
              )}
            </div>

            {/* Security Question */}
            <div>
              <Label className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">
                {t.securityQuestionLabel}
              </Label>
              <Select value={cSecQ} onValueChange={setCSecQ}>
                <SelectTrigger className="mt-1" data-ocid="auth.select">
                  <SelectValue placeholder={t.securityQuestionPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {SECURITY_QUESTIONS.map((q) => (
                    <SelectItem key={q} value={q}>
                      {q}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {cErrors.secQ && (
                <p
                  className="text-red-500 text-xs mt-1"
                  data-ocid="auth.error_state"
                >
                  {cErrors.secQ}
                </p>
              )}
            </div>

            {/* Security Answer */}
            <div>
              <Label className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">
                {t.securityAnswerLabel}
              </Label>
              <Input
                value={cSecA}
                onChange={(e) => setCSecA(e.target.value)}
                placeholder={t.securityAnswerPlaceholder}
                className="mt-1"
                data-ocid="auth.input"
              />
              {cErrors.secA && (
                <p
                  className="text-red-500 text-xs mt-1"
                  data-ocid="auth.error_state"
                >
                  {cErrors.secA}
                </p>
              )}
            </div>

            <Button
              onClick={handleCreateAccount}
              disabled={!cPasswordValid}
              className="w-full bg-green-700 hover:bg-green-800 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              data-ocid="auth.submit_button"
            >
              {t.createAccountBtn}
            </Button>
          </div>
        )}

        {/* ── Tab: Change Password ── */}
        {tab === "change" && (
          <div className="w-full flex flex-col gap-3">
            {chSuccess && (
              <div
                className="text-center text-green-700 font-medium text-sm bg-green-50 dark:bg-green-900/30 rounded-lg py-2"
                data-ocid="auth.success_state"
              >
                {chSuccess}
              </div>
            )}

            {/* Step 1: Mobile */}
            {chStep === 1 && (
              <>
                <div>
                  <Label className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">
                    {t.mobileNumberLabel}
                  </Label>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={chMobile}
                    onChange={(e) =>
                      setChMobile(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder={t.registeredMobilePlaceholder}
                    className="mt-1"
                    data-ocid="auth.input"
                  />
                </div>
                {chError && (
                  <p
                    className="text-red-500 text-xs text-center"
                    data-ocid="auth.error_state"
                  >
                    {chError}
                  </p>
                )}
                <Button
                  onClick={handleFetchQuestion}
                  className="w-full bg-green-700 hover:bg-green-800 text-white rounded-xl"
                  data-ocid="auth.submit_button"
                >
                  {t.continueBtn}
                </Button>
              </>
            )}

            {/* Step 2: Answer + New Password */}
            {chStep === 2 && (
              <>
                <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 text-sm text-green-800 font-medium">
                  🔐 {chQuestion}
                </div>
                <div>
                  <Label className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">
                    {t.securityAnswerLabel}
                  </Label>
                  <Input
                    value={chAnswer}
                    onChange={(e) => setChAnswer(e.target.value)}
                    placeholder={t.answerPlaceholder}
                    className="mt-1"
                    data-ocid="auth.input"
                  />
                </div>

                {/* New Password with strength checklist */}
                <PasswordStrengthChecklist
                  password={chNewPassword}
                  labels={pwLabels}
                  show={chPwVis.show}
                  onToggleShow={chPwVis.toggle}
                  onChange={setChNewPassword}
                  label={t.newPasswordLabel}
                  placeholder={t.newPasswordPlaceholder}
                  inputOcid="auth.input"
                />

                {/* Confirm New Password */}
                <div>
                  <Label className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">
                    {t.confirmPasswordLabel}
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      type={chConfirmVis.show ? "text" : "password"}
                      value={chConfirmPassword}
                      onChange={(e) => setChConfirmPassword(e.target.value)}
                      placeholder={t.confirmPasswordPlaceholder}
                      className="pr-10"
                      data-ocid="auth.input"
                    />
                    <EyeToggle
                      show={chConfirmVis.show}
                      onToggle={chConfirmVis.toggle}
                    />
                  </div>
                </div>

                {chError && (
                  <p
                    className="text-red-500 text-xs text-center"
                    data-ocid="auth.error_state"
                  >
                    {chError}
                  </p>
                )}
                <Button
                  onClick={handleChangePassword}
                  disabled={!chPasswordValid}
                  className="w-full bg-green-700 hover:bg-green-800 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  data-ocid="auth.submit_button"
                >
                  {t.changePasswordBtn}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setChStep(1);
                    setChError("");
                  }}
                  className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 underline text-center"
                >
                  {t.goBackLink}
                </button>
              </>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-2 w-full">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">
            {t.orDivider}
          </span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Guest Login */}
        <Button
          variant="outline"
          onClick={onGuestLogin}
          className="w-full rounded-xl border-orange-400 text-orange-600 hover:bg-orange-50 text-xs py-3 h-auto"
          data-ocid="auth.secondary_button"
        >
          <UserCheck className="w-4 h-4 mr-2" />
          {t.guestContinue}
        </Button>
      </div>
    </div>
  );
}
