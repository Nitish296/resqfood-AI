/* ============================================================
   ResQFood AI — Single Page Application
   Vanilla JS frontend connecting to Express backend
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
};

// ============================================================
// API Helper
// ============================================================
async function api(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (State.token) opts.headers['Authorization'] = `Bearer ${State.token}`;
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API}${path}`, opts);
  const data = await res.json();

  if (!res.ok) {
    const msg = data.message || data.errors?.[0]?.msg || 'Something went wrong';
    throw new Error(msg);
  }
  return data;
}

// ============================================================
// Toast
// ============================================================
function toast(message, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ============================================================
// Auth
// ============================================================
function renderAuth(mode = 'login') {
  document.getElementById('sidebar').classList.add('hidden');
  const main = document.getElementById('main-content');

  if (mode === 'login') {
    main.innerHTML = `
      <div class="auth-page">
        <div class="auth-card">
          <div class="brand">
            <span class="icon">🍽️</span>
            <h2>ResQFood AI</h2>
            <p>Fight food waste, feed communities</p>
          </div>
          <form id="login-form">
            <div class="form-group">
              <label>Email</label>
              <input class="form-input" type="email" id="login-email" placeholder="your@email.com" required>
            </div>
            <div class="form-group">
              <label>Password</label>
              <input class="form-input" type="password" id="login-password" placeholder="••••••••" required>
            </div>
            <button class="btn btn-primary btn-full" type="submit">Sign In</button>
          </form>
          <div class="auth-divider"><span>OR</span></div>
          <div id="google-btn-login" class="google-signin-wrapper"></div>
          <p style="text-align:center;margin-top:16px;color:var(--text-secondary);font-size:14px;">
            Don't have an account?
            <button class="btn-link" onclick="renderAuth('register')">Sign Up</button>
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
            <span class="icon">🍽️</span>
            <h2>Create Account</h2>
            <p>Join the food rescue movement</p>
          </div>
          <form id="register-form">
            <div class="form-group">
              <label>Username</label>
              <input class="form-input" id="reg-username" placeholder="johndoe" required minlength="3">
            </div>
            <div class="form-group">
              <label>Email</label>
              <input class="form-input" type="email" id="reg-email" placeholder="your@email.com" required>
            </div>
            <div class="form-group">
              <label>Password</label>
              <input class="form-input" type="password" id="reg-password" placeholder="Min 8 chars, uppercase, special" required minlength="8">
            </div>
            <div class="form-group">
              <label>Role</label>
              <select class="form-input" id="reg-role" required>
                <option value="Donor">🧑‍🍳 Donor</option>
                <option value="NGO">🏢 NGO / Shelter</option>
                <option value="Volunteer">🚴 Volunteer</option>
              </select>
            </div>
            <button class="btn btn-primary btn-full" type="submit">Create Account</button>
          </form>
          <div class="auth-divider"><span>OR</span></div>
          <div id="google-btn-register" class="google-signin-wrapper"></div>
          <p style="text-align:center;margin-top:16px;color:var(--text-secondary);font-size:14px;">
            Already have an account?
            <button class="btn-link" onclick="renderAuth('login')">Sign In</button>
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
    toast('Welcome back!', 'success');
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
    toast('Account created!', 'success');
    await loadUser();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ============================================================
// Google Sign-In
// ============================================================
function initGoogleButton(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!window.GOOGLE_CLIENT_ID || window.GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);font-size:13px;">Google Sign-In not configured</p>';
    return;
  }

  // Custom styled Google button
  container.innerHTML = `
    <button type="button" class="btn-google" onclick="triggerGoogleSignIn()">
      <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
      Continue with Google
    </button>`;
}

function triggerGoogleSignIn() {
  if (typeof google === 'undefined' || !google.accounts) {
    toast('Google Sign-In is still loading. Please wait a moment and try again.', 'error');
    return;
  }

  try {
    google.accounts.id.initialize({
      client_id: window.GOOGLE_CLIENT_ID,
      callback: function(response) {
        console.log('Google token received, sending to backend...');
        var role = document.getElementById('reg-role') ? document.getElementById('reg-role').value : 'Donor';
        api('POST', '/api/auth/google', {
          idToken: response.credential,
          role: role,
        }).then(function(res) {
          console.log('Backend response:', res);
          State.token = res.data.token;
          localStorage.setItem('resqfood_token', res.data.token);
          toast('Signed in with Google!', 'success');
          loadUser();
        }).catch(function(err) {
          console.error('Backend error:', err);
          toast(err.message || 'Google sign-in failed', 'error');
        });
      },
    });

    google.accounts.id.prompt(function(notification) {
      console.log('Google prompt type:', notification.getMomentType());
      if (notification.isNotDisplayed()) {
        console.log('Not displayed reason:', notification.getNotDisplayedReason());
        toast('Google popup blocked. Try disabling ad-blocker or use incognito mode.', 'error');
      }
    });
  } catch (err) {
    console.error('Google Sign-In error:', err);
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
  sidebar.classList.remove('hidden');

  // User info
  document.getElementById('user-info').innerHTML = `
    <strong>${State.user.username}</strong>
    ${State.user.role} • ${State.user.email}
  `;

  // Navigation based on role
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
    { page: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { page: 'notifications', icon: 'notifications', label: 'Notifications', badge: State.notifications.length || '' },
  ];

  switch (role) {
    case 'Donor':
      return [common[0],
        { page: 'create-donation', icon: 'add_circle', label: 'New Donation' },
        { page: 'my-donations', icon: 'inventory_2', label: 'My Donations' },
        common[1]];
    case 'NGO':
      return [common[0],
        { page: 'available-donations', icon: 'search', label: 'Find Donations' },
        { page: 'my-requests', icon: 'assignment', label: 'My Requests' },
        common[1]];
    case 'Volunteer':
      return [common[0],
        { page: 'available-requests', icon: 'local_shipping', label: 'Available Tasks' },
        common[1]];
    case 'Admin':
      return [common[0],
        { page: 'admin-users', icon: 'people', label: 'Users' },
        { page: 'admin-donations', icon: 'inventory', label: 'All Donations' },
        common[1]];
    default:
      return common;
  }
}

// ============================================================
// Page Router
// ============================================================
function renderPage(page) {
  State.currentPage = page;
  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.textContent.trim().includes(getNavForRole(State.user.role).find(n => n.page === page)?.label || ''));
  });

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
// Dashboard
// ============================================================
async function renderDashboard() {
  const main = document.getElementById('main-content');
  const role = State.user.role;
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  main.innerHTML = `
    <div class="page-header">
      <h2>${greeting}, ${State.user.username}! 👋</h2>
      <p>Role: ${role} • Platform: ResQFood AI</p>
    </div>
    <div class="stats-grid" id="dashboard-stats">
      <div class="stat-card"><div class="spinner"></div></div>
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
        <div class="stat-card"><div class="stat-icon green"><span class="material-icons-round">inventory_2</span></div><div class="stat-value">${donations.length}</div><div class="stat-label">Total Donations</div></div>
        <div class="stat-card"><div class="stat-icon yellow"><span class="material-icons-round">pending</span></div><div class="stat-value">${pending}</div><div class="stat-label">Pending</div></div>
        <div class="stat-card"><div class="stat-icon blue"><span class="material-icons-round">check_circle</span></div><div class="stat-value">${accepted}</div><div class="stat-label">Accepted</div></div>
        <div class="stat-card"><div class="stat-icon green"><span class="material-icons-round">local_shipping</span></div><div class="stat-value">${delivered}</div><div class="stat-label">Delivered</div></div>
      `;

      document.getElementById('dashboard-content').innerHTML = `
        <h3 class="section-title"><span class="material-icons-round">history</span> Recent Donations</h3>
        ${donations.slice(0, 5).map(d => donationCard(d)).join('') || emptyState('No donations yet', 'Start by creating your first donation!')}
      `;
    } else if (role === 'NGO') {
      const res = await api('GET', '/api/requests/ngo');
      const requests = res.data || [];
      document.getElementById('dashboard-stats').innerHTML = `
        <div class="stat-card"><div class="stat-icon blue"><span class="material-icons-round">assignment</span></div><div class="stat-value">${requests.length}</div><div class="stat-label">Total Requests</div></div>
        <div class="stat-card"><div class="stat-icon yellow"><span class="material-icons-round">pending</span></div><div class="stat-value">${requests.filter(r => r.status === 'Accepted').length}</div><div class="stat-label">Awaiting Pickup</div></div>
        <div class="stat-card"><div class="stat-icon green"><span class="material-icons-round">check_circle</span></div><div class="stat-value">${requests.filter(r => r.status === 'Delivered').length}</div><div class="stat-label">Delivered</div></div>
      `;
    } else if (role === 'Admin') {
      const [usersRes, donationsRes] = await Promise.all([
        api('GET', '/api/admin/users'),
        api('GET', '/api/admin/donations'),
      ]);
      const users = usersRes.data || [];
      const donations = donationsRes.data || [];
      document.getElementById('dashboard-stats').innerHTML = `
        <div class="stat-card"><div class="stat-icon blue"><span class="material-icons-round">people</span></div><div class="stat-value">${users.length}</div><div class="stat-label">Total Users</div></div>
        <div class="stat-card"><div class="stat-icon green"><span class="material-icons-round">inventory_2</span></div><div class="stat-value">${donations.length}</div><div class="stat-label">Total Donations</div></div>
        <div class="stat-card"><div class="stat-icon yellow"><span class="material-icons-round">verified_user</span></div><div class="stat-value">${users.filter(u => !u.isVerified).length}</div><div class="stat-label">Unverified Users</div></div>
        <div class="stat-card"><div class="stat-icon red"><span class="material-icons-round">pending</span></div><div class="stat-value">${donations.filter(d => d.status === 'Pending').length}</div><div class="stat-label">Pending Donations</div></div>
      `;
    } else {
      document.getElementById('dashboard-stats').innerHTML = `
        <div class="stat-card"><div class="stat-icon green"><span class="material-icons-round">local_shipping</span></div><div class="stat-value">—</div><div class="stat-label">Browse available tasks to get started</div></div>
      `;
    }
  } catch (err) {
    document.getElementById('dashboard-stats').innerHTML = `<p style="color:var(--text-secondary)">Could not load stats.</p>`;
  }
}

// ============================================================
// Donor: Create Donation
// ============================================================
function renderCreateDonation() {
  document.getElementById('main-content').innerHTML = `
    <div class="page-header"><h2>Create Donation</h2><p>List surplus food for NGOs to discover</p></div>
    <div class="card" style="max-width:600px;">
      <form id="donation-form">
        <div class="form-group"><label>Food Type</label><input class="form-input" id="d-foodType" placeholder="e.g. Cooked Meals, Packaged Rice" required></div>
        <div class="form-row">
          <div class="form-group"><label>Quantity</label><input class="form-input" type="number" id="d-quantity" min="0.1" step="0.1" placeholder="10" required></div>
          <div class="form-group"><label>Unit</label><select class="form-input" id="d-unit" required><option value="meals">Meals</option><option value="kg">Kg</option><option value="servings">Servings</option><option value="items">Items</option></select></div>
        </div>
        <div class="form-group"><label>Expiry Time</label><input class="form-input" type="datetime-local" id="d-expiry" required></div>
        <div class="form-group">
          <label>Pickup Address</label>
          <input class="form-input" id="d-address" placeholder="e.g. 123 MG Road, Bangalore" required>
        </div>
        <div class="form-group" style="margin-bottom: 15px;">
          <button type="button" class="btn btn-secondary" id="btn-get-location" style="width:100%; display:flex; align-items:center; justify-content:center; gap:6px;">
            <span class="material-icons-round">my_location</span> Auto-detect My Location
          </button>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Latitude</label><input class="form-input" type="number" step="any" id="d-lat" placeholder="12.9716" required></div>
          <div class="form-group"><label>Longitude</label><input class="form-input" type="number" step="any" id="d-lng" placeholder="77.5946" required></div>
        </div>
        <button class="btn btn-primary btn-full" type="submit">🍽️ Submit Donation</button>
      </form>
    </div>
  `;

  // Auto-detect location click handler
  document.getElementById('btn-get-location').onclick = () => {
    if (!navigator.geolocation) {
      toast('Geolocation is not supported by your browser', 'error');
      return;
    }
    toast('Detecting your location...', 'info');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        document.getElementById('d-lat').value = lat;
        document.getElementById('d-lng').value = lng;
        
        // Reverse-geocode coordinates to actual street address via free OpenStreetMap API
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          if (data && data.display_name) {
            document.getElementById('d-address').value = data.display_name;
            toast('Address & coordinates detected!', 'success');
            return;
          }
        } catch (e) {
          console.warn('Reverse geocoding error:', e);
        }

        toast('Coordinates detected! Please review address.', 'success');
      },
      (err) => {
        console.error('Location error:', err);
        // Fallback default coordinates if user denies or GPS fails
        document.getElementById('d-lat').value = '12.9716';
        document.getElementById('d-lng').value = '77.5946';
        if (!document.getElementById('d-address').value) {
          document.getElementById('d-address').value = 'MG Road, Bangalore';
        }
        toast('Could not fetch exact GPS. Filled default location.', 'warning');
      },
      { timeout: 8000 }
    );
  };

  // Set min expiry to now
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById('d-expiry').min = now.toISOString().slice(0, 16);

  document.getElementById('donation-form').onsubmit = async (e) => {
    e.preventDefault();
    try {
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
      toast('Donation created successfully!', 'success');
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
  main.innerHTML = `<div class="page-header"><h2>My Donations</h2><p>Track all your food donations</p></div><div id="donations-list"><div class="spinner"></div></div>`;

  try {
    const res = await api('GET', '/api/donations/donor');
    const donations = res.data || [];
    document.getElementById('donations-list').innerHTML = donations.length
      ? donations.map(d => donationCard(d)).join('')
      : emptyState('No donations yet', 'Create your first donation to get started!');
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ============================================================
// NGO: Available Donations
// ============================================================
async function renderAvailableDonations() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-header"><h2>Find Donations</h2><p>Discover surplus food near you</p></div>
    <div class="card" style="margin-bottom:20px;">
      <form id="search-form" style="display:flex;gap:12px;align-items:end;flex-wrap:wrap;">
        <div class="form-group" style="margin:0"><label>Latitude</label><input class="form-input" type="number" step="any" id="s-lat" value="12.9716" required></div>
        <div class="form-group" style="margin:0"><label>Longitude</label><input class="form-input" type="number" step="any" id="s-lng" value="77.5946" required></div>
        <div class="form-group" style="margin:0"><label>Radius (km)</label><input class="form-input" type="number" id="s-radius" value="10" min="1" max="100"></div>
        <button class="btn btn-primary" type="submit"><span class="material-icons-round">search</span> Search</button>
      </form>
    </div>
    <div id="available-list"><p style="color:var(--text-secondary);">Enter coordinates and search.</p></div>
  `;

  document.getElementById('search-form').onsubmit = async (e) => {
    e.preventDefault();
    const lat = document.getElementById('s-lat').value;
    const lng = document.getElementById('s-lng').value;
    const radius = document.getElementById('s-radius').value;
    try {
      const res = await api('GET', `/api/donations/available?latitude=${lat}&longitude=${lng}&radius=${radius}`);
      const donations = res.data || [];
      document.getElementById('available-list').innerHTML = donations.length
        ? donations.map(d => donationCard(d, true)).join('')
        : emptyState('No donations found', 'Try increasing the search radius');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  // Auto-search on load
  document.getElementById('search-form').dispatchEvent(new Event('submit'));
}

// ============================================================
// NGO: My Requests
// ============================================================
async function renderMyRequests() {
  const main = document.getElementById('main-content');
  main.innerHTML = `<div class="page-header"><h2>My Requests</h2><p>Track accepted donation requests</p></div><div id="requests-list"><div class="spinner"></div></div>`;

  try {
    const res = await api('GET', '/api/requests/ngo');
    const requests = res.data || [];
    document.getElementById('requests-list').innerHTML = requests.length
      ? requests.map(r => requestCard(r)).join('')
      : emptyState('No requests yet', 'Accept a donation to create a request');
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ============================================================
// Volunteer: Available Requests
// ============================================================
async function renderAvailableRequests() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-header"><h2>Available Tasks</h2><p>Pick up and deliver food donations</p></div>
    <div id="vol-requests"><div class="spinner"></div></div>
  `;

  try {
    const res = await api('GET', '/api/requests/available?latitude=12.9716&longitude=77.5946&radius=50');
    const requests = res.data || [];
    document.getElementById('vol-requests').innerHTML = requests.length
      ? requests.map(r => volunteerRequestCard(r)).join('')
      : emptyState('No tasks available', 'Check back later for new delivery tasks');
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ============================================================
// Notifications
// ============================================================
async function renderNotifications() {
  const main = document.getElementById('main-content');
  main.innerHTML = `<div class="page-header"><h2>Notifications</h2><p>Your activity updates</p></div><div id="notif-list"><div class="spinner"></div></div>`;

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
          <div class="card-body">${n.message}</div>
          <div class="card-footer">
            <button class="btn btn-sm btn-secondary" onclick="App.markRead('${n._id}')">Mark as Read</button>
          </div>
        </div>`).join('')
      : emptyState('All caught up!', 'No unread notifications');
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ============================================================
// Admin: Users
// ============================================================
async function renderAdminUsers() {
  const main = document.getElementById('main-content');
  main.innerHTML = `<div class="page-header"><h2>User Management</h2><p>All registered users</p></div><div id="users-table"><div class="spinner"></div></div>`;

  try {
    const res = await api('GET', '/api/admin/users');
    const users = res.data || [];
    document.getElementById('users-table').innerHTML = `
      <div class="card" style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Verified</th><th>Action</th></tr></thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td style="color:var(--text-primary);font-weight:500">${u.username}</td>
                <td>${u.email}</td>
                <td><span class="badge badge-accepted">${u.role}</span></td>
                <td>${u.isVerified ? '✅ Yes' : '❌ No'}</td>
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
// Admin: Donations
// ============================================================
async function renderAdminDonations() {
  const main = document.getElementById('main-content');
  main.innerHTML = `<div class="page-header"><h2>All Donations</h2><p>Platform-wide donation overview</p></div><div id="admin-donations"><div class="spinner"></div></div>`;

  try {
    const res = await api('GET', '/api/admin/donations');
    const donations = res.data || [];
    document.getElementById('admin-donations').innerHTML = donations.length
      ? donations.map(d => donationCard(d)).join('')
      : emptyState('No donations', 'No donations on the platform yet');
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ============================================================
// UI Components
// ============================================================
function statusBadge(status) {
  const cls = {
    Pending: 'pending', Accepted: 'accepted', Assigned: 'assigned',
    PickedUp: 'pickedup', Delivered: 'delivered', Expired: 'expired', Cancelled: 'cancelled',
  };
  return `<span class="badge badge-${cls[status] || 'pending'}">${status}</span>`;
}

function donationCard(d, showAccept = false) {
  const donor = d.donorId?.username || d.donorId?.email || '—';
  return `
    <div class="card">
      <div class="card-header">
        <h3>${d.foodType}</h3>
        ${statusBadge(d.status)}
      </div>
      <div class="card-body">
        <div class="detail-row"><span class="label">Quantity</span><span>${d.quantity} ${d.unit}</span></div>
        <div class="detail-row"><span class="label">Pickup</span><span>${d.pickupLocation?.address || '—'}</span></div>
        <div class="detail-row"><span class="label">Expiry</span><span>${new Date(d.expiryTime).toLocaleString()}</span></div>
        ${typeof d.donorId === 'object' ? `<div class="detail-row"><span class="label">Donor</span><span>${donor}</span></div>` : ''}
      </div>
      ${showAccept && d.status === 'Pending' ? `
        <div class="card-footer">
          <button class="btn btn-sm btn-success" onclick="App.acceptDonation('${d._id}')">
            <span class="material-icons-round">check</span> Accept
          </button>
        </div>` : ''}
    </div>`;
}

function requestCard(r) {
  const donation = r.donationId || {};
  const volunteer = r.volunteerId;
  return `
    <div class="card">
      <div class="card-header">
        <h3>${donation.foodType || 'Donation'}</h3>
        ${statusBadge(r.status)}
      </div>
      <div class="card-body">
        <div class="detail-row"><span class="label">Quantity</span><span>${donation.quantity || '—'} ${donation.unit || ''}</span></div>
        <div class="detail-row"><span class="label">Volunteer</span><span>${volunteer?.username || 'Not assigned yet'}</span></div>
        <div class="detail-row"><span class="label">Accepted</span><span>${timeAgo(r.statusTimestamps?.acceptedAt)}</span></div>
      </div>
    </div>`;
}

function volunteerRequestCard(r) {
  const donation = r.donationId || {};
  const isAssignedToMe = r.volunteerId?.toString() === State.user?._id;
  return `
    <div class="card">
      <div class="card-header">
        <h3>${donation.foodType || 'Delivery Task'}</h3>
        ${statusBadge(r.status)}
      </div>
      <div class="card-body">
        <div class="detail-row"><span class="label">Quantity</span><span>${donation.quantity || '—'} ${donation.unit || ''}</span></div>
        <div class="detail-row"><span class="label">Pickup</span><span>${donation.pickupLocation?.address || '—'}</span></div>
        <div class="detail-row"><span class="label">NGO</span><span>${r.ngoId?.organizationName || r.ngoId?.username || '—'}</span></div>
      </div>
      <div class="card-footer">
        ${r.status === 'Accepted' ? `<button class="btn btn-sm btn-primary" onclick="App.assignSelf('${r._id}')"><span class="material-icons-round">assignment_ind</span> Take Task</button>` : ''}
        ${r.status === 'Assigned' ? `<button class="btn btn-sm btn-success" onclick="App.markPickup('${r._id}')"><span class="material-icons-round">inventory</span> Mark Picked Up</button>` : ''}
        ${r.status === 'PickedUp' ? `<button class="btn btn-sm btn-success" onclick="App.markDeliver('${r._id}')"><span class="material-icons-round">check_circle</span> Mark Delivered</button>` : ''}
      </div>
    </div>`;
}

function emptyState(title, subtitle) {
  return `<div class="empty-state"><span class="material-icons-round">inbox</span><h3>${title}</h3><p>${subtitle}</p></div>`;
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
    toast('Signed out', 'info');
  },

  async acceptDonation(id) {
    try {
      await api('POST', `/api/donations/${id}/accept`);
      toast('Donation accepted!', 'success');
      renderPage(State.currentPage);
    } catch (err) { toast(err.message, 'error'); }
  },

  async verifyUser(id) {
    try {
      await api('PUT', `/api/admin/users/${id}/verify`);
      toast('User verified!', 'success');
      renderPage('admin-users');
    } catch (err) { toast(err.message, 'error'); }
  },

  async assignSelf(id) {
    try {
      await api('POST', `/api/requests/${id}/assign`);
      toast('Task assigned to you!', 'success');
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
// Boot
// ============================================================
(async function boot() {
  if (State.token) {
    await loadUser();
  } else {
    renderAuth();
  }
})();
