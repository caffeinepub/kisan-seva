import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Menu, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../App";

const STORAGE_KEY = "kisan_reminders_v1";

type ReminderType = "service" | "payment";

type Reminder = {
  id: string;
  type: ReminderType;
  title: string;
  date: string;
  notes: string;
  createdAt: number;
};

function getReminders(): Reminder[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as Reminder[];
  } catch {
    return [];
  }
}

function saveReminders(reminders: Reminder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
}

function getStatus(date: string): "overdue" | "today" | "upcoming" {
  const today = new Date().toISOString().slice(0, 10);
  if (date < today) return "overdue";
  if (date === today) return "today";
  return "upcoming";
}

type Props = { onOpenSidebar?: () => void };

export default function NotificationsPage({ onOpenSidebar }: Props) {
  const { t } = useApp();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<ReminderType>("service");
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [formNotes, setFormNotes] = useState("");

  useEffect(() => {
    setReminders(getReminders());
  }, []);

  const handleAdd = () => {
    if (!formTitle.trim()) {
      toast.error(t.nameRequiredMsg);
      return;
    }
    const newReminder: Reminder = {
      id: Date.now().toString(),
      type: formType,
      title: formTitle.trim(),
      date: formDate,
      notes: formNotes.trim(),
      createdAt: Date.now(),
    };
    const updated = [...reminders, newReminder].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    saveReminders(updated);
    setReminders(updated);
    toast.success(t.reminderAdded);
    setShowForm(false);
    setFormTitle("");
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormNotes("");
  };

  const handleDelete = (id: string) => {
    const updated = reminders.filter((r) => r.id !== id);
    saveReminders(updated);
    setReminders(updated);
    toast.success(t.reminderDeleted);
  };

  const serviceReminders = reminders.filter((r) => r.type === "service");
  const paymentReminders = reminders.filter((r) => r.type === "payment");

  const statusColors = {
    overdue: "bg-red-100 text-red-700",
    today: "bg-orange-100 text-orange-700",
    upcoming: "bg-green-100 text-green-700",
  };

  const statusLabels = {
    overdue: t.overdue,
    today: t.today,
    upcoming: t.upcoming,
  };

  const ReminderCard = ({ r }: { r: Reminder }) => {
    const status = getStatus(r.date);
    return (
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 mr-3">
            <div className="font-semibold text-gray-900">{r.title}</div>
            <div className="text-sm text-gray-500 mt-0.5">
              📅 {new Date(`${r.date}T00:00:00`).toLocaleDateString()}
            </div>
            {r.notes && (
              <div className="text-xs text-gray-400 mt-1">{r.notes}</div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[status]}`}
            >
              {statusLabels[status]}
            </span>
            <button
              type="button"
              onClick={() => handleDelete(r.id)}
              className="text-red-400 hover:text-red-600 p-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b flex items-center justify-between px-4 pt-4 pb-3">
        <button type="button" onClick={onOpenSidebar} className="p-1">
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="font-bold text-lg text-gray-900 flex items-center gap-2">
          <Bell className="w-5 h-5" /> {t.notifications}
        </h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 bg-green-700 text-white px-3 py-2 rounded-xl text-sm font-semibold"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? t.cancel : t.addReminder}
        </button>
      </div>

      {/* Add Reminder Form */}
      {showForm && (
        <div className="mx-4 mt-3 p-4 bg-green-50 border border-green-200 rounded-2xl flex flex-col gap-3">
          <p className="text-sm font-bold text-green-800">{t.addReminder}</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormType("service")}
              className={`py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                formType === "service"
                  ? "border-green-600 bg-green-600 text-white"
                  : "border-gray-200 bg-white text-gray-600"
              }`}
            >
              🔧 {t.serviceReminderTab}
            </button>
            <button
              type="button"
              onClick={() => setFormType("payment")}
              className={`py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                formType === "payment"
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-200 bg-white text-gray-600"
              }`}
            >
              💰 {t.paymentReminderTab}
            </button>
          </div>
          <div>
            <Label className="text-sm text-gray-700 mb-1 block">
              {t.reminderTitle} *
            </Label>
            <Input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder={t.reminderTitle}
              className="bg-white"
            />
          </div>
          <div>
            <Label className="text-sm text-gray-700 mb-1 block">
              {t.reminderDate}
            </Label>
            <Input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="bg-white"
            />
          </div>
          <div>
            <Label className="text-sm text-gray-700 mb-1 block">
              {t.reminderNote} {t.optionalLabel}
            </Label>
            <Textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={2}
              placeholder={t.reminderNote}
              className="bg-white"
            />
          </div>
          <Button
            onClick={handleAdd}
            className="bg-green-700 hover:bg-green-800 text-white w-full rounded-xl"
          >
            {t.saveButton}
          </Button>
        </div>
      )}

      <Tabs defaultValue="service" className="flex-1 flex flex-col mt-3">
        <TabsList className="grid grid-cols-2 mx-4 mb-0">
          <TabsTrigger value="service">🔧 {t.serviceReminderTab}</TabsTrigger>
          <TabsTrigger value="payment">💰 {t.paymentReminderTab}</TabsTrigger>
        </TabsList>
        <TabsContent
          value="service"
          className="flex-1 px-4 pt-3 flex flex-col gap-3"
        >
          {serviceReminders.length === 0 ? (
            <p className="text-gray-400 text-center py-12">{t.noReminders}</p>
          ) : (
            serviceReminders.map((r) => <ReminderCard key={r.id} r={r} />)
          )}
        </TabsContent>
        <TabsContent
          value="payment"
          className="flex-1 px-4 pt-3 flex flex-col gap-3"
        >
          {paymentReminders.length === 0 ? (
            <p className="text-gray-400 text-center py-12">{t.noReminders}</p>
          ) : (
            paymentReminders.map((r) => <ReminderCard key={r.id} r={r} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
