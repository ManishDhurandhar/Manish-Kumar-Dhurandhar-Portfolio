# 🚀 Manish Dhurandhar | Full-Stack Engineer Portfolio
### 🌐 Live Production Deployment: [manishdhurandhar.vercel.app](https://manishdhurandhar.vercel.app/)

Welcome to my production-grade, highly responsive, full-stack portfolio platform. Engineered as a seamless blend of immersive frontend layouts and robust backend orchestration, this platform integrates real-time serverless components, live third-party REST pipelines, and an advanced dual-layer AI conversational runtime.

---

## 🛠️ System Architecture & Engineering Stack

The platform is explicitly decoupled into a high-performance Single Page Application (SPA) tracking micro-interactions, backed by a persistent cloud-routing serverless architecture deployed over Vercel's global edge network.

* **Frontend Hub:** React 19 + TypeScript (Strict Compiler Enforcement)
* **Build Infrastructure:** Vite + SWC (Optimized Hot Module Replacement & Tree-Shaking Compilation)
* **Design Core:** Tailwind CSS v4 (Leveraging native `@theme` configurations and custom modern `@utility` styling layers)
* **Motion Core:** Framer Motion (Hardware-accelerated layout transitions and dynamic UI physics)
* **Asynchronous Backend:** Express.js + Node.js (Deployed via serverless lambda execution environments)
* **Cloud Infrastructure:** Vercel Runtime Engine (Optimized using customized dynamic routing proxies and configurations)

---

## ⚡ Live Dynamic Enterprise Integrations

### 🧠 1. Dual-Layer AI Copilot Engine (GPT-4o-mini + Gemini Failover)
* **Primary Core:** Implements the official OpenAI SDK routed through GitHub Models Marketplace endpoint to access **GPT-4o-mini** completely free.
* **Secondary Fallback:** Backed by Google’s modern `@google/genai` API SDK. If the primary GPT engine hits its rate limits or faces downtime, the backend automatically fails over to Gemini seamlessly without breaking the user experience.
* **Smart Persona:** Programmed with a sharp, sarcastic, and humorous tech persona that handles coding queries, roasts off-topic questions (like cooking recipes), and fast-tracks recruiters directly to my resume.

### 📊 2. Real-Time Analytics & Database Counter (MongoDB Atlas Cluster)
* Features an atomic, asynchronous counter that records and tracks traffic instances without causing frontend render-blocking.
* Connects seamlessly with a remote, multi-region MongoDB Atlas cluster via Mongoose object modeling layers.
* Safely updates global page interactions asynchronously on structural DOM mounting milestones.

### 🎵 3. Live Spotify Lifecycle Tracker (Spotify REST OAuth Flow)
* Integrates a persistent, server-side background job utilizing the official Spotify Web Account Service.
* Utilizes a secure `SPOTIFY_REFRESH_TOKEN` parameter stored within protected environment slots to silently generate ephemeral Access Tokens automatically without manual user re-authentication.
* Fetches live track schemas, structural metrics, playing contexts, and high-res cover vectors instantly into the dynamic media component.

---

## 🗺️ Project Directory Mapping

The codebase leverages a clean, industry-standard modular directory layout optimized to pass serverless bundlers cleanly:

```text
├── api/                 # Serverless backend API lambda handlers (Express routes)
├── public/              # Static assets, vectors, and global production media
├── src/                 # Main frontend codebase applications
│   ├── components/      # Modular UI layers (layout wrappers, interface elements)
│   ├── App.tsx          # Primary viewport state orchestrator and central routing portal
│   ├── main.tsx         # Application instantiation baseline and strict DOM mounting target
│   ├── index.css        # Tailwind v4 injection layer and dark/light token mappings
│   └── utils.ts         # Global class variance matching and Tailwind merge utilities
├── .env.example         # Template for environment constants configuration
├── package.json         # Master dependency manifest and cloud execution scripts
├── tsconfig.json        # TypeScript compiler configurations and target bindings
├── vercel.json          # Production cloud routing config and api/frontend proxy maps
└── vite.config.ts       # Vite bundler pipelines and optimization compilation layers
