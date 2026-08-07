// Papillon Veg Fine Dine - REST API Backend Server with Lead & Menu Management
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const MENU_FILE = path.join(DATA_DIR, 'menu.json');

// Ensure data directory exist
try { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true }); } catch(e){}

// Helpers for Data Files
function readJSON(file, fallback = []) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    return fallback;
  }
}

function writeJSON(file, data) {
  try { fs.writeFileSync(file, JSON.stringify(data, null, 2)); } catch(e){}
}

// MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // --- API ENDPOINTS FOR LEADS ---

  // GET /api/leads
  if (req.method === 'GET' && pathname === '/api/leads') {
    const leads = readJSON(LEADS_FILE);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(leads));
    return;
  }

  // POST /api/leads
  if (req.method === 'POST' && pathname === '/api/leads') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const newLead = JSON.parse(body);
        if (!newLead.id) {
          newLead.id = (newLead.type && newLead.type.includes('Banquet') ? 'BANQUET-' : 'PAPILLON-') + Math.floor(1000 + Math.random() * 9000);
        }
        if (!newLead.createdAt) newLead.createdAt = new Date().toLocaleString();
        if (!newLead.status) newLead.status = newLead.type && newLead.type.includes('Banquet') ? 'Inquiry Received' : 'Confirmed';

        const leads = readJSON(LEADS_FILE);
        leads.unshift(newLead);
        writeJSON(LEADS_FILE, leads);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, lead: newLead }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // PUT /api/leads/:id
  if (req.method === 'PUT' && pathname.startsWith('/api/leads/')) {
    const id = pathname.replace('/api/leads/', '');
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const updates = JSON.parse(body);
        const leads = readJSON(LEADS_FILE);
        const index = leads.findIndex(l => l.id === id);

        if (index === -1) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Lead not found' }));
          return;
        }

        leads[index] = { ...leads[index], ...updates };
        writeJSON(LEADS_FILE, leads);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, lead: leads[index] }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // DELETE /api/leads/:id
  if (req.method === 'DELETE' && pathname.startsWith('/api/leads/')) {
    const id = pathname.replace('/api/leads/', '');
    let leads = readJSON(LEADS_FILE);
    leads = leads.filter(l => l.id !== id);
    writeJSON(LEADS_FILE, leads);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, deletedId: id }));
    return;
  }

  // --- API ENDPOINTS FOR MENU MANAGEMENT ---

  // GET /api/menu
  if (req.method === 'GET' && pathname === '/api/menu') {
    const menu = readJSON(MENU_FILE);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(menu));
    return;
  }

  // POST /api/menu (Add Dish)
  if (req.method === 'POST' && pathname === '/api/menu') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const newItem = JSON.parse(body);
        newItem.id = 'item-' + Date.now();
        if (!newItem.image) newItem.image = 'assets/images/hero.png';
        if (!newItem.tags) newItem.tags = [];
        
        const menu = readJSON(MENU_FILE);
        menu.unshift(newItem);
        writeJSON(MENU_FILE, menu);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, item: newItem }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // PUT /api/menu/:id (Update Dish / Price / Category)
  if (req.method === 'PUT' && pathname.startsWith('/api/menu/')) {
    const id = pathname.replace('/api/menu/', '');
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const updates = JSON.parse(body);
        const menu = readJSON(MENU_FILE);
        const index = menu.findIndex(m => m.id === id);

        if (index === -1) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Item not found' }));
          return;
        }

        menu[index] = { ...menu[index], ...updates };
        writeJSON(MENU_FILE, menu);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, item: menu[index] }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // DELETE /api/menu/:id (Delete Dish)
  if (req.method === 'DELETE' && pathname.startsWith('/api/menu/')) {
    const id = pathname.replace('/api/menu/', '');
    let menu = readJSON(MENU_FILE);
    menu = menu.filter(m => m.id !== id);
    writeJSON(MENU_FILE, menu);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, deletedId: id }));
    return;
  }

  // GET /api/stats
  if (req.method === 'GET' && pathname === '/api/stats') {
    const leads = readJSON(LEADS_FILE);
    const menu = readJSON(MENU_FILE);
    const today = new Date().toISOString().split('T')[0];

    const stats = {
      totalBookings: leads.length,
      todayBookings: leads.filter(l => l.date === today).length,
      banquetInquiries: leads.filter(l => l.type && l.type.includes('Banquet')).length,
      tableReservations: leads.filter(l => l.type && l.type.includes('Table')).length,
      seatedCount: leads.filter(l => l.status === 'Seated').length,
      totalMenuItems: menu.length
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(stats));
    return;
  }

  // --- STATIC FILE SERVING ---
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Server error: ' + error.code, 'utf-8');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

module.exports = (req, res) => handler(req, res);
if (require.main === module) {
  server.listen(PORT, () => {
  console.log(`Papillon Server running on http://localhost:${PORT}`);
});

}