import React from "react";
import { Link } from "react-router-dom";
import { LogoMark } from "../brand/LogoMark";

/* ------------------------------------------------------------------ */
/*  Standard KodeFoundry brand footer for public pages                 */
/* ------------------------------------------------------------------ */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white px-6 pt-10 pb-8 mt-8">
      <div className="mx-auto max-w-7xl">
        {/* Row 1 */}
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          {/* Brand block */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-brand-600">
                <LogoMark className="h-4 w-4" white />
              </div>
              <span className="text-base font-extrabold text-gray-900">AgentFlow AI</span>
            </div>
            <p className="mt-2 text-[13px] text-gray-500">
              AI lead qualification for Dubai real estate. Made by{" "}
              <a
                href="https://kodefoundry.com"
                target="_blank"
                rel="noopener"
                className="text-brand-600 hover:underline"
              >
                KodeFoundry
              </a>
              .
            </p>
          </div>

          {/* Nav */}
          <nav className="flex flex-wrap items-center gap-6">
            <Link
              to="/privacy"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Terms
            </Link>
            <Link
              to="/about"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Contact
            </Link>
            <a
              href="mailto:hello@kodefoundry.com"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Support
            </a>
          </nav>
        </div>

        {/* Row 2 */}
        <div className="border-t border-gray-200 pt-5 mt-2 flex flex-wrap items-center justify-between gap-3 text-[13px] text-gray-500">
          <span>&copy; {year} KodeFoundry. All rights reserved.</span>
          <a href="mailto:hello@kodefoundry.com" className="hover:underline">
            hello@kodefoundry.com
          </a>
        </div>
      </div>
    </footer>
  );
}
