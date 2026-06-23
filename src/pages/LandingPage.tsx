import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Bot,
  MessageSquare,
  Star,
  Calendar,
  ShieldCheck,
  Globe2,
  ChevronDown,
  ChevronRight,
  X,
  Check,
  Play,
  ArrowRight,
  Zap,
  Clock,
  TrendingUp,
  Send,
  Users,
  BarChart3,
  Linkedin,
  Twitter,
  Instagram,
  Menu,
  X as XIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  useInView hook : triggers "visible" class on scroll                */
/* ------------------------------------------------------------------ */
function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(el);
      }
    }, { threshold: 0.15, ...options });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, isVisible } = useInView();
  return (
    <div
      ref={ref}
      className={`reveal ${isVisible ? "visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Navbar                                                             */
/* ------------------------------------------------------------------ */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-100"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between lg:h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${scrolled ? "bg-brand-600" : "bg-white/20"}`}>
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className={`text-lg font-bold tracking-tight transition-colors ${scrolled ? "text-gray-900" : "text-white"}`}>
              AgentFlow AI
            </span>
          </a>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  scrolled
                    ? "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              to="/login"
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                scrolled
                  ? "text-gray-700 hover:text-gray-900"
                  : "text-white/90 hover:text-white"
              }`}
            >
              Login
            </Link>
            <Link
              to="/signup"
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all shadow-lg hover:shadow-xl ${
                scrolled
                  ? "bg-brand-600 text-white hover:bg-brand-700"
                  : "bg-white text-brand-700 hover:bg-gray-50"
              }`}
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile menu btn */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`lg:hidden rounded-lg p-2 transition-colors ${
              scrolled ? "text-gray-700 hover:bg-gray-100" : "text-white hover:bg-white/10"
            }`}
          >
            {mobileOpen ? <XIcon className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl animate-in">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <Link to="/login" className="block rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Login
              </Link>
              <Link to="/signup" className="block rounded-xl bg-brand-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-brand-700">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero Section                                                       */
/* ------------------------------------------------------------------ */
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-purple-900">
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.07]" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)",
        backgroundSize: "64px 64px",
      }} />
      {/* Radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-brand-500/30 to-purple-500/30 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 mb-8">
            <Zap className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium text-white/90">AI-Powered Lead Qualification for Real Estate</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-[1.08] tracking-tight">
            Your AI Real Estate Assistant That{" "}
            <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              Never Sleeps
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-blue-100/80 max-w-2xl mx-auto leading-relaxed">
            Meet Aisha, your AI assistant for Dubai. She qualifies leads, books viewings,
            and speaks your market's language, while you close deals.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-bold text-brand-700 shadow-xl shadow-brand-900/30 hover:shadow-2xl hover:shadow-brand-900/40 transition-all hover:-translate-y-0.5"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#how-it-works"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/5 backdrop-blur-sm px-8 py-4 text-base font-semibold text-white hover:bg-white/10 transition-all"
            >
              <Play className="h-4 w-4" />
              Watch Demo
            </a>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-20 mx-auto max-w-4xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-0 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/10 p-6 lg:p-0 lg:divide-x lg:divide-white/10">
            {[
              { value: "5 min", label: "Avg response time", icon: Clock },
              { value: "10x", label: "More leads qualified", icon: TrendingUp },
              { value: "AED 0", label: "Per message on Telegram", icon: Send },
              { value: "24/7", label: "Always working", icon: Zap },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center py-4 lg:py-6 lg:px-8">
                <stat.icon className="h-5 w-5 text-blue-300 mb-2" />
                <span className="text-2xl lg:text-3xl font-bold text-white">{stat.value}</span>
                <span className="text-xs text-blue-200/70 mt-1">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Social Proof / Logos Bar                                            */
/* ------------------------------------------------------------------ */
function SocialProof() {
  const logos = ["Brokerage 1", "Property Finder", "Bayut", "Dubai Homes", "Prime Estate", "City Properties"];
  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-center text-sm font-medium text-gray-500 uppercase tracking-wider mb-10">
            Trusted by agents across Dubai and the UAE
          </p>
        </Reveal>
        <Reveal delay={100}>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
            {logos.map((name, i) => (
              <div
                key={i}
                className="flex items-center justify-center rounded-xl bg-gray-50 border border-gray-100 px-6 py-5 text-sm font-medium text-gray-400 hover:border-gray-200 hover:text-gray-500 transition-colors"
              >
                {name}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Problem → Solution                                                 */
/* ------------------------------------------------------------------ */
function ProblemSolution() {
  const problems = [
    "60-80% of your time wasted on unqualified leads",
    "Leads go cold while you're stuck in traffic",
    "Can't respond at 2 AM when international buyers message",
    "Generic chatbots don't understand Dubai's luxury market",
  ];
  const solutions = [
    "AI qualifies leads automatically via Telegram & WhatsApp",
    "Responds in seconds, 24 hours a day",
    "Books viewings while you sleep",
    "Understands off-plan, freehold, leasehold: your market's language",
  ];

  return (
    <section className="py-20 lg:py-28 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-16">
            <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700 mb-4">
              Why AgentFlow AI?
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Stop chasing. Start closing.
            </h2>
          </div>
        </Reveal>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Problem */}
          <Reveal delay={100}>
            <div className="rounded-2xl bg-white border border-gray-200 p-8 lg:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                  <X className="h-5 w-5 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">The Problem</h3>
              </div>
              <ul className="space-y-5">
                {problems.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-50">
                      <X className="h-3.5 w-3.5 text-red-500" />
                    </div>
                    <span className="text-gray-600 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Solution */}
          <Reveal delay={200}>
            <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-purple-700 p-8 lg:p-10 shadow-xl shadow-brand-500/20">
              <div className="flex items-center gap-3 mb-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <Check className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">The Solution</h3>
              </div>
              <ul className="space-y-5">
                {solutions.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-blue-50 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Features Grid                                                      */
/* ------------------------------------------------------------------ */
function Features() {
  const features = [
    {
      icon: Globe2,
      title: "Cultural AI Intelligence",
      description: "Aisha handles Dubai's multicultural investors with finesse, from off-plan buyers to luxury villa seekers.",
      color: "bg-purple-50 text-purple-600",
    },
    {
      icon: MessageSquare,
      title: "WhatsApp & Telegram First",
      description: "Meet leads where they already are. Zero per-message cost on Telegram. WhatsApp Business API supported.",
      color: "bg-green-50 text-green-600",
    },
    {
      icon: Star,
      title: "Smart Lead Scoring",
      description: "AI rates every lead 0-100 based on intent, budget, and readiness. Hot leads get flagged instantly.",
      color: "bg-yellow-50 text-yellow-600",
    },
    {
      icon: Calendar,
      title: "Auto Appointment Booking",
      description: "AI checks your calendar and books viewings automatically. Sends .ics invites to both parties.",
      color: "bg-blue-50 text-blue-600",
    },
    {
      icon: ShieldCheck,
      title: "PDPL & RERA Compliant",
      description: "Built-in compliance for the UAE's PDPL and Dubai's RERA regulations. Data handling you can trust.",
      color: "bg-red-50 text-red-600",
    },
    {
      icon: BarChart3,
      title: "Built for Dubai",
      description: "Deeply tuned for the Dubai and UAE property market, from communities and developers to pricing in AED.",
      color: "bg-indigo-50 text-indigo-600",
    },
  ];

  return (
    <section id="features" className="py-20 lg:py-28 bg-white scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-16">
            <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700 mb-4">
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to convert leads
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Purpose-built for real estate agents in Dubai and the UAE. Every feature designed to help you close more deals.
            </p>
          </div>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="group rounded-2xl border border-gray-100 bg-white p-8 hover:shadow-xl hover:shadow-gray-100/80 hover:border-gray-200 transition-all duration-300 h-full">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feat.color} mb-5`}>
                  <feat.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feat.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feat.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  How It Works                                                       */
/* ------------------------------------------------------------------ */
function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Sign Up & Set Up Your Assistant",
      description: "2 minutes to set up. Customize your AI persona's personality and knowledge base for the Dubai market.",
    },
    {
      num: "02",
      title: "Connect Telegram (or WhatsApp)",
      description: "Your AI assistant goes live instantly. Share a link with leads or embed it on your website. Zero technical skills needed.",
    },
    {
      num: "03",
      title: "Watch Leads Get Qualified",
      description: "Aisha handles the conversations. You get a scored pipeline of qualified leads ready to close.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-gray-50 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-16">
            <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700 mb-4">
              How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Live in under 5 minutes
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              No complex setup. No coding. Just results.
            </p>
          </div>
        </Reveal>

        <div className="grid lg:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <Reveal key={i} delay={i * 120}>
              <div className="relative">
                {/* Connector line */}
                {i < 2 && (
                  <div className="hidden lg:block absolute top-12 left-[calc(100%+0.5rem)] w-[calc(100%-5rem)] h-px bg-gradient-to-r from-brand-300 to-purple-300" />
                )}
                <div className="rounded-2xl bg-white border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow h-full">
                  <span className="inline-block text-5xl font-black bg-gradient-to-br from-brand-600 to-purple-600 bg-clip-text text-transparent mb-4">
                    {step.num}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{step.description}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  AI Personas Section                                                */
/* ------------------------------------------------------------------ */
function AIPersonas() {
  const aishaChat = [
    { role: "lead", text: "I'm looking for a 2-bed apartment in Dubai Marina. Off-plan or ready, budget around AED 2M." },
    { role: "ai", text: "Welcome! I'm Aisha, your Dubai property assistant. 2-bed in Marina with AED 2M budget : excellent. Are you looking for freehold ownership? Any preference for sea view or marina view?" },
    { role: "lead", text: "Freehold, sea view if possible. RERA registered developers only." },
    { role: "ai", text: "Absolutely. I have 4 RERA-registered freehold options with sea views, AED 1.8M to 2.1M. Two are off-plan with 60/40 payment plans. Shall I book a viewing with our certified agent this week?" },
  ];

  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-16">
            <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700 mb-4">
              Meet Your AI Agents
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              AI that speaks your market
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Not generic chatbots. Purpose-built AI personas that understand local culture, language, and regulations.
            </p>
          </div>
        </Reveal>

        <div className="max-w-2xl mx-auto">
          {/* Aisha */}
          <Reveal delay={100}>
            <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-b from-amber-50/50 to-white overflow-hidden">
              <div className="p-6 border-b border-amber-100 bg-amber-50/80">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold text-lg">A</div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Aisha</h3>
                    <p className="text-sm text-amber-700">Dubai Market Specialist</p>
                  </div>
                  <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    Online
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {aishaChat.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "lead" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "lead"
                        ? "bg-brand-600 text-white rounded-br-md"
                        : "bg-gray-100 text-gray-800 rounded-bl-md"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Pricing Section                                                    */
/* ------------------------------------------------------------------ */
function Pricing() {
  const currentPlans = [
    {
      name: "Solo",
      price: "179",
      currency: "AED ",
      period: "/mo",
      badge: "One deal pays for 2+ years",
      features: [
        "100 leads per month",
        "1 agent account",
        "AI lead qualification",
        "Telegram & WhatsApp",
        "Calendar sync",
        "Email support",
      ],
      highlighted: false,
    },
    {
      name: "Team",
      price: "499",
      currency: "AED ",
      period: "/mo",
      badge: null,
      features: [
        "500 leads per month",
        "5 agent accounts",
        "AI lead qualification",
        "Telegram & WhatsApp",
        "Calendar sync",
        "CRM integration",
        "Team dashboard",
        "Priority support",
      ],
      highlighted: true,
    },
    {
      name: "Brokerage",
      price: "1,299",
      currency: "AED ",
      period: "/mo",
      badge: null,
      features: [
        "Unlimited leads",
        "Unlimited agents",
        "AI lead qualification",
        "Telegram & WhatsApp",
        "Calendar sync",
        "CRM integration",
        "Compliance reports",
        "API access",
        "Dedicated account manager",
      ],
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 lg:py-28 bg-gray-50 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-12">
            <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700 mb-4">
              Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Plans that pay for themselves
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
              Start free. Upgrade when your pipeline is overflowing. All prices in AED.
            </p>
          </div>
        </Reveal>

        <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {currentPlans.map((plan, i) => (
            <Reveal key={i} delay={i * 100}>
              <div
                className={`relative rounded-2xl p-8 flex flex-col h-full transition-all duration-300 ${
                  plan.highlighted
                    ? "bg-gradient-to-br from-brand-600 to-purple-700 shadow-xl shadow-brand-500/25 scale-[1.02] lg:scale-105"
                    : "bg-white border border-gray-200 shadow-sm hover:shadow-md"
                }`}
              >
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1 text-xs font-bold ${
                    plan.highlighted ? "bg-yellow-400 text-yellow-900" : "bg-green-100 text-green-700"
                  }`}>
                    {plan.badge}
                  </div>
                )}

                {plan.highlighted && (
                  <div className="absolute -top-3 right-6 rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-yellow-900">
                    Most Popular
                  </div>
                )}

                <h3 className={`text-lg font-bold mb-2 ${plan.highlighted ? "text-white" : "text-gray-900"}`}>
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <span className={`text-4xl font-extrabold ${plan.highlighted ? "text-white" : "text-gray-900"}`}>
                    {plan.currency}{plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlighted ? "text-blue-200" : "text-gray-500"}`}>{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feat, j) => (
                    <li key={j} className="flex items-start gap-2.5">
                      <Check className={`h-4 w-4 mt-0.5 shrink-0 ${plan.highlighted ? "text-blue-200" : "text-green-500"}`} />
                      <span className={`text-sm ${plan.highlighted ? "text-blue-50" : "text-gray-600"}`}>{feat}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/signup"
                  className={`block w-full rounded-xl py-3.5 text-center text-sm font-bold transition-all ${
                    plan.highlighted
                      ? "bg-white text-brand-700 hover:bg-gray-50 shadow-lg"
                      : "bg-brand-600 text-white hover:bg-brand-700 shadow-sm"
                  }`}
                >
                  Start Free Trial
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  ROI Calculator                                                     */
/* ------------------------------------------------------------------ */
function ROICalculator() {
  const [commission, setCommission] = useState(60000);
  const [deals, setDeals] = useState(1);

  const planCost = 179;
  const monthlyRevenue = commission * deals;
  const daysToPayoff = monthlyRevenue > 0 ? Math.max(1, Math.ceil((planCost / monthlyRevenue) * 30)) : 999;

  const current = { commission: 60000, currency: "AED ", cost: "AED 179" };
  const roi = monthlyRevenue > 0 ? Math.round((monthlyRevenue / planCost) * 100) : 0;

  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-12">
            <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700 mb-4">
              ROI Calculator
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              See exactly how fast it pays off
            </h2>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-8 lg:p-10 shadow-2xl">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Average commission per deal ({current.currency})
                  </label>
                  <input
                    type="number"
                    value={commission}
                    onChange={(e) => setCommission(Number(e.target.value) || 0)}
                    className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Default: {current.currency}{new Intl.NumberFormat().format(current.commission)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Deals closed per month
                  </label>
                  <input
                    type="number"
                    value={deals}
                    onChange={(e) => setDeals(Number(e.target.value) || 0)}
                    min={0}
                    className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>

                {/* Results */}
                <div className="rounded-xl bg-gradient-to-r from-brand-600/30 to-purple-600/30 border border-brand-400/30 p-6 mt-8">
                  <div className="text-center">
                    <p className="text-sm text-blue-200 mb-1">AgentFlow AI pays for itself in</p>
                    <p className="text-5xl font-extrabold text-white mb-1">
                      {daysToPayoff} {daysToPayoff === 1 ? "day" : "days"}
                    </p>
                    <p className="text-sm text-blue-200">
                      at just {current.cost}/month (Solo plan)
                    </p>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="text-center rounded-lg bg-white/5 p-3">
                      <p className="text-xs text-gray-400">Monthly Revenue</p>
                      <p className="text-lg font-bold text-white">{current.currency}{new Intl.NumberFormat().format(monthlyRevenue)}</p>
                    </div>
                    <div className="text-center rounded-lg bg-white/5 p-3">
                      <p className="text-xs text-gray-400">ROI</p>
                      <p className="text-lg font-bold text-green-400">{roi.toLocaleString()}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ Section                                                        */
/* ------------------------------------------------------------------ */
function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "How does the AI qualify leads?",
      a: "Our AI engages leads in natural conversation, asking about budget, timeline, location preferences, property type, and ownership needs (like freehold or leasehold in Dubai). Each lead gets a 0-100 qualification score based on their responses, and hot leads are flagged for immediate follow-up.",
    },
    {
      q: "Is my data secure?",
      a: "Absolutely. We use end-to-end encryption, are compliant with the UAE PDPL, and follow RERA data guidelines for Dubai. All data is stored in SOC 2 certified data centers. You own your data, and we never share it with third parties.",
    },
    {
      q: "Do I need WhatsApp Business API?",
      a: "For Telegram, you can start immediately with zero per-message cost. For WhatsApp, we support both the official WhatsApp Business API (for verified businesses) and Telegram as a free alternative. Our team helps you get set up with WhatsApp Business API if you choose that route.",
    },
    {
      q: "Is it built for the Dubai market?",
      a: "Yes! AgentFlow AI is purpose-built for Dubai and the UAE. Aisha handles your leads with multicultural awareness, AED pricing, and deep knowledge of local communities, developers, and ownership types like freehold and leasehold.",
    },
    {
      q: "What happens if the AI gets it wrong?",
      a: "Our AI is highly accurate, but we've built in safeguards. You can review all conversations in real-time, set custom escalation rules, and the AI always offers to connect the lead with a human agent when it's uncertain. You maintain full control at all times.",
    },
    {
      q: "How long is the free trial?",
      a: "The free trial lasts 14 days with full access to all features on the Solo plan. No credit card required. If you love it (and you will), upgrading is one click away.",
    },
  ];

  return (
    <section id="faq" className="py-20 lg:py-28 bg-gray-50 scroll-mt-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-12">
            <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700 mb-4">
              FAQ
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Frequently asked questions
            </h2>
          </div>
        </Reveal>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <Reveal key={i} delay={i * 60}>
              <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${
                      openIndex === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openIndex === i ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="px-6 pb-5 text-gray-500 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Final CTA                                                          */
/* ------------------------------------------------------------------ */
function FinalCTA() {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-brand-900 via-brand-800 to-purple-900 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.05]" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
            Stop Losing Leads.{" "}
            <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
              Start Closing Deals.
            </span>
          </h2>
          <p className="text-lg text-blue-200/80 mb-10 max-w-xl mx-auto">
            Join 50+ agents already using AgentFlow AI to qualify more leads and close more deals.
          </p>
          <Link
            to="/signup"
            className="group inline-flex items-center gap-2 rounded-2xl bg-white px-10 py-5 text-lg font-bold text-brand-700 shadow-xl shadow-brand-900/30 hover:shadow-2xl hover:-translate-y-0.5 transition-all"
          >
            Start Your Free Trial
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <p className="mt-5 text-sm text-blue-200/60">
            No credit card required. Set up in 2 minutes.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */
function Footer() {
  return (
    <footer className="bg-gray-900 pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-gray-800">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">AgentFlow AI</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              AI-powered lead qualification for real estate agents in Dubai and the UAE.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-3">
              {["Features", "Pricing", "FAQ", "Changelog"].map((link) => (
                <li key={link}>
                  <a href={`#${link.toLowerCase()}`} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm text-gray-400 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-3">
              <li>
                <a href="mailto:kodefoundryatelier@gmail.com" className="text-sm text-gray-400 hover:text-white transition-colors">
                  kodefoundryatelier@gmail.com
                </a>
              </li>
              <li className="text-sm text-gray-400">Dubai, UAE</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} AgentFlow AI. All rights reserved.
          </p>
          <p className="text-xs text-gray-500">
            Made with AI for real estate agents in Dubai & the UAE
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Landing Page (main export)                                         */
/* ------------------------------------------------------------------ */
export function LandingPage() {
  useEffect(() => {
    // Smooth scroll for anchor links
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a[href^='#']");
      if (anchor) {
        const href = anchor.getAttribute("href");
        if (href && href !== "#") {
          e.preventDefault();
          const el = document.querySelector(href);
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
          }
        }
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <SocialProof />
      <ProblemSolution />
      <Features />
      <HowItWorks />
      <AIPersonas />
      <Pricing />
      <ROICalculator />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
