import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Bot,
  ArrowLeft,
  ArrowRight,
  Mail,
  Globe2,
  Users,
  ShieldCheck,
  Eye,
  Linkedin,
  Twitter,
  Instagram,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Scroll reveal                                                      */
/* ------------------------------------------------------------------ */
function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
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
/*  Sticky Nav                                                         */
/* ------------------------------------------------------------------ */
function StickyNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
          <Link to="/" className="flex items-center gap-2.5 group">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                scrolled ? "bg-brand-600" : "bg-white/20"
              }`}
            >
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span
              className={`text-lg font-bold tracking-tight transition-colors ${
                scrolled ? "text-gray-900" : "text-white"
              }`}
            >
              AgentFlow AI
            </span>
          </Link>
          <Link
            to="/"
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              scrolled
                ? "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                : "text-white/80 hover:text-white hover:bg-white/10"
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </nav>
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
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/signup" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Get Started
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Login
                </Link>
              </li>
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
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:kodefoundryatelier@gmail.com"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
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
            Made with AI for real estate agents in Dubai &amp; the UAE
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  About Us Page                                                      */
/* ------------------------------------------------------------------ */
export function AboutUs() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const values = [
    {
      icon: Globe2,
      title: "Market Intelligence First",
      description:
        "Aisha knows Dubai. She talks about Palm Jumeirah, Dubai Marina, and Downtown the way a local agent would.",
      color: "bg-purple-50 text-purple-600",
    },
    {
      icon: Users,
      title: "Agent-First Design",
      description:
        "Aisha qualifies your leads. You close the deals. You keep control of every account.",
      color: "bg-blue-50 text-blue-600",
    },
    {
      icon: ShieldCheck,
      title: "Compliance by Default",
      description:
        "We built UAE PDPL and RERA requirements into the product from the start.",
      color: "bg-green-50 text-green-600",
    },
    {
      icon: Eye,
      title: "Transparent AI",
      description:
        "You see every message Aisha sends, and you can take over any conversation when you want to.",
      color: "bg-yellow-50 text-yellow-600",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <StickyNav />

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-purple-900">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        {/* Radial glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-brand-500/30 to-purple-500/30 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-32 pb-20 lg:pt-40 lg:pb-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 mb-8">
            <Bot className="h-4 w-4 text-blue-300" />
            <span className="text-sm font-medium text-white/90">Our Story</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
            Built for Dubai Real Estate Agents
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-blue-100/80 max-w-2xl mx-auto leading-relaxed">
            Aisha replies to your leads in seconds, day or night, in the language they
            messaged you in. You wake up to qualified buyers instead of missed messages.
          </p>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Story */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700 mb-4">
                Our Story
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Why We Built AgentFlow AI
              </h2>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 lg:p-12">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                We watched good agents in Dubai lose deals because they could not reply
                fast enough. A buyer messages at 2 AM from Mumbai asking about Palm
                Jumeirah. By morning, that buyer has already spoken to three other agents.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                We built AgentFlow AI to close that gap. Aisha replies the moment a lead
                writes in, in their own language, and she knows the Dubai market well
                enough to talk through a first-time purchase or a luxury listing in Dubai
                Marina. By the time you pick up the conversation, the lead is already
                qualified.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700 mb-4">
              Our Mission
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
              What Drives Us
            </h2>
          </Reveal>

          <Reveal delay={100}>
            <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-purple-700 p-8 lg:p-12 shadow-xl shadow-brand-500/20">
              <p className="text-xl sm:text-2xl text-white font-medium leading-relaxed">
                We want every real estate agent in Dubai and the UAE to have an AI
                assistant that knows the local market, answers leads in their own
                language, and never goes offline.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700 mb-4">
                Our Values
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                What We Believe In
              </h2>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 gap-6">
            {values.map((value, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="rounded-2xl bg-white border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow h-full">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${value.color} mb-5`}
                  >
                    <value.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700 mb-4">
              The Team
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Built by Kode Foundry Atelier
            </h2>
          </Reveal>

          <Reveal delay={100}>
            <div className="rounded-2xl bg-white border border-gray-200 p-8 lg:p-12 shadow-sm">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-brand-50 mb-6">
                <Bot className="h-8 w-8 text-brand-600" />
              </div>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                Kode Foundry Atelier is a technology studio that builds AI tools for the
                UAE property market. We pair AI with a working knowledge of how Dubai
                agents actually sell.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Our team has spent time around AI, real estate software, and the day-to-day
                pressures of selling property in Dubai and across the UAE. We have watched
                agents lose leads to slow replies, and we built AgentFlow AI to fix it.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700 mb-4">
              Get in Touch
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Questions? Email Us
            </h2>
          </Reveal>

          <Reveal delay={100}>
            <div className="inline-flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-200 px-6 py-4 mb-10">
              <Mail className="h-5 w-5 text-brand-600" />
              <a
                href="mailto:kodefoundryatelier@gmail.com"
                className="text-brand-600 hover:text-brand-700 font-medium"
              >
                kodefoundryatelier@gmail.com
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-brand-900 via-brand-800 to-purple-900">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-6">
              Ready to Stop Losing Leads?
            </h2>
            <p className="text-lg text-blue-100/80 max-w-2xl mx-auto mb-10 leading-relaxed">
              Agents across Dubai and the UAE use Aisha to qualify leads and close more
              deals. Start your free trial and see how she handles your next inquiry.
            </p>
            <Link
              to="/signup"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-bold text-brand-700 shadow-xl shadow-brand-900/30 hover:shadow-2xl hover:shadow-brand-900/40 transition-all hover:-translate-y-0.5"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
