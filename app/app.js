/* ===== Creator Hub Creator Network — Complete Application Logic ===== */

// ===== NAVIGATION =====
const pages = ['index','courses','about','contact','account','course-level1','course-assessment','course-senior','course-junior','course-driver-beginner','course-driver-intermediate','course-driver-advanced','course-view','payment','map','music','lesson','quiz','tiktok','tiktok-track','tiktok-admin'];
window.pages = pages;

function navigate(page) {
  pages.forEach(p => {
    const el = document.getElementById('page-' + p);
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById('page-' + page);
  if (target) target.style.display = 'block';
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelectorAll(`.nav-link[data-page="${page}"]`).forEach(l => l.classList.add('active'));
  window.scrollTo(0, 0);
  const nav = document.querySelector('.navbar nav');
  if (nav) nav.classList.remove('open');
  if (page.startsWith('course-')) {
    if (page === 'course-view') {
      // TVET course — render from NEW_COURSES
      loadTVETCourseContent();
    } else {
      loadCourseContent(page);
    }
  }
  if (page === 'account') loadAccountData();
  if (page === 'map') initMap();
  if (page === 'tiktok' && typeof renderTikTokServices === 'function') renderTikTokServices();
  if (page === 'tiktok-track' && typeof renderTikTokTrack === 'function') renderTikTokTrack();
  if (page === 'tiktok-admin' && typeof renderTikTokAdmin === 'function') renderTikTokAdmin();
}

// ===== MODALS =====
function openModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.add('active'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('active'); document.body.style.overflow = ''; }
}
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// ===== TOAST =====
function showToast(msg, isError) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (isError ? ' error' : '');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ===== AUTH =====
function getUser() {
  try { return JSON.parse(localStorage.getItem('chcn_user')); } catch { return null; }
}
function setUser(u) { localStorage.setItem('chcn_user', JSON.stringify(u)); updateAuthUI(); }

// ===== ACCOUNT REGISTRY =====
// chcn_accounts stores all registered accounts keyed by email.
// Format: { "user@example.com": { name, email, password, status, headline, bio, phone, addr1, addr2, city, state, zip, country, privacy, ... }, ... }
function getAccounts() {
  try { return JSON.parse(localStorage.getItem('chcn_accounts')) || {}; } catch { return {}; }
}
function saveAccounts(accounts) { try { localStorage.setItem('chcn_accounts', JSON.stringify(accounts)); } catch(e) { console.warn('Could not save accounts:', e); } }

// ===== PASSWORD HASHING (SHA-256 + salt) =====
function hashPassword(password, salt) {
  if (!salt) salt = generateSalt();
  // NOTE (security): this is a salted NON-cryptographic 32-bit digest, NOT
  // SHA-256 and NOT a security boundary. Client-side localStorage auth cannot
  // protect credentials. The real auth + hashing boundary is the Supabase
  // backend in database/migrations/ (Supabase Auth manages password hashing
  // server-side). See docs/security/SECURITY_AUDIT.md. Kept only so the
  // offline demo profile continues to work exactly as before.
  const combined = salt + ':' + password;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const chr = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32-bit integer
  }
  // Create a longer hash by processing in chunks
  let hash2 = 0;
  for (let i = combined.length - 1; i >= 0; i--) {
    const chr = combined.charCodeAt(i);
    hash2 = ((hash2 << 7) - hash2) + chr;
    hash2 |= 0;
  }
  return salt + ':' + Math.abs(hash).toString(36) + Math.abs(hash2).toString(36);
}

function generateSalt() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) {
    // Legacy plaintext — migrate on next login
    return storedHash === password;
  }
  const salt = storedHash.split(':')[0];
  const computed = hashPassword(password, salt);
  return computed === storedHash;
}

function isHashed(pw) {
  return pw && pw.includes(':') && pw.length > 20;
}

function getAccount(email) { var acc = getAccounts(); return acc[email] || null; }
function saveAccountToRegistry(u) {
  if (!u || !u.email) return;
  var acc = getAccounts();
  acc[u.email] = u;
  saveAccounts(acc);
}
function removeAccountFromRegistry(email) {
  if (!email) return;
  var acc = getAccounts();
  delete acc[email];
  saveAccounts(acc);
}
function getEnrolled() {
  try { return JSON.parse(localStorage.getItem('chcn_enrolled')) || []; } catch { return []; }
}
function setEnrolled(arr) { localStorage.setItem('chcn_enrolled', JSON.stringify(arr)); }
function getProgress() {
  try { return JSON.parse(localStorage.getItem('chcn_progress')) || {}; } catch { return {}; }
}
function setProgress(obj) { localStorage.setItem('chcn_progress', JSON.stringify(obj)); }
function getWishlist() {
  try { return JSON.parse(localStorage.getItem('chcn_wishlist')) || []; } catch { return []; }
}
function setWishlist(arr) { localStorage.setItem('chcn_wishlist', JSON.stringify(arr)); }
function getCertificates() {
  try { return JSON.parse(localStorage.getItem('chcn_certs')) || []; } catch { return []; }
}
function setCertificates(arr) { localStorage.setItem('chcn_certs', JSON.stringify(arr)); }

function updateAuthUI() {
  const u = getUser();
  const signinBtn = document.querySelector('.nav-btn-signin');
  const signoutBtn = document.querySelector('.nav-btn-signout');
  const accountLink = document.querySelector('.nav-link-account');
  if (u) {
    signinBtn.style.display = 'none';
    signoutBtn.style.display = 'inline-block';
    accountLink.style.display = 'inline-block';
    if (document.getElementById('accountAvatar')) document.getElementById('accountAvatar').textContent = (u.name || 'U')[0].toUpperCase();
    if (document.getElementById('accountName')) document.getElementById('accountName').textContent = u.name || 'User';
    if (document.getElementById('accountEmail')) document.getElementById('accountEmail').textContent = u.email || '';
  } else {
    signinBtn.style.display = 'inline-block';
    signoutBtn.style.display = 'none';
    accountLink.style.display = 'none';
  }
}

function handleSignIn(e) {
  e.preventDefault();
  const email = e.target.querySelector('input[type="email"]').value.trim().toLowerCase();
  const pass = e.target.querySelector('input[type="password"]').value;
  if (!email || !pass) { showToast('Please fill in all fields', true); return; }
  // Look up the account in the registry
  var account = getAccount(email);
  if (!account) {
    showToast('No account found with that email. Please sign up first.', true);
    return;
  }
  if (!verifyPassword(pass, account.password)) {
    showToast('Incorrect password. Please try again.', true);
    return;
  }
  // Successful login — migrate legacy plaintext password to hashed
  if (!isHashed(account.password)) {
    account.password = hashPassword(pass);
    saveAccountToRegistry(account);
  }
  setUser(account);
  closeModal('loginModal');
  showToast('Welcome back, ' + (account.name || email.split('@')[0]) + '!');
}

function handleSignUp(e) {
  e.preventDefault();
  const inputs = e.target.querySelectorAll('input');
  const name = inputs[0].value.trim();
  const email = inputs[1].value.trim().toLowerCase();
  const pass = inputs[2].value;
  if (!name || !email || !pass) { showToast('Please fill in all fields', true); return; }
  // Check if account already exists
  if (getAccount(email)) {
    showToast('An account with that email already exists. Please sign in instead.', true);
    return;
  }
  var newAccount = { name: name, email: email, password: hashPassword(pass), createdAt: Date.now() };
  setUser(newAccount);
  saveAccountToRegistry(newAccount);
  e.target.querySelector('.success-msg').classList.add('show');
  setTimeout(() => { closeModal('signupModal'); showToast('Account created! You are now signed in.'); }, 1500);
}

function handleSignOut() {
  // Save current user data to registry before clearing session
  var u = getUser();
  if (u && u.email) { saveAccountToRegistry(u); }
  localStorage.removeItem('chcn_user');
  updateAuthUI();
  navigate('index');
  showToast('Signed out successfully');
}

function handleForgotPassword(e) {
  e.preventDefault();
  const email = e.target.querySelector('input[type="email"]').value.trim().toLowerCase();
  if (!email) { showToast('Please enter your email address', true); return; }
  var account = getAccount(email);
  if (!account) { showToast('No account found with that email', true); return; }
  // Generate a temporary reset code
  var resetCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  account._resetCode = resetCode;
  account._resetExpiry = Date.now() + 300000; // 5 minutes
  saveAccountToRegistry(account);
  // Show the code to the user (offline — no email server)
  var msgEl = e.target.querySelector('.success-msg');
  if (msgEl) {
    msgEl.innerHTML = 'Your password reset code is: <strong>' + resetCode + '</strong><br><small>Enter this code in Settings → Change Password (valid 5 min)</small>';
    msgEl.classList.add('show');
  }
  setTimeout(() => closeModal('forgotModal'), 6000);
}

function handleChangePassword() {
  const cur = document.getElementById('currentPass').value;
  const nw = document.getElementById('newPass').value;
  const conf = document.getElementById('confirmPass').value;
  const u = getUser();
  if (!u) { showToast('Please sign in first', true); return; }
  // Support reset code flow
  const account = getAccount(u.email);
  if (account && account._resetCode && account._resetExpiry > Date.now() && cur === account._resetCode) {
    if (nw !== conf) { showToast('New passwords do not match', true); return; }
    if (nw.length < 6) { showToast('Password must be at least 6 characters', true); return; }
    u.password = hashPassword(nw);
    setUser(u);
    saveAccountToRegistry(u);
    // Clear reset code
    delete account._resetCode;
    delete account._resetExpiry;
    saveAccountToRegistry(account);
    showToast('Password reset successfully!');
    document.getElementById('currentPass').value = '';
    document.getElementById('newPass').value = '';
    document.getElementById('confirmPass').value = '';
    return;
  }
  if (!verifyPassword(cur, u.password)) { showToast('Current password is incorrect', true); return; }
  if (nw !== conf) { showToast('New passwords do not match', true); return; }
  if (nw.length < 6) { showToast('Password must be at least 6 characters', true); return; }
  u.password = hashPassword(nw);
  setUser(u);
  saveAccountToRegistry(u);
  showToast('Password updated successfully!');
  document.getElementById('currentPass').value = '';
  document.getElementById('newPass').value = '';
  document.getElementById('confirmPass').value = '';
}

function handleDeleteAccount() {
  if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
  var u = getUser();
  if (u && u.email) { removeAccountFromRegistry(u.email); }
  localStorage.removeItem('chcn_user');
  localStorage.removeItem('chcn_enrolled');
  localStorage.removeItem('chcn_progress');
  localStorage.removeItem('chcn_wishlist');
  localStorage.removeItem('chcn_certs');
  updateAuthUI();
  navigate('index');
  showToast('Account deleted');
}

// ===== ENROLL / WISHLIST =====
function enrollAndStart(courseName, tabId, tabsId) {
  if (!getUser()) { openModal('signupModal'); showToast('Please sign up or sign in first', true); return; }
  const enrolled = getEnrolled();
  if (!enrolled.includes(courseName)) { enrolled.push(courseName); setEnrolled(enrolled); }
  showToast('Enrolled in ' + courseName + '!');
  // Switch to curriculum tab
  const tabContainer = document.getElementById(tabsId);
  if (tabContainer) {
    tabContainer.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const tabs = tabContainer.querySelectorAll('.tab');
    tabs.forEach(t => { if (t.textContent.trim() === 'Curriculum') t.classList.add('active'); });
  }
  const tabContent = document.getElementById(tabId);
  if (tabContent) {
    tabContent.parentElement.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    tabContent.classList.add('active');
  }
  // Update enroll buttons
  document.querySelectorAll('.enroll-btn').forEach(b => {
    if (b.id.includes('enroll-btn')) { b.textContent = '✓ Enrolled'; b.classList.add('enrolled'); b.disabled = true; }
  });
}

function toggleWishlist(btn, courseName) {
  const wl = getWishlist();
  const idx = wl.indexOf(courseName);
  if (idx > -1) { wl.splice(idx, 1); btn.innerHTML = '♡ Add to Wishlist'; showToast('Removed from wishlist'); }
  else { wl.push(courseName); btn.innerHTML = '♥ In Wishlist'; showToast('Added to wishlist!'); }
  setWishlist(wl);
}

// ===== CONTACT / ENQUIRY =====
function handleContact(e) {
  e.preventDefault();
  const name = document.getElementById('contactName')?.value.trim();
  const email = document.getElementById('contactEmail')?.value.trim();
  const subject = document.getElementById('contactSubject')?.value.trim() || 'Creator Hub website enquiry';
  const message = document.getElementById('contactMessage')?.value.trim();
  if (!name || !email || !message) { showToast('Please complete your name, email and message.', true); return; }
  window.location.href = 'mailto:info.creatorhubcreatornetwork@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent('Name: ' + name + '\nEmail: ' + email + '\n\n' + message);
  showToast('Opening your email app to send the enquiry.');
}
function submitEnquiry(e) {
  e.preventDefault();
  closeModal('contactModal');
  showToast('Enquiry sent! We will get back to you soon.');
}
function openWhatsApp() {
  window.open('https://wa.me/18768875573?text=Hello%20Creator%20Hub%20Creator%20Network', '_blank');
}

// ===== SAVE PROFILE =====
function saveProfile() {
  const u = getUser();
  if (!u) { showToast('Please sign in first', true); return; }
  const name = document.getElementById('profileName').value;
  if (name) u.name = name;
  // Save address and phone fields
  const phoneEl = document.getElementById('profilePhone');
  const addr1El = document.getElementById('profileAddr1');
  const addr2El = document.getElementById('profileAddr2');
  const cityEl = document.getElementById('profileCity');
  const stateEl = document.getElementById('profileState');
  const zipEl = document.getElementById('profileZip');
  const countryEl = document.getElementById('profileCountry');
  if (phoneEl) u.phone = phoneEl.value;
  if (addr1El) u.addr1 = addr1El.value;
  if (addr2El) u.addr2 = addr2El.value;
  if (cityEl) u.city = cityEl.value;
  if (stateEl) u.state = stateEl.value;
  if (zipEl) u.zip = zipEl.value;
  if (countryEl) u.country = countryEl.value;
  const statusEl = document.getElementById('profileStatus');
  const bgEl = document.getElementById('profileBackground');
  const bioEl = document.getElementById('profileBio');
  const pubEl = document.getElementById('privacyProfilePublic');
  const progEl = document.getElementById('privacyShowProgress');
  const msgEl = document.getElementById('privacyAllowMessages');
  if (statusEl) u.status = statusEl.value;
  if (bgEl) u.headline = bgEl.value;
  if (bioEl) u.bio = bioEl.value;
  u.privacy = {
    public: pubEl ? pubEl.checked : true,
    showProgress: progEl ? progEl.checked : false,
    allowMessages: msgEl ? msgEl.checked : true
  };
  setUser(u);
  saveAccountToRegistry(u); // Keep the registry in sync with profile changes
  showToast('Profile saved!');
}

// ===== MESSAGE THE FOUNDER (delivered via device email app to founder) =====
function sendMessage() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  const body = document.getElementById('chatBody');
  const time = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  body.innerHTML += '<div class="chat-msg sent"><div class="chat-bubble">' + escapeHtml(msg) + '</div><div class="chat-time">' + time + '</div></div>';
  input.value = '';
  body.scrollTop = body.scrollHeight;

  // Deliver the message to the founder via the device's email app
  const u = getUser();
  const fromName = u && u.name ? u.name : 'App User';
  const fromEmail = u && u.email ? u.email : 'not signed in';
  const subject = 'App Message from ' + fromName;
  const emailBody = 'Message from: ' + fromName + ' (' + fromEmail + ')\n\n' + msg + '\n\nSent from the Creator Hub Creator Network app.';
  const mailto = 'mailto:info.creatorhubcreatornetwork@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(emailBody);

  setTimeout(() => {
    body.innerHTML += '<div class="chat-msg received"><div class="chat-bubble">Opening your email app so this message is delivered directly to the founder, Ravaun Richards. If your email app does not open, WhatsApp us at +1 (876) 887-5573.</div><div class="chat-time">System</div></div>';
    body.scrollTop = body.scrollHeight;
    try { window.location.href = mailto; } catch(e) {}
  }, 600);
}
function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

// ===== FILTER / SORT COURSES =====
function filterCourses() {
  const search = (document.getElementById('filterSearch')?.value || '').toLowerCase();
  const cat = document.getElementById('filterCategory')?.value || '';
  const level = document.getElementById('filterLevel')?.value || '';
  const price = document.getElementById('filterPrice')?.value || '';
  let visible = 0;
  // Filter both main and TVET course cards
  document.querySelectorAll('.course-card').forEach(c => {
    const title = (c.querySelector('h3')?.textContent || '').toLowerCase();
    const cCat = c.getAttribute('data-category') || '';
    const cLevel = c.getAttribute('data-level') || '';
    const cPrice = c.getAttribute('data-price') || '';
    const show = (!search || title.includes(search)) && (!cat || cCat === cat) && (!level || cLevel === level) && (!price || cPrice === price);
    c.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  showToast(visible + ' course' + (visible !== 1 ? 's' : '') + ' found');
}
function sortCourses() {
  const val = document.getElementById('sortSelect')?.value || '';
  const grid = document.getElementById('coursesGrid');
  if (!val || !grid) { filterCourses(); return; }
  const cards = Array.from(grid.querySelectorAll('.course-card'));
  cards.sort((a, b) => {
    const aV = parseInt(a.getAttribute('data-views') || '0');
    const bV = parseInt(b.getAttribute('data-views') || '0');
    const aP = a.getAttribute('data-price') === 'paid' ? 10000 : a.getAttribute('data-price') === 'members' ? 5000 : 0;
    const bP = b.getAttribute('data-price') === 'paid' ? 10000 : b.getAttribute('data-price') === 'members' ? 5000 : 0;
    switch(val) {
      case 'newest': return bV - aV;
      case 'oldest': return aV - bV;
      case 'price_high': return bP - aP;
      case 'price_low': return aP - bP;
      case 'popular': return bV - aV;
      default: return 0;
    }
  });
  cards.forEach(c => grid.appendChild(c));
  filterCourses();
  showToast('Sorted');
}
function resetFilters() {
  ['filterSearch','filterCategory','filterLevel','filterPrice','sortSelect'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.querySelectorAll('#coursesGrid .course-card').forEach(c => c.style.display = '');
  showToast('Filters reset');
}

// ===== TABS =====
function switchAboutTab(e, tabId) {
  document.querySelectorAll('.about-tabs .tab').forEach(t => t.classList.remove('active'));
  e.target.classList.add('active');
  document.querySelectorAll('.about-content .tab-content').forEach(tc => tc.classList.remove('active'));
  document.getElementById('tab-' + tabId).classList.add('active');
}

function switchCourseTab(e, tabId, courseId) {
  const container = document.getElementById('course-detail-tabs-' + courseId);
  container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  e.target.classList.add('active');
  const parent = document.getElementById(tabId).parentElement;
  parent.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
}

function switchAccountTab(panelId, link) {
  document.querySelectorAll('.account-sidebar-link').forEach(l => l.classList.remove('active'));
  link.classList.add('active');
  document.querySelectorAll('.account-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(panelId).classList.add('active');
  if (panelId === 'panel-certificates') loadCertificates();
  if (panelId === 'panel-enrolled') loadEnrolledList();
  if (panelId === 'panel-progress') loadProgressList();
  if (panelId === 'panel-wishlist') loadWishlistList();
}

// ===== ACCOUNT DATA =====
function loadAccountData() {
  const u = getUser();
  if (u) {
    document.getElementById('profileName').value = u.name || '';
    document.getElementById('profileEmail').value = u.email || '';
    document.getElementById('accountName').textContent = u.name || 'User';
    document.getElementById('accountEmail').textContent = u.email || '';
    const phoneEl2 = document.getElementById('profilePhone');
    const addr1El2 = document.getElementById('profileAddr1');
    const addr2El2 = document.getElementById('profileAddr2');
    const cityEl2 = document.getElementById('profileCity');
    const stateEl2 = document.getElementById('profileState');
    const zipEl2 = document.getElementById('profileZip');
    const countryEl2 = document.getElementById('profileCountry');
    if (phoneEl2) phoneEl2.value = u.phone || '';
    if (addr1El2) addr1El2.value = u.addr1 || '';
    if (addr2El2) addr2El2.value = u.addr2 || '';
    if (cityEl2) cityEl2.value = u.city || '';
    if (stateEl2) stateEl2.value = u.state || '';
    if (zipEl2) zipEl2.value = u.zip || '';
    if (countryEl2) countryEl2.value = u.country || '';
    const statusEl = document.getElementById('profileStatus');
    const bgEl = document.getElementById('profileBackground');
    const bioEl = document.getElementById('profileBio');
    if (statusEl) statusEl.value = u.status || '';
    if (bgEl) bgEl.value = u.headline || '';
    if (bioEl) bioEl.value = u.bio || '';
    const p = u.privacy || {};
    const pubEl = document.getElementById('privacyProfilePublic');
    const progEl = document.getElementById('privacyShowProgress');
    const msgEl = document.getElementById('privacyAllowMessages');
    if (pubEl) pubEl.checked = p.public !== false;
    if (progEl) progEl.checked = p.showProgress === true;
    if (msgEl) msgEl.checked = p.allowMessages !== false;
    renderAvatar(u);
  } else {
    renderAvatar(getUser());
  }
  renderCover();
  loadEnrolledList();
  loadProgressList();
  loadCertificates();
  loadWishlistList();
}

// ===== PROFILE PICTURE =====
function renderAvatar(u) {
  const pic = localStorage.getItem('chcn_avatar');
  const letter = (u && u.name ? u.name[0] : 'U').toUpperCase();
  ['accountAvatar', 'accountAvatarLarge'].forEach(id => {
    const av = document.getElementById(id);
    if (!av) return;
    if (pic) {
      av.innerHTML = '<img src="' + pic + '" alt="Profile picture">';
      av.classList.add('has-pic');
    } else {
      av.textContent = letter;
      av.classList.remove('has-pic');
    }
  });
}

function uploadProfilePic(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { showToast('Please choose an image file', true); return; }
  if (file.size > 3 * 1024 * 1024) { showToast('Image too large (max 3MB)', true); return; }
  const reader = new FileReader();
  reader.onload = function(ev) {
    localStorage.setItem('chcn_avatar', ev.target.result);
    renderAvatar(getUser());
    showToast('Profile picture updated!');
  };
  reader.readAsDataURL(file);
}

function removeProfilePic() {
  localStorage.removeItem('chcn_avatar');
  renderAvatar(getUser());
  showToast('Profile picture removed');
}

// ===== ACCOUNT COVER / BACKGROUND PHOTO (works for guests too) =====
function renderCover() {
  const el = document.getElementById('accountCover');
  if (!el) return;
  let cov = null;
  try { cov = localStorage.getItem('chcn_cover'); } catch (e) { cov = null; }
  if (cov) {
    el.style.backgroundImage = 'url("' + cov + '")';
    el.classList.add('has-cover');
  } else {
    el.style.backgroundImage = '';
    el.classList.remove('has-cover');
  }
}

function uploadCoverPhoto(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { showToast('Please choose an image file', true); e.target.value = ''; return; }
  if (file.size > 5 * 1024 * 1024) { showToast('Cover image too large (max 5MB)', true); e.target.value = ''; return; }
  const reader = new FileReader();
  reader.onload = function(ev) {
    try { localStorage.setItem('chcn_cover', ev.target.result); }
    catch (err) { showToast('Could not save cover \u2014 try a smaller image', true); return; }
    renderCover();
    showToast('Cover photo updated!');
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

function removeCoverPhoto() {
  let has = null;
  try { has = localStorage.getItem('chcn_cover'); } catch (e) { has = null; }
  if (!has) { showToast('No cover photo to remove', true); return; }
  try { localStorage.removeItem('chcn_cover'); } catch (e) {}
  renderCover();
  showToast('Cover photo removed');
}

function loadEnrolledList() {
  const el = document.getElementById('enrolledList');
  const noEl = document.getElementById('noEnrolled');
  if (!el) return;
  const enrolled = getEnrolled();
  if (enrolled.length === 0) { el.innerHTML = ''; noEl.style.display = 'block'; return; }
  noEl.style.display = 'none';
  el.innerHTML = enrolled.map(c => '<div class="course-list-item"><span class="cl-name">' + c + '</span><span class="cl-status in-progress">In Progress</span></div>').join('');
}

function loadProgressList() {
  const el = document.getElementById('progressList');
  const noEl = document.getElementById('noProgress');
  if (!el) return;
  const prog = getProgress();
  const keys = Object.keys(prog);
  if (keys.length === 0) { el.innerHTML = ''; noEl.style.display = 'block'; return; }
  noEl.style.display = 'none';
  el.innerHTML = keys.map(k => {
    const p = prog[k];
    const pct = Math.round((p.completed / p.total) * 100);
    return '<div class="course-list-item"><span class="cl-name">' + k + '</span><span class="cl-status ' + (pct >= 100 ? 'completed' : 'in-progress') + '">' + pct + '%</span></div>';
  }).join('');
}

function loadCertificates() {
  const el = document.getElementById('certificateList');
  const noEl = document.getElementById('noCerts');
  if (!el) return;
  const certs = getCertificates();
  if (certs.length === 0) { el.innerHTML = ''; noEl.style.display = 'block'; return; }
  noEl.style.display = 'none';
  el.innerHTML = certs.map(c => '<div class="course-list-item"><span class="cl-name">🎓 ' + c.certType + ' — ' + c.courseName + '</span><button class="btn btn-sm" style="background:var(--success);color:#fff;" onclick="generateCertificate(\'' + c.courseId + '\')">View Certificate</button></div>').join('');
}

function loadWishlistList() {
  const el = document.getElementById('wishlistList');
  const noEl = document.getElementById('noWishlist');
  if (!el) return;
  const wl = getWishlist();
  if (wl.length === 0) { el.innerHTML = ''; noEl.style.display = 'block'; return; }
  noEl.style.display = 'none';
  el.innerHTML = wl.map(c => '<div class="course-list-item"><span class="cl-name">' + c + '</span><button class="btn btn-sm btn-primary" onclick="navigate(\'courses\')">Go to Courses</button></div>').join('');
}

// ===========================================================
// ===== COURSE CONTENT / CURRICULUM / QUIZ DATA =====
// ===========================================================

const COURSE_DATA = {
  'course-driver-beginner': {
    name: "Driver's Course — Beginner",
    cert: 'CDL-B',
    certFull: 'Certified Driver — Beginner Level',
    modules: [
      { title: 'Module 1: Introduction to Driving', lessons: [
        { title: 'Getting to Know Your Vehicle', type: 'lesson', duration: '15 min' },
        { title: 'Controls, Mirrors and Seating Position', type: 'lesson', duration: '18 min' },
        { title: 'Module 1 Quiz', type: 'quiz', questions: 5, duration: '5 min' }
      ]},
      { title: 'Module 2: Road Rules and Signs', lessons: [
        { title: 'Jamaican Road Code Basics', type: 'lesson', duration: '20 min' },
        { title: 'Traffic Signs and Signals', type: 'lesson', duration: '18 min' },
        { title: 'Road Markings', type: 'lesson', duration: '12 min' },
        { title: 'Module 2 Quiz', type: 'quiz', questions: 10, duration: '10 min' }
      ]},
      { title: 'Module 3: Basic Vehicle Control', lessons: [
        { title: 'Starting, Moving Off and Stopping', type: 'lesson', duration: '20 min' },
        { title: 'Steering and Turning', type: 'lesson', duration: '18 min' },
        { title: 'Changing Gears', type: 'lesson', duration: '15 min' },
        { title: 'Module 3 Quiz', type: 'quiz', questions: 5, duration: '5 min' }
      ]},
      { title: 'Module 4: Safe Driving Habits', lessons: [
        { title: 'Observation and Awareness', type: 'lesson', duration: '18 min' },
        { title: 'Safe Following Distance', type: 'lesson', duration: '12 min' },
        { title: 'Seatbelts and Safety Checks', type: 'lesson', duration: '12 min' },
        { title: 'Final Assessment', type: 'quiz', questions: 10, duration: '10 min', isFinal: true }
      ]}
    ]
  },
  'course-driver-intermediate': {
    name: "Driver's Course — Intermediate",
    cert: 'CDL-I',
    certFull: 'Certified Driver — Intermediate Level',
    modules: [
      { title: 'Module 1: Advancing Your Skills', lessons: [
        { title: 'Driving in Traffic', type: 'lesson', duration: '20 min' },
        { title: 'Lane Discipline and Overtaking', type: 'lesson', duration: '18 min' },
        { title: 'Module 1 Quiz', type: 'quiz', questions: 5, duration: '5 min' }
      ]},
      { title: 'Module 2: Junctions and Roundabouts', lessons: [
        { title: 'Approaching Junctions', type: 'lesson', duration: '18 min' },
        { title: 'Navigating Roundabouts', type: 'lesson', duration: '18 min' },
        { title: 'Right of Way Rules', type: 'lesson', duration: '15 min' },
        { title: 'Module 2 Quiz', type: 'quiz', questions: 10, duration: '10 min' }
      ]},
      { title: 'Module 3: Parking and Maneuvering', lessons: [
        { title: 'Parallel Parking', type: 'lesson', duration: '20 min' },
        { title: 'Reversing and Three-Point Turns', type: 'lesson', duration: '18 min' },
        { title: 'Hill Starts', type: 'lesson', duration: '12 min' },
        { title: 'Module 3 Quiz', type: 'quiz', questions: 5, duration: '5 min' }
      ]},
      { title: 'Module 4: Adverse Conditions', lessons: [
        { title: 'Driving in Rain and Poor Visibility', type: 'lesson', duration: '18 min' },
        { title: 'Night Driving', type: 'lesson', duration: '15 min' },
        { title: 'Final Assessment', type: 'quiz', questions: 10, duration: '10 min', isFinal: true }
      ]}
    ]
  },
  'course-driver-advanced': {
    name: "Driver's Course — Advanced",
    cert: 'CDL-A',
    certFull: 'Certified Driver — Advanced Level',
    modules: [
      { title: 'Module 1: Defensive Driving', lessons: [
        { title: 'Hazard Perception', type: 'lesson', duration: '20 min' },
        { title: 'Anticipating Other Road Users', type: 'lesson', duration: '18 min' },
        { title: 'Module 1 Quiz', type: 'quiz', questions: 5, duration: '5 min' }
      ]},
      { title: 'Module 2: Highway and Motorway Driving', lessons: [
        { title: 'Joining and Leaving Highways', type: 'lesson', duration: '18 min' },
        { title: 'High-Speed Lane Management', type: 'lesson', duration: '18 min' },
        { title: 'Module 2 Quiz', type: 'quiz', questions: 10, duration: '10 min' }
      ]},
      { title: 'Module 3: Emergency Handling', lessons: [
        { title: 'Skid Control and Braking', type: 'lesson', duration: '20 min' },
        { title: 'Handling Vehicle Breakdowns', type: 'lesson', duration: '15 min' },
        { title: 'Accident Procedures', type: 'lesson', duration: '15 min' },
        { title: 'Module 3 Quiz', type: 'quiz', questions: 5, duration: '5 min' }
      ]},
      { title: 'Module 4: Professional Driving', lessons: [
        { title: 'Eco-Driving and Fuel Efficiency', type: 'lesson', duration: '15 min' },
        { title: 'Long-Distance Driving', type: 'lesson', duration: '15 min' },
        { title: 'Final Assessment', type: 'quiz', questions: 10, duration: '10 min', isFinal: true }
      ]}
    ]
  },
  'course-level1': {
    name: 'Level 1 Security Officer Training',
    cert: 'CPSO',
    certFull: 'Certified Professional Security Officer',
    modules: [
      { title: 'Module 1: Introduction to Security', lessons: [
        { title: 'What Is Security?', type: 'lesson', duration: '15 min' },
        { title: 'Types of Security Operations', type: 'lesson', duration: '20 min' },
        { title: 'Module 1 Quiz', type: 'quiz', questions: 5, duration: '5 min' }
      ]},
      { title: 'Module 2: Roles and Responsibilities', lessons: [
        { title: 'Security Officer Role', type: 'lesson', duration: '18 min' },
        { title: 'Code of Conduct', type: 'lesson', duration: '15 min' },
        { title: 'Module 2 Quiz', type: 'quiz', questions: 5, duration: '5 min' }
      ]},
      { title: 'Module 3: Observation and Reporting', lessons: [
        { title: 'Observation Skills', type: 'lesson', duration: '20 min' },
        { title: 'Report Writing', type: 'lesson', duration: '25 min' },
        { title: 'Daily Activity Logs', type: 'lesson', duration: '15 min' },
        { title: 'Module 3 Quiz', type: 'quiz', questions: 10, duration: '10 min' }
      ]},
      { title: 'Module 4: Access Control', lessons: [
        { title: 'Access Control Principles', type: 'lesson', duration: '18 min' },
        { title: 'Gatehouse Operations', type: 'lesson', duration: '22 min' },
        { title: 'Visitor Management', type: 'lesson', duration: '15 min' },
        { title: 'Module 4 Quiz', type: 'quiz', questions: 10, duration: '10 min' }
      ]},
      { title: 'Module 5: Patrol Operations', lessons: [
        { title: 'Patrol Techniques', type: 'lesson', duration: '20 min' },
        { title: 'Incident Detection', type: 'lesson', duration: '18 min' },
        { title: 'Patrol Reporting', type: 'lesson', duration: '12 min' },
        { title: 'Module 5 Quiz', type: 'quiz', questions: 5, duration: '5 min' }
      ]},
      { title: 'Module 6: Emergency Response', lessons: [
        { title: 'Emergency Procedures', type: 'lesson', duration: '22 min' },
        { title: 'Fire Safety', type: 'lesson', duration: '20 min' },
        { title: 'First Aid Basics', type: 'lesson', duration: '18 min' },
        { title: 'Module 6 Quiz', type: 'quiz', questions: 10, duration: '10 min' }
      ]},
      { title: 'Module 7: Communication Skills', lessons: [
        { title: 'Verbal Communication', type: 'lesson', duration: '18 min' },
        { title: 'Written Communication', type: 'lesson', duration: '15 min' },
        { title: 'Radio Procedures', type: 'lesson', duration: '12 min' },
        { title: 'Module 7 Quiz', type: 'quiz', questions: 5, duration: '5 min' }
      ]},
      { title: 'Module 8: Conflict Resolution', lessons: [
        { title: 'Understanding Conflict', type: 'lesson', duration: '18 min' },
        { title: 'De-escalation Techniques', type: 'lesson', duration: '20 min' },
        { title: 'Module 8 Quiz', type: 'quiz', questions: 10, duration: '10 min' }
      ]},
      { title: 'Module 9: Legal and Regulatory Framework', lessons: [
        { title: 'PSRA Regulations', type: 'lesson', duration: '22 min' },
        { title: 'Use of Force', type: 'lesson', duration: '18 min' },
        { title: 'Citizens Arrest', type: 'lesson', duration: '15 min' },
        { title: 'Module 9 Quiz', type: 'quiz', questions: 15, duration: '15 min' }
      ]},
      { title: 'GATE CHECKPOINT — Tuition Check', lessons: [
        { title: 'Tuition Verification — Level 1', type: 'gate', duration: 'Check' }
      ]},
      { title: 'Module 10: Professionalism and Conduct', lessons: [
        { title: 'Professional Standards', type: 'lesson', duration: '18 min' },
        { title: 'Uniform and Grooming', type: 'lesson', duration: '12 min' },
        { title: 'Time Management', type: 'lesson', duration: '15 min' },
        { title: 'Module 10 Quiz', type: 'quiz', questions: 10, duration: '10 min' }
      ]},
      { title: 'Module 11: Industrial Security', lessons: [
        { title: 'Industrial Site Security', type: 'lesson', duration: '20 min' },
        { title: 'Hazard Awareness', type: 'lesson', duration: '18 min' },
        { title: 'Perimeter Security', type: 'lesson', duration: '15 min' },
        { title: 'Module 11 Quiz', type: 'quiz', questions: 10, duration: '10 min' }
      ]},
      { title: 'Module 12: Customer Service in Security', lessons: [
        { title: 'Customer-Facing Security', type: 'lesson', duration: '18 min' },
        { title: 'Handling Complaints', type: 'lesson', duration: '15 min' },
        { title: 'Module 12 Quiz', type: 'quiz', questions: 10, duration: '10 min' }
      ]},
      { title: 'FINAL ASSESSMENT', lessons: [
        { title: 'Level 1 Final Exam', type: 'quiz', questions: 50, duration: '45 min', isFinal: true }
      ]}
    ]
  },
  'course-assessment': {
    name: 'Same Day Security Assessment',
    cert: 'CSO-1',
    certFull: 'Certified Security Officer — Level 1',
    modules: [
      { title: 'Assessment Overview', lessons: [
        { title: 'Assessment Instructions', type: 'lesson', duration: '10 min' },
        { title: 'What to Expect', type: 'lesson', duration: '8 min' }
      ]},
      { title: 'Knowledge Assessment', lessons: [
        { title: 'Security Fundamentals Quiz', type: 'quiz', questions: 15, duration: '15 min' }
      ]},
      { title: 'Practical Scenarios', lessons: [
        { title: 'Scenario: Access Control', type: 'scenario', duration: '10 min' },
        { title: 'Scenario: Emergency Response', type: 'scenario', duration: '10 min' }
      ]},
      { title: 'Final Assessment', lessons: [
        { title: 'CSO-1 Assessment Exam', type: 'quiz', questions: 30, duration: '30 min', isFinal: true }
      ]}
    ]
  },
  'course-senior': {
    name: 'AISS-S Senior Supervisor',
    cert: 'ASOS',
    certFull: 'Advanced Security Operations Specialist',
    modules: [
      { title: 'Module 1: Senior Supervisor Role', lessons: [
        { title: 'Leadership in Security', type: 'lesson', duration: '22 min' },
        { title: 'Supervisor Responsibilities', type: 'lesson', duration: '20 min' },
        { title: 'Module 1 Quiz', type: 'quiz', questions: 10, duration: '10 min' }
      ]},
      { title: 'Module 2: Risk Assessment', lessons: [
        { title: 'Identifying Risks', type: 'lesson', duration: '20 min' },
        { title: 'Security Planning', type: 'lesson', duration: '22 min' },
        { title: 'Module 2 Quiz', type: 'quiz', questions: 10, duration: '10 min' }
      ]},
      { title: 'Module 3: Discipline and Conduct Control', lessons: [
        { title: 'Corrective Action Procedures', type: 'lesson', duration: '20 min' },
        { title: 'Conduct Standards', type: 'lesson', duration: '18 min' },
        { title: 'Module 3 Quiz', type: 'quiz', questions: 15, duration: '15 min' }
      ]},
      { title: 'GATE CHECKPOINT — Tuition Check', lessons: [
        { title: 'Tuition Verification — Senior', type: 'gate', duration: 'Check' }
      ]},
      { title: 'Module 4: Incident Leadership', lessons: [
        { title: 'Crisis Response Leadership', type: 'lesson', duration: '22 min' },
        { title: 'Incident Command', type: 'lesson', duration: '20 min' },
        { title: 'Module 4 Quiz', type: 'quiz', questions: 10, duration: '10 min' }
      ]},
      { title: 'Module 5: Compliance and Ethics', lessons: [
        { title: 'Regulatory Compliance', type: 'lesson', duration: '20 min' },
        { title: 'Ethical Standards', type: 'lesson', duration: '18 min' },
        { title: 'Module 5 Quiz', type: 'quiz', questions: 10, duration: '10 min' }
      ]},
      { title: 'FINAL ASSESSMENT', lessons: [
        { title: 'Senior Final Exam', type: 'quiz', questions: 60, duration: '60 min', isFinal: true }
      ]}
    ]
  },
  'course-junior': {
    name: 'AISS-J Junior Supervisor',
    cert: 'APSO',
    certFull: 'Advanced Professional Security Officer',
    modules: [
      { title: 'Module 1: Junior Supervisor Role', lessons: [
        { title: 'First-Line Supervision', type: 'lesson', duration: '18 min' },
        { title: 'Shift Management', type: 'lesson', duration: '20 min' },
        { title: 'Module 1 Quiz', type: 'quiz', questions: 10, duration: '10 min' }
      ]},
      { title: 'Module 2: Team Leadership', lessons: [
        { title: 'Leading a Security Team', type: 'lesson', duration: '20 min' },
        { title: 'Motivation and Discipline', type: 'lesson', duration: '18 min' },
        { title: 'Module 2 Quiz', type: 'quiz', questions: 10, duration: '10 min' }
      ]},
      { title: 'Module 3: Incident Response', lessons: [
        { title: 'Incident Reporting for Supervisors', type: 'lesson', duration: '20 min' },
        { title: 'Escalation Procedures', type: 'lesson', duration: '15 min' },
        { title: 'Module 3 Quiz', type: 'quiz', questions: 15, duration: '15 min' }
      ]},
      { title: 'GATE CHECKPOINT — Tuition Check', lessons: [
        { title: 'Tuition Verification — Junior', type: 'gate', duration: 'Check' }
      ]},
      { title: 'Module 4: Access Control Oversight', lessons: [
        { title: 'Supervising Access Points', type: 'lesson', duration: '18 min' },
        { title: 'Visitor Management for Supervisors', type: 'lesson', duration: '15 min' },
        { title: 'Module 4 Quiz', type: 'quiz', questions: 10, duration: '10 min' }
      ]},
      { title: 'Module 5: Professional Standards', lessons: [
        { title: 'Professional Conduct', type: 'lesson', duration: '18 min' },
        { title: 'Quality Assurance', type: 'lesson', duration: '15 min' },
        { title: 'Module 5 Quiz', type: 'quiz', questions: 10, duration: '10 min' }
      ]},
      { title: 'FINAL ASSESSMENT', lessons: [
        { title: 'Junior Final Exam', type: 'quiz', questions: 60, duration: '60 min', isFinal: true }
      ]}
    ]
  }
};

// ===== QUIZ QUESTION BANK =====
const QUESTION_BANK = {
  security: [
    { q: 'What is the primary role of a security officer?', opts: ['Enforce the law', 'Protect people and property', 'Make arrests', 'Investigate crimes'], ans: 1, exp: 'A security officer\'s primary role is to protect people and property through observation, deterrence, and reporting.' },
    { q: 'Which of the following is NOT a core duty of a security officer?', opts: ['Access control', 'Patrol operations', 'Criminal investigation', 'Report writing'], ans: 2, exp: 'Criminal investigation is a law enforcement duty, not a security officer duty.' },
    { q: 'What does PSRA stand for?', opts: ['Private Security Regulation Authority', 'Public Safety Regulatory Agency', 'Private Security Regulatory Authority', 'Public Security Regulation Act'], ans: 2, exp: 'PSRA stands for the Private Security Regulation Authority, the governing body for private security in Jamaica.' },
    { q: 'What is the purpose of a daily activity log?', opts: ['To track employee attendance', 'To document all observations and incidents during a shift', 'To record financial transactions', 'To schedule patrol routes'], ans: 1, exp: 'A daily activity log documents all observations, incidents, and activities during a security officer\'s shift.' },
    { q: 'When should a security officer use force?', opts: ['Whenever they feel threatened', 'Only as a last resort in self-defense', 'To detain suspects', 'To enforce company rules'], ans: 1, exp: 'Force should only be used as a last resort in self-defense when there is an immediate threat.' },
    { q: 'What is access control?', opts: ['Restricting who can enter a facility', 'Controlling vehicle speed', 'Monitoring CCTV cameras', 'Managing payroll access'], ans: 0, exp: 'Access control is the practice of restricting who can enter or move within a facility.' },
    { q: 'What should you do if you discover a fire?', opts: ['Try to put it out yourself', 'Activate the fire alarm and evacuate', 'Call your supervisor first', 'Ignore it if it is small'], ans: 1, exp: 'The first response to discovering a fire is to activate the fire alarm and begin evacuation procedures.' },
    { q: 'What is the purpose of a perimeter check?', opts: ['To find lost items', 'To identify security breaches or vulnerabilities along the boundary', 'To greet visitors', 'To deliver mail'], ans: 1, exp: 'Perimeter checks identify security breaches, damage, or unauthorized entry along the property boundary.' },
    { q: 'How should a security officer handle a suspicious package?', opts: ['Open it to check contents', 'Move it to a safe location', 'Do not touch it, isolate the area, and report', 'Throw it away'], ans: 2, exp: 'Never touch a suspicious package. Isolate the area, keep people away, and report to authorities immediately.' },
    { q: 'What is the chain of custody?', opts: ['A list of security officers on duty', 'The documented sequence of who handled evidence', 'A type of patrol formation', 'The order of command'], ans: 1, exp: 'Chain of custody documents the sequence of individuals who have handled a piece of evidence to maintain its integrity.' },
    { q: 'What does CCTV stand for?', opts: ['Central Control Television', 'Closed Circuit Television', 'Cable Connected Television', 'Computer Controlled Television'], ans: 1, exp: 'CCTV stands for Closed Circuit Television, a video surveillance system used for monitoring.' },
    { q: 'When writing an incident report, what should be included?', opts: ['Your personal opinion', 'Only positive observations', 'Facts: who, what, when, where, why, how', 'What you think should happen next'], ans: 2, exp: 'An incident report should contain factual information: who, what, when, where, why, and how.' },
    { q: 'What is de-escalation?', opts: ['Making a situation more serious', 'Techniques to calm and reduce tension in a conflict', 'Running away from a threat', 'Calling the police immediately'], ans: 1, exp: 'De-escalation involves using communication and body language techniques to calm and reduce tension in a conflict.' },
    { q: 'What is a citizen\'s arrest?', opts: ['Arresting someone for any reason', 'The legal right to detain someone caught committing an indictable offence', 'Arresting a citizen for questioning', 'A police officer\'s power'], ans: 1, exp: 'A citizen\'s arrest allows a private person to detain someone they catch committing an indictable offence.' },
    { q: 'What is the most important quality in a security officer?', opts: ['Physical strength', 'Observation skills', 'Aggressive behavior', 'Technical knowledge'], ans: 1, exp: 'Strong observation skills are the most important quality for detecting, preventing, and reporting security issues.' },
    { q: 'What should you do if you receive a bomb threat by phone?', opts: ['Hang up immediately', 'Keep the caller talking, note details, and alert authorities', 'Ignore it as a prank', 'Search the building yourself'], ans: 1, exp: 'Keep the caller talking as long as possible, note every detail, and immediately alert authorities.' },
    { q: 'What does SOP stand for in security?', opts: ['Standard Operating Procedure', 'Security Observation Protocol', 'Special Operations Plan', 'System of Protection'], ans: 0, exp: 'SOP stands for Standard Operating Procedure — established guidelines for routine security operations.' },
    { q: 'What is the buddy system in security?', opts: ['Working with a partner for safety', 'A training program', 'A radio communication system', 'A visitor escort procedure'], ans: 0, exp: 'The buddy system involves working with a partner to increase safety and effectiveness during patrols.' },
    { q: 'What is a vulnerability assessment?', opts: ['Testing employee knowledge', 'Identifying weaknesses in security that could be exploited', 'A physical fitness test', 'An inventory check'], ans: 1, exp: 'A vulnerability assessment identifies weaknesses in security systems, procedures, or physical measures that could be exploited.' },
    { q: 'What is the first step in emergency response?', opts: ['Call the police', 'Assess the situation', 'Run and hide', 'Panic'], ans: 1, exp: 'The first step is always to assess the situation to understand the nature and scope of the emergency before acting.' },
    { q: 'What is contraband?', opts: ['Legal personal items', 'Items prohibited by law or facility rules', 'Lost property', 'Evidence from a crime scene'], ans: 1, exp: 'Contraband refers to items that are prohibited by law or by specific facility rules and regulations.' },
    { q: 'When should a security officer write a report?', opts: ['Only for major incidents', 'Only when asked by a supervisor', 'For all incidents, observations, and activities during a shift', 'Never'], ans: 2, exp: 'Security officers should document all incidents, unusual observations, and relevant activities during every shift.' },
    { q: 'What is the purpose of security lighting?', opts: ['Decorative appearance', 'Deter crime and assist observation', 'Save energy', 'Attract visitors'], ans: 1, exp: 'Security lighting deters criminal activity and helps security officers observe and identify threats.' },
    { q: 'What is a key control system?', opts: ['A way to manage who has access to keys', 'A digital alarm system', 'A CCTV monitoring tool', 'A payroll system'], ans: 0, exp: 'A key control system manages and tracks who has access to keys, ensuring accountability and security.' },
    { q: 'What should a security officer do if they witness a crime?', opts: ['Intervene physically immediately', 'Observe, document, and report to authorities', 'Ignore it', 'Make a citizen\'s arrest for any crime'], ans: 1, exp: 'A security officer should observe carefully, document details, and report to the appropriate authorities.' },
    { q: 'What is risk management in security?', opts: ['Eliminating all risks', 'Identifying, assessing, and prioritizing risks to minimize their impact', 'Ignoring potential threats', 'Buying insurance'], ans: 1, exp: 'Risk management involves identifying, assessing, and prioritizing risks, then applying resources to minimize their impact.' },
    { q: 'What is the difference between a security officer and a police officer?', opts: ['There is no difference', 'Security officers protect private property; police enforce public law', 'Security officers have more authority', 'Police officers work for private companies'], ans: 1, exp: 'Security officers protect private property and people under contract; police officers enforce public law as government agents.' },
    { q: 'What is a security briefing?', opts: ['A casual conversation', 'A formal meeting to share security information and instructions', 'A training session', 'An inspection'], ans: 1, exp: 'A security briefing is a formal meeting to share critical security information, updates, and instructions with the team.' },
    { q: 'What is the purpose of a visitor log?', opts: ['To track employee hours', 'To record all visitors entering and leaving a facility', 'To collect payments', 'To assign parking spaces'], ans: 1, exp: 'A visitor log records all visitors entering and leaving a facility for security and accountability purposes.' },
    { q: 'What is a restricted area?', opts: ['An area open to the public', 'An area with limited access authorized only to specific personnel', 'A parking lot', 'A break room'], ans: 1, exp: 'A restricted area has limited access authorized only to specific personnel for security reasons.' },
    { q: 'What is situational awareness?', opts: ['Being aware of your surroundings and potential threats', 'Knowing the time', 'Understanding company policy', 'Being social with colleagues'], ans: 0, exp: 'Situational awareness means being constantly aware of your surroundings and identifying potential threats or hazards.' },
    { q: 'What is the proper radio procedure?', opts: ['Speak as long as you want', 'Keep transmissions brief, clear, and use proper call signs', 'Use slang and informal language', 'Never identify yourself'], ans: 1, exp: 'Radio transmissions should be brief, clear, professional, and use proper call signs and identification.' },
    { q: 'What does patrol deterrence mean?', opts: ['Patrols that attract attention', 'The presence of patrols discourages criminal activity', 'Patrols that chase criminals', 'Random patrol routes'], ans: 1, exp: 'Patrol deterrence means the visible presence of security patrols discourages potential criminal or unauthorized activity.' },
    { q: 'What is a security checkpoint?', opts: ['A coffee break location', 'A designated point where personnel and vehicles are inspected', 'A meeting point', 'An office location'], ans: 1, exp: 'A security checkpoint is a designated location where personnel, vehicles, and items are inspected before access is granted.' },
    { q: 'What is negligence in security?', opts: ['Doing your job correctly', 'Failure to exercise reasonable care resulting in harm or loss', 'Following all procedures', 'Being too careful'], ans: 1, exp: 'Negligence is the failure to exercise the reasonable care expected, resulting in harm, injury, or loss.' },
    { q: 'What is the purpose of security signage?', opts: ['Advertising', 'Warning and informing about security measures and restricted areas', 'Decoration', 'Directions to exits only'], ans: 1, exp: 'Security signage warns and informs people about security measures, restricted areas, and consequences of unauthorized access.' },
    { q: 'What is tailgating in security?', opts: ['Following someone through a secured entrance without authorization', 'A type of patrol', 'A driving technique', 'A communication method'], ans: 0, exp: 'Tailgating is when an unauthorized person follows closely behind an authorized person through a secured entrance.' },
    { q: 'What is the role of a shift supervisor?', opts: ['Only write reports', 'Oversee security operations during a shift, manage personnel, and handle incidents', 'Patrol the perimeter only', 'Monitor CCTV only'], ans: 1, exp: 'A shift supervisor oversees all security operations during their shift, manages personnel, and handles escalated incidents.' },
    { q: 'What is an after-action report?', opts: ['A report filed before an incident', 'A review and analysis document completed after an incident or operation', 'A daily schedule', 'A financial report'], ans: 1, exp: 'An after-action report reviews and analyzes an incident or operation after it occurs to identify lessons learned.' },
    { q: 'What is threat assessment?', opts: ['Guessing what might happen', 'Systematic evaluation of threats to determine their credibility and potential impact', 'Checking equipment', 'Interviewing suspects'], ans: 1, exp: 'Threat assessment is a systematic evaluation of potential threats to determine their credibility, likelihood, and potential impact.' },
    { q: 'What is the purpose of security fencing?', opts: ['Decorative landscaping', 'Create a physical barrier to deter and delay unauthorized entry', 'Block views', 'Hide security cameras'], ans: 1, exp: 'Security fencing creates a physical barrier that deters and delays unauthorized entry, forming the first line of perimeter defense.' },
    { q: 'What should a security officer do during a power outage?', opts: ['Go home', 'Maintain post, use emergency lighting, increase vigilance, and report', 'Sleep until power returns', 'Leave the facility'], ans: 1, exp: 'During a power outage, maintain your post, use emergency lighting, increase vigilance, and report immediately.' },
    { q: 'What is a security vulnerability?', opts: ['A strong defense', 'A weakness that can be exploited by a threat', 'A type of alarm', 'A training exercise'], ans: 1, exp: 'A security vulnerability is a weakness in security measures, procedures, or systems that can be exploited by threats.' },
    { q: 'What is the principle of least privilege?', opts: ['Give everyone full access', 'Grant only the minimum access necessary for a person to perform their role', 'No one should have access', 'Only supervisors should have access'], ans: 1, exp: 'The principle of least privilege means granting only the minimum access needed for someone to perform their specific duties.' },
    { q: 'What is an evacuation plan?', opts: ['A plan for lunch breaks', 'A documented procedure for safely moving people out of a facility in an emergency', 'A patrol schedule', 'A visitor guide'], ans: 1, exp: 'An evacuation plan is a documented procedure that outlines how to safely move all people out of a facility during an emergency.' },
    { q: 'What is the importance of documentation in security?', opts: ['It is not important', 'It provides legal evidence, ensures continuity, and supports accountability', 'It wastes time', 'It is only for supervisors'], ans: 1, exp: 'Documentation provides legal evidence, ensures operational continuity, and supports accountability for all security activities.' },
    { q: 'What is a security audit?', opts: ['A financial review', 'A systematic evaluation of security policies, procedures, and measures', 'An employee performance review', 'An equipment inventory'], ans: 1, exp: 'A security audit is a systematic, independent evaluation of an organization\'s security policies, procedures, and measures.' },
    { q: 'What is the primary goal of loss prevention?', opts: ['Catch thieves', 'Reduce opportunities for theft, damage, and waste', 'Increase sales', 'Fire employees'], ans: 1, exp: 'The primary goal of loss prevention is to reduce opportunities for theft, damage, and waste through proactive measures.' },
    { q: 'What is the difference between a threat and a vulnerability?', opts: ['They are the same thing', 'A threat is a potential danger; a vulnerability is a weakness that a threat can exploit', 'A vulnerability causes threats', 'Threats are always physical'], ans: 1, exp: 'A threat is a potential source of danger; a vulnerability is a weakness that a threat can exploit to cause harm.' },
    { q: 'What is the role of communication in security operations?', opts: ['It is not important', 'It ensures coordination, timely response, and effective incident management', 'It wastes time', 'It is only for supervisors'], ans: 1, exp: 'Communication is essential in security operations for coordination, timely response, reporting, and effective incident management.' },
    { q: 'Why is professionalism important in security?', opts: ['It is not important', 'It builds trust, maintains authority, and represents the organization positively', 'It slows down operations', 'It creates distance from the public'], ans: 1, exp: 'Professionalism builds trust with clients and the public, maintains authority, and positively represents both the officer and the organization.' },
    { q: 'What is the main role of a security supervisor?', opts: ['To do all the patrols personally', 'To lead, coordinate, and oversee the security team and operations', 'To replace the client', 'To avoid paperwork'], ans: 1, exp: 'A supervisor leads, coordinates, and oversees the security team and daily operations, ensuring standards are met.' },
    { q: 'What is effective delegation for a supervisor?', opts: ['Doing every task yourself', 'Assigning the right tasks to the right officers with clear instructions and accountability', 'Never giving instructions', 'Assigning tasks randomly'], ans: 1, exp: 'Delegation means assigning suitable tasks to the right officers with clear instructions, authority, and accountability.' },
    { q: 'What is the purpose of a shift handover?', opts: ['To end work early', 'To pass on key information, incidents, and instructions to the next shift', 'To count staff only', 'To collect keys only'], ans: 1, exp: 'A shift handover ensures continuity by passing on key information, ongoing incidents, and instructions to the incoming shift.' },
    { q: 'What are the main steps of a risk assessment?', opts: ['Guess and hope', 'Identify hazards, assess the risk, apply controls, and review', 'Only report after an incident', 'Buy more equipment'], ans: 1, exp: 'A risk assessment identifies hazards, evaluates the likelihood and impact, applies control measures, and is reviewed regularly.' },
    { q: 'What should a security plan include?', opts: ['Only a staff list', 'Objectives, risks, resources, procedures, and emergency responses', 'Only the budget', 'Nothing in writing'], ans: 1, exp: 'A security plan sets out objectives, identified risks, resources, standard procedures, and emergency response arrangements.' },
    { q: 'When taking corrective/disciplinary action, a supervisor should:', opts: ['Act on rumour', 'Be fair, consistent, follow procedure, and document the facts', 'Punish publicly to set an example', 'Ignore the issue'], ans: 1, exp: 'Disciplinary action must be fair, consistent, follow company and legal procedure, and be based on documented facts.' },
    { q: 'What is incident command?', opts: ['Ignoring the incident', 'A structured system for one person to coordinate the response to an incident', 'Letting everyone act alone', 'A type of patrol'], ans: 1, exp: 'Incident command is a structured system where a designated leader coordinates people and resources during an incident.' },
    { q: 'During a crisis, an effective leader should:', opts: ['Panic and shout', 'Stay calm, communicate clearly, prioritise safety, and direct the team', 'Leave the scene', 'Wait for instructions only'], ans: 1, exp: 'Crisis leadership means staying calm, communicating clearly, prioritising life safety, and giving clear direction to the team.' },
    { q: 'What is escalation in incident handling?', opts: ['Making things worse on purpose', 'Referring a situation to a higher level of authority when it exceeds your responsibility', 'Ending your shift', 'Hiding the incident'], ans: 1, exp: 'Escalation means promptly referring a situation to a higher authority when it exceeds your level of responsibility or resources.' },
    { q: 'Why is regulatory compliance important for a supervisor?', opts: ['It is optional', 'It keeps operations lawful and protects the officers, client, and public', 'It only matters to head office', 'It slows the team down'], ans: 1, exp: 'Compliance with regulations such as PSRA keeps operations lawful and protects officers, the client, and the public.' },
    { q: 'What does ethical conduct require of a supervisor?', opts: ['Favouritism', 'Honesty, fairness, integrity, and treating everyone with respect', 'Bending rules for friends', 'Ignoring wrongdoing'], ans: 1, exp: 'Ethical conduct requires honesty, fairness, integrity, and treating officers, clients, and the public with respect.' },
    { q: 'How can a supervisor motivate a security team?', opts: ['Threats only', 'Clear expectations, recognition, fair treatment, and leading by example', 'Ignoring good work', 'Never giving feedback'], ans: 1, exp: 'Motivation comes from clear expectations, recognising good work, fair treatment, and leading by example.' },
    { q: 'What is the purpose of quality assurance inspections?', opts: ['To catch officers out', 'To check that standards and procedures are being met and to drive improvement', 'To reduce staff', 'To avoid paperwork'], ans: 1, exp: 'Quality assurance inspections verify that standards and procedures are being met and identify areas for improvement.' },
    { q: 'What should a supervisor do when an officer repeatedly breaches conduct standards?', opts: ['Ignore it', 'Address it through counselling and the proper disciplinary process, and document it', 'Dismiss them on the spot without process', 'Move them to another site quietly'], ans: 1, exp: 'Repeated breaches should be addressed through counselling and the proper documented disciplinary process, following policy and law.' }
  ],
  driving: [
    { q: 'What should you do before moving off from a parked position?', opts: ['Sound the horn', 'Check mirrors and blind spots, then signal', 'Accelerate quickly', 'Flash your headlights'], ans: 1, exp: 'Always check your mirrors and blind spots and signal your intention before moving off to make sure it is safe.' },
    { q: 'What is the correct hand position on the steering wheel?', opts: ['12 o\'clock only', '10 and 2, or 9 and 3', 'One hand at the bottom', 'Both hands at the bottom'], ans: 1, exp: 'Placing your hands at the 9 and 3 (or 10 and 2) positions gives the best control and balance of the steering wheel.' },
    { q: 'What does a solid double white/yellow line in the centre of the road mean?', opts: ['Overtaking is allowed', 'You must not cross or overtake', 'Parking is allowed', 'The road ends ahead'], ans: 1, exp: 'A solid centre line means you must not cross it to overtake — it marks where overtaking is unsafe.' },
    { q: 'What is the safe following distance rule in good conditions?', opts: ['Half-second rule', 'The two-second rule', 'Ten-car lengths at all speeds', 'There is no rule'], ans: 1, exp: 'The two-second rule leaves enough space to stop safely; increase it to four seconds or more in poor conditions.' },
    { q: 'When approaching a roundabout, who normally has priority?', opts: ['Traffic entering the roundabout', 'Traffic already on the roundabout', 'The largest vehicle', 'Whoever arrives first'], ans: 1, exp: 'Traffic already on the roundabout normally has priority; give way to vehicles coming from your right (in left-hand-drive Jamaica).' },
    { q: 'What should you do when you see a pedestrian crossing ahead?', opts: ['Speed up to pass first', 'Slow down and be ready to stop for pedestrians', 'Sound your horn continuously', 'Ignore it if no one is there'], ans: 1, exp: 'Slow down on approach and be prepared to stop to give way to pedestrians at a crossing.' },
    { q: 'What is the purpose of the handbrake (parking brake)?', opts: ['To stop the car while driving', 'To hold the vehicle stationary when parked', 'To signal turns', 'To change gears'], ans: 1, exp: 'The handbrake holds the vehicle securely when parked or stopped, especially on a hill.' },
    { q: 'When should you use your headlights?', opts: ['Only at night', 'In the dark and in poor visibility such as rain or fog', 'Never in the city', 'Only on highways'], ans: 1, exp: 'Use headlights in darkness and whenever visibility is poor, such as in rain, fog, or dusk.' },
    { q: 'What should you do if your vehicle starts to skid?', opts: ['Brake hard immediately', 'Steer gently in the direction you want to go and ease off the accelerator', 'Turn the wheel sharply the opposite way', 'Close your eyes'], ans: 1, exp: 'Ease off the accelerator and steer gently in the direction you want the front of the car to go; avoid harsh braking.' },
    { q: 'What is the correct action at a STOP sign?', opts: ['Slow down and continue', 'Come to a complete stop, then proceed when safe', 'Sound your horn and go', 'Stop only if other cars are present'], ans: 1, exp: 'A STOP sign requires a complete stop; proceed only when the way is clear and it is safe.' },
    { q: 'Before overtaking another vehicle, you should:', opts: ['Overtake on any bend', 'Check it is legal, safe, and there is a clear gap, then signal', 'Overtake without signalling', 'Overtake near a junction'], ans: 1, exp: 'Only overtake where it is legal and safe, with a clear view ahead and enough space, and signal your intention.' },
    { q: 'What does a flashing amber/yellow traffic light generally mean?', opts: ['Stop completely', 'Proceed with caution', 'Speed up', 'Road closed'], ans: 1, exp: 'A flashing amber light means proceed with caution, giving way to any pedestrians or traffic already there.' },
    { q: 'Why should you wear a seatbelt?', opts: ['It is optional', 'It reduces the risk of serious injury in a collision', 'It improves fuel economy', 'It makes the car faster'], ans: 1, exp: 'Seatbelts significantly reduce the risk of serious injury or death by restraining you during a collision.' },
    { q: 'What should you check in your mirrors before turning or changing lanes?', opts: ['Nothing', 'The position and speed of traffic behind and beside you', 'The radio', 'Your appearance'], ans: 1, exp: 'Check the position and speed of traffic behind and to the side, plus your blind spot, before turning or changing lanes.' },
    { q: 'When driving in heavy rain, you should:', opts: ['Drive faster to get through it', 'Reduce speed, increase following distance, and use headlights', 'Turn off your lights', 'Follow closely behind another car'], ans: 1, exp: 'In heavy rain, reduce speed, leave a larger gap, and switch on dipped headlights to see and be seen.' },
    { q: 'What should you do at a pedestrian zebra crossing when someone is waiting?', opts: ['Continue at speed', 'Stop and allow them to cross', 'Wave them back', 'Sound your horn'], ans: 1, exp: 'You must give way and stop to let pedestrians cross at a zebra crossing.' },
    { q: 'What is the first thing to do after a minor collision?', opts: ['Drive away quickly', 'Stop, check for injuries, and make the scene safe', 'Argue with the other driver', 'Ignore it'], ans: 1, exp: 'Stop, check whether anyone is injured, make the scene safe, and exchange details as required by law.' },
    { q: 'What does eco-driving mainly help with?', opts: ['Driving faster', 'Reducing fuel use and emissions through smooth driving', 'Louder engine sound', 'Ignoring speed limits'], ans: 1, exp: 'Eco-driving uses smooth acceleration, steady speeds, and early gear changes to cut fuel consumption and emissions.' },
    { q: 'When are you allowed to use a handheld mobile phone while driving?', opts: ['Any time', 'Never — it is illegal and dangerous', 'Only on highways', 'Only at traffic lights'], ans: 1, exp: 'Using a handheld phone while driving is illegal and dangerous; pull over safely if you must use it.' },
    { q: 'What should you do when approaching a school zone?', opts: ['Maintain highway speed', 'Reduce speed and watch for children', 'Overtake other cars', 'Sound your horn to warn children'], ans: 1, exp: 'Slow to the posted school-zone limit and stay alert for children who may cross unexpectedly.' }
  ]
};

function bankForCourse(courseId) {
  if (courseId && courseId.indexOf('driver') !== -1) return QUESTION_BANK.driving;
  return QUESTION_BANK.security;
}

// Map a module title to the keywords that make a question relevant to it.
// Ordered: first entry whose any "match" substring appears in the module title wins.
const MODULE_QUIZ_KEYWORDS = [
  // ----- Driving -----
  { match: ['introduction to driving'], kw: ['vehicle', 'mirror', 'steering wheel', 'hand position', 'seatbelt', 'handbrake', 'parking brake'] },
  { match: ['road rules', 'signs'], kw: ['line', 'sign', 'traffic light', 'amber', 'road', 'marking', 'overtak', 'pedestrian', 'school zone'] },
  { match: ['basic vehicle control'], kw: ['moving off', 'steering', 'gear', 'handbrake', 'hand position', 'mirror'] },
  { match: ['safe driving habits'], kw: ['following distance', 'two-second', 'mirror', 'seatbelt', 'pedestrian', 'blind spot'] },
  { match: ['advancing your skills'], kw: ['overtak', 'lane', 'traffic', 'mirror', 'following distance'] },
  { match: ['junctions', 'roundabout'], kw: ['roundabout', 'junction', 'priority', 'right of way', 'pedestrian', 'crossing', 'stop sign', 'give way'] },
  { match: ['parking', 'maneuver'], kw: ['handbrake', 'parking brake', 'park', 'revers', 'hill', 'mirror', 'blind spot'] },
  { match: ['adverse conditions'], kw: ['rain', 'headlight', 'visibilit', 'night', 'fog', 'skid'] },
  { match: ['defensive driving'], kw: ['hazard', 'pedestrian', 'mirror', 'following distance', 'school zone', 'skid'] },
  { match: ['highway', 'motorway'], kw: ['overtak', 'lane', 'following distance', 'headlight', 'phone'] },
  { match: ['emergency handling'], kw: ['skid', 'collision', 'brake', 'breakdown', 'headlight'] },
  { match: ['professional driving'], kw: ['eco-driving', 'phone', 'seatbelt', 'fuel', 'following distance'] },
  // ----- Security (officer) -----
  { match: ['introduction to security'], kw: ['primary role', 'core duty', 'difference between a security officer', 'deterrence', 'situational awareness', 'what is'] },
  { match: ['roles and responsibilities'], kw: ['primary role', 'core duty', 'code of conduct', 'professional', 'difference between a security officer', 'negligence'] },
  { match: ['observation and reporting'], kw: ['report', 'observation', 'log', 'documentation', 'situational awareness', 'after-action'] },
  { match: ['access control'], kw: ['access control', 'visitor', 'restricted', 'checkpoint', 'tailgating', 'key control', 'least privilege', 'fencing'] },
  { match: ['patrol'], kw: ['patrol', 'perimeter', 'deterrence', 'lighting', 'buddy'] },
  { match: ['emergency response'], kw: ['fire', 'emergency', 'evacuation', 'bomb', 'suspicious package', 'power outage', 'first step'] },
  { match: ['communication'], kw: ['radio', 'communication', 'briefing', 'report'] },
  { match: ['conflict'], kw: ['de-escalation', 'conflict', 'use of force'] },
  { match: ['legal', 'regulatory'], kw: ['psra', 'use of force', 'citizen', 'contraband', 'negligence', 'chain of custody', 'evidence'] },
  { match: ['industrial'], kw: ['industrial', 'perimeter', 'fencing', 'hazard', 'restricted', 'vulnerabilit', 'lighting'] },
  { match: ['customer service'], kw: ['customer', 'complaint', 'communication', 'professional', 'de-escalation'] },
  { match: ['professionalism', 'professional standards', 'conduct'], kw: ['professional', 'code of conduct', 'negligence', 'documentation', 'quality'] },
  // ----- Supervisor (senior / junior) -----
  { match: ['supervisor role', 'senior supervisor', 'junior supervisor', 'first-line'], kw: ['supervisor', 'delegation', 'shift', 'briefing', 'leadership', 'handover'] },
  { match: ['leadership', 'team'], kw: ['supervisor', 'leadership', 'motivate', 'team', 'delegation', 'shift'] },
  { match: ['risk assessment', 'security planning', 'risk'], kw: ['risk', 'threat', 'vulnerabilit', 'assessment', 'plan', 'audit'] },
  { match: ['discipline', 'conduct control'], kw: ['disciplin', 'corrective', 'conduct', 'ethical', 'breach'] },
  { match: ['incident leadership', 'incident response', 'incident'], kw: ['incident', 'crisis', 'command', 'escalation', 'after-action', 'emergency'] },
  { match: ['compliance', 'ethics'], kw: ['compliance', 'regulat', 'ethical', 'psra', 'integrity'] },
  { match: ['access control oversight'], kw: ['access control', 'visitor', 'restricted', 'checkpoint', 'tailgating', 'supervisor'] }
];

function keywordsForModule(moduleTitle) {
  if (!moduleTitle) return null;
  const t = moduleTitle.toLowerCase();
  for (const entry of MODULE_QUIZ_KEYWORDS) {
    if (entry.match.some(m => t.indexOf(m) !== -1)) return entry.kw;
  }
  return null;
}

function questionMatches(question, keywords) {
  const hay = (question.q + ' ' + question.exp + ' ' + question.opts.join(' ')).toLowerCase();
  return keywords.some(k => hay.indexOf(k) !== -1);
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// count: how many questions; courseId: routes driving vs security;
// moduleTitle: aligns questions to the module topic; isFinal: use the whole course pool.
function generateQuizQuestions(count, courseId, moduleTitle, isFinal) {
  const bank = bankForCourse(courseId);
  // Final exams draw broadly from the whole course pool.
  if (isFinal) return shuffle(bank).slice(0, Math.min(count, bank.length));

  const keywords = keywordsForModule(moduleTitle);
  if (!keywords) return shuffle(bank).slice(0, Math.min(count, bank.length));

  const relevant = shuffle(bank.filter(q => questionMatches(q, keywords)));
  if (relevant.length >= count) return relevant.slice(0, count);

  // Top up with other questions from the same course pool so the quiz is never short.
  const selected = relevant.slice();
  const extras = shuffle(bank.filter(q => selected.indexOf(q) === -1));
  for (const q of extras) {
    if (selected.length >= count) break;
    selected.push(q);
  }
  return selected.slice(0, Math.min(count, bank.length));
}

// ===== RENDER CURRICULUM =====
function loadCourseContent(courseId) {
  const data = COURSE_DATA[courseId];
  if (!data) return;
  const contentId = {
    'course-level1': 'lvl1-curriculum-content',
    'course-assessment': 'assess-curriculum-content',
    'course-senior': 'senior-curriculum-content',
    'course-junior': 'junior-curriculum-content',
    'course-driver-beginner': 'drvb-curriculum-content',
    'course-driver-intermediate': 'drvi-curriculum-content',
    'course-driver-advanced': 'drva-curriculum-content'
  }[courseId];
  const quizListId = {
    'course-level1': 'lvl1-quiz-list',
    'course-assessment': 'assess-quiz-list',
    'course-senior': 'senior-quiz-list',
    'course-junior': 'junior-quiz-list',
    'course-driver-beginner': 'drvb-quiz-list',
    'course-driver-intermediate': 'drvi-quiz-list',
    'course-driver-advanced': 'drva-quiz-list'
  }[courseId];
  const reviewsId = {
    'course-level1': 'lvl1-reviews-content',
    'course-assessment': 'assess-reviews-content',
    'course-senior': 'senior-reviews-content',
    'course-junior': 'junior-reviews-content',
    'course-driver-beginner': 'drvb-reviews-content',
    'course-driver-intermediate': 'drvi-reviews-content',
    'course-driver-advanced': 'drva-reviews-content'
  }[courseId];

  // Check if already enrolled
  const enrolled = getEnrolled();
  if (enrolled.includes(data.name)) {
    document.querySelectorAll('.enroll-btn').forEach(b => { b.textContent = '✓ Enrolled'; b.classList.add('enrolled'); b.disabled = true; });
  }

  // Build curriculum
  const contentEl = document.getElementById(contentId);
  if (contentEl) {
    let html = '';
    data.modules.forEach((mod, mi) => {
      const isGate = mod.title.includes('GATE');
      const isFinal = mod.title.includes('FINAL');
      html += '<div class="curriculum-module ' + (isGate ? 'gate-module' : '') + (isFinal ? ' final-module' : '') + '">';
      html += '<div class="module-header" onclick="toggleModule(this)">' + mod.title + ' <span class="arrow">▼</span></div>';
      html += '<div class="module-body">';
      mod.lessons.forEach((les, li) => {
        const lessonId = courseId + '-m' + mi + '-l' + li;
        const typeClass = les.type === 'quiz' ? 'quiz' : les.type === 'gate' ? 'gate' : les.type === 'scenario' ? 'scenario' : '';
        const typeLabel = les.type === 'quiz' ? 'Quiz (' + les.questions + 'Q)' : les.type === 'gate' ? '🔒 GATE' : les.type === 'scenario' ? '📝 Scenario' : '📖 Lesson';
        html += '<div class="curriculum-lesson">';
        html += '<span class="lesson-title" onclick="startLesson(\'' + courseId + '\',' + mi + ',' + li + ')">' + les.title + '</span>';
        html += '<span class="lesson-type ' + typeClass + '">' + typeLabel + '</span>';
        html += '<span class="lesson-duration">' + les.duration + '</span>';
        html += '</div>';
      });
      html += '</div></div>';
    });
    contentEl.innerHTML = html;
  }

  // Build quiz list
  const quizEl = document.getElementById(quizListId);
  if (quizEl) {
    let html = '';
    data.modules.forEach((mod, mi) => {
      mod.lessons.forEach((les, li) => {
        if (les.type === 'quiz') {
          html += '<div class="course-list-item" style="cursor:pointer;" onclick="startLesson(\'' + courseId + '\',' + mi + ',' + li + ')">';
          html += '<span class="cl-name">' + les.title + ' — ' + les.questions + ' Questions</span>';
          html += '<button class="btn btn-sm btn-primary">Start Quiz</button>';
          html += '</div>';
        }
      });
    });
    quizEl.innerHTML = html || '<p style="color:#888;">No quizzes available for this course.</p>';
  }

  // Build reviews
  const reviewsEl = document.getElementById(reviewsId);
  if (reviewsEl) {
    reviewsEl.innerHTML = '<p style="color:#888;">No reviews yet.</p>';
  }
}

function toggleModule(header) {
  header.classList.toggle('open');
  const body = header.nextElementSibling;
  body.classList.toggle('open');
}

// ===== LESSON CONTENT =====
const LESSON_CONTENT = {
  'What Is Security?': { title: 'What Is Security?', content: '<h2>What Is Security?</h2><p>Security is the state of being protected from danger, harm, or loss. In the professional security industry, it refers to the measures taken to protect people, property, information, and assets from threats.</p><div class="key-point">Key Point: Security is both a <strong>state</strong> (being safe) and a <strong>practice</strong> (actions taken to achieve safety).</div><h3>Core Concepts</h3><ul><li><strong>Protection:</strong> Safeguarding people, property, and information</li><li><strong>Prevention:</strong> Stopping incidents before they occur</li><li><strong>Detection:</strong> Identifying threats and vulnerabilities</li><li><strong>Response:</strong> Reacting appropriately to incidents</li><li><strong>Recovery:</strong> Returning to normal operations after an incident</li></ul><div class="highlight-box">💡 The five pillars of security: Deter, Detect, Delay, Respond, Recover.</div><p>Professional security officers serve as the front line of defense for organizations, properties, and individuals. Their presence alone acts as a deterrent, while their training enables them to detect, respond to, and document security incidents effectively.</p>' },
  'Types of Security Operations': { title: 'Types of Security Operations', content: '<h2>Types of Security Operations</h2><p>Security operations vary widely depending on the environment and client needs. Understanding the different types helps officers prepare for diverse assignments.</p><h3>Common Security Operation Types</h3><ul><li><strong>Static/Guard Duty:</strong> Remaining at a fixed post such as a gatehouse or reception</li><li><strong>Patrol Operations:</strong> Moving through a property on foot or in a vehicle to observe and deter</li><li><strong>Access Control:</strong> Managing who enters and exits a facility</li><li><strong>CCTV Monitoring:</strong> Observing camera feeds for suspicious activity</li><li><strong>Event Security:</strong> Managing crowds and safety at public or private events</li><li><strong>Executive Protection:</strong> Providing close protection for VIPs</li><li><strong>Retail Security:</strong> Preventing theft and maintaining safety in stores</li><li><strong>Industrial Security:</strong> Protecting manufacturing and industrial facilities</li><li><strong>Residential Security:</strong> Securing housing communities and apartments</li></ul><div class="key-point">Each type of operation requires specific skills and knowledge, but all share common principles of observation, reporting, and professional conduct.</div>' },
  'default': { title: 'Lesson Content', content: '<h2>Lesson Content</h2><p>This lesson covers important security training material. As you progress through the course, each lesson builds on previous knowledge to develop your skills as a professional security officer.</p><h3>Key Topics</h3><ul><li>Professional standards and expectations</li><li>Practical skills for security operations</li><li>Legal and regulatory requirements</li><li>Communication and reporting procedures</li><li>Emergency response protocols</li><li>Customer service in security environments</li></ul><div class="highlight-box">💡 Remember: Learning is progressive. Each lesson builds on the previous one. Take notes and review regularly.</div><p>Complete all lessons in order and take the quizzes to test your understanding. You must score at least 80% on each quiz to pass.</p>' }
};

// ===== DRIVING LESSON TEACHING POINTS (keyed by lesson title) =====
const DRIVING_LESSONS = {
  'Getting to Know Your Vehicle': ['Identify the main controls: steering wheel, pedals, gear selector, handbrake and indicators.', 'Understand the dashboard warning lights and what each one means.', 'Learn how to check fuel, oil, coolant, tyre pressure and lights before driving.', 'Adjust the seat, head restraint and mirrors for a safe driving position.'],
  'Controls, Mirrors and Seating Position': ['Set your seat so you can fully press the pedals with a slight bend in the knee.', 'Adjust all three mirrors to minimise blind spots.', 'Keep hands at the 9 and 3 position for the best control.', 'Position the head restraint level with the top of your head to reduce whiplash injury.'],
  'Jamaican Road Code Basics': ['Jamaica drives on the LEFT side of the road.', 'Understand speed limits: 50 km/h in built-up areas and higher on highways where posted.', 'Know the legal requirements: valid licence, insurance, seatbelts and roadworthy vehicle.', 'Learn who has priority at junctions and crossings.'],
  'Traffic Signs and Signals': ['Regulatory signs (e.g. STOP, No Entry) must be obeyed by law.', 'Warning signs alert you to hazards ahead such as bends or crossings.', 'Information/direction signs guide you to places and routes.', 'Traffic light sequence: red = stop, amber = prepare to stop, green = go if clear.'],
  'Road Markings': ['A solid centre line means no overtaking; a broken line means you may overtake when safe.', 'Yellow edge lines and box junctions restrict stopping and waiting.', 'Give-way and stop lines tell you where to halt at junctions.', 'Arrows show which lane to use for your intended direction.'],
  'Starting, Moving Off and Stopping': ['Complete cockpit checks, then start the engine safely.', 'Use mirrors, signal, and check blind spots before moving off.', 'Accelerate smoothly and brake progressively to stop gently.', 'Always secure the vehicle with the handbrake when stopped.'],
  'Steering and Turning': ['Use the pull-push method to steer smoothly without crossing your arms.', 'Slow down before a turn, not during it.', 'Signal in good time and position correctly for left or right turns.', 'Check mirrors and blind spots before and during the turn.'],
  'Changing Gears': ['Match the gear to your speed and the road conditions.', 'Change up as speed increases and down as you slow or climb hills.', 'Keep both hands on the wheel as much as possible; change gears smoothly.', 'Avoid coasting in neutral, which reduces control.'],
  'Observation and Awareness': ['Scan far ahead, near, and to the sides continuously.', 'Use mirrors regularly — at least every 5 to 8 seconds.', 'Anticipate the actions of pedestrians, cyclists and other drivers.', 'Keep a safe space around your vehicle at all times.'],
  'Safe Following Distance': ['Apply the two-second rule in good conditions.', 'Double the gap to at least four seconds in rain or poor visibility.', 'Increase distance further behind large or slow vehicles.', 'Never tailgate — it removes your time to react.'],
  'Seatbelts and Safety Checks': ['Driver and all passengers must wear seatbelts by law.', 'Do a quick POWDER/walk-around check: petrol, oil, water, damage, electrics, rubber (tyres).', 'Ensure children use appropriate restraints.', 'Check mirrors, lights and horn work before every journey.'],
  'Driving in Traffic': ['Keep a steady speed and safe gap in slow-moving traffic.', 'Anticipate stops and avoid harsh braking.', 'Watch for vehicles changing lanes and merging.', 'Stay calm and courteous to reduce risk and stress.'],
  'Lane Discipline and Overtaking': ['Keep to the correct lane and only change when necessary and safe.', 'Overtake only where legal, with a clear view and enough space.', 'Signal, check mirrors and blind spot, then move out decisively.', 'Return to your lane without cutting in on the vehicle you passed.'],
  'Approaching Junctions': ['Use the Mirror–Signal–Manoeuvre routine on approach.', 'Slow down and be ready to give way or stop.', 'Look right, left and right again before emerging.', 'Only proceed when you have a safe gap.'],
  'Navigating Roundabouts': ['Give way to traffic already on the roundabout (coming from your right in Jamaica).', 'Choose the correct lane and signal for your exit.', 'Keep moving when it is clear; do not stop unnecessarily.', 'Watch for cyclists and motorcyclists who may be in your blind spot.'],
  'Right of Way Rules': ['Yield where signs, signals or road markings require it.', 'At unmarked junctions, give way to traffic on the major road.', 'Pedestrians at crossings have priority.', 'Never assume others will give way — confirm it is safe.'],
  'Parallel Parking': ['Find a space at least 1.5 times your car length.', 'Line up with the vehicle in front and reverse slowly, steering into the gap.', 'Straighten up and adjust so you are close to and parallel with the kerb.', 'Check mirrors and blind spots throughout the manoeuvre.'],
  'Reversing and Three-Point Turns': ['Reverse slowly with good all-round observation.', 'Look mainly through the rear window in the direction you are travelling.', 'For a three-point turn, use full lock and control speed with the clutch/brake.', 'Give way to any approaching traffic or pedestrians.'],
  'Hill Starts': ['Hold the car with the handbrake to prevent rolling back.', 'Find the biting point, then release the handbrake as you gently accelerate.', 'Use mirrors and signal before moving off.', 'On a downhill start, use the foot brake and move off smoothly.'],
  'Driving in Rain and Poor Visibility': ['Reduce speed and increase your following distance.', 'Use dipped headlights so you can see and be seen.', 'Avoid harsh braking and steering on wet roads to prevent skidding.', 'Beware of standing water and the risk of aquaplaning.'],
  'Night Driving': ['Use headlights correctly — dip for oncoming traffic.', 'Reduce speed so you can stop within the distance you can see.', 'Keep your windscreen and lights clean.', 'Watch for pedestrians, cyclists and animals that are harder to see.'],
  'Hazard Perception': ['Scan continuously for developing hazards, not just immediate ones.', 'Identify static hazards (junctions, parked cars) and moving hazards (pedestrians, cyclists).', 'Plan your response early and reduce speed in good time.', 'Expect the unexpected and always leave an escape route.'],
  'Anticipating Other Road Users': ['Read the road and predict what others might do.', 'Take extra care around vulnerable users: pedestrians, cyclists, motorcyclists.', 'Watch body language, indicators and brake lights for clues.', 'Give others room and time to react.'],
  'Joining and Leaving Highways': ['Build up speed on the slip road to match highway traffic before merging.', 'Signal, check mirrors and blind spot, then merge into a safe gap.', 'To leave, move into the exit lane early and signal.', 'Adjust to slower speeds gradually after leaving.'],
  'High-Speed Lane Management': ['Keep left unless overtaking.', 'Maintain a larger following distance at higher speeds.', 'Check mirrors and blind spots well before changing lanes.', 'Avoid sudden movements; plan lane changes early.'],
  'Skid Control and Braking': ['Skids are usually caused by driving too fast for the conditions.', 'If you skid, ease off the accelerator and steer gently into the skid.', 'With ABS, brake firmly and steer; without ABS, avoid locking the wheels.', 'Prevention is best: reduce speed and drive smoothly.'],
  'Handling Vehicle Breakdowns': ['Move to a safe place off the carriageway if possible.', 'Switch on hazard lights and use a warning triangle where safe.', 'Keep passengers away from traffic, behind a barrier if available.', 'Call for assistance and stay visible and safe.'],
  'Accident Procedures': ['Stop, make the scene safe and switch on hazard lights.', 'Check for injuries and call emergency services if needed.', 'Exchange names, contacts, insurance and vehicle details.', 'Record the scene and report as required by law.'],
  'Eco-Driving and Fuel Efficiency': ['Accelerate and brake smoothly to save fuel.', 'Change up to higher gears early and keep revs low.', 'Maintain steady speeds and anticipate traffic to avoid stopping.', 'Keep tyres properly inflated and remove unnecessary weight.'],
  'Long-Distance Driving': ['Plan your route and rest stops in advance.', 'Take a break at least every two hours to avoid fatigue.', 'Stay hydrated and never drive when tired.', 'Keep the vehicle well maintained for the journey.']
};

function buildDrivingLesson(title) {
  const points = DRIVING_LESSONS[title];
  let body = '<h2>' + escapeHtml(title) + '</h2>';
  if (points) {
    body += '<p>This lesson covers the key skills and knowledge for <strong>' + escapeHtml(title.toLowerCase()) + '</strong> as part of your driver training.</p>';
    body += '<h3>Key Points</h3><ul style="line-height:2;">';
    points.forEach(p => { body += '<li>' + escapeHtml(p) + '</li>'; });
    body += '</ul>';
    body += '<div class="highlight-box">🚗 Practice this skill under supervision until it becomes second nature, and always apply the Jamaican Road Code.</div>';
  } else {
    body += '<p>This driving lesson builds practical, safe driving skills. Study the Jamaican Road Code and practise under the guidance of a qualified instructor.</p>';
  }
  return { title: title, content: body };
}

// ===== SECURITY LESSON TEACHING POINTS (keyed by lesson title) =====
const SECURITY_LESSONS = {
  'Security Officer Role': ['Protect people, property, information and assets through presence and vigilance.', 'Observe, deter, detect, report and respond — you are not a police officer.', 'Follow post orders and standard operating procedures at all times.', 'Act professionally and lawfully in every situation.'],
  'Code of Conduct': ['Behave with honesty, integrity and professionalism on and off post.', 'Respect confidentiality and never misuse your position.', 'Treat all people fairly and without discrimination.', 'Report misconduct and avoid conflicts of interest.'],
  'Observation Skills': ['Stay alert and continuously scan your environment.', 'Notice what is normal so you can spot what is abnormal.', 'Use all your senses and record accurate descriptions.', 'Distinguish facts from assumptions when observing.'],
  'Report Writing': ['Record facts clearly: who, what, when, where, why and how.', 'Write in plain, objective language without opinion.', 'Complete reports promptly while details are fresh.', 'Reports may be used as legal evidence, so accuracy matters.'],
  'Daily Activity Logs': ['Log all activities, observations and incidents during your shift.', 'Record times accurately in chronological order.', 'Note handover information for the next officer.', 'Keep logs neat, complete and tamper-free.'],
  'Access Control Principles': ['Control who enters and moves within a facility.', 'Verify identity and authorisation before granting access.', 'Apply the principle of least privilege.', 'Prevent tailgating and unauthorised entry.'],
  'Gatehouse Operations': ['Manage vehicle and pedestrian entry points efficiently.', 'Check credentials, log visitors and inspect as authorised.', 'Maintain traffic flow while keeping security.', 'Operate barriers, intercoms and CCTV correctly.'],
  'Visitor Management': ['Record all visitors entering and leaving the site.', 'Issue and recover visitor passes.', 'Verify appointments and escort visitors where required.', 'Ensure visitors follow site safety and security rules.'],
  'Patrol Techniques': ['Vary patrol routes and times to avoid predictability.', 'Check doors, windows, locks and vulnerable points.', 'Stay observant and maintain communication with base.', 'Record patrol findings and report anything unusual.'],
  'Incident Detection': ['Recognise signs of intrusion, theft, fire or hazards early.', 'Respond quickly and follow the correct procedure.', 'Preserve the scene and evidence where relevant.', 'Report and escalate as required.'],
  'Patrol Reporting': ['Document each patrol, including time, route and findings.', 'Report faults, hazards and security breaches promptly.', 'Use clear, factual language.', 'Follow up on outstanding issues from previous patrols.'],
  'Emergency Procedures': ['Assess the situation before acting.', 'Follow the site emergency and evacuation plan.', 'Raise the alarm and contact emergency services.', 'Assist and direct people to safety.'],
  'Fire Safety': ['Know the fire triangle: heat, fuel and oxygen.', 'On discovering fire, raise the alarm and evacuate.', 'Use the correct extinguisher type only if safe and trained.', 'Never use lifts and keep escape routes clear.'],
  'First Aid Basics': ['Ensure the scene is safe before helping.', 'Check response, airway, breathing and circulation.', 'Call for medical help and control serious bleeding.', 'Only act within your training and stay with the casualty.'],
  'Verbal Communication': ['Speak clearly, calmly and professionally.', 'Listen actively and confirm understanding.', 'Use appropriate tone and body language.', 'Adapt your communication to the situation and audience.'],
  'Written Communication': ['Write clearly, accurately and objectively.', 'Use correct format for reports, logs and notices.', 'Check spelling, facts and times before submitting.', 'Keep written records professional and confidential.'],
  'Radio Procedures': ['Keep transmissions brief, clear and professional.', 'Use correct call signs and standard phrases.', 'Wait for a clear channel before speaking.', 'Confirm messages are received and understood.'],
  'Understanding Conflict': ['Recognise the early warning signs of conflict.', 'Understand common causes and triggers.', 'Stay calm and avoid escalating the situation.', 'Know when to withdraw and call for support.'],
  'De-escalation Techniques': ['Stay calm and use a non-threatening posture.', 'Listen, show empathy and avoid arguing.', 'Give clear, respectful instructions.', 'Create space and time; call for help if needed.'],
  'PSRA Regulations': ['The Private Security Regulation Authority governs the industry in Jamaica.', 'Officers must be licensed and meet training standards.', 'Follow all legal and regulatory requirements.', 'Non-compliance can result in penalties and loss of licence.'],
  'Use of Force': ['Force is a last resort, used only in self-defence.', 'Any force used must be reasonable and proportionate.', 'Stop as soon as the threat ends.', 'Document and report every use of force.'],
  'Citizens Arrest': ['A private person may detain someone caught committing an indictable offence.', 'Use only reasonable force and detain briefly.', 'Hand the person to the police as soon as possible.', 'Know the legal limits to avoid liability.'],
  'Professional Standards': ['Maintain high standards of conduct and appearance.', 'Be punctual, reliable and disciplined.', 'Represent yourself and the company positively.', 'Follow procedures and continue to develop your skills.'],
  'Uniform and Grooming': ['Wear a clean, complete and correct uniform.', 'Maintain neat personal grooming and hygiene.', 'Display identification as required.', 'A professional appearance builds trust and authority.'],
  'Time Management': ['Arrive early and be ready for duty.', 'Plan patrols and tasks efficiently.', 'Prioritise urgent duties without neglecting routine ones.', 'Manage handovers so nothing is missed.'],
  'Industrial Site Security': ['Understand the specific risks of industrial sites.', 'Control access to hazardous and restricted areas.', 'Enforce safety rules and PPE requirements.', 'Watch for theft, sabotage and safety hazards.'],
  'Hazard Awareness': ['Identify physical, chemical and environmental hazards.', 'Report and help control hazards to prevent harm.', 'Follow health and safety signage and procedures.', 'Wear appropriate protective equipment.'],
  'Perimeter Security': ['Fences, lighting and barriers form the first line of defence.', 'Patrol and inspect the boundary for breaches.', 'Report damage or weaknesses promptly.', 'Support perimeter protection with CCTV and alarms.'],
  'Customer-Facing Security': ['Balance security with good customer service.', 'Be approachable, helpful and professional.', 'Give clear directions and assistance.', 'Handle the public firmly but courteously.'],
  'Handling Complaints': ['Listen calmly and let the person explain.', 'Show empathy and do not take it personally.', 'Resolve within your authority or escalate appropriately.', 'Record the complaint and any action taken.'],
  'Leadership in Security': ['Lead by example and set the standard for the team.', 'Communicate goals and expectations clearly.', 'Support, motivate and develop your officers.', 'Make sound decisions under pressure.'],
  'Supervisor Responsibilities': ['Plan, organise and oversee security operations.', 'Deploy and manage officers effectively.', 'Ensure compliance with procedures and standards.', 'Handle escalated incidents and report to management.'],
  'Identifying Risks': ['Systematically identify threats and vulnerabilities.', 'Assess likelihood and potential impact.', 'Prioritise risks to focus resources.', 'Recommend controls to reduce risk.'],
  'Security Planning': ['Develop plans based on risk assessment.', 'Define post orders, patrols and emergency procedures.', 'Allocate resources and responsibilities.', 'Review and update plans regularly.'],
  'Corrective Action Procedures': ['Address performance and conduct issues fairly and consistently.', 'Follow the disciplinary process and document each step.', 'Focus on correction and improvement.', 'Escalate serious matters appropriately.'],
  'Conduct Standards': ['Set and enforce clear standards of behaviour.', 'Apply rules consistently to all team members.', 'Model professional conduct yourself.', 'Address breaches promptly and fairly.'],
  'Crisis Response Leadership': ['Stay calm and take clear command in a crisis.', 'Assess the situation and prioritise safety of life.', 'Coordinate the team and emergency services.', 'Communicate clearly and review after the event.'],
  'Incident Command': ['Establish who is in charge and the chain of command.', 'Assess, plan and direct the response.', 'Coordinate resources and communications.', 'Keep records and produce an after-action report.'],
  'Regulatory Compliance': ['Know and follow all relevant laws and regulations.', 'Ensure licensing and training requirements are met.', 'Maintain accurate records for audits.', 'Address non-compliance quickly.'],
  'Ethical Standards': ['Act with integrity, honesty and fairness.', 'Respect rights, privacy and confidentiality.', 'Avoid conflicts of interest and corruption.', 'Uphold the reputation of the profession.'],
  'First-Line Supervision': ['Supervise officers directly on the ground.', 'Brief the team and assign duties.', 'Monitor performance and provide guidance.', 'Be the first point of contact for issues.'],
  'Shift Management': ['Plan coverage and manage handovers.', 'Ensure posts are manned and equipped.', 'Monitor attendance and welfare.', 'Keep accurate shift records.'],
  'Leading a Security Team': ['Set clear objectives and expectations.', 'Communicate, delegate and support the team.', 'Resolve conflicts and build teamwork.', 'Recognise good performance.'],
  'Motivation and Discipline': ['Motivate through recognition and fair treatment.', 'Set clear standards and lead by example.', 'Apply discipline fairly and consistently.', 'Address problems early and constructively.'],
  'Incident Reporting for Supervisors': ['Ensure incidents are reported accurately and promptly.', 'Review and verify officers\' reports.', 'Escalate serious incidents to management.', 'Maintain complete records for follow-up.'],
  'Escalation Procedures': ['Know when and how to escalate an incident.', 'Follow the chain of command.', 'Provide clear, factual information when escalating.', 'Ensure timely response to serious matters.'],
  'Supervising Access Points': ['Oversee gate and entry-point operations.', 'Ensure officers verify identity and authorisation.', 'Monitor for tailgating and breaches.', 'Maintain accurate access records.'],
  'Visitor Management for Supervisors': ['Ensure visitor procedures are followed consistently.', 'Audit visitor logs and passes.', 'Handle VIP and contractor access appropriately.', 'Train officers on visitor handling.'],
  'Professional Conduct': ['Maintain professionalism as a role model.', 'Enforce standards of appearance and behaviour.', 'Act ethically and lawfully.', 'Represent the organisation positively.'],
  'Quality Assurance': ['Monitor and evaluate the quality of security services.', 'Conduct inspections and spot checks.', 'Identify gaps and drive improvement.', 'Document findings and corrective actions.'],
  'Assessment Instructions': ['Read all instructions carefully before you begin.', 'Understand the pass mark and time limits.', 'Answer honestly based on your knowledge and experience.', 'Ask if anything is unclear before starting.'],
  'What to Expect': ['The assessment tests your existing security knowledge.', 'It includes a knowledge quiz and practical scenarios.', 'It is designed for experienced officers, not beginners.', 'Passing leads to your CSO-1 certificate.']
};

function buildTopicLesson(title, topic) {
  const points = SECURITY_LESSONS[title];
  let body = '<h2>' + escapeHtml(title) + '</h2>';
  if (points && points.length) {
    body += '<p>This lesson covers the key knowledge and skills for <strong>' + escapeHtml(title.toLowerCase()) + '</strong> as part of your ' + escapeHtml(topic) + ' training.</p>';
    body += '<h3>Key Points</h3><ul style="line-height:2;">';
    points.forEach(p => { body += '<li>' + escapeHtml(p) + '</li>'; });
    body += '</ul>';
    body += '<div class="highlight-box">💡 Apply this knowledge on the job and follow your site\'s standard operating procedures and the PSRA standards.</div>';
    return { title: title, content: body };
  }
  return null;
}



// ===== TVET COURSE RENDERING =====
function openTVETCourse(slug) {
  currentTVETSlug = slug;
  navigate('course-view');
}

function loadTVETCourseContent() {
  if (!window.NEW_COURSES || !currentTVETSlug) return;
  const course = window.NEW_COURSES[currentTVETSlug];
  if (!course) return;

  const el = document.getElementById('page-course-view');
  if (!el) return;

  // Build the course page dynamically
  let html = '<section class="page-header"><h1>' + escapeHtml(course.name) + '</h1>';
  html += '<p>' + escapeHtml(course.desc) + '</p></section>';
  html += '<section class="course-detail"><div class="container">';
  
  // Course overview
  html += '<div class="course-overview">';
  html += '<div class="course-badge-row">';
  html += '<span class="badge badge-new">' + course.icon + ' ' + escapeHtml(course.cat) + '</span>';
  html += '<span class="level-' + (course.lvlLabel || 'beginner').toLowerCase() + '">' + escapeHtml(course.lvlLabel || 'Beginner') + '</span>';
  html += '<span class="course-price ' + (course.price === 'Free' ? 'free' : '') + '">' + escapeHtml(course.price || 'Free') + '</span>';
  html += '</div>';
  html += '<div class="course-meta"><span>' + course.unitCount + ' Competency Units</span><span>' + course.totalHours + ' Total Hours</span><span>Certificate: ' + escapeHtml(course.cert || '') + '</span></div>';
  html += '<p style="margin-top:8px;font-size:13px;color:#666;">' + escapeHtml(course.certFull || '') + '</p>';
  html += '</div>';

  // Enroll button
  const enrolled = getEnrolled();
  const isEnrolled = enrolled.includes(course.name);
  html += '<div class="course-actions" style="margin:16px 0;">';
  if (isEnrolled) {
    html += '<button class="btn btn-primary enrolled" disabled>✓ Enrolled</button>';
  } else {
    html += '<button class="btn btn-primary" onclick="enrollTVETCourse(\'' + currentTVETSlug + '\')">Enroll Now — Free</button>';
  }
  html += '<button class="btn btn-outline btn-sm" onclick="navigate(\'courses\')">← Back to Courses</button>';
  html += '</div>';

  // Tabs
  html += '<div class="course-tabs"><div class="tab active" onclick="switchTVETTab(event,\'tvet-overview\')">Overview</div>';
  html += '<div class="tab" onclick="switchTVETTab(event,\'tvet-curriculum\')">Curriculum</div>';
  html += '<div class="tab" onclick="switchTVETTab(event,\'tvet-quizzes\')">Quizzes</div>';
  html += '<div class="tab" onclick="switchTVETTab(event,\'tvet-review\')">Review</div>';
  html += '<div class="tab" onclick="switchTVETTab(event,\'tvet-certificate\')">Certificate</div></div>';

  // Overview tab
  html += tvetOverviewHtml(course);

  // Curriculum tab
  html += '<div class="tab-content" id="tvet-curriculum">';
  html += '<div id="tvet-curriculum-content">';
  course.modules.forEach(function(mod, mi) {
    const isGate = mod.title.includes('GATE');
    const isFinal = mod.title.includes('FINAL');
    html += '<div class="curriculum-module ' + (isGate ? 'gate-module' : '') + (isFinal ? ' final-module' : '') + '">';
    html += '<div class="module-header" onclick="toggleModule(this)">' + escapeHtml(mod.title) + ' <span class="arrow">▼</span></div>';
    html += '<div class="module-body">';
    mod.lessons.forEach(function(les, li) {
      const typeClass = les.type === 'quiz' ? 'quiz' : les.type === 'gate' ? 'gate' : '';
      const typeLabel = les.type === 'quiz' ? 'Quiz (' + les.questions + 'Q)' : les.type === 'gate' ? '🔒 GATE' : '📖 Unit';
      html += '<div class="curriculum-lesson">';
      if (les.type === 'quiz') {
        html += '<span class="lesson-title" onclick="startTVETQuiz(\'' + currentTVETSlug + '\',' + mi + ',' + li + ')">' + escapeHtml(les.title) + '</span>';
      } else if (les.type === 'gate') {
        html += '<span class="lesson-title" onclick="showToast(\'✓ Access granted — All levels are unlocked!\')">' + escapeHtml(les.title) + '</span>';
      } else {
        html += '<span class="lesson-title" onclick="startTVETLesson(\'' + currentTVETSlug + '\',' + mi + ',' + li + ')">' + escapeHtml(les.title) + '</span>';
      }
      html += '<span class="lesson-type ' + typeClass + '">' + typeLabel + '</span>';
      html += '<span class="lesson-duration">' + escapeHtml(les.duration) + '</span>';
      html += '</div>';
    });
    html += '</div></div>';
  });
  html += '</div></div>';

  // Quizzes tab
  html += '<div class="tab-content" id="tvet-quizzes"><div id="tvet-quiz-list">';
  course.modules.forEach(function(mod, mi) {
    mod.lessons.forEach(function(les, li) {
      if (les.type === 'quiz') {
        html += '<div class="course-list-item" style="cursor:pointer;" onclick="startTVETQuiz(\'' + currentTVETSlug + '\',' + mi + ',' + li + ')">';
        html += '<span class="cl-name">' + escapeHtml(les.title) + ' — ' + les.questions + ' Questions</span>';
        html += '<button class="btn btn-sm btn-primary">Start Quiz</button>';
        html += '</div>';
      }
    });
  });
  html += '</div></div>';

  // Review tab (learning summary) + Certificate tab
  html += tvetReviewHtml(course);
  html += tvetCertHtml(course, currentTVETSlug);

  html += '</div></section>';
  el.innerHTML = html;
}

function switchTVETTab(e, tabId) {
  var header = e.target.parentElement;
  if (header) header.querySelectorAll('.tab').forEach(function(t){ t.classList.remove('active'); });
  e.target.classList.add('active');
  var pane = document.getElementById(tabId);
  if (!pane) return;
  var parent = pane.parentElement;
  parent.querySelectorAll('.tab-content').forEach(function(tc){ tc.classList.remove('active'); });
  pane.classList.add('active');
}

function tvetLearningObjectives(course) {
  var objs = [];
  (course.modules || []).forEach(function(mod) {
    var t = mod.title || '';
    if (/GATE|FINAL/.test(t)) return;
    // strip leading "Unit N:" / numbering for a clean objective line
    var clean = t.replace(/^\s*(Module|Unit|Competency Unit)\s*\d+\s*[:\-\.]?\s*/i, '').trim();
    if (clean) objs.push(clean);
  });
  return objs;
}

function tvetOverviewHtml(course) {
  var objs = tvetLearningObjectives(course);
  var h = '<div class="tab-content active" id="tvet-overview">';
  h += '<p>' + escapeHtml(course.desc || '') + '</p>';
  h += '<div class="course-meta" style="margin:10px 0;"><span>Category: ' + escapeHtml(course.cat || '') + '</span>'
     + '<span>Level: ' + escapeHtml(course.lvlLabel || 'Beginner') + '</span>'
     + '<span>' + (course.unitCount || objs.length) + ' Competency Units</span>'
     + '<span>' + escapeHtml(String(course.totalHours || '')) + ' Total Hours</span></div>';
  if (objs.length) {
    h += '<h4 style="margin:14px 0 6px;">What you will cover</h4><ul style="margin:0 0 10px 18px;">';
    objs.slice(0, 14).forEach(function(o){ h += '<li>' + escapeHtml(o) + '</li>'; });
    h += '</ul>';
  }
  h += '<h4 style="margin:14px 0 6px;">How this course works</h4><ul style="margin:0 0 10px 18px;">'
     + '<li>Self-paced study of each competency unit.</li>'
     + '<li>End-of-unit quizzes to check your understanding.</li>'
     + '<li>A final assessment drawn from the full course.</li>'
     + '<li>A Creator Hub certificate of completion when you finish.</li></ul>';
  h += '<div style="background:#FFF8E6;border:1px solid #F2C94C;border-radius:8px;padding:10px 12px;font-size:13px;color:#7A5C00;margin-top:8px;">'
     + '<strong>Please note:</strong> This is '+escapeHtml(window.CHCN_BRAND||'Creator Hub Creator Network')+' educational content and a certificate of completion. It is not, by itself, an official HEART/NSTA or government qualification. Where a nationally recognised certificate is required, you must complete the relevant accredited assessment.'
     + '</div></div>';
  return h;
}

function tvetReviewHtml(course) {
  var objs = tvetLearningObjectives(course);
  var h = '<div class="tab-content" id="tvet-review">';
  h += '<h4 style="margin:0 0 6px;">Course review \u2013 key points</h4>';
  h += '<p style="font-size:13px;color:#667085;">Use this checklist to revise before your final assessment.</p>';
  if (objs.length) {
    h += '<ul style="margin:0 0 10px 18px;">';
    objs.forEach(function(o){ h += '<li>' + escapeHtml(o) + '</li>'; });
    h += '</ul>';
  }
  h += '<h4 style="margin:12px 0 6px;">Before you take the final</h4><ul style="margin:0 0 10px 18px;">'
     + '<li>Complete every unit quiz at least once.</li>'
     + '<li>Re-read any unit where you scored below 70%.</li>'
     + '<li>Make sure you understand the terms used in each unit.</li></ul>';
  h += '</div>';
  return h;
}

function tvetCertHtml(course, slug) {
  var prog = getProgress()[course.name] || null;
  var done = prog ? prog.completed : 0;
  var total = prog ? prog.total : 0;
  var pct = total ? Math.round(done / total * 100) : 0;
  var eligible = total > 0 && done >= total;
  var user = getUser();
  var learner = user && user.name ? user.name : '';
  var h = '<div class="tab-content" id="tvet-certificate">';
  if (!getEnrolled().includes(course.name)) {
    h += '<p>Enroll in this course to work toward your certificate.</p></div>';
    return h;
  }
  if (!eligible) {
    h += '<p><strong>Certificate locked.</strong> Complete all course units to unlock your certificate of completion.</p>';
    h += '<div style="background:#eee;border-radius:8px;height:14px;overflow:hidden;margin:8px 0;"><div style="background:#4CAF50;height:100%;width:' + pct + '%;"></div></div>';
    h += '<p style="font-size:13px;color:#667085;">Progress: ' + done + ' / ' + (total||'?') + ' units (' + pct + '%).</p></div>';
    return h;
  }
  var cid = 'CHCN-' + String(slug).toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8) + '-' + (user && user.email ? user.email.replace(/[^A-Za-z0-9]/g,'').slice(0,6).toUpperCase() : 'LEARNER');
  h += '<div class="chcn-cert" style="border:3px solid #C9A227;border-radius:12px;padding:20px;text-align:center;background:#FFFDF5;">';
  h += '<div style="font-size:13px;letter-spacing:2px;color:#C9A227;">CERTIFICATE OF COMPLETION</div>';
  h += '<h2 style="margin:10px 0;">'+escapeHtml(window.CHCN_BRAND||'Creator Hub Creator Network')+'</h2>';
  h += '<p>This certifies that</p><h3 style="margin:6px 0;">' + escapeHtml(learner || '____________________') + '</h3>';
  h += '<p>has completed the course</p><h4 style="margin:6px 0;">' + escapeHtml(course.name) + '</h4>';
  h += '<p style="font-size:13px;color:#555;">' + escapeHtml(course.certFull || course.cert || '') + '</p>';
  h += '<p style="font-size:12px;color:#888;margin-top:10px;">Certificate ID: ' + cid + ' \u2022 Issued ' + new Date().toLocaleDateString() + '</p>';
  h += '<p style="font-size:11px;color:#999;">This is a certificate of completion of Creator Hub educational content. It is not, by itself, an official HEART/NSTA or government qualification.</p>';
  h += '</div>';
  h += '<div class="course-actions" style="margin-top:12px;"><button class="btn btn-primary btn-sm" onclick="window.print()">Print / Save PDF</button></div>';
  h += '</div>';
  return h;
}

// Validates that every TVET course has the required structure and content.
function auditCourses() {
  var issues = [], info = [];
  var courses = window.NEW_COURSES || {};
  var slugs = Object.keys(courses);
  info.push('TVET courses: ' + slugs.length);
  slugs.forEach(function(slug) {
    var c = courses[slug];
    if (!c) { issues.push(slug + ': missing object'); return; }
    ['name','cat','desc','cert'].forEach(function(f){ if (!c[f]) issues.push(slug + ': missing ' + f); });
    if (!Array.isArray(c.modules) || !c.modules.length) { issues.push(slug + ': no modules'); return; }
    var lessons = 0, quizzes = 0;
    c.modules.forEach(function(m){ (m.lessons||[]).forEach(function(l){ lessons++; if (l.type==='quiz') quizzes++; }); });
    if (lessons < 3) issues.push(slug + ': too few lessons (' + lessons + ')');
    if (quizzes < 1) issues.push(slug + ': no quiz lessons');
    var qpool = (window.NEW_QUIZZES && window.NEW_QUIZZES[slug]) ? window.NEW_QUIZZES[slug] : [];
    if (!qpool.length) issues.push(slug + ': no quiz question pool');
    qpool.forEach(function(q, i){
      if (!q.q || !Array.isArray(q.opts) || q.opts.length !== 4 || typeof q.ans !== 'number' || q.ans < 0 || q.ans > 3) {
        issues.push(slug + ': malformed question #' + i);
      }
    });
  });
  var rep = { pass: issues.length === 0, issues: issues, info: info };
  console.log('[auditCourses]', rep);
  return rep;
}

function enrollTVETCourse(slug) {
  if (!getUser()) { openModal('signupModal'); showToast('Please sign up or sign in first', true); return; }
  const course = window.NEW_COURSES[slug];
  if (!course) return;
  const enrolled = getEnrolled();
  if (!enrolled.includes(course.name)) {
    enrolled.push(course.name);
    setEnrolled(enrolled);
  }
  // Re-render to show enrolled state
  loadTVETCourseContent();
  showToast('Enrolled in ' + course.name + '!');
}

function startTVETLesson(slug, moduleIdx, lessonIdx) {
  const course = window.NEW_COURSES[slug];
  if (!course) return;
  const lesson = course.modules[moduleIdx].lessons[lessonIdx];

  navigate('lesson');
  document.getElementById('lesson-page-title').textContent = lesson.title;
  document.getElementById('lesson-page-subtitle').textContent = course.name + ' — ' + course.modules[moduleIdx].title;

  // Build flat lesson list for prev/next
  const flat = [];
  course.modules.forEach(function(m, mi) { m.lessons.forEach(function(l, li) { flat.push({ mi: mi, li: li }); }); });
  const pos = flat.findIndex(function(f) { return f.mi === moduleIdx && f.li === lessonIdx; });
  const prev = pos > 0 ? flat[pos - 1] : null;
  const next = pos < flat.length - 1 ? flat[pos + 1] : null;

  // Use course-integrity.js buildTopicLesson for content generation
  var content = { content: '<p>Lesson content for this competency unit.</p>' };
  if (typeof buildTopicLesson === 'function') {
    var built = buildTopicLesson(lesson.title, course.cat);
    if (built && built.content) content = built;
  }

  let html = '<div class="lesson-viewer-header"><h3>' + escapeHtml(lesson.title) + '</h3>';
  html += '<button class="lesson-nav-btn" onclick="openTVETCourse(\'' + slug + '\')">← Back to Course</button></div>';
  html += '<div class="lesson-position">Lesson ' + (pos + 1) + ' of ' + flat.length + '</div>';
  html += '<div class="lesson-viewer-body">' + content.content + '</div>';
  html += '<div class="lesson-viewer-footer">';
  if (prev) {
    html += '<button class="lesson-nav-btn prev" onclick="startTVETLesson(\'' + slug + '\',' + prev.mi + ',' + prev.li + ')">← Previous</button>';
  }
  html += '<button class="lesson-complete-btn" onclick="completeTVETLesson(\'' + slug + '\',' + moduleIdx + ',' + lessonIdx + ')">✓ Mark as Complete</button>';
  if (next) {
    html += '<button class="lesson-nav-btn next" onclick="startTVETLesson(\'' + slug + '\',' + next.mi + ',' + next.li + ')">Next →</button>';
  }
  html += '</div>';

  document.getElementById('lesson-viewer-content').innerHTML = html;
}

function completeTVETLesson(slug, moduleIdx, lessonIdx) {
  const course = window.NEW_COURSES[slug];
  if (!course) return;
  const lesson = course.modules[moduleIdx].lessons[lessonIdx];
  const prog = getProgress();
  if (!prog[course.name]) {
    let total = 0;
    course.modules.forEach(function(m) { m.lessons.forEach(function(l) { if (l.type !== 'gate') total++; }); });
    prog[course.name] = { completed: 0, total: total, lessons: [] };
  }
  if (!prog[course.name].lessons.includes(lesson.title)) {
    prog[course.name].completed++;
    prog[course.name].lessons.push(lesson.title);
    setProgress(prog);
  }
  showToast('Lesson completed! ✓');
  openTVETCourse(slug);
}

function startTVETQuiz(slug, moduleIdx, lessonIdx) {
  const course = window.NEW_COURSES[slug];
  if (!course) return;
  const lesson = course.modules[moduleIdx].lessons[lessonIdx];

  // Get quiz questions from NEW_QUIZZES if available
  var questions = [];
  if (window.NEW_QUIZZES && window.NEW_QUIZZES[slug]) {
    questions = shuffle(window.NEW_QUIZZES[slug]).slice(0, Math.min(lesson.questions || 10, window.NEW_QUIZZES[slug].length));
  }
  if (questions.length === 0) {
    showToast('Quiz questions are being prepared for this course.', true);
    return;
  }

  navigate('quiz');
  document.getElementById('quiz-page-title').textContent = lesson.title;
  document.getElementById('quiz-page-subtitle').textContent = course.name + ' — ' + (lesson.questions || questions.length) + ' Questions';

  quizState = {
    questions: questions,
    current: 0,
    answers: new Array(questions.length).fill(-1),
    timer: null,
    timeLeft: Math.max(questions.length * 60, 300),
    courseId: slug,
    moduleIdx: moduleIdx,
    lessonIdx: lessonIdx,
    isFinal: lesson.isFinal || false,
    isTVET: true,
    courseName: course.name,
    cert: course.cert,
    certFull: course.certFull
  };

  renderQuizQuestion();
  startQuizTimer();
}


function getLessonContent(courseId, moduleIdx, lessonIdx) {
  const data = COURSE_DATA[courseId];
  if (!data) return LESSON_CONTENT['default'];
  const lesson = data.modules[moduleIdx].lessons[lessonIdx];
  if (courseId && courseId.indexOf('driver') !== -1) {
    return buildDrivingLesson(lesson.title);
  }
  if (LESSON_CONTENT[lesson.title]) return LESSON_CONTENT[lesson.title];
  const built = buildTopicLesson(lesson.title, 'security');
  if (built) return built;
  return LESSON_CONTENT['default'];
}

function startLesson(courseId, moduleIdx, lessonIdx) {
  const data = COURSE_DATA[courseId];
  if (!data) return;
  const lesson = data.modules[moduleIdx].lessons[lessonIdx];

  if (lesson.type === 'quiz') {
    startQuiz(courseId, moduleIdx, lessonIdx);
    return;
  }

  if (lesson.type === 'gate') {
    // All levels unlocked per user request
    showToast('✓ Access granted — All levels are unlocked!');
    return;
  }

  // Show lesson
  navigate('lesson');
  document.getElementById('lesson-page-title').textContent = lesson.title;
  document.getElementById('lesson-page-subtitle').textContent = data.name + ' — ' + data.modules[moduleIdx].title;

  // Build a flat ordered list of all lessons so we can move prev/next
  const flat = [];
  data.modules.forEach((m, mi) => m.lessons.forEach((l, li) => flat.push({ mi, li })));
  const pos = flat.findIndex(f => f.mi === moduleIdx && f.li === lessonIdx);
  const prev = pos > 0 ? flat[pos - 1] : null;
  const next = pos < flat.length - 1 ? flat[pos + 1] : null;

  const content = getLessonContent(courseId, moduleIdx, lessonIdx);
  let html = '<div class="lesson-viewer-header"><h3>' + escapeHtml(lesson.title) + '</h3>';
  html += '<button class="lesson-nav-btn" onclick="navigate(\'' + courseId + '\')">← Back to Course</button></div>';
  // Position indicator
  html += '<div class="lesson-position">Lesson ' + (pos + 1) + ' of ' + flat.length + '</div>';
  html += '<div class="lesson-viewer-body">' + content.content + '</div>';
  html += '<div class="lesson-viewer-footer">';
  // Previous button (only shown when there is a previous lesson)
  if (prev) {
    html += '<button class="lesson-nav-btn prev" onclick="startLesson(\'' + courseId + '\',' + prev.mi + ',' + prev.li + ')">← Previous</button>';
  }
  html += '<button class="lesson-complete-btn" onclick="completeLesson(\'' + courseId + '\',' + moduleIdx + ',' + lessonIdx + ')">✓ Mark as Complete</button>';
  // Next button (only shown when there is a next lesson)
  if (next) {
    html += '<button class="lesson-nav-btn next" onclick="startLesson(\'' + courseId + '\',' + next.mi + ',' + next.li + ')">Next →</button>';
  }
  html += '</div>';

  document.getElementById('lesson-viewer-content').innerHTML = html;
}

function completeLesson(courseId, moduleIdx, lessonIdx) {
  const data = COURSE_DATA[courseId];
  if (!data) return;
  const lesson = data.modules[moduleIdx].lessons[lessonIdx];
  const prog = getProgress();
  if (!prog[data.name]) {
    let total = 0;
    data.modules.forEach(m => m.lessons.forEach(l => { if (l.type !== 'gate') total++; }));
    prog[data.name] = { completed: 0, total: total, lessons: [] };
  }
  if (!prog[data.name].lessons.includes(lesson.title)) {
    prog[data.name].completed++;
    prog[data.name].lessons.push(lesson.title);
    setProgress(prog);
  }
  showToast('Lesson completed! ✓');
  navigate(courseId);
}

// ===== QUIZ ENGINE WITH TIMER =====
let quizState = { questions: [], current: 0, answers: [], timer: null, timeLeft: 0, courseId: '', moduleIdx: 0, lessonIdx: 0 };
let currentTVETSlug = ''; // Current TVET course slug for navigation

function startQuiz(courseId, moduleIdx, lessonIdx) {
  const data = COURSE_DATA[courseId];
  if (!data) return;
  const lesson = data.modules[moduleIdx].lessons[lessonIdx];

  navigate('quiz');
  document.getElementById('quiz-page-title').textContent = lesson.title;
  document.getElementById('quiz-page-subtitle').textContent = data.name + ' — ' + lesson.questions + ' Questions';

  quizState = {
    questions: generateQuizQuestions(lesson.questions, courseId, data.modules[moduleIdx].title, lesson.isFinal || false),
    current: 0,
    answers: new Array(lesson.questions).fill(-1),
    timer: null,
    timeLeft: parseDuration(lesson.duration),
    courseId: courseId,
    moduleIdx: moduleIdx,
    lessonIdx: lessonIdx,
    isFinal: lesson.isFinal || false
  };

  renderQuizQuestion();
  startQuizTimer();
}

function parseDuration(dur) {
  const match = dur.match(/(\d+)\s*min/i);
  return match ? parseInt(match[1]) * 60 : 300;
}

function startQuizTimer() {
  if (quizState.timer) clearInterval(quizState.timer);
  quizState.timer = setInterval(() => {
    quizState.timeLeft--;
    updateTimerDisplay();
    if (quizState.timeLeft <= 0) {
      clearInterval(quizState.timer);
      submitQuiz();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const el = document.getElementById('quiz-timer-display');
  if (!el) return;
  const mins = Math.floor(quizState.timeLeft / 60);
  const secs = quizState.timeLeft % 60;
  el.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  const timerEl = el.parentElement;
  timerEl.className = 'quiz-timer';
  if (quizState.timeLeft <= 30) timerEl.className = 'quiz-timer danger';
  else if (quizState.timeLeft <= 60) timerEl.className = 'quiz-timer warning';
}

function renderQuizQuestion() {
  const q = quizState.questions[quizState.current];
  if (!q) return;
  const total = quizState.questions.length;
  const letters = ['A', 'B', 'C', 'D'];
  const pct = Math.round(((quizState.current + 1) / total) * 100);

  let html = '<div class="quiz-header"><h3>' + (quizState.isFinal ? '🎓 Final Exam' : 'Quiz') + '</h3><div class="quiz-timer">⏱ <span id="quiz-timer-display">' + formatTime(quizState.timeLeft) + '</span></div></div>';
  html += '<div class="quiz-progress"><div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:' + pct + '%"></div></div><div class="quiz-progress-text">Question ' + (quizState.current + 1) + ' of ' + total + '</div></div>';
  html += '<div class="quiz-body">';
  html += '<div class="quiz-question-num">Question ' + (quizState.current + 1) + '</div>';
  html += '<div class="quiz-question">' + escapeHtml(q.q) + '</div>';
  html += '<div class="quiz-options">';
  q.opts.forEach((opt, i) => {
    const sel = quizState.answers[quizState.current] === i ? ' selected' : '';
    html += '<div class="quiz-option' + sel + '" onclick="selectQuizOption(' + i + ')"><div class="quiz-option-letter">' + letters[i] + '</div><span>' + escapeHtml(opt) + '</span></div>';
  });
  html += '</div></div>';
  html += '<div class="quiz-footer">';
  if (quizState.current !== 0) {
    html += '<button class="quiz-nav-btn prev" onclick="quizPrev()">← Previous</button>';
  }
  html += '<button class="quiz-nav-btn ' + (quizState.current === total - 1 ? 'submit' : 'next') + '" onclick="' + (quizState.current === total - 1 ? 'submitQuiz()' : 'quizNext()') + '">' + (quizState.current === total - 1 ? 'Submit Quiz' : 'Next →') + '</button>';
  html += '</div>';

  document.getElementById('quiz-viewer-content').innerHTML = html;
}

function formatTime(s) {
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

function selectQuizOption(idx) {
  quizState.answers[quizState.current] = idx;
  renderQuizQuestion();
}

function quizNext() {
  if (quizState.current < quizState.questions.length - 1) {
    quizState.current++;
    renderQuizQuestion();
  }
}

function quizPrev() {
  if (quizState.current > 0) {
    quizState.current--;
    renderQuizQuestion();
  }
}

function submitQuiz() {
  if (quizState.timer) clearInterval(quizState.timer);
  let correct = 0;
  quizState.questions.forEach((q, i) => {
    if (quizState.answers[i] === q.ans) correct++;
  });
  const total = quizState.questions.length;
  const pct = Math.round((correct / total) * 100);
  const passed = pct >= 80;
  const data = COURSE_DATA[quizState.courseId];
  const lesson = data.modules[quizState.moduleIdx].lessons[quizState.lessonIdx];

  // Update progress
  const prog = getProgress();
  const pName = quizState.isTVET ? quizState.courseName : (data ? data.name : '');
  if (pName && !prog[pName]) {
    let t = 0;
    const mods = quizState.isTVET ? (window.NEW_COURSES[quizState.courseId] ? window.NEW_COURSES[quizState.courseId].modules : []) : (data ? data.modules : []);
    mods.forEach(m => m.lessons.forEach(l => { if (l.type !== 'gate') t++; }));
    prog[pName] = { completed: 0, total: t, lessons: [] };
  }
  if (pName && !prog[pName].lessons.includes(lesson.title)) {
    prog[pName].completed++;
    prog[pName].lessons.push(lesson.title);
    setProgress(prog);
  }

  // If final exam passed, generate certificate
  if (passed && quizState.isFinal) {
    const certName = quizState.isTVET ? quizState.courseName : (data ? data.name : '');
    const certType = quizState.isTVET ? quizState.cert : (data ? data.cert : '');
    const certFull = quizState.isTVET ? quizState.certFull : (data ? data.certFull : '');
    if (certName) {
      const certs = getCertificates();
      if (!certs.find(c => c.courseId === quizState.courseId)) {
        certs.push({ courseId: quizState.courseId, courseName: certName, certType: certType, certFull: certFull, date: new Date().toLocaleDateString() });
        setCertificates(certs);
      }
    }
  }

  // Render results
  let html = '<div class="quiz-results">';
  html += '<div class="quiz-result-circle ' + (passed ? 'pass' : 'fail') + '">' + pct + '%</div>';
  html += '<h2>' + (passed ? '🎉 Congratulations! You Passed!' : '❌ You Did Not Pass') + '</h2>';
  html += '<p class="quiz-result-msg">' + (passed ? 'You scored ' + pct + '% which meets the 80% pass mark. Excellent work!' : 'You scored ' + pct + '%. You need 80% to pass. Review the material and try again.') + '</p>';
  html += '<div class="quiz-result-stats"><div class="quiz-result-stat"><div class="num">' + correct + '</div><div class="lbl">Correct</div></div><div class="quiz-result-stat"><div class="num">' + (total - correct) + '</div><div class="lbl">Incorrect</div></div><div class="quiz-result-stat"><div class="num">' + pct + '%</div><div class="lbl">Score</div></div></div>';

  // Show answer review
  html += '<div style="margin-top:25px;text-align:left;">';
  html += '<h3 style="font-size:18px;font-weight:700;margin-bottom:15px;">Answer Review</h3>';
  const letters = ['A', 'B', 'C', 'D'];
  quizState.questions.forEach((q, i) => {
    const isCorrect = quizState.answers[i] === q.ans;
    html += '<div style="padding:12px;margin-bottom:8px;border-radius:8px;background:' + (isCorrect ? '#e8f5e9' : '#fdecea') + ';border-left:4px solid ' + (isCorrect ? '#27ae60' : '#e74c3c') + ';">';
    html += '<div style="font-weight:700;font-size:14px;margin-bottom:6px;">Q' + (i + 1) + ': ' + escapeHtml(q.q) + '</div>';
    html += '<div style="font-size:13px;">Your answer: <strong>' + (quizState.answers[i] >= 0 ? letters[quizState.answers[i]] + ' — ' + escapeHtml(q.opts[quizState.answers[i]]) : 'Not answered') + '</strong></div>';
    if (!isCorrect) html += '<div style="font-size:13px;color:#155724;">Correct answer: <strong>' + letters[q.ans] + ' — ' + escapeHtml(q.opts[q.ans]) + '</strong></div>';
    if (q.exp) html += '<div style="font-size:12px;color:#666;margin-top:4px;">💡 ' + escapeHtml(q.exp) + '</div>';
    html += '</div>';
  });
  html += '</div>';

  html += '<div style="margin-top:25px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">';
  html += '<button class="btn btn-primary" onclick="navigate(\'' + quizState.courseId + '\')">← Back to Course</button>';
  if (!passed) html += '<button class="btn btn-outline" onclick="startQuiz(\'' + quizState.courseId + '\',' + quizState.moduleIdx + ',' + quizState.lessonIdx + ')">🔄 Retake Quiz</button>';
  if (passed && quizState.isFinal) html += '<button class="btn" style="background:var(--success);color:#fff;" onclick="generateCertificate(\'' + quizState.courseId + '\')">🎓 View Certificate</button>';
  html += '</div></div>';

  document.getElementById('quiz-viewer-content').innerHTML = html;
}

// ===== CERTIFICATE GENERATOR =====
function generateCertificate(courseId) {
  const data = COURSE_DATA[courseId];
  if (!data) return;
  // Certificate recipient is intentionally editable for every certificate.
  // Leaving the prompt blank keeps the recipient name blank so the certificate can be completed later.
  const enteredName = window.prompt('Enter the certificate recipient name (leave blank to add it later):', '');
  const name = (enteredName || '').trim();
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Create certificate HTML
  const certHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Certificate - ${data.cert}</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Georgia,'Times New Roman',serif;background:#f5f5f5;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;}.cert{background:#fff;border:8px double #c9a84c;padding:50px 60px;max-width:800px;width:100%;text-align:center;position:relative;box-shadow:0 4px 20px rgba(0,0,0,0.15);}.cert::before{content:'';position:absolute;top:15px;left:15px;right:15px;bottom:15px;border:2px solid #c9a84c;pointer-events:none;}.logo{width:80px;height:80px;border-radius:12px;margin:0 auto 15px;overflow:hidden;}.logo img{width:100%;height:100%;object-fit:cover;}.title{font-size:14px;letter-spacing:6px;text-transform:uppercase;color:#888;margin-bottom:5px;}.heading{font-size:36px;font-weight:bold;color:#1a1a2e;margin-bottom:5px;}.cert-type{font-size:20px;color:#c9a84c;font-weight:bold;margin-bottom:25px;}.recipient{font-size:18px;color:#666;margin-bottom:5px;}.name{font-size:32px;font-weight:bold;color:#1a1a2e;margin-bottom:20px;border-bottom:2px solid #c9a84c;display:inline-block;padding-bottom:5px;}.body-text{font-size:15px;color:#555;line-height:1.8;margin:20px 0;}.signatures{display:flex;justify-content:space-around;margin-top:40px;}.sig{text-align:center;}.sig-line{width:180px;border-top:1px solid #333;margin:0 auto 5px;}.sig-name{font-size:14px;font-weight:bold;color:#1a1a2e;}.sig-title{font-size:12px;color:#888;}.date{font-size:13px;color:#888;margin-top:20px;}.cert-id{font-size:11px;color:#aaa;margin-top:10px;}.print-btn{margin-top:30px;background:#1a1a2e;color:#fff;border:none;padding:12px 30px;border-radius:8px;font-size:14px;cursor:pointer;}.print-btn:hover{background:#0f3460;}@media print{.print-btn{display:none;}body{background:#fff;padding:0;}.cert{box-shadow:none;}}</style></head><body><div class="cert"><div class="logo"><img src="icon.png" alt="CHCN"></div><div class="title">Creator Hub Creator Network</div><div class="heading">Certificate of Completion</div><div class="cert-type">${data.cert}</div><div class="recipient">This is to certify that</div><div class="name">${escapeHtml(name)}</div><div class="body-text">has successfully completed the <strong>${escapeHtml(data.name)}</strong> programme and is hereby awarded the designation of<br><strong>${data.certFull}</strong></div><div class="signatures"><div class="sig"><div class="sig-line"></div><div class="sig-name">Ravaun Richards</div><div class="sig-title">Founder & Lead Instructor</div></div><div class="sig"><div class="sig-line"></div><div class="sig-name">Creator Hub Creator Network</div><div class="sig-title">Training Academy</div></div></div><div class="date">Issued: ${date}</div><div class="cert-id">Certificate ID: CHCN-${data.cert}-${Date.now().toString(36).toUpperCase()}</div><button class="print-btn" onclick="window.print()">🖨 Print Certificate</button></div></body></html>`;

  const blob = new Blob([certHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Certificate-' + data.cert + '.html';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Certificate downloaded! Open the file to view and print.');
}

// ===== INTERNAL CLOCK (synced to the device clock) =====
// Reads the device's own system clock via JavaScript's Date object, which
// always reflects the operating-system time. Updates once per second and
// works identically online and offline (no network required).
function updateDeviceClock() {
  const el = document.getElementById('deviceClock');
  if (!el) return;
  const now = new Date();
  let h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12; if (h === 0) h = 12;
  const hh = String(h).padStart(2, '0');
  el.textContent = '\uD83D\uDD52 ' + hh + ':' + m + ':' + s + ' ' + ampm;
}

// ===== PROMOTION AUTO-EXPIRY (internal clock) =====
// Any element carrying a data-promo-expiry="YYYY-MM-DDTHH:MM:SS" attribute
// is automatically hidden once the current date/time passes that moment.
function checkPromoExpiry() {
  const now = new Date();
  document.querySelectorAll('[data-promo-expiry]').forEach(function (el) {
    const raw = el.getAttribute('data-promo-expiry');
    if (!raw) return;
    const expiry = new Date(raw);
    if (isNaN(expiry.getTime())) return; // invalid date, leave as-is
    if (now > expiry) {
      el.style.display = 'none';
      el.setAttribute('aria-hidden', 'true');
    } else {
      // still valid: make sure it is visible (in case it was hidden earlier)
      if (el.style.display === 'none') el.style.display = '';
      el.removeAttribute('aria-hidden');
    }
  });
}

// ===== INIT =====
(function init() {
  updateAuthUI();
  updateDeviceClock();
  setInterval(updateDeviceClock, 1000);
  checkPromoExpiry();
  // Re-check every minute so the promo disappears the moment its date passes,
  // even if the app is left open across the deadline.
  setInterval(checkPromoExpiry, 60000);
  // If returning user, restore enroll buttons
  const enrolled = getEnrolled();
  if (enrolled.length > 0) {
    document.querySelectorAll('.enroll-btn').forEach(b => {
      const id = b.id || '';
      enrolled.forEach(name => {
        if (id.includes('level1') && name.includes('Level 1')) { b.textContent = '✓ Enrolled'; b.classList.add('enrolled'); b.disabled = true; }
        if (id.includes('assessment') && name.includes('Same Day')) { b.textContent = '✓ Enrolled'; b.classList.add('enrolled'); b.disabled = true; }
        if (id.includes('senior') && name.includes('Senior')) { b.textContent = '✓ Enrolled'; b.classList.add('enrolled'); b.disabled = true; }
        if (id.includes('junior') && name.includes('Junior')) { b.textContent = '✓ Enrolled'; b.classList.add('enrolled'); b.disabled = true; }
      });
    });
  }
})();

// ===========================================================
// ===== VOICE INPUT (Web Speech API) =====
// ===========================================================
let voiceRecognition = null;
let voiceTargetId = null;

function stopAllVoiceInput(){
  try{ if(voiceRecognition) voiceRecognition.stop(); }catch(e){}
  voiceRecognition=null; voiceTargetId=null;
  document.querySelectorAll('.listening').forEach(el=>el.classList.remove('listening'));
  if(window.CreatorHubNative && typeof window.CreatorHubNative.stopListening==='function'){ try{window.CreatorHubNative.stopListening();}catch(e){} }
  if(window.__creatorHubStopNativeVoice) try{window.__creatorHubStopNativeVoice();}catch(e){}
}

function startVoiceInput(targetId, btn) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { showToast('Voice input is not supported on this device/browser', true); return; }
  const target = document.getElementById(targetId);
  if (!target) return;

  // Toggle off if already listening on this field
  if (voiceRecognition && voiceTargetId === targetId) {
    voiceRecognition.stop();
    return;
  }
  if (voiceRecognition) { try { voiceRecognition.stop(); } catch(e){} }

  voiceRecognition = new SR();
  voiceTargetId = targetId;
  voiceRecognition.lang = 'en-US';
  voiceRecognition.interimResults = true;
  voiceRecognition.continuous = false;
  const base = target.value ? target.value + ' ' : '';

  if (btn) btn.classList.add('listening');
  showToast('🎤 Listening… speak now');

  voiceRecognition.onresult = function(ev) {
    let txt = '';
    for (let i = 0; i < ev.results.length; i++) txt += ev.results[i][0].transcript;
    target.value = base + txt;
  };
  voiceRecognition.onerror = function(ev) {
    if (ev.error === 'not-allowed') showToast('Microphone permission denied', true);
    else showToast('Voice input error: ' + ev.error, true);
  };
  voiceRecognition.onend = function() {
    if (btn) btn.classList.remove('listening');
    voiceRecognition = null;
    voiceTargetId = null;
  };
  try { voiceRecognition.start(); } catch(e) { showToast('Could not start voice input', true); }
}

// ===========================================================
// ===== PAYMENT PAGE HELPERS =====
// ===========================================================
function copyText(txt, label) {
  const done = () => showToast((label || 'Copied') + ' copied to clipboard');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).then(done).catch(() => fallbackCopy(txt, done));
  } else { fallbackCopy(txt, done); }
}
function fallbackCopy(txt, done) {
  const ta = document.createElement('textarea');
  ta.value = txt; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); done(); } catch(e) {}
  document.body.removeChild(ta);
}
function emailPaymentProof() {
  const u = getUser();
  const fromName = u && u.name ? u.name : 'App User';
  const fromEmail = u && u.email ? u.email : '';
  const subject = 'Payment / Enrollment Confirmation from ' + fromName;
  const body = 'Hello Ravaun,\n\nI have made a bank transfer for course enrollment.\n\nName: ' + fromName + '\nEmail: ' + fromEmail + '\nBank used: \nAmount: \nDate of transfer: \nReference/Receipt #: \n\n(Please attach a photo or screenshot of your transfer receipt to this email.)\n\nThank you.';
  window.location.href = 'mailto:info.creatorhubcreatornetwork@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
}
function whatsappPayment() {
  const txt = encodeURIComponent('Hello, I would like to confirm my course payment / bank transfer.');
  window.location.href = 'https://wa.me/18768875573?text=' + txt;
}

// ===========================================================
// ===== INTERACTIVE MAP (Leaflet + OpenStreetMap) =====
// ===== GPS location, live speedometer, search, saved markers =====
// ===========================================================
let chcnMap = null;
let chcnUserMarker = null;
let chcnWatchId = null;
let chcnAccuracyCircle = null;
let chcnRouteLine = null;
let chcnLastPos = null;
let chcnFollow = true;
let chcnActiveBase = null;

// ===== Offline map tile cache (IndexedDB) =====
// Tiles viewed online are stored on the device and served when offline.
// Online behaviour is unchanged: uncached tiles still load straight from the
// network, and are additionally saved in the background for offline use.
let chcnTileDBp = null;
function chcnTileDB() {
  if (chcnTileDBp) return chcnTileDBp;
  chcnTileDBp = new Promise(function (resolve, reject) {
    try {
      var req = indexedDB.open('chcnOfflineTiles', 1);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains('tiles')) db.createObjectStore('tiles');
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    } catch (e) { reject(e); }
  });
  return chcnTileDBp;
}
function chcnTileGet(key) {
  return chcnTileDB().then(function (db) {
    return new Promise(function (res) {
      try { var t = db.transaction('tiles', 'readonly').objectStore('tiles').get(key); t.onsuccess = function () { res(t.result || null); }; t.onerror = function () { res(null); }; }
      catch (e) { res(null); }
    });
  }).catch(function () { return null; });
}
function chcnTilePut(key, blob) {
  return chcnTileDB().then(function (db) {
    return new Promise(function (res) {
      try { var t = db.transaction('tiles', 'readwrite').objectStore('tiles').put(blob, key); t.onsuccess = function () { res(true); }; t.onerror = function () { res(false); }; }
      catch (e) { res(false); }
    });
  }).catch(function () { return false; });
}
function chcnTileCount() {
  return chcnTileDB().then(function (db) {
    return new Promise(function (res) {
      try { var t = db.transaction('tiles', 'readonly').objectStore('tiles').count(); t.onsuccess = function () { res(t.result || 0); }; t.onerror = function () { res(0); }; }
      catch (e) { res(0); }
    });
  }).catch(function () { return 0; });
}
function chcnTileClear() {
  return chcnTileDB().then(function (db) {
    return new Promise(function (res) {
      try { var t = db.transaction('tiles', 'readwrite').objectStore('tiles').clear(); t.onsuccess = function () { res(true); }; t.onerror = function () { res(false); }; }
      catch (e) { res(false); }
    });
  }).catch(function () { return false; });
}

// Leaflet tile layer that reads/writes the offline cache.
function chcnOfflineTileLayer(urlTemplate, opts, layerId) {
  var Layer = L.TileLayer.extend({
    createTile: function (coords, done) {
      var img = document.createElement('img');
      img.setAttribute('role', 'presentation'); img.alt = '';
      var url = this.getTileUrl(coords);
      var key = layerId + '|' + coords.z + '|' + coords.x + '|' + coords.y;
      chcnTileGet(key).then(function (blob) {
        if (blob) {
          img.onload = function () { done(null, img); };
          img.onerror = function () { done(new Error('tile'), img); };
          img.src = URL.createObjectURL(blob);
        } else {
          img.onload = function () { done(null, img); };
          img.onerror = function () { done(new Error('tile offline'), img); };
          img.src = url;
          if (navigator.onLine) {
            fetch(url, { mode: 'cors' }).then(function (r) { return (r && r.ok) ? r.blob() : null; })
              .then(function (b) { if (b) chcnTilePut(key, b); }).catch(function () {});
          }
        }
      });
      return img;
    }
  });
  var layer = new Layer(urlTemplate, opts);
  layer.options.chcnLayerId = layerId;
  // Release object URLs of tiles Leaflet discards, to avoid memory growth.
  layer.on('tileunload', function (e) {
    try { if (e.tile && e.tile.src && e.tile.src.slice(0, 5) === 'blob:') URL.revokeObjectURL(e.tile.src); } catch (_) {}
  });
  return layer;
}

// Build a tile URL for a specific z/x/y from a layer's template (used for
// pre-downloading, where we need an explicit zoom rather than the map's).
function chcnBuildTileUrl(layer, x, y, z) {
  var tmpl = layer._url;
  var subs = layer.options.subdomains || 'abc';
  var s = subs[Math.abs(x + y) % subs.length];
  return tmpl.replace('{s}', s).replace('{z}', z).replace('{x}', x).replace('{y}', y).replace('{r}', '');
}

// Pre-download the tiles for the currently visible area across a few zoom
// levels so it works with no internet. Capped so downloads stay reasonable.
function chcnDownloadArea() {
  var status = document.getElementById('offlineStatus');
  if (!chcnMap) { showToast('Open the map first', true); return; }
  if (!navigator.onLine) { showToast('You need internet to download maps for offline use', true); return; }
  if (!chcnActiveBase) { showToast('Map layer not ready yet', true); return; }
  var layerId = chcnActiveBase.options.chcnLayerId || 'street';
  var bounds = chcnMap.getBounds();
  var z0 = Math.round(chcnMap.getZoom());
  var CAP = 1500, EXTRA = 2;
  var jobs = [];
  for (var z = z0; z <= Math.min(z0 + EXTRA, 19) && jobs.length < CAP; z++) {
    var max = Math.pow(2, z);
    var nw = chcnMap.project(bounds.getNorthWest(), z).divideBy(256).floor();
    var se = chcnMap.project(bounds.getSouthEast(), z).divideBy(256).floor();
    for (var x = nw.x; x <= se.x && jobs.length < CAP; x++) {
      for (var y = nw.y; y <= se.y && jobs.length < CAP; y++) {
        if (x < 0 || y < 0 || x >= max || y >= max) continue;
        jobs.push({ z: z, x: x, y: y });
      }
    }
  }
  var total = jobs.length, done = 0, saved = 0, idx = 0, CONC = 6;
  if (!total) { if (status) status.textContent = 'Nothing to download for this view.'; return; }
  if (status) status.textContent = 'Downloading ' + total + ' map tiles for offline use\u2026';
  showToast('Saving this area for offline use\u2026');
  function next() {
    if (idx >= jobs.length) return Promise.resolve();
    var job = jobs[idx++];
    var coords = { x: job.x, y: job.y, z: job.z };
    var key = layerId + '|' + job.z + '|' + job.x + '|' + job.y;
    return chcnTileGet(key).then(function (existing) {
      if (existing) return;
      var url = chcnBuildTileUrl(chcnActiveBase, job.x, job.y, job.z);
      return fetch(url, { mode: 'cors' }).then(function (r) { return (r && r.ok) ? r.blob() : null; })
        .then(function (b) { if (b) { saved++; return chcnTilePut(key, b); } });
    }).catch(function () {}).then(function () {
      done++;
      if (status && (done % 10 === 0 || done === total)) status.textContent = 'Saved ' + done + ' / ' + total + ' tiles (' + layerId + ')\u2026';
      return next();
    });
  }
  var runners = [];
  for (var c = 0; c < CONC; c++) runners.push(next());
  Promise.all(runners).then(function () {
    chcnTileCount().then(function (n) {
      if (status) status.textContent = 'Offline map ready: ' + saved + ' new tiles saved, ' + n + ' stored in total. This area now works without internet.';
    });
    showToast('Area saved for offline use');
  });
}

function chcnClearOffline() {
  var status = document.getElementById('offlineStatus');
  chcnTileClear().then(function () {
    if (status) status.textContent = 'Offline map storage cleared.';
    showToast('Offline maps cleared');
  });
}

function chcnRefreshOfflineStatus() {
  var status = document.getElementById('offlineStatus');
  if (!status) return;
  chcnTileCount().then(function (n) {
    var net = navigator.onLine ? 'Online' : 'Offline';
    status.textContent = net + ' \u00B7 ' + n + ' map tiles stored on this device' + (n ? ' (viewed areas work offline).' : '. Tap \u201cSave area offline\u201d to store the current view.');
  });
}

// ===== Navigation extras (compass, recenter, share, measure) — all offline =====
let chcnMeasureOn = false;
let chcnMeasurePts = [];
let chcnMeasureLine = null;
let chcnMeasureMarkers = [];
let chcnCompassOn = false;

// Re-centre on the live position and resume real-time following.
function chcnRecenter() {
  if (!chcnMap) return;
  chcnFollow = true;
  if (chcnUserMarker) {
    chcnMap.setView(chcnUserMarker.getLatLng(), Math.max(chcnMap.getZoom(), 16), { animate: true });
    showToast('Following your live location');
  } else {
    locateMe();
  }
}

// Share or copy the current coordinates.
function chcnShareLocation() {
  var ll = chcnUserMarker ? chcnUserMarker.getLatLng() : (chcnLastPos ? { lat: chcnLastPos.lat, lng: chcnLastPos.lng } : (chcnMap ? chcnMap.getCenter() : null));
  if (!ll) { showToast('No location yet \u2014 tap Locate Me first', true); return; }
  var lat = Number(ll.lat).toFixed(6), lng = Number(ll.lng).toFixed(6);
  var geo = 'https://www.google.com/maps?q=' + lat + ',' + lng;
  var text = 'My location: ' + lat + ', ' + lng + '  ' + geo;
  if (navigator.share) {
    navigator.share({ title: 'My location', text: text, url: geo }).catch(function () {});
    return;
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () { showToast('Location copied to clipboard'); }, function () { showToast(text); });
  } else { showToast(text); }
}

// Live compass heading from the device orientation sensor (offline).
function chcnToggleCompass(btn) {
  var out = document.getElementById('headingValue');
  if (chcnCompassOn) {
    chcnCompassOn = false;
    window.removeEventListener('deviceorientationabsolute', chcnHeadingHandler, true);
    window.removeEventListener('deviceorientation', chcnHeadingHandler, true);
    if (out) out.textContent = '--';
    if (btn) btn.classList.remove('btn-primary');
    showToast('Compass off');
    return;
  }
  function begin() {
    chcnCompassOn = true;
    window.addEventListener('deviceorientationabsolute', chcnHeadingHandler, true);
    window.addEventListener('deviceorientation', chcnHeadingHandler, true);
    if (btn) btn.classList.add('btn-primary');
    showToast('Compass on');
  }
  // iOS 13+ requires an explicit permission request from a user gesture.
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission().then(function (state) {
      if (state === 'granted') begin(); else showToast('Compass permission denied', true);
    }).catch(function () { showToast('Compass not available', true); });
  } else if (typeof DeviceOrientationEvent !== 'undefined' || 'ondeviceorientation' in window) {
    begin();
  } else {
    showToast('This device has no compass sensor', true);
  }
}
function chcnHeadingHandler(e) {
  var out = document.getElementById('headingValue');
  if (!out) return;
  var deg = null;
  if (typeof e.webkitCompassHeading === 'number') deg = e.webkitCompassHeading; // iOS: already true-north heading
  else if (typeof e.alpha === 'number') deg = 360 - e.alpha; // convert to compass heading
  if (deg === null || isNaN(deg)) { out.textContent = '--'; return; }
  deg = (deg % 360 + 360) % 360;
  var dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  var card = dirs[Math.round(deg / 45) % 8];
  out.textContent = Math.round(deg) + '\u00B0 ' + card;
}

// Offline distance measuring: tap points on the map to build a path.
function chcnToggleMeasure(btn) {
  if (!chcnMap) { showToast('Open the map first', true); return; }
  chcnMeasureOn = !chcnMeasureOn;
  var status = document.getElementById('offlineStatus');
  if (chcnMeasureOn) {
    chcnMap.on('click', chcnMeasureClick);
    if (btn) { btn.classList.add('btn-primary'); btn.textContent = '\uD83D\uDCCF Measuring\u2026 tap map'; }
    showToast('Measure: tap points on the map. Tap the button again to finish.');
  } else {
    chcnMap.off('click', chcnMeasureClick);
    if (btn) { btn.classList.remove('btn-primary'); btn.textContent = '\uD83D\uDCCF Measure'; }
    chcnClearMeasure();
    if (status) chcnRefreshOfflineStatus();
  }
}
function chcnMeasureClick(e) {
  chcnMeasurePts.push(e.latlng);
  var m = L.circleMarker(e.latlng, { radius: 4, color: '#dc2626', fillOpacity: 1 }).addTo(chcnMap);
  chcnMeasureMarkers.push(m);
  if (chcnMeasureLine) chcnMap.removeLayer(chcnMeasureLine);
  chcnMeasureLine = L.polyline(chcnMeasurePts, { color: '#dc2626', weight: 3, dashArray: '6,6' }).addTo(chcnMap);
  var total = 0;
  for (var i = 1; i < chcnMeasurePts.length; i++) {
    total += haversine(chcnMeasurePts[i - 1].lat, chcnMeasurePts[i - 1].lng, chcnMeasurePts[i].lat, chcnMeasurePts[i].lng);
  }
  var status = document.getElementById('offlineStatus');
  var txt = total >= 1000 ? (total / 1000).toFixed(2) + ' km' : Math.round(total) + ' m';
  if (status) status.textContent = 'Distance: ' + txt + '  (' + chcnMeasurePts.length + ' points \u2014 tap Measure again to clear)';
}
function chcnClearMeasure() {
  if (chcnMeasureLine) { chcnMap.removeLayer(chcnMeasureLine); chcnMeasureLine = null; }
  chcnMeasureMarkers.forEach(function (m) { try { chcnMap.removeLayer(m); } catch (e) {} });
  chcnMeasureMarkers = [];
  chcnMeasurePts = [];
}

// ===== Offline search of your saved places =====
function chcnSearchSaved() {
  if (!chcnMap) { initMap(); }
  if (!chcnMap) { showToast('Map is not ready yet', true); return; }
  var inp = document.getElementById('mapSearchInput');
  var q = (inp && inp.value ? inp.value : '').trim().toLowerCase();
  var saved = [];
  try { saved = JSON.parse(localStorage.getItem('chcn_markers') || '[]'); } catch (e) { saved = []; }
  if (!Array.isArray(saved) || !saved.length) { showToast('You have no saved places yet \u2014 use \u2b50 Save Place first', true); return; }
  var matches = q ? saved.filter(function (s) { return String(s.name || '').toLowerCase().indexOf(q) !== -1; }) : saved;
  if (!matches.length) { showToast('No saved place matches \u201c' + q + '\u201d', true); return; }
  var m = matches[0];
  var lat = Number(m.lat), lng = Number(m.lng);
  if (!isFinite(lat) || !isFinite(lng)) { showToast('That saved place has no valid location', true); return; }
  chcnFollow = false;
  chcnMap.setView([lat, lng], 16, { animate: true });
  L.popup().setLatLng([lat, lng]).setContent('<strong>' + escapeHtml(String(m.name || 'Saved place')) + '</strong>').openOn(chcnMap);
  var status = document.getElementById('offlineStatus');
  if (status) status.textContent = 'Saved place: ' + (m.name || 'Saved place') + (matches.length > 1 ? ' (+' + (matches.length - 1) + ' more match)' : '') + ' \u2014 saved-place search works offline.';
}

// ===== Address lookup (reverse geocoding) \u2014 needs internet =====
function chcnWhereAmI() {
  var ll = chcnUserMarker ? chcnUserMarker.getLatLng() : (chcnLastPos ? { lat: chcnLastPos.lat, lng: chcnLastPos.lng } : null);
  if (!ll) { showToast('Get your GPS location first (\uD83D\uDCCD Locate Me)', true); return; }
  if (!navigator.onLine) { showToast('Address lookup needs an internet connection', true); return; }
  var status = document.getElementById('offlineStatus');
  if (status) status.textContent = 'Looking up your address\u2026';
  var ctl = new AbortController();
  var to = setTimeout(function () { ctl.abort(); }, 12000);
  fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + ll.lat + '&lon=' + ll.lng, { signal: ctl.signal, headers: { 'Accept': 'application/json' } })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (d) {
      var name = (d && d.display_name) ? d.display_name : 'Address not found for this spot';
      if (chcnUserMarker) chcnUserMarker.bindPopup(escapeHtml(name)).openPopup();
      if (status) status.textContent = 'You are near: ' + name;
    })
    .catch(function (err) { showToast(err && err.name === 'AbortError' ? 'Address lookup timed out' : 'Address lookup failed \u2014 internet required', true); })
    .finally(function () { clearTimeout(to); });
}

// ===== Turn-by-turn driving directions + voice guidance \u2014 needs internet =====
// Geocodes the destination (Nominatim) then routes with the public OSRM demo
// server. Both are free best-effort services and require an internet
// connection; on failure the app says so rather than showing a dead result.
let chcnRouteLayer = null;
let chcnRouteDestMarker = null;
let chcnRouteSteps = [];
function chcnToggleDirections() {
  var box = document.getElementById('dirBox');
  if (!box) return;
  box.hidden = !box.hidden;
  if (!box.hidden) { var d = document.getElementById('dirDest'); if (d) d.focus(); }
}
function chcnGetDirections() {
  var status = document.getElementById('dirStatus');
  var destEl = document.getElementById('dirDest');
  var dest = destEl ? destEl.value.trim() : '';
  if (!chcnMap) { showToast('Open the map first', true); return; }
  if (!dest) { showToast('Enter a destination', true); return; }
  var from = chcnUserMarker ? chcnUserMarker.getLatLng() : (chcnLastPos ? { lat: chcnLastPos.lat, lng: chcnLastPos.lng } : null);
  if (!from) { showToast('Get your GPS location first (\uD83D\uDCCD Locate Me)', true); return; }
  if (!navigator.onLine) { showToast('Directions need an internet connection', true); return; }
  if (status) status.textContent = 'Finding \u201c' + dest + '\u201d\u2026';
  var ctl = new AbortController();
  var to = setTimeout(function () { ctl.abort(); }, 15000);
  fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(dest), { signal: ctl.signal, headers: { 'Accept': 'application/json' } })
    .then(function (r) { if (!r.ok) throw new Error('geo'); return r.json(); })
    .then(function (res) {
      if (!res.length) throw new Error('no-dest');
      var dlat = parseFloat(res[0].lat), dlng = parseFloat(res[0].lon);
      if (!isFinite(dlat) || !isFinite(dlng)) throw new Error('no-dest');
      if (status) status.textContent = 'Calculating driving route\u2026';
      var url = 'https://router.project-osrm.org/route/v1/driving/' + from.lng + ',' + from.lat + ';' + dlng + ',' + dlat + '?overview=full&geometries=geojson&steps=true';
      return fetch(url, { signal: ctl.signal }).then(function (r) { if (!r.ok) throw new Error('route'); return r.json(); }).then(function (rt) {
        if (!rt.routes || !rt.routes.length) throw new Error('no-route');
        chcnRenderRoute(rt.routes[0], dlat, dlng, dest);
      });
    })
    .catch(function (err) {
      var msg = 'Directions failed \u2014 internet required or the free routing service is busy. Please try again.';
      if (err && err.name === 'AbortError') msg = 'Directions timed out. Please try again.';
      else if (err && err.message === 'no-dest') msg = 'Destination not found. Try a more specific address.';
      else if (err && err.message === 'no-route') msg = 'No driving route was found to that destination.';
      if (status) status.textContent = msg;
    })
    .finally(function () { clearTimeout(to); });
}
function chcnRenderRoute(route, dlat, dlng, destName) {
  if (chcnRouteLayer) { try { chcnMap.removeLayer(chcnRouteLayer); } catch (e) {} chcnRouteLayer = null; }
  if (chcnRouteDestMarker) { try { chcnMap.removeLayer(chcnRouteDestMarker); } catch (e) {} chcnRouteDestMarker = null; }
  var coords = (route.geometry && route.geometry.coordinates ? route.geometry.coordinates : []).map(function (c) { return [c[1], c[0]]; });
  chcnFollow = false;
  chcnRouteLayer = L.polyline(coords, { color: '#2563eb', weight: 5, opacity: 0.85 }).addTo(chcnMap);
  chcnRouteDestMarker = L.marker([dlat, dlng]).addTo(chcnMap).bindPopup('Destination: ' + escapeHtml(destName));
  try { chcnMap.fitBounds(chcnRouteLayer.getBounds(), { padding: [40, 40] }); } catch (e) {}
  chcnRouteSteps = [];
  (route.legs || []).forEach(function (leg) {
    (leg.steps || []).forEach(function (s) { chcnRouteSteps.push(chcnStepText(s.maneuver || {}, s.name)); });
  });
  if (!chcnRouteSteps.length) chcnRouteSteps.push('Head toward your destination.');
  var km = (route.distance / 1000).toFixed(1), mins = Math.round(route.duration / 60);
  var status = document.getElementById('dirStatus');
  if (status) {
    status.innerHTML = '<strong>' + km + ' km \u00B7 about ' + mins + ' min by car</strong><ol style="margin:6px 0 0 18px;padding:0;text-align:left;">'
      + chcnRouteSteps.map(function (t) { return '<li style="margin:2px 0;">' + escapeHtml(t) + '</li>'; }).join('') + '</ol>';
  }
  var voice = document.getElementById('dirVoice');
  if (voice && voice.checked) chcnSpeakSteps();
}
function chcnStepText(man, road) {
  var type = (man.type || 'continue'), mod = (man.modifier || '');
  var t;
  if (type === 'depart') t = 'Start out';
  else if (type === 'arrive') t = 'Arrive at your destination';
  else if (type === 'roundabout' || type === 'rotary') t = 'Take the roundabout';
  else if (type === 'turn') t = 'Turn ' + mod;
  else if (type === 'new name') t = 'Continue';
  else if (type === 'merge') t = 'Merge ' + mod;
  else if (type === 'fork') t = 'Keep ' + mod;
  else t = type.charAt(0).toUpperCase() + type.slice(1) + (mod ? ' ' + mod : '');
  if (road && type !== 'arrive') t += ' onto ' + road;
  return t.replace(/\s+/g, ' ').trim();
}
// ===== Voice-guided navigation (on-device speech, works offline once loaded) =====
function chcnSpeakSteps() {
  if (!('speechSynthesis' in window)) { showToast('Voice guidance is not supported on this device', true); return; }
  if (!chcnRouteSteps || !chcnRouteSteps.length) { showToast('Get directions first', true); return; }
  try {
    window.speechSynthesis.cancel();
    chcnRouteSteps.forEach(function (t, i) {
      var u = new SpeechSynthesisUtterance((i + 1) + '. ' + t);
      u.rate = 1; u.lang = 'en-US';
      window.speechSynthesis.speak(u);
    });
    showToast('Reading directions aloud');
  } catch (e) { showToast('Voice guidance failed', true); }
}

function initMap() {
  if (typeof L === 'undefined') {
    const el = document.getElementById('mapMain');
    if (el) el.innerHTML = '<div style="padding:24px;text-align:center;color:#a00;">The map library could not load. An internet connection is required the first time the map is opened.</div>';
    return;
  }
  if (chcnMap) { setTimeout(() => chcnMap.invalidateSize(), 200); return; }

  // Point Leaflet at the bundled marker images so pins show offline
  try {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'images/marker-icon-2x.png',
      iconUrl: 'images/marker-icon.png',
      shadowUrl: 'images/marker-shadow.png'
    });
  } catch(e) {}

  // Center on Jamaica by default
  chcnMap = L.map('mapMain', { zoomControl: true }).setView([18.1096, -77.2975], 9);

  const street = chcnOfflineTileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '© OpenStreetMap'
  }, 'street');
  const satellite = chcnOfflineTileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19, attribution: 'Tiles © Esri'
  }, 'sat');
  street.addTo(chcnMap);
  chcnActiveBase = street;
  L.control.layers({ 'Street Map': street, 'Satellite': satellite }).addTo(chcnMap);
  chcnMap.on('baselayerchange', function (e) { if (e && e.layer) chcnActiveBase = e.layer; });

  // Scale bar (metric + imperial) — works offline.
  try { L.control.scale({ metric: true, imperial: true, position: 'bottomleft' }).addTo(chcnMap); } catch (e) {}

  loadSavedMarkers();
  setTimeout(() => chcnMap.invalidateSize(), 200);
  // Desktop/laptop: keep the map correctly sized when the browser window resizes.
  if (!window.__chcnMapResizeBound) {
    window.__chcnMapResizeBound = true;
    window.addEventListener('resize', function () {
      if (chcnMap) { try { chcnMap.invalidateSize(); } catch (e) {} }
    });
  }
  // If the user pans/zooms manually, stop auto-following so we don't fight them.
  chcnMap.on('dragstart', function () { chcnFollow = false; });
  // Keep the offline-storage status line current, online or offline.
  chcnRefreshOfflineStatus();
  if (!window.__chcnNetBound) {
    window.__chcnNetBound = true;
    window.addEventListener('online', chcnRefreshOfflineStatus);
    window.addEventListener('offline', chcnRefreshOfflineStatus);
  }
  // Only auto-start GPS when the user has ALREADY granted location permission,
  // so the map never re-prompts on every visit. Otherwise we wait for a tap on
  // "Locate Me". (chcnMaybeAutoLocate is defined in chcn-completeness.js.)
  if (typeof chcnMaybeAutoLocate === 'function') { chcnMaybeAutoLocate(); }
}

function locateMe() {
  if (!chcnMap) return;
  if (!navigator.geolocation) { showToast('GPS is not available on this device', true); return; }
  showToast('📍 Getting your GPS location…');
  chcnFollow = true; // re-enable live follow when the user asks to locate
  if (chcnWatchId !== null) { navigator.geolocation.clearWatch(chcnWatchId); chcnWatchId = null; }

  chcnWatchId = navigator.geolocation.watchPosition(function(pos) {
    const lat = pos.coords.latitude, lng = pos.coords.longitude;
    const acc = pos.coords.accuracy || 0;
    let speed = pos.coords.speed; // m/s or null

    if (!chcnUserMarker) {
      chcnUserMarker = L.marker([lat, lng]).addTo(chcnMap).bindPopup('You are here');
      chcnMap.setView([lat, lng], 16);
    } else {
      chcnUserMarker.setLatLng([lat, lng]);
      // Real-time follow: keep the live position centred unless the user panned away.
      if (chcnFollow) { chcnMap.panTo([lat, lng], { animate: true }); }
    }
    if (chcnAccuracyCircle) chcnMap.removeLayer(chcnAccuracyCircle);
    chcnAccuracyCircle = L.circle([lat, lng], { radius: acc, color: '#2563eb', fillOpacity: 0.08 }).addTo(chcnMap);

    // Speedometer — fall back to computing from position deltas if speed unavailable
    if (speed === null || isNaN(speed)) {
      if (chcnLastPos) {
        const dt = (pos.timestamp - chcnLastPos.t) / 1000;
        if (dt > 0) { speed = haversine(chcnLastPos.lat, chcnLastPos.lng, lat, lng) / dt; }
      }
    }
    chcnLastPos = { lat: lat, lng: lng, t: pos.timestamp };
    updateSpeedometer(speed);
    const cEl = document.getElementById('mapCoords');
    if (cEl) cEl.textContent = lat.toFixed(5) + ', ' + lng.toFixed(5) + '  (±' + Math.round(acc) + 'm)';
  }, function(err) {
    showToast('Could not get GPS: ' + err.message, true);
  }, { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 });
}

function stopLocate() {
  if (chcnWatchId !== null) { navigator.geolocation.clearWatch(chcnWatchId); chcnWatchId = null; showToast('Live tracking stopped'); }
  chcnFollow = false;
  updateSpeedometer(0);
}

// Open Google Earth (3D) at the live GPS position when known, otherwise over Jamaica.
function openGoogleEarth() {
  let url;
  if (chcnUserMarker) {
    const ll = chcnUserMarker.getLatLng();
    url = 'https://earth.google.com/web/@' + ll.lat + ',' + ll.lng + ',100a,2000d,35y,0h,0t,0r';
  } else if (chcnLastPos) {
    url = 'https://earth.google.com/web/@' + chcnLastPos.lat + ',' + chcnLastPos.lng + ',100a,2000d,35y,0h,0t,0r';
  } else {
    url = 'https://earth.google.com/web/@18.1096,-77.2975,300a,400000d,35y,0h,0t,0r';
  }
  if (typeof window.chcnOpenExternal === 'function') { window.chcnOpenExternal(url, 'Google Earth'); }
  else { const win = window.open(url, '_blank', 'noopener,noreferrer'); if (!win) window.open(url, '_blank'); }
  showToast('Opening Google Earth 3D view in a separate page');
}

function updateSpeedometer(speedMs) {
  const el = document.getElementById('speedValue');
  if (!el) return;
  const kmh = (speedMs && speedMs > 0) ? speedMs * 3.6 : 0;
  el.textContent = Math.round(kmh);
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000, toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function searchPlace() {
  const input = document.getElementById('mapSearchInput');
  const q = input ? input.value.trim() : '';
  if (!q) { showToast('Enter a place or address to search', true); return; }
  if (!chcnMap) { initMap(); }
  if (!chcnMap) { showToast('Map is not ready yet', true); return; }
  showToast('Searching for \"' + q + '\"…');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(q), { signal: controller.signal, headers: { 'Accept': 'application/json' } })
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(res => {
      if (!res.length) { showToast('No results found. Check the spelling or try a broader search.', true); return; }
      const p = res[0];
      const lat = parseFloat(p.lat), lng = parseFloat(p.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('Invalid coordinates');
      chcnMap.setView([lat, lng], 15);
      L.marker([lat, lng]).addTo(chcnMap).bindPopup(escapeHtml(p.display_name)).openPopup();
    })
    .catch(err => showToast(err && err.name === 'AbortError' ? 'Map search timed out. Please try again.' : 'Search failed — an internet connection is required.', true))
    .finally(() => clearTimeout(timeout));
}

function saveCurrentMarker() {
  if (!chcnUserMarker) { showToast('Get your GPS location first', true); return; }
  const ll = chcnUserMarker.getLatLng();
  const name = prompt('Name this saved place:', 'Saved place');
  if (!name) return;
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem('chcn_markers') || '[]'); } catch(e) { saved = []; }
  if (!Array.isArray(saved)) saved = [];
  saved.push({ name: name, lat: ll.lat, lng: ll.lng });
  localStorage.setItem('chcn_markers', JSON.stringify(saved));
  addMarkerToMap(name, ll.lat, ll.lng);
  showToast('Place saved!');
}

function addMarkerToMap(name, lat, lng) {
  const m = L.marker([lat, lng]).addTo(chcnMap);
  m.bindPopup('<strong>' + escapeHtml(name) + '</strong>');
}

function loadSavedMarkers() {
  if (!chcnMap) return;
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem('chcn_markers') || '[]'); } catch (e) { saved = []; }
  if (!Array.isArray(saved)) saved = [];
  saved.forEach(s => { if (s && Number.isFinite(Number(s.lat)) && Number.isFinite(Number(s.lng))) addMarkerToMap(String(s.name || 'Saved place'), Number(s.lat), Number(s.lng)); });
}
// TVET Grid Population and Filter Patch

function populateTVETGrid() {
  if (!window.NEW_COURSES) return;
  var grid = document.getElementById('tvetCoursesGrid');
  if (!grid) return;
  var html = '';
  var slugs = Object.keys(window.NEW_COURSES);
  slugs.forEach(function(slug) {
    var c = window.NEW_COURSES[slug];
    var levelClass = (c.lvlLabel || 'Beginner').toLowerCase();
    var priceClass = c.price === 'Free' ? 'free' : '';
    html += '<div class="course-card" data-category="' + escapeHtml(c.cat) + '" data-level="' + escapeHtml(c.lvlLabel || 'Beginner') + '" data-price="' + (priceClass || 'free') + '" data-views="0" onclick="openTVETCourse(\'' + slug + '\')">';
    html += '<div class="card-header"><span class="badge badge-new">' + c.icon + '</span>' + escapeHtml(c.cat) + '</div>';
    html += '<div class="card-body"><h3>' + escapeHtml(c.name) + '</h3>';
    html += '<p>' + escapeHtml(c.desc).substring(0, 140) + '...</p>';
    html += '<div class="course-meta"><span class="level-' + levelClass + '">' + escapeHtml(c.lvlLabel || 'Beginner') + '</span><span>' + c.unitCount + ' Units</span><span>' + c.totalHours + ' Hrs</span></div>';
    html += '<div class="course-footer"><span class="course-price ' + priceClass + '">' + escapeHtml(c.price || 'Free') + '</span>';
    html += '<button class="btn btn-primary btn-sm">Preview</button></div></div></div>';
  });
  grid.innerHTML = html;
}

// Initialize TVET grid on page load
setTimeout(function() { populateTVETGrid(); }, 100);
