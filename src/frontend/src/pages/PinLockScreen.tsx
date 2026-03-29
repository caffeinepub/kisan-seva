import { Delete, Tractor } from "lucide-react";
import { useState } from "react";
import type { useLocalAuth } from "../hooks/useLocalAuth";
import type { getT } from "../i18n";

type AuthHook = ReturnType<typeof useLocalAuth>;

type Props = {
  mobile: string;
  userName: string;
  onUnlock: () => void;
  t: ReturnType<typeof getT>;
  verifyPin: AuthHook["verifyPin"];
  resetPinViaSecurity: AuthHook["resetPinViaSecurity"];
  getSecurityQuestion: AuthHook["getSecurityQuestion"];
};

export default function PinLockScreen({
  mobile,
  userName,
  onUnlock,
  t,
  verifyPin,
  resetPinViaSecurity,
  getSecurityQuestion,
}: Props) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [mode, setMode] = useState<"pin" | "reset">("pin");

  // Reset PIN flow
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [secAnswer, setSecAnswer] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newPinStep, setNewPinStep] = useState<"answer" | "newPin">("answer");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  const maxAttempts = 3;
  function handleDigit(d: string) {
    if (pin.length < 4) {
      const next = pin + d;
      setPin(next);
      setError("");
      if (next.length === 4) {
        setTimeout(() => checkPin(next), 100);
      }
    }
  }

  function handleDelete() {
    setPin((p) => p.slice(0, -1));
    setError("");
  }

  function checkPin(entered: string) {
    if (verifyPin(mobile, entered)) {
      onUnlock();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPin("");
      if (newAttempts >= maxAttempts) {
        setError(
          (t as any).tooManyPinAttempts ??
            "Too many attempts. Use security question.",
        );
      } else {
        setError((t as any).pinIncorrect ?? "Incorrect PIN");
      }
    }
  }

  function handleForgotPin() {
    const q = getSecurityQuestion(mobile);
    if (q) {
      setSecurityQuestion(q);
      setMode("reset");
      setNewPinStep("answer");
      setResetError("");
      setResetSuccess("");
      setSecAnswer("");
      setNewPin("");
    }
  }

  function handleAnswerSubmit() {
    if (!secAnswer.trim()) {
      setResetError((t as any).secARequired ?? "Please enter your answer");
      return;
    }
    setResetError("");
    setNewPinStep("newPin");
  }

  function handleNewPinDigit(d: string) {
    if (newPin.length < 4) {
      const next = newPin + d;
      setNewPin(next);
      setResetError("");
      if (next.length === 4) {
        setTimeout(() => doResetPin(next), 100);
      }
    }
  }

  function handleNewPinDelete() {
    setNewPin((p) => p.slice(0, -1));
  }

  function doResetPin(enteredNewPin: string) {
    const ok = resetPinViaSecurity(mobile, secAnswer, enteredNewPin);
    if (ok) {
      setResetSuccess((t as any).pinResetSuccess ?? "PIN reset successfully");
      setTimeout(() => {
        onUnlock();
      }, 1200);
    } else {
      setResetError((t as any).answerWrong ?? "Wrong answer");
      setNewPin("");
      setNewPinStep("answer");
    }
  }

  const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  function PinDots({ value, max = 4 }: { value: string; max?: number }) {
    return (
      <div className="flex gap-4 justify-center my-4">
        {(["p0", "p1", "p2", "p3"] as const).slice(0, max).map((pos, i) => (
          <div
            key={pos}
            className={`w-4 h-4 rounded-full border-2 transition-all ${
              i < value.length
                ? "bg-green-400 border-green-400"
                : "border-white/60 bg-transparent"
            }`}
          />
        ))}
      </div>
    );
  }

  function NumPad({
    onDigit,
    onDelete,
  }: { onDigit: (d: string) => void; onDelete: () => void }) {
    return (
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs mx-auto mt-4">
        {DIGITS.map((d) => {
          if (d === "") return <div key="empty-pos" />;
          if (d === "del") {
            return (
              <button
                key="del"
                type="button"
                onClick={onDelete}
                className="flex items-center justify-center h-16 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
                data-ocid="pin.delete_button"
              >
                <Delete className="w-6 h-6 text-white" />
              </button>
            );
          }
          return (
            <button
              key={`digit-${d}`}
              type="button"
              onClick={() => onDigit(d)}
              className="flex items-center justify-center h-16 text-2xl font-semibold text-white rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all shadow"
              data-ocid="pin.button"
            >
              {d}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-green-700 to-green-900 p-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-4">
        {/* Logo + Welcome */}
        <div className="flex flex-col items-center gap-2 mb-2">
          <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-full shadow-lg">
            <Tractor className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-white text-xl font-bold mt-1">
            {(t as any).welcomeBack ?? "Welcome back"}, {userName}!
          </h1>
        </div>

        {/* PIN entry mode */}
        {mode === "pin" && (
          <div className="w-full flex flex-col items-center">
            <p className="text-white/80 text-sm">
              {(t as any).enterPin ?? "Enter PIN"}
            </p>
            <PinDots value={pin} />
            {error && (
              <p
                className="text-red-300 text-sm text-center mb-2"
                data-ocid="pin.error_state"
              >
                {error}
              </p>
            )}
            <NumPad onDigit={handleDigit} onDelete={handleDelete} />
            <button
              type="button"
              onClick={handleForgotPin}
              className="mt-4 text-white/70 text-sm underline"
              data-ocid="pin.link"
            >
              {(t as any).forgotPin ?? "Forgot PIN?"}
            </button>
          </div>
        )}

        {/* Reset PIN mode */}
        {mode === "reset" && (
          <div className="w-full flex flex-col items-center gap-3">
            <h2 className="text-white font-semibold text-lg">
              {(t as any).resetPinTitle ?? "Reset PIN"}
            </h2>

            {resetSuccess ? (
              <div className="bg-green-500/30 rounded-xl px-4 py-3 text-white text-sm text-center">
                {resetSuccess}
              </div>
            ) : (
              <>
                {newPinStep === "answer" && (
                  <div className="w-full flex flex-col gap-2">
                    <div className="bg-white/10 rounded-xl p-3 text-white/90 text-sm">
                      🔐 {securityQuestion}
                    </div>
                    <input
                      type="text"
                      value={secAnswer}
                      onChange={(e) => setSecAnswer(e.target.value)}
                      placeholder={
                        (t as any).answerPlaceholder ?? "Your answer"
                      }
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 outline-none focus:border-white/60"
                      data-ocid="pin.input"
                    />
                    {resetError && (
                      <p
                        className="text-red-300 text-sm text-center"
                        data-ocid="pin.error_state"
                      >
                        {resetError}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleAnswerSubmit}
                      className="w-full bg-green-500 hover:bg-green-400 text-white font-semibold py-3 rounded-xl transition-colors"
                      data-ocid="pin.submit_button"
                    >
                      {(t as any).continueBtn ?? "Continue"}
                    </button>
                  </div>
                )}

                {newPinStep === "newPin" && (
                  <div className="w-full flex flex-col items-center">
                    <p className="text-white/80 text-sm">
                      {(t as any).newPinLabel ?? "New PIN (4 digits)"}
                    </p>
                    <PinDots value={newPin} />
                    {resetError && (
                      <p
                        className="text-red-300 text-sm text-center mb-2"
                        data-ocid="pin.error_state"
                      >
                        {resetError}
                      </p>
                    )}
                    <NumPad
                      onDigit={handleNewPinDigit}
                      onDelete={handleNewPinDelete}
                    />
                  </div>
                )}
              </>
            )}

            <button
              type="button"
              onClick={() => {
                setMode("pin");
                setAttempts(0);
                setError("");
                setPin("");
              }}
              className="text-white/60 text-sm underline mt-2"
              data-ocid="pin.cancel_button"
            >
              {(t as any).goBackLink ?? "Go back"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
