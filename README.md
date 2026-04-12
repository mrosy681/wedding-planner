# 💍 Wedding Planner — July 24, 2027

A shared wedding planning app backed by **Netlify Blob Storage**. All data persists in the cloud and is accessible to anyone you share the URL with.

## Features

- 💌 **Guest List** — Names, addresses, emails, RSVP status, meal preferences, +1 tracking
- 🎪 **Vendors** — Evaluate and track vendors with quotes, status, websites, and notes
- 💰 **Expenses** — Budget categories, payment scheduling by month, mark payments as paid
- 🎁 **Gift Tracker** — Log gifts with values and track thank-you notes
- 🏨 **Hotels** — Track hotels to recommend to guests, with room block codes and deadlines

---

## 🚀 Deployment Guide

### Prerequisites
- A [GitHub](https://github.com) account
- A [Netlify](https://netlify.com) account (free tier works perfectly)

---

### Step 1 — Create a GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Name your repository (e.g., `our-wedding`)
3. Set it to **Private** (recommended)
4. Click **Create repository**

---

### Step 2 — Push this project to GitHub

```bash
cd wedding-planner
git init
git add .
git commit -m "Initial commit — wedding planner"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/our-wedding.git
git push -u origin main
```

---

### Step 3 — Deploy to Netlify

1. Log in to [app.netlify.com](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** and authorize Netlify
4. Select your `our-wedding` repository
5. Build settings (auto-detected from `netlify.toml`):
   - **Build command:** *(leave empty)*
   - **Publish directory:** `.`
   - **Functions directory:** `netlify/functions`
6. Click **"Deploy site"**

---

### Step 4 — Enable Netlify Blobs

Netlify Blobs are **automatically enabled** for all Netlify sites — no extra setup needed! The app will start storing data immediately after deployment.

---

### Step 5 — Install dependencies (for Netlify Functions)

In your Netlify site dashboard:
1. Go to **Site configuration → Environment variables**
2. No variables needed — Blobs authenticate automatically via Netlify's runtime

Netlify will automatically install `@netlify/blobs` when building the functions.

---

### Step 6 — Share the URL

Once deployed, Netlify gives you a URL like:
```
https://our-wedding-abc123.netlify.app
```

Share this with your partner, wedding party, or family!

---

## 🔧 Local Development

To run locally with `netlify dev`:

```bash
npm install
npx netlify dev
```

> You'll need the [Netlify CLI](https://docs.netlify.com/cli/get-started/) and to be logged in (`netlify login`).

---

## 📁 Project Structure

```
wedding-planner/
├── index.html                  # The full app UI
├── netlify.toml               # Netlify configuration
├── package.json               # Dependencies
├── netlify/
│   └── functions/
│       └── api.mjs            # Serverless API (Blob Storage CRUD)
└── README.md
```

---

## 🗂 Data Storage

All data is stored in **Netlify Blob Storage** under these stores:
- `wedding-guests`
- `wedding-vendors`
- `wedding-expenses`
- `wedding-gifts`
- `wedding-hotels`
- `wedding-categories`

Data persists across sessions and is shared by everyone who accesses the site.

---

## 💡 Tips

- **Budget tracking**: Go to Expenses → click "+ Category" to set budgets per category
- **Vendor → Expense link**: When adding a payment, link it to a booked vendor
- **Monthly view**: Filter expenses by month to see cash flow timing
- **Hotel recommendation**: Mark your top hotel pick as "Recommended" — it gets a gold banner
- **Thank-you notes**: Use the "✓ TY Sent" quick button in the Gift Tracker to mark notes sent

---

*Made with ❤️ for July 24, 2027*
