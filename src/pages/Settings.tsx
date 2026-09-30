import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, Bot, Link2, Users, ChevronRight, ArrowLeft, Save, MessageSquare, Send, Calendar, Camera, MapPin, Globe, ExternalLink, CheckCircle, Brain, Eye, EyeOff } from "lucide-react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { useAuth } from "../hooks/useAuth";
import { useTenant } from "../hooks/useTenant";
import { toast } from "../components/common/Toast";

const countryCodes = [
  { code: "+971", country: "AE" },
  { code: "+1", country: "US" }, { code: "+44", country: "GB" },
  { code: "+91", country: "IN" }, { code: "+86", country: "CN" },
  { code: "+81", country: "JP" }, { code: "+49", country: "DE" },
  { code: "+33", country: "FR" }, { code: "+61", country: "AU" },
  { code: "+55", country: "BR" }, { code: "+27", country: "ZA" },
  { code: "+254", country: "KE" }, { code: "+20", country: "EG" },
  { code: "+966", country: "SA" }, { code: "+974", country: "QA" },
  { code: "+973", country: "BH" }, { code: "+965", country: "KW" },
  { code: "+968", country: "OM" }, { code: "+90", country: "TR" },
  { code: "+7", country: "RU" }, { code: "+82", country: "KR" },
  { code: "+65", country: "SG" }, { code: "+60", country: "MY" },
  { code: "+63", country: "PH" }, { code: "+62", country: "ID" },
  { code: "+66", country: "TH" }, { code: "+84", country: "VN" },
  { code: "+92", country: "PK" }, { code: "+880", country: "BD" },
  { code: "+233", country: "GH" }, { code: "+225", country: "CI" },
  { code: "+237", country: "CM" }, { code: "+255", country: "TZ" },
  { code: "+256", country: "UG" }, { code: "+250", country: "RW" },
  { code: "+212", country: "MA" }, { code: "+216", country: "TN" },
  { code: "+34", country: "ES" }, { code: "+39", country: "IT" },
  { code: "+31", country: "NL" }, { code: "+46", country: "SE" },
  { code: "+47", country: "NO" }, { code: "+45", country: "DK" },
  { code: "+48", country: "PL" }, { code: "+41", country: "CH" },
  { code: "+43", country: "AT" }, { code: "+32", country: "BE" },
  { code: "+351", country: "PT" }, { code: "+353", country: "IE" },
  { code: "+52", country: "MX" }, { code: "+57", country: "CO" },
  { code: "+54", country: "AR" }, { code: "+56", country: "CL" },
  { code: "+51", country: "PE" }, { code: "+58", country: "VE" },
];


type AIProviderId = "anthropic" | "openai" | "gemini";

const AI_PROVIDER_INFO: Record<
  AIProviderId,
  { name: string; keyHint: string; defaultModel: string; consoleUrl: string; consoleLabel: string }
> = {
  anthropic: {
    name: "Anthropic (Claude)",
    keyHint: "sk-ant-...",
    defaultModel: "claude-opus-5",
    consoleUrl: "https://console.anthropic.com/settings/keys",
    consoleLabel: "console.anthropic.com",
  },
  openai: {
    name: "OpenAI",
    keyHint: "sk-...",
    defaultModel: "gpt-4o",
    consoleUrl: "https://platform.openai.com/api-keys",
    consoleLabel: "platform.openai.com",
  },
  gemini: {
    name: "Google Gemini",
    keyHint: "AIza...",
    defaultModel: "gemini-2.5-flash",
    consoleUrl: "https://aistudio.google.com/app/apikey",
    consoleLabel: "aistudio.google.com",
  },
};

// Cloud Functions base URL for this deployment, derived from the configured
// Firebase project unless VITE_FUNCTIONS_BASE_URL overrides it.
const FUNCTIONS_BASE_URL =
  import.meta.env.VITE_FUNCTIONS_BASE_URL ||
  `https://${import.meta.env.VITE_FUNCTIONS_REGION || "us-central1"}-${
    import.meta.env.VITE_FIREBASE_PROJECT_ID
  }.cloudfunctions.net`;

function SettingsMenu() {
  const navigate = useNavigate();

  const groups = [
    {
      title: "Account",
      items: [
        { path: "/settings/profile", icon: User, label: "Profile Settings", description: "Update your agent profile and contact information" },
        { path: "/settings/ai", icon: Bot, label: "AI Configuration", description: "Customize AI persona, greeting scripts, and handoff thresholds" },
      ],
    },
    {
      title: "Connections",
      items: [
        { path: "/settings/integrations", icon: Link2, label: "Integrations", description: "WhatsApp, Telegram, and Calendar settings" },
        { path: "/settings/team", icon: Users, label: "Team Management", description: "Invite team members and manage roles" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your Dubai account settings
        </p>
      </div>
      {groups.map((group) => (
        <div key={group.title}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">{group.title}</h2>
          <Card padding={false}>
            <div className="divide-y divide-gray-100">
              {group.items.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                      <item.icon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              ))}
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}

function BackButton({ label }: { label: string }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate("/settings")} className="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
      <ArrowLeft className="h-4 w-4" /> {label}
    </button>
  );
}

function ProfileSettings() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const defaultCode = "+971";

  const existingPhone = tenant?.agent?.phone || "";
  const matchedCode = countryCodes.find((c) => existingPhone.startsWith(c.code));

  const [name, setName] = useState(tenant?.agent?.name || "");
  const [phoneCode, setPhoneCode] = useState(matchedCode?.code || defaultCode);
  const [phoneNumber, setPhoneNumber] = useState(matchedCode ? existingPhone.slice(matchedCode.code.length) : existingPhone);
  const [license, setLicense] = useState(tenant?.agent?.licenseNumber || "");
  const [brokerage, setBrokerage] = useState(tenant?.agent?.brokerage || "");
  const [language, setLanguage] = useState(tenant?.agent?.preferredLanguage || "en");
  const [bio, setBio] = useState((tenant?.agent as Record<string, unknown>)?.bio as string || "");
  const [website, setWebsite] = useState((tenant?.agent as Record<string, unknown>)?.website as string || "");
  const [location, setLocation] = useState((tenant?.agent as Record<string, unknown>)?.location as string || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>((tenant?.agent as Record<string, unknown>)?.avatarUrl as string || null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast("error", "Image too large", "Max size is 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Crop to square from center
        const size = Math.min(img.width, img.height);
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext("2d")!;
        ctx.beginPath();
        ctx.arc(128, 128, 128, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(
          img,
          (img.width - size) / 2, (img.height - size) / 2,
          size, size,
          0, 0, 256, 256
        );
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setAvatarPreview(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "tenants", user.uid), {
        "agent.name": name,
        "agent.phone": phoneCode + phoneNumber,
        "agent.licenseNumber": license,
        "agent.brokerage": brokerage,
        "agent.preferredLanguage": language,
        "agent.bio": bio,
        "agent.website": website,
        "agent.location": location,
        "agent.avatarUrl": avatarPreview || "",
        updatedAt: serverTimestamp(),
      });
      toast("success", "Profile updated");
    } catch {
      toast("error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="mx-auto max-w-5xl">
      <BackButton label="Back to Settings" />
      <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
      <p className="mt-1 text-sm text-gray-500">Update your agent profile and contact information</p>

      {/* Avatar */}
      <Card className="mt-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="h-24 w-24 rounded-full object-cover ring-4 ring-gray-100" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-100 ring-4 ring-gray-100">
                <span className="text-2xl font-bold text-brand-600">{initials || "?"}</span>
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{name || "Your Name"}</h3>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <p className="mt-1 text-xs text-gray-400">Click the camera icon to upload a photo (auto-cropped to circle, max 2MB)</p>
          </div>
        </div>
      </Card>

      {/* Basic Info */}
      <Card className="mt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <div className="mt-1 flex">
                <select value={phoneCode} onChange={(e) => setPhoneCode(e.target.value)} className="w-[110px] shrink-0 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-2 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
                  {countryCodes.map((c) => (<option key={c.country} value={c.code}>{c.code} {c.country}</option>))}
                </select>
                <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ""))} placeholder="8012345678" className="w-full rounded-r-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Tell your leads about yourself and your expertise..." className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
          </div>
        </div>
      </Card>

      {/* Professional Info */}
      <Card className="mt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Professional Details</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">RERA License</label>
              <input type="text" value={license} onChange={(e) => setLicense(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Brokerage / Company</label>
              <input type="text" value={brokerage} onChange={(e) => setBrokerage(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                <div className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Location</div>
              </label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Dubai Marina, Dubai" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                <div className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> Website</div>
              </label>
              <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourwebsite.com" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Preferred Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
                <option value="en">English</option>
                <option value="en-ae">English (UAE)</option>
                <option value="ar">Arabic</option>
              </select>
            </div>
            <Button onClick={handleSave} loading={saving}><Save className="mr-2 h-4 w-4" />Save Profile</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function AISettings() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [saving, setSaving] = useState(false);
  const [personaName, setPersonaName] = useState(tenant?.aiConfig?.personaName || "");
  const [greeting, setGreeting] = useState(tenant?.aiConfig?.greetingScript || "");
  const [threshold, setThreshold] = useState(tenant?.aiConfig?.handoffThreshold || 60);
  const [approvalMode, setApprovalMode] = useState(tenant?.aiConfig?.approvalMode || false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "tenants", user.uid), {
        "aiConfig.personaName": personaName,
        "aiConfig.greetingScript": greeting,
        "aiConfig.handoffThreshold": threshold,
        "aiConfig.approvalMode": approvalMode,
        updatedAt: serverTimestamp(),
      });
      toast("success", "AI configuration updated");
    } catch {
      toast("error", "Failed to update AI config");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <BackButton label="Back to Settings" />
      <h1 className="text-2xl font-bold text-gray-900">AI Configuration</h1>
      <p className="mt-1 text-sm text-gray-500">Customize how Noor interacts with your leads</p>
      <Card className="mt-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">AI Persona Name</label>
            <input type="text" value={personaName} onChange={(e) => setPersonaName(e.target.value)} placeholder="Noor" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Greeting Script</label>
            <textarea value={greeting} onChange={(e) => setGreeting(e.target.value)} rows={4} placeholder="Custom greeting for new leads..." className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Handoff Threshold (0-100)</label>
            <input type="range" min="0" max="100" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="mt-2 w-full" />
            <p className="text-sm text-gray-500">Score: {threshold}. AI suggests an appointment when the lead score reaches this level.</p>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="approvalMode" checked={approvalMode} onChange={(e) => setApprovalMode(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
            <label htmlFor="approvalMode" className="text-sm text-gray-700">Approval Mode: review AI messages before they're sent</label>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} loading={saving}><Save className="mr-2 h-4 w-4" />Save AI Config</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function TenantAICard() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const aiIntegration = (tenant?.integrations as Record<string, unknown> | undefined)?.ai as
    | { provider?: AIProviderId; apiKey?: string; model?: string; enabled?: boolean }
    | undefined;

  const [provider, setProvider] = useState<AIProviderId>(aiIntegration?.provider || "anthropic");
  const [apiKey, setApiKey] = useState(aiIntegration?.apiKey || "");
  const [model, setModel] = useState(aiIntegration?.model || "");
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const connected = Boolean(aiIntegration?.apiKey);
  const providerInfo = AI_PROVIDER_INFO[provider];

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const trimmed = apiKey.trim();
      await updateDoc(doc(db, "tenants", user.uid), {
        "integrations.ai.provider": provider,
        "integrations.ai.apiKey": trimmed,
        "integrations.ai.model": model.trim() || providerInfo.defaultModel,
        "integrations.ai.enabled": Boolean(trimmed),
        "integrations.ai.connectedAt": trimmed ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      });
      toast("success", trimmed ? `${providerInfo.name} connected` : "AI key removed");
    } catch {
      toast("error", "Failed to save the AI key");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
            <Brain className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Your own AI key</p>
            <p className="text-xs text-gray-500">
              Optional. Overrides the instance key for your leads only, and bills to your
              own provider account.
            </p>
          </div>
        </div>
        {connected ? (
          <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
            <CheckCircle className="h-3.5 w-3.5" />
            Connected
          </span>
        ) : (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            Using instance key
          </span>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Provider</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {(Object.keys(AI_PROVIDER_INFO) as AIProviderId[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setProvider(id)}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  provider === id
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {AI_PROVIDER_INFO[id].name}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Get a key at{" "}
            <a
              href={providerInfo.consoleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-600 underline"
            >
              {providerInfo.consoleLabel}
            </a>
            .
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">API Key</label>
          <div className="relative mt-1">
            <input
              type={visible ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={providerInfo.keyHint}
              autoComplete="off"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 font-mono text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button
              type="button"
              onClick={() => setVisible(!visible)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Model</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={providerInfo.defaultModel}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
      </div>
    </Card>
  );
}

function IntegrationsSettings() {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const location = useLocation();

  const googleCalendarConnected = tenant?.integrations?.calendar?.google?.connected || tenant?.integrations?.calendar?.google?.enabled || false;
  const googleCalendarEmail = (tenant?.integrations?.calendar?.google as Record<string, unknown> | undefined)?.email as string | undefined;
  const outlookCalendarConnected = tenant?.integrations?.calendar?.outlook?.connected || tenant?.integrations?.calendar?.outlook?.enabled || false;
  const outlookCalendarEmail = (tenant?.integrations?.calendar?.outlook as Record<string, unknown> | undefined)?.email as string | undefined;

  // Check URL params for calendar connection result
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("calendar") === "connected") {
      toast("success", "Google Calendar connected", "Your appointments will now sync to Google Calendar.");
    } else if (params.get("calendar") === "denied") {
      toast("error", "Connection denied", "You declined the Google Calendar permission request.");
    }
    if (params.get("outlook") === "connected") {
      toast("success", "Outlook Calendar connected", "Your appointments will now sync to Outlook Calendar.");
    } else if (params.get("outlook") === "denied") {
      toast("error", "Connection denied", "You declined the Outlook Calendar permission request.");
    }
  }, [location.search]);

  // Send a short-lived Firebase ID token rather than a uid: the function
  // derives the account from the token, so nobody can start a connect flow on
  // another account's behalf.
  const startCalendarConnect = async (endpoint: string) => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      window.location.href = `${FUNCTIONS_BASE_URL}/${endpoint}?token=${encodeURIComponent(idToken)}`;
    } catch {
      toast("error", "Could not start the connection", "Sign out and back in, then try again.");
    }
  };

  const handleGoogleConnect = () => startCalendarConnect("googleCalendarConnect");
  const handleOutlookConnect = () => startCalendarConnect("outlookCalendarConnect");

  const integrations = [
    {
      id: "whatsapp",
      icon: MessageSquare,
      iconColor: "text-green-600",
      bgColor: "bg-green-100",
      label: "WhatsApp Business",
      description: "Connect your WhatsApp Business API account",
      status: tenant?.integrations?.whatsapp?.enabled ? "Connected" : "Not connected",
      connected: tenant?.integrations?.whatsapp?.enabled || false,
      note: "Configure WhatsApp API credentials in /admin (platform-level setting)",
    },
    {
      id: "telegram",
      icon: Send,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-100",
      label: "Telegram Bot",
      description: "Connect your Telegram bot for lead conversations",
      status: tenant?.integrations?.telegram?.enabled ? "Connected" : "Not connected",
      connected: tenant?.integrations?.telegram?.enabled || false,
      note: "Configure Telegram bot token in /admin (platform-level setting)",
    },
    {
      id: "google-calendar",
      icon: Calendar,
      iconColor: "text-brand-600",
      bgColor: "bg-brand-100",
      label: "Google Calendar",
      description: "Sync appointments with Google Calendar",
      status: googleCalendarConnected ? "Connected" : "Not connected",
      connected: googleCalendarConnected,
      note: googleCalendarConnected && googleCalendarEmail
        ? `Connected as ${googleCalendarEmail}`
        : "Connect your Google account to automatically sync AI-booked appointments",
    },
    {
      id: "outlook-calendar",
      icon: Calendar,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
      label: "Outlook Calendar",
      description: "Sync appointments with Outlook Calendar (Dubai priority)",
      status: outlookCalendarConnected ? "Connected" : "Not connected",
      connected: outlookCalendarConnected,
      note: outlookCalendarConnected && outlookCalendarEmail
        ? `Connected as ${outlookCalendarEmail}`
        : "Connect your Microsoft account to automatically sync AI-booked appointments",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <BackButton label="Back to Settings" />
      <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
      <p className="mt-1 text-sm text-gray-500">Manage your AI, messaging, and calendar connections</p>
      <div className="mt-6 space-y-3">
        <TenantAICard />
        {integrations.map((item) => (
          <Card key={item.id}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.bgColor}`}>
                  <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {item.id === "google-calendar" && !item.connected && (
                  <button
                    onClick={handleGoogleConnect}
                    className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Connect
                  </button>
                )}
                {item.id === "outlook-calendar" && !item.connected && (
                  <button
                    onClick={handleOutlookConnect}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Connect
                  </button>
                )}
                {item.connected ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Connected
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    Not connected
                  </span>
                )}
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-400">{item.note}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TeamSettings() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"agent" | "admin">("agent");
  const [inviting, setInviting] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const agents = tenant?.team?.agents || {};
  const agentList = Object.entries(agents);

  const handleInvite = async () => {
    if (!user || !inviteEmail.trim()) return;
    setInviting(true);
    try {
      await updateDoc(doc(db, "tenants", user.uid), {
        [`team.agents.${inviteEmail.replace(/\./g, "_")}`]: {
          name: "",
          email: inviteEmail,
          role: inviteRole,
          status: "invited",
          invitedAt: new Date().toISOString(),
        },
        updatedAt: serverTimestamp(),
      });
      toast("success", "Invitation sent", `${inviteEmail} has been invited as ${inviteRole}`);
      setInviteEmail("");
      setShowInvite(false);
    } catch {
      toast("error", "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <BackButton label="Back to Settings" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="mt-1 text-sm text-gray-500">Invite team members and manage roles</p>
        </div>
        <Button onClick={() => setShowInvite(!showInvite)}>
          <Users className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      {showInvite && (
        <Card className="mt-4 border-brand-200 bg-brand-50">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Invite a Team Member</h3>
          <div className="flex gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@email.com"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "agent" | "admin")}
              className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="agent">Agent</option>
              <option value="admin">Admin</option>
            </select>
            <Button onClick={handleInvite} loading={inviting} disabled={!inviteEmail.trim()}>
              Send
            </Button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            The invited member will need to sign up with this email and they'll be added to your tenant.
          </p>
        </Card>
      )}

      <Card className="mt-4">
        {/* Current user */}
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900">{tenant?.agent?.name || "You"}</p>
            <p className="text-xs text-gray-500">{user?.email} &middot; admin (owner)</p>
          </div>
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">active</span>
        </div>

        {agentList.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-gray-400">No invited members yet. Click "Invite Member" to add your team.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {agentList.map(([id, agent]) => (
              <div key={id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{agent.name || agent.email}</p>
                  <p className="text-xs text-gray-500">{agent.email} &middot; {agent.role}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${agent.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {agent.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export function Settings() {
  const location = useLocation();
  const path = location.pathname;

  if (path === "/settings/profile") return <ProfileSettings />;
  if (path === "/settings/ai") return <AISettings />;
  if (path === "/settings/integrations") return <IntegrationsSettings />;
  if (path === "/settings/team") return <TeamSettings />;
  return <SettingsMenu />;
}
