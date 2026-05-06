/**
 * Hospital Information System - Shared JavaScript
 * Nursing Informatics School Project
 * 
 * This file contains shared utilities for:
 * - User label display
 * - localStorage helpers
 * - Simple navigation
 */

// ============================================
// User Display
// ============================================

/**
 * Updates the user label in the header with the logged-in nurse's name.
 * Call this on pages that have a #userLabel element.
 */
function updateUserLabel() {
  const userLabel = document.getElementById('userLabel');
  const userAvatar = document.getElementById('userAvatar');
  const username = localStorage.getItem('his_username');
  if (userLabel) {
    userLabel.textContent = username ? 'Nurse: ' + username : 'Nurse Dashboard';
  }
  if (userAvatar) {
    userAvatar.textContent = username ? username.charAt(0).toUpperCase() : 'N';
  }
}

// ============================================
// localStorage Helpers
// ============================================

/**
 * Gets data from localStorage as parsed JSON array.
 * Returns empty array if key doesn't exist or parse fails.
 * @param {string} key - localStorage key
 * @returns {Array} Parsed data array
 */
function getStoredData(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Saves data to localStorage as JSON.
 * @param {string} key - localStorage key
 * @param {Array|Object} data - Data to store
 */
function setStoredData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ============================================
// Text Formatting Helpers (for multiline notes)
// ============================================

/**
 * Escapes HTML special characters in a string.
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Formats multiline text so that line breaks (e.g. bullet lists)
 * entered in textareas are shown as separate lines in tables / summaries.
 * @param {string} text
 * @returns {string}
 */
function formatMultiline(text) {
  const safe = escapeHtml(text);
  return safe.replace(/\n/g, '<br>');
}

/**
 * Formats single-line text while safely escaping HTML.
 * Does NOT insert <br> tags.
 * @param {string} text
 * @returns {string}
 */
function formatPlainText(text) {
  return escapeHtml(text);
}

// ============================================
// Patient Helpers (Multi-patient support)
// ============================================

/**
 * Returns array of all patients.
 * Each patient has at least: id, name, age, gender, address, contact, dateAdmitted.
 */
function getPatients() {
  return getStoredData('his_patients');
}

/**
 * Persists the patients array to localStorage.
 * @param {Array} patients
 */
function savePatients(patients) {
  setStoredData('his_patients', patients || []);
}

/**
 * Returns ID of currently selected patient, or null.
 */
function getSelectedPatientId() {
  return localStorage.getItem('his_selected_patient_id');
}

/**
 * Sets the currently selected patient ID (or clears it if falsy).
 * @param {string|null} id
 */
function setSelectedPatientId(id) {
  if (id) {
    localStorage.setItem('his_selected_patient_id', id);
  } else {
    localStorage.removeItem('his_selected_patient_id');
  }
}

/**
 * Returns the currently selected patient object, or null.
 */
function getSelectedPatient() {
  const id = getSelectedPatientId();
  if (!id) return null;
  const patients = getPatients();
  return patients.find(p => p.id === id) || null;
}

/**
 * Normalizes a stored age field into a consistent object form.
 * Accepts legacy values (number/string) and new object form ({ value, unit }).
 * Returns either { value: number, unit: 'years'|'months' } or null.
 */
function normalizeAgeObject(rawAge) {
  if (rawAge === null || rawAge === undefined || rawAge === '') return null;

  if (typeof rawAge === 'object') {
    const v = Number(rawAge.value);
    if (!isFinite(v) || v <= 0) return null;
    const unitRaw = (rawAge.unit || 'years').toString().toLowerCase();
    const unit = unitRaw.startsWith('month') ? 'months' : 'years';
    return { value: v, unit: unit };
  }

  const v = Number(rawAge);
  if (!isFinite(v) || v <= 0) return null;
  return { value: v, unit: 'years' };
}

/**
 * Formats a patient's age (supports legacy and new formats) into readable text.
 * Examples: "8 months", "2 years".
 */
function formatPatientAge(rawAge) {
  const ageObj = normalizeAgeObject(rawAge);
  if (!ageObj) return '';
  const isMonths = ageObj.unit === 'months';
  const singular = isMonths ? 'month' : 'year';
  const plural = isMonths ? 'months' : 'years';
  const label = ageObj.value === 1 ? singular : plural;
  return ageObj.value + ' ' + label;
}

// ============================================
// Dashboard Helpers
// ============================================

/**
 * Updates high-level dashboard stats from localStorage.
 * Safe to call from any page; only updates if elements are present.
 * Alias: updateDashboardStats (for backward compatibility).
 */
function refreshDashboardStats() {
  const patients = getPatients();
  const vitalsCount = getStoredData('his_vital_signs').length;
  const medsCount = getStoredData('his_medication').length;
  const labCount = getStoredData('his_laboratory').length;
  const carePlansCount = getStoredData('his_nursing_care_plan').length;

  const elPatients = document.getElementById('statPatients');
  const elVitals = document.getElementById('statVitals');
  const elMeds = document.getElementById('statMedications');
  const elLab = document.getElementById('statLab');
  const elCarePlans = document.getElementById('statCarePlans');

  if (elPatients) elPatients.textContent = patients.length;
  if (elVitals) elVitals.textContent = vitalsCount;
  if (elMeds) elMeds.textContent = medsCount;
  if (elLab) elLab.textContent = labCount;
  if (elCarePlans) elCarePlans.textContent = carePlansCount;
}

// Backward-compatible alias
function updateDashboardStats() {
  refreshDashboardStats();
}

/**
 * Rebuilds the "Recent Patient Records" activity table from localStorage.
 * Safe to call from any page; only updates if the table body exists.
 * Alias: updateRecentActivity (for backward compatibility).
 */
function renderRecentActivity() {
  const tbody = document.getElementById('recentActivityBody');
  if (!tbody) return;

  const activities = [];

  const patients = getPatients();
  const patientMap = {};
  patients.forEach(p => {
    patientMap[p.id] = p.name || 'Patient';
  });

  if (patients.length > 0) {
    const lastPatient = patients[patients.length - 1];
    activities.push({
      name: lastPatient.name || 'Patient',
      module: 'Patient Profile',
      time: lastPatient.dateAdmitted || 'N/A',
      status: 'Active'
    });
  }

  const vitals = getStoredData('his_vital_signs');
  if (vitals.length > 0) {
    const last = vitals[vitals.length - 1];
    const patientName = patientMap[last.patientId] || 'Patient';
    activities.push({
      name: patientName,
      module: 'Vital Signs',
      time: (last.date || '') + (last.time ? ' ' + last.time : ''),
      status: 'Recorded'
    });
  }

  const meds = getStoredData('his_medication');
  if (meds.length > 0) {
    const last = meds[meds.length - 1];
    const patientName = patientMap[last.patientId] || 'Patient';
    activities.push({
      name: patientName,
      module: 'Medication',
      time: last.timeGiven || 'N/A',
      status: 'Administered'
    });
  }

  const labData = getStoredData('his_laboratory');
  if (labData.length > 0) {
    const last = labData[labData.length - 1];
    const patientName = patientMap[last.patientId] || 'Patient';
    activities.push({
      name: patientName,
      module: 'Laboratory',
      time: last.date || 'N/A',
      status: 'Completed'
    });
  }

  const ioData = getStoredData('his_intake_output');
  if (ioData.length > 0) {
    const last = ioData[ioData.length - 1];
    const patientName = patientMap[last.patientId] || 'Patient';
    activities.push({
      name: patientName,
      module: 'Intake / Output',
      time: (last.date || '') + (last.time ? ' ' + last.time : ''),
      status: 'Recorded'
    });
  }

  const carePlans = getStoredData('his_nursing_care_plan');
  if (carePlans.length > 0) {
    const last = carePlans[carePlans.length - 1];
    const patientName = patientMap[last.patientId] || 'Patient';
    activities.push({
      name: patientName,
      module: 'Care Plan',
      time: 'Recent',
      status: 'Active'
    });
  }

  const orders = getStoredData('his_doctor_orders');
  if (orders.length > 0) {
    const last = orders[orders.length - 1];
    const patientName = patientMap[last.patientId] || 'Patient';
    activities.push({
      name: patientName,
      module: 'Doctor Orders',
      time: (last.date || '') + (last.time ? ' ' + last.time : ''),
      status: 'Ordered'
    });
  }

  const nurseNotes = getStoredData('his_nurse_notes');
  if (nurseNotes.length > 0) {
    const last = nurseNotes[nurseNotes.length - 1];
    const patientName = patientMap[last.patientId] || 'Patient';
    activities.push({
      name: patientName,
      module: 'Nurse Notes',
      time: (last.date || '') + (last.time ? ' ' + last.time : ''),
      status: 'Noted'
    });
  }

  if (activities.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 32px;">No records available.</td></tr>';
  } else {
    tbody.innerHTML = activities.slice(-5).reverse().map(a => `
      <tr>
        <td><strong>${a.name}</strong></td>
        <td>${a.module}</td>
        <td>${a.time}</td>
        <td><span style="background: rgba(34,197,94,0.15); color: #16a34a; padding: 4px 10px; border-radius: 6px; font-size: 0.85rem;">${a.status}</span></td>
      </tr>
    `).join('');
  }
}

// Backward-compatible alias
function updateRecentActivity() {
  renderRecentActivity();
}

/**
 * Public helper to fully refresh dashboard stats and recent activity from localStorage.
 */
function refreshDashboard() {
  refreshDashboardStats();
  renderRecentActivity();
}

/**
 * Clears all stored HIS data for this browser (patients and all modules)
 * and refreshes the dashboard widgets.
 * Does NOT clear the logged-in username so the session remains.
 */
function clearAllHisData() {
  try {
    [
      'his_patients',
      'his_vital_signs',
      'his_medication',
      'his_laboratory',
      'his_nursing_care_plan',
      'his_doctor_orders',
      'his_intake_output',
      'his_nurse_notes',
      'his_selected_patient_id'
    ].forEach(function(key) {
      localStorage.removeItem(key);
    });
  } catch (e) {
    // ignore storage errors in simulation
  }
  refreshDashboard();
}

// Auto-refresh dashboard widgets when data changes in another tab/window.
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('storage', function(event) {
    if (!event.key) return;
    if ([
      'his_patients',
      'his_vital_signs',
      'his_medication',
      'his_laboratory',
      'his_nursing_care_plan',
      'his_doctor_orders',
      'his_intake_output',
      'his_nurse_notes'
    ].indexOf(event.key) !== -1) {
      refreshDashboard();
    }
  });
}

/**
 * Populates a <select> with patient options and wires up selection handling.
 * @param {string|HTMLSelectElement} selectElementOrId - element or its ID
 * @param {Object} options
 * @param {Function} [options.onChange] - called when selection changes, with patientId (or '' if none)
 */
function populatePatientSelect(selectElementOrId, options) {
  const opts = options || {};
  const selectEl = typeof selectElementOrId === 'string'
    ? document.getElementById(selectElementOrId)
    : selectElementOrId;
  if (!selectEl) return;

  const patients = getPatients();
  const selectedId = getSelectedPatientId();

  let html = '<option value="">Select patient</option>';
  html += patients.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  selectEl.innerHTML = html;

  if (selectedId) {
    selectEl.value = selectedId;
  }

  selectEl.addEventListener('change', function() {
    const value = selectEl.value;
    if (value) {
      setSelectedPatientId(value);
    } else {
      setSelectedPatientId(null);
    }
    if (typeof opts.onChange === 'function') {
      opts.onChange(value);
    }
  });
}

// ============================================
// Navigation
// ============================================

/**
 * Marks the current page as active in the sidebar navigation.
 * Call with the current page filename (e.g. 'patient-profile.html').
 * @param {string} currentPage - Current page filename
 */
function setActiveNav(currentPage) {
  const links = document.querySelectorAll('.sidebar-nav a');
  links.forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// ============================================
// Session Helpers
// ============================================
/**
 * Logs out the current user (simulation only).
 * Clears session-like data and redirects to login.html.
 */
function hisLogout() {
  try {
    localStorage.removeItem('his_username');
    localStorage.removeItem('his_selected_patient_id');
  } catch (e) {
    // ignore storage errors in simulation
  }
  window.location.href = 'index.html';
}

// ============================================
// Initialize on DOM Ready
// ============================================

// Update header date/time (for pages with headerDateTime element)
function updateHeaderDateTime() {
  const el = document.getElementById('headerDateTime');
  if (el) {
    const now = new Date();
    el.textContent = now.toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }
}

// Update user label when script loads (for pages with dashboard layout)
document.addEventListener('DOMContentLoaded', function() {
  updateUserLabel();
  updateHeaderDateTime();
  if (document.getElementById('headerDateTime')) {
    setInterval(updateHeaderDateTime, 1000);
  }
});

// Simple session guard and logout wiring (simulation only)
document.addEventListener('DOMContentLoaded', function() {
  const path = window.location.pathname || '';
  const currentPage = path.split('/').pop() || '';
  const username = localStorage.getItem('his_username');

  // Require login for all pages except login.html
  if (currentPage !== 'login.html' && !username) {
    window.location.href = 'login.html';
    return;
  }

  const logoutBtn = document.getElementById('logoutButton');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', hisLogout);
  }
});