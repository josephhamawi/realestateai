# AgentFlow AI - UX Design Specification

**Author:** joseph
**Date:** 2026-04-07
**Status:** Implementation-Ready
**Tech Stack:** React 18 + TypeScript + Tailwind CSS (utility classes only, no external UI library)
**Icons:** Lucide React
**Calendar UI:** react-big-calendar
**Charts:** Recharts

---

## Table of Contents

1. [Design System Foundation](#1-design-system-foundation)
2. [Page Layouts & Routes](#2-page-layouts--routes)
3. [Key Component Specifications](#3-key-component-specifications)
4. [Market-Aware UI Patterns](#4-market-aware-ui-patterns)
5. [Responsive Design](#5-responsive-design)
6. [Interaction Patterns](#6-interaction-patterns)

---

## 1. Design System Foundation

### 1.1 Color Palette

AgentFlow AI uses a professional, trust-oriented palette anchored in blue-gray with market-specific accent colors. All colors are mapped to Tailwind's `extend.colors` in `tailwind.config.ts`.

```typescript
// tailwind.config.ts
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // --- Primary Brand ---
        brand: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",   // Primary action blue
          600: "#2563eb",   // Hover
          700: "#1d4ed8",   // Active / pressed
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },

        // --- Neutral (UI surfaces, text, borders) ---
        surface: {
          0:   "#ffffff",
          50:  "#f8fafc",   // Page background
          100: "#f1f5f9",   // Card background, table stripe
          200: "#e2e8f0",   // Borders, dividers
          300: "#cbd5e1",   // Disabled states
          400: "#94a3b8",   // Placeholder text
          500: "#64748b",   // Secondary text
          600: "#475569",   // Body text
          700: "#334155",   // Headings
          800: "#1e293b",   // Primary text
          900: "#0f172a",   // Sidebar background
        },

        // --- Market Accents ---
        nigeria: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",   // Nigeria primary green
          600: "#16a34a",   // Nigeria hover green
          700: "#15803d",
        },
        dubai: {
          50:  "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",   // Dubai primary gold
          600: "#d97706",   // Dubai hover gold
          700: "#b45309",
        },

        // --- Semantic ---
        success: {
          50:  "#f0fdf4",
          500: "#22c55e",
          700: "#15803d",
        },
        warning: {
          50:  "#fffbeb",
          500: "#f59e0b",
          700: "#b45309",
        },
        danger: {
          50:  "#fef2f2",
          500: "#ef4444",
          700: "#b91c1c",
        },
        info: {
          50:  "#eff6ff",
          500: "#3b82f6",
          700: "#1d4ed8",
        },

        // --- Lead Urgency ---
        hot:  "#ef4444",   // red-500
        warm: "#f59e0b",   // amber-500
        cold: "#6b7280",   // gray-500
      },
    },
  },
  plugins: [],
};
```

**Usage Conventions:**

| Purpose | Light Theme Class | Dark-mode Ready |
|---------|------------------|-----------------|
| Page background | `bg-surface-50` | `dark:bg-surface-900` |
| Card background | `bg-surface-0` | `dark:bg-surface-800` |
| Primary text | `text-surface-800` | `dark:text-surface-100` |
| Secondary text | `text-surface-500` | `dark:text-surface-400` |
| Borders | `border-surface-200` | `dark:border-surface-700` |
| Primary button | `bg-brand-500 hover:bg-brand-600 text-white` | Same |
| Nigeria accent | `bg-nigeria-500 text-white` | Same |
| Dubai accent | `bg-dubai-500 text-white` | Same |

### 1.2 Typography Scale

Uses Tailwind's default type scale with Inter as the primary font. Falls back to system fonts.

```css
/* src/styles/tailwind.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply font-sans text-surface-800 antialiased;
  }
}
```

```typescript
// tailwind.config.ts (extend)
fontFamily: {
  sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont',
         'Segoe UI', 'Roboto', 'sans-serif'],
  mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
},
```

**Type Scale:**

| Token | Tailwind Class | Size | Weight | Usage |
|-------|---------------|------|--------|-------|
| Display | `text-3xl font-bold` | 30px | 700 | Page titles (Dashboard, Leads) |
| Heading 1 | `text-2xl font-semibold` | 24px | 600 | Section headers |
| Heading 2 | `text-xl font-semibold` | 20px | 600 | Card titles, modal headers |
| Heading 3 | `text-lg font-medium` | 18px | 500 | Sub-section labels |
| Body | `text-sm font-normal` | 14px | 400 | Default body text, table cells |
| Body Large | `text-base font-normal` | 16px | 400 | Form labels, prominent body |
| Caption | `text-xs font-normal` | 12px | 400 | Timestamps, helper text, badges |
| Overline | `text-xs font-medium uppercase tracking-wider` | 12px | 500 | Section labels, column headers |

### 1.3 Spacing & Layout Grid

**Spacing Scale:** Uses Tailwind's default 4px grid. Key spacing values:

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Icon-to-text gap |
| `space-2` | 8px | Tight padding (badges, chips) |
| `space-3` | 12px | Inline element spacing |
| `space-4` | 16px | Default card padding, input padding |
| `space-5` | 20px | Section gaps |
| `space-6` | 24px | Card-to-card gap, section padding |
| `space-8` | 32px | Page section separation |
| `space-10` | 40px | Major section breaks |

**Layout Grid:**

- Sidebar width: `w-64` (256px) on desktop, collapsed to `w-16` (64px) as icon-only
- Content max-width: `max-w-7xl` (1280px) centered with `mx-auto`
- Content padding: `px-4 sm:px-6 lg:px-8`
- Card grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`
- Table container: full-width with horizontal scroll on mobile `overflow-x-auto`

### 1.4 Component Tokens

#### Buttons

```
// Primary
className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium
           text-white bg-brand-500 border border-transparent rounded-lg
           hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500
           focus:ring-offset-2 transition-colors disabled:opacity-50
           disabled:cursor-not-allowed"

// Secondary
className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium
           text-surface-700 bg-surface-0 border border-surface-200 rounded-lg
           hover:bg-surface-50 focus:outline-none focus:ring-2 focus:ring-brand-500
           focus:ring-offset-2 transition-colors"

// Danger
className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium
           text-white bg-danger-500 border border-transparent rounded-lg
           hover:bg-danger-700 focus:outline-none focus:ring-2 focus:ring-danger-500
           focus:ring-offset-2 transition-colors"

// Ghost
className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium
           text-surface-600 bg-transparent rounded-lg hover:bg-surface-100
           focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"

// Icon Button (square)
className="inline-flex items-center justify-center w-9 h-9 rounded-lg
           text-surface-500 hover:bg-surface-100 hover:text-surface-700
           focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"

// Sizes
// sm: px-3 py-1.5 text-xs
// md: px-4 py-2 text-sm (default)
// lg: px-5 py-2.5 text-base
```

#### Text Inputs

```
// Default Input
className="block w-full px-3 py-2 text-sm text-surface-800 bg-surface-0
           border border-surface-200 rounded-lg placeholder:text-surface-400
           focus:border-brand-500 focus:ring-1 focus:ring-brand-500
           focus:outline-none transition-colors
           disabled:bg-surface-100 disabled:text-surface-400
           disabled:cursor-not-allowed"

// Input with error
className="... border-danger-500 focus:border-danger-500 focus:ring-danger-500"

// Input Label
className="block text-sm font-medium text-surface-700 mb-1.5"

// Helper Text
className="mt-1.5 text-xs text-surface-500"

// Error Text
className="mt-1.5 text-xs text-danger-500"

// Select
className="block w-full px-3 py-2 text-sm text-surface-800 bg-surface-0
           border border-surface-200 rounded-lg
           focus:border-brand-500 focus:ring-1 focus:ring-brand-500
           focus:outline-none appearance-none cursor-pointer"
```

#### Cards

```
// Default Card
className="bg-surface-0 border border-surface-200 rounded-xl p-6
           shadow-sm"

// Interactive Card (clickable)
className="bg-surface-0 border border-surface-200 rounded-xl p-6
           shadow-sm hover:shadow-md hover:border-surface-300
           transition-all cursor-pointer"

// Metric Card (dashboard widget)
className="bg-surface-0 border border-surface-200 rounded-xl p-5
           shadow-sm"

// Card Header
className="flex items-center justify-between pb-4 border-b border-surface-200"

// Card Title
className="text-lg font-semibold text-surface-800"
```

#### Badges

```
// Status badges
// new
className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs
           font-medium bg-info-50 text-info-700"
// contacted
className="... bg-brand-50 text-brand-700"
// qualified
className="... bg-success-50 text-success-700"
// appointment_set
className="... bg-purple-50 text-purple-700"
// closed
className="... bg-surface-100 text-surface-600"
// dead
className="... bg-danger-50 text-danger-700"

// Urgency badges
// hot
className="inline-flex items-center px-2 py-0.5 rounded-full text-xs
           font-semibold bg-red-100 text-red-700"
// warm
className="... bg-amber-100 text-amber-700"
// cold
className="... bg-gray-100 text-gray-600"

// Market badge
// Nigeria
className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
           font-medium bg-nigeria-100 text-nigeria-700"
// Dubai
className="... bg-dubai-100 text-dubai-700"
```

#### Tables

```
// Table Container
className="overflow-x-auto rounded-xl border border-surface-200"

// Table
className="min-w-full divide-y divide-surface-200"

// Table Header Row
className="bg-surface-50"

// Table Header Cell
className="px-4 py-3 text-left text-xs font-medium text-surface-500
           uppercase tracking-wider"

// Table Body
className="bg-surface-0 divide-y divide-surface-100"

// Table Row
className="hover:bg-surface-50 transition-colors cursor-pointer"

// Table Cell
className="px-4 py-3 text-sm text-surface-700 whitespace-nowrap"

// Sortable Header (adds chevron icon and pointer cursor)
className="... cursor-pointer hover:text-surface-800 group"
```

#### Modals

```
// Overlay
className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm
           flex items-center justify-center p-4"

// Modal Panel
className="bg-surface-0 rounded-2xl shadow-xl w-full max-w-lg
           max-h-[90vh] overflow-y-auto"

// Modal Header
className="flex items-center justify-between px-6 py-4
           border-b border-surface-200"

// Modal Body
className="px-6 py-4"

// Modal Footer
className="flex items-center justify-end gap-3 px-6 py-4
           border-t border-surface-200"
```

#### Toast Notifications

```
// Toast Container (fixed position)
className="fixed top-4 right-4 z-[60] flex flex-col gap-2 w-80"

// Toast Item
className="bg-surface-0 border border-surface-200 rounded-lg shadow-lg
           p-4 flex items-start gap-3 animate-slide-in-right"

// Toast variants via left border:
// Success: border-l-4 border-l-success-500
// Warning: border-l-4 border-l-warning-500
// Error:   border-l-4 border-l-danger-500
// Info:    border-l-4 border-l-brand-500
```

### 1.5 Shadows & Borders

```
// Elevation
shadow-sm   -> Cards, dropdowns at rest
shadow-md   -> Card hover, active dropdowns
shadow-lg   -> Modals, popovers
shadow-xl   -> Toast notifications

// Radius
rounded-lg  -> Buttons, inputs, badges
rounded-xl  -> Cards, containers
rounded-2xl -> Modals
rounded-full -> Avatar, circular badges, pill badges
```

### 1.6 Animation Tokens

```typescript
// tailwind.config.ts extend
keyframes: {
  'slide-in-right': {
    '0%':   { transform: 'translateX(100%)', opacity: '0' },
    '100%': { transform: 'translateX(0)',    opacity: '1' },
  },
  'fade-in': {
    '0%':   { opacity: '0' },
    '100%': { opacity: '1' },
  },
  'pulse-dot': {
    '0%, 100%': { opacity: '1' },
    '50%':      { opacity: '0.5' },
  },
},
animation: {
  'slide-in-right': 'slide-in-right 0.3s ease-out',
  'fade-in':        'fade-in 0.2s ease-out',
  'pulse-dot':      'pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
},
```

---

## 2. Page Layouts & Routes

### 2.1 `/login` -- Login Page

**Purpose:** Authenticated entry point for existing agents.

**Layout:** Centered card on brand-tinted background. No sidebar or header.

```
+------------------------------------------------------------------+
|                    bg-surface-50 full viewport                     |
|                                                                    |
|                  +----------------------------+                    |
|                  |  AgentFlow AI Logo (SVG)   |                    |
|                  |  "Welcome back"  text-2xl   |                    |
|                  |                              |                    |
|                  |  [Email Input             ] |                    |
|                  |  [Password Input          ] |                    |
|                  |                              |                    |
|                  |  [    Sign In (Primary)   ] |                    |
|                  |                              |                    |
|                  |  "Forgot password?" link     |                    |
|                  |                              |                    |
|                  |  -------- or --------       |                    |
|                  |                              |                    |
|                  |  [  Continue with Google  ] |                    |
|                  |                              |                    |
|                  |  "Don't have an account?     |                    |
|                  |   Sign up" link              |                    |
|                  +----------------------------+                    |
|                    max-w-sm mx-auto              |                  |
|                                                                    |
+------------------------------------------------------------------+
```

**Tailwind Structure:**

```
<div class="min-h-screen bg-surface-50 flex items-center justify-center px-4">
  <div class="w-full max-w-sm">
    <!-- Logo -->
    <div class="text-center mb-8">
      <img ... class="h-10 mx-auto mb-4" />
      <h1 class="text-2xl font-bold text-surface-800">Welcome back</h1>
      <p class="mt-1 text-sm text-surface-500">Sign in to your AgentFlow AI account</p>
    </div>
    <!-- Form Card -->
    <div class="bg-surface-0 border border-surface-200 rounded-2xl p-6 shadow-sm">
      <!-- Email input -->
      <!-- Password input -->
      <!-- Sign In button (full width) -->
      <!-- Forgot password link -->
      <!-- Divider -->
      <!-- Google OAuth button -->
    </div>
    <!-- Signup link -->
    <p class="mt-6 text-center text-sm text-surface-500">
      Don't have an account? <a href="/signup" class="text-brand-500 hover:text-brand-600 font-medium">Sign up</a>
    </p>
  </div>
</div>
```

**States:**
- Loading: Button shows spinner, inputs disabled
- Error: Red text below relevant input, card border turns `border-danger-500` subtly
- Success: Redirect to `/dashboard` or `/onboarding/profile` if profile incomplete

---

### 2.2 `/signup` -- Signup with Market Selection

**Purpose:** New agent registration with mandatory market selection.

**Layout:** Same centered card format as login, but wider to accommodate market selector.

```
+------------------------------------------------------------------+
|                    bg-surface-50 full viewport                     |
|                                                                    |
|                  +--------------------------------+                |
|                  |  AgentFlow AI Logo             |                |
|                  |  "Create your account" text-2xl |                |
|                  |                                  |                |
|                  |  "Select your market"            |                |
|                  |  +------------+ +------------+  |                |
|                  |  | [NG flag]  | | [AE flag]  |  |                |
|                  |  | Nigeria    | | Dubai      |  |                |
|                  |  | ₦ NGN      | | AED        |  |                |
|                  |  +--selected--+ +------------+  |                |
|                  |                                  |                |
|                  |  [Email Input                 ] |                |
|                  |  [Password Input              ] |                |
|                  |  [Confirm Password            ] |                |
|                  |                                  |                |
|                  |  [  Create Account (Primary)  ] |                |
|                  |                                  |                |
|                  |  "Already have an account?       |                |
|                  |   Sign in" link                  |                |
|                  +--------------------------------+                |
|                    max-w-md mx-auto                                 |
|                                                                    |
+------------------------------------------------------------------+
```

**Market Selector Behavior:**
- Two selectable cards side by side (`grid grid-cols-2 gap-3`)
- Unselected: `border border-surface-200 bg-surface-0 rounded-xl p-4 cursor-pointer hover:border-surface-300`
- Selected (Nigeria): `border-2 border-nigeria-500 bg-nigeria-50 rounded-xl p-4 ring-2 ring-nigeria-500/20`
- Selected (Dubai): `border-2 border-dubai-500 bg-dubai-50 rounded-xl p-4 ring-2 ring-dubai-500/20`
- Each card shows: flag emoji/icon, market name, currency symbol
- Market must be selected before form submission (validation error otherwise)

**Password Requirements:** Minimum 8 characters. Real-time validation indicator below input.

---

### 2.3 `/onboarding` -- Profile Setup Wizard

**Purpose:** 3-step onboarding after signup: Profile, AI Config, Integrations.

**Layout:** Full-screen wizard with step indicator. No sidebar. Centered card.

```
+------------------------------------------------------------------+
|  [AgentFlow Logo]                           [Step 1 of 3]         |
|------------------------------------------------------------------+
|                                                                    |
|    Step Indicator (horizontal dots/progress bar)                   |
|    ( (1) Profile ) ---- ( (2) AI Config ) ---- ( (3) Connect )    |
|      active               upcoming                upcoming         |
|                                                                    |
|  +------------------------------------------------------------+   |
|  |                                                              |   |
|  |  STEP 1: Complete Your Profile                               |   |
|  |                                                              |   |
|  |  [Full Name                    ]                             |   |
|  |  [Phone Number  (+234...)      ]  <- market prefix shown     |   |
|  |  [License Number               ]  <- "RERA License" or       |   |
|  |                                      "State License"          |   |
|  |  [Brokerage Name (optional)    ]                             |   |
|  |  [Preferred Language  v]                                      |   |
|  |                                                              |   |
|  +------------------------------------------------------------+   |
|                                                                    |
|         [  Back  ]                    [  Continue  ->]             |
+------------------------------------------------------------------+
```

**Step Indicator Classes:**

```
// Active step circle
className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center
           justify-center text-sm font-semibold"

// Completed step circle
className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center
           justify-center" // with checkmark icon

// Upcoming step circle
className="w-8 h-8 rounded-full bg-surface-200 text-surface-500 flex items-center
           justify-center text-sm font-semibold"

// Connector line (active)
className="flex-1 h-0.5 bg-brand-500"

// Connector line (upcoming)
className="flex-1 h-0.5 bg-surface-200"
```

**Step 1 -- Profile Setup:**
- Full name (required)
- Phone with market prefix pre-filled (+234 for Nigeria, +971 for Dubai) and E.164 validation
- License number (label adapts: "RERA License Number" for Dubai, "State License Number" for Nigeria)
- Brokerage name (optional)
- Preferred language dropdown (Nigeria: English, Nigerian English; Dubai: English, Arabic)

**Step 2 -- AI Configuration:**
- Persona name (pre-filled: "Chioma" for Nigeria, "Aisha" for Dubai; editable)
- Custom greeting script (textarea, optional)
- Handoff threshold slider (0-100, default 60) with labels: "Conservative (80+)" / "Balanced (60)" / "Aggressive (40)"
- Preview box showing how the greeting would appear in a WhatsApp-style bubble

**Step 3 -- Connect Integrations:**
- Three integration cards in a vertical stack:
  1. WhatsApp Business: Phone Number ID + WABA ID inputs, or "Connect" button
  2. Google Calendar: "Connect Google Calendar" OAuth button
  3. Payment: Auto-shown based on market (Paystack or Stripe). "Set up billing later" skip option
- Each card shows status: "Not connected" (gray), "Connected" (green checkmark)

**Navigation:**
- Back button (secondary) + Continue button (primary)
- Step 3 has "Finish Setup" instead of Continue
- Can skip steps 2 and 3 (defaults apply)
- Redirect to `/dashboard` on completion

---

### 2.4 `/dashboard` -- Main Dashboard

**Purpose:** At-a-glance overview of pipeline, recent activity, and upcoming appointments.

**Layout:** Standard AppShell (sidebar + header + content).

```
+--------+----------------------------------------------------------+
|        |  Header: "Dashboard"          [Bell icon] [User Avatar]   |
|  Side  |-----------------------------------------------------------+
|  bar   |                                                            |
|        |  Welcome, {Name}   Market: [NG badge] or [AE badge]       |
|  Nav   |                                                            |
|        |  +-- Pipeline Summary (4-col grid) -----------------------+|
|  icons |  | New: 12     | Contacted: 8 | Qualified: 5 | Appt: 3  ||
|  +     |  | [blue]      | [indigo]     | [green]      | [purple] ||
|  label |  +-------------------------------------------------------+|
|        |                                                            |
|        |  +-- Urgency Breakdown ----+ +-- Usage This Month --------+|
|        |  | Hot:  4 [red bar]       | | Leads: 67/100             ||
|        |  | Warm: 8 [amber bar]     | | WhatsApp: 234 msgs        ||
|        |  | Cold: 15 [gray bar]     | | Appointments: 8            ||
|        |  +-------------------------+ +----------------------------+|
|        |                                                            |
|        |  +-- Recent Conversations --------------------------------+|
|        |  | [Avatar] Emeka O. - "I wan see the Lekki..." 2m ago    ||
|        |  | [Avatar] Priya S. - "What is the yield..." 15m ago     ||
|        |  | [Avatar] Hassan M. - "Send me the floor..." 1h ago     ||
|        |  | [Avatar] Fatima A. - "Is there parking..." 2h ago      ||
|        |  | [Avatar] James T. - "My budget is around..." 3h ago    ||
|        |  +--------------------------------------------------------+|
|        |                                                            |
|        |  +-- Upcoming Appointments ------+ +-- Quick Actions -----+|
|        |  | Today 2:00 PM - Emeka (View)  | | [+ Add Lead]        ||
|        |  | Today 4:30 PM - Priya (Video) | | [Send Template]      ||
|        |  | Tomorrow 10 AM - Hassan (View) | | [View Calendar]     ||
|        |  +-------------------------------+ +---------------------+|
+--------+----------------------------------------------------------+
```

**Pipeline Summary Cards:**
Each card is a `MetricCard` component:
```
<div class="bg-surface-0 border border-surface-200 rounded-xl p-5 shadow-sm">
  <div class="flex items-center justify-between">
    <div>
      <p class="text-xs font-medium text-surface-500 uppercase tracking-wider">New Leads</p>
      <p class="mt-1 text-2xl font-bold text-surface-800">12</p>
    </div>
    <div class="w-10 h-10 rounded-lg bg-info-50 flex items-center justify-center">
      <UserPlus class="w-5 h-5 text-info-500" />
    </div>
  </div>
  <p class="mt-2 text-xs text-surface-500">+3 from yesterday</p>
</div>
```

**Urgency Breakdown Widget:**
Horizontal stacked bar chart or three progress bars with hot/warm/cold colors and lead counts.

**Recent Conversations Widget:**
List of 5 most recent lead activities. Each row shows: lead avatar (initials circle), name, last message truncated, time ago, urgency badge. Clicking navigates to `/leads/:id`.

**Upcoming Appointments Widget:**
Next 5 appointments. Each row shows: time, lead name, appointment type icon, status badge. Clicking navigates to `/appointments` with the date focused.

**Suspended Tenant Banner:**
If `tenant.status === "suspended"`, a persistent banner appears at the top:
```
<div class="bg-danger-50 border border-danger-200 rounded-lg px-4 py-3 flex items-center justify-between">
  <div class="flex items-center gap-2">
    <AlertTriangle class="w-5 h-5 text-danger-500" />
    <p class="text-sm font-medium text-danger-700">
      Your subscription is inactive. AI conversations are paused.
    </p>
  </div>
  <a href="/billing" class="text-sm font-medium text-danger-700 underline hover:text-danger-900">
    Update payment
  </a>
</div>
```

**Usage Warning:**
At 80% capacity: yellow warning bar. At 95%: red warning bar.

---

### 2.5 `/leads` -- Lead List Table

**Purpose:** Full lead management table with market-aware filters, search, and sorting.

**Layout:** AppShell with full-width table content area.

```
+--------+----------------------------------------------------------+
|        |  Header: "Leads"                [+ Add Lead] (Primary)    |
| Sidebar|-----------------------------------------------------------+
|        |                                                            |
|        |  +-- Filter Bar ------------------------------------------+|
|        |  | [Search by name/phone...    ]  [Status v] [Urgency v] ||
|        |  | [Source v]  [Property Type v]  [Budget Range...]       ||
|        |  | [Title Type v]*  [Off-plan v]*    (* market-specific)  ||
|        |  | [Clear Filters]                  Showing 47 leads      ||
|        |  +--------------------------------------------------------+|
|        |                                                            |
|        |  +-- Lead Table ------------------------------------------+|
|        |  | Name     | Phone  | Status | Urgency | Score | Source ||
|        |  |----------|--------|--------|---------|-------|--------||
|        |  | Emeka O. | +234.. | Qual.. | HOT     | 85    | WA    ||
|        |  | Priya S. | +971.. | Cont.. | WARM    | 62    | WA    ||
|        |  | Hassan M.| +971.. | Appt.. | HOT     | 91    | PF    ||
|        |  | Fatima A.| +234.. | New    | COLD    | 15    | Manual||
|        |  | James T. | +234.. | Dead   | COLD    | 8     | WA    ||
|        |  | ...      |        |        |         |       |       ||
|        |  +--------------------------------------------------------+|
|        |                                                            |
|        |  [< Prev]  Page 1 of 4  [Next >]     [Export CSV]         |
+--------+----------------------------------------------------------+
```

**Filter Bar:**
- Search input: `flex-1` text input with magnifying glass icon
- Multi-select dropdowns for: Status, Urgency, Source, Property Type
- Budget range: two number inputs (min/max) with currency symbol prefix matching tenant market
- Market-specific filters appear dynamically:
  - Nigeria: Title Type dropdown (C of O, Governor's Consent, etc.), Payment Plan
  - Dubai: Off-plan toggle, Freehold toggle, Investment Type
- "Clear filters" ghost button to reset
- Result count text: `text-xs text-surface-500`

**Table Columns:**
| Column | Content | Sortable | Width |
|--------|---------|----------|-------|
| Name | Lead name + phone (stacked on mobile) | Yes | flex |
| Status | Status badge | Yes | 120px |
| Urgency | Hot/Warm/Cold badge | Yes | 100px |
| Score | Score number with color bar | Yes | 80px |
| Source | Source icon + label | Yes | 100px |
| Budget | Currency-formatted range | Yes | 150px |
| Last Activity | Relative time ("2h ago") | Yes | 120px |
| Actions | "..." menu (view, edit, delete) | No | 60px |

**Row Click:** Navigates to `/leads/:id`

**Pagination:**
```
<div class="flex items-center justify-between px-4 py-3 border-t border-surface-200">
  <p class="text-sm text-surface-500">Showing 1-20 of 47 leads</p>
  <div class="flex items-center gap-2">
    <button class="px-3 py-1.5 text-sm ...">Previous</button>
    <span class="px-3 py-1.5 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg">1</span>
    <button class="px-3 py-1.5 text-sm ...">2</button>
    <button class="px-3 py-1.5 text-sm ...">3</button>
    <button class="px-3 py-1.5 text-sm ...">Next</button>
  </div>
</div>
```

---

### 2.6 `/leads/:id` -- Lead Detail

**Purpose:** Complete lead view with conversation thread, qualification summary, property interest, and action controls.

**Layout:** Two-panel layout -- left panel (conversation), right panel (lead details sidebar).

```
+--------+-------------------------------------+---------------------+
|        |  [< Back to Leads]  Emeka Okafor    | Lead Score: 85      |
| Sidebar|  +234 801 234 5678  HOT  Qualified   | [========] HOT      |
|        |-------------------------------------+---------------------+
|        |                                      |                     |
|        |  +-- Conversation Thread ----------+ | QUALIFICATION       |
|        |  |                                  | | Budget: ₦45-55M     |
|        |  | [Chioma - AI]  3:42 PM          | | Timeline: < 3 mo    |
|        |  | Welcome! I'm Chioma, AI         | | Property: 3-bed apt  |
|        |  | assistant for Adaeze at...      | | Area: Lekki Phase 1  |
|        |  |                                  | | Title: C of O        |
|        |  | [Emeka - Lead]  3:43 PM         | | Payment: Installment |
|        |  | I dey look for 3-bedroom flat   | |                     |
|        |  | in Lekki Phase 1, my budget na  | | PROPERTY INTEREST    |
|        |  | around ₦50M                     | | [Edit fields...]     |
|        |  |                                  | |                     |
|        |  | [Chioma - AI]  3:43 PM          | | AI SUMMARY           |
|        |  | Wonderful! Lekki Phase 1 is a   | | "Emeka is a serious  |
|        |  | great choice. Let me ask a few  | | buyer with confirmed |
|        |  | questions...                    | | budget..."           |
|        |  |                                  | |                     |
|        |  | [System]  3:50 PM               | | ACTIONS              |
|        |  | Lead score updated: 65 -> 85    | | [Take Over Conv]     |
|        |  |                                  | | [Book Appointment]   |
|        |  +----------------------------------+ | [Edit Lead]          |
|        |                                      | [Mark as Dead]       |
|        |  +-- Agent Input -------------------+ | [Request Deletion]   |
|        |  | [Type a message...     ] [Send]  | | (Nigeria: NDPR)     |
|        |  | [Take Over] [Resume AI]          | |                     |
|        |  +----------------------------------+ |                     |
+--------+-------------------------------------+---------------------+
         |<-------- ~60% width --------------->|<--- ~40% width ---->|
```

**Conversation Thread Panel:**
- Scrollable message list, newest at bottom
- Auto-scrolls to latest message
- Real-time updates via Firestore `onSnapshot`
- Message differentiation (see ConversationThread component spec in Section 3)
- WhatsApp 24-hour window indicator at top of thread:
  ```
  // Within window
  <div class="bg-success-50 text-success-700 text-xs px-3 py-1.5 rounded-lg text-center">
    Free messaging window open -- expires in 18h 24m
  </div>
  // Window expired
  <div class="bg-warning-50 text-warning-700 text-xs px-3 py-1.5 rounded-lg text-center">
    Free window expired. Only template messages can be sent.
  </div>
  ```

**Agent Input Area:**
- Text input + Send button
- Disabled when AI is active (grayed out with message: "AI is handling this conversation")
- "Take Over" button when AI is active
- "Resume AI" button when agent has taken over
- In approval mode: shows pending AI messages with Approve / Edit / Reject buttons

**Lead Details Sidebar:**
- Lead score with visual progress bar and urgency color
- Qualification fields (read-only, extracted by AI)
- Property interest section (editable on click)
- AI-generated summary card
- Action buttons stacked vertically
- Consent status badge (Nigeria): "NDPR Consent: Given" or "Pending"
- Compliance badge (Dubai): "RERA Compliant" in green

---

### 2.7 `/appointments` -- Calendar View

**Purpose:** Visual calendar for managing appointments across month, week, and day views.

**Layout:** AppShell with full-width calendar.

```
+--------+----------------------------------------------------------+
|        |  Header: "Appointments"        [+ New Appointment]        |
| Sidebar|-----------------------------------------------------------+
|        |                                                            |
|        |  [< Prev]  April 2026  [Next >]   [Month] [Week] [Day]   |
|        |                                                            |
|        |  +-- Calendar Grid (Month View) -------------------------+|
|        |  | Mon  | Tue  | Wed  | Thu  | Fri  | Sat  | Sun  |     ||
|        |  |------|------|------|------|------|------|------|      ||
|        |  |      |      |  1   |  2   |  3   |  4   |  5   |     ||
|        |  |      |      |      |      |      |      |      |     ||
|        |  |  6   |  7   |  8   |  9   | 10   | 11   | 12   |     ||
|        |  |      | [2PM]|      |      | [10A]|      |      |     ||
|        |  |      | Emeka|      |      | Priya|      |      |     ||
|        |  |      |[View]|      |      |[VidC]|      |      |     ||
|        |  | ...                                                   ||
|        |  +--------------------------------------------------------+|
|        |                                                            |
|        |  +-- Appointment Detail Panel (when event clicked) ------+|
|        |  | [Property Viewing] Apr 7, 2:00 PM - 3:00 PM           ||
|        |  | Lead: Emeka Okafor | Score: 85 | HOT                  ||
|        |  | Location: 15 Peace Avenue, Lekki Phase 1              ||
|        |  | Budget: ₦45-55M | 3-bed apartment                    ||
|        |  | Notes: "Serious buyer, installment preferred..."       ||
|        |  | [Reschedule] [Cancel] [View Lead]                     ||
|        |  +--------------------------------------------------------+|
+--------+----------------------------------------------------------+
```

**Calendar Configuration:**
- For Nigeria market: week starts Monday, weekend is Saturday-Sunday (gray columns)
- For Dubai market: week starts Sunday, weekend is Friday-Saturday (gray columns)
- Appointment color coding by type:
  - Property Viewing: `bg-brand-100 border-l-4 border-l-brand-500 text-brand-800`
  - Buyer Consultation: `bg-purple-100 border-l-4 border-l-purple-500 text-purple-800`
  - Video Call: `bg-teal-100 border-l-4 border-l-teal-500 text-teal-800`
  - Valuation: `bg-amber-100 border-l-4 border-l-amber-500 text-amber-800`
- Cultural blocks shown as hatched/unavailable zones (Dubai: Friday 12-2 PM)

**View Toggle Buttons:**
```
<div class="inline-flex rounded-lg border border-surface-200 p-0.5">
  <button class="px-3 py-1.5 text-xs font-medium rounded-md
                 bg-brand-500 text-white">Month</button>
  <button class="px-3 py-1.5 text-xs font-medium rounded-md
                 text-surface-600 hover:bg-surface-100">Week</button>
  <button class="px-3 py-1.5 text-xs font-medium rounded-md
                 text-surface-600 hover:bg-surface-100">Day</button>
</div>
```

**Appointment Detail Panel:**
Appears as a slide-over panel from the right (or a popover on desktop) when an appointment event is clicked. Contains lead summary, notes, and action buttons.

---

### 2.8 `/analytics` -- Charts and Metrics

**Purpose:** Performance analytics with filterable charts and KPI cards.

**Layout:** AppShell with metric cards row + chart grid.

```
+--------+----------------------------------------------------------+
|        |  Header: "Analytics"      [7d] [30d] [90d] [Custom]      |
| Sidebar|-----------------------------------------------------------+
|        |                                                            |
|        |  +-- KPI Cards (4-col grid) -----------------------------+|
|        |  | Total Leads  | Conversion | Avg Response | Show Rate  ||
|        |  | 156          | 14.2%      | 1.8 min      | 72%        ||
|        |  | +12% vs prev | +2.1%      | -0.3 min     | +5%        ||
|        |  +-------------------------------------------------------+|
|        |                                                            |
|        |  +-- Leads by Source --------+ +-- Conversion Funnel ----+|
|        |  |                           | |                          ||
|        |  |  [Pie Chart]              | |  New: 156 ============  ||
|        |  |  WhatsApp: 68%            | |  Contacted: 98 =======  ||
|        |  |  Manual: 15%              | |  Qualified: 45 ====     ||
|        |  |  Prop Finder: 12%         | |  Appt Set: 22 ==       ||
|        |  |  Other: 5%                | |  Closed: 8 =           ||
|        |  +---------------------------+ +--------------------------+|
|        |                                                            |
|        |  +-- Leads Over Time (Line Chart) -----------------------+|
|        |  |                                                        ||
|        |  |  ^                                                     ||
|        |  |  |     .    .                                          ||
|        |  |  |   .   ..   .    .                                   ||
|        |  |  |  .         .  ..  .                                 ||
|        |  |  +--------------------------->                         ||
|        |  |  Jan   Feb   Mar   Apr                                 ||
|        |  +--------------------------------------------------------+|
|        |                                                            |
|        |  +-- Response Time Distribution -----+ +-- Revenue ------+|
|        |  | [Bar chart: < 1m, 1-5m, 5-15m...] | | Pipeline: ₦250M||
|        |  +-----------------------------------+ +-----------------+|
+--------+----------------------------------------------------------+
```

**Date Range Selector:**
Toggle button group (same style as calendar view toggle) with preset ranges: 7d, 30d, 90d, and a custom date picker.

**KPI Cards:**
Each card includes: metric label, value, trend indicator (green up arrow or red down arrow with percentage vs previous period).

**Charts (Recharts):**
- Leads by Source: `PieChart` with `ResponsiveContainer`
- Conversion Funnel: Horizontal bar chart or custom funnel SVG
- Leads Over Time: `LineChart` or `AreaChart` with daily/weekly resolution
- Response Time Distribution: `BarChart`
- Revenue Pipeline: Large number display with currency formatting

**All monetary values:** Use `CurrencyDisplay` component. Charts use tenant currency symbol on axes.

---

### 2.9 `/billing` -- Subscription & Payment

**Purpose:** Subscription management, tier selection, payment history, and usage tracking.

**Layout:** AppShell with pricing cards and billing history.

```
+--------+----------------------------------------------------------+
|        |  Header: "Billing"                                        |
| Sidebar|-----------------------------------------------------------+
|        |                                                            |
|        |  +-- Current Plan Card -----------------------------------+|
|        |  | Plan: TEAM  |  Status: Active  |  Next billing: May 7 ||
|        |  | ₦75,000/month  |  5 agents  |  500 leads/month        ||
|        |  | [Change Plan]  [Update Payment Method]                 ||
|        |  +--------------------------------------------------------+|
|        |                                                            |
|        |  +-- Usage Summary (progress bars) ----------------------+|
|        |  | Leads:  67/500  [=============.............]  13.4%    ||
|        |  | Agents: 3/5     [=================..........]  60%     ||
|        |  +--------------------------------------------------------+|
|        |                                                            |
|        |  +-- Pricing Tiers (3-col grid) -------------------------+|
|        |  | SOLO           | TEAM            | BROKERAGE          ||
|        |  | ₦25,000/mo     | ₦75,000/mo      | ₦200,000/mo       ||
|        |  | 100 leads      | 500 leads        | Unlimited         ||
|        |  | 1 agent        | 5 agents         | Unlimited agents  ||
|        |  | AI qualify     | + Team dashboard  | + Compliance rpt  ||
|        |  | WhatsApp       | + CRM integration | + API access      ||
|        |  | Calendar       |                  | + White-label      ||
|        |  | [Current Plan] | [Selected]       | [Upgrade]         ||
|        |  +--------------------------------------------------------+|
|        |                                                            |
|        |  +-- Payment History ------------------------------------+|
|        |  | Date        | Amount      | Status  | Receipt          ||
|        |  | Apr 7, 2026 | ₦75,000     | Paid    | [Download]       ||
|        |  | Mar 7, 2026 | ₦75,000     | Paid    | [Download]       ||
|        |  | Feb 7, 2026 | ₦25,000     | Paid    | [Download]       ||
|        |  +--------------------------------------------------------+|
+--------+----------------------------------------------------------+
```

**Pricing Card Styles:**
```
// Standard tier card
className="bg-surface-0 border border-surface-200 rounded-xl p-6"

// Current/selected tier card
className="bg-surface-0 border-2 border-brand-500 rounded-xl p-6
           ring-2 ring-brand-500/20 relative"
// With "Current Plan" badge:
// <span class="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500
//              text-white text-xs font-medium px-3 py-1 rounded-full">
//   Current Plan
// </span>

// Recommended tier card (Team, usually)
className="bg-surface-0 border-2 border-brand-500 rounded-xl p-6
           shadow-lg relative"
// With "Recommended" badge
```

**Currency Display:** All prices formatted using tenant market currency (see PricingDisplay component).

---

### 2.10 `/settings` -- Settings Page

**Purpose:** Centralized settings hub with tabbed navigation for Profile, AI Config, Integrations, and Team.

**Layout:** AppShell with left tab menu + right content area.

```
+--------+----------------------------------------------------------+
|        |  Header: "Settings"                                       |
| Sidebar|-----------------------------------------------------------+
|        |                                                            |
|        |  +-- Tab Menu -----+  +-- Content Area -----------------+|
|        |  |                  |  |                                  ||
|        |  | [> Profile     ] |  |  PROFILE SETTINGS                ||
|        |  | [  AI Config   ] |  |                                  ||
|        |  | [  Integrations] |  |  [Full Name           ]         ||
|        |  | [  Team        ] |  |  [Email (read-only)   ]         ||
|        |  |                  |  |  [Phone (+234...)      ]         ||
|        |  |                  |  |  [License Number       ]         ||
|        |  |                  |  |  [Brokerage            ]         ||
|        |  |                  |  |  [Preferred Language  v]         ||
|        |  |                  |  |                                  ||
|        |  |                  |  |  Market: Nigeria [NG badge]      ||
|        |  |                  |  |  (Cannot be changed)             ||
|        |  |                  |  |                                  ||
|        |  |                  |  |  [Save Changes]                  ||
|        |  +------------------+  +----------------------------------+|
+--------+----------------------------------------------------------+
```

**Tab Menu Classes:**
```
// Active tab
className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium
           text-brand-600 bg-brand-50 rounded-lg"

// Inactive tab
className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium
           text-surface-600 hover:bg-surface-100 rounded-lg"
```

**Settings Sub-Pages:**

**Profile (`/settings` or `/settings/profile`):**
- Editable agent profile fields
- Market shown as read-only badge (immutable after signup)
- Save button

**AI Config (`/settings/ai`):**
- Persona name input
- Greeting script textarea
- Handoff threshold slider with live value display
- Approval mode toggle switch
- Preview pane showing WhatsApp-style message bubble
- Default qualification questions (reorderable list)

**Integrations (`/settings/integrations`):**
- Three integration sections:

```
+-- WhatsApp Business ----------------------------------------+
| Status: Connected [green dot]                 [Disconnect]  |
| Phone Number ID: 12345678901234                             |
| WABA ID: 98765432109876                                     |
| Connected: Apr 1, 2026                                      |
+-------------------------------------------------------------+

+-- Calendar -------------------------------------------------+
| Google Calendar: Connected [green dot]        [Disconnect]  |
| Email: agent@gmail.com                                      |
|                                                              |
| Outlook Calendar: Not connected               [Connect]     |
|                                                              |
| Preferred Calendar: [Google v]                               |
+-------------------------------------------------------------+

+-- Payment --------------------------------------------------+
| Provider: Paystack (Nigeria)                                 |
| Subscription: Team (₦75,000/mo)                             |
| Status: Active                                               |
| [Manage Billing ->]                                          |
+-------------------------------------------------------------+
```

Each integration card:
```
// Connected state
className="bg-surface-0 border border-surface-200 rounded-xl p-5"
// With green dot: <span class="w-2 h-2 rounded-full bg-success-500 inline-block" />

// Not connected state
className="bg-surface-50 border border-dashed border-surface-300 rounded-xl p-5"
```

**Team (`/settings/team`):**
- Only visible for Team and Brokerage tiers
- Agent list table: Name, Email, Role, Status, Last Active, Actions
- "Invite Agent" button opens modal with email input
- Role badge: Admin (purple), Agent (blue)
- Status badge: Active (green), Invited (amber), Disabled (gray)
- Actions: Edit role, Disable/Enable, Remove

---

### 2.11 `/compliance` -- Audit & Compliance

**Purpose:** Compliance audit logs, violation reports, and consent management. Primarily for Brokerage tier.

**Layout:** AppShell with date-filtered log table and summary cards.

```
+--------+----------------------------------------------------------+
|        |  Header: "Compliance"    [Generate Report] (Primary)      |
| Sidebar|-----------------------------------------------------------+
|        |                                                            |
|        |  +-- Compliance Summary (3-col) -------------------------+|
|        |  | Messages Checked | Violations | Escalations           ||
|        |  | 1,234            | 3          | 7                     ||
|        |  | All passed       | 2 resolved | 5 resolved            ||
|        |  +-------------------------------------------------------+|
|        |                                                            |
|        |  Framework: [NDPR badge] or [RERA badge]                  |
|        |                                                            |
|        |  +-- Filters: [Date Range] [Severity v] [Event Type v] --+|
|        |                                                            |
|        |  +-- Audit Log Table ------------------------------------+|
|        |  | Timestamp       | Event Type      | Severity | Lead   ||
|        |  |-----------------|-----------------|----------|--------||
|        |  | Apr 7 3:42 PM   | RERA Check Pass | Info     | Priya  ||
|        |  | Apr 7 2:15 PM   | Fraud Detected  | Critical | Anon.  ||
|        |  | Apr 6 11:00 AM  | Consent Captured| Info     | Emeka  ||
|        |  | Apr 5 9:30 AM   | RERA Flagged    | Warning  | Hassan ||
|        |  +--------------------------------------------------------+|
|        |                                                            |
|        |  +-- Consent Records (Nigeria only) ---------------------+|
|        |  | Lead Name | Consent | Timestamp       | Method        ||
|        |  | Emeka O.  | Given   | Apr 6, 11:00 AM | WhatsApp     ||
|        |  | James T.  | Pending | --              | --            ||
|        |  +--------------------------------------------------------+|
+--------+----------------------------------------------------------+
```

**Severity Badges:**
- Info: `bg-blue-50 text-blue-700`
- Warning: `bg-amber-50 text-amber-700`
- Critical: `bg-red-50 text-red-700` with pulsing dot indicator

**Generate Report Button:** Opens a modal to select date range, then triggers `complianceLogger` with action `generateReport`. Downloads result as a formatted PDF or displays inline.

---

## 3. Key Component Specifications

### 3.1 MarketSelector

**Purpose:** Nigeria/Dubai toggle used during signup and displayed as a read-only badge throughout the app.

**Props:**
```typescript
interface MarketSelectorProps {
  value: "nigeria" | "dubai" | null;
  onChange: (market: "nigeria" | "dubai") => void;
  disabled?: boolean;
}
```

**Rendered Structure (Signup -- Interactive):**
```
<div class="grid grid-cols-2 gap-3">
  <!-- Nigeria Card -->
  <button
    class={value === "nigeria"
      ? "border-2 border-nigeria-500 bg-nigeria-50 rounded-xl p-4 ring-2 ring-nigeria-500/20 text-left transition-all"
      : "border border-surface-200 bg-surface-0 rounded-xl p-4 hover:border-surface-300 text-left transition-all"
    }
    onClick={() => onChange("nigeria")}
  >
    <div class="flex items-center gap-3">
      <span class="text-2xl">🇳🇬</span>
      <div>
        <p class="text-sm font-semibold text-surface-800">Nigeria</p>
        <p class="text-xs text-surface-500">₦ NGN</p>
      </div>
    </div>
    {value === "nigeria" && (
      <div class="mt-2 flex items-center gap-1 text-xs text-nigeria-600">
        <Check class="w-3.5 h-3.5" /> Selected
      </div>
    )}
  </button>

  <!-- Dubai Card (same pattern with dubai colors and 🇦🇪) -->
</div>
```

**Rendered Structure (Badge -- Read-only):**
```
// Nigeria
<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-nigeria-100 text-nigeria-700">
  <span>🇳🇬</span> Nigeria
</span>

// Dubai
<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-dubai-100 text-dubai-700">
  <span>🇦🇪</span> Dubai
</span>
```

---

### 3.2 LeadTable

**Purpose:** Sortable, filterable data table for the leads page with market-aware columns.

**Props:**
```typescript
interface LeadTableProps {
  leads: Lead[];
  market: "nigeria" | "dubai";
  onRowClick: (leadId: string) => void;
  sortField: string;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
  loading: boolean;
}
```

**Column Configuration:**
```typescript
const baseColumns = [
  { key: "contact.name", label: "Lead", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "qualification.urgency", label: "Urgency", sortable: true },
  { key: "qualification.score", label: "Score", sortable: true },
  { key: "source", label: "Source", sortable: true },
  { key: "propertyInterest.budgetMax", label: "Budget", sortable: true },
  { key: "conversation.lastMessageAt", label: "Last Active", sortable: true },
];

// Nigeria adds:
{ key: "propertyInterest.nigeriaSpecific.titleType", label: "Title", sortable: true }

// Dubai adds:
{ key: "propertyInterest.dubaiSpecific.offPlan", label: "Off-Plan", sortable: true }
```

**Score Cell Rendering:**
```
<td class="px-4 py-3">
  <div class="flex items-center gap-2">
    <div class="w-10 h-1.5 rounded-full bg-surface-200 overflow-hidden">
      <div
        class={`h-full rounded-full ${
          score >= 70 ? 'bg-red-500' : score >= 40 ? 'bg-amber-500' : 'bg-gray-400'
        }`}
        style={{ width: `${score}%` }}
      />
    </div>
    <span class="text-sm font-medium text-surface-700">{score}</span>
  </div>
</td>
```

**Empty State:**
```
<div class="text-center py-16">
  <Users class="w-12 h-12 text-surface-300 mx-auto mb-4" />
  <h3 class="text-lg font-medium text-surface-700">No leads yet</h3>
  <p class="mt-1 text-sm text-surface-500">
    Leads will appear here when they message your WhatsApp number
    or you add them manually.
  </p>
  <button class="mt-4 ... primary-button">
    <Plus class="w-4 h-4 mr-1.5" /> Add Your First Lead
  </button>
</div>
```

**Loading State:**
Skeleton rows using animated pulse:
```
<tr class="animate-pulse">
  <td class="px-4 py-3"><div class="h-4 w-32 bg-surface-200 rounded" /></td>
  <td class="px-4 py-3"><div class="h-5 w-20 bg-surface-200 rounded-full" /></td>
  <td class="px-4 py-3"><div class="h-5 w-16 bg-surface-200 rounded-full" /></td>
  <td class="px-4 py-3"><div class="h-4 w-10 bg-surface-200 rounded" /></td>
  ...
</tr>
// Repeat 5-8 skeleton rows
```

---

### 3.3 ConversationThread

**Purpose:** WhatsApp-style chat view with visual differentiation between AI, human lead, agent, and system messages.

**Props:**
```typescript
interface ConversationThreadProps {
  messages: Message[];
  leadName: string;
  agentName: string;
  personaName: string; // "Chioma" or "Aisha"
  aiActive: boolean;
  approvalMode: boolean;
  onSendMessage: (text: string) => void;
  onTakeOver: () => void;
  onResumeAI: () => void;
  onApproveMessage: (messageId: string) => void;
  onRejectMessage: (messageId: string) => void;
}
```

**Message Bubble Styles:**

```
// Lead message (left-aligned, light gray)
<div class="flex justify-start mb-3">
  <div class="max-w-[75%]">
    <p class="text-xs text-surface-500 mb-1">{leadName}</p>
    <div class="bg-surface-100 text-surface-800 rounded-2xl rounded-tl-sm px-4 py-2.5">
      <p class="text-sm">{message.content.text}</p>
    </div>
    <p class="text-xs text-surface-400 mt-1">{formattedTime}</p>
  </div>
</div>

// AI message (right-aligned, brand blue background)
<div class="flex justify-end mb-3">
  <div class="max-w-[75%]">
    <div class="flex items-center justify-end gap-1.5 mb-1">
      <Bot class="w-3 h-3 text-brand-500" />
      <p class="text-xs text-brand-500 font-medium">{personaName} (AI)</p>
    </div>
    <div class="bg-brand-500 text-white rounded-2xl rounded-tr-sm px-4 py-2.5">
      <p class="text-sm">{message.content.text}</p>
    </div>
    <div class="flex items-center justify-end gap-2 mt-1">
      <p class="text-xs text-surface-400">{formattedTime}</p>
      {message.metadata.complianceCheck === "passed" && (
        <ShieldCheck class="w-3 h-3 text-success-500" />
      )}
      {message.metadata.complianceCheck === "flagged" && (
        <ShieldAlert class="w-3 h-3 text-warning-500" />
      )}
    </div>
  </div>
</div>

// Agent message (right-aligned, darker blue -- differentiated from AI)
<div class="flex justify-end mb-3">
  <div class="max-w-[75%]">
    <div class="flex items-center justify-end gap-1.5 mb-1">
      <User class="w-3 h-3 text-brand-700" />
      <p class="text-xs text-brand-700 font-medium">{agentName}</p>
    </div>
    <div class="bg-brand-700 text-white rounded-2xl rounded-tr-sm px-4 py-2.5">
      <p class="text-sm">{message.content.text}</p>
    </div>
    <p class="text-xs text-surface-400 mt-1 text-right">{formattedTime}</p>
  </div>
</div>

// System message (centered, subtle)
<div class="flex justify-center mb-3">
  <div class="bg-surface-100 text-surface-500 text-xs px-3 py-1.5 rounded-full">
    {message.content.text}
  </div>
</div>
```

**Voice Message Indicator:**
```
<div class="flex items-center gap-2 bg-surface-100 rounded-2xl px-4 py-2.5">
  <button class="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center">
    <Play class="w-3.5 h-3.5 text-white" />
  </button>
  <div class="flex-1 h-1 bg-surface-300 rounded-full">
    <div class="h-1 w-1/3 bg-brand-500 rounded-full" />
  </div>
  <span class="text-xs text-surface-500">0:23</span>
</div>
<p class="text-xs text-surface-400 mt-1 italic">Transcription: "{transcribedText}"</p>
```

**Media Message:**
```
// Image
<div class="rounded-xl overflow-hidden max-w-[240px]">
  <img src={message.content.mediaUrl} alt="Property" class="w-full h-auto" />
</div>

// Document
<div class="flex items-center gap-3 bg-surface-100 rounded-xl px-4 py-3">
  <FileText class="w-8 h-8 text-surface-400" />
  <div>
    <p class="text-sm font-medium text-surface-700">Document.pdf</p>
    <p class="text-xs text-surface-500">PDF, 2.4 MB</p>
  </div>
  <Download class="w-4 h-4 text-surface-400 ml-auto" />
</div>
```

**Approval Mode Pending Message:**
```
<div class="flex justify-end mb-3">
  <div class="max-w-[75%]">
    <div class="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
      <div class="flex items-center gap-1.5 mb-2">
        <Clock class="w-3 h-3 text-amber-500" />
        <p class="text-xs text-amber-600 font-medium">Pending Approval</p>
      </div>
      <p class="text-sm text-surface-700">{pendingMessage.text}</p>
      <div class="flex items-center gap-2 mt-3 pt-2 border-t border-amber-200">
        <button class="px-3 py-1 text-xs font-medium bg-success-500 text-white rounded-lg
                       hover:bg-success-700">Approve</button>
        <button class="px-3 py-1 text-xs font-medium bg-surface-0 text-surface-600
                       border border-surface-200 rounded-lg hover:bg-surface-50">Edit</button>
        <button class="px-3 py-1 text-xs font-medium text-danger-500
                       hover:bg-danger-50 rounded-lg">Reject</button>
      </div>
    </div>
  </div>
</div>
```

---

### 3.4 LeadScoreIndicator

**Purpose:** Visual 0-100 score with hot/warm/cold color coding, used in lead detail sidebar and table cells.

**Props:**
```typescript
interface LeadScoreIndicatorProps {
  score: number;          // 0-100
  urgency: "hot" | "warm" | "cold";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}
```

**Variants:**

**Small (table cell):**
```
<div class="flex items-center gap-2">
  <div class="w-8 h-1.5 rounded-full bg-surface-200 overflow-hidden">
    <div class="h-full rounded-full bg-{urgencyColor}" style={{ width: `${score}%` }} />
  </div>
  <span class="text-xs font-medium text-surface-600">{score}</span>
</div>
```

**Medium (card display):**
```
<div class="flex items-center gap-3">
  <div class="relative w-12 h-12">
    <!-- SVG circular progress ring -->
    <svg class="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="20" fill="none" stroke-width="4"
              class="stroke-surface-200" />
      <circle cx="24" cy="24" r="20" fill="none" stroke-width="4"
              class="stroke-{urgencyColor}"
              stroke-dasharray={`${score * 1.256} 125.6`}
              stroke-linecap="round" />
    </svg>
    <span class="absolute inset-0 flex items-center justify-center text-sm font-bold
                 text-surface-800">{score}</span>
  </div>
  <div>
    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold
                 {urgencyBadgeClasses}">
      {urgency.toUpperCase()}
    </span>
  </div>
</div>
```

**Large (lead detail hero):**
```
<div class="text-center">
  <div class="relative w-24 h-24 mx-auto">
    <!-- Large SVG ring (same pattern, scaled up) -->
    <span class="absolute inset-0 flex items-center justify-center text-2xl font-bold
                 text-surface-800">{score}</span>
  </div>
  <span class="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold
               {urgencyBadgeClasses}">
    {urgency === "hot" && <Flame class="w-3.5 h-3.5 mr-1" />}
    {urgency.toUpperCase()}
  </span>
</div>
```

**Color Mapping:**
```typescript
const urgencyColors = {
  hot:  { bar: "bg-red-500",   badge: "bg-red-100 text-red-700",   stroke: "stroke-red-500" },
  warm: { bar: "bg-amber-500", badge: "bg-amber-100 text-amber-700", stroke: "stroke-amber-500" },
  cold: { bar: "bg-gray-400",  badge: "bg-gray-100 text-gray-600", stroke: "stroke-gray-400" },
};
```

---

### 3.5 AppointmentCard

**Purpose:** Calendar event card showing appointment details with lead context.

**Props:**
```typescript
interface AppointmentCardProps {
  appointment: Appointment;
  lead: Lead;
  market: "nigeria" | "dubai";
  onReschedule: () => void;
  onCancel: () => void;
  onViewLead: () => void;
}
```

**Rendered Structure:**
```
<div class="bg-surface-0 border border-surface-200 rounded-xl p-4 shadow-sm
            hover:shadow-md transition-shadow">
  <!-- Header: Type badge + Status -->
  <div class="flex items-center justify-between mb-3">
    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                 bg-brand-50 text-brand-700">
      <Eye class="w-3 h-3" /> Property Viewing
    </span>
    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                 bg-success-50 text-success-700">
      Confirmed
    </span>
  </div>

  <!-- Date/Time -->
  <div class="flex items-center gap-2 mb-2">
    <Calendar class="w-4 h-4 text-surface-400" />
    <p class="text-sm font-medium text-surface-800">Apr 7, 2026 -- 2:00 PM</p>
  </div>

  <!-- Lead Info -->
  <div class="flex items-center gap-3 mb-3 p-2 bg-surface-50 rounded-lg">
    <div class="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center
                text-xs font-semibold text-brand-700">EO</div>
    <div>
      <p class="text-sm font-medium text-surface-800">Emeka Okafor</p>
      <p class="text-xs text-surface-500">Score: 85 | HOT</p>
    </div>
  </div>

  <!-- Location -->
  <div class="flex items-center gap-2 mb-3">
    <MapPin class="w-4 h-4 text-surface-400" />
    <p class="text-xs text-surface-600">15 Peace Avenue, Lekki Phase 1</p>
  </div>

  <!-- Notes excerpt -->
  <p class="text-xs text-surface-500 mb-3 line-clamp-2">
    {appointment.notes}
  </p>

  <!-- Actions -->
  <div class="flex items-center gap-2 pt-3 border-t border-surface-200">
    <button class="flex-1 px-3 py-1.5 text-xs font-medium text-surface-600
                   border border-surface-200 rounded-lg hover:bg-surface-50">
      Reschedule
    </button>
    <button class="flex-1 px-3 py-1.5 text-xs font-medium text-danger-500
                   border border-danger-200 rounded-lg hover:bg-danger-50">
      Cancel
    </button>
    <button class="px-3 py-1.5 text-xs font-medium text-brand-500
                   hover:bg-brand-50 rounded-lg">
      View Lead
    </button>
  </div>
</div>
```

---

### 3.6 PricingDisplay

**Purpose:** Currency-aware component that formats monetary values using tenant's market configuration.

**Props:**
```typescript
interface PricingDisplayProps {
  amount: number;
  market?: "nigeria" | "dubai";    // Overrides tenant context if provided
  showCurrency?: boolean;           // Show "NGN" / "AED" label after amount
  size?: "sm" | "md" | "lg";
  period?: "month" | "year" | null; // Appends "/mo" or "/yr"
}
```

**Formatting Logic:**
```typescript
function formatCurrency(amount: number, market: "nigeria" | "dubai"): string {
  if (market === "nigeria") {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
    // Output: "₦25,000,000"
  }

  if (market === "dubai") {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
    // Output: "AED 2,500,000"
  }
}
```

**Rendered Examples:**
```
// Large pricing display (billing page)
<div>
  <span class="text-3xl font-bold text-surface-800">₦75,000</span>
  <span class="text-sm text-surface-500">/month</span>
</div>

// Inline budget display (lead table)
<span class="text-sm text-surface-700">₦45M - ₦55M</span>

// Budget abbreviation helper:
function abbreviateAmount(amount: number, market: string): string {
  const symbol = market === "nigeria" ? "₦" : "AED ";
  if (amount >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${symbol}${(amount / 1_000).toFixed(0)}K`;
  return `${symbol}${amount}`;
}
```

---

### 3.7 DashboardWidgets

**Purpose:** Collection of dashboard widget components for the main overview page.

#### Pipeline Funnel Widget

```
<div class="bg-surface-0 border border-surface-200 rounded-xl p-5">
  <h3 class="text-sm font-semibold text-surface-700 mb-4">Lead Pipeline</h3>
  <div class="space-y-3">
    {pipelineStages.map(stage => (
      <div key={stage.key} class="flex items-center gap-3">
        <span class="text-xs text-surface-500 w-20 text-right">{stage.label}</span>
        <div class="flex-1 h-6 bg-surface-100 rounded-full overflow-hidden">
          <div
            class={`h-full rounded-full ${stage.color}`}
            style={{ width: `${(stage.count / maxCount) * 100}%` }}
          >
            <span class="text-xs font-medium text-white pl-2 leading-6">
              {stage.count}
            </span>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>

// Stage colors:
// New:            bg-blue-500
// Contacted:      bg-indigo-500
// Qualified:      bg-green-500
// Appointment:    bg-purple-500
// Closed:         bg-surface-400
```

#### Urgency Breakdown Widget

```
<div class="bg-surface-0 border border-surface-200 rounded-xl p-5">
  <h3 class="text-sm font-semibold text-surface-700 mb-4">Lead Urgency</h3>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Flame class="w-4 h-4 text-red-500" />
        <span class="text-sm text-surface-700">Hot</span>
      </div>
      <span class="text-sm font-semibold text-surface-800">{hotCount}</span>
    </div>
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <TrendingUp class="w-4 h-4 text-amber-500" />
        <span class="text-sm text-surface-700">Warm</span>
      </div>
      <span class="text-sm font-semibold text-surface-800">{warmCount}</span>
    </div>
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Snowflake class="w-4 h-4 text-gray-400" />
        <span class="text-sm text-surface-700">Cold</span>
      </div>
      <span class="text-sm font-semibold text-surface-800">{coldCount}</span>
    </div>
  </div>
</div>
```

#### Recent Activity Widget

```
<div class="bg-surface-0 border border-surface-200 rounded-xl p-5">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-sm font-semibold text-surface-700">Recent Activity</h3>
    <a href="/leads" class="text-xs text-brand-500 hover:text-brand-600">View all</a>
  </div>
  <div class="space-y-3">
    {activities.map(activity => (
      <div class="flex items-start gap-3 p-2 rounded-lg hover:bg-surface-50 cursor-pointer">
        <!-- Avatar circle with initials -->
        <div class="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center
                    text-xs font-semibold text-brand-700 flex-shrink-0">
          {initials}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-surface-700 truncate">
            <span class="font-medium">{name}</span> {activityText}
          </p>
          <p class="text-xs text-surface-400">{timeAgo}</p>
        </div>
        <!-- Urgency dot -->
        <span class={`w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-${urgencyColor}`} />
      </div>
    ))}
  </div>
</div>
```

---

### 3.8 NavigationSidebar

**Purpose:** Primary navigation with icons and labels. Collapsible on desktop, slide-out on mobile.

**Props:**
```typescript
interface NavigationSidebarProps {
  currentPath: string;
  tenant: Tenant | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
}
```

**Navigation Items:**
```typescript
const navItems = [
  { path: "/",           icon: LayoutDashboard, label: "Dashboard" },
  { path: "/leads",      icon: Users,           label: "Leads" },
  { path: "/appointments", icon: Calendar,       label: "Appointments" },
  { path: "/analytics",  icon: BarChart3,        label: "Analytics" },
  { path: "/billing",    icon: CreditCard,       label: "Billing" },
  { path: "/settings",   icon: Settings,         label: "Settings" },
  // Brokerage tier only:
  { path: "/compliance",  icon: ShieldCheck,     label: "Compliance", tier: "brokerage" },
];
```

**Rendered Structure (Expanded):**
```
<aside class="fixed inset-y-0 left-0 z-40 w-64 bg-surface-900 text-surface-300
              flex flex-col transition-all duration-200">
  <!-- Logo -->
  <div class="flex items-center gap-2 px-5 h-16 border-b border-surface-800">
    <img src="/logo-white.svg" class="h-7" />
    <span class="text-lg font-bold text-white">AgentFlow AI</span>
  </div>

  <!-- Market indicator -->
  <div class="px-5 py-3">
    <MarketBadge market={tenant.market} />
  </div>

  <!-- Nav items -->
  <nav class="flex-1 px-3 py-2 space-y-1">
    {navItems.map(item => (
      <a
        href={item.path}
        class={currentPath === item.path
          ? "flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-800 text-white font-medium text-sm"
          : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-surface-400 hover:bg-surface-800 hover:text-white text-sm transition-colors"
        }
      >
        <item.icon class="w-5 h-5 flex-shrink-0" />
        <span>{item.label}</span>
        {/* Optional: notification badge */}
        {item.badge && (
          <span class="ml-auto bg-danger-500 text-white text-xs font-bold
                       w-5 h-5 rounded-full flex items-center justify-center">
            {item.badge}
          </span>
        )}
      </a>
    ))}
  </nav>

  <!-- Collapse toggle + User section -->
  <div class="px-3 py-4 border-t border-surface-800">
    <div class="flex items-center gap-3 px-3 py-2">
      <div class="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center
                  text-xs font-bold text-white">{userInitials}</div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-white truncate">{userName}</p>
        <p class="text-xs text-surface-500 truncate">{userEmail}</p>
      </div>
      <button class="text-surface-400 hover:text-white">
        <LogOut class="w-4 h-4" />
      </button>
    </div>
  </div>
</aside>
```

**Collapsed State:**
When collapsed (`w-16`), only icons show. Labels hidden. Logo collapses to icon-only. Tooltip on hover shows label.

---

## 4. Market-Aware UI Patterns

### 4.1 Form Adaptation Per Market

Forms dynamically render market-specific fields based on `tenant.market`. The universal fields always appear; market extensions appear below them in a clearly labeled section.

**Lead Create / Edit Form:**

```
+-- Universal Fields ------------------------------------------+
| [Full Name               ] [Phone (+234... / +971...)      ] |
| [Email (optional)        ] [Source: WhatsApp / Manual v    ] |
| [Property Type: Apartment / Villa / Land v ]                 |
| [Budget Min: ₦ _________ ] [Budget Max: ₦ _________ ]      |
| [Timeline: Immediate / 1-3 months / 3-6 months v ]          |
| [Desired Areas: multi-select tags]                           |
+--------------------------------------------------------------+

+-- Nigeria-Specific Fields -----------------------------------+
| Label: "Nigeria Property Details"                            |
| [Title Type: C of O / Governor's Consent / Deed v ]         |
| [Payment Plan: Outright / Installment / Mortgage v ]         |
| [Land Size: _________ (plots/acres) ]                        |
| [x] Road  [x] Water  [x] Electricity  [x] Security          |
|     ^ Infrastructure Needs (checkbox group)                  |
+--------------------------------------------------------------+

+-- Dubai-Specific Fields -------------------------------------+
| Label: "Dubai Property Details"                              |
| Off-Plan:  [toggle switch]                                    |
| Freehold Required:  [toggle switch]                           |
| [Investment Type: Primary Residence / Investment / Holiday v ]|
| [Target Yield: ______ %]                                      |
| Islamic Finance Interest:  [toggle switch]                    |
| [Handover Date: date picker]  (visible when off-plan = true) |
+--------------------------------------------------------------+
```

**Implementation Pattern:**
```typescript
// components/leads/MarketSpecificFields.tsx
export function MarketSpecificFields({ market }: { market: "nigeria" | "dubai" }) {
  if (market === "nigeria") {
    return (
      <fieldset class="mt-6 pt-6 border-t border-surface-200">
        <legend class="text-sm font-semibold text-surface-700 flex items-center gap-2">
          <span class="text-lg">🇳🇬</span> Nigeria Property Details
        </legend>
        <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Title Type select */}
          {/* Payment Plan select */}
          {/* Land Size input */}
          {/* Infrastructure Needs checkbox group */}
        </div>
      </fieldset>
    );
  }

  if (market === "dubai") {
    return (
      <fieldset class="mt-6 pt-6 border-t border-surface-200">
        <legend class="text-sm font-semibold text-surface-700 flex items-center gap-2">
          <span class="text-lg">🇦🇪</span> Dubai Property Details
        </legend>
        <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Off-Plan toggle */}
          {/* Freehold toggle */}
          {/* Investment Type select */}
          {/* Target Yield number input */}
          {/* Islamic Finance toggle */}
          {/* Handover Date picker (conditional) */}
        </div>
      </fieldset>
    );
  }

  return null;
}
```

### 4.2 Currency Display Formatting

All monetary values use the `CurrencyDisplay` component or `formatCurrency` utility. No raw number rendering for money.

| Market | Symbol | Format Example | Locale |
|--------|--------|----------------|--------|
| Nigeria | ₦ | ₦25,000,000 | en-NG |
| Nigeria (abbreviated) | ₦ | ₦25M | -- |
| Dubai | AED | AED 2,500,000 | en-AE |
| Dubai (abbreviated) | AED | AED 2.5M | -- |

**Budget Range Display:**
```typescript
// In table cells and lead cards
function formatBudgetRange(min: number, max: number, market: string): string {
  const abbr = (n: number) => abbreviateAmount(n, market);
  if (min && max) return `${abbr(min)} - ${abbr(max)}`;
  if (max) return `Up to ${abbr(max)}`;
  if (min) return `From ${abbr(min)}`;
  return "Not specified";
}
```

**Contexts where currency appears:**
- Lead table budget column
- Lead detail property interest section
- Dashboard pipeline value
- Analytics revenue charts
- Billing page pricing cards and payment history
- Appointment cards (lead budget context)

### 4.3 Calendar Display Differences

| Setting | Nigeria | Dubai |
|---------|---------|-------|
| Week start | Monday | Sunday |
| Weekend days | Saturday, Sunday (gray) | Friday, Saturday (gray) |
| Cultural blocks | None (holidays only) | Friday 12:00-14:00 (Jumu'ah) |
| Date format | DD/MM/YYYY | DD/MM/YYYY |
| Timezone | Africa/Lagos (WAT, UTC+1) | Asia/Dubai (GST, UTC+4) |

**Calendar Implementation:**
```typescript
// hooks/useCalendarConfig.ts
export function useCalendarConfig() {
  const { tenant } = useTenant();
  const market = tenant?.market;

  return {
    firstDayOfWeek: market === "dubai" ? 0 : 1,  // 0 = Sunday, 1 = Monday
    weekendDays: market === "dubai" ? [5, 6] : [0, 6],  // 0=Sun, 5=Fri, 6=Sat
    timezone: tenant?.config.timezone || "UTC",
    culturalBlocks: market === "dubai"
      ? [{ day: 5, start: "12:00", end: "14:00", label: "Jumu'ah Prayer" }]
      : [],
  };
}
```

**Cultural Block Display in Calendar:**
```
// Friday 12-2 PM block for Dubai
<div class="absolute bg-surface-100 border border-dashed border-surface-300
            rounded-lg opacity-75 pointer-events-none flex items-center justify-center">
  <span class="text-xs text-surface-400 italic">Jumu'ah Prayer</span>
</div>
```

### 4.4 Language / Locale Handling

- The dashboard UI is always in English for MVP
- Language detection affects AI conversation behavior, not dashboard UI
- Detected language is displayed as a badge on the lead detail page:
  ```
  Language: <span class="bg-surface-100 text-surface-600 px-2 py-0.5 rounded text-xs">
    English (Pidgin detected)
  </span>
  ```
- Phone number input auto-prefixes based on market: `+234` for Nigeria, `+971` for Dubai
- Date/time formatting uses market locale via `Intl.DateTimeFormat`
- Number formatting uses market locale via `Intl.NumberFormat`

```typescript
// services/formatters.ts
export function formatDate(date: Date, market: "nigeria" | "dubai"): string {
  const locale = market === "nigeria" ? "en-NG" : "en-AE";
  const tz = market === "nigeria" ? "Africa/Lagos" : "Asia/Dubai";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: tz,
  }).format(date);
}

export function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
```

---

## 5. Responsive Design

### 5.1 Mobile-First Approach

Real estate agents in both markets heavily use phones (WhatsApp is their primary tool). The UI must be fully functional on mobile devices.

**Design Priority:**
1. Mobile (<640px): Primary design target. All features accessible.
2. Tablet (640-1024px): Enhanced layouts with more horizontal space.
3. Desktop (>1024px): Full experience with sidebar, multi-panel views.

### 5.2 Breakpoints

Aligned with Tailwind defaults:

| Breakpoint | Prefix | Min Width | Typical Device |
|------------|--------|-----------|----------------|
| Default | (none) | 0px | Phone portrait |
| `sm` | `sm:` | 640px | Phone landscape / Small tablet |
| `md` | `md:` | 768px | Tablet portrait |
| `lg` | `lg:` | 1024px | Tablet landscape / Small desktop |
| `xl` | `xl:` | 1280px | Desktop |
| `2xl` | `2xl:` | 1536px | Large desktop |

### 5.3 Key Mobile Adaptations

#### Navigation (Mobile)

Desktop sidebar becomes a bottom tab bar + hamburger slide-out on mobile.

```
// Mobile bottom tab bar (visible < lg)
<nav class="fixed bottom-0 inset-x-0 z-50 bg-surface-0 border-t border-surface-200
            flex items-center justify-around py-2 lg:hidden safe-area-pb">
  <a class="flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs {active ? 'text-brand-500' : 'text-surface-400'}">
    <LayoutDashboard class="w-5 h-5" />
    <span>Home</span>
  </a>
  <a class="...">
    <Users class="w-5 h-5" />
    <span>Leads</span>
  </a>
  <a class="...">
    <Calendar class="w-5 h-5" />
    <span>Calendar</span>
  </a>
  <a class="...">
    <BarChart3 class="w-5 h-5" />
    <span>More</span>
  </a>
</nav>

// Mobile header (visible < lg)
<header class="fixed top-0 inset-x-0 z-50 bg-surface-0 border-b border-surface-200
               flex items-center justify-between px-4 h-14 lg:hidden">
  <button onClick={toggleMenu}>
    <Menu class="w-6 h-6 text-surface-700" />
  </button>
  <img src="/logo.svg" class="h-6" />
  <button onClick={toggleNotifications}>
    <Bell class="w-5 h-5 text-surface-700" />
  </button>
</header>

// Mobile slide-out menu (hamburger)
<div class="fixed inset-0 z-[60] bg-black/50 lg:hidden" onClick={closeMenu}>
  <aside class="w-72 h-full bg-surface-900 text-surface-300 overflow-y-auto">
    {/* Same nav items as desktop sidebar */}
  </aside>
</div>
```

**Content Area Padding:**
```
// Accounts for mobile header (56px) + bottom nav (64px)
<main class="pt-14 pb-20 lg:pt-0 lg:pb-0 lg:pl-64">
  <div class="px-4 sm:px-6 lg:px-8 py-6">
    {/* Page content */}
  </div>
</main>
```

#### Lead List (Mobile)

The table transforms into a card list on mobile.

```
// Desktop (>= lg): Standard table
<table class="hidden lg:table min-w-full ...">
  {/* Full table with all columns */}
</table>

// Mobile (< lg): Card list
<div class="lg:hidden space-y-3">
  {leads.map(lead => (
    <div class="bg-surface-0 border border-surface-200 rounded-xl p-4"
         onClick={() => navigate(`/leads/${lead.leadId}`)}>
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center
                      text-xs font-semibold text-brand-700">{initials}</div>
          <div>
            <p class="text-sm font-medium text-surface-800">{lead.contact.name}</p>
            <p class="text-xs text-surface-500">{lead.contact.phone}</p>
          </div>
        </div>
        <span class={urgencyBadgeClass}>{lead.qualification.urgency}</span>
      </div>
      <div class="flex items-center gap-3 text-xs text-surface-500">
        <span class={statusBadgeClass}>{lead.status}</span>
        <span>Score: {lead.qualification.score}</span>
        <span>{formatBudget(lead)}</span>
      </div>
      <p class="mt-2 text-xs text-surface-400">{timeAgo(lead.conversation.lastMessageAt)}</p>
    </div>
  ))}
</div>
```

**Mobile Filters:**
On mobile, filters collapse into a "Filter" button that opens a slide-up bottom sheet.

```
// Filter trigger button (mobile only)
<button class="lg:hidden flex items-center gap-2 px-3 py-2 text-sm font-medium
               text-surface-600 bg-surface-0 border border-surface-200 rounded-lg">
  <Filter class="w-4 h-4" /> Filter
  {activeFilterCount > 0 && (
    <span class="bg-brand-500 text-white text-xs w-5 h-5 rounded-full
                 flex items-center justify-center">{activeFilterCount}</span>
  )}
</button>

// Bottom sheet filter panel
<div class="fixed inset-x-0 bottom-0 z-[60] bg-surface-0 rounded-t-2xl shadow-xl
            max-h-[80vh] overflow-y-auto pb-safe">
  <div class="flex items-center justify-between px-4 py-3 border-b border-surface-200">
    <h3 class="text-base font-semibold text-surface-800">Filters</h3>
    <button class="text-sm text-brand-500" onClick={clearFilters}>Clear All</button>
  </div>
  <div class="p-4 space-y-4">
    {/* All filter controls stacked vertically */}
  </div>
  <div class="px-4 py-3 border-t border-surface-200">
    <button class="w-full py-2.5 text-sm font-medium bg-brand-500 text-white rounded-lg">
      Show {resultCount} Results
    </button>
  </div>
</div>
```

#### Conversation View (Mobile)

On mobile, the conversation thread takes full screen. The lead detail sidebar becomes a slide-up panel triggered by a button.

```
// Mobile: full-screen conversation
<div class="lg:hidden flex flex-col h-[calc(100vh-56px-64px)]">
  <!-- Lead info bar -->
  <div class="flex items-center gap-3 px-4 py-3 bg-surface-0 border-b border-surface-200">
    <button onClick={() => navigate(-1)}>
      <ArrowLeft class="w-5 h-5 text-surface-600" />
    </button>
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-surface-800 truncate">{leadName}</p>
      <div class="flex items-center gap-2">
        <span class={urgencyBadge}>{urgency}</span>
        <span class="text-xs text-surface-500">Score: {score}</span>
      </div>
    </div>
    <button onClick={openLeadDetails} class="text-surface-500">
      <Info class="w-5 h-5" />
    </button>
  </div>

  <!-- Message list (scrollable) -->
  <div class="flex-1 overflow-y-auto px-4 py-3 bg-surface-50">
    {/* ConversationThread messages */}
  </div>

  <!-- Input area -->
  <div class="px-4 py-3 bg-surface-0 border-t border-surface-200 safe-area-pb">
    <div class="flex items-center gap-2">
      <input class="flex-1 px-3 py-2 text-sm border border-surface-200 rounded-full
                    focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
             placeholder={aiActive ? "AI is handling..." : "Type a message..."} />
      <button class="w-9 h-9 bg-brand-500 rounded-full flex items-center justify-center">
        <Send class="w-4 h-4 text-white" />
      </button>
    </div>
    {aiActive && (
      <button class="mt-2 w-full py-2 text-xs font-medium text-brand-500
                     border border-brand-200 rounded-lg">
        Take Over Conversation
      </button>
    )}
  </div>
</div>

// Desktop: two-panel layout (as specified in /leads/:id section)
<div class="hidden lg:grid lg:grid-cols-5 lg:gap-0 h-[calc(100vh-64px)]">
  <div class="lg:col-span-3 flex flex-col border-r border-surface-200">
    {/* Conversation thread */}
  </div>
  <div class="lg:col-span-2 overflow-y-auto p-6">
    {/* Lead detail sidebar */}
  </div>
</div>
```

#### Dashboard (Mobile)

Dashboard widgets stack into a single column on mobile.

```
// Dashboard grid
<div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
  {/* Pipeline metric cards */}
</div>

<div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
  {/* Urgency + Usage widgets side by side on desktop, stacked on mobile */}
</div>

<div class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
  <div class="lg:col-span-2">
    {/* Recent conversations (wider) */}
  </div>
  <div>
    {/* Upcoming appointments + Quick actions */}
  </div>
</div>
```

#### Calendar (Mobile)

On mobile, default to day view (week/month views are too cramped). Show a date strip at top for quick navigation.

```
// Mobile calendar header
<div class="lg:hidden">
  <!-- Horizontal scrollable date strip -->
  <div class="flex overflow-x-auto gap-2 px-4 py-3 bg-surface-0 border-b border-surface-200">
    {weekDates.map(date => (
      <button class={`flex-shrink-0 w-12 py-2 rounded-xl text-center ${
        isToday(date)
          ? 'bg-brand-500 text-white'
          : isSelected(date)
            ? 'bg-brand-50 text-brand-700 border border-brand-200'
            : 'text-surface-600'
      }`}>
        <p class="text-xs">{dayOfWeek}</p>
        <p class="text-lg font-semibold">{dayNum}</p>
      </button>
    ))}
  </div>
  <!-- Day view: list of appointments -->
  <div class="px-4 py-3 space-y-3">
    {dayAppointments.map(appt => (
      <AppointmentCard ... />
    ))}
  </div>
</div>
```

---

## 6. Interaction Patterns

### 6.1 Loading States

Every major view has a skeleton loading state. No blank screens.

**Pattern:**
```typescript
// Generic skeleton component
function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-surface-200 rounded ${className}`} />;
}
```

| View | Loading State |
|------|--------------|
| Dashboard | 4 skeleton metric cards + 3 skeleton list items in each widget |
| Lead List | Filter bar disabled + 8 skeleton table rows |
| Lead Detail | Skeleton message bubbles (3 alternating left/right) + skeleton sidebar fields |
| Calendar | Skeleton grid with placeholder blocks |
| Analytics | Skeleton chart areas (gray rectangles) + skeleton KPI cards |
| Billing | Skeleton pricing cards (3) + skeleton payment history rows |
| Settings | Skeleton form fields |
| Compliance | Skeleton summary cards + skeleton log rows |

**Page-Level Loading:**
```
<div class="flex items-center justify-center h-64">
  <div class="flex flex-col items-center gap-3">
    <Loader2 class="w-8 h-8 text-brand-500 animate-spin" />
    <p class="text-sm text-surface-500">Loading...</p>
  </div>
</div>
```

### 6.2 Empty States

Every list and data view has a meaningful empty state with an illustration, message, and call to action.

| View | Empty State |
|------|------------|
| Dashboard (new user) | "Welcome to AgentFlow AI! Let's get you started." + "Complete Setup" button linking to onboarding |
| Lead List | Users icon + "No leads yet" + "Leads will appear here when they message your WhatsApp number or you add them manually." + "Add Your First Lead" button |
| Lead Detail Conversations | MessageSquare icon + "No messages yet" + "This lead doesn't have any conversation history." |
| Calendar | CalendarX icon + "No appointments scheduled" + "Appointments will appear here when leads book viewings through AI or you create them manually." |
| Analytics | BarChart icon + "Not enough data yet" + "Analytics will populate as you collect leads and book appointments. Check back after your first week." |
| Billing History | Receipt icon + "No payment history" + "Your payment history will appear here after your first subscription payment." |
| Compliance | ShieldCheck icon + "All clear" + "No compliance events to report. This is a good sign." |
| Team Members | UserPlus icon + "No team members yet" + "Invite your agents to collaborate." + "Invite Agent" button |

**Empty State Component:**
```
<div class="text-center py-16 px-4">
  <div class="w-16 h-16 mx-auto rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
    <Icon class="w-8 h-8 text-surface-300" />
  </div>
  <h3 class="text-lg font-medium text-surface-700">{title}</h3>
  <p class="mt-2 text-sm text-surface-500 max-w-sm mx-auto">{description}</p>
  {action && (
    <button class="mt-6 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                   bg-brand-500 text-white rounded-lg hover:bg-brand-600">
      <Plus class="w-4 h-4" /> {actionLabel}
    </button>
  )}
</div>
```

### 6.3 Error States

**Inline Errors (form validation):**
```
<div>
  <label class="block text-sm font-medium text-surface-700 mb-1.5">Phone Number</label>
  <input class="... border-danger-500 focus:border-danger-500 focus:ring-danger-500" />
  <p class="mt-1.5 text-xs text-danger-500 flex items-center gap-1">
    <AlertCircle class="w-3 h-3" /> Please enter a valid phone number with country code
  </p>
</div>
```

**Page-Level Error:**
```
<div class="text-center py-16 px-4">
  <div class="w-16 h-16 mx-auto rounded-2xl bg-danger-50 flex items-center justify-center mb-4">
    <AlertTriangle class="w-8 h-8 text-danger-500" />
  </div>
  <h3 class="text-lg font-medium text-surface-700">Something went wrong</h3>
  <p class="mt-2 text-sm text-surface-500 max-w-sm mx-auto">
    We couldn't load this page. Please check your connection and try again.
  </p>
  <button class="mt-6 px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-lg
                 hover:bg-brand-600" onClick={retry}>
    Try Again
  </button>
</div>
```

**Connection Error Banner:**
```
<div class="bg-danger-50 border-b border-danger-200 px-4 py-2 flex items-center justify-center gap-2">
  <WifiOff class="w-4 h-4 text-danger-500" />
  <p class="text-xs font-medium text-danger-700">You're offline. Changes will sync when reconnected.</p>
</div>
```

### 6.4 Toast Notifications

Used for real-time events pushed from Firestore listeners. Toasts auto-dismiss after 5 seconds. Max 3 visible at once.

**Toast Types and Triggers:**

| Event | Type | Title | Message |
|-------|------|-------|---------|
| New lead from WhatsApp | info | "New Lead" | "{name} sent a message on WhatsApp" |
| Lead scored as hot | warning | "Hot Lead Alert" | "{name} scored {score} -- requires attention" |
| Appointment confirmed | success | "Appointment Confirmed" | "{name} confirmed viewing on {date}" |
| Escalation triggered | danger | "Escalation Alert" | "AI escalated {name} -- {reason}" |
| Payment received | success | "Payment Received" | "{currency}{amount} subscription payment processed" |
| Payment failed | danger | "Payment Failed" | "Subscription payment failed. Please update your payment method." |
| AI approval needed | info | "Approval Needed" | "AI generated a message for {name} -- review required" |
| Agent invited | info | "Team Update" | "{email} has been invited to your team" |
| Usage limit approaching | warning | "Usage Alert" | "You've used {percent}% of your monthly lead limit" |

**Toast Component:**
```
<div class={`bg-surface-0 border border-surface-200 rounded-lg shadow-lg p-4
             flex items-start gap-3 animate-slide-in-right
             border-l-4 ${borderColorByType}`}>
  <div class={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
               ${bgColorByType}`}>
    <Icon class={`w-4 h-4 ${iconColorByType}`} />
  </div>
  <div class="flex-1 min-w-0">
    <p class="text-sm font-medium text-surface-800">{title}</p>
    <p class="text-xs text-surface-500 mt-0.5">{message}</p>
  </div>
  <button class="text-surface-400 hover:text-surface-600 flex-shrink-0"
          onClick={dismiss}>
    <X class="w-4 h-4" />
  </button>
</div>
```

**Implementation:**
```typescript
// contexts/ToastContext.tsx
interface Toast {
  id: string;
  type: "success" | "info" | "warning" | "danger";
  title: string;
  message: string;
  duration?: number; // ms, default 5000
  action?: { label: string; onClick: () => void };
}

// Usage in components:
const { addToast } = useToast();
addToast({
  type: "warning",
  title: "Hot Lead Alert",
  message: `${lead.contact.name} scored ${lead.qualification.score}`,
  action: { label: "View Lead", onClick: () => navigate(`/leads/${lead.leadId}`) },
});
```

### 6.5 Agent Takeover Flow

The agent takeover flow is a critical interaction for transitioning between AI and human control of a conversation.

**State Machine:**

```
AI Active (default)
  |
  v [Agent clicks "Take Over"]
Agent Active
  |
  v [Agent clicks "Resume AI"]
AI Active (with context handoff)
```

**UI States in Conversation View:**

**State: AI Active**
```
// Input area shows:
<div class="bg-surface-50 px-4 py-3 border-t border-surface-200">
  <div class="flex items-center gap-2 mb-2">
    <Bot class="w-4 h-4 text-brand-500" />
    <p class="text-xs text-surface-500">
      {personaName} (AI) is handling this conversation
    </p>
    <span class="w-2 h-2 rounded-full bg-success-500 animate-pulse-dot" />
  </div>
  <button class="w-full py-2.5 text-sm font-medium text-brand-600
                 border border-brand-200 rounded-lg bg-brand-50
                 hover:bg-brand-100 transition-colors">
    <Hand class="w-4 h-4 inline mr-1.5" /> Take Over Conversation
  </button>
</div>
```

**State: Agent Active (after takeover)**
```
// System message inserted in thread:
<div class="flex justify-center mb-3">
  <div class="bg-amber-50 text-amber-700 text-xs px-3 py-1.5 rounded-full
              flex items-center gap-1.5">
    <Hand class="w-3 h-3" /> Agent took over conversation
  </div>
</div>

// Input area:
<div class="px-4 py-3 border-t border-surface-200">
  <div class="flex items-center gap-2">
    <input class="flex-1 px-3 py-2 text-sm border border-surface-200 rounded-lg
                  focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
           placeholder="Type your message..." />
    <button class="px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg
                   hover:bg-brand-600">
      Send
    </button>
  </div>
  <button class="mt-2 w-full py-2 text-xs font-medium text-surface-500
                 border border-surface-200 rounded-lg hover:bg-surface-50">
    <Bot class="w-3.5 h-3.5 inline mr-1" /> Resume AI
  </button>
</div>
```

**Transition Confirmation:**
Taking over shows no confirmation (instant). Resuming AI shows a quick confirmation:
```
// Modal or inline confirmation
<div class="bg-info-50 border border-info-200 rounded-lg p-3 mt-2">
  <p class="text-xs text-info-700">
    Resuming AI will let {personaName} continue the conversation from where you left off.
    The AI will have full context of your messages.
  </p>
  <div class="flex gap-2 mt-2">
    <button class="px-3 py-1 text-xs font-medium bg-brand-500 text-white rounded-lg">
      Resume AI
    </button>
    <button class="px-3 py-1 text-xs font-medium text-surface-600 hover:bg-surface-100 rounded-lg">
      Cancel
    </button>
  </div>
</div>
```

### 6.6 AI Approval Mode UI

When `tenant.aiConfig.approvalMode === true`, AI messages are held for agent review before being sent.

**Dashboard Notification:**
A notification badge appears on the sidebar nav item for "Leads" with the count of pending approvals. The dashboard also shows a widget:

```
<div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
  <div class="flex items-center justify-between mb-3">
    <div class="flex items-center gap-2">
      <Clock class="w-5 h-5 text-amber-500" />
      <h3 class="text-sm font-semibold text-amber-800">Pending AI Messages</h3>
    </div>
    <span class="bg-amber-500 text-white text-xs font-bold w-6 h-6 rounded-full
                 flex items-center justify-center">{count}</span>
  </div>
  <div class="space-y-2">
    {pendingMessages.map(msg => (
      <div class="bg-surface-0 rounded-lg p-3 flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-surface-700">{leadName}</p>
          <p class="text-xs text-surface-500 truncate max-w-[200px]">{messagePreview}</p>
        </div>
        <div class="flex items-center gap-1.5">
          <button class="p-1.5 rounded-lg bg-success-50 text-success-600 hover:bg-success-100">
            <Check class="w-4 h-4" />
          </button>
          <button class="p-1.5 rounded-lg bg-danger-50 text-danger-600 hover:bg-danger-100">
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
    ))}
  </div>
</div>
```

**Conversation Thread (pending message):**
See the "Approval Mode Pending Message" wireframe in Section 3.3 (ConversationThread). The pending message appears with an amber border and Approve/Edit/Reject action buttons inline.

**Approval Mode Toggle:**
Located in Settings > AI Config:
```
<div class="flex items-center justify-between p-4 bg-surface-50 rounded-xl">
  <div>
    <p class="text-sm font-medium text-surface-800">Approval Mode</p>
    <p class="text-xs text-surface-500 mt-0.5">
      Review AI messages before they are sent to leads
    </p>
  </div>
  <button
    role="switch"
    aria-checked={approvalMode}
    class={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${approvalMode ? 'bg-brand-500' : 'bg-surface-300'}`}
    onClick={toggleApprovalMode}
  >
    <span class={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  shadow-sm ${approvalMode ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
</div>
```

### 6.7 Real-Time Update Indicators

When Firestore `onSnapshot` listeners push updates, subtle indicators signal new data without jarring full-page reloads.

**New message in conversation:**
- Auto-scroll to bottom if user is within 100px of the end
- If user has scrolled up, show a floating button:
  ```
  <button class="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-brand-500
                 text-white text-xs font-medium rounded-full shadow-lg
                 flex items-center gap-1.5 animate-fade-in">
    <ArrowDown class="w-3.5 h-3.5" /> New message
  </button>
  ```

**New lead in lead list:**
- Newly arrived leads flash briefly with `bg-brand-50` highlight that fades after 3 seconds
- A toast notification appears for hot leads

**Appointment status change:**
- Calendar event color updates in real-time
- Toast notification for confirmations and cancellations

### 6.8 Confirmation Dialogs

Destructive or significant actions require confirmation:

| Action | Confirmation Type |
|--------|------------------|
| Mark lead as dead | Modal: "Are you sure? This will stop all AI communication." |
| Cancel appointment | Modal: "The lead will be notified via WhatsApp. Continue?" |
| Delete NDPR data | Modal: "This action is irreversible. All lead data will be permanently deleted." (danger style) |
| Disconnect WhatsApp | Modal: "Disconnecting will stop all automated messaging. Continue?" |
| Remove team member | Modal: "Remove {name} from your team? They will lose access immediately." |
| Downgrade subscription | Modal: "Downgrading may reduce your lead limit. {count} leads exceed the new limit." |

**Destructive Confirmation Modal:**
```
<div class="... modal-overlay">
  <div class="bg-surface-0 rounded-2xl shadow-xl w-full max-w-sm p-6">
    <div class="w-12 h-12 rounded-full bg-danger-50 flex items-center justify-center mx-auto mb-4">
      <AlertTriangle class="w-6 h-6 text-danger-500" />
    </div>
    <h3 class="text-lg font-semibold text-surface-800 text-center">{title}</h3>
    <p class="mt-2 text-sm text-surface-500 text-center">{description}</p>
    <div class="flex items-center gap-3 mt-6">
      <button class="flex-1 px-4 py-2.5 text-sm font-medium text-surface-700
                     border border-surface-200 rounded-lg hover:bg-surface-50">
        Cancel
      </button>
      <button class="flex-1 px-4 py-2.5 text-sm font-medium text-white
                     bg-danger-500 rounded-lg hover:bg-danger-700">
        {confirmLabel}
      </button>
    </div>
  </div>
</div>
```

---

## Appendix A: Route-to-Component Mapping

| Route | Page Component | Layout | Auth Required |
|-------|---------------|--------|---------------|
| `/login` | `LoginPage` | None (full screen) | No |
| `/signup` | `SignupPage` | None (full screen) | No |
| `/forgot-password` | `ForgotPasswordPage` | None (full screen) | No |
| `/onboarding/profile` | `ProfileSetupPage` | Onboarding wizard | Yes |
| `/onboarding/ai` | `AIConfigPage` | Onboarding wizard | Yes |
| `/onboarding/integrations` | `IntegrationSetupPage` | Onboarding wizard | Yes |
| `/` (dashboard) | `DashboardPage` | AppShell | Yes |
| `/leads` | `LeadListPage` | AppShell | Yes |
| `/leads/new` | `LeadCreatePage` | AppShell | Yes |
| `/leads/:leadId` | `LeadDetailPage` | AppShell | Yes |
| `/appointments` | `CalendarPage` | AppShell | Yes |
| `/analytics` | `AnalyticsPage` | AppShell | Yes |
| `/billing` | `BillingPage` | AppShell | Yes |
| `/billing/callback` | `PaymentCallbackPage` | AppShell | Yes |
| `/settings` | `SettingsPage` (Profile tab) | AppShell | Yes |
| `/settings/profile` | `ProfileSettings` | AppShell | Yes |
| `/settings/ai` | `AISettings` | AppShell | Yes |
| `/settings/integrations` | `IntegrationSettings` | AppShell | Yes |
| `/settings/team` | `TeamSettings` | AppShell | Yes (Admin) |
| `/compliance` | `CompliancePage` | AppShell | Yes (Brokerage) |
| `*` | `NotFoundPage` | None | No |

## Appendix B: Icon Mapping (Lucide React)

| Usage | Icon Name | Context |
|-------|-----------|---------|
| Dashboard nav | `LayoutDashboard` | Sidebar |
| Leads nav | `Users` | Sidebar |
| Calendar nav | `Calendar` | Sidebar |
| Analytics nav | `BarChart3` | Sidebar |
| Billing nav | `CreditCard` | Sidebar |
| Settings nav | `Settings` | Sidebar |
| Compliance nav | `ShieldCheck` | Sidebar |
| Add/Create | `Plus` | Buttons |
| Search | `Search` | Input prefix |
| Filter | `Filter` | Mobile filter button |
| Close/Dismiss | `X` | Modals, toasts |
| Back | `ArrowLeft` | Navigation |
| Send message | `Send` | Conversation input |
| AI/Bot | `Bot` | AI message indicator |
| Human agent | `User` | Agent message indicator |
| Takeover | `Hand` | Takeover button |
| Hot lead | `Flame` | Urgency indicator |
| Score trend up | `TrendingUp` | Warm lead / analytics |
| Cold lead | `Snowflake` | Urgency indicator |
| WhatsApp | `MessageCircle` | Source icon, integration |
| Phone | `Phone` | Contact display |
| Location | `MapPin` | Appointment location |
| Time/Clock | `Clock` | Pending approval, timestamps |
| Download | `Download` | Export, receipt |
| Warning | `AlertTriangle` | Error states, escalation |
| Info | `Info` | Help text, detail panels |
| Check | `Check` | Success states, selection |
| Logout | `LogOut` | User menu |
| Menu | `Menu` | Mobile hamburger |
| Bell | `Bell` | Notifications |
| Eye | `Eye` | Property viewing |
| Shield | `ShieldCheck` / `ShieldAlert` | Compliance status |
| File | `FileText` | Document attachment |
| Loader | `Loader2` | Spinning loader |
| Wifi off | `WifiOff` | Offline indicator |

## Appendix C: Accessibility Requirements

- All interactive elements must have visible focus rings (`focus:ring-2 focus:ring-brand-500 focus:ring-offset-2`)
- Color is never the sole indicator of state (always paired with text labels or icons)
- All images and icons have `alt` text or `aria-label`
- Form inputs have associated `<label>` elements
- Modals trap focus and are dismissible with Escape key
- Toast notifications have `role="alert"` and `aria-live="polite"`
- Minimum touch target size: 44x44px on mobile (`min-w-[44px] min-h-[44px]`)
- Contrast ratios meet WCAG 2.1 AA standards (4.5:1 for normal text, 3:1 for large text)
- Skip navigation link for keyboard users
- Sortable table headers have `aria-sort` attributes

---

*This UX Design Specification serves as the visual and interaction contract for all frontend development. All page layouts, component styles, and interaction patterns must conform to the design system defined here. Market-specific adaptations are driven by the tenant's `market` field -- never hardcoded per-page.*
