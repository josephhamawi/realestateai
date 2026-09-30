import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { db } from "../config/firebase";
import {
  Brain,
  MessageSquare,
  Send,
  Calendar,
  Save,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

type AIProvider = "anthropic" | "openai" | "gemini";
type TabId = "ai" | "whatsapp" | "telegram" | "calendar";

interface ApiConfig {
  ai: {
    defaultProvider: AIProvider;
    anthropic: { apiKey: string; model: string };
    openai: { apiKey: string; model: string };
    gemini: { apiKey: string; model: string };
  };
  whatsapp: {
    provider: "meta" | "360dialog" | "baileys";
    d360ApiKey: string;
    appSecret: string;
    verifyToken: string;
    accessToken: string;
    phoneNumberId: string;
    wabaId: string;
    baileysGatewayUrl: string;
    gatewaySecret: string;
  };
  telegram: {
    botToken: string;
    botUsername: string;
  };
  google: {
    clientId: string;
    clientSecret: string;
  };
  microsoft: {
    clientId: string;
    clientSecret: string;
  };
}

const defaultConfig: ApiConfig = {
  ai: {
    defaultProvider: "anthropic",
    anthropic: { apiKey: "", model: "claude-opus-5" },
    openai: { apiKey: "", model: "gpt-4o" },
    gemini: { apiKey: "", model: "gemini-2.5-flash" },
  },
  whatsapp: {
    provider: "meta",
    d360ApiKey: "",
    appSecret: "",
    verifyToken: "",
    accessToken: "",
    phoneNumberId: "",
    wabaId: "",
    baileysGatewayUrl: "",
    gatewaySecret: "",
  },
  telegram: { botToken: "", botUsername: "" },
  google: { clientId: "", clientSecret: "" },
  microsoft: { clientId: "", clientSecret: "" },
};

const AI_PROVIDERS: Array<{
  id: AIProvider;
  name: string;
  keyHint: string;
  modelHint: string;
  consoleUrl: string;
  consoleLabel: string;
  steps: string[];
}> = [
  {
    id: "anthropic",
    name: "Anthropic (Claude)",
    keyHint: "sk-ant-...",
    modelHint: "claude-opus-5",
    consoleUrl: "https://console.anthropic.com/settings/keys",
    consoleLabel: "console.anthropic.com",
    steps: [
      "Create an account and add billing credit.",
      "Open API Keys and click Create Key.",
      "Paste the key here. Recommended models: claude-opus-5, claude-sonnet-5.",
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    keyHint: "sk-...",
    modelHint: "gpt-4o",
    consoleUrl: "https://platform.openai.com/api-keys",
    consoleLabel: "platform.openai.com",
    steps: [
      "Create an account and add billing credit.",
      "Open API keys and click Create new secret key.",
      "Paste the key here. Recommended models: gpt-4o, gpt-4o-mini.",
    ],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    keyHint: "AIza...",
    modelHint: "gemini-2.5-flash",
    consoleUrl: "https://aistudio.google.com/app/apikey",
    consoleLabel: "aistudio.google.com",
    steps: [
      "Sign in to Google AI Studio.",
      "Click Get API key, then Create API key.",
      "Paste the key here. Gemini has a free tier, good for testing.",
    ],
  },
];

function SecretInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 font-mono text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
    </div>
  );
}

export function Setup() {
  const { user, loading } = useAuth();
  const [config, setConfig] = useState<ApiConfig>(defaultConfig);
  const [admins, setAdmins] = useState<{ uids: string[]; emails: string[] } | null>(null);
  const [adminsLoaded, setAdminsLoaded] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [saving, setSaving] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("ai");

  const isAdmin = Boolean(user && admins?.uids?.includes(user.uid));
  const unclaimed = adminsLoaded && admins === null;

  const loadConfig = useCallback(async () => {
    try {
      const snap = await getDoc(doc(db, "platform_config", "apis"));
      if (snap.exists()) {
        const data = snap.data() as Partial<ApiConfig>;
        setConfig({
          ai: {
            ...defaultConfig.ai,
            ...data.ai,
            anthropic: { ...defaultConfig.ai.anthropic, ...data.ai?.anthropic },
            openai: { ...defaultConfig.ai.openai, ...data.ai?.openai },
            gemini: { ...defaultConfig.ai.gemini, ...data.ai?.gemini },
          },
          whatsapp: { ...defaultConfig.whatsapp, ...data.whatsapp },
          telegram: { ...defaultConfig.telegram, ...data.telegram },
          google: { ...defaultConfig.google, ...data.google },
          microsoft: { ...defaultConfig.microsoft, ...data.microsoft },
        });
      }
    } catch (err) {
      console.error("Failed to load config:", err);
      setErrorMessage("Could not read the saved configuration.");
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const loadAdmins = async () => {
      try {
        const snap = await getDoc(doc(db, "platform_config", "admins"));
        setAdmins(snap.exists() ? (snap.data() as { uids: string[]; emails: string[] }) : null);
      } catch (err) {
        console.error("Failed to read admins:", err);
        setAdmins(null);
      } finally {
        setAdminsLoaded(true);
      }
    };

    loadAdmins();
  }, [user]);

  useEffect(() => {
    if (isAdmin) loadConfig();
    else if (adminsLoaded) setLoadingConfig(false);
  }, [isAdmin, adminsLoaded, loadConfig]);

  const claimInstance = async () => {
    if (!user) return;
    setClaiming(true);
    setErrorMessage("");
    try {
      const record = {
        uids: [user.uid],
        emails: [user.email || ""],
        claimedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "platform_config", "admins"), record);
      setAdmins({ uids: record.uids, emails: record.emails });
    } catch (err) {
      console.error("Failed to claim instance:", err);
      setErrorMessage(
        "Claim failed. Deploy the Firestore rules from this repo, then reload."
      );
    } finally {
      setClaiming(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setSaveStatus("idle");
    setErrorMessage("");
    try {
      await setDoc(
        doc(db, "platform_config", "apis"),
        { ...config, updatedAt: new Date().toISOString(), updatedBy: user?.email || "" },
        { merge: true }
      );
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      console.error("Failed to save config:", err);
      setSaveStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Save failed.");
      setTimeout(() => setSaveStatus("idle"), 6000);
    } finally {
      setSaving(false);
    }
  };

  const updateAI = (
    provider: AIProvider,
    field: "apiKey" | "model",
    value: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      ai: { ...prev.ai, [provider]: { ...prev.ai[provider], [field]: value } },
    }));
  };

  const updateSection = <K extends "whatsapp" | "telegram" | "google" | "microsoft">(
    section: K,
    field: keyof ApiConfig[K],
    value: string
  ) => {
    setConfig((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };

  if (loading || !adminsLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md rounded-xl bg-white p-8 text-center shadow">
          <h1 className="text-lg font-semibold text-gray-900">Sign in required</h1>
          <p className="mt-2 text-sm text-gray-600">
            Log in with the account that owns this instance to manage API keys.
          </p>
          <Link to="/login" className="mt-4 inline-block text-sm font-medium text-brand-600">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  if (unclaimed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow">
          <ShieldCheck className="h-10 w-10 text-brand-600" />
          <h1 className="mt-4 text-xl font-bold text-gray-900">Claim this instance</h1>
          <p className="mt-2 text-sm text-gray-600">
            Nobody administers this deployment yet. Claiming it records{" "}
            <span className="font-mono text-xs">{user.email}</span> as the owner, and only
            owners can view or change API keys after that.
          </p>
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            Do this immediately after your first deploy, before sharing the URL. Whoever
            claims first controls the keys.
          </p>
          {errorMessage && (
            <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
          )}
          <button
            onClick={claimInstance}
            disabled={claiming}
            className="mt-5 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {claiming ? "Claiming..." : "Claim as owner"}
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md rounded-xl bg-white p-8 text-center shadow">
          <AlertCircle className="mx-auto h-10 w-10 text-amber-500" />
          <h1 className="mt-4 text-lg font-semibold text-gray-900">Owner access only</h1>
          <p className="mt-2 text-sm text-gray-600">
            API keys on this instance are managed by{" "}
            {admins?.emails?.filter(Boolean).join(", ") || "the instance owner"}. To add
            your own AI key for your leads only, use Settings.
          </p>
          <Link
            to="/settings"
            className="mt-4 inline-block text-sm font-medium text-brand-600"
          >
            Open Settings
          </Link>
        </div>
      </div>
    );
  }

  const tabs: Array<{ id: TabId; label: string; icon: typeof Brain }> = [
    { id: "ai", label: "AI Provider", icon: Brain },
    { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
    { id: "telegram", label: "Telegram", icon: Send },
    { id: "calendar", label: "Calendar", icon: Calendar },
  ];

  const anyAIKey = AI_PROVIDERS.some((p) => config.ai[p.id].apiKey.trim());

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">API Keys</h1>
            <p className="text-sm text-gray-500">
              Bring your own keys. Nothing is shared with anyone else, and this app
              charges you nothing.
            </p>
          </div>
          <Link to="/dashboard" className="text-sm font-medium text-brand-600">
            Back to app
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {!anyAIKey && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800">
              The AI assistant cannot reply until you add at least one AI provider key
              below. Everything else is optional.
            </p>
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-brand-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {loadingConfig ? (
          <div className="rounded-xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
            Loading saved configuration...
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === "ai" && (
              <>
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <h2 className="text-base font-semibold text-gray-900">
                    Preferred provider
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Used first when several keys are present. If it has no key, the
                    others are tried in order.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {AI_PROVIDERS.map((provider) => (
                      <button
                        key={provider.id}
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            ai: { ...prev.ai, defaultProvider: provider.id },
                          }))
                        }
                        className={`rounded-lg border px-3 py-1.5 text-sm ${
                          config.ai.defaultProvider === provider.id
                            ? "border-brand-500 bg-brand-50 text-brand-700"
                            : "border-gray-300 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {provider.name}
                      </button>
                    ))}
                  </div>
                </div>

                {AI_PROVIDERS.map((provider) => (
                  <div key={provider.id} className="rounded-xl bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-semibold text-gray-900">
                        {provider.name}
                      </h2>
                      {config.ai[provider.id].apiKey.trim() ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                          <CheckCircle className="h-4 w-4" /> Key saved
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Not configured</span>
                      )}
                    </div>

                    <ol className="mt-3 space-y-1 text-sm text-gray-600">
                      {provider.steps.map((step, i) => (
                        <li key={step}>
                          {i + 1}. {step}
                        </li>
                      ))}
                    </ol>
                    <a
                      href={provider.consoleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
                    >
                      {provider.consoleLabel}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <SecretInput
                        label="API key"
                        value={config.ai[provider.id].apiKey}
                        onChange={(v) => updateAI(provider.id, "apiKey", v)}
                        placeholder={provider.keyHint}
                      />
                      <TextInput
                        label="Model"
                        value={config.ai[provider.id].model}
                        onChange={(v) => updateAI(provider.id, "model", v)}
                        placeholder={provider.modelHint}
                      />
                    </div>
                  </div>
                ))}
              </>
            )}

            {activeTab === "whatsapp" && (
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900">WhatsApp</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Optional. Pick how you connect WhatsApp, then fill in that provider's
                  fields.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(["meta", "360dialog", "baileys"] as const).map((provider) => (
                    <button
                      key={provider}
                      onClick={() => updateSection("whatsapp", "provider", provider)}
                      className={`rounded-lg border px-3 py-1.5 text-sm ${
                        config.whatsapp.provider === provider
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-gray-300 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {provider === "meta"
                        ? "Meta Cloud API"
                        : provider === "360dialog"
                        ? "360dialog"
                        : "Self-hosted gateway"}
                    </button>
                  ))}
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {config.whatsapp.provider === "meta" && (
                    <>
                      <SecretInput
                        label="App secret"
                        value={config.whatsapp.appSecret}
                        onChange={(v) => updateSection("whatsapp", "appSecret", v)}
                      />
                      <SecretInput
                        label="Access token"
                        value={config.whatsapp.accessToken}
                        onChange={(v) => updateSection("whatsapp", "accessToken", v)}
                      />
                      <TextInput
                        label="Phone number ID"
                        value={config.whatsapp.phoneNumberId}
                        onChange={(v) => updateSection("whatsapp", "phoneNumberId", v)}
                      />
                      <TextInput
                        label="WABA ID"
                        value={config.whatsapp.wabaId}
                        onChange={(v) => updateSection("whatsapp", "wabaId", v)}
                      />
                      <TextInput
                        label="Webhook verify token"
                        value={config.whatsapp.verifyToken}
                        onChange={(v) => updateSection("whatsapp", "verifyToken", v)}
                        placeholder="any string you also paste into Meta"
                      />
                    </>
                  )}

                  {config.whatsapp.provider === "360dialog" && (
                    <>
                      <SecretInput
                        label="360dialog API key"
                        value={config.whatsapp.d360ApiKey}
                        onChange={(v) => updateSection("whatsapp", "d360ApiKey", v)}
                      />
                      <TextInput
                        label="Phone number ID"
                        value={config.whatsapp.phoneNumberId}
                        onChange={(v) => updateSection("whatsapp", "phoneNumberId", v)}
                      />
                    </>
                  )}

                  {config.whatsapp.provider === "baileys" && (
                    <>
                      <TextInput
                        label="Gateway URL"
                        value={config.whatsapp.baileysGatewayUrl}
                        onChange={(v) =>
                          updateSection("whatsapp", "baileysGatewayUrl", v)
                        }
                        placeholder="https://your-gateway.example.com"
                      />
                      <SecretInput
                        label="Gateway shared secret"
                        value={config.whatsapp.gatewaySecret}
                        onChange={(v) => updateSection("whatsapp", "gatewaySecret", v)}
                      />
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === "telegram" && (
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900">Telegram</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Optional and free. Message @BotFather on Telegram, send /newbot, then
                  paste the token it gives you.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <SecretInput
                    label="Bot token"
                    value={config.telegram.botToken}
                    onChange={(v) => updateSection("telegram", "botToken", v)}
                    placeholder="123456:ABC-DEF..."
                  />
                  <TextInput
                    label="Bot username"
                    value={config.telegram.botUsername}
                    onChange={(v) => updateSection("telegram", "botUsername", v)}
                    placeholder="my_realestate_bot"
                  />
                </div>
              </div>
            )}

            {activeTab === "calendar" && (
              <>
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <h2 className="text-base font-semibold text-gray-900">
                    Google Calendar
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Optional. Create an OAuth client (type: Web application) in Google
                    Cloud Console and add your deployed callback URL as an authorized
                    redirect URI.
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <TextInput
                      label="Client ID"
                      value={config.google.clientId}
                      onChange={(v) => updateSection("google", "clientId", v)}
                    />
                    <SecretInput
                      label="Client secret"
                      value={config.google.clientSecret}
                      onChange={(v) => updateSection("google", "clientSecret", v)}
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <h2 className="text-base font-semibold text-gray-900">
                    Outlook Calendar
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Optional. Register an app in Microsoft Entra ID and create a client
                    secret.
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <TextInput
                      label="Client ID"
                      value={config.microsoft.clientId}
                      onChange={(v) => updateSection("microsoft", "clientId", v)}
                    />
                    <SecretInput
                      label="Client secret"
                      value={config.microsoft.clientSecret}
                      onChange={(v) => updateSection("microsoft", "clientSecret", v)}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center gap-4">
              <button
                onClick={saveConfig}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save keys"}
              </button>
              {saveStatus === "success" && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" /> Saved
                </span>
              )}
              {saveStatus === "error" && (
                <span className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" /> {errorMessage || "Save failed"}
                </span>
              )}
            </div>

            <p className="text-xs text-gray-500">
              Keys are stored in your own Firestore database, readable only by instance
              owners. Cloud Functions read them at request time. You can also supply them
              as environment variables instead, which takes priority over anything saved
              here.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
