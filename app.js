(function () {
  var STORAGE_CHECK = 'pfclaimkit-check-v1';
  var STORAGE_WAIT = 'pfclaimkit-wait-v1';
  var ITEMS = [
    { id: 'uan-active', label: 'UAN activated; mobile used for activation still works' },
    { id: 'aadhaar', label: 'Aadhaar seeded in EPFO; Aadhaar-linked mobile ready for OTP eKYC' },
    { id: 'bank', label: 'Bank account + IFSC seeded in EPFO (matches a cancelled cheque you can show)' },
    { id: 'pan', label: 'PAN seeded (needed for Form 19 online if total service is under 5 years)' },
    { id: 'doj', label: 'Date of joining visible against your member ID in Member Interface' },
    { id: 'doe', label: 'Date of exit updated by employer / visible in EPFO database' },
    { id: 'not-employed', label: 'Not currently employed under another PF-covered establishment (if filing Form 19 online)' },
    { id: 'wait-2m', label: 'At least two months have passed since date of exit (Form 19 online timing)' },
    { id: 'form19', label: 'Decide: Form 19 / PF final settlement needed? (or mark N/A if transferring)' },
    { id: 'form10c', label: 'Decide: Form 10C withdrawal benefit or Scheme Certificate? (check service length on portal)' },
    { id: 'transfer', label: 'Considered transfer to new employer instead of withdrawal (if joining soon)' },
    { id: 'cheque', label: 'Cancelled cheque / clear bank proof ready if portal or office asks' },
    { id: 'relieving', label: 'Relieving / exit letter saved for your records (employer may need it for DOE)' },
    { id: 'portal', label: 'Can log in to Member Interface -> Online Services -> Claim (Form 31/19/10C/10D)' }
  ];

  function loadJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function saveJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  function renderChecklist() {
    var state = loadJSON(STORAGE_CHECK, {});
    var box = document.getElementById('check-list');
    box.innerHTML = '';
    ITEMS.forEach(function (item) {
      var row = document.createElement('label');
      row.className = 'check-row';
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = !!state[item.id];
      cb.addEventListener('change', function () {
        state[item.id] = cb.checked;
        saveJSON(STORAGE_CHECK, state);
        updateStatus(state);
      });
      var span = document.createElement('span');
      span.textContent = item.label;
      row.appendChild(cb);
      row.appendChild(span);
      box.appendChild(row);
    });
    updateStatus(state);
  }

  function updateStatus(state) {
    var done = ITEMS.filter(function (i) { return state[i.id]; }).length;
    document.getElementById('check-status').textContent =
      done + ' of ' + ITEMS.length + ' items ready on this device.';
  }

  function addMonths(date, months) {
    var d = new Date(date.getTime());
    var day = d.getDate();
    d.setMonth(d.getMonth() + months);
    if (d.getDate() < day) {
      d.setDate(0);
    }
    return d;
  }

  function formatDate(d) {
    if (!d || isNaN(d.getTime())) return '-';
    return d.toISOString().slice(0, 10);
  }

  function calcWait() {
    var input = document.getElementById('exit-date');
    var notes = document.getElementById('exit-notes');
    var out = document.getElementById('wait-result');
    if (!input.value) {
      out.textContent = 'Enter an exit date first.';
      return;
    }
    var exit = new Date(input.value + 'T00:00:00');
    if (isNaN(exit.getTime())) {
      out.textContent = 'Invalid date.';
      return;
    }
    var earliest = addMonths(exit, 2);
    out.textContent = formatDate(earliest) +
      ' (exit ' + formatDate(exit) + ' + 2 calendar months). Confirm on EPFO Member Interface before filing.';
    saveJSON(STORAGE_WAIT, { exit: input.value, notes: notes.value || '', earliest: formatDate(earliest) });
  }

  function loadWait() {
    var w = loadJSON(STORAGE_WAIT, {});
    if (w.exit) document.getElementById('exit-date').value = w.exit;
    if (w.notes) document.getElementById('exit-notes').value = w.notes;
    if (w.earliest) {
      document.getElementById('wait-result').textContent =
        w.earliest + ' (saved on this device). Confirm on EPFO Member Interface before filing.';
    }
  }

  function exportSummary() {
    var state = loadJSON(STORAGE_CHECK, {});
    var w = loadJSON(STORAGE_WAIT, {});
    var lines = [
      'PF Claim Kit summary (not EPFO advice)',
      'Generated locally - ' + new Date().toISOString().slice(0, 10),
      '',
      'Checklist:'
    ];
    ITEMS.forEach(function (i) {
      lines.push((state[i.id] ? '[x] ' : '[ ] ') + i.label);
    });
    lines.push('');
    lines.push('Wait helper:');
    lines.push('Exit date: ' + (w.exit || '-'));
    lines.push('Earliest Form 19 reminder: ' + (w.earliest || '-'));
    lines.push('Notes: ' + (w.notes || '-'));
    lines.push('');
    lines.push('File only via https://unifiedportal-mem.epfindia.gov.in/memberinterface/');
    var text = lines.join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        document.getElementById('check-status').textContent = 'Summary copied to clipboard.';
      }).catch(function () {
        window.prompt('Copy this summary:', text);
      });
    } else {
      window.prompt('Copy this summary:', text);
    }
  }

  document.getElementById('btn-export').addEventListener('click', exportSummary);
  document.getElementById('btn-print').addEventListener('click', function () { window.print(); });
  document.getElementById('btn-reset-check').addEventListener('click', function () {
    saveJSON(STORAGE_CHECK, {});
    renderChecklist();
  });
  document.getElementById('btn-calc-wait').addEventListener('click', calcWait);
  document.getElementById('btn-clear-wait').addEventListener('click', function () {
    saveJSON(STORAGE_WAIT, {});
    document.getElementById('exit-date').value = '';
    document.getElementById('exit-notes').value = '';
    document.getElementById('wait-result').textContent = '-';
  });

  renderChecklist();
  loadWait();
})();
