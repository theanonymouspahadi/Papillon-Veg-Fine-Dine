# Production Deployment & Architecture Guide - Papillon Veg Fine Dine

This guide explains how the communication between the frontend (`index.html`, `admin.html`) and backend (`server.js`) works locally and how to deploy it to production using Git.

---

## 1. How Communication Works (Client-Server Architecture)

```
+-----------------------------------------------------------------------------------+
|                            SINGLE DEPLOYED DOMAIN                                 |
|                       (e.g., https://papillonveg.com)                             |
|                                                                                   |
|  +------------------------------+             +--------------------------------+  |
|  | Customer Website             |             | Manager Admin Portal           |  |
|  | (index.html + js/app.js)     |             | (admin.html + js/admin.js)     |  |
|  +--------------+---------------+             +---------------+----------------+  |
|                 |                                             |                   |
|                 | fetch('/api/leads')                         | fetch('/api/menu')|
|                 +----------------------+----------------------+                   |
|                                        |                                          |
|                                        v                                          |
|  +-----------------------------------------------------------------------------+  |
|  |                        Node.js REST Server (server.js)                      |  |
|  |                                                                             |  |
|  |  - Serves static web pages (index.html, admin.html, styles.css)           |  |
|  |  - Listens to HTTP API requests (/api/leads, /api/menu)                   |  |
|  |  - Reads/Writes persistent data (data/leads.json, data/menu.json)         |  |
|  +-------------------------------------+---------------------------------------+  |
+----------------------------------------|------------------------------------------+
                                         |
                                         v
                         +-------------------------------+
                         | Database / Storage            |
                         | (data/leads.json & menu.json) |
                         +-------------------------------+
```

### Why Relative Paths (`fetch('/api/leads')`) Are Powerful
In our code, JavaScript uses relative paths:
```js
fetch('/api/leads', { method: 'POST', body: JSON.stringify(booking) });
```
- **Locally**: `/api/leads` resolves to `http://localhost:3000/api/leads`.
- **In Production**: If deployed at `https://papillonveg.com`, `/api/leads` automatically resolves to `https://papillonveg.com/api/leads`.
- **Result**: You do not need to change a single line of code when moving from local development to production!

---

## 2. Deployment Options

### Option A: Single Node.js Hosting (Recommended - 5 Minutes Setup)
Deploy the entire project (`server.js` + web pages) together on a platform like **Render**, **Railway**, or **AWS EC2**.

- **Best Platforms**: [Render.com](https://render.com) (Free Tier available), [Railway.app](https://railway.app).
- **How it works**:
  1. The platform detects `server.js` and runs `node server.js`.
  2. The cloud provider automatically assigns an SSL domain (e.g. `https://papillon-veg-dine.onrender.com`).
  3. `server.js` handles both serving the web pages and processing reservations & menu updates.

---

### Option B: Separate Frontend (Vercel/Netlify) + Separate Backend (Render)
If you prefer hosting static pages on **Vercel** or **Netlify** and the API on **Render**:

1. Deploy `server.js` to Render (URL: `https://papillon-api.onrender.com`).
2. Update `js/app.js` and `js/admin.js` to use an Environment API Base URL:
   ```js
   const API_BASE = window.location.hostname === 'localhost' 
     ? '' 
     : 'https://papillon-api.onrender.com';

   fetch(`${API_BASE}/api/leads`);
   ```
3. Our `server.js` already includes CORS headers (`Access-Control-Allow-Origin: *`), so cross-domain requests will work smoothly.

---

## 3. Step-by-Step Deployment Instructions (Using Git & Render)

### Step 1: Create a `.gitignore` File
Create a file named `.gitignore` in your project folder to exclude unnecessary local files:
```
node_modules/
.DS_Store
*.log
```

### Step 2: Push Your Code to GitHub
Open your terminal in `C:\Users\prajj\.gemini\antigravity-ide\scratch\papillon-veg-fine-dine` and run:
```bash
git init
git add .
git commit -m "Initial commit: Papillon Veg Fine Dine full-stack app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/papillon-veg-fine-dine.git
git push -u origin main
```

### Step 3: Deploy to Render.com (Free)
1. Sign up at [Render.com](https://render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository `papillon-veg-fine-dine`.
4. Configure settings:
   - **Name**: `papillon-veg-fine-dine`
   - **Environment**: `Node`
   - **Build Command**: *(leave blank or `npm install`)*
   - **Start Command**: `node server.js`
5. Click **Create Web Service**.

Within 2 minutes, your website will be live at a public URL like:
`https://papillon-veg-fine-dine.onrender.com`

---

## 4. Production Data Persistence Note

In cloud environments (like Render or Railway free tiers), file changes in `data/leads.json` and `data/menu.json` may reset if the server restarts after inactivity.

**To make data 100% permanent in production**:
- Attach a **Persistent Disk** on Render (e.g. mount `/data`), OR
- Swap `data/leads.json` for a free cloud database like **MongoDB Atlas** or **Supabase (PostgreSQL)**.
