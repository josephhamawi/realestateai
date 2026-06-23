import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Bot, ArrowLeft, Mail, Shield, Lock, Database, Globe2 } from "lucide-react";

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
          : "bg-white border-b border-gray-100"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between lg:h-20">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">
              AgentFlow AI
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
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
/*  Section component                                                  */
/* ------------------------------------------------------------------ */
function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal>
      <section id={id} className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
        <div className="text-gray-600 leading-relaxed space-y-4">
          {children}
        </div>
      </section>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */
function Footer() {
  return (
    <footer className="bg-gray-900 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">AgentFlow AI</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              to="/terms"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              to="/about"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 text-center">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} AgentFlow AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Privacy Policy Page                                                */
/* ------------------------------------------------------------------ */
export function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <StickyNav />

      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-purple-900 pt-32 pb-16 lg:pt-40 lg:pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-4 text-blue-100/80 text-lg">
            Last updated: April 9, 2026
          </p>
        </div>
      </div>

      {/* Highlights */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 -mt-8">
        <Reveal>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Shield, label: "PDPL Compliant", desc: "UAE Data Protection" },
              { icon: Lock, label: "Encrypted", desc: "At rest and in transit" },
              { icon: Database, label: "Tenant Isolated", desc: "Your data stays yours" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl bg-white border border-gray-200 shadow-lg p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                  <item.icon className="h-5 w-5 text-brand-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <Section id="introduction" title="1. Introduction">
          <p>
            AgentFlow AI ("the Service"), operated by Kode Foundry Atelier ("we," "us," or
            "our"), is committed to protecting your privacy and the privacy of your leads.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your
            information when you use our AI-powered real estate lead qualification platform.
          </p>
          <p>
            This policy applies to real estate agents and brokers who use AgentFlow AI, as
            well as the leads whose information is processed through the platform. By using
            the Service, you agree to the terms of this Privacy Policy.
          </p>
        </Section>

        <Section id="information-collected" title="2. Information We Collect">
          <h3 className="text-lg font-semibold text-gray-900 mt-2">Account Information</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Full name and professional credentials</li>
            <li>Email address and phone number</li>
            <li>Real estate license number</li>
            <li>Brokerage or agency name</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 mt-6">Lead Data</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Lead contact information (name, phone, email)</li>
            <li>Property preferences (type, location, budget range)</li>
            <li>Conversation history between leads and AI assistants</li>
            <li>Lead qualification scores and status</li>
            <li>Appointment and viewing schedules</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 mt-6">Usage Data</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Platform analytics (features used, session duration, pages visited)</li>
            <li>AI tokens consumed and messages sent</li>
            <li>Device information, browser type, and IP address</li>
            <li>Performance metrics and error logs</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 mt-6">Payment Information</h3>
          <p>
            Payment processing is handled by Stripe. We do not store your credit card
            numbers, bank account details, or other
            sensitive financial information on our servers. Payment processors handle all
            financial data in compliance with PCI-DSS standards.
          </p>
        </Section>

        <Section id="how-we-use" title="3. How We Use Your Information">
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Provide and improve the Service:</strong> Deliver AI-powered lead
              qualification, manage your account, and enhance platform features
            </li>
            <li>
              <strong>AI conversation processing:</strong> Process lead conversations through
              third-party AI providers to generate contextual, market-specific responses
            </li>
            <li>
              <strong>Appointment booking and calendar sync:</strong> Integrate with Google
              Calendar and Outlook Calendar to schedule property viewings and meetings
            </li>
            <li>
              <strong>Billing and subscription management:</strong> Process payments, manage
              subscriptions, and send billing-related communications
            </li>
            <li>
              <strong>Compliance with legal obligations:</strong> Meet regulatory requirements
              under the UAE Personal Data Protection Law (PDPL) and RERA, maintain audit
              trails, and respond to lawful requests from authorities
            </li>
            <li>
              <strong>Communication:</strong> Send service updates, security alerts, and
              administrative messages
            </li>
          </ul>
        </Section>

        <Section id="data-storage" title="4. Data Storage and Security">
          <p>
            <strong>Infrastructure:</strong> Your data is stored on Google Cloud Platform
            using Firebase and Firestore services. Our infrastructure is designed for high
            availability, reliability, and security.
          </p>
          <p>
            <strong>Encryption:</strong> All data is encrypted at rest using AES-256
            encryption and in transit using TLS 1.2 or higher. API communications between
            the Service and third-party integrations are secured with industry-standard
            encryption protocols.
          </p>
          <p>
            <strong>Tenant Isolation:</strong> Your data is logically separated from other
            users' data. Each agent's account operates in its own isolated environment,
            ensuring that your lead data, conversation history, and business information
            are never accessible to other users of the platform.
          </p>
          <p>
            <strong>Access Controls:</strong> We employ strict access controls,
            multi-factor authentication for administrative access, and regular security
            audits to protect your data.
          </p>
        </Section>

        <Section id="third-party" title="5. Third-Party Services">
          <p>
            We share data with the following third-party services as necessary to operate
            the platform:
          </p>
          <div className="mt-4 space-y-3">
            {[
              {
                name: "Vynn AI",
                purpose: "AI conversation processing and natural language understanding",
              },
              {
                name: "Telegram Bot API",
                purpose: "Messaging delivery and receipt for Telegram-based lead conversations",
              },
              {
                name: "WhatsApp Business API",
                purpose: "Messaging delivery and receipt for WhatsApp-based lead conversations",
              },
              {
                name: "Stripe",
                purpose: "Payment processing for subscriptions (AED)",
              },
              {
                name: "Google Calendar / Outlook Calendar",
                purpose: "Appointment scheduling and calendar synchronization",
              },
            ].map((service, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg bg-gray-50 border border-gray-100 p-4"
              >
                <Globe2 className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{service.name}</p>
                  <p className="text-sm text-gray-500">{service.purpose}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4">
            Each third-party service operates under its own privacy policy. We encourage
            you to review their policies to understand how they handle your data.
          </p>
        </Section>

        <Section id="pdpl" title="6. UAE Data Protection (PDPL)">
          <p>
            We comply with the UAE Personal Data Protection Law (Federal Decree-Law No. 45 of
            2021) and applicable UAE data protection requirements. This includes:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Explicit consent:</strong> We obtain explicit consent before collecting
              and processing your personal data and the personal data of your leads
            </li>
            <li>
              <strong>Right to access:</strong> You may request a copy of all personal data
              we hold about you at any time
            </li>
            <li>
              <strong>Right to deletion:</strong> You may request deletion of your personal
              data. We will process deletion requests within 30 days
            </li>
            <li>
              <strong>Breach notification:</strong> In the event of a data breach affecting
              your personal data, we will notify the relevant UAE authority and affected
              users without undue delay
            </li>
            <li>
              <strong>Data Protection Officer:</strong> Questions regarding PDPL compliance
              may be directed to our contact email
            </li>
          </ul>
        </Section>

        <Section id="rera" title="7. Dubai Data Protection (RERA/DIFC)">
          <p>
            For users operating in the Dubai market, we comply with the Real Estate
            Regulatory Agency (RERA) requirements and relevant DIFC Data Protection
            regulations:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>RERA compliance:</strong> All real estate communications generated
              through the platform comply with RERA guidelines for property marketing and
              client communications
            </li>
            <li>
              <strong>5-year audit trail retention:</strong> We retain communication logs and
              transaction records for a minimum of 5 years as required by RERA for real
              estate audit trails
            </li>
            <li>
              <strong>No misleading property information:</strong> Our AI assistants are
              configured to avoid generating misleading or inaccurate property information
              in compliance with RERA advertising regulations
            </li>
            <li>
              <strong>Cross-border data transfers:</strong> Where data is transferred
              outside the UAE, we ensure adequate data protection measures are in place in
              compliance with DIFC requirements
            </li>
          </ul>
        </Section>

        <Section id="retention" title="8. Data Retention">
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Active accounts:</strong> Your data is retained for as long as your
              subscription is active and your account is in good standing
            </li>
            <li>
              <strong>Account closure:</strong> Upon account closure or deletion
              request, your data will be permanently deleted within 30 days, except where
              retention is required by law
            </li>
            <li>
              <strong>Communication logs (Dubai):</strong> Communication logs and transaction
              records are retained for a minimum of 5 years in compliance with RERA audit
              trail requirements, even after account closure
            </li>
            <li>
              <strong>Anonymized data:</strong> We may retain anonymized, aggregated data
              that cannot be used to identify you for analytical and service improvement
              purposes
            </li>
          </ul>
        </Section>

        <Section id="your-rights" title="9. Your Rights">
          <p>
            You have the following rights regarding your personal data:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Access:</strong> Request a copy of your personal data held by us
            </li>
            <li>
              <strong>Correction:</strong> Request correction of inaccurate or incomplete
              personal data
            </li>
            <li>
              <strong>Deletion:</strong> Request deletion of your personal data (subject to
              regulatory retention requirements)
            </li>
            <li>
              <strong>Portability:</strong> Request your data in a commonly used,
              machine-readable format
            </li>
            <li>
              <strong>Objection:</strong> Object to the processing of your personal data in
              certain circumstances
            </li>
            <li>
              <strong>Withdrawal of consent:</strong> Withdraw your consent to data
              processing at any time, without affecting the lawfulness of processing based on
              consent prior to withdrawal
            </li>
          </ul>
          <p>
            To exercise any of these rights, please contact us at the email address provided
            below. We will respond to your request within 30 days.
          </p>
        </Section>

        <Section id="children" title="10. Children's Privacy">
          <p>
            AgentFlow AI is not intended for use by individuals under the age of 18. We do
            not knowingly collect personal information from children under 18. If we become
            aware that we have collected data from a child under 18, we will take steps to
            delete that information as quickly as possible.
          </p>
        </Section>

        <Section id="changes" title="11. Changes to This Privacy Policy">
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our
            practices, technology, legal requirements, or other factors. When we make
            material changes, we will notify you via email or through a prominent notice on
            the Service at least 30 days before the changes take effect.
          </p>
          <p>
            We encourage you to review this Privacy Policy periodically to stay informed
            about how we protect your data.
          </p>
        </Section>

        <Section id="contact" title="12. Contact Us">
          <p>
            If you have questions about this Privacy Policy, your data rights, or our data
            protection practices, please contact us:
          </p>
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-200 p-4">
            <Mail className="h-5 w-5 text-brand-600" />
            <a
              href="mailto:kodefoundryatelier@gmail.com"
              className="text-brand-600 hover:text-brand-700 font-medium"
            >
              kodefoundryatelier@gmail.com
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Operated by Kode Foundry Atelier. Serving real estate agents in Dubai and across
            the UAE.
          </p>
        </Section>
      </div>

      <Footer />
    </div>
  );
}
