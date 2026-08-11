/* ==========================================================================
   Smart Campus Complaint Management System - Core Application Logic (app.js)
   ========================================================================== */

// --- INITIAL STATE & DEMO DATA ---
const state = {
  currentRole: 'student', // 'student' | 'staff'
  activeView: 'student-dashboard',
  currentDeptFilter: 'ALL',
  
  // Seed Campus Complaints Data
  complaints: [
    {
      id: 'CMP-1092',
      date: '2026-08-11 09:15',
      category: 'IT/Wi-Fi',
      subject: 'Wi-Fi Disruption in Hostel Block B (3rd Floor)',
      location: 'Hostel Block B',
      urgency: 'Medium',
      status: 'In Progress', // Submitted | Under Review | In Progress | Resolved
      upvotes: 14,
      description: 'The Wi-Fi router on the 3rd floor corridor is displaying a red LOS light since morning. Students cannot submit lab assignments.',
      assignedTech: 'K. Suresh (Sr. Network Admin)',
      estimatedETA: '2 Hours Remaining'
    },
    {
      id: 'CMP-1088',
      date: '2026-08-10 16:30',
      category: 'Electrical',
      subject: 'Short circuit & sparking in Central Lab 2 Bench 4',
      location: 'Central Lab 2',
      urgency: 'Urgent',
      status: 'Under Review',
      upvotes: 6,
      description: 'Sparking sound from main power strip near computer station #14. Main breaker tripped twice.',
      assignedTech: 'P. Venkatesh (Electrician)',
      estimatedETA: 'Pending Inspection'
    },
    {
      id: 'CMP-1075',
      date: '2026-08-10 11:20',
      category: 'Plumbing',
      subject: 'Water leakage in Hostel Block A 2nd Floor Washroom',
      location: 'Hostel Block A',
      urgency: 'Urgent',
      status: 'Submitted',
      upvotes: 9,
      description: 'Pipe line burst under sink #3 causing overflow into the hallway floor.',
      assignedTech: 'Unassigned',
      estimatedETA: 'Awaiting Technician'
    },
    {
      id: 'CMP-1064',
      date: '2026-08-09 14:00',
      category: 'Infrastructure',
      subject: 'Classroom 402 Projector HDMI Port Damaged',
      location: 'Library 2nd Floor',
      urgency: 'Low',
      status: 'Resolved',
      upvotes: 3,
      description: 'HDMI cable connector pin broke inside the projector port during CSE lecture.',
      assignedTech: 'M. Ramesh (AV Tech)',
      estimatedETA: 'Completed (Aug 10)'
    },
    {
      id: 'CMP-1051',
      date: '2026-08-08 08:45',
      category: 'Transport',
      subject: 'Campus Bus #4 AC Cooling Failure',
      location: 'Main Auditorium',
      urgency: 'Medium',
      status: 'Resolved',
      upvotes: 5,
      description: 'Air conditioning unit not cooling during morning pickup route from city center.',
      assignedTech: 'R. Naidu (Fleet Manager)',
      estimatedETA: 'Completed (Aug 09)'
    }
  ],

  // AI Taxonomy Keywords Mapping for Auto-Categorization
  aiTaxonomy: {
    'IT/Wi-Fi': ['wifi', 'wi-fi', 'internet', 'router', 'lan', 'network', 'signal', 'port', 'computer', 'server'],
    'Electrical': ['electric', 'power', 'spark', 'light', 'fan', 'ac', 'switch', 'socket', 'plug', 'breaker', 'wire'],
    'Plumbing': ['water', 'tap', 'sink', 'leak', 'flush', 'washroom', 'toilet', 'pipe', 'drainage', 'geyser'],
    'Infrastructure': ['bench', 'desk', 'chair', 'door', 'window', 'projector', 'whiteboard', 'roof', 'wall', 'paint'],
    'Transport': ['bus', 'driver', 'route', 'shuttle', 'vehicle', 'seat', 'timing', 'parking']
  },

  // Temporary Form Uploaded Files
  pendingFiles: [],
  detectedDuplicate: null
};

// --- AUTHENTICATION STATE & LOGIC ---
const authState = {
  isLoggedIn: false,
  loginRole: 'student', // 'student' | 'staff'
  users: {
    student: {
      id: '22B91A0584',
      pass: 'student123',
      name: 'Rahul Sharma',
      role: 'B.Tech CSE (3rd Yr)',
      branch: 'B.Tech CSE (3rd Yr, Sem 5)',
      room: 'Hostel Block B • Room 304'
    },
    staff: {
      id: 'ADMIN-7702',
      pass: 'admin123',
      name: 'Prof. A. Kumar',
      role: 'Campus Estate Admin',
      branch: 'Estate & Infrastructure Management',
      room: 'Admin Block Room 102'
    }
  }
};

function switchLoginTab(role) {
  authState.loginRole = role;
  const tabStudent = document.getElementById('tab-student-login');
  const tabStaff = document.getElementById('tab-staff-login');
  const idLabel = document.getElementById('login-id-label');
  const idIcon = document.getElementById('login-id-icon');
  const idInput = document.getElementById('login-id-input');
  const errorMsg = document.getElementById('login-error-msg');

  if (errorMsg) errorMsg.style.display = 'none';

  if (role === 'student') {
    tabStudent.classList.add('active');
    tabStaff.classList.remove('active');
    idLabel.textContent = 'Student Roll Number *';
    idIcon.textContent = '🎓';
    idInput.placeholder = 'e.g. 22B91A0584';
  } else {
    tabStaff.classList.add('active');
    tabStudent.classList.remove('active');
    idLabel.textContent = 'Staff / Admin ID *';
    idIcon.textContent = '🛠️';
    idInput.placeholder = 'e.g. ADMIN-7702';
  }
}

function fillDemoStudent() {
  switchLoginTab('student');
  document.getElementById('login-id-input').value = '22B91A0584';
  document.getElementById('login-pass-input').value = 'student123';
}

function fillDemoStaff() {
  switchLoginTab('staff');
  document.getElementById('login-id-input').value = 'ADMIN-7702';
  document.getElementById('login-pass-input').value = 'admin123';
}

function togglePasswordVisibility() {
  const passInput = document.getElementById('login-pass-input');
  if (passInput) {
    passInput.type = passInput.type === 'password' ? 'text' : 'password';
  }
}

function handleLoginSubmit(event) {
  event.preventDefault();
  const enteredId = (document.getElementById('login-id-input')?.value || '').trim();
  const enteredPass = (document.getElementById('login-pass-input')?.value || '').trim();
  const errorMsg = document.getElementById('login-error-msg');

  if (!enteredId || !enteredPass) {
    if (errorMsg) {
      errorMsg.style.display = 'block';
      const msgSpan = errorMsg.querySelector('span');
      if (msgSpan) msgSpan.textContent = '⚠️ Please enter both ID and Password.';
    }
    return;
  }

  if (errorMsg) errorMsg.style.display = 'none';
  authState.isLoggedIn = true;

  if (authState.loginRole === 'student') {
    // Allow ANY random student roll number!
    const formattedId = enteredId.toUpperCase();
    const initials = formattedId.slice(0, 2);

    document.querySelectorAll('.avatar-circle').forEach(el => el.textContent = initials);
    document.querySelectorAll('#user-name-display').forEach(el => el.textContent = `Student (${formattedId})`);
    document.querySelectorAll('#user-role-display').forEach(el => el.textContent = `Roll No: ${formattedId}`);

    // Update Digital ID Modal fields
    const idRoll = document.querySelector('.id-student-roll');
    if (idRoll) idRoll.textContent = `ID: ${formattedId}`;
    const idName = document.querySelector('.id-student-name');
    if (idName) idName.textContent = `Student (${formattedId})`;
    const idAvatar = document.querySelector('.id-avatar-circle');
    if (idAvatar) idAvatar.textContent = initials;

    document.getElementById('login-screen-container').style.display = 'none';
    document.getElementById('main-app-container').style.display = 'flex';
    setRolePerspective('student');
    showToast(`🔐 Welcome, Student ${formattedId}! Logged in successfully.`);

  } else {
    // Staff Login
    const staffData = authState.users.staff;
    document.getElementById('login-screen-container').style.display = 'none';
    document.getElementById('main-app-container').style.display = 'flex';
    setRolePerspective('staff');
    showToast(`🔐 Welcome back, ${staffData.name}! Logged in as ${staffData.role}.`);
  }
}

function logoutUser() {
  authState.isLoggedIn = false;
  document.getElementById('main-app-container').style.display = 'none';
  document.getElementById('login-screen-container').style.display = 'flex';
  document.getElementById('login-pass-input').value = '';
  showToast('👋 Logged out from CampusCare AI portal.');
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  renderStudentTable();
  renderKanbanBoard();
  renderAnalyticsCharts();
  updateMetricsOverview();
  setupDragAndDrop();
});

// --- NAVIGATION & VIEW SWITCHING ---
function switchView(viewId, clickedBtn) {
  state.activeView = viewId;

  // Update Nav Active State
  document.querySelectorAll('.nav-item-btn').forEach(btn => btn.classList.remove('active'));
  if (clickedBtn) {
    clickedBtn.classList.add('active');
  }

  // Update Views Visibility
  document.querySelectorAll('.page-view').forEach(view => view.classList.remove('active-view'));
  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.classList.add('active-view');
  }

  // Update Header Titles
  const titleHeading = document.getElementById('page-title-heading');
  const subtitleText = document.getElementById('page-subtitle-text');

  if (viewId === 'student-dashboard') {
    titleHeading.textContent = 'Student Portal';
    subtitleText.textContent = 'Track, report, and manage campus infrastructure complaints';
  } else if (viewId === 'admin-dashboard') {
    titleHeading.textContent = 'Staff & Admin Kanban Board';
    subtitleText.textContent = 'Manage, route, and assign campus maintenance work orders';
  } else if (viewId === 'analytics-page') {
    titleHeading.textContent = 'Campus Analytics & Insights';
    subtitleText.textContent = 'Identify recurring campus hotspots, category breakdowns, and resolution trends';
    renderAnalyticsCharts(); // Re-render SVG charts for accuracy
  }
}

// --- PERSONA SWITCHER ---
function setRolePerspective(role) {
  state.currentRole = role;
  const btnStudent = document.getElementById('role-btn-student');
  const btnStaff = document.getElementById('role-btn-staff');
  const userName = document.getElementById('user-name-display');
  const userRole = document.getElementById('user-role-display');

  if (role === 'student') {
    btnStudent.classList.add('active');
    btnStaff.classList.remove('active');
    userName.textContent = 'Rahul Sharma';
    userRole.textContent = 'B.Tech CSE (3rd Yr)';
    switchView('student-dashboard', document.getElementById('nav-student-btn'));
  } else {
    btnStaff.classList.add('active');
    btnStudent.classList.remove('active');
    userName.textContent = 'Prof. A. Kumar';
    userRole.textContent = 'Campus Estate Admin';
    switchView('admin-dashboard', document.getElementById('nav-admin-btn'));
  }
  showToast(`Switched view to ${role === 'student' ? 'Student View' : 'Staff / Admin Mode'}`);
}

// --- STUDENT TABLE RENDERER ---
function renderStudentTable() {
  const tbody = document.getElementById('student-table-body');
  if (!tbody) return;

  const searchKeyword = (document.getElementById('student-search-input')?.value || '').toLowerCase();
  const categoryFilter = document.getElementById('student-category-filter')?.value || 'ALL';
  const statusFilter = document.getElementById('student-status-filter')?.value || 'ALL';

  const filtered = state.complaints.filter(c => {
    const matchesSearch = c.id.toLowerCase().includes(searchKeyword) ||
                          c.subject.toLowerCase().includes(searchKeyword) ||
                          c.location.toLowerCase().includes(searchKeyword);
    const matchesCategory = categoryFilter === 'ALL' || c.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          🔍 No complaints match the selected search or filter criteria.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(c => `
    <tr>
      <td>
        <div style="font-weight: 700;">${c.id}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${c.date}</div>
      </td>
      <td>
        <span class="badge-chip priority-low">${c.category}</span>
      </td>
      <td>
        <div class="complaint-title-cell">${c.subject}</div>
        <div class="complaint-location-sub">📍 ${c.location}</div>
      </td>
      <td>
        <span class="badge-chip ${c.urgency === 'Urgent' ? 'priority-urgent' : (c.urgency === 'Medium' ? 'priority-medium' : 'priority-low')}">
          ${c.urgency}
        </span>
      </td>
      <td>
        <span class="badge-chip ${getStatusBadgeClass(c.status)}">
          ${c.status}
        </span>
      </td>
      <td>
        <button class="upvote-badge-btn" onclick="upvoteIssueFromTable('${c.id}')" title="Upvote this complaint">
          👍 <span>${c.upvotes}</span>
        </button>
      </td>
      <td>
        <div class="action-btn-group">
          <button class="btn-table-action" onclick="viewIssueDetails('${c.id}')">View</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'Submitted': return 'status-submitted';
    case 'Under Review': return 'status-review';
    case 'In Progress': return 'status-progress';
    case 'Resolved': return 'status-resolved';
    default: return 'status-submitted';
  }
}

function filterStudentTable() {
  renderStudentTable();
}

function upvoteIssueFromTable(id) {
  const issue = state.complaints.find(c => c.id === id);
  if (issue) {
    issue.upvotes += 1;
    renderStudentTable();
    renderKanbanBoard();
    showToast(`Upvoted complaint ${id}! Total upvotes: ${issue.upvotes}`);
  }
}

function viewIssueDetails(id) {
  const issue = state.complaints.find(c => c.id === id);
  if (issue) {
    alert(`Complaint Details [${issue.id}]\n\nSubject: ${issue.subject}\nLocation: ${issue.location}\nStatus: ${issue.status}\nAssigned: ${issue.assignedTech}\nETA: ${issue.estimatedETA}\n\nDescription:\n${issue.description}`);
  }
}

// --- ADMIN KANBAN BOARD RENDERER ---
function renderKanbanBoard() {
  const cols = {
    'Submitted': document.getElementById('cards-submitted'),
    'Under Review': document.getElementById('cards-review'),
    'In Progress': document.getElementById('cards-progress'),
    'Resolved': document.getElementById('cards-resolved')
  };

  const counts = {
    'Submitted': document.getElementById('count-submitted'),
    'Under Review': document.getElementById('count-review'),
    'In Progress': document.getElementById('count-progress'),
    'Resolved': document.getElementById('count-resolved')
  };

  // Reset columns
  Object.keys(cols).forEach(key => {
    if (cols[key]) cols[key].innerHTML = '';
  });

  const deptFilter = state.currentDeptFilter;

  const filtered = state.complaints.filter(c => deptFilter === 'ALL' || c.category === deptFilter);

  // Group by status
  const grouped = {
    'Submitted': [],
    'Under Review': [],
    'In Progress': [],
    'Resolved': []
  };

  filtered.forEach(c => {
    if (grouped[c.status]) {
      grouped[c.status].push(c);
    }
  });

  // Update counts
  Object.keys(counts).forEach(status => {
    if (counts[status]) counts[status].textContent = grouped[status].length;
  });

  // Render cards per column
  Object.keys(cols).forEach(status => {
    const container = cols[status];
    if (!container) return;

    if (grouped[status].length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 2rem 0;">No issues in this stage</div>`;
      return;
    }

    container.innerHTML = grouped[status].map(c => `
      <div class="kanban-card">
        <div class="kanban-card-tags">
          <span class="badge-chip ${c.urgency === 'Urgent' ? 'priority-urgent' : (c.urgency === 'Medium' ? 'priority-medium' : 'priority-low')}">
            ${c.urgency}
          </span>
          <span class="badge-chip priority-low">${c.category}</span>
          ${c.upvotes > 5 ? `<span style="font-size: 0.72rem; font-weight: 700; color: var(--primary);">👍 ${c.upvotes}</span>` : ''}
        </div>

        <div class="kanban-card-title">${c.subject}</div>
        <div class="kanban-card-loc">📍 ${c.location}</div>

        <div class="kanban-card-footer">
          <span>${c.id}</span>
          <select class="staff-assignee-select" onchange="assignStaffToIssue('${c.id}', this.value)">
            <option value="Unassigned" ${c.assignedTech === 'Unassigned' ? 'selected' : ''}>Unassigned</option>
            <option value="K. Suresh (IT Admin)" ${c.assignedTech.includes('Suresh') ? 'selected' : ''}>K. Suresh (IT)</option>
            <option value="P. Venkatesh (Elec)" ${c.assignedTech.includes('Venkatesh') ? 'selected' : ''}>P. Venkatesh (Elec)</option>
            <option value="S. Rao (Plumber)" ${c.assignedTech.includes('Rao') ? 'selected' : ''}>S. Rao (Plumber)</option>
          </select>
        </div>

        <div class="card-move-actions">
          ${status !== 'Submitted' ? `<button class="btn-move" onclick="moveIssueStatus('${c.id}', 'prev')">← Prev Stage</button>` : ''}
          ${status !== 'Resolved' ? `<button class="btn-move" onclick="moveIssueStatus('${c.id}', 'next')">Advance Stage →</button>` : ''}
        </div>
      </div>
    `).join('');
  });

  updateMetricsOverview();
}

function filterKanbanDept(dept, btnElement) {
  state.currentDeptFilter = dept;
  document.querySelectorAll('.dept-filter-chips .chip-btn').forEach(btn => btn.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');
  renderKanbanBoard();
}

function moveIssueStatus(id, direction) {
  const stages = ['Submitted', 'Under Review', 'In Progress', 'Resolved'];
  const issue = state.complaints.find(c => c.id === id);
  if (!issue) return;

  let currentIndex = stages.indexOf(issue.status);
  if (direction === 'next' && currentIndex < stages.length - 1) {
    issue.status = stages[currentIndex + 1];
  } else if (direction === 'prev' && currentIndex > 0) {
    issue.status = stages[currentIndex - 1];
  }

  // Also update active tracker if moving this issue
  if (issue.id === 'CMP-1092') {
    updateActiveTrackerWidget(issue);
  }

  renderKanbanBoard();
  renderStudentTable();
  showToast(`Updated status of ${id} to ${issue.status}`);
}

function assignStaffToIssue(id, staffName) {
  const issue = state.complaints.find(c => c.id === id);
  if (issue) {
    issue.assignedTech = staffName;
    showToast(`Assigned ${staffName} to ${id}`);
  }
}

function updateMetricsOverview() {
  const openCount = state.complaints.filter(c => c.status !== 'Resolved').length;
  const resolvedCount = state.complaints.filter(c => c.status === 'Resolved').length;
  const urgentCount = state.complaints.filter(c => c.urgency === 'Urgent' && c.status !== 'Resolved').length;
  const totalUpvotes = state.complaints.reduce((acc, c) => acc + (c.upvotes || 0), 0);

  const totalOpenEl = document.getElementById('metric-total-open');
  const urgentEl = document.getElementById('metric-urgent-count');
  const sidebarUrgentEl = document.getElementById('sidebar-urgent-count');

  if (totalOpenEl) totalOpenEl.textContent = openCount;
  if (urgentEl) urgentEl.textContent = urgentCount;
  if (sidebarUrgentEl) sidebarUrgentEl.textContent = urgentCount;

  // Sync Left Sidebar Student Card Stats
  const leftActive = document.getElementById('left-stat-active');
  const leftResolved = document.getElementById('left-stat-resolved');
  const leftUpvotes = document.getElementById('left-stat-upvotes');

  if (leftActive) leftActive.textContent = openCount;
  if (leftResolved) leftResolved.textContent = resolvedCount;
  if (leftUpvotes) leftUpvotes.textContent = totalUpvotes;
}

function updateActiveTrackerWidget(issue) {
  const trackerStatus = document.getElementById('active-tracker-status-chip');
  const trackerProgressLine = document.getElementById('timeline-progress-line');

  if (!trackerStatus || !trackerProgressLine) return;

  trackerStatus.textContent = issue.status;

  // Map progress %
  switch (issue.status) {
    case 'Submitted':
      trackerProgressLine.style.width = '0%';
      break;
    case 'Under Review':
      trackerProgressLine.style.width = '33%';
      break;
    case 'In Progress':
      trackerProgressLine.style.width = '66%';
      break;
    case 'Resolved':
      trackerProgressLine.style.width = '100%';
      break;
  }
}

// --- SMART AI AUTO-CATEGORIZATION & DUPLICATE WARNING ---
function triggerSmartAIAssist() {
  const title = (document.getElementById('form-title')?.value || '').toLowerCase();
  const desc = (document.getElementById('form-desc')?.value || '').toLowerCase();
  const location = document.getElementById('form-location')?.value || '';
  const combinedText = `${title} ${desc}`;

  if (combinedText.trim().length < 5) {
    document.getElementById('ai-prediction-box').style.display = 'none';
    return;
  }

  // 1. AI Auto-Categorization Algorithm
  let bestMatchDept = null;
  let highestScore = 0;

  Object.keys(state.aiTaxonomy).forEach(dept => {
    let score = 0;
    state.aiTaxonomy[dept].forEach(kw => {
      if (combinedText.includes(kw)) score += 1;
    });
    if (score > highestScore) {
      highestScore = score;
      bestMatchDept = dept;
    }
  });

  if (bestMatchDept && highestScore > 0) {
    const confidence = Math.min(85 + (highestScore * 5), 99);
    document.getElementById('ai-predicted-dept-name').textContent = getFullDeptName(bestMatchDept);
    document.getElementById('ai-confidence-score').textContent = `${confidence}% Match`;
    document.getElementById('ai-prediction-box').style.display = 'block';

    // Auto select dropdown if user hasn't manually selected one
    const categorySelect = document.getElementById('form-category');
    if (categorySelect && (!categorySelect.value || categorySelect.dataset.userModified !== 'true')) {
      categorySelect.value = bestMatchDept;
    }
  }

  // 2. Duplicate Issue Detection Algorithm
  if (title.length > 8 || location) {
    const matchingDup = state.complaints.find(c => {
      const isSameLoc = location && c.location === location;
      const hasKeywords = (title.includes('wifi') && c.subject.toLowerCase().includes('wifi')) ||
                          (title.includes('sparking') && c.subject.toLowerCase().includes('sparking')) ||
                          (title.includes('water') && c.subject.toLowerCase().includes('water'));
      return isSameLoc || hasKeywords;
    });

    state.detectedDuplicate = matchingDup || null;
  }
}

function getFullDeptName(cat) {
  switch (cat) {
    case 'IT/Wi-Fi': return '🌐 IT & Network Infrastructure';
    case 'Electrical': return '⚡ Electrical & Maintenance';
    case 'Plumbing': return '🚰 Plumbing & Washrooms';
    case 'Infrastructure': return '🏢 Civil & Campus Infra';
    case 'Transport': return '🚌 Fleet & Transport Services';
    default: return cat;
  }
}

// --- FORM SUBMISSION & DUPLICATE POPUP ---
function handleFormSubmission(event) {
  event.preventDefault();

  // If duplicate detected, pop up the alert modal first!
  if (state.detectedDuplicate) {
    const dupAlert = document.getElementById('duplicate-alert-overlay');
    document.getElementById('dup-issue-title').textContent = state.detectedDuplicate.subject;
    document.getElementById('dup-issue-loc').textContent = state.detectedDuplicate.location;
    document.getElementById('dup-issue-upvotes').textContent = state.detectedDuplicate.upvotes;
    
    dupAlert.classList.add('active');
    return;
  }

  // Standard Submission
  submitNewComplaintObj();
}

function upvoteDuplicateIssue() {
  if (state.detectedDuplicate) {
    state.detectedDuplicate.upvotes += 1;
    renderStudentTable();
    renderKanbanBoard();
    document.getElementById('duplicate-alert-overlay').classList.remove('active');
    closeNewIssueModal();
    showToast(`👍 Upvoted complaint ${state.detectedDuplicate.id}! You will receive status notifications.`);
  }
}

function bypassDuplicateAndSubmit() {
  document.getElementById('duplicate-alert-overlay').classList.remove('active');
  submitNewComplaintObj();
}

function submitNewComplaintObj() {
  const title = document.getElementById('form-title').value;
  const category = document.getElementById('form-category').value;
  const location = document.getElementById('form-location').value;
  const urgency = document.getElementById('form-urgency').value;
  const desc = document.getElementById('form-desc').value;

  const newId = `CMP-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5);

  const newIssue = {
    id: newId,
    date: dateStr,
    category: category || 'IT/Wi-Fi',
    subject: title,
    location: location,
    urgency: urgency,
    status: 'Submitted',
    upvotes: 1,
    description: desc,
    assignedTech: 'Awaiting Assignment',
    estimatedETA: 'Under Triage'
  };

  state.complaints.unshift(newIssue);
  state.detectedDuplicate = null;

  renderStudentTable();
  renderKanbanBoard();
  renderAnalyticsCharts();

  closeNewIssueModal();
  showToast(`✅ Complaint ${newId} submitted successfully! Auto-routed to ${category} dept.`);
}

// --- MODAL CONTROLS ---
function openStudentProfileModal() {
  const modal = document.getElementById('student-profile-modal');
  if (modal) modal.classList.add('active');
}

function closeStudentProfileModal() {
  const modal = document.getElementById('student-profile-modal');
  if (modal) modal.classList.remove('active');
}

function openNewIssueModal() {
  const modal = document.getElementById('submission-modal');
  if (modal) modal.classList.add('active');
}

function closeNewIssueModal() {
  const modal = document.getElementById('submission-modal');
  if (modal) modal.classList.remove('active');

  // Reset form
  document.getElementById('complaint-form')?.reset();
  document.getElementById('ai-prediction-box').style.display = 'none';
  document.getElementById('image-preview-container').innerHTML = '';
  state.pendingFiles = [];
  state.detectedDuplicate = null;
}

// --- DRAG AND DROP FILE UPLOADER ---
function setupDragAndDrop() {
  const dropZone = document.getElementById('drop-zone');
  if (!dropZone) return;

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
  });
}

function handleFileSelect(e) {
  const files = e.target.files;
  handleFiles(files);
}

function handleFiles(files) {
  const container = document.getElementById('image-preview-container');
  Array.from(files).forEach(file => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.className = 'preview-thumb';
        container.appendChild(img);
      };
      reader.readAsDataURL(file);
    }
  });
}

// --- DYNAMIC SVG CHARTS (ANALYTICS) ---
function renderAnalyticsCharts() {
  renderDonutChart();
  renderBarChart();
  renderLineChart();
}

// 1. Donut Chart (Category Breakdown)
function renderDonutChart() {
  const container = document.getElementById('donut-chart-container');
  const legend = document.getElementById('donut-legend');
  if (!container || !legend) return;

  const data = [
    { label: 'Electrical', count: 42, color: '#f59e0b' },
    { label: 'IT / Wi-Fi', count: 38, color: '#3b82f6' },
    { label: 'Plumbing', count: 24, color: '#10b981' },
    { label: 'Infrastructure', count: 20, color: '#8b5cf6' }
  ];

  const total = data.reduce((acc, d) => acc + d.count, 0);
  let cumulativeAngle = 0;

  const svgPaths = data.map(d => {
    const sliceAngle = (d.count / total) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + sliceAngle;
    cumulativeAngle = endAngle;

    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);

    const x1 = 100 + 70 * Math.cos(startRad);
    const y1 = 100 + 70 * Math.sin(startRad);
    const x2 = 100 + 70 * Math.cos(endRad);
    const y2 = 100 + 70 * Math.sin(endRad);

    const largeArc = sliceAngle > 180 ? 1 : 0;

    return `<path d="M 100 100 L ${x1} ${y1} A 70 70 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${d.color}" opacity="0.9" />`;
  }).join('');

  container.innerHTML = `
    <svg viewBox="0 0 200 200" width="100%" height="100%">
      ${svgPaths}
      <circle cx="100" cy="100" r="45" fill="var(--bg-surface)" />
      <text x="100" y="96" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--text-main)">${total}</text>
      <text x="100" y="112" text-anchor="middle" font-size="9" fill="var(--text-muted)">Total Issues</text>
    </svg>`;

  legend.innerHTML = data.map(d => `
    <div class="legend-item">
      <div class="legend-label-group">
        <span class="legend-color-dot" style="background-color: ${d.color};"></span>
        <span>${d.label}</span>
      </div>
      <span class="legend-value">${d.count} (${Math.round((d.count / total) * 100)}%)</span>
    </div>
  `).join('');
}

// 2. Bar Chart (Campus Hotspots)
function renderBarChart() {
  const container = document.getElementById('bar-chart-container');
  if (!container) return;

  const hotspots = [
    { name: 'Hostel Block A', count: 32 },
    { name: 'Central Lab 2', count: 28 },
    { name: 'Hostel Block B', count: 22 },
    { name: 'Library 2nd Fl', count: 18 },
    { name: 'Main Auditorium', count: 14 }
  ];

  const maxCount = Math.max(...hotspots.map(h => h.count));

  const bars = hotspots.map((h, i) => {
    const heightPct = (h.count / maxCount) * 180;
    const x = 40 + i * 90;
    const y = 220 - heightPct;

    return `
      <rect x="${x}" y="${y}" width="48" height="${heightPct}" rx="6" fill="url(#barGradient)" />
      <text x="${x + 24}" y="${y - 8}" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--primary)">${h.count}</text>
      <text x="${x + 24}" y="242" text-anchor="middle" font-size="10" font-weight="600" fill="var(--text-muted)">${h.name}</text>
    `;
  }).join('');

  container.innerHTML = `
    <svg viewBox="0 0 520 260" width="100%" height="100%">
      <defs>
        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2563eb" />
          <stop offset="100%" stop-color="#8b5cf6" />
        </linearGradient>
      </defs>
      <line x1="20" y1="220" x2="500" y2="220" stroke="var(--border-medium)" stroke-width="1" />
      ${bars}
    </svg>`;
}

// 3. Line Chart (Semester Complaint Volume)
function renderLineChart() {
  const container = document.getElementById('line-chart-container');
  if (!container) return;

  const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];
  const incoming = [12, 18, 24, 30, 22, 16, 28, 20];
  const resolved = [10, 15, 22, 28, 20, 16, 26, 19];

  const maxVal = 35;
  const width = 680;
  const height = 220;

  const pointsIncoming = incoming.map((val, idx) => {
    const x = 50 + idx * 85;
    const y = height - (val / maxVal) * 160;
    return `${x},${y}`;
  }).join(' ');

  const pointsResolved = resolved.map((val, idx) => {
    const x = 50 + idx * 85;
    const y = height - (val / maxVal) * 160;
    return `${x},${y}`;
  }).join(' ');

  const labels = weeks.map((w, idx) => {
    const x = 50 + idx * 85;
    return `<text x="${x}" y="210" text-anchor="middle" font-size="11" fill="var(--text-muted)">${w}</text>`;
  }).join('');

  container.innerHTML = `
    <svg viewBox="0 0 700 230" width="100%" height="100%">
      <line x1="40" y1="190" x2="660" y2="190" stroke="var(--border-light)" stroke-width="1" />
      <line x1="40" y1="120" x2="660" y2="120" stroke="var(--border-light)" stroke-dasharray="4" stroke-width="1" />
      <line x1="40" y1="50" x2="660" y2="50" stroke="var(--border-light)" stroke-dasharray="4" stroke-width="1" />

      <polyline fill="none" stroke="#2563eb" stroke-width="3" points="${pointsIncoming}" />
      <polyline fill="none" stroke="#10b981" stroke-width="3" stroke-dasharray="5 3" points="${pointsResolved}" />

      ${labels}
    </svg>`;
}

// --- THEME TOGGLE ---
function toggleAppTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', nextTheme);

  const icon = document.getElementById('theme-toggle-icon');
  if (icon) icon.textContent = nextTheme === 'dark' ? '☀️' : '🌙';

  renderAnalyticsCharts(); // Redraw SVG charts to adapt theme colors
  showToast(`Switched to ${nextTheme.toUpperCase()} mode`);
}

// --- TOAST NOTIFICATIONS ---
function showToast(msg) {
  const toast = document.getElementById('toast-element');
  const msgEl = document.getElementById('toast-message');
  if (!toast || !msgEl) return;

  msgEl.textContent = msg;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}
