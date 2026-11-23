'use strict';

const categories = { A: '專案經驗', B: '合作方式', C: '閒聊交流' };
const basics = [
  ['name', '姓名', '輸入面試者姓名'],
  ['date', '日期', ''],
];
const summaries = [
  ['traits', '面試者特質', '擅長梳理資訊，會主動調整原本的做法。她提到有一次看完客服回饋後，重新整理了頁面上的資訊順序。'],
  ['teamFit', '團隊合作契合度', '合作方式跟我們滿接近的。遇到互動做不出來時，會直接拿原型找工程師一起看，再討論哪些細節要保留。'],
];
const legacyFields = [
  ['basic', 'interviewer', '面試官'],
  ['basic', 'project', '主要討論作品'],
  ['summary', 'strengths', '最有把握的兩項'],
  ['summary', 'support', '需要支持或想再確認的一項'],
  ['summary', 'complement', '和目前團隊最互補的地方'],
  ['summary', 'exchange', '雙向交流備註'],
];
const icons = {
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  archive: '<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v11h14V9m-9 4h4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>',
  clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2M8 11h8m-8 5h6"/>',
  messages: '<path d="M14 15H7l-4 3V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5m-11-2h6"/><path d="M12 18h5l4 3v-9a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2Z"/>',
  note: '<path d="M14 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9l-7 7Zm0 0v-5a2 2 0 0 1 2-2h5M7 8h10M7 12h5"/>',
  edit: '<path d="m14 5 5 5M4 20l5-1 11-11a2 2 0 0 0-4-4L5 15l-1 5Z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  up: '<path d="m6 15 6-6 6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  grip: '<path d="M5 7h14M5 12h14M5 17h14"/>',
  trash: '<path d="M4 6h16m-10 0V3h4v3m4 0-1 15H7L6 6m4 4v7m4-7v7"/>',
};

const $ = selector => document.querySelector(selector);
const clone = value => structuredClone(value);
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));
const icon = name => `<span data-icon="${name}"></span>`;
const button = (label, classes = '', attributes = '', glyph = '') =>
  `<button type="button" class="button ${classes}" ${attributes}>${glyph ? icon(glyph) : ''}${label}</button>`;

function drawIcons(root) {
  for (const element of root.querySelectorAll('[data-icon]:empty')) {
    element.setAttribute('aria-hidden', 'true');
    element.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[element.dataset.icon]}</svg>`;
  }
}

const storageKey = 'app-uiux-interview-studio-v1';
function readData() {
  const saved = localStorage.getItem(storageKey);
  return saved ? JSON.parse(saved) : {
    template: clone(seed.items), questions: clone(seed.questions), records: [],
    lastId: { E: 8, A: 8, B: 5, C: 6 },
  };
}

let storageMessage = '';
let data;
try {
  data = readData();
} catch {
  data = { template: clone(seed.items), questions: clone(seed.questions), records: [], lastId: { E: 8, A: 8, B: 5, C: 6 } };
  storageMessage = '無法讀取本機資料。請確認瀏覽器允許本機儲存。';
}

function persist(update) {
  try {
    const next = readData();
    update(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
    data = next;
    return true;
  } catch {
    const message = '無法儲存，請確認瀏覽器允許本機儲存且有足夠空間。';
    if (dialog.open) {
      const error = $('#dialog-error') || document.createElement('div');
      error.id = 'dialog-error';
      error.setAttribute('role', 'alert');
      error.className = 'dialog-error';
      error.textContent = message;
      $('#dialog-body').append(error);
      error.scrollIntoView({ block: 'nearest' });
    } else notify(message);
    return false;
  }
}

function refreshData() {
  try { data = readData(); } catch { /* Keep the currently available copy. */ }
}

function blankInterview() {
  return {
    id: null,
    basic: Object.fromEntries(basics.map(([key]) => [key, ''])),
    summary: Object.fromEntries(summaries.map(([key]) => [key, ''])),
    items: data.template.map(({ id, title, criteria }) => ({ id, title, criteria, score: '', example: '' })),
    notes: '',
  };
}

function fromLegacyRecord(record) {
  return {
    id: record.id,
    basic: { name: record.basic.name, date: record.basic.date },
    summary: { traits: '', teamFit: '' },
    items: record.items.map(({ id, title, criteria, score, example }) => ({ id, title, criteria, score, example })),
    notes: record.notes,
    updatedAt: record.updatedAt,
    legacy: legacyFields.flatMap(([group, key, label]) => {
      const value = record[group]?.[key];
      return typeof value === 'string' && value.length ? [{ label, value }] : [];
    }),
  };
}

let interview = blankInterview();
let dirty = false;
let activeCategory = 'A';
let toastTimer;
const openedQuestions = new Set();
const dialog = $('#dialog');
const scoreForm = $('#score-form');
const notes = $('#notes');
const tabs = $('#tabs');
const questions = $('#questions');
const saveButton = $('#save-interview');
const newButton = $('#new-interview');
const recordsButton = $('#records-link');

function notify(message) {
  const toast = $('#toast');
  clearTimeout(toastTimer);
  toast.textContent = message;
  toastTimer = setTimeout(() => { toast.textContent = ''; }, 4500);
}

function field(label, attributes, value, options = {}) {
  const { rows, type = 'text', placeholder = '' } = options;
  const control = rows
    ? `<textarea rows="${rows}" ${attributes} placeholder="${escape(placeholder)}">\n${escape(value)}</textarea>`
    : `<input type="${type}" ${attributes} value="${escape(value)}" placeholder="${escape(placeholder)}">`;
  return `<label class="field"><span class="field-label">${label}</span>${control}</label>`;
}

function scoreName(value) {
  return seed.scale.find(option => option.value === value)?.label || '尚未評分';
}

function renderScoreForm() {
  const items = interview.items.map(item => {
    const choices = seed.scale.map(({ value, label, description }) => `
      <label class="score-choice ${value === 'pending' ? 'pending' : ''}" title="${escape(description)}">
        <input type="radio" name="score-${item.id}" data-score="${item.id}" value="${value}" aria-label="${label}" ${value === item.score ? 'checked' : ''}>
        <span aria-hidden="true">${value === 'pending' ? label : value}</span>
      </label>`).join('');
    return `<article class="assessment-item">
      <div class="item-heading"><span class="code">${item.id}</span><h3 id="item-${item.id}">${escape(item.title)}</h3></div>
      <p class="criteria">${escape(item.criteria)}</p>
      <fieldset class="score-options">
        <legend class="sr-only">${escape(item.title)}評分</legend>
        ${choices}<span class="score-indicator" id="score-status-${item.id}">${scoreName(item.score)}</span>
        ${button('清除分數', 'compact clear-score', `data-clear-score="${item.id}" aria-label="清除${escape(item.title)}的分數" ${item.score ? '' : 'hidden'}`)}
      </fieldset>
      ${field('具體例子與結果', `data-example="${item.id}" aria-label="${escape(item.title)}的具體例子與結果"`, item.example, { rows: 2, placeholder: '記下面試者做了什麼、為什麼，以及後續結果' })}
    </article>`;
  }).join('');

  scoreForm.innerHTML = `
    <section class="panel form-panel">
      <h3 class="panel-title">面試者基本資料</h3>
      <div class="fields">${basics.map(([key, label, placeholder]) =>
        field(label, `data-basic="${key}"`, interview.basic[key], { type: key === 'date' ? 'date' : 'text', placeholder })).join('')}</div>
    </section>
    <section class="panel assessment">
      <div class="assessment-header"><h3 class="panel-title">評量項目</h3>${button('評分標準', 'compact', 'id="scale-guide"', 'info')}</div>
      ${items || '<p class="empty">這場面試沒有評量項目。</p>'}
    </section>
    <section class="panel form-panel">
      <h3 class="panel-title">面試後摘要</h3>
      <div class="fields summary-fields">${summaries.map(([key, label, placeholder]) =>
        field(label, `data-summary="${key}"`, interview.summary[key], { rows: 4, placeholder })).join('')}</div>
    </section>
    ${interview.legacy?.length ? `<details class="panel form-panel legacy-fields">
      <summary class="panel-title">舊版欄位</summary>
      <dl>${interview.legacy.map(({ label, value }) => `<dt>${escape(label)}</dt><dd>${escape(value)}</dd>`).join('')}</dl>
    </details>` : ''}`;
  drawIcons(scoreForm);
}

function renderStatus() {
  const title = interview.basic.name.trim() || (interview.id ? '面試紀錄' : '新面試');
  let status = `${interview.items.length} 項評量`;
  if (dirty) status = '有未儲存變更';
  else if (interview.id) status = '已儲存';
  $('#interview-status').textContent = `${title} · ${status}`;
}

function renderQuestions() {
  $('#question-total').textContent = `${data.questions.length} 道題目 · 3 個分類`;
  tabs.innerHTML = Object.entries(categories).map(([key, label]) => {
    const count = data.questions.filter(question => question.category === key).length;
    const selected = key === activeCategory;
    return `<button type="button" class="tab" role="tab" id="tab-${key}" data-category="${key}" aria-controls="questions" aria-selected="${selected}" tabindex="${selected ? '0' : '-1'}">${label}<span class="tab-count">${count}</span></button>`;
  }).join('');
  const visible = data.questions.filter(question => question.category === activeCategory);
  questions.setAttribute('role', 'tabpanel');
  questions.setAttribute('aria-labelledby', `tab-${activeCategory}`);
  questions.tabIndex = 0;
  questions.innerHTML = visible.map(question => {
    const matches = question.assessments.map(id => {
      const match = interview.items.find(item => item.id === id) || data.template.find(item => item.id === id);
      return match ? `${id} ${match.title}` : id;
    });
    const parts = [
      [question.category === 'C' ? '延伸話題' : '追問', question.followup],
      ['觀察重點', question.observation],
      ['對應評量項目', matches.join('、')],
    ].filter(([, content]) => Boolean(content));
    return `<details class="question" id="question-${question.id}" ${openedQuestions.has(question.id) ? 'open' : ''}>
      <summary><span class="code">${question.id}</span><span><span class="question-title">${escape(question.title)}</span><span class="question-prompt">${escape(question.prompt)}</span></span>${icon('chevron')}</summary>
      <div class="question-details">${parts.map(([label, content]) => `<div><strong>${label}</strong>${escape(content)}</div>`).join('') || '<p>尚未加入延伸內容。</p>'}</div>
    </details>`;
  }).join('') || '<p class="empty">這個分類還沒有題目。</p>';
  questions.scrollTop = 0;
  drawIcons(questions);
}

function selectCategory(category, focus = false) {
  if (category !== activeCategory) {
    activeCategory = category;
    renderQuestions();
  }
  if (focus) $(`#tab-${category}`).focus();
}

tabs.addEventListener('click', event => {
  const tab = event.target.closest('[data-category]');
  if (tab) selectCategory(tab.dataset.category, true);
});

tabs.addEventListener('keydown', event => {
  const order = Object.keys(categories);
  const index = order.indexOf(activeCategory);
  const keys = { ArrowLeft: order.at(index - 1), ArrowRight: order[(index + 1) % order.length], Home: order[0], End: order.at(-1) };
  if (!Object.hasOwn(keys, event.key)) return;
  event.preventDefault();
  selectCategory(keys[event.key], true);
});

questions.addEventListener('toggle', event => {
  if (!event.target.matches('.question')) return;
  const id = event.target.id.replace('question-', '');
  if (event.target.open) openedQuestions.add(id);
  else openedQuestions.delete(id);
}, true);

function markChanged() {
  dirty = true;
  renderStatus();
}

scoreForm.addEventListener('input', event => {
  const { basic, summary, example, score } = event.target.dataset;
  const { value } = event.target;
  if (basic) interview.basic[basic] = value;
  if (summary) interview.summary[summary] = value;
  if (example) interview.items.find(item => item.id === example).example = value;
  if (score) {
    interview.items.find(item => item.id === score).score = value;
    $(`#score-status-${score}`).textContent = scoreName(value);
    $(`[data-clear-score="${score}"]`).hidden = false;
  }
  if (basic || summary || example || score) markChanged();
});

scoreForm.addEventListener('click', event => {
  const control = event.target.closest('button');
  if (!control) return;
  const { clearScore } = control.dataset;
  if (control.id === 'scale-guide') showScale();
  if (clearScore) {
    interview.items.find(item => item.id === clearScore).score = '';
    $(`[name="score-${clearScore}"]:checked`).checked = false;
    $(`#score-status-${clearScore}`).textContent = scoreName('');
    $(`[name="score-${clearScore}"]`).focus();
    control.hidden = true;
    markChanged();
  }
});

notes.addEventListener('input', () => {
  interview.notes = notes.value;
  markChanged();
});

function renderInterview() {
  renderScoreForm();
  renderStatus();
  renderQuestions();
  notes.value = interview.notes;
}

function maySwitchInterview() {
  return !dirty || window.confirm('目前的面試有未儲存變更。確定要離開這場面試？');
}

function openInterview(record) {
  interview = clone(record);
  dirty = false;
  activeCategory = 'A';
  openedQuestions.clear();
  renderInterview();
  window.scrollTo(0, 0);
}

newButton.addEventListener('click', () => {
  const message = dirty
    ? '目前的面試有未儲存變更。確認新增後，這些變更將會捨棄。'
    : '確認後會開啟一份空白面試表單。';
  showDialog('要新增面試嗎？', `<p>${message}</p>`,
    `${button('取消', '', 'id="cancel-new"')}<button type="submit" class="button primary">確認新增</button>`, () => {
      refreshData();
      dialog.close();
      openInterview(blankInterview());
      $('[data-basic="name"]').focus({ preventScroll: true });
    });
  $('#cancel-new').addEventListener('click', () => dialog.close());
  $('#cancel-new').focus();
});

saveButton.addEventListener('click', () => {
  const id = interview.id || crypto.randomUUID();
  const snapshot = clone({ ...interview, id, updatedAt: new Date().toISOString() });
  try {
    const pdf = makeInterviewPdf(snapshot, summaries, scoreName);
    downloadInterviewPdf(pdf, snapshot.basic);
  } catch {
    notify('PDF 生成失敗，請再試一次。');
    return;
  }

  const saved = persist(next => {
    const records = next.records ??= [];
    const index = records.findIndex(record => record.id === id);
    if (index === -1) records.push(snapshot);
    else records[index] = snapshot;
  });
  if (!saved) {
    notify('已送出 PDF 下載。瀏覽器內的面試紀錄儲存失敗。');
    return;
  }
  interview = snapshot;
  dirty = false;
  renderStatus();
  notify('已儲存面試紀錄，並送出 PDF 下載。');
});

window.addEventListener('beforeunload', event => {
  if (dirty) event.preventDefault();
});

function showDialog(title, body, actions = '', onSubmit = null) {
  $('#dialog-title').textContent = title;
  $('#dialog-body').innerHTML = body;
  $('#dialog-actions').innerHTML = actions;
  $('#dialog-form').onsubmit = event => {
    event.preventDefault();
    onSubmit?.();
  };
  drawIcons(dialog);
  dialog.showModal();
}

$('#close-dialog').addEventListener('click', () => dialog.close());

function showScale() {
  showDialog('評分標準', `<dl class="scale-guide">${seed.scale.map(option => `<div><dt>${option.label}</dt><dd>${option.description}</dd></div>`).join('')}</dl>`);
}

function showRecords() {
  refreshData();
  const entries = data.records || [];
  showDialog('面試紀錄', `
    <div class="record-search">${field('搜尋姓名或日期', 'id="record-search"', '', { placeholder: '例如：陳小明或 2026-11-20' })}</div>
    <div id="record-list"></div>`);
  const search = $('#record-search');
  const list = $('#record-list');

  function renderRecords() {
    const terms = search.value.trim().toLowerCase().split(/\s+/);
    const results = entries.filter(record => {
      const key = `${record.basic.name} ${record.basic.date}`.toLowerCase();
      return terms.every(term => key.includes(term));
    }).sort((a, b) => b.basic.date.localeCompare(a.basic.date) || b.updatedAt.localeCompare(a.updatedAt));
    list.innerHTML = results.map(record => `
      <button class="record" type="button" data-record="${escape(record.id)}">
        <strong>${escape(record.basic.name.trim() || '未填姓名')}</strong>
        <span class="record-date">${escape(record.basic.date || '未填日期')}</span>
      </button>`).join('') || `<p class="empty">${entries.length
      ? '找不到符合的面試紀錄。' : '還沒有可開啟的面試紀錄。'}</p>`;
  }

  renderRecords();
  search.addEventListener('input', renderRecords);
  search.focus();
  list.addEventListener('click', event => {
    const selection = event.target.closest('[data-record]');
    if (!selection || !maySwitchInterview()) return;
    const record = entries.find(entry => entry.id === selection.dataset.record);
    const hasCurrentSummary = Object.hasOwn(record.summary, 'traits') && Object.hasOwn(record.summary, 'teamFit');
    dialog.close();
    openInterview(hasCurrentSummary ? record : fromLegacyRecord(record));
    $('#score-heading').focus({ preventScroll: true });
    notify('已開啟面試紀錄');
  });
}

recordsButton.addEventListener('click', showRecords);
$('#workspace-link').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

function editorTool(label, action, glyph, disabled = false) {
  return `<button type="button" class="icon-button ${action === 'delete' ? 'danger' : ''}" data-editor-action="${action}" aria-label="${label}" title="${label}" ${disabled ? 'disabled' : ''}>${icon(glyph)}</button>`;
}

function enableTemplateDragging(list, moveItem) {
  const scrollArea = list.closest('.dialog-body');
  let drag;
  let frame = 0;

  function updateTarget() {
    const bounds = scrollArea.getBoundingClientRect();
    const inside = drag.x >= bounds.left && drag.x <= bounds.right
      && drag.y >= bounds.top && drag.y <= bounds.bottom;
    drag.marker?.removeAttribute('data-drop');
    const rows = Array.from(list.querySelectorAll('.template-row'));
    const before = rows.find(row => {
      const rect = row.getBoundingClientRect();
      return drag.y < rect.top + rect.height / 2;
    });
    drag.before = before?.dataset.sortId ?? null;
    drag.marker = inside ? before || rows.at(-1) : null;
    if (drag.marker) drag.marker.dataset.drop = before ? 'before' : 'after';
  }

  function scrollWhileDragging() {
    const bounds = scrollArea.getBoundingClientRect();
    const edge = 42;
    const nearTop = drag.y - bounds.top;
    const nearBottom = bounds.bottom - drag.y;
    if (drag.marker && nearTop < edge) scrollArea.scrollTop -= (edge - nearTop) / 3;
    if (drag.marker && nearBottom < edge) scrollArea.scrollTop += (edge - nearBottom) / 3;
    updateTarget();
    frame = requestAnimationFrame(scrollWhileDragging);
  }

  function finish(drop) {
    const { handle, pointerId, row, before, marker, active } = drag;
    drag = null;
    cancelAnimationFrame(frame);
    marker?.removeAttribute('data-drop');
    row.classList.remove('drag-source');
    if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId);
    if (drop && active && marker) moveItem(row.dataset.sortId, before);
  }

  list.addEventListener('pointerdown', event => {
    const handle = event.target.closest('.drag-handle');
    if (drag || !handle || handle.disabled || event.button !== 0 || !event.isPrimary) return;
    handle.focus({ preventScroll: true });
    handle.setPointerCapture(event.pointerId);
    drag = {
      handle, pointerId: event.pointerId, row: handle.closest('.template-row'),
      startY: event.clientY, active: false, x: event.clientX, y: event.clientY,
    };
  });

  list.addEventListener('pointermove', event => {
    if (event.pointerId !== drag?.pointerId) return;
    drag.x = event.clientX;
    drag.y = event.clientY;
    if (!drag.active) {
      if (Math.abs(drag.y - drag.startY) < 5) return;
      drag.active = true;
      drag.row.classList.add('drag-source');
      frame = requestAnimationFrame(scrollWhileDragging);
    }
    updateTarget();
  });

  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    list.addEventListener(type, event => {
      if (event.pointerId !== drag?.pointerId) return;
      if (type === 'pointerup' && drag.active) {
        drag.x = event.clientX;
        drag.y = event.clientY;
        updateTarget();
      }
      finish(type === 'pointerup');
    });
  }

  list.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !drag) return;
    event.preventDefault();
    finish(false);
  });
}

function showEditor(kind) {
  refreshData();
  const isTemplate = kind === 'template';
  const draft = clone(data[kind]);
  const highWaterMarks = { ...data.lastId };
  const opened = new Set();
  const idLabel = isTemplate ? '評量項目' : '題目';
  const title = isTemplate ? '編輯評量表' : '編輯題庫';

  function renderEditor() {
    const body = $('#editor-list');
    body.innerHTML = draft.map((entry, index) => {
      const categorySelect = `<label class="field"><span class="field-label">分類</span><select data-key="category">
        ${Object.entries(categories).map(([key, label]) => `<option value="${key}" ${key === entry.category ? 'selected' : ''}>${label}</option>`).join('')}
      </select></label>`;
      const card = `<details class="editor-card" data-entry="${entry.id}" ${opened.has(entry.id) ? 'open' : ''}>
        <summary><span class="code">${entry.id}</span><span data-entry-title>${escape(entry.title.trim() || `新${idLabel}`)}</span>${isTemplate ? '' : `<span class="column-meta" data-entry-category>${categories[entry.category]}</span>`}${icon('chevron')}</summary>
        <div class="editor-fields">
          ${isTemplate ? '' : categorySelect}
          ${field(isTemplate ? '項目名稱' : '主題', 'data-key="title" required', entry.title)}
          ${isTemplate
            ? field('判斷依據', 'data-key="criteria" required', entry.criteria, { rows: 3 })
            : ` ${field('主問題', 'data-key="prompt" required', entry.prompt, { rows: 2 })}
                ${field('追問或延伸話題', 'data-key="followup"', entry.followup, { rows: 2 })}
                ${field('觀察重點', 'data-key="observation"', entry.observation, { rows: 2 })}
                ${field('對應評量項目', 'data-key="assessments" list="assessment-codes" pattern="[Ee][0-9]+([、,，\\s]+[Ee][0-9]+)*"', entry.assessments.join('、'), { placeholder: '例如：E04、E08' })}`}
          <div class="editor-tools">
            ${editorTool('上移', 'up', 'up', !draft.slice(0, index).some(other => isTemplate || other.category === entry.category))}
            ${editorTool('下移', 'down', 'down', !draft.slice(index + 1).some(other => isTemplate || other.category === entry.category))}
            ${editorTool(`刪除${idLabel}`, 'delete', 'trash')}
          </div>
        </div>
      </details>`;
      if (!isTemplate) return card;
      return `<div class="template-row" data-sort-id="${entry.id}">
        <button type="button" class="icon-button drag-handle" aria-label="調整 ${entry.id} 的順序"
          aria-describedby="editor-hint" aria-keyshortcuts="ArrowUp ArrowDown" title="拖曳排序" ${draft.length < 2 ? 'disabled' : ''}>${icon('grip')}</button>
        ${card}
      </div>`;
    }).join('') || `<p class="empty">還沒有${idLabel}。</p>`;
    drawIcons(body);
  }

  const hint = isTemplate ? '拖曳左側三條線排序，也可在把手上按 ↑ 或 ↓。儲存後套用於新建面試。' : '可以用評量編號連結題目與評量，例如 E04、E08。';
  showDialog(title, `
    <p class="editor-intro" id="editor-hint">${hint}</p>
    ${isTemplate ? '' : `<datalist id="assessment-codes">${data.template.map(item => `<option value="${item.id}">${escape(item.title)}</option>`).join('')}</datalist>`}
    <div id="editor-list"></div>
    ${isTemplate ? '<div id="reorder-status" class="sr-only" role="status"></div>' : ''}
    ${button(`新增${idLabel}`, 'compact', 'id="add-entry"', 'plus')}
  `, `${button('取消', '', 'id="cancel-editor"')}<button type="submit" class="button primary">儲存${isTemplate ? '範本' : '題庫'}</button>`, () => {
    if (!persist(next => {
      next[kind] = clone(draft);
      for (const key of Object.keys(highWaterMarks)) next.lastId[key] = Math.max(next.lastId[key] || 0, highWaterMarks[key] || 0);
    })) return;
    dialog.close();
    renderQuestions();
    notify(isTemplate ? '已儲存範本，新建面試將使用新版' : '已儲存題庫');
  });

  $('#cancel-editor').addEventListener('click', () => dialog.close());
  renderEditor();

  const list = $('#editor-list');
  if (isTemplate) {
    function moveItem(id, beforeId) {
      const from = draft.findIndex(item => item.id === id);
      const before = beforeId === null ? draft.length : draft.findIndex(item => item.id === beforeId);
      const to = before > from ? before - 1 : before;
      if (from === to) return;
      const [item] = draft.splice(from, 1);
      draft.splice(to, 0, item);
      renderEditor();
      list.querySelector(`[data-sort-id="${id}"] .drag-handle`).focus();
      $('#reorder-status').textContent = `${item.title || id} 已移到第 ${to + 1} 項。`;
    }

    enableTemplateDragging(list, moveItem);
    list.addEventListener('keydown', event => {
      const handle = event.target.closest('.drag-handle');
      if (!handle || !['ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      const id = handle.closest('.template-row').dataset.sortId;
      const index = draft.findIndex(item => item.id === id);
      if (event.key === 'ArrowUp' && index > 0) moveItem(id, draft[index - 1].id);
      if (event.key === 'ArrowDown' && index < draft.length - 1) moveItem(id, draft[index + 2]?.id ?? null);
    });
  }

  list.addEventListener('toggle', event => {
    if (!event.target.matches('.editor-card')) return;
    if (event.target.open) opened.add(event.target.dataset.entry);
    else opened.delete(event.target.dataset.entry);
  }, true);

  function updateEditorItem(event) {
    const { key } = event.target.dataset;
    if (!key) return;
    const card = event.target.closest('[data-entry]');
    const entry = draft.find(item => item.id === card.dataset.entry);
    const value = event.target.value;
    entry[key] = key === 'assessments' ? Array.from(new Set(value.toUpperCase().split(/[、,，\s]+/).filter(Boolean))) : value;
    if (key === 'title') card.querySelector('[data-entry-title]').textContent = value.trim() || `新${idLabel}`;
    if (key === 'category') {
      opened.add(entry.id);
      renderEditor();
      list.querySelector(`[data-entry="${entry.id}"] select`).focus();
    }
  }
  list.addEventListener('input', event => {
    if (event.target.tagName !== 'SELECT') updateEditorItem(event);
  });
  list.addEventListener('change', event => {
    if (event.target.tagName === 'SELECT') updateEditorItem(event);
  });
  list.addEventListener('invalid', event => {
    event.target.closest('details').open = true;
  }, true);

  list.addEventListener('click', event => {
    const control = event.target.closest('[data-editor-action]');
    if (!control) return;
    const card = control.closest('[data-entry]');
    const { entry: id } = card.dataset;
    const index = draft.findIndex(item => item.id === id);
    const action = control.dataset.editorAction;
    if (action === 'delete') {
      opened.delete(id);
      draft.splice(index, 1);
      renderEditor();
      const neighbor = draft[Math.min(index, draft.length - 1)];
      (neighbor ? list.querySelector(`[data-entry="${neighbor.id}"] summary`) : $('#add-entry')).focus();
      return;
    }
    const step = action === 'up' ? -1 : 1;
    let next = index + step;
    while (draft[next] && !isTemplate && draft[next].category !== draft[index].category) next += step;
    if (!draft[next]) return;
    [draft[index], draft[next]] = [draft[next], draft[index]];
    opened.add(id);
    renderEditor();
    const moved = list.querySelector(`[data-entry="${id}"]`);
    const positionControl = moved.querySelector(`[data-editor-action="${action}"]:enabled`) || moved.querySelector('summary');
    positionControl.focus();
  });

  $('#add-entry').addEventListener('click', () => {
    const prefix = isTemplate ? 'E' : activeCategory;
    highWaterMarks[prefix] = (highWaterMarks[prefix] || 0) + 1;
    const id = prefix + String(highWaterMarks[prefix]).padStart(2, '0');
    const entry = isTemplate
      ? { id, title: '', criteria: '' }
      : { id, category: activeCategory, title: '', prompt: '', followup: '', observation: '', assessments: [] };
    draft.push(entry);
    opened.add(id);
    renderEditor();
    list.querySelector(`[data-entry="${id}"] [data-key="title"]`).focus();
  });
}

for (const control of document.querySelectorAll('[data-edit]')) {
  control.addEventListener('click', () => showEditor(control.dataset.edit));
}

drawIcons(document);
renderInterview();
if (storageMessage) notify(storageMessage);
