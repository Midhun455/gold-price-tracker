# Gold & Silver Price Tracker

Live price tracker for gold and silver in India with import duty calculations.

## Features
- Live updates every 10 seconds
- Glassmorphism UI design
- 3D flip card to toggle between gold and silver
- Real international rates (XAU/USD, XAG/USD)
- India import duty calculations (6%)
- Per gram and per kg rates
- Automatic fallback values when external providers are unavailable

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env.local` with `METALS_DEV_API_KEY=your_key_here`
4. Run development server: `npm run dev`

## Deployment

Deploy to Vercel and add `METALS_DEV_API_KEY` to the project environment variables.
