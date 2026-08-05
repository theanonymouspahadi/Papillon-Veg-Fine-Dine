// Papillon Veg Fine Dine - Main Customer Web Application Logic (10 Categories x 10+ Items)

const CATEGORIES = [
  { id: "today-special", name: "⭐ Today's Special", icon: "fa-star" },
  { id: "starters", name: "Royal Starters & Tandoor", icon: "fa-fire-burner" },
  { id: "soups", name: "Soups & Fresh Salads", icon: "fa-bowl-rice" },
  { id: "main-indian", name: "North Indian Main Course", icon: "fa-utensils" },
  { id: "breads", name: "Naans, Rotis & Biryanis", icon: "fa-bread-slice" },
  { id: "asian", name: "Pan-Asian Specialties", icon: "fa-bowl-food" },
  { id: "italian", name: "Italian, Pizzas & Pastas", icon: "fa-pizza-slice" },
  { id: "sizzlers", name: "Signature Sizzlers", icon: "fa-fire" },
  { id: "mocktails", name: "Zero-Alcohol Mocktail Bar", icon: "fa-cocktail" },
  { id: "desserts", name: "Royal Sweets & Desserts", icon: "fa-ice-cream" }
];

let menuData = [];
let selectedCategory = 'today-special';
let searchKeyword = '';
let jainOnlyFilter = false;

document.addEventListener('DOMContentLoaded', async () => {
  await fetchMenuItems();
  renderCategoryJumper();
  renderMenu();
  initSearchAndFilters();
  initAmbianceSwitcher();
  initBookingWizard();
  initBanquetForm();
  initSoundscape();
});

async function fetchMenuItems() {
  try {
    const res = await fetch('/api/menu');
    if (res.ok) {
      menuData = await res.json();
      return;
    }
  } catch (e) {}
}

function renderCategoryJumper() {
  const jumperContainer = document.getElementById('categoryJumper');
  if (!jumperContainer) return;

  let html = '';
  CATEGORIES.forEach(cat => {
    const count = menuData.filter(i => i.category === cat.id).length;
    const isActive = selectedCategory === cat.id ? 'active' : '';
    html += `<button class="jumper-pill ${isActive}" onclick="selectCategory('${cat.id}', this)"><i class="fas ${cat.icon}"></i> ${cat.name} (${count})</button>`;
  });

  jumperContainer.innerHTML = html;
}

function selectCategory(catId, btnEl) {
  selectedCategory = catId;
  document.querySelectorAll('.jumper-pill').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  renderMenu();
}

function toggleJainFilter() {
  jainOnlyFilter = !jainOnlyFilter;
  const btn = document.getElementById('btnJainFilter');
  if (btn) btn.classList.toggle('active', jainOnlyFilter);
  renderMenu();
}

function initSearchAndFilters() {
  const searchInput = document.getElementById('menuSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchKeyword = e.target.value.toLowerCase().trim();
      renderMenu();
    });
  }
}

// Render Only Selected Category's 10+ Items (Clean, Compact & Structured View)
function renderMenu() {
  const container = document.getElementById('menuContainer');
  if (!container) return;

  let filtered = menuData;

  // Search keyword overrides single category filter
  if (searchKeyword) {
    filtered = filtered.filter(i => 
      i.name.toLowerCase().includes(searchKeyword) ||
      i.desc.toLowerCase().includes(searchKeyword) ||
      (i.category && i.category.toLowerCase().includes(searchKeyword)) ||
      (i.tags && i.tags.some(t => t.toLowerCase().includes(searchKeyword)))
    );
  } else {
    // Strictly filter by chosen category!
    filtered = filtered.filter(i => i.category === selectedCategory);
  }

  // Jain Filter
  if (jainOnlyFilter) {
    filtered = filtered.filter(i => i.isJain);
  }

  const categoryObj = CATEGORIES.find(c => c.id === selectedCategory) || { name: "Selected Cuisines", icon: "fa-utensils" };

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px 20px; background:var(--bg-card); border-radius:var(--radius-md); border:1px solid var(--border-glass);">
        <i class="fas fa-utensils" style="font-size:2rem; color:var(--gold-primary); margin-bottom:8px;"></i>
        <h4>No dishes in this selection</h4>
        <p style="color:var(--text-muted); font-size:0.9rem;">Choose another category from above or clear search filters.</p>
      </div>
    `;
    return;
  }

  // Structured Multi-Item Grid View
  container.innerHTML = `
    <div class="menu-book-section">
      <div class="menu-book-header">
        <h3><i class="fas ${categoryObj.icon}"></i> ${searchKeyword ? `Search Results for "${searchKeyword}"` : categoryObj.name}</h3>
        <span class="menu-count-badge">Showing ${filtered.length} Items</span>
      </div>
      <div class="menu-book-grid">
        ${filtered.map((dish, index) => `
          <div class="menu-book-item">
            <div class="item-title-row">
              <div class="item-name">
                <span style="color:var(--gold-primary); font-size:0.85rem; margin-right:4px;">${index + 1}.</span> ${dish.name}
                ${dish.isJain ? '<span class="mini-tag tag-jain"><i class="fas fa-leaf"></i> Jain</span>' : ''}
                ${dish.category === 'today-special' ? '<span class="mini-tag tag-chef"><i class="fas fa-star"></i> Special</span>' : ''}
              </div>
              <div class="item-price">${dish.price}</div>
            </div>
            <p class="item-desc">${dish.desc}</p>
            <div class="item-action-row">
              <span class="spice-rating">${'🌶️'.repeat(dish.spice || 0)}</span>
              <button class="btn-book-reserve" onclick="openReservationWithDish('${dish.name}')"><i class="fas fa-plus"></i> Reserve for Dish</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Modal & Form Handlers
function openReservationWithDish(dishName) {
  const notesField = document.getElementById('bookNotes');
  if (notesField) notesField.value = `Interested in tasting: ${dishName}`;
  openModal('bookingModal');
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

function initBookingWizard() {
  const dateInput = document.getElementById('bookDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.min = today;
  }
}

let currentStep = 1;
function nextWizardStep(step) {
  if (step === 2) {
    const d = document.getElementById('bookDate')?.value;
    if (!d) return alert('Please select a reservation date.');
  } else if (step === 3) {
    const name = document.getElementById('bookName')?.value.trim();
    const phone = document.getElementById('bookPhone')?.value.trim();
    if (!name || !phone) return alert('Please provide your Name and Phone Number.');

    const passCode = 'PAPILLON-' + Math.floor(1000 + Math.random() * 9000);
    const newLead = {
      id: passCode,
      type: "Table Reservation",
      name: name,
      phone: phone,
      email: document.getElementById('bookEmail')?.value || 'N/A',
      date: document.getElementById('bookDate')?.value,
      time: document.getElementById('bookTime')?.value,
      guests: document.getElementById('bookGuests')?.value,
      area: document.getElementById('bookArea')?.value,
      notes: `Dietary: ${document.getElementById('bookDietary')?.value}. Notes: ${document.getElementById('bookNotes')?.value || ''}`,
      status: "Confirmed",
      createdAt: new Date().toLocaleString()
    };

    saveLead(newLead);
    document.getElementById('passCodeDisplay').textContent = passCode;
    document.getElementById('passDetails').innerHTML = `
      <strong>Guest Name:</strong> ${name}<br>
      <strong>Date & Time:</strong> ${newLead.date} at ${newLead.time}<br>
      <strong>Party Size:</strong> ${newLead.guests} Guests (${newLead.area})<br>
      <strong>Phone:</strong> ${phone}
    `;
  }
  currentStep = step;
  showStep(currentStep);
}

function prevWizardStep(step) {
  currentStep = step;
  showStep(currentStep);
}

function showStep(step) {
  document.querySelectorAll('.wizard-step-content').forEach(el => el.style.display = 'none');
  const target = document.getElementById(`wizardStep${step}`);
  if (target) target.style.display = 'block';

  document.querySelectorAll('.step-item').forEach((item, idx) => {
    item.classList.remove('active', 'completed');
    if (idx + 1 === step) item.classList.add('active');
    if (idx + 1 < step) item.classList.add('completed');
  });
}

function initBanquetForm() {
  const form = document.getElementById('banquetForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('bqName').value.trim();
    const phone = document.getElementById('bqPhone').value.trim();
    const date = document.getElementById('bqDate').value;
    if (!name || !phone || !date) return alert('Please fill in Name, Phone, and Event Date.');

    const leadId = 'BANQUET-' + Math.floor(1000 + Math.random() * 9000);
    const banquetLead = {
      id: leadId,
      type: "Banquet Inquiry",
      name: name,
      phone: phone,
      email: document.getElementById('bqEmail')?.value || 'N/A',
      date: date,
      time: "Event Booking",
      guests: document.getElementById('bqGuests').value,
      area: "Grand AC Banquet Hall",
      notes: `Event: ${document.getElementById('bqEventType').value}. Notes: ${document.getElementById('bqNotes').value}`,
      status: "Inquiry Received",
      createdAt: new Date().toLocaleString()
    };
    saveLead(banquetLead);
    alert(`Thank you ${name}! Your Banquet Inquiry (${leadId}) has been received.`);
    form.reset();
  });
}

function initAmbianceSwitcher() {
  const cards = document.querySelectorAll('.thumb-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const roomKey = card.getAttribute('data-room');
      const AMBIANCE_ROOMS = {
        dining: { title: "Grand Main Dining Hall", desc: "Spacious, warm amber lighting with lush green velvet booths.", image: "assets/images/ambiance.png" },
        terrace: { title: "Open-Air Garden Terrace", desc: "Serene rooftop atmosphere surrounded by living plants.", image: "assets/images/hero.png" },
        banquet: { title: "Air-Conditioned Grand Banquet Hall", desc: "State-of-the-art event venue for up to 250 guests.", image: "assets/images/banquet.png" }
      };
      const room = AMBIANCE_ROOMS[roomKey];
      if (room) {
        document.getElementById('ambianceMainImg').src = room.image;
        document.getElementById('ambianceTitle').textContent = room.title;
        document.getElementById('ambianceDesc').textContent = room.desc;
      }
    });
  });
}

function initSoundscape() {
  const btn = document.getElementById('soundscapeBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      alert('Ambient dining soundscape toggled.');
    });
  }
}

async function saveLead(newLead) {
  try {
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLead)
    });
  } catch (err) {}
}
