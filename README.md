# Gold & Silver Price Tracker

Live price tracker for gold and silver in India with import duty calculations.

## Features
- Live updates every 2 seconds
- Glassmorphism UI design
- 3D flip card to toggle between gold and silver
- Real international rates (XAU/USD, XAG/USD)
- India import duty calculations (6%)
- Per gram and per kg rates

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Get API key from [gold-api.com](https://www.gold-api.com/)
4. Create `.env.local` with your API key
5. Run development server: `npm run dev`

## Deployment

Deploy to Vercel with environment variables:
- `GOLD_API_KEY`: Your gold-api.com API key
