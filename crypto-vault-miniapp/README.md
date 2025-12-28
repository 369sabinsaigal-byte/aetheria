# Crypto Vault Mini App

Frontend interface for the Crypto Trading Vault Telegram Bot.

## Features

- 💎 **Premium Dark Theme** with glassmorphism and vibrant gradients
- 📱 **Telegram Mini App Integration** using official SDK
- ⚡ **Fast & Modern** - React 18 + TypeScript + Vite
- 🎨 **Stunning UI** with smooth animations and micro-interactions
- 📊 **Trading Dashboard** with portfolio, assets, and activity tracking

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── App.tsx          # Main app component with dashboard
├── App.css          # Premium styling with design system
├── telegram.ts      # Telegram SDK integration utilities
├── main.tsx         # App entry point
└── index.css        # Base styles
```

## Telegram Integration

The app automatically initializes the Telegram WebApp SDK:
- Expands viewport to full height
- Applies Telegram theme colors
- Retrieves user information
- Enables closing confirmation

## Design System

### Color Palette
- Primary Background: `#0f0f1e`
- Secondary Background: `#1a1a2e`
- Accent Gradient: Purple to Indigo
- Success: `#10b981`
- Text: White with opacity variants

### Key Features
- Glassmorphism effects with backdrop blur
- Smooth hover animations and transitions
- Responsive grid layouts
- Mobile-first design

## Available Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Deployment

This app can be deployed to:
- **Vercel** (recommended for frontend)
- **Netlify**
- **Railway**
- Any static hosting service

Make sure to update your Telegram bot's menu button URL with the deployed link.

## Environment Variables

No environment variables are required for the frontend. All configuration is handled through the Telegram SDK.
