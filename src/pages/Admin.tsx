import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { Bot, Key, MessageSquare, Send, Brain, CreditCard, Shield, Save, CheckCircle, AlertCircle, Eye, EyeOff, Calendar } from "lucide-react";

const ADMIN_EMAIL = "joseph.hamawi.ng@gmail.com";

interface ApiConfig {
  whatsapp: {
    provider: "meta" | "360dialog";
    d360ApiKey: string;
    appSecret: string;
    verifyToken: string;
    accessToken: string;
    phoneNumberId: string;
    wabaId: string;
  };
  telegram: {
    botToken: string;
    botUsername: string;
  };
  vynn: {
    apiKey: string;
    model: string;
  };
  gemini: {
    apiKey: string;
    model: string;
  };
  stripe: {
    secretKey: string;
    publicKey: string;
    webhookSecret: string;
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
  whatsapp: {
    provider: "meta",
    d360ApiKey: "",
    appSecret: "",
    verifyToken: "",
    accessToken: "",
    phoneNumberId: "",
    wabaId: "",
  },
  telegram: {
    botToken: "",
    botUsername: "",
  },
  vynn: {
    apiKey: "",
    model: "auto",
  },
  gemini: {
    apiKey: "",
    model: "gemini-2.5-flash",
  },
  stripe: {
    secretKey: "",
    publicKey: "",
    webhookSecret: "",
  },
  google: {
    clientId: "",
    clientSecret: "",
  },
  microsoft: {
    clientId: "",
    clientSecret: "",
  },
};

function SecretInput({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm font-mono focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
  );
}

function TextInput({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
    </div>
  );
}

export function Admin() {
  const { user, loading } = useAuth();
  const [config, setConfig] = useState<ApiConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [activeTab, setActiveTab] = useState<"whatsapp" | "telegram" | "vynn" | "gemini" | "stripe" | "google" | "microsoft">("whatsapp");

  useEffect(() => {
    if (user && user.email === ADMIN_EMAIL) {
      loadConfig();
    }
  }, [user]);

  const loadConfig = async () => {
    try {
      const snap = await getDoc(doc(db, "platform_config", "apis"));
      if (snap.exists()) {
        const data = snap.data() as Partial<ApiConfig>;
        setConfig({
          whatsapp: { ...defaultConfig.whatsapp, ...data.whatsapp },
          telegram: { ...defaultConfig.telegram, ...data.telegram },
          vynn: { ...defaultConfig.vynn, ...data.vynn },
          gemini: { ...defaultConfig.gemini, ...(data as Record<string, unknown>).gemini as Partial<ApiConfig["gemini"]> },
          stripe: { ...defaultConfig.stripe, ...data.stripe },
          google: { ...defaultConfig.google, ...(data as Record<string, unknown>).google as Partial<ApiConfig["google"]> },
          microsoft: { ...defaultConfig.microsoft, ...(data as Record<string, unknown>).microsoft as Partial<ApiConfig["microsoft"]> },
        });
      }
    } catch (err) {
      console.error("Failed to load config:", err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setSaveStatus("idle");
    try {
      await setDoc(doc(db, "platform_config", "apis"), {
        ...config,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email,
      }, { merge: true });
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      console.error("Failed to save config:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 5000);
    } finally {
      setSaving(false);
    }
  };

  const updateWhatsApp = (
    field: keyof ApiConfig["whatsapp"],
    value: string
  ) => {
    setConfig((prev) => ({ ...prev, whatsapp: { ...prev.whatsapp, [field]: value } }));
  };

  const updateTelegram = (field: keyof ApiConfig["telegram"], value: string) => {
    setConfig((prev) => ({ ...prev, telegram: { ...prev.telegram, [field]: value } }));
  };

  const updateVynn = (field: keyof ApiConfig["vynn"], value: string) => {
    setConfig((prev) => ({ ...prev, vynn: { ...prev.vynn, [field]: value } }));
  };

  const updateGemini = (field: keyof ApiConfig["gemini"], value: string) => {
    setConfig((prev) => ({ ...prev, gemini: { ...prev.gemini, [field]: value } }));
  };

  const updateStripe = (field: keyof ApiConfig["stripe"], value: string) => {
    setConfig((prev) => ({ ...prev, stripe: { ...prev.stripe, [field]: value } }));
  };

  const updateGoogle = (field: keyof ApiConfig["google"], value: string) => {
    setConfig((prev) => ({ ...prev, google: { ...prev.google, [field]: value } }));
  };

  const updateMicrosoft = (field: keyof ApiConfig["microsoft"], value: string) => {
    setConfig((prev) => ({ ...prev, microsoft: { ...prev.microsoft, [field]: value } }));
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return <Navigate to="/dashboard" replace />;
  }

  const tabs = [
    { id: "whatsapp" as const, label: "WhatsApp", icon: MessageSquare, color: "text-green-600" },
    { id: "telegram" as const, label: "Telegram", icon: Send, color: "text-blue-500" },
    { id: "vynn" as const, label: "Vynn AI", icon: Brain, color: "text-purple-600" },
    { id: "gemini" as const, label: "Gemini", icon: Brain, color: "text-blue-500" },
    { id: "stripe" as const, label: "Stripe (AE)", icon: CreditCard, color: "text-indigo-600" },
    { id: "google" as const, label: "Google OAuth", icon: Calendar, color: "text-red-500" },
    { id: "microsoft" as const, label: "Microsoft OAuth", icon: Calendar, color: "text-blue-600" },
  ];

  const getConfigStatus = (section: keyof ApiConfig) => {
    const values = Object.values(config[section]);
    const filled = values.filter((v) => v && v.length > 0).length;
    if (filled === 0) return "empty";
    if (filled === values.length) return "complete";
    return "partial";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Platform API Configuration</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/dashboard"
                className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
              >
                <Bot className="h-4 w-4" />
                Go to App
              </a>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                Super Admin
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {loadingConfig ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          </div>
        ) : (
          <>
            {/* Status overview */}
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-7">
              {tabs.map((tab) => {
                const status = getConfigStatus(tab.id);
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-lg border p-4 text-left transition-all ${
                      activeTab === tab.id
                        ? "border-brand-300 bg-brand-50 ring-1 ring-brand-200"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <tab.icon className={`h-5 w-5 ${tab.color}`} />
                      {status === "complete" && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {status === "partial" && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                      {status === "empty" && <div className="h-4 w-4 rounded-full border-2 border-gray-300" />}
                    </div>
                    <p className="mt-2 text-sm font-medium text-gray-900">{tab.label}</p>
                    <p className="text-xs text-gray-500">
                      {status === "complete" ? "Configured" : status === "partial" ? "Partially set" : "Not configured"}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Config forms */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              {/* WhatsApp */}
              {activeTab === "whatsapp" && (
                <div>
                  <div className="mb-6 flex items-center gap-3">
                    <MessageSquare className="h-6 w-6 text-green-600" />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">WhatsApp Business API</h2>
                      <p className="text-sm text-gray-500">Meta Cloud API or 360dialog credentials for the Dubai market</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                      <select
                        value={config.whatsapp.provider}
                        onChange={(e) => updateWhatsApp("provider", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        <option value="meta">Meta Cloud API</option>
                        <option value="360dialog">360dialog</option>
                      </select>
                    </div>
                    {config.whatsapp.provider === "360dialog" && (
                      <SecretInput
                        label="360dialog API Key"
                        value={config.whatsapp.d360ApiKey}
                        onChange={(v) => updateWhatsApp("d360ApiKey", v)}
                        placeholder="D360-API-KEY value from 360dialog"
                      />
                    )}
                    <SecretInput
                      label="App Secret"
                      value={config.whatsapp.appSecret}
                      onChange={(v) => updateWhatsApp("appSecret", v)}
                      placeholder="Meta App Secret for webhook verification"
                    />
                    <TextInput
                      label="Verify Token"
                      value={config.whatsapp.verifyToken}
                      onChange={(v) => updateWhatsApp("verifyToken", v)}
                      placeholder="Custom verify token for webhook setup"
                    />
                    <SecretInput
                      label="Access Token"
                      value={config.whatsapp.accessToken}
                      onChange={(v) => updateWhatsApp("accessToken", v)}
                      placeholder="Permanent access token from Meta Business"
                    />
                    <TextInput
                      label="Phone Number ID"
                      value={config.whatsapp.phoneNumberId}
                      onChange={(v) => updateWhatsApp("phoneNumberId", v)}
                      placeholder="WhatsApp Phone Number ID"
                    />
                    <TextInput
                      label="WABA ID"
                      value={config.whatsapp.wabaId}
                      onChange={(v) => updateWhatsApp("wabaId", v)}
                      placeholder="WhatsApp Business Account ID"
                    />
                  </div>
                </div>
              )}

              {/* Telegram */}
              {activeTab === "telegram" && (
                <div>
                  <div className="mb-6 flex items-center gap-3">
                    <Send className="h-6 w-6 text-blue-500" />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Telegram Bot</h2>
                      <p className="text-sm text-gray-500">Telegram Bot API for lead conversations alongside WhatsApp</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <SecretInput
                      label="Bot Token"
                      value={config.telegram.botToken}
                      onChange={(v) => updateTelegram("botToken", v)}
                      placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                    />
                    <TextInput
                      label="Bot Username"
                      value={config.telegram.botUsername}
                      onChange={(v) => updateTelegram("botUsername", v)}
                      placeholder="@YourBotUsername"
                    />
                  </div>
                  <div className="mt-4 rounded-lg bg-blue-50 p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Priority:</strong> If both WhatsApp and Telegram are configured, WhatsApp is preferred for new outbound messages. Replies always go back on the same channel the lead used.
                    </p>
                  </div>
                </div>
              )}

              {/* Vynn AI */}
              {activeTab === "vynn" && (
                <div>
                  <div className="mb-6 flex items-center gap-3">
                    <Brain className="h-6 w-6 text-purple-600" />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Vynn AI</h2>
                      <p className="text-sm text-gray-500">Powers the Noor (Dubai) AI persona via vynnai.app</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <SecretInput
                      label="API Key"
                      value={config.vynn.apiKey}
                      onChange={(v) => updateVynn("apiKey", v)}
                      placeholder="vynn_..."
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                      <select
                        value={config.vynn.model}
                        onChange={(e) => updateVynn("model", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        <option value="auto">Auto (Recommended)</option>
                        <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
                        <option value="claude-opus-4-6">Claude Opus 4.6</option>
                        <option value="gpt-4.1">GPT-4.1</option>
                        <option value="gpt-4.1-mini">GPT-4.1 Mini (Fastest)</option>
                        <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                        <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Gemini */}
              {activeTab === "gemini" && (
                <div>
                  <div className="mb-6 flex items-center gap-3">
                    <Brain className="h-6 w-6 text-blue-500" />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Google Gemini</h2>
                      <p className="text-sm text-gray-500">Alternative AI provider. Used when Vynn AI is not configured or as primary if preferred.</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <SecretInput
                      label="API Key"
                      value={config.gemini.apiKey}
                      onChange={(v) => updateGemini("apiKey", v)}
                      placeholder="AIza..."
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                      <select
                        value={config.gemini.model}
                        onChange={(e) => updateGemini("model", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fastest)</option>
                        <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                        <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg bg-blue-50 p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Priority:</strong> The system uses AI providers in this order: Vynn AI (if key is set) then Gemini (if key is set). Configure whichever you prefer.
                    </p>
                    <p className="mt-2 text-sm text-blue-800">
                      <strong>Setup:</strong> Go to <span className="font-mono text-xs">aistudio.google.com/apikey</span> to get your Gemini API key.
                    </p>
                  </div>
                </div>
              )}

              {/* Stripe */}
              {activeTab === "stripe" && (
                <div>
                  <div className="mb-6 flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-indigo-600" />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Stripe (Dubai)</h2>
                      <p className="text-sm text-gray-500">Payment processing for Dubai agents: AED, cards, Apple Pay, Google Pay</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <SecretInput
                      label="Secret Key"
                      value={config.stripe.secretKey}
                      onChange={(v) => updateStripe("secretKey", v)}
                      placeholder="sk_live_..."
                    />
                    <TextInput
                      label="Publishable Key"
                      value={config.stripe.publicKey}
                      onChange={(v) => updateStripe("publicKey", v)}
                      placeholder="pk_live_..."
                    />
                    <SecretInput
                      label="Webhook Secret"
                      value={config.stripe.webhookSecret}
                      onChange={(v) => updateStripe("webhookSecret", v)}
                      placeholder="whsec_..."
                    />
                  </div>
                </div>
              )}

              {/* Google OAuth */}
              {activeTab === "google" && (
                <div>
                  <div className="mb-6 flex items-center gap-3">
                    <Calendar className="h-6 w-6 text-red-500" />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Google OAuth</h2>
                      <p className="text-sm text-gray-500">OAuth 2.0 credentials for Google Calendar integration</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <SecretInput
                      label="Google OAuth Client ID"
                      value={config.google.clientId}
                      onChange={(v) => updateGoogle("clientId", v)}
                      placeholder="123456789-abcdef.apps.googleusercontent.com"
                    />
                    <SecretInput
                      label="Google OAuth Client Secret"
                      value={config.google.clientSecret}
                      onChange={(v) => updateGoogle("clientSecret", v)}
                      placeholder="GOCSPX-..."
                    />
                  </div>
                  <div className="mt-4 rounded-lg bg-red-50 p-4">
                    <p className="text-sm text-red-800">
                      <strong>Setup:</strong> Go to{" "}
                      <span className="font-mono text-xs">console.cloud.google.com</span> → APIs &amp; Services → Credentials → Create OAuth 2.0 Client ID.
                      Set the authorized redirect URI to:
                    </p>
                    <p className="mt-2 rounded bg-white px-3 py-2 font-mono text-xs text-gray-900 border border-red-200">
                      https://us-central1-agentflowai-11dd2.cloudfunctions.net/googleCalendarCallback
                    </p>
                    <p className="mt-2 text-sm text-red-800">
                      Also enable the <strong>Google Calendar API</strong> in the Google Cloud Console for your project.
                    </p>
                  </div>
                </div>
              )}

              {/* Microsoft OAuth */}
              {activeTab === "microsoft" && (
                <div>
                  <div className="mb-6 flex items-center gap-3">
                    <Calendar className="h-6 w-6 text-blue-600" />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Microsoft OAuth</h2>
                      <p className="text-sm text-gray-500">OAuth 2.0 credentials for Outlook Calendar integration</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <SecretInput
                      label="Microsoft OAuth Client ID (Application ID)"
                      value={config.microsoft.clientId}
                      onChange={(v) => updateMicrosoft("clientId", v)}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    />
                    <SecretInput
                      label="Microsoft OAuth Client Secret"
                      value={config.microsoft.clientSecret}
                      onChange={(v) => updateMicrosoft("clientSecret", v)}
                      placeholder="Client secret value"
                    />
                  </div>
                  <div className="mt-4 rounded-lg bg-blue-50 p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Setup:</strong> Go to{" "}
                      <span className="font-mono text-xs">portal.azure.com</span> &rarr; App registrations &rarr; New registration.
                      Set the redirect URI to:
                    </p>
                    <p className="mt-2 rounded bg-white px-3 py-2 font-mono text-xs text-gray-900 border border-blue-200">
                      https://us-central1-agentflowai-11dd2.cloudfunctions.net/outlookCalendarCallback
                    </p>
                    <p className="mt-2 text-sm text-blue-800">
                      Under <strong>API permissions</strong>, add Microsoft Graph: <strong>Calendars.ReadWrite</strong>, <strong>User.Read</strong>.
                      Under <strong>Certificates & secrets</strong>, create a new client secret and paste the value above.
                    </p>
                  </div>
                </div>
              )}

              {/* Save button */}
              <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
                <div>
                  {saveStatus === "success" && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">Configuration saved successfully</span>
                    </div>
                  )}
                  {saveStatus === "error" && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">Failed to save. Check console for details.</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={saveConfig}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? "Saving..." : "Save All Configuration"}
                </button>
              </div>
            </div>

            {/* Help section */}
            <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Setup Guide</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">1</span>
                  <p><strong>WhatsApp:</strong> Go to <span className="font-mono text-xs">developers.facebook.com</span> → Create App → Add WhatsApp product → Get your credentials from the API Setup page.</p>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-500">2</span>
                  <p><strong>Telegram:</strong> Open Telegram → search <span className="font-mono text-xs">@BotFather</span> → send <span className="font-mono text-xs">/newbot</span> → follow the prompts → copy the bot token here. The webhook is registered automatically when you save.</p>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">3</span>
                  <p><strong>Vynn AI:</strong> Go to <span className="font-mono text-xs">vynnai.app</span> → Get your API key. "Auto" model recommended. It picks the best model automatically.</p>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">4</span>
                  <p><strong>Stripe:</strong> Go to <span className="font-mono text-xs">dashboard.stripe.com</span> → Developers → API keys. Create webhook endpoint for subscription events.</p>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">5</span>
                  <p><strong>Google OAuth:</strong> Go to <span className="font-mono text-xs">console.cloud.google.com</span> → APIs &amp; Services → Credentials → Create OAuth 2.0 Client ID. Set authorized redirect URI to <span className="font-mono text-xs">https://us-central1-agentflowai-11dd2.cloudfunctions.net/googleCalendarCallback</span>. Enable the Google Calendar API.</p>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">6</span>
                  <p><strong>Microsoft OAuth:</strong> Go to <span className="font-mono text-xs">portal.azure.com</span> → App registrations → New registration. Set redirect URI to <span className="font-mono text-xs">https://us-central1-agentflowai-11dd2.cloudfunctions.net/outlookCalendarCallback</span>. Under API permissions, add Microsoft Graph: Calendars.ReadWrite, User.Read.</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
