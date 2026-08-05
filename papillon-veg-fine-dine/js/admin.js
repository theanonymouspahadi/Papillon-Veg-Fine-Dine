// Papillon Manager Portal JavaScript Logic
const CORRECT_PIN = "7890";
let leadsData = [];
let menuData = [];
let currentFilter = "all";
let activeEditId = null;

document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  initPinInput();
});

function checkAuth() {
  const isAuth = sessionStorage.getItem("papillon_admin_auth");
  if (isAuth === "true") {
    document.getElementById("authScreen").style.display = "none";
    document.getElementById("dashboardScreen").style.display = "flex";
    loadDashboardData();
    loadMenuData();
    setInterval(loadDashboardData, 5000);
  } else {
    document.getElementById("authScreen").style.display = "flex";
    document.getElementById("dashboardScreen").style.display = "none";
  }
}

function initPinInput() {
  const inputs = document.querySelectorAll(".pin-digit");
  inputs.forEach((input, idx) => {
    input.addEventListener("keyup", (e) => {
      if (e.key >= "0" && e.key <= "9") {
        input.value = e.key;
        if (idx < inputs.length - 1) inputs[idx + 1].focus();
      } else if (e.key === "Backspace") {
        input.value = "";
        if (idx > 0) inputs[idx - 1].focus();
      }

      const enteredPin = Array.from(inputs).map(i => i.value).join("");
      if (enteredPin.length === 4) {
        if (enteredPin === CORRECT_PIN) {
          sessionStorage.setItem("papillon_admin_auth", "true");
          checkAuth();
        } else {
          alert("Incorrect PIN. Please try default PIN: 7890");
          inputs.forEach(i => i.value = "");
          inputs[0].focus();
        }
      }
    });
  });
}

function logout() {
  sessionStorage.removeItem("papillon_admin_auth");
  checkAuth();
}

// Tab Switching (Reservations vs Menu Manager)
function switchAdminTab(tab) {
  const leadsTab = document.getElementById('tabLeadsView');
  const menuTab = document.getElementById('tabMenuView');
  const btnLeads = document.getElementById('navLeadsBtn');
  const btnMenu = document.getElementById('navMenuBtn');

  if (tab === 'leads') {
    leadsTab.style.display = 'block';
    menuTab.style.display = 'none';
    btnLeads.classList.add('active');
    btnMenu.classList.remove('active');
  } else {
    leadsTab.style.display = 'none';
    menuTab.style.display = 'block';
    btnLeads.classList.remove('active');
    btnMenu.classList.add('active');
    renderAdminMenuTable();
  }
}

// --- LEADS MANAGEMENT ---
async function loadDashboardData() {
  try {
    const response = await fetch('/api/leads');
    if (response.ok) leadsData = await response.json();
  } catch (err) {
    const local = localStorage.getItem('papillon_leads');
    leadsData = local ? JSON.parse(local) : [];
  }
  updateStats();
  renderLeadsTable();
}

function updateStats() {
  const today = new Date().toISOString().split('T')[0];
  const todayCount = leadsData.filter(l => l.date === today).length;
  const tableCount = leadsData.filter(l => l.type && l.type.includes('Table')).length;
  const banquetCount = leadsData.filter(l => l.type && l.type.includes('Banquet')).length;

  document.getElementById('statTodayTotal').textContent = todayCount;
  document.getElementById('statTableRes').textContent = tableCount;
  document.getElementById('statBanquetInquiries').textContent = banquetCount;
  document.getElementById('statMenuItemsTotal').textContent = menuData.length;
}

function renderLeadsTable() {
  const tbody = document.getElementById('adminLeadsTbody');
  if (!tbody) return;

  const searchVal = (document.getElementById('searchInput')?.value || '').toLowerCase();
  
  let filtered = leadsData;
  if (currentFilter === 'table') filtered = filtered.filter(l => l.type && l.type.includes('Table'));
  if (currentFilter === 'banquet') filtered = filtered.filter(l => l.type && l.type.includes('Banquet'));
  if (currentFilter === 'confirmed') filtered = filtered.filter(l => l.status === 'Confirmed');
  if (currentFilter === 'seated') filtered = filtered.filter(l => l.status === 'Seated');

  if (searchVal) {
    filtered = filtered.filter(l => 
      l.name.toLowerCase().includes(searchVal) ||
      l.phone.includes(searchVal) ||
      l.id.toLowerCase().includes(searchVal)
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:30px; color:var(--admin-text-muted);">No records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(l => {
    const statusClass = 
      l.status === 'Confirmed' ? 'status-confirmed' :
      l.status === 'Seated' ? 'status-seated' :
      l.status === 'Completed' ? 'status-completed' :
      l.status === 'Cancelled' ? 'status-cancelled' : 'status-inquiry';

    return `
      <tr>
        <td><strong>${l.id}</strong><br><small style="color:var(--admin-text-muted);">${l.createdAt || ''}</small></td>
        <td><span class="status-pill ${l.type.includes('Banquet') ? 'status-inquiry' : 'status-confirmed'}">${l.type}</span></td>
        <td><strong>${l.name}</strong><br><small style="color:var(--admin-gold-glow);">${l.phone}</small></td>
        <td>${l.date}<br><small style="color:var(--admin-text-muted);">${l.time}</small></td>
        <td><strong>${l.guests}</strong> Guests</td>
        <td>${l.area}</td>
        <td><span style="color:var(--admin-gold); font-weight:600;">${l.tableNumber || 'Unassigned'}</span></td>
        <td><span class="status-pill ${statusClass}">${l.status}</span></td>
        <td>
          <button class="btn-admin-outline" onclick="openEditModal('${l.id}')"><i class="fas fa-edit"></i> Edit / Assign</button>
        </td>
      </tr>
    `;
  }).join('');
}

function setFilter(filterType, btnEl) {
  currentFilter = filterType;
  document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  renderLeadsTable();
}

function openEditModal(leadId) {
  const lead = leadsData.find(l => l.id === leadId);
  if (!lead) return;
  activeEditId = leadId;
  document.getElementById('editLeadId').textContent = lead.id;
  document.getElementById('editCustomerName').textContent = `${lead.name} (${lead.phone})`;
  document.getElementById('editStatusSelect').value = lead.status;
  document.getElementById('editTableSelect').value = lead.tableNumber || 'Unassigned';
  document.getElementById('editNotesInput').value = lead.notes || '';
  document.getElementById('editModal').style.display = 'flex';
}

function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
}

async function saveLeadChanges() {
  if (!activeEditId) return;
  const updates = {
    status: document.getElementById('editStatusSelect').value,
    tableNumber: document.getElementById('editTableSelect').value,
    notes: document.getElementById('editNotesInput').value
  };

  try {
    await fetch(`/api/leads/${activeEditId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  } catch(e) {}
  closeEditModal();
  loadDashboardData();
}

function exportCSV() {
  if (!leadsData.length) return alert('No data to export.');
  let csv = "data:text/csv;charset=utf-8,Lead ID,Type,Customer Name,Phone,Email,Date,Time,Guests,Area,Table Assigned,Status,Notes,Created At\n";
  leadsData.forEach(l => {
    const row = [l.id, l.type, `"${l.name}"`, l.phone, l.email || '', l.date, l.time, l.guests, l.area, `"${l.tableNumber || 'Unassigned'}"`, l.status, `"${(l.notes || '').replace(/"/g, '""')}"`, `"${l.createdAt || ''}"`].join(",");
    csv += row + "\n";
  });
  const uri = encodeURI(csv);
  const link = document.createElement("a");
  link.href = uri;
  link.download = `papillon_manager_leads_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// --- MENU & PRICING MANAGER ENGINE ---
async function loadMenuData() {
  try {
    const res = await fetch('/api/menu');
    if (res.ok) menuData = await res.json();
  } catch (err) {}
  renderAdminMenuTable();
}

function renderAdminMenuTable() {
  const tbody = document.getElementById('adminMenuTbody');
  if (!tbody) return;

  const search = (document.getElementById('menuAdminSearch')?.value || '').toLowerCase().trim();
  let filtered = menuData;

  if (search) {
    filtered = filtered.filter(m => 
      m.name.toLowerCase().includes(search) ||
      m.category.toLowerCase().includes(search)
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--admin-text-muted);">No dishes found in menu database.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(item => `
    <tr>
      <td><strong>${item.name}</strong></td>
      <td><span class="status-pill status-seated">${item.category}</span></td>
      <td>
        <input type="text" value="${item.price}" onchange="updateDishPrice('${item.id}', this.value)" style="width:90px; padding:4px 8px; background:rgba(0,0,0,0.4); border:1px solid var(--admin-border); color:var(--admin-gold-glow); border-radius:4px; font-weight:700;">
      </td>
      <td>
        <input type="checkbox" ${item.category === 'today-special' ? 'checked' : ''} onchange="toggleTodaySpecial('${item.id}', this.checked)">
        <small style="color:var(--admin-text-muted);">Today's Special</small>
      </td>
      <td>${item.isJain ? '🌿 Yes' : 'No'}</td>
      <td><small style="color:var(--admin-text-muted);">${item.desc}</small></td>
      <td>
        <button class="btn-admin-outline" onclick="deleteDishItem('${item.id}')" style="border-color:var(--admin-danger); color:var(--admin-danger);"><i class="fas fa-trash"></i> Delete</button>
      </td>
    </tr>
  `).join('');
}

async function updateDishPrice(id, newPrice) {
  try {
    await fetch(`/api/menu/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: newPrice })
    });
    const item = menuData.find(m => m.id === id);
    if (item) item.price = newPrice;
  } catch (e) {}
}

async function toggleTodaySpecial(id, isSpecial) {
  const newCat = isSpecial ? 'today-special' : 'starters';
  try {
    await fetch(`/api/menu/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: newCat })
    });
    const item = menuData.find(m => m.id === id);
    if (item) item.category = newCat;
  } catch (e) {}
  renderAdminMenuTable();
}

function openAddDishModal() {
  document.getElementById('dishForm').reset();
  document.getElementById('dishModal').style.display = 'flex';
}

function closeDishModal() {
  document.getElementById('dishModal').style.display = 'none';
}

// Form Submit: Add Dish
document.addEventListener('DOMContentLoaded', () => {
  const dishForm = document.getElementById('dishForm');
  if (dishForm) {
    dishForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('dishFormName').value.trim();
      const category = document.getElementById('dishFormCategory').value;
      const price = document.getElementById('dishFormPrice').value.trim();
      const desc = document.getElementById('dishFormDesc').value.trim();
      const isJain = document.getElementById('dishFormJain').checked;
      const isSpecial = document.getElementById('dishFormSpecial').checked;

      const newItem = {
        name: name,
        category: isSpecial ? 'today-special' : category,
        price: price,
        desc: desc,
        isJain: isJain,
        isPopular: isSpecial,
        tags: [isJain ? "Jain Option" : "Chef Special"]
      };

      try {
        const res = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem)
        });
        if (res.ok) {
          const data = await res.json();
          menuData.unshift(data.item);
        }
      } catch (err) {
        newItem.id = 'item-' + Date.now();
        menuData.unshift(newItem);
      }

      closeDishModal();
      renderAdminMenuTable();
      alert(`Dish "${name}" added to menu successfully!`);
    });
  }
});

async function deleteDishItem(id) {
  if (!confirm('Are you sure you want to remove this dish item?')) return;
  try {
    await fetch(`/api/menu/${id}`, { method: 'DELETE' });
    menuData = menuData.filter(m => m.id !== id);
  } catch (e) {}
  renderAdminMenuTable();
}
