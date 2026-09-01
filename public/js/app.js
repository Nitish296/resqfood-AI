/* ============================================================
   ResQFood AI 2.0 — High-Level Interactive Frontend Application
   Modern Single Page Application with Live Geo-Radar Maps & AI Engine
   ============================================================ */

const API = '';  // same origin

// ============================================================
// State
// ============================================================
const State = {
  user: null,
  token: localStorage.getItem('resqfood_token'),
  currentPage: 'dashboard',
  notifications: [],
  mapInstance: null,
};

// ============================================================
// API Helper
// ============================================================
async function api(method, path, body = null) {
  const opts = { method, headers: {} };
  if (State.token) opts.headers['Authorization'] = `Bearer ${State.token}`;
  
  if (body) {
    if (body instanceof FormData) {
      opts.body = body; // fetch automatically sets multipart boundary
    } else {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
  }

  const res = await fetch(`${API}${path}`, opts);
  const data = await res.json();

  if (!res.ok) {
    const msg = data.message || data.errors?.[0]?.msg || 'Something went wrong';
    throw new Error(msg);
  }
  return data;
}

// ============================================================
// Toast Notification
// ============================================================
function toast(message, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  const iconMap = { success: 'check_circle', error: 'error', warning: 'warning', info: 'info' };
  el.innerHTML = `<span class="material-icons-round">${iconMap[type] || 'info'}</span> ${message}`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ============================================================
// Auth & Shell Management
// ============================================================
function renderAuth(mode = 'login') {
  document.getElementById('sidebar').classList.add('hidden');
  document.getElementById('top-header').classList.add('hidden');
  const main = document.getElementById('main-content');

  if (mode === 'login') {
    main.innerHTML = `
      <div class="auth-page">
        <div class="auth-card">
          <div class="brand">
            <span class="icon">🍽️</span>
            <h2>ResQFood AI</h2>
            <p style="color:var(--text-secondary);font-size:14px;">Autonomous Food Redistribution Mesh</p>
          </div>
          <form id="login-form">
            <div class="form-group">
              <label>Email Address</label>
              <input class="form-input" type="email" id="login-email" placeholder="your@organization.org" required>
            </div>
            <div class="form-group">
              <label>Password</label>
              <input class="form-input" type="password" id="login-password" placeholder="••••••••" required>
            </div>
            <button class="btn btn-primary btn-full" type="submit">
              <span class="material-icons-round">login</span> Sign In
            </button>
          </form>
          <div class="auth-divider"><span>OR CONTINUE WITH</span></div>
          <div id="google-btn-login" class="google-signin-wrapper"></div>
          <p style="text-align:center;margin-top:20px;color:var(--text-secondary);font-size:14px;">
            Don't have an account?
            <button class="btn-secondary" style="padding:4px 10px;margin-left:6px;" onclick="renderAuth('register')">Sign Up</button>
          </p>
        </div>
      </div>`;
    document.getElementById('login-form').onsubmit = handleLogin;
    initGoogleButton('google-btn-login');
  } else {
    main.innerHTML = `
      <div class="auth-page">
        <div class="auth-card">
          <div class="brand">
            <span class="icon">✨</span>
            <h2>Create Account</h2>
            <p style="color:var(--text-secondary);font-size:14px;">Join the Autonomous Food Rescue Network</p>
          </div>
          <form id="register-form">
            <div class="form-group">
              <label>Username / Entity Name</label>
              <input class="form-input" id="reg-username" placeholder="e.g. Hope Shelter / City Bakery" required minlength="3">
            </div>
            <div class="form-group">
              <label>Email Address</label>
              <input class="form-input" type="email" id="reg-email" placeholder="your@email.com" required>
            </div>
            <div class="form-group">
              <label>Password</label>
              <input class="form-input" type="password" id="reg-password" placeholder="Min 8 chars" required minlength="8">
            </div>
            <div class="form-group">
              <label>Network Role</label>
              <select class="form-input" id="reg-role" required>
                <option value="Donor">🧑‍🍳 Surplus Food Donor</option>
                <option value="NGO">🏢 NGO / Shelter / Food Bank</option>
                <option value="Volunteer">🚴 Volunteer Courier</option>
              </select>
            </div>
            <button class="btn btn-primary btn-full" type="submit">
              <span class="material-icons-round">how_to_reg</span> Join Network
            </button>
          </form>
          <div class="auth-divider"><span>OR CONTINUE WITH</span></div>
          <div id="google-btn-register" class="google-signin-wrapper"></div>
          <p style="text-align:center;margin-top:20px;color:var(--text-secondary);font-size:14px;">
            Already registered?
            <button class="btn-secondary" style="padding:4px 10px;margin-left:6px;" onclick="renderAuth('login')">Sign In</button>
          </p>
        </div>
      </div>`;
    document.getElementById('register-form').onsubmit = handleRegister;
    initGoogleButton('google-btn-register');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  try {
    const res = await api('POST', '/api/auth/login', {
      email: document.getElementById('login-email').value,
      password: document.getElementById('login-password').value,
    });
    State.token = res.data.token;
    localStorage.setItem('resqfood_token', res.data.token);
    toast('Welcome back to ResQFood AI!', 'success');
    await loadUser();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  try {
    const res = await api('POST', '/api/auth/register', {
      username: document.getElementById('reg-username').value,
      email: document.getElementById('reg-email').value,
      password: document.getElementById('reg-password').value,
      role: document.getElementById('reg-role').value,
    });
    State.token = res.data.token;
    localStorage.setItem('resqfood_token', res.data.token);
    toast('Account created successfully!', 'success');
    await loadUser();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ============================================================
// Google Sign-In Integration
// ============================================================
function initGoogleButton(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!window.GOOGLE_CLIENT_ID || window.GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);font-size:13px;">Google Sign-In not configured</p>';
    return;
  }

  container.innerHTML = `
    <button type="button" class="btn-google" onclick="triggerGoogleSignIn()">
      <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
      Continue with Google
    </button>`;
}

function triggerGoogleSignIn() {
  if (typeof google === 'undefined' || !google.accounts) {
    toast('Google Sign-In is initializing. Please try again.', 'error');
    return;
  }

  try {
    google.accounts.id.initialize({
      client_id: window.GOOGLE_CLIENT_ID,
      callback: function(response) {
        var role = document.getElementById('reg-role') ? document.getElementById('reg-role').value : 'Donor';
        api('POST', '/api/auth/google', {
          idToken: response.credential,
          role: role,
        }).then(function(res) {
          State.token = res.data.token;
          localStorage.setItem('resqfood_token', res.data.token);
          toast('Google Sign-In successful!', 'success');
          loadUser();
        }).catch(function(err) {
          toast(err.message || 'Google sign-in failed', 'error');
        });
      },
    });

    google.accounts.id.prompt(function(notification) {
      if (notification.isNotDisplayed()) {
        toast('Google popup blocked. Please allow popups or try again.', 'error');
      }
    });
  } catch (err) {
    toast('Google Sign-In error: ' + err.message, 'error');
  }
}

async function loadUser() {
  try {
    const res = await api('GET', '/api/users/me');
    State.user = res.data;
    renderApp();
  } catch {
    State.token = null;
    localStorage.removeItem('resqfood_token');
    renderAuth();
  }
}

// ============================================================
// App Shell & Navigation
// ============================================================
function renderApp() {
  const sidebar = document.getElementById('sidebar');
  const topHeader = document.getElementById('top-header');
  
  sidebar.classList.remove('hidden');
  topHeader.classList.remove('hidden');

  // Header user profile
  const initial = (State.user.username || State.user.email)[0].toUpperCase();
  document.getElementById('user-header-profile').innerHTML = `
    <div class="user-avatar">${initial}</div>
    <div style="display:flex;flex-direction:column;">
      <strong style="font-size:13px;line-height:1.2;">${State.user.username}</strong>
      <span style="font-size:11px;color:var(--accent);">${State.user.role}</span>
    </div>
  `;

  // Sidebar info
  document.getElementById('user-info').innerHTML = `
    <strong>${State.user.username}</strong>
    <span style="color:var(--text-muted);font-size:12px;">${State.user.email}</span>
  `;

  // Navigation items based on role
  const navItems = getNavForRole(State.user.role);
  document.getElementById('nav-menu').innerHTML = navItems.map(item => `
    <button class="nav-item ${State.currentPage === item.page ? 'active' : ''}"
            onclick="App.navigate('${item.page}')">
      <span class="material-icons-round">${item.icon}</span>
      ${item.label}
      ${item.badge ? `<span class="notif-badge">${item.badge}</span>` : ''}
    </button>
  `).join('');

  renderPage(State.currentPage);
}

function getNavForRole(role) {
  const common = [
    { page: 'dashboard', icon: 'dashboard', label: 'AI Dashboard' },
    { page: 'notifications', icon: 'notifications', label: 'Alerts & Messages', badge: State.notifications.length || '' },
  ];

  switch (role) {
    case 'Donor':
      return [
        common[0],
        { page: 'create-donation', icon: 'add_circle', label: 'Post Food Surplus' },
        { page: 'my-donations', icon: 'inventory_2', label: 'My Donations' },
        common[1]
      ];
    case 'NGO':
      return [
        common[0],
        { page: 'available-donations', icon: 'radar', label: 'Find Food Radar' },
        { page: 'my-requests', icon: 'assignment', label: 'My Claimed Requests' },
        common[1]
      ];
    case 'Volunteer':
      return [
        common[0],
        { page: 'available-requests', icon: 'local_shipping', label: 'Delivery Tasks' },
        common[1]
      ];
    case 'Admin':
      return [
        common[0],
        { page: 'admin-users', icon: 'people', label: 'User Directory' },
        { page: 'admin-donations', icon: 'inventory', label: 'Global Donations' },
        common[1]
      ];
    default:
      return common;
  }
}

// ============================================================
// Page Router
// ============================================================
function renderPage(page) {
  State.currentPage = page;
  
  const pages = {
    'dashboard': renderDashboard,
    'create-donation': renderCreateDonation,
    'my-donations': renderMyDonations,
    'available-donations': renderAvailableDonations,
    'my-requests': renderMyRequests,
    'available-requests': renderAvailableRequests,
    'notifications': renderNotifications,
    'admin-users': renderAdminUsers,
    'admin-donations': renderAdminDonations,
  };

  const render = pages[page] || renderDashboard;
  render();
}

// ============================================================
// Interactive Leaflet Map Helper
// ============================================================
function initInteractiveMap(containerId, centerLat = 12.9716, centerLng = 77.5946, markers = []) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (State.mapInstance) {
    State.mapInstance.remove();
    State.mapInstance = null;
  }

  if (typeof L === 'undefined') {
    container.innerHTML = '<p style="color:var(--text-muted);padding:20px;text-align:center;">Leaflet Map engine loading...</p>';
    return;
  }

  try {
    const map = L.map(containerId, {
      center: [centerLat, centerLng],
      zoom: 12,
      zoomControl: false,
    });

    // Light Map Tiles (CartoDB Voyager)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Custom Icon helper
    const greenIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `<div style="background:#6366f1;width:16px;height:16px;border-radius:50%;box-shadow:0 0 12px rgba(99,102,241,0.5);border:2.5px solid white;"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    markers.forEach(m => {
      if (m.lat && m.lng) {
        L.marker([m.lat, m.lng], { icon: greenIcon })
          .addTo(map)
          .bindPopup(`<strong style="color:#0f172a">${m.title || 'Donation Location'}</strong><br>${m.details || ''}`);
      }
    });

    State.mapInstance = map;
  } catch (err) {
    console.error('Map init error:', err);
  }
}

// ============================================================
// Dashboard View
// ============================================================
async function renderDashboard() {
  const main = document.getElementById('main-content');
  const role = State.user.role;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  main.innerHTML = `
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:16px;">
      <div>
        <h2>${greeting}, ${State.user.username}! 👋</h2>
        <p>System Role: <strong style="color:var(--accent);">${role}</strong> • Network Engine: Active</p>
      </div>
      <div style="display:flex;gap:10px;">
        ${role === 'Donor' ? `<button class="btn btn-primary" onclick="App.navigate('create-donation')"><span class="material-icons-round">add_circle</span> Post Surplus Food</button>` : ''}
        ${role === 'NGO' ? `<button class="btn btn-primary" onclick="App.navigate('available-donations')"><span class="material-icons-round">radar</span> Launch Radar</button>` : ''}
      </div>
    </div>

    <!-- Live Stats Widgets -->
    <div class="stats-grid" id="dashboard-stats">
      <div class="stat-card"><div class="spinner"></div></div>
    </div>

    <!-- Live Radar Map View -->
    <div class="card" style="margin-bottom:28px;">
      <div class="card-header">
        <h3 style="display:flex;align-items:center;gap:8px;">
          <span class="material-icons-round" style="color:var(--accent);">map</span> Live Food Rescue Mesh
        </h3>
        <span class="badge badge-accepted">Real-Time Sync</span>
      </div>
      <div id="map-container"></div>
    </div>

    <div id="dashboard-content"></div>
  `;

  try {
    if (role === 'Donor') {
      const res = await api('GET', '/api/donations/donor');
      const donations = res.data || [];
      const pending = donations.filter(d => d.status === 'Pending').length;
      const accepted = donations.filter(d => d.status === 'Accepted').length;
      const delivered = donations.filter(d => d.status === 'Delivered').length;

      document.getElementById('dashboard-stats').innerHTML = `
        <div class="stat-card"><div class="stat-icon green"><span class="material-icons-round">inventory_2</span></div><div class="stat-info"><div class="stat-value">${donations.length}</div><div class="stat-label">Total Donations</div></div></div>
        <div class="stat-card"><div class="stat-icon yellow"><span class="material-icons-round">pending</span></div><div class="stat-info"><div class="stat-value">${pending}</div><div class="stat-label">Pending Claim</div></div></div>
        <div class="stat-card"><div class="stat-icon blue"><span class="material-icons-round">check_circle</span></div><div class="stat-info"><div class="stat-value">${accepted}</div><div class="stat-label">Claimed by NGO</div></div></div>
        <div class="stat-card"><div class="stat-icon green"><span class="material-icons-round">local_shipping</span></div><div class="stat-info"><div class="stat-value">${delivered}</div><div class="stat-label">Delivered</div></div></div>
      `;

      // Map markers from donor's donations
      const markers = donations
        .filter(d => d.pickupLocation?.coordinates?.length === 2)
        .map(d => ({
          lat: d.pickupLocation.coordinates[1],
          lng: d.pickupLocation.coordinates[0],
          title: d.foodType,
          details: `${d.quantity} ${d.unit} • Status: ${d.status}`
        }));

      setTimeout(() => initInteractiveMap('map-container', 12.9716, 77.5946, markers), 100);

      document.getElementById('dashboard-content').innerHTML = `
        <h3 style="margin-bottom:16px;font-size:20px;font-weight:700;">Recent Postings</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;">
          ${donations.slice(0, 6).map(d => donationCard(d)).join('') || emptyState('No active postings', 'Click "Post Surplus Food" to create your first listing!')}
        </div>
      `;
    } else if (role === 'NGO') {
      const res = await api('GET', '/api/requests/ngo');
      const requests = res.data || [];
      const accepted = requests.filter(r => r.status === 'Accepted').length;
      const delivered = requests.filter(r => r.status === 'Delivered').length;

      document.getElementById('dashboard-stats').innerHTML = `
        <div class="stat-card"><div class="stat-icon blue"><span class="material-icons-round">assignment</span></div><div class="stat-info"><div class="stat-value">${requests.length}</div><div class="stat-label">Total Claims</div></div></div>
        <div class="stat-card"><div class="stat-icon yellow"><span class="material-icons-round">pending</span></div><div class="stat-info"><div class="stat-value">${accepted}</div><div class="stat-label">Awaiting Pickup</div></div></div>
        <div class="stat-card"><div class="stat-icon green"><span class="material-icons-round">check_circle</span></div><div class="stat-info"><div class="stat-value">${delivered}</div><div class="stat-label">Delivered</div></div></div>
      `;

      setTimeout(() => initInteractiveMap('map-container', 12.9716, 77.5946, []), 100);
    } else if (role === 'Admin') {
      const [usersRes, donationsRes] = await Promise.all([
        api('GET', '/api/admin/users'),
        api('GET', '/api/admin/donations'),
      ]);
      const users = usersRes.data || [];
      const donations = donationsRes.data || [];

      document.getElementById('dashboard-stats').innerHTML = `
        <div class="stat-card"><div class="stat-icon blue"><span class="material-icons-round">people</span></div><div class="stat-info"><div class="stat-value">${users.length}</div><div class="stat-label">Total Users</div></div></div>
        <div class="stat-card"><div class="stat-icon green"><span class="material-icons-round">inventory_2</span></div><div class="stat-info"><div class="stat-value">${donations.length}</div><div class="stat-label">Global Donations</div></div></div>
        <div class="stat-card"><div class="stat-icon yellow"><span class="material-icons-round">verified_user</span></div><div class="stat-info"><div class="stat-value">${users.filter(u => !u.isVerified).length}</div><div class="stat-label">Unverified Users</div></div></div>
      `;

      setTimeout(() => initInteractiveMap('map-container', 12.9716, 77.5946, []), 100);
    } else {
      document.getElementById('dashboard-stats').innerHTML = `
        <div class="stat-card"><div class="stat-icon green"><span class="material-icons-round">local_shipping</span></div><div class="stat-info"><div class="stat-value">Active</div><div class="stat-label">Volunteer Delivery Engine Online</div></div></div>
      `;
      setTimeout(() => initInteractiveMap('map-container', 12.9716, 77.5946, []), 100);
    }
  } catch (err) {
    document.getElementById('dashboard-stats').innerHTML = `<p style="color:var(--text-secondary)">Could not load dashboard telemetry.</p>`;
  }
}

// ============================================================
// Donor: Create Donation View
// ============================================================
function renderCreateDonation() {
  document.getElementById('main-content').innerHTML = `
    <div class="page-header">
      <h2>Post Surplus Food</h2>
      <p>List available food for nearby NGOs and food banks</p>
    </div>
    <div class="card" style="max-width:640px;margin:0 auto;">
      <form id="donation-form">
        <div class="form-group">
          <label>Food Item / Description</label>
          <input class="form-input" id="d-foodType" placeholder="e.g. Fresh Cooked Meals, Packaged Rice, Bakery Goods" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Quantity</label>
            <input class="form-input" type="number" id="d-quantity" min="0.1" step="0.1" placeholder="25" required>
          </div>
          <div class="form-group">
            <label>Unit</label>
            <select class="form-input" id="d-unit" required>
              <option value="meals">Meals</option>
              <option value="kg">Kg</option>
              <option value="servings">Servings</option>
              <option value="items">Items</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Estimated Expiry Time</label>
          <input class="form-input" type="datetime-local" id="d-expiry" required>
        </div>
        <div class="form-group">
          <label>Food Verification Photo (Optional)</label>
          <input class="form-input" type="file" id="d-image" accept="image/*">
        </div>
        <div class="form-group">
          <label>Pickup Street Address</label>
          <input class="form-input" id="d-address" placeholder="e.g. 123 MG Road, Bangalore" required>
        </div>
        <div class="form-group" style="margin-bottom: 20px;">
          <button type="button" class="btn btn-secondary" id="btn-get-location" style="width:100%; display:flex; align-items:center; justify-content:center; gap:8px;">
            <span class="material-icons-round" style="color:var(--accent);">my_location</span> 📍 Auto-Detect GPS & Address
          </button>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Latitude</label><input class="form-input" type="number" step="any" id="d-lat" placeholder="12.9716" required></div>
          <div class="form-group"><label>Longitude</label><input class="form-input" type="number" step="any" id="d-lng" placeholder="77.5946" required></div>
        </div>
        <button class="btn btn-primary btn-full" type="submit">
          <span class="material-icons-round">publish</span> Submit Donation to Mesh
        </button>
      </form>
    </div>
  `;

  // Auto-detect location click handler
  document.getElementById('btn-get-location').onclick = () => {
    if (!navigator.geolocation) {
      toast('Geolocation is not supported by your browser', 'error');
      return;
    }
    toast('Detecting GPS & street address...', 'info');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        document.getElementById('d-lat').value = lat;
        document.getElementById('d-lng').value = lng;
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          if (data && data.display_name) {
            document.getElementById('d-address').value = data.display_name;
            toast('Address & GPS coordinates auto-detected!', 'success');
            return;
          }
        } catch (e) { console.warn(e); }

        toast('GPS set! Please review address.', 'success');
      },
      (err) => {
        document.getElementById('d-lat').value = '12.9716';
        document.getElementById('d-lng').value = '77.5946';
        if (!document.getElementById('d-address').value) {
          document.getElementById('d-address').value = 'MG Road, Bangalore';
        }
        toast('Used default coordinates.', 'warning');
      },
      { timeout: 8000 }
    );
  };

  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById('d-expiry').min = now.toISOString().slice(0, 16);

  document.getElementById('donation-form').onsubmit = async (e) => {
    e.preventDefault();
    try {
      const fileInput = document.getElementById('d-image');
      if (fileInput && fileInput.files[0]) {
        const formData = new FormData();
        formData.append('foodType', document.getElementById('d-foodType').value);
        formData.append('quantity', document.getElementById('d-quantity').value);
        formData.append('unit', document.getElementById('d-unit').value);
        formData.append('expiryTime', new Date(document.getElementById('d-expiry').value).toISOString());
        formData.append('pickupLocation[address]', document.getElementById('d-address').value);
        formData.append('pickupLocation[latitude]', document.getElementById('d-lat').value);
        formData.append('pickupLocation[longitude]', document.getElementById('d-lng').value);
        formData.append('image', fileInput.files[0]);

        await api('POST', '/api/donations', formData);
      } else {
        await api('POST', '/api/donations', {
          foodType: document.getElementById('d-foodType').value,
          quantity: parseFloat(document.getElementById('d-quantity').value),
          unit: document.getElementById('d-unit').value,
          expiryTime: new Date(document.getElementById('d-expiry').value).toISOString(),
          pickupLocation: {
            address: document.getElementById('d-address').value,
            latitude: parseFloat(document.getElementById('d-lat').value),
            longitude: parseFloat(document.getElementById('d-lng').value),
          },
        });
      }

      toast('Donation published successfully!', 'success');
      App.navigate('my-donations');
    } catch (err) {
      toast(err.message, 'error');
    }
  };
}

// ============================================================
// Donor: My Donations
// ============================================================
async function renderMyDonations() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-header"><h2>My Postings</h2><p>Track surplus food listings</p></div>
    <div id="donations-list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;"><div class="spinner"></div></div>
  `;

  try {
    const res = await api('GET', '/api/donations/donor');
    const donations = res.data || [];
    document.getElementById('donations-list').innerHTML = donations.length
      ? donations.map(d => donationCard(d, false, true)).join('')
      : emptyState('No donations yet', 'Create your first food donation listing!');
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ============================================================
// NGO: Find Food Radar View
// ============================================================
async function renderAvailableDonations() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-header">
      <h2>Food Rescue Radar</h2>
      <p>Discover available food donations within your region</p>
    </div>
    
    <!-- Search Controls -->
    <div class="card" style="margin-bottom:24px;">
      <form id="search-form" style="display:flex;gap:12px;align-items:end;flex-wrap:wrap;">
        <div class="form-group" style="margin:0"><label>Latitude</label><input class="form-input" type="number" step="any" id="s-lat" value="12.9716" required></div>
        <div class="form-group" style="margin:0"><label>Longitude</label><input class="form-input" type="number" step="any" id="s-lng" value="77.5946" required></div>
        <div class="form-group" style="margin:0"><label>Radius (km)</label><input class="form-input" type="number" id="s-radius" value="100" min="1" max="5000"></div>
        <button class="btn btn-primary" type="submit"><span class="material-icons-round">radar</span> Run Radar</button>
        <button type="button" class="btn btn-secondary" id="btn-ngo-location">
          <span class="material-icons-round">my_location</span> Detect Location
        </button>
      </form>
    </div>

    <!-- Live Map Container -->
    <div class="card" style="margin-bottom:24px;">
      <div class="card-header"><h3 style="display:flex;align-items:center;gap:8px;"><span class="material-icons-round" style="color:var(--accent);">explore</span> Interactive Radar Map</h3></div>
      <div id="radar-map-container" style="height:320px;border-radius:12px;overflow:hidden;"></div>
    </div>

    <div id="available-list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;"><div class="spinner"></div></div>
  `;

  const searchForm = document.getElementById('search-form');

  document.getElementById('btn-ngo-location').onclick = () => {
    if (!navigator.geolocation) {
      toast('Geolocation not supported', 'error');
      return;
    }
    toast('Detecting GPS location...', 'info');
    navigator.geolocation.getCurrentPosition((pos) => {
      document.getElementById('s-lat').value = pos.coords.latitude.toFixed(6);
      document.getElementById('s-lng').value = pos.coords.longitude.toFixed(6);
      toast('Location updated!', 'success');
      searchForm.dispatchEvent(new Event('submit'));
    });
  };

  searchForm.onsubmit = async (e) => {
    e.preventDefault();
    const lat = parseFloat(document.getElementById('s-lat').value);
    const lng = parseFloat(document.getElementById('s-lng').value);
    const radius = document.getElementById('s-radius').value;
    try {
      const res = await api('GET', `/api/donations/available?latitude=${lat}&longitude=${lng}&radius=${radius}`);
      const donations = res.data || [];

      // Render Map Markers
      const markers = donations.map(d => ({
        lat: d.pickupLocation.coordinates[1],
        lng: d.pickupLocation.coordinates[0],
        title: d.foodType,
        details: `Quantity: ${d.quantity} ${d.unit}<br>Address: ${d.pickupLocation.address}`
      }));
      setTimeout(() => initInteractiveMap('radar-map-container', lat, lng, markers), 100);

      document.getElementById('available-list').innerHTML = donations.length
        ? donations.map(d => donationCard(d, true)).join('')
        : emptyState('No donations in range', 'Try increasing the search radius to 500km');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  // Trigger search on load
  searchForm.dispatchEvent(new Event('submit'));
}

// ============================================================
// NGO: My Requests
// ============================================================
async function renderMyRequests() {
  const main = document.getElementById('main-content');
  main.innerHTML = `<div class="page-header"><h2>Claimed Food Requests</h2><p>Track donations accepted by your organization</p></div><div id="requests-list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;"><div class="spinner"></div></div>`;

  try {
    const res = await api('GET', '/api/requests/ngo');
    const requests = res.data || [];
    document.getElementById('requests-list').innerHTML = requests.length
      ? requests.map(r => requestCard(r)).join('')
      : emptyState('No claimed requests yet', 'Use Find Food Radar to accept available food!');
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ============================================================
// Volunteer: Available Tasks View
// ============================================================
async function renderAvailableRequests() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-header"><h2>Delivery Tasks</h2><p>Pick up surplus food and deliver to shelters</p></div>
    <div id="vol-requests" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;"><div class="spinner"></div></div>
  `;

  try {
    const res = await api('GET', '/api/requests/available?latitude=12.9716&longitude=77.5946&radius=500');
    const requests = res.data || [];
    document.getElementById('vol-requests').innerHTML = requests.length
      ? requests.map(r => volunteerRequestCard(r)).join('')
      : emptyState('No delivery tasks available', 'Check back soon for new task assignments');
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ============================================================
// Notifications View
// ============================================================
async function renderNotifications() {
  const main = document.getElementById('main-content');
  main.innerHTML = `<div class="page-header"><h2>Alerts & Telemetry</h2><p>Real-time updates and activity log</p></div><div id="notif-list" style="display:flex;flex-direction:column;gap:16px;"><div class="spinner"></div></div>`;

  try {
    const res = await api('GET', '/api/notifications/me');
    State.notifications = res.data || [];
    document.getElementById('notif-list').innerHTML = State.notifications.length
      ? State.notifications.map(n => `
        <div class="card">
          <div class="card-header">
            <span class="badge badge-${n.type === 'Alert' ? 'pending' : 'accepted'}">${n.type}</span>
            <small style="color:var(--text-muted)">${timeAgo(n.createdAt)}</small>
          </div>
          <div class="card-body" style="font-size:15px;color:var(--text-primary);">${n.message}</div>
          <div class="card-footer">
            <button class="btn btn-sm btn-secondary" onclick="App.markRead('${n._id}')">Dismiss</button>
          </div>
        </div>`).join('')
      : emptyState('All quiet!', 'No unread notifications');
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ============================================================
// Admin: Users View
// ============================================================
async function renderAdminUsers() {
  const main = document.getElementById('main-content');
  main.innerHTML = `<div class="page-header"><h2>User Directory</h2><p>Platform accounts & entity verification</p></div><div id="users-table"><div class="spinner"></div></div>`;

  try {
    const res = await api('GET', '/api/admin/users');
    const users = res.data || [];
    document.getElementById('users-table').innerHTML = `
      <div class="card" style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr><th>Entity / Username</th><th>Email Address</th><th>Role</th><th>Verification</th><th>Action</th></tr></thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td style="color:var(--text-primary);font-weight:600">${u.username}</td>
                <td>${u.email}</td>
                <td><span class="badge badge-accepted">${u.role}</span></td>
                <td>${u.isVerified ? '<span style="color:var(--accent);font-weight:700;">✅ Verified</span>' : '<span style="color:var(--warning);">⏳ Pending</span>'}</td>
                <td>${!u.isVerified ? `<button class="btn btn-sm btn-success" onclick="App.verifyUser('${u._id}')">Verify</button>` : '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ============================================================
// Admin: Donations View
// ============================================================
async function renderAdminDonations() {
  const main = document.getElementById('main-content');
  main.innerHTML = `<div class="page-header"><h2>Global Donations Overview</h2><p>All platform surplus food items</p></div><div id="admin-donations" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;"><div class="spinner"></div></div>`;

  try {
    const res = await api('GET', '/api/admin/donations');
    const donations = res.data || [];
    document.getElementById('admin-donations').innerHTML = donations.length
      ? donations.map(d => donationCard(d)).join('')
      : emptyState('No global donations', 'No items logged yet');
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ============================================================
// UI Component Helpers
// ============================================================
function statusBadge(status) {
  const cls = {
    Pending: 'pending', Accepted: 'accepted', Assigned: 'assigned',
    PickedUp: 'assigned', Delivered: 'delivered', Expired: 'expired', Cancelled: 'expired',
  };
  return `<span class="badge badge-${cls[status] || 'pending'}">${status}</span>`;
}

function donationCard(d, showAccept = false, showCancel = false) {
  const donor = d.donorId?.username || d.donorId?.email || '—';
  const imgUrl = d.imageUrl || d.photoUrl;
  return `
    <div class="card">
      ${imgUrl ? `<div style="margin:-24px -24px 16px -24px; overflow:hidden; border-radius:var(--radius-lg) var(--radius-lg) 0 0; max-height:180px;"><img src="${imgUrl}" alt="${d.foodType}" style="width:100%; height:180px; object-fit:cover; display:block;"></div>` : ''}
      <div class="card-header">
        <h3 style="font-size:18px;">${d.foodType}</h3>
        ${statusBadge(d.status)}
      </div>
      <div class="card-body">
        <div class="detail-row"><span class="label">Quantity</span><span style="font-weight:700;color:var(--text-primary);">${d.quantity} ${d.unit}</span></div>
        <div class="detail-row"><span class="label">Pickup Address</span><span>${d.pickupLocation?.address || '—'}</span></div>
        <div class="detail-row"><span class="label">Expiry Date</span><span>${new Date(d.expiryTime).toLocaleString()}</span></div>
        ${typeof d.donorId === 'object' ? `<div class="detail-row"><span class="label">Donor</span><span>${donor}</span></div>` : ''}
      </div>
      ${(showAccept && d.status === 'Pending') || (showCancel && d.status === 'Pending') ? `
        <div class="card-footer">
          ${showAccept ? `<button class="btn btn-sm btn-success" onclick="App.acceptDonation('${d._id}')"><span class="material-icons-round">check</span> Claim Food</button>` : ''}
          ${showCancel ? `<button class="btn btn-sm btn-secondary" style="color:var(--danger);" onclick="App.cancelDonation('${d._id}')"><span class="material-icons-round">cancel</span> Cancel</button>` : ''}
        </div>` : ''}
    </div>`;
}

function requestCard(r) {
  const donation = r.donationId || {};
  const volunteer = r.volunteerId;
  return `
    <div class="card">
      <div class="card-header">
        <h3>${donation.foodType || 'Claimed Food'}</h3>
        ${statusBadge(r.status)}
      </div>
      <div class="card-body">
        <div class="detail-row"><span class="label">Quantity</span><span>${donation.quantity || '—'} ${donation.unit || ''}</span></div>
        <div class="detail-row"><span class="label">Pickup Address</span><span>${donation.pickupLocation?.address || '—'}</span></div>
        <div class="detail-row"><span class="label">Volunteer Courier</span><span>${volunteer?.username || 'Unassigned'}</span></div>
      </div>
      ${r.status === 'Accepted' ? `
        <div class="card-footer">
          <button class="btn btn-sm btn-secondary" style="color:var(--danger);" onclick="App.cancelRequest('${r._id}')"><span class="material-icons-round">cancel</span> Cancel Claim</button>
        </div>` : ''}
    </div>`;
}

function volunteerRequestCard(r) {
  const donation = r.donationId || {};
  return `
    <div class="card">
      <div class="card-header">
        <h3>${donation.foodType || 'Delivery Route'}</h3>
        ${statusBadge(r.status)}
      </div>
      <div class="card-body">
        <div class="detail-row"><span class="label">Quantity</span><span>${donation.quantity || '—'} ${donation.unit || ''}</span></div>
        <div class="detail-row"><span class="label">Pickup Address</span><span>${donation.pickupLocation?.address || '—'}</span></div>
        <div class="detail-row"><span class="label">Destination NGO</span><span>${r.ngoId?.organizationName || r.ngoId?.username || '—'}</span></div>
      </div>
      <div class="card-footer">
        ${r.status === 'Accepted' ? `<button class="btn btn-sm btn-primary" onclick="App.assignSelf('${r._id}')"><span class="material-icons-round">local_shipping</span> Claim Task</button>` : ''}
        ${r.status === 'Assigned' ? `<button class="btn btn-sm btn-success" onclick="App.markPickup('${r._id}')"><span class="material-icons-round">inventory</span> Mark Picked Up</button>` : ''}
        ${r.status === 'PickedUp' ? `<button class="btn btn-sm btn-success" onclick="App.markDeliver('${r._id}')"><span class="material-icons-round">check_circle</span> Mark Delivered</button>` : ''}
      </div>
    </div>`;
}

function emptyState(title, subtitle) {
  return `<div class="empty-state" style="grid-column:1/-1;"><span class="material-icons-round">inbox</span><h3>${title}</h3><p>${subtitle}</p></div>`;
}

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ============================================================
// Particle Canvas Background Animation
// ============================================================
function initParticleCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.onresize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };

  // Flowing gradient blobs - soft pastel AI mesh
  const blobs = [
    { x: width * 0.3, y: height * 0.3, r: 280, vx: 0.3, vy: 0.2, color: 'rgba(139, 92, 246, 0.08)' },
    { x: width * 0.7, y: height * 0.6, r: 320, vx: -0.25, vy: 0.15, color: 'rgba(59, 130, 246, 0.06)' },
    { x: width * 0.5, y: height * 0.8, r: 250, vx: 0.2, vy: -0.3, color: 'rgba(16, 185, 129, 0.06)' },
    { x: width * 0.2, y: height * 0.7, r: 200, vx: 0.15, vy: -0.15, color: 'rgba(244, 114, 182, 0.05)' },
    { x: width * 0.8, y: height * 0.2, r: 260, vx: -0.2, vy: 0.25, color: 'rgba(99, 102, 241, 0.07)' },
  ];

  let t = 0;

  function animate() {
    ctx.clearRect(0, 0, width, height);
    t += 0.003;

    blobs.forEach((b, i) => {
      // Organic floating motion using sine waves
      const offsetX = Math.sin(t + i * 1.5) * 60;
      const offsetY = Math.cos(t + i * 2.1) * 40;
      const scale = 1 + Math.sin(t + i) * 0.15;

      const cx = b.x + offsetX;
      const cy = b.y + offsetY;
      const cr = b.r * scale;

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
      gradient.addColorStop(0, b.color);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    });

    requestAnimationFrame(animate);
  }

  animate();
}

// ============================================================
// Global App Actions
// ============================================================
const App = {
  navigate(page) {
    State.currentPage = page;
    renderApp();
  },

  logout() {
    State.token = null;
    State.user = null;
    localStorage.removeItem('resqfood_token');
    renderAuth();
    toast('Signed out successfully', 'info');
  },

  async acceptDonation(id) {
    try {
      await api('POST', `/api/donations/${id}/accept`);
      toast('Food donation claimed successfully!', 'success');
      renderPage(State.currentPage);
    } catch (err) { toast(err.message, 'error'); }
  },

  async cancelDonation(id) {
    try {
      await api('PUT', `/api/donations/${id}/cancel`);
      toast('Donation cancelled', 'info');
      renderPage(State.currentPage);
    } catch (err) { toast(err.message, 'error'); }
  },

  async cancelRequest(id) {
    try {
      await api('PUT', `/api/requests/${id}/cancel`);
      toast('Request cancelled', 'info');
      renderPage(State.currentPage);
    } catch (err) { toast(err.message, 'error'); }
  },

  async verifyUser(id) {
    try {
      await api('PUT', `/api/admin/users/${id}/verify`);
      toast('User entity verified!', 'success');
      renderPage('admin-users');
    } catch (err) { toast(err.message, 'error'); }
  },

  async assignSelf(id) {
    try {
      await api('POST', `/api/requests/${id}/assign`);
      toast('Delivery task claimed!', 'success');
      renderPage(State.currentPage);
    } catch (err) { toast(err.message, 'error'); }
  },

  async markPickup(id) {
    try {
      await api('PUT', `/api/requests/${id}/pickup`);
      toast('Marked as picked up!', 'success');
      renderPage(State.currentPage);
    } catch (err) { toast(err.message, 'error'); }
  },

  async markDeliver(id) {
    try {
      await api('PUT', `/api/requests/${id}/deliver`);
      toast('Delivery confirmed!', 'success');
      renderPage(State.currentPage);
    } catch (err) { toast(err.message, 'error'); }
  },

  async markRead(id) {
    try {
      await api('PUT', `/api/notifications/${id}/read`);
      toast('Notification dismissed', 'info');
      renderNotifications();
    } catch (err) { toast(err.message, 'error'); }
  },
};

// ============================================================
// Application Boot Initializer
// ============================================================
(async function boot() {
  initParticleCanvas();
  if (State.token) {
    await loadUser();
  } else {
    renderAuth();
  }
})();
