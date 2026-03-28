import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export type PasswordChecks = {
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  hasLength: boolean;
};

export function checkPassword(password: string): PasswordChecks {
  return {
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!?<>@#$%^&*()_+=\-\[\]{};':"\\|,.<>\/~`]/.test(password),
    hasLength: password.length >= 8,
  };
}

const WEAK_PATTERNS = [
  /^[a-zA-Z]+[0-9]+$/, // only letters then numbers e.g. abc123
  /^[a-zA-Z]+[@#$%]+[0-9]+$/, // name@123 style
  /password/i,
  /qwerty/i,
  /123456/,
  /abcdef/i,
  /iloveyou/i,
  /^12345678$/,
  /^abcdefgh$/i,
  /^[a-z]+\d+$/i,
];

export function isWeakPattern(password: string): boolean {
  if (password.length === 0) return false;
  return WEAK_PATTERNS.some((re) => re.test(password));
}

export function isPasswordValid(password: string): boolean {
  const checks = checkPassword(password);
  return (
    checks.hasUpper &&
    checks.hasLower &&
    checks.hasNumber &&
    checks.hasSpecial &&
    checks.hasLength &&
    !isWeakPattern(password)
  );
}

type ChecklistLabels = {
  uppercase: string;
  lowercase: string;
  number: string;
  special: string;
  length: string;
  weakError: string;
};

type Props = {
  password: string;
  labels: ChecklistLabels;
  show?: boolean;
  onToggleShow?: () => void;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  inputOcid?: string;
};

export default function PasswordStrengthChecklist({
  password,
  labels,
  show = false,
  onToggleShow,
  onChange,
  label,
  placeholder,
  inputOcid,
}: Props) {
  const checks = checkPassword(password);
  const weak = password.length > 0 && isWeakPattern(password);

  const items = [
    { key: "hasUpper", met: checks.hasUpper, label: labels.uppercase },
    { key: "hasLower", met: checks.hasLower, label: labels.lowercase },
    { key: "hasNumber", met: checks.hasNumber, label: labels.number },
    { key: "hasSpecial", met: checks.hasSpecial, label: labels.special },
    { key: "hasLength", met: checks.hasLength, label: labels.length },
  ];

  return (
    <div className="w-full">
      <Label className="text-xs text-gray-600">{label}</Label>
      <div className="relative mt-1">
        <Input
          type={show ? "text" : "password"}
          value={password}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
          data-ocid={inputOcid ?? "auth.input"}
        />
        {onToggleShow && (
          <button
            type="button"
            onClick={onToggleShow}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
            tabIndex={-1}
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Checklist */}
      {password.length > 0 && (
        <div className="mt-2 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 flex flex-col gap-1">
          {items.map((item) => (
            <div key={item.key} className="flex items-center gap-2">
              <span
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  item.met
                    ? "bg-green-500 border-green-500"
                    : "bg-white border-gray-300"
                }`}
              >
                {item.met && (
                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                )}
              </span>
              <span
                className={`text-xs ${
                  item.met ? "text-green-700 font-medium" : "text-gray-500"
                }`}
              >
                {item.label}
              </span>
            </div>
          ))}
          {weak && (
            <p className="text-red-500 text-xs mt-1 font-medium">
              ⚠ {labels.weakError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Hook for managing password show/hide state
export function usePasswordVisibility() {
  const [show, setShow] = useState(false);
  return { show, toggle: () => setShow((v) => !v) };
}
