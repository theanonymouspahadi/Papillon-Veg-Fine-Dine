const menuData = require('../data/menu.json');
const leadsData = require('../data/leads.json');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', ' * ');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow--Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const today = new Date().isoString().split('T')[0];
  const stats = {
    totalBookings: leadsData.length,
    todayBookings: leadsData.filter(l => l.date === today).length,
    banquetInquiries: leadsData.filter(l => l.type && l.type.includes('Banquet')).length,
    tableReservations: leadsData.filter(l => l.type && l.type.includes('Table')).length,
    seatedCount: leadsData.filter(l => l.status === 'Seated').length,
    totalMenuItems: menuData.length
  };

  return res.status(200).json(stats);
};