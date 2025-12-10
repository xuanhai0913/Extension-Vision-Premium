// Vision Key - Settings Script

// Translations
const translations = {
  vi: {
    title: "Cài đặt - Vision Key",
    app_name: "Cài đặt Vision Key",
    app_subtitle: "Trợ lý AI thông minh cho trình duyệt của bạn",
    section_api_key: "API Key Gemini",
    desc_api_key: "Cần thiết để AI phân tích. Chỉ được lưu trữ cục bộ trên máy của bạn.",
    link_get_key: "Lấy API Key miễn phí",
    section_default_mode: "Chế độ Mặc định",
    mode_mc_title: "Trắc nghiệm",
    mode_mc_desc: "Trả lời nhanh (A, B, C, D)",
    mode_essay_title: "Tự luận / Giải bài",
    mode_essay_desc: "Giải thích chi tiết từng bước",
    section_language: "Ngôn ngữ",
    section_model: "Mô hình AI",
    section_data: "Dữ liệu & Phím tắt",
    btn_shortcut: "Phím tắt",
    btn_export: "Xuất cài đặt",
    btn_import: "Nhập cài đặt",
    btn_clear_history: "Xóa lịch sử",
    btn_reset: "Khôi phục mặc định",
    btn_save: "Lưu thay đổi",
    link_support: "Hỗ trợ",
    msg_saved: "Đã lưu cài đặt thành công! ✓",
    msg_reset: "Đã khôi phục về mặc định ✓",
    msg_cleared: "Đã xóa lịch sử cục bộ!",
    msg_exported: "Đã xuất cài đặt! ✓",
    msg_imported: "Đã nhập cài đặt! ✓",
    msg_invalid_key_format: "Cảnh báo: API Key thường bắt đầu bằng 'AIza'",
    msg_confirm_reset: "Bạn có chắc chắn muốn đặt lại tất cả cài đặt về mặc định?",
    msg_confirm_clear: "Bạn có chắc chắn muốn xóa toàn bộ lịch sử?",
    hint_hide_key: "Ẩn API Key",
    hint_show_key: "Hiện API Key",
    section_auto_click: "Auto-Click (Quizizz)",
    desc_auto_click: "Tự động click đáp án trên Quizizz/Wayground sau khi AI phân tích.",
    label_auto_click: "Bật Auto-Click",
    label_delay: "Delay trước khi click:",
    label_notification: "Hiển thị thông báo khi click"
  },
  en: {
    title: "Settings - Vision Key",
    app_name: "Vision Key Settings",
    app_subtitle: "AI-powered assistant for your browser",
    section_api_key: "Gemini API Key",
    desc_api_key: "Required for AI analysis. Stored locally on your device.",
    link_get_key: "Get free API Key",
    section_default_mode: "Default Mode",
    mode_mc_title: "Multiple Choice",
    mode_mc_desc: "Quick answer (A, B, C, D)",
    mode_essay_title: "Essay / Problem",
    mode_essay_desc: "Detailed step-by-step solution",
    section_language: "Language",
    section_model: "AI Model",
    section_data: "Data & Shortcuts",
    btn_shortcut: "Shortcuts",
    btn_export: "Export Settings",
    btn_import: "Import Settings",
    btn_clear_history: "Clear History",
    btn_reset: "Reset Defaults",
    btn_save: "Save Changes",
    link_support: "Support",
    msg_saved: "Settings saved successfully! ✓",
    msg_reset: "Settings reset to default ✓",
    msg_cleared: "Local history cleared!",
    msg_exported: "Settings exported! ✓",
    msg_imported: "Settings imported! ✓",
    msg_invalid_key_format: "Warning: API key usually starts with 'AIza'",
    msg_confirm_reset: "Are you sure you want to reset all settings to default?",
    msg_confirm_clear: "Are you sure you want to clear all history?",
    hint_hide_key: "Hide API Key",
    hint_show_key: "Show API Key",
    section_auto_click: "Auto-Click (Quizizz)",
    desc_auto_click: "Automatically click answer on Quizizz/Wayground after AI analysis.",
    label_auto_click: "Enable Auto-Click",
    label_delay: "Delay before click:",
    label_notification: "Show notification when clicked"
  }
};

let currentLang = 'vi';

console.log('Settings page loaded');

// DOM elements
const apiKeyInput = document.getElementById('apiKey');
const toggleKeyBtn = document.getElementById('toggleKeyBtn');
const languageSelect = document.getElementById('language');
const modelSelect = document.getElementById('model');
const changeShortcutBtn = document.getElementById('changeShortcutBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const statusDiv = document.getElementById('status');
const importFileInput = document.getElementById('importFileInput');

// Auto-click elements
const autoClickEnabled = document.getElementById('autoClickEnabled');
const autoClickSettings = document.getElementById('autoClickSettings');
const autoClickDelay = document.getElementById('autoClickDelay');
const showClickNotification = document.getElementById('showClickNotification');

// Load settings on init
loadSettings();
fetchGithubStats();

// Event listeners
toggleKeyBtn.addEventListener('click', toggleApiKeyVisibility);
changeShortcutBtn.addEventListener('click', openShortcutSettings);
exportBtn.addEventListener('click', exportSettings);
importBtn.addEventListener('click', () => importFileInput.click());
importFileInput.addEventListener('change', importSettings);
clearHistoryBtn.addEventListener('click', clearHistory);
saveBtn.addEventListener('click', saveSettings);
resetBtn.addEventListener('click', resetSettings);
languageSelect.addEventListener('change', () => {
  updateUI(languageSelect.value);
});

// Auto-click toggle listener
autoClickEnabled.addEventListener('change', () => {
  autoClickSettings.style.display = autoClickEnabled.checked ? 'block' : 'none';
});

// Functions

function loadSettings() {
  chrome.storage.sync.get([
    'apiKey',
    'answerMode',
    'language',
    'model',
    'autoClickEnabled',
    'autoClickDelay',
    'showClickNotification'
  ], (result) => {
    console.log('Loaded settings:', result);

    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }

    if (result.answerMode) {
      const radio = document.querySelector(`input[name="defaultMode"][value="${result.answerMode}"]`);
      if (radio) radio.checked = true;
    }

    // Set language and update UI
    const lang = result.language || 'vi';
    languageSelect.value = lang;
    updateUI(lang);

    if (result.model) {
      modelSelect.value = result.model;
    } else {
      modelSelect.value = 'gemini-2.0-flash-exp'; // Default
    }

    // Auto-click settings
    autoClickEnabled.checked = result.autoClickEnabled || false;
    autoClickSettings.style.display = autoClickEnabled.checked ? 'block' : 'none';
    if (result.autoClickDelay !== undefined) {
      autoClickDelay.value = result.autoClickDelay;
    }
    showClickNotification.checked = result.showClickNotification !== false; // default true
  });
}

function updateUI(lang) {
  currentLang = lang;
  const t = translations[lang];
  if (!t) return;

  // Update logic for i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) {
      el.textContent = t[key];
    }
  });

  // Update title
  document.title = t.title;

  // Update inputs placeholder if needed (optional)
  if (lang === 'vi') {
    apiKeyInput.placeholder = "Dán API Key vào đây...";
  } else {
    apiKeyInput.placeholder = "Paste your API key here...";
  }
}

function saveSettings() {
  const selectedMode = document.querySelector('input[name="defaultMode"]:checked').value;

  const settings = {
    apiKey: apiKeyInput.value.trim(),
    answerMode: selectedMode,
    language: languageSelect.value,
    model: modelSelect.value,
    autoClickEnabled: autoClickEnabled.checked,
    autoClickDelay: parseInt(autoClickDelay.value),
    showClickNotification: showClickNotification.checked
  };

  // Validate API key warning
  const t = translations[currentLang];
  if (settings.apiKey && !settings.apiKey.startsWith('AIza')) {
    showStatus(t.msg_invalid_key_format, 'error');
  }

  chrome.storage.sync.set(settings, () => {
    console.log('Settings saved:', settings);
    showStatus(t.msg_saved, 'success');

    // Update Global Lang
    updateUI(settings.language);
  });
}

function resetSettings() {
  const t = translations[currentLang];
  if (!confirm(t.msg_confirm_reset)) {
    return;
  }

  const defaultSettings = {
    apiKey: '',
    answerMode: 'tracNghiem',
    language: 'vi',
    model: 'gemini-2.0-flash-exp',
    expertContext: '',
    autoClickEnabled: false,
    autoClickDelay: 300,
    showClickNotification: true
  };

  chrome.storage.sync.set(defaultSettings, () => {
    loadSettings();
    showStatus(t.msg_reset, 'success');
  });
}

function toggleApiKeyVisibility() {
  const isPassword = apiKeyInput.type === 'password';
  apiKeyInput.type = isPassword ? 'text' : 'password';
  const t = translations[currentLang];

  // Update icon based on state
  if (isPassword) {
    // Show closed eye (representing Hide)
    toggleKeyBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
    toggleKeyBtn.title = t.hint_hide_key;
  } else {
    // Show open eye
    toggleKeyBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
    toggleKeyBtn.title = t.hint_show_key;
  }
}

function openShortcutSettings() {
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
}

function exportSettings() {
  const t = translations[currentLang];
  chrome.storage.sync.get(null, (settings) => {
    const exportData = { ...settings };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vision-key-settings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showStatus(t.msg_exported, 'success');
  });
}

function importSettings() {
  const t = translations[currentLang];
  const file = importFileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const settings = JSON.parse(e.target.result);

      chrome.storage.sync.set(settings, () => {
        loadSettings();
        showStatus(t.msg_imported, 'success');
      });
    } catch (error) {
      showStatus('Failed to import: Invalid file format', 'error');
    }
  };
  reader.readAsText(file);
  importFileInput.value = '';
}

function clearHistory() {
  const t = translations[currentLang];
  if (!confirm(t.msg_confirm_clear)) {
    return;
  }

  chrome.storage.local.clear(() => {
    showStatus(t.msg_cleared, 'success');
  });
}

function showStatus(message, type = 'success') {
  statusDiv.textContent = message;
  statusDiv.className = `status-toast ${type} show`;

  setTimeout(() => {
    statusDiv.classList.remove('show');
  }, 3000);
}

// Fetch Github Stars and Forks
async function fetchGithubStats() {
  const repo = 'xuanhai0913/Extension-Vision-Key';
  const statsContainer = document.getElementById('githubStats');
  const starCount = document.getElementById('starCount');
  const forkCount = document.getElementById('forkCount');

  try {
    const response = await fetch(`https://api.github.com/repos/${repo}`);
    if (response.ok) {
      const data = await response.json();
      starCount.textContent = data.stargazers_count;
      forkCount.textContent = data.forks_count;
      statsContainer.style.display = 'flex';
    }
  } catch (error) {
    console.log('Failed to fetch Github stats:', error);
  }
}
