const KEYS = {
  users: 'internflow_users',
  session: 'internflow_session',
  logs: 'internflow_logs',
  reports: 'internflow_reports',
  departments: 'internflow_departments',
  theme: 'internflow_theme'
};

const ROLE = {
  student: 'นักเรียน / ผู้ฝึกงาน',
  teacher: 'อาจารย์นิเทศก์',
  admin: 'ผู้ดูแลระบบ'
};

const DEFAULT_DEPARTMENTS = [
  'เทคโนโลยีธุรกิจดิจิทัล',
  'คอมพิวเตอร์กราฟิก',
  'การโรงแรม',
  'การบัญชี',
  'การตลาด',
  'การเลขานุการ',
  'สามัญสัมพันธ์',
  'ภาษาต่างประเทศ',
];

const $ = s => document.querySelector(s);
const read = (key, fallback = []) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const departments = () => read(KEYS.departments, DEFAULT_DEPARTMENTS);
const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const esc = value => {
  const d = document.createElement('div');
  d.textContent = String(value ?? '');
  return d.innerHTML;
};
const formatDate = value => value ? new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`)) : '';
const safeUrl = value => {
  try {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const formatted = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const url = new URL(formatted);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
};
const today = () => new Date().toISOString().slice(0, 10);
const currentUser = () => {
  const id = read(KEYS.session, null);
  return read(KEYS.users).find(u => u.id === id) || null;
};

let toastTimer;
function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

function setTheme(theme) {
  document.body.classList.toggle('light', theme === 'light');
  localStorage.setItem(KEYS.theme, theme);
  const icon = theme === 'light' ? '☾' : '☼';
  $('#theme-toggle').textContent = icon;
  const authBtn = $('#auth-theme-toggle');
  if (authBtn) authBtn.textContent = icon;
}

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(v => v[0]).join('').toUpperCase() || '?';
}

function switchAuth(panel) {
  $('#login-panel').classList.toggle('hidden', panel !== 'login');
  $('#register-panel').classList.toggle('hidden', panel !== 'register');
}

function renderDepartmentOptions() {
  const select = $('#register-department');
  if (!select) return;
  select.innerHTML = '<option value="">เลือกแผนกวิชา</option>' +
    departments().map(department => `<option value="${esc(department)}">${esc(department)}</option>`).join('');
}

renderDepartmentOptions();

$('#auth-theme-toggle')?.addEventListener('click', () => {
  setTheme(document.body.classList.contains('light') ? 'dark' : 'light');
});

const solarSystem = $('#solar-system');
if (solarSystem) {
  let boostTimer;
  const boostSolarSystem = () => {
    solarSystem.classList.remove('boost');
    void solarSystem.offsetWidth;
    solarSystem.classList.add('boost');
    clearTimeout(boostTimer);
    boostTimer = setTimeout(() => solarSystem.classList.remove('boost'), 2400);
  };
  solarSystem.addEventListener('click', boostSolarSystem);
  solarSystem.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      boostSolarSystem();
    }
  });
}

document.querySelectorAll('[data-auth-panel]').forEach(button => {
  button.addEventListener('click', () => switchAuth(button.dataset.authPanel));
});

const DEMO_ACCOUNTS = {
  student: ['student@internflow.local', 'Student@InternFlow2026'],
  teacher: ['teacher@internflow.local', 'Teacher@InternFlow2026'],
  admin: ['admin@internflow.local', 'Admin@InternFlow2026']
};

document.querySelectorAll('[data-demo]').forEach(button => {
  button.addEventListener('click', () => {
    const [email, password] = DEMO_ACCOUNTS[button.dataset.demo];
    $('#login-email').value = email;
    $('#login-password').value = password;
    $('#login-email').focus();
    toast(`กรอกบัญชี${button.textContent.trim().slice(2)}ให้แล้ว กดเข้าสู่ระบบได้เลย`);
  });
});

document.addEventListener('click', event => {
  const target = event.target.closest('[data-password-toggle]');
  if (!target) return;
  const input = $(`#${target.dataset.passwordToggle}`);
  input.type = input.type === 'password' ? 'text' : 'password';
  target.textContent = '◉';
});

$('#login-form').addEventListener('submit', event => {
  event.preventDefault();
  const email = $('#login-email').value.trim().toLowerCase();
  const user = read(KEYS.users).find(item => item.email === email && item.password === $('#login-password').value);
  if (!user) return toast('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  save(KEYS.session, user.id);
  showApp();
});

$('#register-form').addEventListener('submit', event => {
  event.preventDefault();
  const email = $('#register-email').value.trim().toLowerCase();
  const users = read(KEYS.users);
  if (users.some(u => u.email === email)) return toast('อีเมลนี้ถูกใช้งานแล้ว');
  const user = {
    id: uid(),
    name: $('#register-name').value.trim(),
    email,
    department: $('#register-department').value,
    password: $('#register-password').value,
    role: 'student',
    createdAt: new Date().toISOString()
  };
  users.push(user);
  save(KEYS.users, users);
  save(KEYS.session, user.id);
  showApp();
  toast('สร้างบัญชีสำเร็จแล้ว');
});

$('#logout-button').addEventListener('click', () => {
  localStorage.removeItem(KEYS.session);
  $('#app-screen').classList.add('hidden');
  $('#auth-screen').classList.remove('hidden');
  $('#login-form').reset();
  switchAuth('login');
});

$('.user-menu')?.addEventListener('click', () => {
  activeView = 'settings';
  renderNav();
  renderView();
});

$('#theme-toggle').addEventListener('click', () => {
  setTheme(document.body.classList.contains('light') ? 'dark' : 'light');
});

const menus = {
  student: [
    ['home', '⌂', 'ภาพรวม'],
    ['daily', '◫', 'บันทึกงานประจำวัน'],
    ['reports', '▤', 'รายงานประจำสัปดาห์'],
    ['settings', '⚙', 'ตั้งค่าบัญชี']
  ],
  teacher: [
    ['home', '⌂', 'ภาพรวม'],
    ['review', '✓', 'ตรวจรายงานนักเรียน'],
    ['settings', '⚙', 'ตั้งค่าบัญชี']
  ],
  admin: [
    ['home', '⌂', 'ภาพรวมระบบ'],
    ['review', '✓', 'จัดการรายงาน'],
    ['logs', '◫', 'บันทึกงานทั้งหมด'],
    ['users', '♙', 'จัดการบัญชี'],
    ['departments', '🏢', 'จัดการแผนกวิชา'],
    ['settings', '⚙', 'ตั้งค่าบัญชี']
  ]
};

const pageInfo = {
  home: ['ภาพรวมการฝึกงาน', 'ติดตามข้อมูลและสถานะล่าสุดได้ในที่เดียว'],
  daily: ['บันทึกงานประจำวัน', 'บันทึกภารกิจของคุณในแต่ละวัน'],
  reports: ['รายงานประจำสัปดาห์', 'ส่งรายงานและติดตามผลการตรวจ'],
  review: ['ตรวจรายงานนักเรียน', 'ให้ความเห็น อนุมัติ หรือส่งกลับเพื่อแก้ไข'],
  logs: ['บันทึกงานทั้งหมด', 'ดูแลและจัดการข้อมูลการปฏิบัติงานทุกบัญชี'],
  users: ['จัดการบัญชีผู้ใช้งาน', 'กำหนดบทบาทและดูแลสิทธิ์ในระบบ'],
  departments: ['จัดการแผนกวิชา', 'เพิ่ม ลบ และติดตามจำนวนผู้ใช้งานในแต่ละแผนก'],
  settings: ['ตั้งค่าบัญชี', 'อัปเดตข้อมูลโปรไฟล์และความปลอดภัยของบัญชี']
};

let activeView = 'home';

function showApp() {
  const user = currentUser();
  if (!user) {
    $('#app-screen').classList.add('hidden');
    $('#auth-screen').classList.remove('hidden');
    return;
  }
  $('#auth-screen').classList.add('hidden');
  $('#app-screen').classList.remove('hidden');
  $('#user-name').textContent = user.name;
  $('#user-avatar').innerHTML = user.avatar
    ? `<img src="${user.avatar}" alt="รูปโปรไฟล์ของ ${esc(user.name)}">`
    : initials(user.name);
  $('#current-role').textContent = user.department ? `${ROLE[user.role]} · ${user.department}` : ROLE[user.role];
  activeView = 'home';
  renderNav();
  renderView();
}

function renderNav() {
  const user = currentUser();
  $('#sidebar').innerHTML = menus[user.role]
    .map(([id, icon, label]) => `<button class="nav-btn ${id === activeView ? 'active' : ''}" data-view="${id}"><span class="nav-icon">${icon}</span>${label}</button>`)
    .join('');
  document.querySelectorAll('[data-view]').forEach(button => {
    button.addEventListener('click', () => {
      activeView = button.dataset.view;
      renderNav();
      renderView();
    });
  });
}

function renderView() {
  const info = pageInfo[activeView];
  $('#page-title').textContent = info[0];
  $('#page-subtitle').textContent = info[1];
  const root = $('#content');
  root.innerHTML = `<div class="view">${views[activeView]()}</div>`;
  bindView();
}

const views = {
  home() {
    const user = currentUser(), logs = read(KEYS.logs), reports = read(KEYS.reports);
    const ownLogs = logs.filter(l => l.userId === user.id);
    const ownReports = reports.filter(r => r.userId === user.id);

    if (user.role === 'student') {
      return `
        <div class="stats">
          <div class="stat"><div class="stat-label">บันทึกงานทั้งหมด</div><div class="stat-value stat-accent">${ownLogs.length}</div></div>
          <div class="stat"><div class="stat-label">รายงานที่ส่งแล้ว</div><div class="stat-value">${ownReports.length}</div></div>
          <div class="stat"><div class="stat-label">รอตรวจ / ให้แก้ไข</div><div class="stat-value">${ownReports.filter(r => r.status !== 'approved').length}</div></div>
        </div>
        <div class="card">
          <div class="card-title-row">
            <div><h2>สถานะรายงานล่าสุด</h2><p class="card-subtitle">ความเห็นจากอาจารย์จะปรากฏที่นี่</p></div>
            <button class="btn btn-outline btn-small" data-go="reports">ดูรายงานทั้งหมด</button>
          </div>
          ${renderReports(ownReports, false)}
        </div>
      `;
    }

    const students = read(KEYS.users).filter(u => u.role === 'student');
    return `
      <div class="stats">
        <div class="stat"><div class="stat-label">นักเรียนในระบบ</div><div class="stat-value stat-accent">${students.length}</div></div>
        <div class="stat"><div class="stat-label">รายงานรอตรวจ</div><div class="stat-value">${reports.filter(r => r.status === 'pending').length}</div></div>
        <div class="stat"><div class="stat-label">บันทึกงานทั้งหมด</div><div class="stat-value">${logs.length}</div></div>
      </div>
      <div class="card">
        <div class="card-title-row">
          <div><h2>${user.role === 'teacher' ? 'รายงานที่ต้องตรวจ' : 'รายการรายงานล่าสุด'}</h2><p class="card-subtitle">ตรวจสอบและติดตามความคืบหน้าได้รวดเร็ว</p></div>
          <button class="btn btn-outline btn-small" data-go="review">ไปยังหน้ารายงาน</button>
        </div>
        ${renderReports(reports.filter(r => r.status === 'pending').slice(0, 5), false, true)}
      </div>
    `;
  },

  daily() {
    return `
      <div class="card">
        <div class="card-title-row">
          <div><h2>เพิ่มบันทึกการปฏิบัติงาน</h2><p class="card-subtitle">ข้อมูลจะปรากฏในบัญชีของคุณเท่านั้น</p></div>
        </div>
        <form id="daily-form">
          <div class="two-col">
            <div><label for="log-date">วันที่ปฏิบัติงาน <span class="required">*</span></label><input id="log-date" class="input" type="date" required value="${today()}"></div>
            <div><label for="log-location">แผนก / สถานที่ปฏิบัติงาน <span class="required">*</span></label><input id="log-location" class="input" maxlength="120" required placeholder="เช่น แผนกเทคโนโลยีสารสนเทศ"></div>
          </div>
          <div style="margin-top:15px">
            <label for="log-detail">รายละเอียดงานที่ปฏิบัติ <span class="required">*</span></label>
            <textarea id="log-detail" required maxlength="2000" placeholder="อธิบายงานที่รับผิดชอบ สิ่งที่ได้เรียนรู้ หรือปัญหาที่พบ..."></textarea>
          </div>
          <div style="margin-top:15px">
            <label for="log-image">แนบรูปภาพประกอบ <span class="muted">(ไม่บังคับ, ไม่เกิน 1.5 MB)</span></label>
            <input id="log-image" class="input" type="file" accept="image/png,image/jpeg,image/webp">
            <div id="image-preview-wrap" class="preview"><img id="image-preview" alt="ตัวอย่างรูปภาพ"></div>
          </div>
          <div class="form-actions"><button class="btn btn-primary" type="submit">บันทึกข้อมูล</button></div>
        </form>
      </div>
    `;
  },

  reports() {
    const reports = read(KEYS.reports).filter(r => r.userId === currentUser().id);
    return `
      <div class="card">
        <div class="card-title-row">
          <div><h2>ส่งรายงานประจำสัปดาห์</h2><p class="card-subtitle">อาจารย์จะตรวจและแจ้งผลผ่านระบบ</p></div>
        </div>
        <form id="report-form">
          <div>
            <label for="report-week">สัปดาห์ที่ <span class="required">*</span></label>
            <select id="report-week">${Array.from({ length: 16 }, (_, i) => `<option value="${i + 1}">สัปดาห์ที่ ${i + 1}</option>`).join('')}</select>
          </div>
          <div style="margin-top:15px">
            <label for="report-summary">สรุปผลการทำงานและความรู้ที่ได้รับ <span class="required">*</span></label>
            <textarea id="report-summary" required maxlength="3000" placeholder="สรุปงานที่ทำ ปัญหาที่พบ และสิ่งที่ได้เรียนรู้..."></textarea>
          </div>
          <div style="margin-top:15px">
            <label for="report-link">ลิงก์ไฟล์หรือผลงาน <span class="muted">(ไม่บังคับ)</span></label>
            <input id="report-link" class="input" type="url" maxlength="2000" placeholder="เช่น https://drive.google.com/... หรือ https://github.com/...">
            <span class="muted">แนบลิงก์ Google Drive, OneDrive, GitHub หรือเว็บไซต์ที่เกี่ยวข้องกับรายงาน</span>
          </div>
          <div class="form-actions"><button class="btn btn-primary" type="submit">ส่งรายงาน</button></div>
        </form>
      </div>
      <div class="card">
        <div class="card-title-row">
          <div><h2>รายงานของฉัน</h2><p class="card-subtitle">${reports.length} รายการ</p></div>
        </div>
        ${renderReports(reports, true)}
      </div>
    `;
  },

  review() {
    return `
      <div class="card">
        <div class="card-title-row">
          <div><h2>รายงานที่นักเรียนส่ง</h2><p class="card-subtitle">ระบุข้อเสนอแนะก่อนส่งกลับเพื่อแก้ไขได้</p></div>
        </div>
        <div class="filter-bar">
          <input id="report-search" class="input" placeholder="ค้นหาชื่อนักเรียน หรือเนื้อหารายงาน">
          <select id="report-dept-filter">
            <option value="all">ทุกแผนกวิชา</option>
            ${departments().map(department => `<option value="${esc(department)}">${esc(department)}</option>`).join('')}
          </select>
          <select id="report-status-filter">
            <option value="all">ทุกสถานะ</option>
            <option value="pending">รอตรวจ</option>
            <option value="revision">รอแก้ไข</option>
            <option value="approved">อนุมัติแล้ว</option>
          </select>
        </div>
        <div id="review-list">${renderReviewReports()}</div>
      </div>
    `;
  },

  logs() {
    return `
      <div class="card">
        <div class="card-title-row">
          <div><h2>บันทึกงานทุกบัญชี</h2><p class="card-subtitle">ผู้ดูแลระบบสามารถลบรายการที่ไม่ถูกต้องได้</p></div>
        </div>
        <div class="filter-bar">
          <input id="log-search" class="input" placeholder="ค้นหาชื่อ แผนก หรือรายละเอียด">
          <input id="log-date-filter" class="input" type="date">
        </div>
        <div id="admin-log-list">${renderLogs(read(KEYS.logs), true)}</div>
      </div>
    `;
  },

  settings() {
    const user = currentUser();
    return `
      <div class="settings-grid">
        <div class="card">
          <div class="card-title-row">
            <div><h2>ข้อมูลโปรไฟล์</h2><p class="card-subtitle">ข้อมูลนี้จะแสดงในส่วนหัวของระบบ</p></div>
          </div>
          <form id="profile-form">
            <div class="avatar-edit-section">
              <div id="settings-avatar" class="avatar-large">${user.avatar ? `<img src="${user.avatar}" alt="รูปโปรไฟล์">` : initials(user.name)}</div>
              <div class="avatar-edit-actions">
                <label for="profile-avatar">รูปโปรไฟล์</label>
                <div class="avatar-btn-row">
                  <input id="profile-avatar" class="input" type="file" accept="image/png,image/jpeg,image/webp">
                  ${user.avatar ? '<button class="btn btn-outline btn-small" type="button" id="remove-avatar">ลบรูป</button>' : ''}
                </div>
                <span class="muted">PNG, JPG หรือ WebP ขนาดไม่เกิน 1.5 MB</span>
              </div>
            </div>
            <div style="margin-top:18px">
              <label for="profile-name">ชื่อที่แสดง <span class="required">*</span></label>
              <input id="profile-name" class="input" required maxlength="80" value="${esc(user.name)}" placeholder="ชื่อ - นามสกุล">
            </div>
            <div style="margin-top:15px">
              <label>อีเมล</label>
              <div class="static-field">${esc(user.email)}</div>
              <span class="muted">ยังไม่สามารถเปลี่ยนอีเมลได้ในเวอร์ชันสาธิต</span>
            </div>
            <div style="margin-top:15px">
              <label for="profile-department">แผนกวิชา / สาขา</label>
              <select id="profile-department" class="input">
                <option value="">ไม่ระบุแผนก</option>
                ${departments().map(department => `<option value="${esc(department)}" ${user.department === department ? 'selected' : ''}>${esc(department)}</option>`).join('')}
              </select>
            </div>
            <div class="form-actions"><button class="btn btn-primary" type="submit">บันทึกโปรไฟล์</button></div>
          </form>
        </div>
        <div class="card">
          <div class="card-title-row">
            <div><h2>เปลี่ยนรหัสผ่าน</h2><p class="card-subtitle">ควรใช้รหัสผ่านที่เดายากและไม่ซ้ำกับบัญชีอื่น</p></div>
          </div>
          <form id="password-form" class="form-grid">
            <div><label for="current-password">รหัสผ่านปัจจุบัน <span class="required">*</span></label><div class="password-wrap"><input id="current-password" class="input" type="password" required autocomplete="current-password"><button type="button" class="password-toggle" data-password-toggle="current-password" aria-label="แสดงรหัสผ่าน">◉</button></div></div>
            <div><label for="new-password">รหัสผ่านใหม่ <span class="required">*</span></label><div class="password-wrap"><input id="new-password" class="input" type="password" minlength="6" required autocomplete="new-password"><button type="button" class="password-toggle" data-password-toggle="new-password" aria-label="แสดงรหัสผ่าน">◉</button></div></div>
            <div><label for="confirm-password">ยืนยันรหัสผ่านใหม่ <span class="required">*</span></label><div class="password-wrap"><input id="confirm-password" class="input" type="password" minlength="6" required autocomplete="new-password"><button type="button" class="password-toggle" data-password-toggle="confirm-password" aria-label="แสดงรหัสผ่าน">◉</button></div></div>
            <div class="form-actions"><button class="btn btn-primary" type="submit">เปลี่ยนรหัสผ่าน</button></div>
          </form>
        </div>
      </div>
    `;
  },

  users() {
    const users = read(KEYS.users);
    return `
      <div class="card">
        <div class="card-title-row">
          <div><h2>บัญชีผู้ใช้</h2><p class="card-subtitle">ปรับเปลี่ยนบทบาท หรือเอาบัญชีออกจากระบบ</p></div>
          <span class="role-pill">${users.length} บัญชี</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>ชื่อ</th><th>อีเมล</th><th>บทบาท</th><th>แผนก</th><th>วันที่สมัคร</th><th></th></tr>
            </thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td><b>${esc(u.name)}</b></td>
                  <td>${esc(u.email)}</td>
                  <td>
                    <select class="role-select" data-user-role="${u.id}">
                      ${Object.entries(ROLE).map(([role, label]) => `<option value="${role}" ${u.role === role ? 'selected' : ''}>${label}</option>`).join('')}
                    </select>
                  </td>
                  <td>
                    <select class="role-select" data-user-department="${u.id}">
                      <option value="">ไม่ระบุแผนก</option>
                      ${departments().map(department => `<option value="${esc(department)}" ${u.department === department ? 'selected' : ''}>${esc(department)}</option>`).join('')}
                    </select>
                  </td>
                  <td>${new Intl.DateTimeFormat('th-TH', { dateStyle: 'short' }).format(new Date(u.createdAt))}</td>
                  <td>${u.id === currentUser().id ? '<span class="muted">บัญชีปัจจุบัน</span>' : `<button class="btn btn-danger btn-small" data-delete-user="${u.id}">ลบ</button>`}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  departments() {
    const depts = departments();
    const users = read(KEYS.users);
    return `
      <div class="card">
        <div class="card-title-row">
          <div><h2>เพิ่มแผนกวิชาใหม่</h2><p class="card-subtitle">สร้างแผนกวิชาเพื่อให้นักเรียนและอาจารย์เลือกสังกัด</p></div>
        </div>
        <form id="add-dept-form" style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">
          <div style="flex:1;min-width:240px;">
            <label for="new-dept-name">ชื่อแผนกวิชา / สาขา <span class="required">*</span></label>
            <input id="new-dept-name" class="input" required maxlength="100" placeholder="เช่น แผนกวิชาช่างยนต์">
          </div>
          <button class="btn btn-primary" type="submit">เพิ่มแผนกวิชา</button>
        </form>
      </div>

      <div class="card">
        <div class="card-title-row">
          <div><h2>รายการแผนกวิชาในระบบ</h2><p class="card-subtitle">ทั้งหมด ${depts.length} แผนกวิชา</p></div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th style="width:50px">ลำดับ</th>
                <th>ชื่อแผนกวิชา</th>
                <th>นักเรียนในแผนก</th>
                <th>อาจารย์ในแผนก</th>
                <th>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              ${depts.map((dept, idx) => {
                const studentCount = users.filter(u => u.role === 'student' && u.department === dept).length;
                const teacherCount = users.filter(u => u.role === 'teacher' && u.department === dept).length;
                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td><b>${esc(dept)}</b></td>
                    <td><span class="role-pill">${studentCount} คน</span></td>
                    <td><span class="role-pill">${teacherCount} คน</span></td>
                    <td>
                      <button class="btn btn-danger btn-small" data-delete-dept="${esc(dept)}">ลบแผนก</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
};

function userFor(id) {
  return read(KEYS.users).find(u => u.id === id);
}

function statusLabel(status) {
  return status === 'approved' ? 'อนุมัติแล้ว' : status === 'revision' ? 'ส่งกลับให้แก้ไข' : 'รอตรวจ';
}

function renderReports(reports, showDelete = false, includeStudent = false) {
  if (!reports.length) return '<div class="empty">ยังไม่มีรายงานในส่วนนี้</div>';
  return `
    <div class="list">
      ${[...reports].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).map(report => {
        const student = userFor(report.userId);
        return `
          <article class="entry">
            <div class="entry-body">
              <div class="entry-meta">
                ${includeStudent && student ? `<strong>${esc(student.name)}</strong><span>•</span>` : ''}
                <strong>รายงานสัปดาห์ที่ ${esc(report.week)}</strong>
                <span>•</span>
                <span>${new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' }).format(new Date(report.submittedAt))}</span>
                <span class="report-status ${report.status}">${statusLabel(report.status)}</span>
              </div>
              <div class="entry-text">${esc(report.summary)}</div>
              ${safeUrl(report.link) ? `<div class="report-attachment"><a class="link-chip" href="${esc(safeUrl(report.link))}" target="_blank" rel="noopener noreferrer"><span>🔗 ไฟล์หรือผลงานที่แนบ</span><span class="link-chip-text">${esc(report.link)}</span><span class="external-icon">↗</span></a></div>` : ''}
              ${report.feedback ? `<div class="feedback"><b>ความเห็นจากอาจารย์:</b> ${esc(report.feedback)}</div>` : ''}
            </div>
            ${showDelete ? `<div class="entry-actions"><button class="btn btn-danger btn-small" data-delete-report="${report.id}">ลบ</button></div>` : ''}
          </article>
        `;
      }).join('')}
    </div>
  `;
}

function renderReviewReports() {
  let reports = read(KEYS.reports);
  const query = $('#report-search')?.value.trim().toLowerCase() || '';
  const status = $('#report-status-filter')?.value || 'all';
  const dept = $('#report-dept-filter')?.value || 'all';

  reports = reports.filter(r => {
    const student = userFor(r.userId);
    const matchesDept = (dept === 'all') || (student?.department === dept);
    const matchesStatus = (status === 'all') || (r.status === status);
    const matchesQuery = (`${student?.name || ''} ${student?.department || ''} ${r.summary} ${r.week}`).toLowerCase().includes(query);
    return matchesDept && matchesStatus && matchesQuery;
  });

  if (!reports.length) return '<div class="empty">ไม่พบรายงานตามเงื่อนไขที่เลือก</div>';

  return `
    <div class="list">
      ${reports.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).map(report => {
        const student = userFor(report.userId);
        return `
          <article class="entry">
            <div class="entry-body">
              <div class="entry-meta">
                <strong>${esc(student?.name || 'ไม่พบบัญชีผู้ใช้')}</strong>
                ${student?.department ? `<span>•</span><span class="role-pill">${esc(student.department)}</span>` : ''}
                <span>•</span>
                <strong>สัปดาห์ที่ ${esc(report.week)}</strong>
                <span class="report-status ${report.status}">${statusLabel(report.status)}</span>
              </div>
              <div class="entry-text">${esc(report.summary)}</div>
              ${safeUrl(report.link) ? `<div class="report-attachment"><a class="link-chip" href="${esc(safeUrl(report.link))}" target="_blank" rel="noopener noreferrer"><span>🔗 ไฟล์หรือผลงานที่แนบ</span><span class="link-chip-text">${esc(report.link)}</span><span class="external-icon">↗</span></a></div>` : ''}
              ${report.feedback ? `<div class="feedback"><b>ความเห็นเดิม:</b> ${esc(report.feedback)}</div>` : ''}
              <div class="review-controls">
                <select data-review-status="${report.id}">
                  <option value="pending" ${report.status === 'pending' ? 'selected' : ''}>รอตรวจ</option>
                  <option value="revision" ${report.status === 'revision' ? 'selected' : ''}>ส่งกลับให้แก้ไข</option>
                  <option value="approved" ${report.status === 'approved' ? 'selected' : ''}>อนุมัติรายงาน</option>
                </select>
                <input class="input" data-review-feedback="${report.id}" maxlength="1000" value="${esc(report.feedback || '')}" placeholder="ข้อเสนอแนะถึงนักเรียน (ถ้ามี)">
                <button class="btn btn-primary btn-small" data-save-review="${report.id}">บันทึกผล</button>
              </div>
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

function renderLogs(logs, admin = false) {
  if (!logs.length) return '<div class="empty">ยังไม่มีบันทึกงานในส่วนนี้</div>';
  return `
    <div class="list">
      ${[...logs].sort((a, b) => b.date.localeCompare(a.date)).map(log => {
        const user = userFor(log.userId);
        return `
          <article class="entry">
            <div class="entry-photo">
              ${log.image ? `<img src="${log.image}" alt="รูปภาพประกอบ" data-lightbox="${log.id}">` : 'ไม่มีรูป'}
            </div>
            <div class="entry-body">
              <div class="entry-meta">
                ${admin ? `<strong>${esc(user?.name || 'ไม่พบบัญชี')}</strong><span>•</span>` : ''}
                <strong>${formatDate(log.date)}</strong>
                <span>•</span>
                <span>${esc(log.location)}</span>
              </div>
              <div class="entry-text">${esc(log.detail)}</div>
            </div>
            ${admin ? `<div class="entry-actions"><button class="btn btn-danger btn-small" data-delete-log="${log.id}">ลบ</button></div>` : ''}
          </article>
        `;
      }).join('')}
    </div>
  `;
}

function bindView() {
  document.querySelectorAll('[data-go]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeView = btn.dataset.go;
      renderNav();
      renderView();
    });
  });

  const profileForm = $('#profile-form');
  if (profileForm) {
    let selectedAvatar = currentUser().avatar || '';
    const avatarInput = $('#profile-avatar');
    avatarInput.addEventListener('change', async () => {
      const file = avatarInput.files[0];
      if (!file) return;
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        avatarInput.value = '';
        return toast('กรุณาเลือกไฟล์ PNG, JPG หรือ WebP');
      }
      if (file.size > 10 * 1024 * 1024) {
        avatarInput.value = '';
        return toast('กรุณาเลือกรูปภาพขนาดไม่เกิน 10 MB');
      }
      try {
        selectedAvatar = await fileToDataUrl(file);
        $('#settings-avatar').innerHTML = `<img src="${selectedAvatar}" alt="รูปโปรไฟล์">`;
      } catch {
        toast('อ่านไฟล์รูปภาพไม่สำเร็จ');
      }
    });
    $('#remove-avatar')?.addEventListener('click', () => {
      selectedAvatar = '';
      avatarInput.value = '';
      $('#settings-avatar').textContent = initials(currentUser().name);
      $('#remove-avatar').remove();
    });
    profileForm.addEventListener('submit', event => {
      event.preventDefault();
      const users = read(KEYS.users);
      const user = users.find(item => item.id === currentUser().id);
      const name = $('#profile-name').value.trim();
      if (!name) return toast('กรุณากรอกชื่อที่แสดง');
      user.name = name;
      user.department = $('#profile-department').value;
      user.avatar = selectedAvatar;
      save(KEYS.users, users);
      showApp();
      activeView = 'settings';
      renderNav();
      renderView();
      toast('บันทึกโปรไฟล์เรียบร้อยแล้ว');
    });
  }

  const addDepartmentForm = $('#add-dept-form');
  if (addDepartmentForm) {
    addDepartmentForm.addEventListener('submit', event => {
      event.preventDefault();
      const name = $('#new-dept-name').value.trim();
      const depts = departments();
      if (!name) return toast('กรุณากรอกชื่อแผนกวิชา');
      if (depts.some(dept => dept.toLowerCase() === name.toLowerCase())) return toast('มีแผนกวิชานี้อยู่แล้ว');
      depts.push(name);
      save(KEYS.departments, depts);
      renderDepartmentOptions();
      toast('เพิ่มแผนกวิชาเรียบร้อยแล้ว');
      renderView();
    });
  }

  document.querySelectorAll('[data-delete-dept]').forEach(button => {
    button.addEventListener('click', () => {
      const name = button.dataset.deleteDept;
      const usersInDept = read(KEYS.users).filter(user => user.department === name).length;
      if (usersInDept) return toast(`ยังลบไม่ได้ มีผู้ใช้งาน ${usersInDept} คนอยู่ในแผนกนี้`);
      if (!confirm(`ต้องการลบแผนก “${name}” หรือไม่?`)) return;
      save(KEYS.departments, departments().filter(dept => dept !== name));
      renderDepartmentOptions();
      toast('ลบแผนกวิชาเรียบร้อยแล้ว');
      renderView();
    });
  });

  const passwordForm = $('#password-form');
  if (passwordForm) {
    passwordForm.addEventListener('submit', event => {
      event.preventDefault();
      const users = read(KEYS.users);
      const user = users.find(item => item.id === currentUser().id);
      const currentPassword = $('#current-password').value;
      const newPassword = $('#new-password').value;
      if (user.password !== currentPassword) return toast('รหัสผ่านปัจจุบันไม่ถูกต้อง');
      if (newPassword.length < 6) return toast('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
      if (newPassword !== $('#confirm-password').value) return toast('ยืนยันรหัสผ่านใหม่ไม่ตรงกัน');
      user.password = newPassword;
      save(KEYS.users, users);
      passwordForm.reset();
      toast('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
    });
  }

  const image = $('#log-image');
  if (image) {
    image.addEventListener('change', async () => {
      const file = image.files[0];
      const wrap = $('#image-preview-wrap');
      if (!file) {
        wrap.style.display = 'none';
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        image.value = '';
        toast('กรุณาเลือกรูปภาพขนาดไม่เกิน 10 MB');
        return;
      }
      const value = await fileToDataUrl(file);
      $('#image-preview').src = value;
      wrap.style.display = 'block';
      wrap.dataset.image = value;
    });
  }

  const daily = $('#daily-form');
  if (daily) {
    daily.addEventListener('submit', event => {
      event.preventDefault();
      const image = $('#image-preview-wrap').dataset.image || '';
      const entry = {
        id: uid(),
        userId: currentUser().id,
        date: $('#log-date').value,
        location: $('#log-location').value.trim(),
        detail: $('#log-detail').value.trim(),
        image,
        createdAt: new Date().toISOString()
      };
      try {
        const data = read(KEYS.logs);
        data.push(entry);
        save(KEYS.logs, data);
        toast('บันทึกงานเรียบร้อยแล้ว');
        activeView = 'home';
        renderNav();
        renderView();
      } catch {
        toast('บันทึกไม่สำเร็จ: พื้นที่เก็บข้อมูลเต็ม');
      }
    });
  }

  const report = $('#report-form');
  if (report) {
    report.addEventListener('submit', event => {
      event.preventDefault();
      const data = read(KEYS.reports);
      data.push({
        id: uid(),
        userId: currentUser().id,
        week: $('#report-week').value,
        summary: $('#report-summary').value.trim(),
        link: safeUrl($('#report-link').value),
        status: 'pending',
        feedback: '',
        submittedAt: new Date().toISOString()
      });
      save(KEYS.reports, data);
      toast('ส่งรายงานให้อาจารย์ตรวจแล้ว');
      renderView();
    });
  }

  ['#report-search', '#report-status-filter', '#report-dept-filter'].forEach(selector => {
    $(selector)?.addEventListener('input', () => {
      $('#review-list').innerHTML = renderReviewReports();
    });
  });

  ['#log-search', '#log-date-filter'].forEach(selector => {
    $(selector)?.addEventListener('input', () => {
      const query = $('#log-search').value.toLowerCase();
      const date = $('#log-date-filter').value;
      const rows = read(KEYS.logs).filter(log => {
        const user = userFor(log.userId);
        return (!date || log.date === date) &&
          (`${user?.name || ''} ${log.location} ${log.detail}`).toLowerCase().includes(query);
      });
      $('#admin-log-list').innerHTML = renderLogs(rows, true);
    });
  });

  document.querySelectorAll('[data-save-review]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.saveReview;
      const reports = read(KEYS.reports);
      const report = reports.find(r => r.id === id);
      report.status = $(`[data-review-status="${id}"]`).value;
      report.feedback = $(`[data-review-feedback="${id}"]`).value.trim();
      save(KEYS.reports, reports);
      toast('บันทึกผลการตรวจรายงานแล้ว');
      $('#review-list').innerHTML = renderReviewReports();
    });
  });

  document.querySelectorAll('[data-delete-log]').forEach(btn => {
    btn.addEventListener('click', () => removeItem(KEYS.logs, btn.dataset.deleteLog, 'บันทึกงาน'));
  });

  document.querySelectorAll('[data-delete-report]').forEach(btn => {
    btn.addEventListener('click', () => removeItem(KEYS.reports, btn.dataset.deleteReport, 'รายงาน'));
  });

  document.querySelectorAll('[data-delete-user]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('ลบบัญชีนี้ รวมถึงบันทึกงานและรายงานทั้งหมดหรือไม่?')) return;
      const id = btn.dataset.deleteUser;
      save(KEYS.users, read(KEYS.users).filter(u => u.id !== id));
      save(KEYS.logs, read(KEYS.logs).filter(l => l.userId !== id));
      save(KEYS.reports, read(KEYS.reports).filter(r => r.userId !== id));
      toast('ลบบัญชีและข้อมูลที่เกี่ยวข้องแล้ว');
      renderView();
    });
  });

  document.querySelectorAll('[data-user-role]').forEach(select => {
    select.addEventListener('change', () => {
      const users = read(KEYS.users);
      const user = users.find(u => u.id === select.dataset.userRole);
      user.role = select.value;
      save(KEYS.users, users);
      toast('ปรับบทบาทผู้ใช้งานแล้ว');
    });
  });

  document.querySelectorAll('[data-user-department]').forEach(select => {
    select.addEventListener('change', () => {
      const users = read(KEYS.users);
      const user = users.find(u => u.id === select.dataset.userDepartment);
      user.department = select.value;
      save(KEYS.users, users);
      toast('ปรับแผนกวิชาของผู้ใช้งานแล้ว');
      if (user.id === currentUser().id) showApp();
    });
  });

  document.querySelectorAll('[data-lightbox]').forEach(image => {
    image.addEventListener('click', () => {
      openLightbox(read(KEYS.logs).find(l => l.id === image.dataset.lightbox)?.image);
    });
  });
}

function removeItem(key, id, label) {
  if (!confirm(`ต้องการลบ${label}นี้หรือไม่?`)) return;
  save(key, read(key).filter(item => item.id !== id));
  toast(`ลบ${label}เรียบร้อยแล้ว`);
  renderView();
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function openLightbox(image) {
  if (!image) return;
  $('#modal-root').innerHTML = `
    <div class="modal-backdrop" data-close-modal>
      <div class="modal">
        <div class="modal-head">
          <h2>รูปภาพประกอบการทำงาน</h2>
          <button class="icon-btn" data-close-modal aria-label="ปิด">×</button>
        </div>
        <img class="lightbox-image" src="${image}" alt="รูปภาพประกอบการทำงาน">
      </div>
    </div>
  `;
  document.querySelectorAll('[data-close-modal]').forEach(el => {
    el.addEventListener('click', event => {
      if (event.target === el || event.target.closest('[data-close-modal]')) {
        $('#modal-root').innerHTML = '';
      }
    });
  });
}

function seedDefaultAccounts() {
  const users = read(KEYS.users);
  const demoAccounts = [
    {
      id: 'internflow-default-admin',
      name: 'ผู้ดูแลระบบ by PT-FU',
      email: 'admin@internflow.local',
      password: 'Admin@InternFlow2026',
      role: 'admin',
      department: '',
      createdAt: new Date().toISOString()
    },
    {
      id: 'internflow-default-teacher',
      name: 'อาจารย์ปัณณรุจน์ สอนดีลบ',
      email: 'teacher@internflow.local',
      password: 'Teacher@InternFlow2026',
      role: 'teacher',
      department: '',
      createdAt: new Date().toISOString()
    },
    {
      id: 'internflow-default-student',
      name: 'นายฐานุปัติ นกกระตั่ว',
      email: 'student@internflow.local',
      password: 'Student@InternFlow2026',
      role: 'student',
      department: 'เทคโนโลยีธุรกิจดิจิทัล',
      createdAt: new Date().toISOString()
    }
  ];

  let hasChanged = false;
  demoAccounts.forEach(account => {
    if (!users.some(u => u.email === account.email)) {
      users.push(account);
      hasChanged = true;
    }
  });

  if (hasChanged) {
    save(KEYS.users, users);
  }
}

seedDefaultAccounts();
setTheme(localStorage.getItem(KEYS.theme) || 'dark');
showApp();
