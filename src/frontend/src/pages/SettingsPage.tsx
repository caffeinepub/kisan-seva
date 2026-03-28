import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../App";
import type { backendInterface } from "../backend";

type Props = { actor: backendInterface };

export default function SettingsPage({ actor }: Props) {
  const { t, lang, setLang, setPage, isGuest, logout } = useApp();
  const [profile, setProfile] = useState({
    ownerName: "",
    businessName: "",
    address: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);

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
      toast.success("Profile saved");
    } catch {
      toast.error("Error saving");
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col min-h-full bg-white">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b">
        <button type="button" onClick={() => setPage("home")}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-lg">{t.settings}</h1>
      </div>
      <div className="p-4 flex flex-col gap-6">
        {/* Language */}
        <div>
          <h2 className="font-semibold text-gray-800 mb-3">{t.language}</h2>
          <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
            {(["gu", "hi", "en"] as const).map((l) => (
              <button
                type="button"
                key={l}
                onClick={() => setLang(l)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  lang === l
                    ? "bg-white shadow text-green-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                data-ocid="settings.toggle"
              >
                {l === "gu" ? "ગુજરાતી" : l === "hi" ? "हिन्दी" : "English"}
              </button>
            ))}
          </div>
        </div>

        {/* Business Profile */}
        {!isGuest && (
          <div>
            <h2 className="font-semibold text-gray-800 mb-3">
              {t.businessProfile}
            </h2>
            <div className="flex flex-col gap-3">
              <div>
                <Label>{t.ownerName}</Label>
                <Input
                  value={profile.ownerName}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, ownerName: e.target.value }))
                  }
                  data-ocid="settings.input"
                />
              </div>
              <div>
                <Label>{t.businessName}</Label>
                <Input
                  value={profile.businessName}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, businessName: e.target.value }))
                  }
                  data-ocid="settings.input"
                />
              </div>
              <div>
                <Label>{t.phone}</Label>
                <Input
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, phone: e.target.value }))
                  }
                  data-ocid="settings.input"
                />
              </div>
              <div>
                <Label>{t.address}</Label>
                <Input
                  value={profile.address}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, address: e.target.value }))
                  }
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
              {saving ? "Saving..." : t.save}
            </Button>
          </div>
        )}

        {/* Logout */}
        <div className="mt-4 pt-4 border-t">
          <Button
            variant="outline"
            onClick={logout}
            className="w-full border-red-300 text-red-600 hover:bg-red-50 rounded-xl py-3"
            data-ocid="settings.delete_button"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isGuest ? t.exitGuestMode : t.logout}
          </Button>
        </div>
      </div>
    </div>
  );
}
