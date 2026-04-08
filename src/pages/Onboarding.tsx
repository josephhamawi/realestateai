import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, User, MessageSquare, CreditCard, Check } from "lucide-react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { Button } from "../components/common/Button";
import { useAuth } from "../hooks/useAuth";
import { useTenant } from "../hooks/useTenant";
import { toast } from "../components/common/Toast";

const steps = [
  { id: "profile", label: "Profile", icon: User },
  { id: "ai", label: "AI Config", icon: Bot },
  { id: "integrations", label: "Integrations", icon: MessageSquare },
  { id: "complete", label: "Complete", icon: Check },
];

const countryCodes = [
  { code: "+93", country: "AF", name: "Afghanistan" },
  { code: "+355", country: "AL", name: "Albania" },
  { code: "+213", country: "DZ", name: "Algeria" },
  { code: "+1684", country: "AS", name: "American Samoa" },
  { code: "+376", country: "AD", name: "Andorra" },
  { code: "+244", country: "AO", name: "Angola" },
  { code: "+1264", country: "AI", name: "Anguilla" },
  { code: "+1268", country: "AG", name: "Antigua & Barbuda" },
  { code: "+54", country: "AR", name: "Argentina" },
  { code: "+374", country: "AM", name: "Armenia" },
  { code: "+297", country: "AW", name: "Aruba" },
  { code: "+61", country: "AU", name: "Australia" },
  { code: "+43", country: "AT", name: "Austria" },
  { code: "+994", country: "AZ", name: "Azerbaijan" },
  { code: "+1242", country: "BS", name: "Bahamas" },
  { code: "+973", country: "BH", name: "Bahrain" },
  { code: "+880", country: "BD", name: "Bangladesh" },
  { code: "+1246", country: "BB", name: "Barbados" },
  { code: "+375", country: "BY", name: "Belarus" },
  { code: "+32", country: "BE", name: "Belgium" },
  { code: "+501", country: "BZ", name: "Belize" },
  { code: "+229", country: "BJ", name: "Benin" },
  { code: "+1441", country: "BM", name: "Bermuda" },
  { code: "+975", country: "BT", name: "Bhutan" },
  { code: "+591", country: "BO", name: "Bolivia" },
  { code: "+387", country: "BA", name: "Bosnia & Herzegovina" },
  { code: "+267", country: "BW", name: "Botswana" },
  { code: "+55", country: "BR", name: "Brazil" },
  { code: "+246", country: "IO", name: "British Indian Ocean" },
  { code: "+673", country: "BN", name: "Brunei" },
  { code: "+359", country: "BG", name: "Bulgaria" },
  { code: "+226", country: "BF", name: "Burkina Faso" },
  { code: "+257", country: "BI", name: "Burundi" },
  { code: "+855", country: "KH", name: "Cambodia" },
  { code: "+237", country: "CM", name: "Cameroon" },
  { code: "+1", country: "CA", name: "Canada" },
  { code: "+238", country: "CV", name: "Cape Verde" },
  { code: "+1345", country: "KY", name: "Cayman Islands" },
  { code: "+236", country: "CF", name: "Central African Republic" },
  { code: "+235", country: "TD", name: "Chad" },
  { code: "+56", country: "CL", name: "Chile" },
  { code: "+86", country: "CN", name: "China" },
  { code: "+57", country: "CO", name: "Colombia" },
  { code: "+269", country: "KM", name: "Comoros" },
  { code: "+242", country: "CG", name: "Congo" },
  { code: "+243", country: "CD", name: "Congo (DRC)" },
  { code: "+682", country: "CK", name: "Cook Islands" },
  { code: "+506", country: "CR", name: "Costa Rica" },
  { code: "+225", country: "CI", name: "Cote d'Ivoire" },
  { code: "+385", country: "HR", name: "Croatia" },
  { code: "+53", country: "CU", name: "Cuba" },
  { code: "+357", country: "CY", name: "Cyprus" },
  { code: "+420", country: "CZ", name: "Czech Republic" },
  { code: "+45", country: "DK", name: "Denmark" },
  { code: "+253", country: "DJ", name: "Djibouti" },
  { code: "+1767", country: "DM", name: "Dominica" },
  { code: "+1809", country: "DO", name: "Dominican Republic" },
  { code: "+593", country: "EC", name: "Ecuador" },
  { code: "+20", country: "EG", name: "Egypt" },
  { code: "+503", country: "SV", name: "El Salvador" },
  { code: "+240", country: "GQ", name: "Equatorial Guinea" },
  { code: "+291", country: "ER", name: "Eritrea" },
  { code: "+372", country: "EE", name: "Estonia" },
  { code: "+251", country: "ET", name: "Ethiopia" },
  { code: "+500", country: "FK", name: "Falkland Islands" },
  { code: "+298", country: "FO", name: "Faroe Islands" },
  { code: "+679", country: "FJ", name: "Fiji" },
  { code: "+358", country: "FI", name: "Finland" },
  { code: "+33", country: "FR", name: "France" },
  { code: "+594", country: "GF", name: "French Guiana" },
  { code: "+689", country: "PF", name: "French Polynesia" },
  { code: "+241", country: "GA", name: "Gabon" },
  { code: "+220", country: "GM", name: "Gambia" },
  { code: "+995", country: "GE", name: "Georgia" },
  { code: "+49", country: "DE", name: "Germany" },
  { code: "+233", country: "GH", name: "Ghana" },
  { code: "+350", country: "GI", name: "Gibraltar" },
  { code: "+30", country: "GR", name: "Greece" },
  { code: "+299", country: "GL", name: "Greenland" },
  { code: "+1473", country: "GD", name: "Grenada" },
  { code: "+590", country: "GP", name: "Guadeloupe" },
  { code: "+1671", country: "GU", name: "Guam" },
  { code: "+502", country: "GT", name: "Guatemala" },
  { code: "+224", country: "GN", name: "Guinea" },
  { code: "+245", country: "GW", name: "Guinea-Bissau" },
  { code: "+592", country: "GY", name: "Guyana" },
  { code: "+509", country: "HT", name: "Haiti" },
  { code: "+504", country: "HN", name: "Honduras" },
  { code: "+852", country: "HK", name: "Hong Kong" },
  { code: "+36", country: "HU", name: "Hungary" },
  { code: "+354", country: "IS", name: "Iceland" },
  { code: "+91", country: "IN", name: "India" },
  { code: "+62", country: "ID", name: "Indonesia" },
  { code: "+98", country: "IR", name: "Iran" },
  { code: "+964", country: "IQ", name: "Iraq" },
  { code: "+353", country: "IE", name: "Ireland" },
  { code: "+972", country: "IL", name: "Israel" },
  { code: "+39", country: "IT", name: "Italy" },
  { code: "+1876", country: "JM", name: "Jamaica" },
  { code: "+81", country: "JP", name: "Japan" },
  { code: "+962", country: "JO", name: "Jordan" },
  { code: "+7", country: "KZ", name: "Kazakhstan" },
  { code: "+254", country: "KE", name: "Kenya" },
  { code: "+686", country: "KI", name: "Kiribati" },
  { code: "+82", country: "KR", name: "South Korea" },
  { code: "+965", country: "KW", name: "Kuwait" },
  { code: "+996", country: "KG", name: "Kyrgyzstan" },
  { code: "+856", country: "LA", name: "Laos" },
  { code: "+371", country: "LV", name: "Latvia" },
  { code: "+961", country: "LB", name: "Lebanon" },
  { code: "+266", country: "LS", name: "Lesotho" },
  { code: "+231", country: "LR", name: "Liberia" },
  { code: "+218", country: "LY", name: "Libya" },
  { code: "+423", country: "LI", name: "Liechtenstein" },
  { code: "+370", country: "LT", name: "Lithuania" },
  { code: "+352", country: "LU", name: "Luxembourg" },
  { code: "+853", country: "MO", name: "Macau" },
  { code: "+389", country: "MK", name: "North Macedonia" },
  { code: "+261", country: "MG", name: "Madagascar" },
  { code: "+265", country: "MW", name: "Malawi" },
  { code: "+60", country: "MY", name: "Malaysia" },
  { code: "+960", country: "MV", name: "Maldives" },
  { code: "+223", country: "ML", name: "Mali" },
  { code: "+356", country: "MT", name: "Malta" },
  { code: "+692", country: "MH", name: "Marshall Islands" },
  { code: "+596", country: "MQ", name: "Martinique" },
  { code: "+222", country: "MR", name: "Mauritania" },
  { code: "+230", country: "MU", name: "Mauritius" },
  { code: "+52", country: "MX", name: "Mexico" },
  { code: "+691", country: "FM", name: "Micronesia" },
  { code: "+373", country: "MD", name: "Moldova" },
  { code: "+377", country: "MC", name: "Monaco" },
  { code: "+976", country: "MN", name: "Mongolia" },
  { code: "+382", country: "ME", name: "Montenegro" },
  { code: "+1664", country: "MS", name: "Montserrat" },
  { code: "+212", country: "MA", name: "Morocco" },
  { code: "+258", country: "MZ", name: "Mozambique" },
  { code: "+95", country: "MM", name: "Myanmar" },
  { code: "+264", country: "NA", name: "Namibia" },
  { code: "+674", country: "NR", name: "Nauru" },
  { code: "+977", country: "NP", name: "Nepal" },
  { code: "+31", country: "NL", name: "Netherlands" },
  { code: "+687", country: "NC", name: "New Caledonia" },
  { code: "+64", country: "NZ", name: "New Zealand" },
  { code: "+505", country: "NI", name: "Nicaragua" },
  { code: "+227", country: "NE", name: "Niger" },
  { code: "+234", country: "NG", name: "Nigeria" },
  { code: "+683", country: "NU", name: "Niue" },
  { code: "+47", country: "NO", name: "Norway" },
  { code: "+968", country: "OM", name: "Oman" },
  { code: "+92", country: "PK", name: "Pakistan" },
  { code: "+680", country: "PW", name: "Palau" },
  { code: "+970", country: "PS", name: "Palestine" },
  { code: "+507", country: "PA", name: "Panama" },
  { code: "+675", country: "PG", name: "Papua New Guinea" },
  { code: "+595", country: "PY", name: "Paraguay" },
  { code: "+51", country: "PE", name: "Peru" },
  { code: "+63", country: "PH", name: "Philippines" },
  { code: "+48", country: "PL", name: "Poland" },
  { code: "+351", country: "PT", name: "Portugal" },
  { code: "+1787", country: "PR", name: "Puerto Rico" },
  { code: "+974", country: "QA", name: "Qatar" },
  { code: "+262", country: "RE", name: "Reunion" },
  { code: "+40", country: "RO", name: "Romania" },
  { code: "+7", country: "RU", name: "Russia" },
  { code: "+250", country: "RW", name: "Rwanda" },
  { code: "+685", country: "WS", name: "Samoa" },
  { code: "+378", country: "SM", name: "San Marino" },
  { code: "+239", country: "ST", name: "Sao Tome & Principe" },
  { code: "+966", country: "SA", name: "Saudi Arabia" },
  { code: "+221", country: "SN", name: "Senegal" },
  { code: "+381", country: "RS", name: "Serbia" },
  { code: "+248", country: "SC", name: "Seychelles" },
  { code: "+232", country: "SL", name: "Sierra Leone" },
  { code: "+65", country: "SG", name: "Singapore" },
  { code: "+421", country: "SK", name: "Slovakia" },
  { code: "+386", country: "SI", name: "Slovenia" },
  { code: "+677", country: "SB", name: "Solomon Islands" },
  { code: "+252", country: "SO", name: "Somalia" },
  { code: "+27", country: "ZA", name: "South Africa" },
  { code: "+211", country: "SS", name: "South Sudan" },
  { code: "+34", country: "ES", name: "Spain" },
  { code: "+94", country: "LK", name: "Sri Lanka" },
  { code: "+249", country: "SD", name: "Sudan" },
  { code: "+597", country: "SR", name: "Suriname" },
  { code: "+268", country: "SZ", name: "Eswatini" },
  { code: "+46", country: "SE", name: "Sweden" },
  { code: "+41", country: "CH", name: "Switzerland" },
  { code: "+963", country: "SY", name: "Syria" },
  { code: "+886", country: "TW", name: "Taiwan" },
  { code: "+992", country: "TJ", name: "Tajikistan" },
  { code: "+255", country: "TZ", name: "Tanzania" },
  { code: "+66", country: "TH", name: "Thailand" },
  { code: "+670", country: "TL", name: "Timor-Leste" },
  { code: "+228", country: "TG", name: "Togo" },
  { code: "+690", country: "TK", name: "Tokelau" },
  { code: "+676", country: "TO", name: "Tonga" },
  { code: "+1868", country: "TT", name: "Trinidad & Tobago" },
  { code: "+216", country: "TN", name: "Tunisia" },
  { code: "+90", country: "TR", name: "Turkey" },
  { code: "+993", country: "TM", name: "Turkmenistan" },
  { code: "+1649", country: "TC", name: "Turks & Caicos" },
  { code: "+688", country: "TV", name: "Tuvalu" },
  { code: "+256", country: "UG", name: "Uganda" },
  { code: "+380", country: "UA", name: "Ukraine" },
  { code: "+971", country: "AE", name: "United Arab Emirates" },
  { code: "+44", country: "GB", name: "United Kingdom" },
  { code: "+1", country: "US", name: "United States" },
  { code: "+598", country: "UY", name: "Uruguay" },
  { code: "+998", country: "UZ", name: "Uzbekistan" },
  { code: "+678", country: "VU", name: "Vanuatu" },
  { code: "+58", country: "VE", name: "Venezuela" },
  { code: "+84", country: "VN", name: "Vietnam" },
  { code: "+967", country: "YE", name: "Yemen" },
  { code: "+260", country: "ZM", name: "Zambia" },
  { code: "+263", country: "ZW", name: "Zimbabwe" },
];

export function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const defaultCountryCode = tenant?.market === "dubai" ? "+971" : "+234";
  const [phoneCode, setPhoneCode] = useState(defaultCountryCode);
  const [phoneNumber, setPhoneNumber] = useState(() => {
    const existing = tenant?.agent?.phone || "";
    // Strip existing country code prefix if present
    const match = countryCodes.find((c) => existing.startsWith(c.code));
    if (match) return existing.slice(match.code.length);
    return existing;
  });

  const [profile, setProfile] = useState({
    name: tenant?.agent?.name || "",
    phone: tenant?.agent?.phone || "",
    licenseNumber: tenant?.agent?.licenseNumber || "",
    brokerage: tenant?.agent?.brokerage || "",
    referralSource: tenant?.agent?.referralSource || "",
  });

  const [aiConfig, setAiConfig] = useState({
    personaName: tenant?.aiConfig?.personaName || "",
    greetingScript: tenant?.aiConfig?.greetingScript || "",
    handoffThreshold: tenant?.aiConfig?.handoffThreshold || 60,
  });

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "tenants", user.uid), {
        "agent.name": profile.name,
        "agent.email": user.email,
        "agent.phone": profile.phone,
        "agent.licenseNumber": profile.licenseNumber,
        "agent.brokerage": profile.brokerage,
        "agent.referralSource": profile.referralSource,
        updatedAt: serverTimestamp(),
      });
      toast("success", "Profile saved");
      setCurrentStep(1);
    } catch (err) {
      toast("error", "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAI = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "tenants", user.uid), {
        "aiConfig.personaName": aiConfig.personaName,
        "aiConfig.greetingScript": aiConfig.greetingScript,
        "aiConfig.handoffThreshold": aiConfig.handoffThreshold,
        updatedAt: serverTimestamp(),
      });
      toast("success", "AI configuration saved");
      setCurrentStep(2);
    } catch (err) {
      toast("error", "Failed to save AI config");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-2xl px-4">
        <div className="text-center">
          <Bot className="mx-auto h-12 w-12 text-brand-600" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Set up your account</h1>
          <p className="mt-2 text-sm text-gray-500">
            Complete these steps to start using AgentFlow AI
          </p>
        </div>

        {/* Step indicator */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  index <= currentStep
                    ? "bg-brand-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                <step.icon className="h-5 w-5" />
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 w-12 ${
                    index < currentStep ? "bg-brand-600" : "bg-gray-200"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {currentStep === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Agent Profile</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <div className="mt-1 flex">
                    <select
                      value={phoneCode}
                      onChange={(e) => {
                        setPhoneCode(e.target.value);
                        setProfile({ ...profile, phone: e.target.value + phoneNumber });
                      }}
                      className="w-[130px] shrink-0 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-2 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      {countryCodes.map((c) => (
                        <option key={c.country + c.code} value={c.code}>
                          {c.code} {c.country}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => {
                        const num = e.target.value.replace(/[^0-9]/g, "");
                        setPhoneNumber(num);
                        setProfile({ ...profile, phone: phoneCode + num });
                      }}
                      placeholder="8012345678"
                      className="w-full rounded-r-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">License Number</label>
                  <input
                    type="text"
                    value={profile.licenseNumber}
                    onChange={(e) => setProfile({ ...profile, licenseNumber: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Brokerage</label>
                  <input
                    type="text"
                    value={profile.brokerage}
                    onChange={(e) => setProfile({ ...profile, brokerage: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Where did you hear about us?</label>
                  <select
                    value={profile.referralSource}
                    onChange={(e) => setProfile({ ...profile, referralSource: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">Select an option</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="x_twitter">X (Twitter)</option>
                    <option value="tiktok">TikTok</option>
                    <option value="web_search">Web Search</option>
                    <option value="reference">Reference</option>
                    <option value="referral">Referral</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} loading={loading}>
                  Save & Continue
                </Button>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">AI Configuration</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700">AI Persona Name</label>
                <input
                  type="text"
                  value={aiConfig.personaName}
                  onChange={(e) => setAiConfig({ ...aiConfig, personaName: e.target.value })}
                  placeholder={tenant?.market === "dubai" ? "Aisha" : "Chioma"}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Greeting Script</label>
                <textarea
                  value={aiConfig.greetingScript}
                  onChange={(e) => setAiConfig({ ...aiConfig, greetingScript: e.target.value })}
                  rows={3}
                  placeholder="Custom greeting for new leads..."
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Handoff Threshold (0-100)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={aiConfig.handoffThreshold}
                  onChange={(e) =>
                    setAiConfig({ ...aiConfig, handoffThreshold: Number(e.target.value) })
                  }
                  className="mt-2 w-full"
                />
                <p className="text-sm text-gray-500">
                  Score: {aiConfig.handoffThreshold} - AI suggests appointment when lead score reaches this level
                </p>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(0)}>
                  Back
                </Button>
                <Button onClick={handleSaveAI} loading={loading}>
                  Save & Continue
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Integrations</h2>
              <p className="text-sm text-gray-500">
                You can set up integrations now or later from Settings.
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">WhatsApp Business</p>
                      <p className="text-xs text-gray-500">Connect your WhatsApp Business account</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Set Up
                  </Button>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-8 w-8 text-brand-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {tenant?.market === "dubai" ? "Stripe" : "Paystack"}
                      </p>
                      <p className="text-xs text-gray-500">Set up billing and subscription</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Set Up
                  </Button>
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setCurrentStep(3)}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">You're all set!</h2>
              <p className="text-sm text-gray-500">
                Your AgentFlow AI account is ready. Start managing leads and let AI handle your conversations.
              </p>
              <Button onClick={handleComplete} className="mt-4">
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
