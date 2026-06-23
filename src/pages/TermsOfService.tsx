import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { LogoMark } from "../components/brand/LogoMark";
import { SiteFooter } from "../components/layout/SiteFooter";

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
              <LogoMark className="h-5 w-5" white />
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
/*  Terms of Service Page                                              */
/* ------------------------------------------------------------------ */
export function TermsOfService() {
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
            Terms of Service
          </h1>
          <p className="mt-4 text-blue-100/80 text-lg">
            Last updated: April 9, 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <Section id="acceptance" title="1. Acceptance of Terms">
          <p>
            By accessing or using AgentFlow AI ("the Service"), you agree to be bound by
            these Terms of Service ("Terms"). If you do not agree to these Terms, you may
            not access or use the Service. These Terms constitute a legally binding agreement
            between you and AgentFlow AI, operated by Kode Foundry Atelier.
          </p>
          <p>
            By creating an account, subscribing to a plan, or otherwise using the platform,
            you confirm that you have read, understood, and agree to be bound by these Terms
            and our Privacy Policy.
          </p>
        </Section>

        <Section id="description" title="2. Description of Service">
          <p>
            AgentFlow AI provides AI-powered lead qualification for real estate agents via
            Telegram and WhatsApp. The platform uses culturally aware AI assistants to
            engage, qualify, and manage real estate leads in the Dubai and UAE market.
          </p>
          <p>Key features of the Service include:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Automated lead qualification through messaging platforms</li>
            <li>AI-powered conversation management with market-specific knowledge</li>
            <li>Lead scoring and prioritization</li>
            <li>Appointment booking and calendar integration</li>
            <li>Compliance tools for UAE PDPL and RERA regulations</li>
            <li>Analytics and reporting dashboards</li>
          </ul>
        </Section>

        <Section id="registration" title="3. Account Registration">
          <p>To use the Service, you must:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Be at least 18 years of age</li>
            <li>Provide accurate, current, and complete information during registration</li>
            <li>Maintain and promptly update your account information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Only create one account per person</li>
          </ul>
          <p>
            You are responsible for all activities that occur under your account. You must
            notify us immediately of any unauthorized use of your account or any other
            breach of security.
          </p>
        </Section>

        <Section id="payments" title="4. Subscription and Payments">
          <p>
            AgentFlow AI offers subscription-based pricing. Payments are processed through
            Stripe in UAE Dirhams (AED). Prices are displayed and charged in AED.
          </p>
          <p>
            <strong>Billing Cycles:</strong> Subscriptions are billed on a monthly or annual
            basis, depending on the plan you select. Your subscription will automatically
            renew at the end of each billing cycle unless you cancel before the renewal
            date.
          </p>
          <p>
            <strong>Cancellation Policy:</strong> You may cancel your subscription at any
            time through your account settings. Upon cancellation, you will retain access to
            the Service until the end of your current billing period. No refunds will be
            issued for partial billing periods.
          </p>
          <p>
            <strong>Usage Limits:</strong> Each plan includes specific AI token and message
            limits. If you exceed your plan's limits, additional usage may be billed at
            overage rates or access may be restricted until your next billing cycle.
          </p>
        </Section>

        <Section id="acceptable-use" title="5. Acceptable Use">
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Send spam, unsolicited messages, or bulk commercial communications through the
              Service
            </li>
            <li>
              Engage in fraud, misrepresentation, or deceptive practices of any kind
            </li>
            <li>
              Misuse the AI capabilities of the platform, including attempting to generate
              harmful, misleading, or illegal content
            </li>
            <li>
              Violate any applicable local, national, or international laws or regulations
            </li>
            <li>
              Fail to comply with local real estate regulations, including but not limited
              to RERA licensing requirements in Dubai and the UAE
            </li>
            <li>
              Attempt to reverse engineer, decompile, or extract source code from the
              Service
            </li>
            <li>
              Share your account credentials with others or allow unauthorized access to
              your account
            </li>
            <li>
              Use the Service to harass, abuse, or harm other individuals
            </li>
          </ul>
        </Section>

        <Section id="ai-content" title="6. AI-Generated Content">
          <p>
            AgentFlow AI uses artificial intelligence to generate responses and assist in
            lead qualification. You acknowledge and agree that:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              AI-generated responses are assistive in nature and do not constitute legal,
              financial, investment, or professional advice
            </li>
            <li>
              You, as the real estate agent, are solely responsible for verifying the
              accuracy of all information provided by the AI to your leads
            </li>
            <li>
              AI responses may occasionally contain errors or inaccuracies, and you should
              review AI conversations regularly
            </li>
            <li>
              You retain the ability to take over any AI conversation at any time and should
              do so when professional judgment is required
            </li>
            <li>
              AgentFlow AI is not liable for any decisions made based on AI-generated content
            </li>
          </ul>
        </Section>

        <Section id="data-privacy" title="7. Data and Privacy">
          <p>
            Your use of the Service is also governed by our{" "}
            <Link to="/privacy" className="text-brand-600 hover:text-brand-700 font-medium">
              Privacy Policy
            </Link>
            , which describes how we collect, use, and protect your personal information and
            the data of your leads.
          </p>
          <p>
            By using the Service, you represent and warrant that you have obtained all
            necessary consents from your leads for data collection and processing as
            required by applicable data protection laws, including the UAE Personal Data
            Protection Law (PDPL) and the Dubai International Financial Centre (DIFC) Data
            Protection Law.
          </p>
        </Section>

        <Section id="ip" title="8. Intellectual Property">
          <p>
            <strong>Platform Ownership:</strong> AgentFlow AI, including its software, AI
            models, design, branding, and all related intellectual property, is owned by
            Kode Foundry Atelier. You are granted a limited, non-exclusive, non-transferable
            license to use the Service for the duration of your subscription.
          </p>
          <p>
            <strong>Your Data:</strong> You retain full ownership of all data you input into
            the Service, including lead information, property listings, conversation content,
            and any other content you provide. We do not claim ownership over your data.
          </p>
          <p>
            You grant AgentFlow AI a limited license to process your data solely for the
            purpose of providing and improving the Service.
          </p>
        </Section>

        <Section id="liability" title="9. Limitation of Liability">
          <p>
            To the maximum extent permitted by applicable law, AgentFlow AI and Kode Foundry
            Atelier shall not be liable for any indirect, incidental, special, consequential,
            or punitive damages, including but not limited to loss of profits, data, business
            opportunities, or goodwill, arising out of or related to your use of the Service.
          </p>
          <p>
            Our total aggregate liability for all claims arising out of or related to these
            Terms or the Service shall not exceed the total amount you paid to us in the
            twelve (12) months preceding the event giving rise to the claim.
          </p>
          <p>
            AgentFlow AI does not guarantee uninterrupted, error-free, or secure access to
            the Service. We are not responsible for any loss or damage resulting from service
            outages, data loss, or unauthorized access to your account.
          </p>
        </Section>

        <Section id="termination" title="10. Termination">
          <p>
            We reserve the right to suspend or terminate your account, without prior notice,
            if we reasonably believe that:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>You have violated these Terms</li>
            <li>You have engaged in fraudulent or illegal activity</li>
            <li>Your use of the Service poses a risk to other users or our systems</li>
            <li>You have not paid your subscription fees within the applicable grace period</li>
          </ul>
          <p>
            Upon termination, your access to the Service will be immediately revoked. You
            may request a copy of your data within 30 days of termination, after which your
            data may be permanently deleted (subject to regulatory retention requirements).
          </p>
        </Section>

        <Section id="governing-law" title="11. Governing Law">
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the
            Emirate of Dubai and the United Arab Emirates. Any disputes shall be subject to
            the exclusive jurisdiction of the courts of Dubai, UAE.
          </p>
        </Section>

        <Section id="changes" title="12. Changes to Terms">
          <p>
            We may update these Terms from time to time. When we make material changes, we
            will notify you via email or through the Service at least 30 days before the
            changes take effect. Your continued use of the Service after the effective date
            of the updated Terms constitutes your acceptance of the changes.
          </p>
          <p>
            Review these Terms periodically to stay informed about your rights and
            obligations.
          </p>
        </Section>

        <Section id="contact" title="13. Contact Us">
          <p>
            If you have any questions about these Terms of Service, please contact us:
          </p>
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-200 p-4">
            <Mail className="h-5 w-5 text-brand-600" />
            <a
              href="mailto:hello@kodefoundry.com"
              className="text-brand-600 hover:text-brand-700 font-medium"
            >
              hello@kodefoundry.com
            </a>
          </div>
        </Section>
      </div>

      <SiteFooter />
    </div>
  );
}
