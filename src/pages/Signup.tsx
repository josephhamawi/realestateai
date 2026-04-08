import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bot } from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { Button } from "../components/common/Button";
import { MarketSelector } from "../components/market/MarketSelector";
import { useAuth } from "../hooks/useAuth";
import { functions, auth } from "../config/firebase";
import { toast } from "../components/common/Toast";
import type { MarketId } from "../lib/marketConfig";

export function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [step, setStep] = useState<"market" | "credentials">("market");
  const [market, setMarket] = useState<MarketId | "">("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMarketNext = () => {
    if (!market) {
      toast("warning", "Please select a market");
      return;
    }
    setStep("credentials");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast("error", "Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast("error", "Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await signup(email, password);
      const provisionTenant = httpsCallable(functions, "provisionTenant");
      await provisionTenant({ market });
      // Force token refresh so custom claims (tenantId, role, market) are available
      if (auth.currentUser) {
        await auth.currentUser.getIdToken(true);
      }
      toast("success", "Account created!", "Welcome to AgentFlow AI");
      navigate("/onboarding");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Signup failed";
      toast("error", "Signup failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <Bot className="mx-auto h-12 w-12 text-brand-600" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-2 text-sm text-gray-500">
            {step === "market"
              ? "Select your market to get started"
              : "Set up your login credentials"}
          </p>
        </div>

        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {step === "market" ? (
            <div className="space-y-6">
              <MarketSelector value={market} onChange={setMarket} />
              <Button className="w-full" onClick={handleMarketNext} disabled={!market}>
                Continue
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" type="button" onClick={() => setStep("market")}>
                  Back
                </Button>
                <Button type="submit" className="flex-1" loading={loading}>
                  Create Account
                </Button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
