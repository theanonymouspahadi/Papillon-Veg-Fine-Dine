const leadsData = require('../data/leads.json');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    return res.status(200).json(leadsData);
  }

  if (req.method === 'POST') {
    const newLead = req.body || {};
    if (!newLead.id) {
      newLead.id = (newLead.type && newLead.type.includes('Banquet') ? 'BANQUET-' : 'PAPILLON-') + Math.floor(1000 + Math.random() * 9000);
    }
    if (!newLead.createdAt) newLead.createdAt = new Date().toLocaleString();
    if (!newLead.status) newLead.status = newLead.type && newLead.type.includes('Banquet') ? 'Inquiry Received' : 'Confirmed';

    leadsData.unshift(newLead);
    return res.status(201).json({ success: true, lead: newLead });
  }

  if (req.method === 'PUT') {
    const urlParts = (req.url || '').split('/');
    const id = urlParts[urlParts.length - 1];
    const updates = req.body || {};
    const index = leadsData.findIndex(l => l.id === id);
    if (index !== -1) leadsData[index] = { ...leadsData[index], ...updates };
    return res.status(200).json({ success: true });
  }

  if (req.method === 'DELETE') {
    const urlParts = (req.url || '').split('/');
    const id = urlParts[urlParts.length - 1];
    const filtered = leadsData.filter(l => l.id !== id);
    return res.status(200).json({ success: true, deletedId: id });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};