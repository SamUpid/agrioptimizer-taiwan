/**
 * farm-actions.js
 * Save/remove crops and coffees from the user's farm profile
 * Loaded globally — works on crops.ejs, coffee.ejs, dashboard.ejs
 */

// ── CROPS ─────────────────────────────────────────────────────
async function saveCrop(cropName, cropNameZh, imageUrl, altitudeZone, cropId, btn) {
  btn.disabled = true;
  btn.textContent = '…';
  try {
    const res  = await fetch('/crops/save', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ cropName, cropNameZh, imageUrl, altitudeZone, cropId })
    });
    const data = await res.json();
    if (data.success) {
      // Step 1: show sky blue Saved button
      btn.textContent  = '✓ Saved';
      btn.disabled     = false;
      btn.style.background    = '#38BDF8';
      btn.style.borderColor   = '#38BDF8';
      btn.style.color         = '#FFFFFF';
      btn.style.cursor        = 'default';
      btn.onclick      = null;

      // Step 2: reload after 1.5s so Remove button appears
      setTimeout(() => location.reload(), 1500);
    } else {
      alert(data.message);
      btn.disabled    = false;
      btn.textContent = '+ Save';
    }
  } catch (err) {
    console.error('saveCrop error:', err);
    alert('Error saving crop. Please try again.');
    btn.disabled    = false;
    btn.textContent = '+ Save';
  }
}

async function removeCrop(cropName, btn) {
  if (!confirm('Remove ' + cropName + ' from your farm? | 確認移除？')) return;
  btn.disabled    = true;
  btn.textContent = '…';
  try {
    const res  = await fetch('/crops/remove', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ cropName })
    });
    const data = await res.json();
    if (data.success) {
      // Try to remove the row if on dashboard
      const rowId = 'crop-row-' + cropName.replace(/\s+/g, '_');
      const row   = document.getElementById(rowId);
      if (row) {
        row.remove();
        setTimeout(() => location.reload(), 300);
      } else {
        // On crops page — reload so button gets correct zone from EJS
        location.reload();
      }
      // Re-enable add buttons if under cap
      if (!data.atCap) {
        document.querySelectorAll('button[disabled]').forEach(b => {
          if (b.title && b.title.includes('Maximum')) {
            b.disabled = false;
            b.title    = '';
          }
        });
      }
    } else {
      alert(data.message);
      btn.disabled    = false;
      btn.textContent = '✓ Saved';
    }
  } catch (err) {
    console.error('removeCrop error:', err);
    alert('Error removing crop. Please try again.');
    btn.disabled    = false;
    btn.textContent = '✓ Saved';
  }
}

// ── COFFEES ────────────────────────────────────────────────────
async function saveCoffee(coffeeName, coffeeNameZh, imageUrl, variety, altitudeZone, coffeeId, btn) {
  btn.disabled    = true;
  btn.textContent = '…';
  try {
    const res  = await fetch('/coffee/save', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ coffeeName, coffeeNameZh, imageUrl, variety, altitudeZone, coffeeId })
    });
    const data = await res.json();
    if (data.success) {
      // Step 1: show sky blue Saved button
      btn.textContent  = '✓ Saved';
      btn.disabled     = false;
      btn.style.background    = '#38BDF8';
      btn.style.borderColor   = '#38BDF8';
      btn.style.color         = '#FFFFFF';
      btn.style.cursor        = 'default';
      btn.onclick      = null;

      // Step 2: reload after 1.5s so Remove button appears
      setTimeout(() => location.reload(), 1500);
    } else {
      alert(data.message);
      btn.disabled    = false;
      btn.textContent = '+ Save';
    }
  } catch (err) {
    console.error('saveCoffee error:', err);
    alert('Error saving coffee. Please try again.');
    btn.disabled    = false;
    btn.textContent = '+ Save';
  }
}

async function removeCoffee(coffeeName, btn) {
  if (!confirm('Remove ' + coffeeName + '? | 確認移除？')) return;
  btn.disabled    = true;
  btn.textContent = '…';
  try {
    const res  = await fetch('/coffee/remove', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ coffeeName })
    });
    const data = await res.json();
    if (data.success) {
      const rowId = 'coffee-row-' + coffeeName.replace(/\s+/g, '_');
      const row   = document.getElementById(rowId);
      if (row) {
        row.remove();
        setTimeout(() => location.reload(), 300);
      } else {
        // Reload so button gets correct zone from EJS
        location.reload();
      }
    } else {
      alert(data.message);
      btn.disabled    = false;
      btn.textContent = '✓ Saved';
    }
  } catch (err) {
    console.error('removeCoffee error:', err);
    alert('Error removing coffee. Please try again.');
    btn.disabled    = false;
    btn.textContent = '✓ Saved';
  }
}

// ── DASHBOARD: Farm name edit ──────────────────────────────────
function startEditFarmName() {
  const display = document.getElementById('farm-name-display');
  const edit    = document.getElementById('farm-name-edit');
  if (display) display.style.display = 'none';
  if (edit)    edit.style.display    = 'block';
  const input = document.getElementById('farm-name-input');
  if (input)   input.focus();
}

function cancelEditFarmName() {
  const display = document.getElementById('farm-name-display');
  const edit    = document.getElementById('farm-name-edit');
  if (display) display.style.display = 'flex';
  if (edit)    edit.style.display    = 'none';
}

async function saveFarmName() {
  const input = document.getElementById('farm-name-input');
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;
  try {
    const res  = await fetch('/dashboard/update-farm-name', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ farmName: val })
    });
    const data = await res.json();
    if (data.success) {
      const nameEl = document.querySelector('.farm-name-text');
      if (nameEl) nameEl.textContent = '🏡 ' + data.farmName;
      cancelEditFarmName();
    } else {
      alert(data.message);
    }
  } catch {
    alert('Failed to save farm name.');
  }
}

// ── DASHBOARD: Location modal ──────────────────────────────────
function showLocationModal() {
  const m = document.getElementById('location-modal');
  if (m) m.classList.add('show');
}

function closeLocationModal() {
  const m = document.getElementById('location-modal');
  if (m) m.classList.remove('show');
}

function confirmLocationChange() {
  closeLocationModal();
  window.location.href = '/location';
}

// ── DASHBOARD: AI Daily Brief ────────────────────────────────
async function loadAIBrief() {
  const el = document.getElementById('ai-brief-text');
  if (!el) return;

  try {
    const res  = await fetch('/dashboard/api/summary');
    const data = await res.json();

    if (data.success && data.data?.summary) {
      // Summary is "English text\nChinese text" — render as two lines
      const parts = data.data.summary.split('\n').filter(Boolean);
      el.innerHTML = parts.map(p => `<p class="ai-brief-line">${p}</p>`).join('');
    } else {
      el.innerHTML = `<p class="ai-brief-line">${data.message || 'Unable to load your daily brief right now.'}</p>`;
    }
  } catch (err) {
    el.innerHTML = '<p class="ai-brief-line">Unable to load your daily brief right now. 無法載入本日摘要。</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadAIBrief();
});