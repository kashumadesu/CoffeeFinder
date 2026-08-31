// ============================================================
// KapeRoute PH — Web Administrator & Permit Moderation App (app.js)
// ============================================================

(function () {
  'use strict';

  const ADMIN_MASTER_PIN = '102403';
  const STORAGE_KEY = 'kape_admin_claims_v2';
  const AUTH_KEY = 'kape_admin_authenticated';

  // Seed sample Philippine specialty coffee permit claims if none in localStorage
  const DEFAULT_CLAIMS = [
    {
      id: 'claim-17251001',
      shopId: 'ph-chapter-coffee',
      shopName: 'Chapter Coffee Roastery',
      ownerFullName: 'Marco Antonio Santos',
      businessEmail: 'marco@chaptercoffee.ph',
      phoneNumber: '+63 917 888 2341',
      permitType: 'DTI Registration',
      dtiOrSecNumber: 'DTI-NCR-2024-883192',
      permitPhotoUri: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80',
      status: 'pending',
      submittedAt: 'Aug 30, 2026 10:15 AM',
      rejectionReason: null,
    },
    {
      id: 'claim-17251002',
      shopId: 'ph-yardstick',
      shopName: 'Yardstick Coffee Legazpi',
      ownerFullName: 'Andre Joseph Chanco',
      businessEmail: 'management@yardstickcoffee.com',
      phoneNumber: '+63 917 554 9012',
      permitType: "Mayor's Business Permit",
      dtiOrSecNumber: 'MAKATI-BP-2025-004419',
      permitPhotoUri: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&q=80',
      status: 'pending',
      submittedAt: 'Aug 31, 2026 08:30 AM',
      rejectionReason: null,
    },
    {
      id: 'claim-17251003',
      shopId: 'ph-hab-coffee',
      shopName: 'Habitual Coffee Salcedo',
      ownerFullName: 'Kaye Marie Ong',
      businessEmail: 'kaye@habitualcoffee.ph',
      phoneNumber: '+63 920 911 3490',
      permitType: 'DTI Registration',
      dtiOrSecNumber: 'DTI-NCR-2023-551029',
      permitPhotoUri: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80',
      status: 'verified',
      submittedAt: 'Aug 28, 2026 02:20 PM',
      rejectionReason: null,
    },
    {
      id: 'claim-17251004',
      shopId: 'ph-el-union',
      shopName: 'El Union Coffee San Juan',
      ownerFullName: 'Alexander Douglas',
      businessEmail: 'alex@elunioncoffee.com',
      phoneNumber: '+63 917 772 1044',
      permitType: "Mayor's Business Permit",
      dtiOrSecNumber: 'LU-SJU-BP-2025-9982',
      permitPhotoUri: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&q=80',
      status: 'verified',
      submittedAt: 'Aug 27, 2026 11:45 AM',
      rejectionReason: null,
    },
  ];

  // Application State
  const state = {
    claims: [],
    filterStatus: 'pending',
    searchQuery: '',
    selectedDoc: null,
  };

  // Initialize Data
  function loadData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        state.claims = JSON.parse(stored);
      } else {
        state.claims = [...DEFAULT_CLAIMS];
        saveData();
      }
    } catch (e) {
      state.claims = [...DEFAULT_CLAIMS];
    }
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.claims));
    } catch (e) {
      console.error('Failed to persist claims:', e);
    }
  }

  // DOM Elements Builder (Pure JS App)
  function initApp() {
    loadData();
    buildLayout();
    checkAuth();
    attachGlobalHandlers();
    render();
  }

  function checkAuth() {
    const isAuthed = sessionStorage.getItem(AUTH_KEY) === 'true';
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
      if (isAuthed) {
        loginModal.classList.add('hidden');
      } else {
        loginModal.classList.remove('hidden');
      }
    }
  }

  function buildLayout() {
    const root = document.getElementById('app');
    if (!root) return;

    root.innerHTML = `
      <!-- Top Navigation -->
      <header class="bg-brand-700 text-white shadow-md sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center border border-brand-400">
              <i data-feather="shield" class="w-5 h-5 text-white"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-extrabold text-base tracking-tight">KapeRoute PH</span>
                <span class="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-emerald-400/30">Admin Console</span>
              </div>
              <p class="text-[11px] text-stone-300 font-medium">Philippine Specialty Coffee Permit Verification & Claims Moderation</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button id="btnSync" class="p-2 hover:bg-brand-600 rounded-lg text-stone-200 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold">
              <i data-feather="refresh-cw" class="w-4 h-4"></i>
              <span class="hidden sm:inline">Sync Live</span>
            </button>
            <button id="btnExportCSV" class="p-2 hover:bg-brand-600 rounded-lg text-stone-200 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold">
              <i data-feather="download" class="w-4 h-4"></i>
              <span class="hidden sm:inline">Export CSV</span>
            </button>
            <div class="h-6 w-px bg-brand-600"></div>
            <div class="flex items-center gap-2 bg-brand-800/80 px-3 py-1.5 rounded-lg border border-brand-600/50">
              <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span class="text-xs font-mono text-stone-200">michaelapril81416</span>
            </div>
            <button id="btnLogout" class="p-2 hover:bg-red-500/20 text-stone-300 hover:text-red-300 rounded-lg transition" title="Lock Admin Portal">
              <i data-feather="log-out" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </header>

      <!-- Main Dashboard Container -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8">
        
        <!-- KPI Metrics Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="kpiContainer">
          <!-- Rendered dynamically -->
        </div>

        <!-- Permit Claims Audit & Moderation Queue -->
        <section class="glass-card rounded-2xl shadow-sm border border-stone-200/90 overflow-hidden">
          <div class="p-5 border-b border-stone-200 bg-stone-100/60 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-lg font-extrabold text-stone-900">Permit Claims Verification Queue</h2>
                <span id="queueBadge" class="px-2.5 py-0.5 bg-amber-500 text-white text-xs font-black rounded-full shadow-sm">0 Pending</span>
              </div>
              <p class="text-xs text-stone-500 mt-0.5">Audit DTI/SEC registrations and Mayor's Permits, cross-check credentials, and grant verified badges.</p>
            </div>

            <!-- Filters & Search Toolbar -->
            <div class="flex flex-wrap items-center gap-3">
              <div class="relative w-64">
                <i data-feather="search" class="w-4 h-4 text-stone-400 absolute left-3 top-2.5"></i>
                <input 
                  type="text" 
                  id="claimSearchInput" 
                  placeholder="Search claims, owner, permit #..." 
                  class="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
              </div>

              <div class="flex items-center gap-1.5 bg-stone-200/80 p-1 rounded-xl" id="filterPillsContainer">
                <!-- Rendered dynamically -->
              </div>
            </div>
          </div>

          <!-- Claims Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm text-stone-700">
              <thead class="bg-stone-50 text-[11px] font-extrabold uppercase text-stone-500 tracking-wider border-b border-stone-200">
                <tr>
                  <th class="px-6 py-3.5">Café Name</th>
                  <th class="px-6 py-3.5">Applicant & Business Email</th>
                  <th class="px-6 py-3.5">Permit & Registration #</th>
                  <th class="px-6 py-3.5">Document Scan</th>
                  <th class="px-6 py-3.5">Submitted</th>
                  <th class="px-6 py-3.5">Status</th>
                  <th class="px-6 py-3.5 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody id="claimsTableBody" class="divide-y divide-stone-200">
                <!-- Rendered dynamically -->
              </tbody>
            </table>
          </div>
        </section>

      </main>

      <!-- Auth Passcode Modal -->
      <div id="loginModal" class="fixed inset-0 z-50 bg-stone-900/90 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-card max-w-md w-full rounded-2xl shadow-2xl p-8 border border-stone-200 text-center">
          <div class="w-16 h-16 bg-brand-50 border-2 border-brand-500 rounded-2xl mx-auto flex items-center justify-center mb-5 shadow-inner">
            <i data-feather="shield" class="w-8 h-8 text-brand-500"></i>
          </div>
          <h2 class="text-2xl font-extrabold text-stone-900 tracking-tight">KapeRoute PH</h2>
          <p class="text-xs font-semibold text-brand-500 uppercase tracking-wider mt-1 mb-6">Permit Claims Moderation Portal</p>
          
          <div class="space-y-4 text-left">
            <div>
              <label class="block text-xs font-bold text-stone-600 uppercase mb-1 tracking-wider">Admin Security Passcode</label>
              <input 
                type="password" 
                id="adminPinInput" 
                placeholder="••••••" 
                class="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-center text-lg tracking-widest bg-stone-50"
                maxlength="8"
              />
            </div>
            <button 
              id="btnSubmitLogin" 
              class="w-full py-3.5 bg-brand-500 hover:bg-brand-600 active:scale-[0.99] transition text-white font-bold rounded-xl shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2"
            >
              <i data-feather="lock" class="w-4 h-4"></i>
              <span>Authenticate Administrator</span>
            </button>
          </div>

          <div class="mt-6 pt-5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Authorized: <strong class="text-stone-700">michaelapril81416@gmail.com</strong></span>
            <span class="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded border border-emerald-200">v2.5 Pro</span>
          </div>
        </div>
      </div>

      <!-- Document Inspector Modal -->
      <div id="docViewerModal" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm hidden items-center justify-center p-4">
        <div class="bg-white max-w-3xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          <div class="p-4 bg-stone-900 text-white flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i data-feather="file-text" class="w-5 h-5 text-amber-400"></i>
              <h3 id="docViewerTitle" class="font-bold text-sm">Permit Document Inspection</h3>
            </div>
            <button id="btnCloseDocViewer" class="p-1.5 hover:bg-stone-800 rounded-lg text-stone-300 hover:text-white transition">
              <i data-feather="x" class="w-5 h-5"></i>
            </button>
          </div>
          <div class="p-4 overflow-auto bg-stone-100 flex items-center justify-center flex-1 min-h-[380px]">
            <img id="docViewerImage" src="" alt="Permit Document" class="max-h-[65vh] max-w-full rounded-lg shadow-md border border-stone-300 object-contain bg-white" />
          </div>
          <div class="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
            <p id="docViewerSubtitle" class="text-xs font-mono text-stone-600 font-bold"></p>
            <button id="btnCloseDocViewer2" class="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold rounded-lg transition">Close Inspection</button>
          </div>
        </div>
      </div>
    `;

    if (window.feather) window.feather.replace();
  }

  function attachGlobalHandlers() {
    // Auth login
    const btnSubmitLogin = document.getElementById('btnSubmitLogin');
    const adminPinInput = document.getElementById('adminPinInput');
    if (btnSubmitLogin) {
      btnSubmitLogin.addEventListener('click', () => {
        const pin = (adminPinInput?.value || '').trim();
        if (pin === ADMIN_MASTER_PIN) {
          sessionStorage.setItem(AUTH_KEY, 'true');
          checkAuth();
          render();
        } else {
          alert('Invalid Security Passcode. Access denied.');
        }
      });
    }
    if (adminPinInput) {
      adminPinInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') btnSubmitLogin?.click();
      });
    }

    // Logout
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        sessionStorage.removeItem(AUTH_KEY);
        checkAuth();
        if (adminPinInput) adminPinInput.value = '';
      });
    }

    // Sync button
    const btnSync = document.getElementById('btnSync');
    if (btnSync) {
      btnSync.addEventListener('click', () => {
        loadData();
        render();
        alert('✓ Live permit claims synchronized.');
      });
    }

    // Export CSV
    const btnExportCSV = document.getElementById('btnExportCSV');
    if (btnExportCSV) {
      btnExportCSV.addEventListener('click', exportCSV);
    }

    // Search input
    const searchInput = document.getElementById('claimSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = (e.target.value || '').trim().toLowerCase();
        renderTable();
      });
    }

    // Doc viewer close buttons
    const btnClose1 = document.getElementById('btnCloseDocViewer');
    const btnClose2 = document.getElementById('btnCloseDocViewer2');
    const docModal = document.getElementById('docViewerModal');
    [btnClose1, btnClose2].forEach((btn) => {
      btn?.addEventListener('click', () => {
        if (docModal) {
          docModal.classList.add('hidden');
          docModal.classList.remove('flex');
        }
      });
    });
  }

  // Render Functions
  function render() {
    renderKPIs();
    renderFilterPills();
    renderTable();
    if (window.feather) window.feather.replace();
  }

  function renderKPIs() {
    const container = document.getElementById('kpiContainer');
    if (!container) return;

    const totalClaims = state.claims.length;
    const pendingClaims = state.claims.filter((c) => c.status === 'pending').length;
    const verifiedClaims = state.claims.filter((c) => c.status === 'verified').length;
    const rejectedClaims = state.claims.filter((c) => c.status === 'rejected').length;

    const badge = document.getElementById('queueBadge');
    if (badge) badge.innerText = `${pendingClaims} Pending`;

    container.innerHTML = `
      <!-- Total Submissions -->
      <div class="glass-card p-5 rounded-2xl shadow-sm border border-stone-200/80 flex items-center justify-between">
        <div>
          <p class="text-xs font-bold uppercase text-stone-500 tracking-wider">Total Claims Filed</p>
          <h3 class="text-2xl font-black text-stone-900 mt-1">${totalClaims}</h3>
          <span class="text-[11px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded mt-2 inline-block">Applications Logged</span>
        </div>
        <div class="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-brand-600">
          <i data-feather="inbox" class="w-6 h-6"></i>
        </div>
      </div>

      <!-- Pending Audit -->
      <div class="glass-card p-5 rounded-2xl shadow-sm border border-amber-200/80 bg-amber-50/40 flex items-center justify-between">
        <div>
          <p class="text-xs font-bold uppercase text-amber-800 tracking-wider">Pending Audit Queue</p>
          <h3 class="text-2xl font-black text-amber-900 mt-1">${pendingClaims}</h3>
          <span class="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded mt-2 inline-block">Requires Document Review</span>
        </div>
        <div class="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-700">
          <i data-feather="clock" class="w-6 h-6"></i>
        </div>
      </div>

      <!-- Verified Checkmarks -->
      <div class="glass-card p-5 rounded-2xl shadow-sm border border-emerald-200/80 bg-emerald-50/40 flex items-center justify-between">
        <div>
          <p class="text-xs font-bold uppercase text-emerald-800 tracking-wider">Verified Badges</p>
          <h3 class="text-2xl font-black text-emerald-900 mt-1">${verifiedClaims}</h3>
          <span class="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded mt-2 inline-block">Green ✓ Active</span>
        </div>
        <div class="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700">
          <i data-feather="check-circle" class="w-6 h-6"></i>
        </div>
      </div>

      <!-- Rejected / Flagged -->
      <div class="glass-card p-5 rounded-2xl shadow-sm border border-rose-200/80 bg-rose-50/40 flex items-center justify-between">
        <div>
          <p class="text-xs font-bold uppercase text-rose-800 tracking-wider">Rejected / Flagged</p>
          <h3 class="text-2xl font-black text-rose-900 mt-1">${rejectedClaims}</h3>
          <span class="text-[11px] font-semibold text-rose-800 bg-rose-100 px-2 py-0.5 rounded mt-2 inline-block">Invalid / Mismatched</span>
        </div>
        <div class="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-700">
          <i data-feather="alert-triangle" class="w-6 h-6"></i>
        </div>
      </div>
    `;
  }

  function renderFilterPills() {
    const container = document.getElementById('filterPillsContainer');
    if (!container) return;

    const filters = [
      { id: 'all', label: `All (${state.claims.length})` },
      { id: 'pending', label: `Pending (⚡ ${state.claims.filter((c) => c.status === 'pending').length})` },
      { id: 'verified', label: `Verified (✓ ${state.claims.filter((c) => c.status === 'verified').length})` },
      { id: 'rejected', label: `Rejected (${state.claims.filter((c) => c.status === 'rejected').length})` },
    ];

    container.innerHTML = filters
      .map(
        (f) => `
        <button 
          data-filter="${f.id}" 
          class="filter-pill-btn px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            state.filterStatus === f.id
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200'
          }"
        >
          ${f.label}
        </button>
      `,
      )
      .join('');

    container.querySelectorAll('.filter-pill-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.filterStatus = btn.getAttribute('data-filter') || 'all';
        renderFilterPills();
        renderTable();
      });
    });
  }

  function renderTable() {
    const tbody = document.getElementById('claimsTableBody');
    if (!tbody) return;

    const filtered = state.claims.filter((claim) => {
      const q = state.searchQuery;
      const matchesSearch =
        !q ||
        claim.shopName.toLowerCase().includes(q) ||
        claim.ownerFullName.toLowerCase().includes(q) ||
        claim.businessEmail.toLowerCase().includes(q) ||
        claim.dtiOrSecNumber.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (state.filterStatus !== 'all' && claim.status !== state.filterStatus) return false;
      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="px-6 py-12 text-center text-stone-400 font-medium">
            <i data-feather="inbox" class="w-8 h-8 mx-auto mb-2 text-stone-300"></i>
            No permit claims match your filter criteria.
          </td>
        </tr>
      `;
      if (window.feather) window.feather.replace();
      return;
    }

    tbody.innerHTML = filtered
      .map((c) => {
        const isPending = c.status === 'pending';
        const isVerified = c.status === 'verified';
        const isRejected = c.status === 'rejected';

        return `
        <tr class="hover:bg-stone-50/80 transition">
          <!-- Shop Info -->
          <td class="px-6 py-4">
            <div class="font-extrabold text-stone-900 flex items-center gap-1.5">
              <span>${c.shopName}</span>
              ${isVerified ? '<i data-feather="check-circle" class="w-3.5 h-3.5 text-emerald-600"></i>' : ''}
            </div>
            <div class="text-xs text-stone-400 font-mono">ID: ${c.shopId}</div>
          </td>

          <!-- Applicant Details -->
          <td class="px-6 py-4">
            <div class="font-bold text-stone-800">${c.ownerFullName}</div>
            <div class="text-xs text-stone-500">${c.businessEmail}</div>
            <div class="text-xs text-stone-400 font-mono">${c.phoneNumber}</div>
          </td>

          <!-- Registration Credentials -->
          <td class="px-6 py-4">
            <span class="px-2 py-0.5 bg-stone-100 text-stone-700 text-xs font-semibold rounded">${c.permitType}</span>
            <div class="text-xs font-mono font-bold text-brand-600 mt-1">${c.dtiOrSecNumber}</div>
            ${
              c.rejectionReason
                ? `<div class="text-[11px] text-rose-600 font-medium mt-1 max-w-xs leading-tight">Note: ${c.rejectionReason}</div>`
                : ''
            }
          </td>

          <!-- Document Inspection -->
          <td class="px-6 py-4">
            ${
              c.permitPhotoUri
                ? `
                <button 
                  data-inspect-id="${c.id}" 
                  class="btn-inspect flex items-center gap-1.5 px-2.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold rounded-lg border border-brand-200 transition"
                >
                  <i data-feather="eye" class="w-3.5 h-3.5"></i>
                  <span>Inspect Scan</span>
                </button>
              `
                : `<span class="text-xs text-stone-400">No Document</span>`
            }
          </td>

          <!-- Date -->
          <td class="px-6 py-4 text-xs text-stone-500">${c.submittedAt}</td>

          <!-- Status Badge -->
          <td class="px-6 py-4">
            ${
              isPending
                ? `
                <span class="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-extrabold rounded-full inline-flex items-center gap-1 border border-amber-200">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                  Pending Audit
                </span>
              `
                : isVerified
                ? `
                <span class="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-full inline-flex items-center gap-1 border border-emerald-200">
                  <i data-feather="check" class="w-3 h-3"></i>
                  Verified ✓
                </span>
              `
                : `
                <span class="px-2.5 py-1 bg-rose-100 text-rose-800 text-xs font-extrabold rounded-full inline-flex items-center gap-1 border border-rose-200">
                  <i data-feather="x" class="w-3 h-3"></i>
                  Rejected
                </span>
              `
            }
          </td>

          <!-- Actions Toolbar -->
          <td class="px-6 py-4 text-right">
            <div class="flex items-center justify-end gap-2">
              ${
                isPending
                  ? `
                  <button data-approve-id="${c.id}" class="btn-approve px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1 transition">
                    <i data-feather="check" class="w-3.5 h-3.5"></i>
                    <span>Approve</span>
                  </button>
                  <button data-reject-id="${c.id}" class="btn-reject px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 transition">
                    Reject
                  </button>
                `
                  : isVerified
                  ? `
                  <button data-revoke-id="${c.id}" class="btn-revoke px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-lg border border-amber-200 transition">
                    Revoke Badge
                  </button>
                `
                  : `
                  <button data-approve-id="${c.id}" class="btn-approve px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1 transition">
                    <i data-feather="check" class="w-3.5 h-3.5"></i>
                    <span>Re-Approve</span>
                  </button>
                `
              }
              <!-- Purge/Delete Spam -->
              <button data-delete-id="${c.id}" class="btn-delete p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition" title="Purge spam application">
                <i data-feather="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
      })
      .join('');

    // Attach row action listeners
    tbody.querySelectorAll('.btn-inspect').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-inspect-id');
        const claim = state.claims.find((c) => c.id === id);
        if (claim && claim.permitPhotoUri) {
          openDocViewer(claim.permitPhotoUri, claim.shopName, claim.dtiOrSecNumber, claim.permitType);
        }
      });
    });

    tbody.querySelectorAll('.btn-approve').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-approve-id');
        approveClaim(id);
      });
    });

    tbody.querySelectorAll('.btn-reject').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-reject-id');
        rejectClaim(id);
      });
    });

    tbody.querySelectorAll('.btn-revoke').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-revoke-id');
        revokeClaim(id);
      });
    });

    tbody.querySelectorAll('.btn-delete').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-delete-id');
        deleteClaim(id);
      });
    });

    if (window.feather) window.feather.replace();
  }

  function openDocViewer(photoUri, shopName, regNumber, permitType) {
    const docModal = document.getElementById('docViewerModal');
    const docTitle = document.getElementById('docViewerTitle');
    const docSub = document.getElementById('docViewerSubtitle');
    const docImg = document.getElementById('docViewerImage');

    if (docTitle) docTitle.innerText = `Permit Inspection — ${shopName}`;
    if (docSub) docSub.innerText = `${permitType}: ${regNumber}`;
    if (docImg) docImg.src = photoUri;

    if (docModal) {
      docModal.classList.remove('hidden');
      docModal.classList.add('flex');
    }
  }

  // Moderation Handlers
  function approveClaim(claimId) {
    const claim = state.claims.find((c) => c.id === claimId);
    if (!claim) return;

    claim.status = 'verified';
    claim.rejectionReason = null;
    saveData();
    render();
    alert(`✓ Verified status granted to "${claim.shopName}". Owner dashboard unlocked.`);
  }

  function rejectClaim(claimId) {
    const claim = state.claims.find((c) => c.id === claimId);
    if (!claim) return;

    const reason = prompt(
      `Please provide rejection explanation for "${claim.shopName}":`,
      'Permit registration number did not match local government or DTI registry records.',
    );

    if (reason !== null) {
      claim.status = 'rejected';
      claim.rejectionReason = reason.trim() || 'Credentials verification failed.';
      saveData();
      render();
      alert(`Permit claim for "${claim.shopName}" has been rejected.`);
    }
  }

  function revokeClaim(claimId) {
    const claim = state.claims.find((c) => c.id === claimId);
    if (!claim) return;

    if (confirm(`Revoke verified badge for "${claim.shopName}"? The café owner portal will be locked.`)) {
      claim.status = 'rejected';
      claim.rejectionReason = 'Verification revoked by administrator upon fraud/document audit.';
      saveData();
      render();
      alert(`Verification badge revoked for "${claim.shopName}".`);
    }
  }

  function deleteClaim(claimId) {
    const claim = state.claims.find((c) => c.id === claimId);
    if (!claim) return;

    if (confirm(`Permanently delete the permit claim for "${claim.shopName}"? This is recommended for spam or duplicate submissions.`)) {
      state.claims = state.claims.filter((c) => c.id !== claimId);
      saveData();
      render();
    }
  }

  function exportCSV() {
    let csv = 'Claim ID,Shop Name,Owner Name,Email,Phone,Permit Type,Registration Number,Status,Submitted At,Rejection Note\n';
    state.claims.forEach((c) => {
      csv += `"${c.id}","${c.shopName}","${c.ownerFullName}","${c.businessEmail}","${c.phoneNumber}","${c.permitType}","${c.dtiOrSecNumber}","${c.status}","${c.submittedAt}","${c.rejectionReason || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kaperoute_claims_export_${Date.now()}.csv`;
    a.click();
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
