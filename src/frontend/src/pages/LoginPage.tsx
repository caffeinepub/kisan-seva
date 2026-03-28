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
import { Tractor, UserCheck } from "lucide-react";
import { useState } from "react";
import { useApp } from "../App";
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

  // ── Change Password ──
  const [chMobile, setChMobile] = useState("");
  const [chStep, setChStep] = useState<1 | 2>(1);
  const [chQuestion, setChQuestion] = useState("");
  const [chAnswer, setChAnswer] = useState("");
  const [chNewPassword, setChNewPassword] = useState("");
  const [chConfirmPassword, setChConfirmPassword] = useState("");
  const [chError, setChError] = useState("");
  const [chSuccess, setChSuccess] = useState("");

  // ── Handlers ──

  function handleLogin() {
    setLoginError("");
    if (!/^\d{10}$/.test(loginMobile)) {
      setLoginError(t.mobileInvalid);
      return;
    }
    if (loginPassword.length < 6) {
      setLoginError(t.passwordTooShort);
      return;
    }
    const ok = onLogin(loginMobile, loginPassword);
    if (!ok) setLoginError(t.loginWrongCredentials);
  }

  function handleCreateAccount() {
    const errors: Record<string, string> = {};
    if (!cName.trim()) errors.name = t.fullNameLabel;
    if (!/^\d{10}$/.test(cMobile)) errors.mobile = t.mobileInvalid;
    if (cPassword.length < 6) errors.password = t.passwordTooShort;
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
    if (chNewPassword.length < 6) {
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
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
      data-ocid="auth.tab"
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-green-700 to-green-900 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-5">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center w-16 h-16 bg-green-700 rounded-full shadow-lg">
            <Tractor className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Kisan Seva</h1>
          <p className="text-gray-500 text-sm text-center">
            {t.loginSubtitleText}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-1 w-full bg-gray-100 p-1 rounded-xl">
          {tabBtn("login", t.loginTabLogin)}
          {tabBtn("create", t.loginTabCreate)}
          {tabBtn("change", t.loginTabPassword)}
        </div>

        {/* ── Tab: Login ── */}
        {tab === "login" && (
          <div className="w-full flex flex-col gap-3">
            <div>
              <Label className="text-xs text-gray-600">
                {t.mobileNumberLabel}
              </Label>
              <Input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={loginMobile}
                onChange={(e) =>
                  setLoginMobile(e.target.value.replace(/\D/g, ""))
                }
                placeholder={t.mobileNumberPlaceholder}
                className="mt-1"
                data-ocid="auth.input"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">{t.passwordLabel}</Label>
              <Input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                className="mt-1"
                data-ocid="auth.input"
              />
            </div>
            {loginError && (
              <p
                className="text-red-500 text-xs text-center"
                data-ocid="auth.error_state"
              >
                {loginError}
              </p>
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
                className="text-center text-green-700 font-medium text-sm bg-green-50 rounded-lg py-2"
                data-ocid="auth.success_state"
              >
                {cSuccess}
              </div>
            )}

            {/* Name */}
            <div>
              <Label className="text-xs text-gray-600">{t.fullNameLabel}</Label>
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
              <Label className="text-xs text-gray-600">
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

            {/* Password */}
            <div>
              <Label className="text-xs text-gray-600">
                {t.passwordMinLabel}
              </Label>
              <Input
                type="password"
                value={cPassword}
                onChange={(e) => setCPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                className="mt-1"
                data-ocid="auth.input"
              />
              {cErrors.password && (
                <p
                  className="text-red-500 text-xs mt-1"
                  data-ocid="auth.error_state"
                >
                  {cErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <Label className="text-xs text-gray-600">
                {t.confirmPasswordLabel}
              </Label>
              <Input
                type="password"
                value={cConfirmPassword}
                onChange={(e) => setCConfirmPassword(e.target.value)}
                placeholder={t.confirmPasswordPlaceholder}
                className="mt-1"
                data-ocid="auth.input"
              />
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
              <Label className="text-xs text-gray-600">{t.pinLabel}</Label>
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
              <Label className="text-xs text-gray-600">
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
              <Label className="text-xs text-gray-600">
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
              className="w-full bg-green-700 hover:bg-green-800 text-white rounded-xl"
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
                className="text-center text-green-700 font-medium text-sm bg-green-50 rounded-lg py-2"
                data-ocid="auth.success_state"
              >
                {chSuccess}
              </div>
            )}

            {/* Step 1: Mobile */}
            {chStep === 1 && (
              <>
                <div>
                  <Label className="text-xs text-gray-600">
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
                <div className="bg-green-50 rounded-lg p-3 text-sm text-green-800 font-medium">
                  🔐 {chQuestion}
                </div>
                <div>
                  <Label className="text-xs text-gray-600">
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
                <div>
                  <Label className="text-xs text-gray-600">
                    {t.newPasswordLabel}
                  </Label>
                  <Input
                    type="password"
                    value={chNewPassword}
                    onChange={(e) => setChNewPassword(e.target.value)}
                    placeholder={t.newPasswordPlaceholder}
                    className="mt-1"
                    data-ocid="auth.input"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">
                    {t.confirmPasswordLabel}
                  </Label>
                  <Input
                    type="password"
                    value={chConfirmPassword}
                    onChange={(e) => setChConfirmPassword(e.target.value)}
                    placeholder={t.confirmPasswordPlaceholder}
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
                  onClick={handleChangePassword}
                  className="w-full bg-green-700 hover:bg-green-800 text-white rounded-xl"
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
                  className="text-xs text-gray-500 underline text-center"
                >
                  {t.goBackLink}
                </button>
              </>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-2 w-full">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-sm font-medium">
            {t.orDivider}
          </span>
          <div className="flex-1 h-px bg-gray-200" />
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
