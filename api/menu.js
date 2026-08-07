const menuData = require('../data/menu.json');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    return res.status(200).json(menuData);
  }

  if (req.method === 'POST') {
    const newItem = req.body || {};
    newItem.id = 'item-' + Date.now();
    if (!newItem.image) newItem.image = 'assets/images/hero.png';
    if (!newItem.tags) newItem.tags = [];
    menuData.unshift(newItem);
    return res.status(201).json({ success: true, item: newItem });
  }

  if (req.method === 'PUT') {
    const urlParts = (req.url || '').split('/');
    const id = urlParts[urlParts.length - 1];
    const updates = req.body || {};
    const index = menuData.findIndex(m => m.id === id);
    if (index !== -1) menuData[index] = { ...menuData[index], ...updates };
    return res.status(200).json({ success: true });
  }

  if (req.method === 'DELETE') {
    const urlParts = (req.url || '').split('/');
    const id = urlParts[urlParts.length - 1];
    const filtered = menuData.filter(m => m.id !== id);
    return res.status(200).json({ success: true, deletedId: id });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
