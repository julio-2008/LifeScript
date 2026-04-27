# LifeScript — Product Requirements

## Vision
LifeScript is an AI-powered, gamified life-coaching mobile app (Expo React Native). Users answer 10 deep personal questions; Claude Sonnet 4.5 then generates a 7-day plan of micro-missions, a weekly quest, and a personalized welcome quote. Daily progress unlocks XP, levels, badges, streaks, and a shareable "Wrapped"-style life card.

## Tech
- Frontend: Expo (React Native, expo-router file-based routing)
- Backend: FastAPI proxy to Claude Sonnet 4.5 via emergentintegrations Universal Key
- Persistence: AsyncStorage only on device (no MongoDB per user choice)

## Implemented screens
- Splash with pulsing orb + starfield + tagline
- 10-question onboarding (name, age, country, dream, obstacle, hours/day slider, focus area, income, fast-vs-deep, 1-year vision)
- Generating screen with phase rotation (min 4.5s intentional delay)
- Home / Life Map: greeting, streak badge, XP+level card, today's mission, daily AI quote, weekly quest with 7 dots, 6 life-area progress rings, Life Score 0–1000, share map button, Pro banner, boss prompt, floating Coach button
- Mission focused view with circular timer, reflection notes, complete (+50 XP, confetti), badge awarding, streak/level handling
- AI Coach chat (multi-turn, profile-aware, free 3 msgs/day quota)
- Badges collection (25 badges, locked/unlocked grid)
- Profile + settings (avatar picker, stats, recent badges, referral, dark mode toggle, edit goals, restart)
- Share Your Map (Spotify Wrapped style card with native share, +100 XP first share)
- Upgrade Pro screen (countdown, before/after split, monthly/yearly plans, MOCKED purchase)
- Boss Battle (3-day intensive, AI generated, completion grants Boss Slayer badge)
- Level Up celebration (confetti + animated icon)
- Edit goals (regenerates plan)

## Backend endpoints
- `GET /api/health` — sanity check
- `POST /api/ai/initial-plan` — 7 missions + weekly quest + welcome quote
- `POST /api/ai/daily-quote` — personalized quote
- `POST /api/ai/coach-chat` — multi-turn coach with full user context
- `POST /api/ai/boss-battle` — 3-day intensive
- `POST /api/ai/regenerate-mission` — replace a single mission

## Gamification
- 6 levels: Beginner → Seeker → Builder → Achiever → Legend → Sovereign (XP gates 0/250/700/1500/3000/6000)
- 25 badges with auto-award rules
- Streak with shield protection (1 starting shield, more earned via referrals)
- Life Score 0–1000 = areaAvg*0.6 + xpFactor*0.3 + streakFactor*0.1

## Mocked
- **Pro upgrade purchase is MOCKED**: tapping Activate just toggles a local flag. No payment integration.
- **Referrals are MOCKED**: each share invocation increments referral count locally to demo the 3-friend Pro unlock.

## Smart business enhancement
- Referral monetization loop: tapping the Share button on the Profile auto-bumps the referral counter; reaching 3 referrals flips `pro` to true locally — designed to drive aggressive organic sharing in production once tied to a real backend.
