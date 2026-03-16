#🎙️ Echo Order

> **Voice-powered restaurant ordering with AI-driven conversations**

<div align="center">

### 🏆 Logic Legends Badge Winner 🏆

*Built with FastAPI • React • Groq AI*

</div>

---

## 🚀 What is Echo Order?

Echo Order revolutionizes restaurant ordering by letting customers **speak naturally** to place orders. No buttons, no menus to scroll through—just talk and order. Behind the scenes, an AI assistant understands your request, checks availability in real-time, and confirms your order instantly.

Admins get a powerful dashboard to manage the entire restaurant through **voice commands**—add menu items, update prices, track orders, all hands-free.

---

## ✨ Highlights

### 🗣️ **Natural Voice Ordering**
Talk like you're ordering from a waiter. AI matches your words to menu items, handles plurals, and suggests alternatives if something's unavailable.

### ⚡ **Lightning Fast**
Real-time menu updates. When admin removes an item, customers can't order it—instantly. No stale data, no failed orders.

### 🎨 **Beautiful Admin Dashboard**
Animated tabs, live stats, and a clean dark theme. Switch between orders, menu items, and users with smooth transitions.

### 🧠 **Smart AI Assistant**
- Calls the database before every order to ensure availability
- Matches fuzzy requests ("burger" → "Classic Cheeseburger")
- Suggests similar items when something's unavailable
- Confirms orders before placing them

### 🎯 **Real-Time Everything**
Menu updates? Instant. Order status changes? Live. Revenue stats? Updated on every order. Zero refresh delays.

---

## 🎭 Two Modes, One System

### 👤 Customer Experience
1. **Speak Your Order** - Click mic, say what you want
2. **AI Confirms** - "You want 2 Burgers and a Coke, right?"
3. **Instant Feedback** - Order number + total in seconds
4. **Print Bill** - One-click checkout button

### 👨‍💼 Admin Experience
1. **Voice Commands** - "Add Pasta for $15", "Mark item 3 unavailable"
2. **Dashboard Insights** - Total orders, revenue, pending status
3. **Live Tables** - Orders with item pills, menu with availability dots
4. **Tab Navigation** - Orders → Menu → Users with smooth animations

---

## 🛠️ Built With

**Backend:** FastAPI • SQLAlchemy • Groq SDK • bcrypt • Pydantic

**Frontend:** React 19 • Vite • React Router • Groq TTS • MediaRecorder API

**AI:** Llama 3.3 70B with function calling • Real-time tool orchestration

**Database:** SQLite (async) • In-memory sessions

---

## 📸 Key Features Deep Dive

### 🔊 Voice Pipeline
```
Customer speaks → MediaRecorder captures audio → Groq transcribes
→ AI calls get_menu tool → Matches items → Confirms with user
→ place_order tool creates DB entry → TTS reads confirmation
```

### 🎯 Smart Item Matching
- **Case-insensitive**: "BURGER" = "burger" = "Burger"
- **Plurals**: "fries" matches "French Fries"
- **Partial names**: "pepperoni" → "Pepperoni Pizza"
- **Disambiguation**: "pizza" → "Which one? Margherita or Pepperoni?"

### 🔒 Role-Based Auth
- Session tokens stored in-memory
- `require_admin` dependency guards admin routes
- Passwords hashed with bcrypt
- Customer/Admin toggle on login page

### 📊 Admin Dashboard Tabs
- **Orders**: ID, items (pills with quantity badges), total, status, date
- **Menu Items**: Name, category, price, availability dot
- **Users**: Username, email, role badge, join date

Each tab has a smooth 400ms fade-in + slide-up animation.

---

## 🧩 Architecture Overview

```
┌─────────────────────────────────────────────────┐
│             React Frontend (Vite)                │
│  ┌──────────────┐  ┌────────────────────────┐   │
│  │ Customer     │  │ Admin Dashboard +      │   │
│  │ Voice Chat   │  │ Admin Voice Commands   │   │
│  └──────────────┘  └────────────────────────┘   │
└─────────────────────────────────────────────────┘
                       ↕ HTTP/JSON
┌─────────────────────────────────────────────────┐
│            FastAPI Backend (Uvicorn)             │
│  ┌──────────────┐  ┌────────────────────────┐   │
│  │ Voice Router │  │ Admin Router           │   │
│  │ (Customer)   │  │ (Protected)            │   │
│  └──────────────┘  └────────────────────────┘   │
│           ↕                  ↕                   │
│  ┌──────────────────────────────────────────┐   │
│  │      LLM Orchestrator (Groq SDK)         │   │
│  │  • get_menu  • place_order               │   │
│  │  • create_menu_item  • update_item       │   │
│  └──────────────────────────────────────────┘   │
│           ↕                  ↕                   │
│  ┌──────────────────────────────────────────┐   │
│  │    SQLAlchemy (Async) + SQLite           │   │
│  │  User • MenuItem • Order • OrderItem     │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## 🎨 Design Philosophy

**Dark Theme** - Easy on the eyes, modern aesthetic

**Cyan + Orange Accents** - Cyan for success/revenue, Orange for pending/admin

**Smooth Animations** - 400ms cubic-bezier transitions, no jarring changes

**Voice-First** - Everything controllable via speech, UI is secondary

**Real-Time Data** - No polling, no stale caches—fetch fresh on every action

---

## 🔥 Cool Implementation Details

- **LLM Function Calling**: AI has tools like `get_menu()` and `place_order()` that it can call automatically
- **Multi-Round Orchestration**: AI can chain multiple tool calls (check menu → confirm → place order)
- **Async Everything**: SQLAlchemy async, Groq SDK in thread pool, FastAPI native async
- **Singleton Pattern**: Restaurant profile is one row, upserted on save
- **Eager Loading**: `selectinload` prevents N+1 queries when fetching orders + items
- **Session Management**: Token-based with in-memory dict (fast but ephemeral)
- **Error Messages**: Tool errors include user-friendly messages for the AI to read aloud

---

## 📂 Repository Structure

```
Echo-Order/
├── backend/           # FastAPI server
│   ├── database/      # Models + engine
│   ├── routers/       # API endpoints
│   ├── services/      # LLM orchestration
│   ├── tools/         # Function calling definitions
│   └── main.py        # Entry point
└── frontend/          # React app
    └── src/
        ├── components/  # UI components
        └── context/     # Auth state
```

---

## 🙌 Credits

**Tech Stack:** FastAPI, React, Groq, SQLAlchemy

**AI Model:** Llama 3.3 70B Versatile

**Recognition:** 🏆 Logic Legends Badge Winner

---

<div align="center">

**Made with ❤️ and lots of ☕**

*Voice-powered • AI-driven • Real-time*

</div>
