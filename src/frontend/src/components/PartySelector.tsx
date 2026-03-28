import { Input } from "@/components/ui/input";
import { Plus, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../App";
import type { Party, backendInterface } from "../backend";
import { CASH_PARTY_ID, CASH_PARTY_NAME } from "../lib/cashParty";

type Props = {
  actor: backendInterface;
  parties: Party[];
  value: string;
  onChange: (partyId: string, partyName: string) => void;
  onPartiesUpdate: (parties: Party[]) => void;
  placeholder?: string;
};

export default function PartySelector({
  actor,
  parties,
  value,
  onChange,
  onPartiesUpdate,
  placeholder,
}: Props) {
  const { t } = useApp();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isCash = value === CASH_PARTY_ID;
  const selectedParty = isCash
    ? { name: CASH_PARTY_NAME, phone: "" }
    : parties.find((p) => p.id.toString() === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowCreate(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = parties.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search),
  );

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error(t.nameRequiredMsg);
      return;
    }
    if (!newPhone.trim()) {
      toast.error(t.mobileRequiredMsg);
      return;
    }
    setCreating(true);
    try {
      await actor.createParty(
        newName.trim(),
        newPhone.trim(),
        newAddress.trim(),
      );
      const updated = await actor.getAllParties();
      onPartiesUpdate(updated);
      const newParty = updated
        .filter((p) => p.name === newName.trim() && p.phone === newPhone.trim())
        .sort((a, b) => Number(b.id - a.id))[0];
      if (newParty) {
        onChange(newParty.id.toString(), newParty.name);
      }
      toast.success(t.partyAddedMsg);
      setShowCreate(false);
      setNewName("");
      setNewPhone("");
      setNewAddress("");
      setOpen(false);
    } catch {
      toast.error(t.errorSavingMsg);
    }
    setCreating(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setSearch("");
          setShowCreate(false);
        }}
        className="flex items-center gap-2 w-full bg-white border rounded-lg px-3 py-2.5 text-left"
      >
        {selectedParty ? (
          <>
            <span className="flex-1 text-sm text-gray-900">
              {selectedParty.name}
              {selectedParty.phone ? (
                <span className="text-gray-400 text-xs ml-2">
                  {selectedParty.phone}
                </span>
              ) : null}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("", "");
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <Search className="w-4 h-4 text-gray-400" />
            <span className="flex-1 text-sm text-gray-400">
              {placeholder || t.selectParty}
            </span>
          </>
        )}
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white border rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b">
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`${t.name} / ${t.phone}...`}
              className="text-sm"
            />
          </div>

          <div className="max-h-48 overflow-y-auto">
            {/* Cash Party — always first */}
            <button
              key={CASH_PARTY_ID}
              type="button"
              onClick={() => {
                onChange(CASH_PARTY_ID, CASH_PARTY_NAME);
                setOpen(false);
              }}
              className={`flex items-center gap-2 w-full px-3 py-2.5 text-left border-b border-yellow-100 ${
                value === CASH_PARTY_ID
                  ? "bg-yellow-100"
                  : "bg-yellow-50 hover:bg-yellow-100"
              }`}
            >
              <div className="flex-1">
                <div className="text-sm font-semibold text-yellow-800">
                  💰 Cash
                </div>
                <div className="text-xs text-yellow-600">
                  Fixed — no details needed
                </div>
              </div>
              <span className="text-xs bg-yellow-200 text-yellow-700 px-1.5 py-0.5 rounded-full font-medium">
                Fixed
              </span>
            </button>

            {filtered.length === 0 && (
              <div className="px-3 py-3 text-sm text-gray-400 text-center">
                {t.noPartyFound}
              </div>
            )}
            {filtered.map((p) => (
              <button
                key={p.id.toString()}
                type="button"
                onClick={() => {
                  onChange(p.id.toString(), p.name);
                  setOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2.5 hover:bg-green-50 text-left border-b border-gray-50 last:border-0"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {p.name}
                  </div>
                  {p.phone && (
                    <div className="text-xs text-gray-500">{p.phone}</div>
                  )}
                </div>
                {p.creditBalance > 0n && (
                  <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                    ₹{p.creditBalance.toString()} {t.creditBalance}
                  </span>
                )}
              </button>
            ))}
          </div>

          {!isCash && !showCreate ? (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 w-full px-3 py-2.5 border-t text-sm text-green-700 font-semibold hover:bg-green-50"
            >
              <Plus className="w-4 h-4" /> {t.newPartyCreate}
            </button>
          ) : !isCash && showCreate ? (
            <div className="p-3 border-t bg-green-50 flex flex-col gap-2">
              <p className="text-xs font-bold text-green-800">
                + {t.newPartyCreate}
              </p>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t.namePlaceholder}
                className="bg-white text-sm"
              />
              <Input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder={t.mobilePlaceholder}
                type="tel"
                className="bg-white text-sm"
              />
              <Input
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder={t.addressPlaceholder}
                className="bg-white text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 bg-green-600 text-white text-xs py-2 rounded-lg font-semibold"
                >
                  {creating ? t.savingText : t.save}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    setNewName("");
                    setNewPhone("");
                    setNewAddress("");
                  }}
                  className="flex-1 bg-gray-100 text-gray-600 text-xs py-2 rounded-lg"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
