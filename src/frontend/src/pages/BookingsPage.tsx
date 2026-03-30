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
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle, Menu, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../App";
import {
  type Booking,
  BookingStatus,
  type Party,
  PaymentMethod,
  type backendInterface,
} from "../backend";
import PartySelector from "../components/PartySelector";
import VoiceInputButton from "../components/VoiceInputButton";
import { useVoiceInput } from "../hooks/useVoiceInput";
import { CASH_PARTY_ID } from "../lib/cashParty";
import { parseVoiceTranscript } from "../lib/voiceParser";
import { getStoredServices } from "./ServicesPage";
import { getNextGlobalCounter } from "./TransactionsPage";

type Props = {
  actor: backendInterface;
  onOpenSidebar?: () => void;
  onCompleteBooking: (b: Booking) => void;
  listOnly?: boolean;
};

type SimpleForm = {
  partyId: string;
  partyMobile: string;
  serviceType: string;
  date: string;
  time: string;
  notes: string;
};

const emptyForm: SimpleForm = {
  partyId: "",
  partyMobile: "",
  serviceType: "",
  date: new Date().toISOString().split("T")[0],
  time: new Date().toTimeString().slice(0, 5),
  notes: "",
};

export default function BookingsPage({
  actor,
  onOpenSidebar,
  onCompleteBooking,
  listOnly,
}: Props) {
  const { t, goBack } = useApp();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SimpleForm>(emptyForm);
  const [editId, setEditId] = useState<bigint | null>(null);
  const [saving, setSaving] = useState(false);
  const [licenceExpired, setLicenceExpired] = useState(false);
  const {
    isSupported: voiceSupported,
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput();

  const serviceTypes = getStoredServices().map((s) => s.name);
  const allServiceTypes =
    serviceTypes.length > 0
      ? serviceTypes
      : ["Ploughing", "Rotavator", "Leveling", "Transport", "Other"];

  const load = async () => {
    const [b, pa] = await Promise.all([
      actor.getAllBookings(),
      actor.getAllParties(),
    ]);
    setBookings(b.sort((a, b) => Number(b.date - a.date)));
    setParties(pa);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: actor is stable
  useEffect(() => {
    load();
  }, [actor]);

  useEffect(() => {
    if (!form.serviceType && allServiceTypes.length > 0) {
      setForm((f) => ({ ...f, serviceType: allServiceTypes[0] }));
    }
  }, [form.serviceType, allServiceTypes]);

  // Auto-fill mobile from selected party
  useEffect(() => {
    if (!form.partyId || form.partyId === CASH_PARTY_ID) {
      setForm((f) => ({ ...f, partyMobile: "" }));
      return;
    }
    const party = parties.find((p) => p.id.toString() === form.partyId);
    if (party) setForm((f) => ({ ...f, partyMobile: party.phone || "" }));
  }, [form.partyId, parties]);
  // Voice transcript processing
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (!transcript || !showForm || editId) return;
    const serviceNames = getStoredServices().map((s) => s.name);
    const partyList = parties.map((p) => ({
      id: p.id.toString(),
      name: p.name,
    }));
    const parsed = parseVoiceTranscript(transcript, partyList, serviceNames);
    if (parsed.partyId) {
      setForm((f) => ({ ...f, partyId: parsed.partyId! }));
    } else if (parsed.partyName) {
      const found = parties.find(
        (p) => p.name.toLowerCase() === parsed.partyName!.toLowerCase(),
      );
      if (found) setForm((f) => ({ ...f, partyId: found.id.toString() }));
    }
    if (parsed.serviceType)
      setForm((f) => ({ ...f, serviceType: parsed.serviceType! }));
    if (parsed.notes) setForm((f) => ({ ...f, notes: parsed.notes! }));
    resetTranscript();
    toast.success("Voice input applied — please review fields");
  }, [transcript]);

  const handleSave = async () => {
    // Check if user is blocked (licence expired)
    const blockedUsers: string[] = (() => {
      try {
        return JSON.parse(localStorage.getItem("ktp_blocked_users") || "[]");
      } catch {
        return [];
      }
    })();
    const currentMobile = (() => {
      try {
        return (
          JSON.parse(localStorage.getItem("ktp_session") || "null")?.user
            ?.mobile || ""
        );
      } catch {
        return "";
      }
    })();
    if (blockedUsers.includes(currentMobile)) {
      setLicenceExpired(true);
      return;
    }
    const inactiveUsers: string[] = (() => {
      try {
        return JSON.parse(localStorage.getItem("ktp_inactive_users") || "[]");
      } catch {
        return [];
      }
    })();
    if (inactiveUsers.includes(currentMobile)) {
      toast.error("તમે inactive છો, કૃપા કરીને admin નો સંપર્ક કરો");
      return;
    }

    if (!form.partyId || !form.serviceType) {
      toast.error(t.partyServiceRequired);
      return;
    }
    if (form.partyId !== CASH_PARTY_ID && !form.partyMobile.trim()) {
      toast.error(t.partyMobileRequired);
      return;
    }
    setSaving(true);
    try {
      const partyBigInt =
        form.partyId === CASH_PARTY_ID ? BigInt(0) : BigInt(form.partyId);
      // Combine date + time into a single timestamp
      const dateTimeStr = form.time ? `${form.date}T${form.time}` : form.date;
      const dateMs = BigInt(new Date(dateTimeStr).getTime());
      if (editId !== null) {
        await actor.updateBooking(
          editId,
          BigInt(0),
          BigInt(0),
          partyBigInt,
          form.serviceType,
          dateMs,
          BigInt(1),
          BigInt(0),
          BigInt(0),
          PaymentMethod.cash,
          BookingStatus.pending,
          form.notes,
        );
        toast.success(t.bookingUpdatedMsg);
      } else {
        const bookingId = await actor.createBooking(
          BigInt(0),
          BigInt(0),
          partyBigInt,
          form.serviceType,
          dateMs,
          BigInt(1),
          BigInt(0),
          BigInt(0),
          PaymentMethod.cash,
          form.notes,
        );
        // Assign next number from shared global counter
        const bkgNum = getNextGlobalCounter();
        localStorage.setItem(
          `ktp_bkg_num_${bookingId.toString()}`,
          String(bkgNum),
        );
        toast.success(t.bookingCreatedMsg);
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditId(null);
      await load();
    } catch (_e) {
      toast.error(t.errorSavingMsg);
    }
    setSaving(false);
  };

  const handleDelete = async (id: bigint) => {
    if (!confirm("Delete this booking?")) return;
    await actor.deleteBooking(id);
    toast.success(t.deletedMsg);
    await load();
  };

  const openEdit = (b: Booking) => {
    const party = parties.find((p) => p.id === b.partyId);
    const dateObj = new Date(Number(b.date));
    setForm({
      partyId: b.partyId.toString(),
      partyMobile: party?.phone || "",
      serviceType: b.workType,
      date: dateObj.toISOString().split("T")[0],
      time: dateObj.toTimeString().slice(0, 5),
      notes: b.notes,
    });
    setEditId(b.id);
    setShowForm(true);
  };

  const getPartyName = (id: bigint) =>
    parties.find((p) => p.id === id)?.name || id.toString();

  const statusColors: Record<BookingStatus, string> = {
    [BookingStatus.pending]: "bg-yellow-100 text-yellow-700",
    [BookingStatus.completed]: "bg-green-100 text-green-700",
    [BookingStatus.cancelled]: "bg-red-100 text-red-600",
  };

  if (showForm) {
    return (
      <div className="flex flex-col min-h-full bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b">
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setEditId(null);
              setForm(emptyForm);
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">
            {editId ? t.edit : t.newBooking}
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <div>
            <Label>{t.selectParty} *</Label>
            <div className="mt-1">
              <PartySelector
                actor={actor}
                parties={parties}
                value={form.partyId}
                onChange={(id) => setForm((f) => ({ ...f, partyId: id }))}
                onPartiesUpdate={setParties}
              />
            </div>
          </div>

          {/* Party Mobile */}
          <div>
            <Label>
              {t.partyMobileLabel} {form.partyId !== CASH_PARTY_ID ? "*" : ""}
            </Label>
            <Input
              type="tel"
              value={form.partyMobile}
              onChange={(e) =>
                setForm((f) => ({ ...f, partyMobile: e.target.value }))
              }
              placeholder="Mobile Number"
              disabled={form.partyId === CASH_PARTY_ID}
              className={
                form.partyId === CASH_PARTY_ID
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                  : "bg-white dark:bg-gray-900"
              }
              data-ocid="bookings.party_mobile.input"
            />
          </div>

          <div>
            <Label>{t.workType} *</Label>
            <Select
              value={form.serviceType}
              onValueChange={(v) => setForm((f) => ({ ...f, serviceType: v }))}
            >
              <SelectTrigger data-ocid="bookings.servicetype.select">
                <SelectValue placeholder={t.workType} />
              </SelectTrigger>
              <SelectContent>
                {allServiceTypes.map((st) => (
                  <SelectItem key={st} value={st}>
                    {st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date + Time side by side */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>{t.date}</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
                data-ocid="bookings.date.input"
              />
            </div>
            <div className="flex-1">
              <Label>{t.timeLabel2}</Label>
              <Input
                type="time"
                value={form.time}
                onChange={(e) =>
                  setForm((f) => ({ ...f, time: e.target.value }))
                }
                data-ocid="bookings.time.input"
              />
            </div>
          </div>

          <div>
            <Label>{t.notes}</Label>
            <Textarea
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={2}
              data-ocid="bookings.notes.textarea"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-700 hover:bg-green-800 text-white w-full py-3 rounded-xl font-semibold"
            data-ocid="bookings.save.submit_button"
          >
            {saving ? t.savingText : t.save}
          </Button>
          {/* Voice Input Button */}
          {!editId && (
            <VoiceInputButton
              isListening={isListening}
              isSupported={voiceSupported}
              onStart={() => startListening("hi-IN")}
              onStop={stopListening}
              label="Voice"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col min-h-full bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goBack}
              className="p-1"
              data-ocid="bookings.back.button"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <button
              type="button"
              onClick={onOpenSidebar}
              className="p-1"
              data-ocid="bookings.menu.button"
            >
              <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="font-bold text-lg text-gray-900 dark:text-gray-100">
              {listOnly ? t.bookingList : t.bookings}
            </h1>
          </div>
          {!listOnly && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1 bg-green-700 text-white px-3 py-2 rounded-xl text-sm font-semibold"
              data-ocid="bookings.add.primary_button"
            >
              <Plus className="w-4 h-4" /> {t.newBooking}
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {bookings.length === 0 && (
            <p
              className="text-gray-400 dark:text-gray-500 text-center py-12"
              data-ocid="bookings.empty_state"
            >
              {t.noBookings}
            </p>
          )}
          {bookings.map((b, idx) => (
            <div
              key={b.id.toString()}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm p-4"
              data-ocid={`bookings.item.${idx + 1}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {getPartyName(b.partyId)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {b.workType}
                  </div>
                  <div className="text-sm text-gray-400 dark:text-gray-500">
                    {new Date(Number(b.date)).toLocaleDateString()}{" "}
                    {new Date(Number(b.date)).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${statusColors[b.status]}`}
                  >
                    {t[b.status]}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {b.status !== BookingStatus.completed ? (
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        await onCompleteBooking(b);
                        await load();
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-green-600 text-white text-sm font-semibold flex items-center justify-center gap-1"
                      data-ocid={`bookings.complete.button.${idx + 1}`}
                    >
                      <CheckCircle className="w-4 h-4" /> {t.completeBookingBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(b)}
                      className="flex-1 py-1.5 rounded-lg border text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-800"
                      data-ocid={`bookings.edit.button.${idx + 1}`}
                    >
                      {t.edit}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(b.id)}
                      className="flex-1 py-1.5 rounded-lg border border-red-200 text-sm text-red-500 hover:bg-red-50"
                      data-ocid={`bookings.delete_button.${idx + 1}`}
                    >
                      {t.delete}
                    </button>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-green-50 text-green-700 text-sm font-semibold">
                    <CheckCircle className="w-4 h-4" />
                    <span>{t.completed || "Completed"}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {licenceExpired && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-red-600/95">
          <div className="text-center p-8">
            <p className="text-4xl font-bold text-white mb-6">
              Your Licence Expired
            </p>
            <button
              type="button"
              onClick={() => setLicenceExpired(false)}
              className="px-6 py-3 bg-white text-red-600 font-bold rounded-lg text-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
