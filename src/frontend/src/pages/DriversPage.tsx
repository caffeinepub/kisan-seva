import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Menu,
  Plus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../App";
import type { Driver, backendInterface } from "../backend";
import {
  type AttendanceEntry,
  type DriverSettings,
  type MonthSummary,
  computeMonthSummary,
  computeMonthlyAttendance,
  getDriverSettings,
  saveDriverSettings,
} from "../utils/driverAttendance";

type Props = { actor: backendInterface; onOpenSidebar?: () => void };

function DriverAttendanceView({
  driver,
  onBack,
}: { driver: Driver; onBack: () => void }) {
  const { t } = useApp();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const settings = getDriverSettings(driver.id.toString());

  const transactions: Array<{
    driverId?: string;
    date?: string;
    hours?: number;
    minutes?: number;
  }> = (() => {
    try {
      return JSON.parse(localStorage.getItem("ktp_saved_transactions") || "[]");
    } catch {
      return [];
    }
  })();

  const attendance: AttendanceEntry[] = settings
    ? computeMonthlyAttendance(
        driver.id.toString(),
        transactions,
        settings,
        viewYear,
        viewMonth,
      )
    : [];

  const summary: MonthSummary | null = settings
    ? computeMonthSummary(attendance, settings)
    : null;

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const monthName = t.fullMonths[viewMonth];

  const statusLabel = (entry: AttendanceEntry): string => {
    if (entry.status === "present_full") return t.fullDay;
    if (entry.status === "present_half") return t.halfDay;
    if (entry.status === "present_hr")
      return `${entry.hoursWorked.toFixed(1)} hrs`;
    return t.absent;
  };

  const statusColor = (entry: AttendanceEntry): string => {
    if (entry.status === "present_full")
      return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400";
    if (entry.status === "present_half")
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400";
    if (entry.status === "present_hr")
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400";
    return "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400";
  };

  return (
    <div className="flex flex-col min-h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b">
        <button type="button" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-bold text-lg text-gray-900 dark:text-gray-100">
            {driver.name}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t.attendance}
          </p>
        </div>
      </div>

      {!settings && (
        <div className="p-6 text-center text-gray-400 dark:text-gray-500">
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p>{t.attNotConfigured}</p>
          <p className="text-xs mt-1">
            Edit driver to set attendance type and rate.
          </p>
        </div>
      )}

      {settings && (
        <div className="p-4 flex flex-col gap-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="p-2 rounded-lg border dark:border-gray-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {monthName} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-2 rounded-lg border dark:border-gray-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Summary bar */}
          {summary && (
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-2 text-center">
                <div className="text-lg font-bold text-green-700 dark:text-green-400">
                  {settings.attendanceType === "hr"
                    ? summary.presentHr
                    : summary.presentFull}
                </div>
                <div className="text-xs text-green-600 dark:text-green-500">
                  {settings.attendanceType === "hr" ? t.hourBased : t.fullDay}
                </div>
              </div>
              {settings.attendanceType === "day" && (
                <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-xl p-2 text-center">
                  <div className="text-lg font-bold text-yellow-700 dark:text-yellow-400">
                    {summary.presentHalf}
                  </div>
                  <div className="text-xs text-yellow-600 dark:text-yellow-500">
                    {t.halfDay}
                  </div>
                </div>
              )}
              <div className="bg-red-50 dark:bg-red-900/30 rounded-xl p-2 text-center">
                <div className="text-lg font-bold text-red-600 dark:text-red-400">
                  {summary.absent}
                </div>
                <div className="text-xs text-red-500 dark:text-red-400">
                  {t.absent}
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-2 text-center">
                <div className="text-sm font-bold text-blue-700 dark:text-blue-400">
                  ₹{Math.round(summary.estimatedPay)}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-500">
                  {t.estimatedPay}
                </div>
              </div>
            </div>
          )}

          {/* Day list */}
          <div className="flex flex-col gap-2">
            {attendance.length === 0 && (
              <p className="text-center text-gray-400 dark:text-gray-500 py-6">
                No attendance data for this month.
              </p>
            )}
            {attendance.map((entry) => {
              const d = new Date(`${entry.date}T00:00:00`);
              const dayName = t.days[d.getDay()];
              const dayNum = d.getDate();
              return (
                <div
                  key={entry.date}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-300">
                      {dayNum}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {dayName}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor(entry)}`}
                  >
                    {statusLabel(entry)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DriversPage({ actor, onOpenSidebar }: Props) {
  const { t, goBack } = useApp();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [attendanceDriver, setAttendanceDriver] = useState<Driver | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    performanceNotes: "",
  });
  const [attendanceType, setAttendanceType] = useState<"day" | "hr">("day");
  const [dailyRate, setDailyRate] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [halfDayThreshold, setHalfDayThreshold] = useState("4");
  const [editId, setEditId] = useState<bigint | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setDrivers(await actor.getAllDrivers());
  };
  // biome-ignore lint/correctness/useExhaustiveDependencies: actor is stable
  useEffect(() => {
    load();
  }, [actor]);

  const resetAttendanceForm = () => {
    setAttendanceType("day");
    setDailyRate("");
    setHourlyRate("");
    setHalfDayThreshold("4");
  };

  const handleSave = async () => {
    if (!form.name) {
      toast.error(t.nameRequiredMsg);
      return;
    }
    setSaving(true);
    try {
      if (editId !== null) {
        await actor.updateDriver(
          editId,
          form.name,
          form.phone,
          form.performanceNotes,
        );
        // Save attendance settings
        const existing = getDriverSettings(editId.toString());
        const settings: DriverSettings = {
          attendanceType,
          dailyRate: Number(dailyRate) || 0,
          hourlyRate: Number(hourlyRate) || 0,
          halfDayThreshold: Number(halfDayThreshold) || 4,
          addedDate:
            existing?.addedDate || new Date().toISOString().slice(0, 10),
        };
        saveDriverSettings(editId.toString(), settings);
        toast.success(t.updatedMsg);
      } else {
        const newId = await actor.createDriver(
          form.name,
          form.phone,
          form.performanceNotes,
        );
        // Save attendance settings with today as addedDate
        const settings: DriverSettings = {
          attendanceType,
          dailyRate: Number(dailyRate) || 0,
          hourlyRate: Number(hourlyRate) || 0,
          halfDayThreshold: Number(halfDayThreshold) || 4,
          addedDate: new Date().toISOString().slice(0, 10),
        };
        saveDriverSettings(newId.toString(), settings);
        toast.success(t.driverAddedMsg);
      }
      setShowForm(false);
      setForm({ name: "", phone: "", performanceNotes: "" });
      resetAttendanceForm();
      setEditId(null);
      await load();
    } catch {
      toast.error(t.errorSavingMsg);
    }
    setSaving(false);
  };

  const handleDelete = async (id: bigint) => {
    if (!confirm("Delete?")) return;
    await actor.deleteDriver(id);
    toast.success(t.deletedMsg);
    await load();
  };

  // Attendance view
  if (attendanceDriver) {
    return (
      <DriverAttendanceView
        driver={attendanceDriver}
        onBack={() => setAttendanceDriver(null)}
      />
    );
  }

  if (showForm) {
    return (
      <div className="flex flex-col min-h-full bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b">
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setEditId(null);
              resetAttendanceForm();
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">{editId ? t.edit : t.addDriver}</h1>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <div>
            <Label>{t.name} *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <Label>{t.phone}</Label>
            <Input
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
            />
          </div>
          <div>
            <Label>{t.performance}</Label>
            <Textarea
              value={form.performanceNotes}
              onChange={(e) =>
                setForm((f) => ({ ...f, performanceNotes: e.target.value }))
              }
              rows={2}
            />
          </div>

          {/* Attendance Settings */}
          <div className="border-t pt-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {t.attendanceType}
            </p>
            {/* Attendance Type Toggle */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setAttendanceType("day")}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                  attendanceType === "day"
                    ? "bg-green-700 text-white border-green-700"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                }`}
              >
                {t.dayBased}
              </button>
              <button
                type="button"
                onClick={() => setAttendanceType("hr")}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                  attendanceType === "hr"
                    ? "bg-green-700 text-white border-green-700"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                }`}
              >
                {t.hourBased}
              </button>
            </div>

            {attendanceType === "day" ? (
              <>
                <div className="mb-3">
                  <Label className="text-xs">{t.dailyRate}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                    placeholder="500"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t.halfDayThreshold}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={halfDayThreshold}
                    onChange={(e) => setHalfDayThreshold(e.target.value)}
                    placeholder="4"
                  />
                </div>
              </>
            ) : (
              <div>
                <Label className="text-xs">{t.hourlyRate}</Label>
                <Input
                  type="number"
                  min={0}
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="100"
                />
              </div>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-700 hover:bg-green-800 text-white w-full py-3 rounded-xl"
          >
            {saving ? t.savingText : t.save}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            className="p-1"
            data-ocid="drivers.back.button"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            type="button"
            onClick={onOpenSidebar}
            className="p-1"
            data-ocid="drivers.menu.button"
          >
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="font-bold text-lg text-gray-900 dark:text-gray-100">
            {t.drivers}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 bg-green-700 text-white px-3 py-2 rounded-xl text-sm font-semibold"
          data-ocid="drivers.add.primary_button"
        >
          <Plus className="w-4 h-4" /> {t.addDriver}
        </button>
      </div>
      <div className="p-4 flex flex-col gap-3">
        {drivers.length === 0 && (
          <p className="text-gray-400 dark:text-gray-500 text-center py-12">
            {t.noDrivers}
          </p>
        )}
        {drivers.map((d) => {
          const dSettings = getDriverSettings(d.id.toString());
          return (
            <div
              key={d.id.toString()}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm p-4"
            >
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {d.name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {d.phone}
              </div>
              {dSettings && (
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {dSettings.attendanceType === "day"
                    ? `₹${dSettings.dailyRate}/day`
                    : `₹${dSettings.hourlyRate}/hr`}
                </div>
              )}
              {d.performanceNotes && (
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {d.performanceNotes}
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setForm({
                      name: d.name,
                      phone: d.phone,
                      performanceNotes: d.performanceNotes,
                    });
                    setEditId(d.id);
                    // Load existing settings
                    const s = getDriverSettings(d.id.toString());
                    if (s) {
                      setAttendanceType(s.attendanceType);
                      setDailyRate(String(s.dailyRate));
                      setHourlyRate(String(s.hourlyRate));
                      setHalfDayThreshold(String(s.halfDayThreshold));
                    } else {
                      resetAttendanceForm();
                    }
                    setShowForm(true);
                  }}
                  className="flex-1 py-1.5 rounded-lg border text-sm text-gray-600 dark:text-gray-400"
                >
                  {t.edit}
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceDriver(d)}
                  className="flex-1 py-1.5 rounded-lg border border-blue-200 text-sm text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1"
                  data-ocid="drivers.attendance.button"
                >
                  <Clock className="w-3.5 h-3.5" />
                  {t.attendance}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(d.id)}
                  className="flex-1 py-1.5 rounded-lg border border-red-200 text-sm text-red-500"
                >
                  {t.delete}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
