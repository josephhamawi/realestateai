/**
 * Who operates this instance.
 *
 * The public pages (landing, about, contact, terms, privacy) are templates.
 * Set these in .env.local so they name your own business instead of a
 * placeholder, and review the legal pages with your own counsel before you
 * publish them: they are a starting point, not legal advice.
 */
export const BRAND = {
  /** Product name shown in the UI. */
  appName: import.meta.env.VITE_APP_NAME || "RealEstateAI",
  /** Legal entity or person operating this deployment. */
  operator: import.meta.env.VITE_OPERATOR_NAME || "the operator of this instance",
  /** Contact address published on the site. */
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL || "you@example.com",
  /** Public website, used in links and metadata. */
  website: import.meta.env.VITE_PUBLIC_URL || "",
  /** Link to the source code, shown in the footer. */
  repoUrl:
    import.meta.env.VITE_REPO_URL || "https://github.com/josephhamawi/realestateai",
} as const;
