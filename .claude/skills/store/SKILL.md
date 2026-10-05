---
name: store
description: Use when a project ships to the Apple App Store or Google Play - wrapping the Vue or Nuxt app with Capacitor, in-app subscriptions with RevenueCat, paywall and free trial choices, TestFlight and Play testing tracks, App Review rejections (4.2 minimum functionality, 3.1.1 in-app purchase), store listings, or a PLAN.md that says iOS, Android or "an app in the store".
---

# Store

Checked 2026-10-05. Markers: **[S]** search results agree; **[K]** known but not re-read. At
every new store project the operator re-checks each [K] line against Apple's and Google's own
pages (review guidelines, Play Console help), fixes this file and updates the date. Everything here reuses the web app: same repo,
same Worker API, same `verify`, same gate.

## 0. Web or store?

| Buyers find it by | Ship as | Pay with |
|---|---|---|
| Searching the App Store (journal, habit, fitness, mood, kids) | Capacitor app, the web version stays as the probe and a sign-up path | RevenueCat (IAP in the app, its Web Billing on Stripe for the web) |
| Googling it, or a business pays | Web app or PWA (`toolbox` → `catalog/app-platform.md`) | `sell` (Stripe) |
| Not sure yet | Web first: the `operator`'s probe is a web page either way | |

**One code, three platforms.** The same Vue app runs on the web (Workers Builds, live on merge),
Android and iOS (Capacitor). Changes to HTML, CSS and JS can reach the installed apps without a
store review through a live-update service (Capgo) as long as the app's purpose stays as reviewed;
anything native (a new plugin, permissions) needs a new store build and review [S].

**Release order** (yskills, 2026-10-05): web first, then Google Play, then iOS. Start Google's
14-day test as soon as the web version has users. Add iOS when Play shows people starting
trials, not only after money: from download to paid, iOS converts 2.6% and Android 0.9%
([RevenueCat](https://www.revenuecat.com/blog/engineering/android-paywall-gap)) [S], so most of the
money is on iOS.

Consumer subscriptions live in the stores: Health & Fitness apps convert trials best of all
categories, and annual plans bring 60.6% of that category's revenue
([RevenueCat 2026](https://www.revenuecat.com/state-of-subscription-apps)) [S].

## 1. One-time setup (yskills, in brief (b))

Claude can't sign contracts, pay fees or verify identity. Numbered steps for yskills:

1. Apple Developer Program, €99 a year, as an individual (an organisation needs a D-U-N-S
   number): https://developer.apple.com/programs/enroll/ [K]
2. App Store Connect: accept the Paid Apps agreement, add tax and bank details:
   https://appstoreconnect.apple.com/agreements [K]
3. EU trader status in App Store Connect (Business): anyone earning through the store is a
   trader, and the address, phone and email are shown on the EU product page. Without it the app
   is not sold in the EU [S].
   [Apple help](https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements/)
4. Google Play Console, $25 once: https://play.google.com/console/signup [K]. A personal account
   created after 2023-11-13 must run a closed test with **12 testers opted in for 14 days in a
   row** before production [S]
   ([Play help](https://support.google.com/googleplay/android-developer/answer/14151465)).
   Recruit them from the probe's waitlist and start the test during the build, not after it.
5. RevenueCat account (free up to $2,500 monthly tracked revenue, then 1% [S]):
   https://app.revenuecat.com/signup. Its public SDK keys go into the app (they are public by
   design); the secret API key only into the Worker's secrets.
6. Once the build has a paywall: create the subscription products (annual with trial, monthly)
   in App Store Connect and Play Console, add them to RevenueCat's `pro` entitlement, and add an
   Apple sandbox tester. Claude writes the exact product ids and prices into the steps.
7. When the device pass (§4) is green and Google's 14 days are over: submit for App Review and
   apply for Play production access. Each is a button only yskills can press.

## 2. Build it

- **Wrap:** `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`. Nuxt
  builds a static client (`ssr: false`, `nuxi generate`, `webDir: .output/public`); Vue + Vite
  uses `dist`. The app calls the Worker by its absolute https URL; allow the origins
  `capacitor://localhost` and `https://localhost` in its CORS list.
- **Native depth, or Apple rejects it under 4.2** (the most common rejection for wrapped web
  apps [S]): ship at least three of local notifications (`@capacitor/local-notifications`, e.g. a
  daily reminder), offline storage, the share sheet (`@capacitor/share`), haptics, a Face ID /
  fingerprint lock (a community plugin: read it first, `toolbox` §3), a home-screen widget.
- **Login:** use email link or passkeys in the app. Google blocks its sign-in inside embedded
  webviews [K], and Google login makes Apple ask for Sign in with Apple too (4.8) [K], which adds
  a Services ID and key to §1. If social login is needed anyway, open it in the system browser
  (`@capacitor/browser`) and return by deep link. Send the session as a bearer token (Better
  Auth `bearer` plugin), not a cookie: cookies across `capacitor://localhost` are unreliable [K].
- **Offline:** keep a local copy (`@capacitor-community/sqlite` or `@capacitor/preferences`),
  sync with the Worker by `updated_at` per record, last write wins; a journal entry written
  offline must never be lost.
- **Money:** `@revenuecat/purchases-capacitor`; the web version sells the same `pro` through
  RevenueCat Web Billing (Stripe underneath), so one subscription works on all three. Call `Purchases.logIn(<our user id>)` after
  login so RevenueCat's user is ours. The Worker learns about purchases from RevenueCat's webhook
  (shared secret in the `Authorization` header, a Worker secret), stores the entitlement in D1
  and unlocks `pro` features from there. Anything digital unlocked inside the app is an
  in-app purchase (3.1.1) [K]; the app shows no Stripe checkout and no links to one. One
  RevenueCat entitlement (e.g. `pro`) covers both stores and the web.
- **Paywall defaults** (RevenueCat 2026 [S]): 89.4% of trials start on install day, so "try it
  first" means an onboarding that shows the value in the first minutes, then the paywall in the
  same session, not days of free use. After that onboarding, annual plan with a free trial
  preselected (default 14 days), monthly next to it. Longer trials convert better (17-32 days: 45.7% vs 3-7 days:
  26.8%). A hard paywall converts about 5x freemium (10.7% vs 2.1%) with the same first-year
  retention. Default: hard paywall with the trial; probe sign-ups get the same trial. A free
  tier only when PLAN.md says growth comes from free users sharing. People already paying
  through Stripe on the web keep that subscription: connect Stripe to RevenueCat so it grants the
  same `pro` [K].
- **Store fees:** 15% in Apple's and Google's small-business programs (first $1M a year) [K];
  enrol in both before the first sale.
- **Required by review** [K]: account deletion inside the app if it has accounts (5.1.1(v)); a
  Sign in with Apple-equivalent privacy login if it offers Google login (4.8); "Restore
  purchases" on the paywall; App Privacy answers that match the Datenschutz page.

## 3. Native builds without keys in GitHub

Cloud threads change web code and `capacitor.config.ts`; they can't build iOS. Signing keys never
go into GitHub (`publish` skill rule):

- **iOS:** Xcode Cloud, 25 compute hours a month included with the developer program [S];
  signing stays at Apple. It builds on merge to `main` and uploads to TestFlight. Creating the
  workflow once needs Xcode on a Mac; without one, Codemagic holds the keys instead.
- **Android:** Play App Signing holds the app key. The upload key stays on yskills' PC (Android
  Studio, `npx cap open android`) or in Codemagic; builds go to the closed or internal track.

## 4. Gate on the store path

The `operator` gate runs unchanged on the web preview, which is the same code. Per release, add
one device pass on a TestFlight / internal-track build, recorded in the PR: installs and opens
offline, sandbox purchase unlocks `pro`, restore works, account deletion works, notifications
arrive. `legal-reviewer` checks the store listing's privacy answers against the Datenschutz, and
the `legal` skill's AI and account rules apply in the app as on the web. The listing needs the
Datenschutz URL, an age rating, and the export-compliance answer (standard HTTPS only: exempt
[K]).

## 5. The listing

German listing first, English second. From the probe's winning message, not from scratch:
title and subtitle (30 characters each on iOS), keywords field (100 characters), 5-8 screenshots
that each state one benefit in large text [K]. `impeccable` and `design-critic` review the
screenshots like any UI.

## Common mistakes

| Mistake | Instead |
|---|---|
| Submitting the web app in a shell | Three native features from §2 before the first submission |
| Starting Google's 14-day test at launch | Start it during the build with 12+ testers from the waitlist |
| Stripe checkout or a "buy on our site" link in the app | IAP through RevenueCat; Stripe only on the web |
| Upload or signing keys as GitHub secrets | Xcode Cloud, Play App Signing, Codemagic |
| Trader status skipped | Set it before the first EU release |
