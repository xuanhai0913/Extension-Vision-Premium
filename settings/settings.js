// Vision Key - Settings Script (Updated for SaaS Proxy)

// Translations
const translations = {
  vi: {
    title: "Cài đặt - Vision Key Premium",
    app_name: "Cài đặt Vision Key",
    app_subtitle: "Trợ lý AI thông minh - SaaS Edition",
    section_license_key: "License Key",
    desc_license_key: "Nhập License Key để sử dụng. Liên hệ admin để nhận key.",
    section_proxy: "Proxy Server",
    desc_proxy: "URL của server proxy. Mặc định: http://localhost:3000",
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
    msg_invalid_key: "License Key không hợp lệ!",
    msg_confirm_reset: "Bạn có chắc chắn muốn đặt lại tất cả cài đặt về mặc định?",
    msg_confirm_clear: "Bạn có chắc chắn muốn xóa toàn bộ lịch sử?",
    section_auto_click: "Auto-Click (Quizizz)",
    desc_auto_click: "Tự động click đáp án trên Quizizz/Wayground sau khi AI phân tích.",
    label_auto_click: "Bật Auto-Click",
    label_delay: "Delay trước khi click:",
    label_notification: "Hiển thị thông báo khi click"
  },
  en: {
    title: "Settings - Vision Key Premium",
    app_name: "Vision Key Settings",
    app_subtitle: "AI-powered assistant - SaaS Edition",
    section_license_key: "License Key",
    desc_license_key: "Enter your license key. Contact admin to get one.",
    section_proxy: "Proxy Server",
    desc_proxy: "Proxy server URL. Default: http://localhost:3000",
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
    msg_invalid_key: "Invalid license key!",
    msg_confirm_reset: "Are you sure you want to reset all settings to default?",
    msg_confirm_clear: "Are you sure you want to clear all history?",
    section_auto_click: "Auto-Click (Quizizz)",
    desc_auto_click: "Automatically click answer on Quizizz/Wayground after AI analysis.",
    label_auto_click: "Enable Auto-Click",
    label_delay: "Delay before click:",
    label_notification: "Show notification when clicked"
  }
};

let currentLang = 'vi';

console.log('Settings page loaded (SaaS Edition)');

// DOM elements
const licenseKeyInput = document.getElementById('licenseKey');
const checkQuotaBtn = document.getElementById('checkQuotaBtn');
const proxyUrlInput = document.getElementById('proxyUrl');
const quotaInfo = document.getElementById('quotaInfo');
const quotaValue = document.getElementById('quotaValue');
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
const showAnalyzingNotification = document.getElementById('showAnalyzingNotification');
const silentModeEnabled = document.getElementById('silentModeEnabled');
const continueInBackground = document.getElementById('continueInBackground');

// Load settings on init
loadSettings();
fetchGithubStats();

// Event listeners
checkQuotaBtn.addEventListener('click', checkQuota);
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
    'licenseKey',
    'proxyUrl',
    'answerMode',
    'language',
    'model',
    'autoClickEnabled',
    'autoClickDelay',
    'showClickNotification',
    'showAnalyzingNotification',
    'silentModeEnabled',
    'continueInBackground'
  ], (result) => {
    console.log('Loaded settings:', result);

    if (result.licenseKey) {
      licenseKeyInput.value = result.licenseKey;
    }

    if (result.proxyUrl) {
      proxyUrlInput.value = result.proxyUrl;
    } else {
      proxyUrlInput.value = 'https://admin.hailamdev.space';
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
    showAnalyzingNotification.checked = result.showAnalyzingNotification !== false; // default true
    silentModeEnabled.checked = result.silentModeEnabled || false;
    continueInBackground.checked = result.continueInBackground !== false; // default true
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

  // Update inputs placeholder
  if (lang === 'vi') {
    licenseKeyInput.placeholder = "KEY-VISION-XXXXXXXX";
    proxyUrlInput.placeholder = "http://localhost:3000";
  } else {
    licenseKeyInput.placeholder = "KEY-VISION-XXXXXXXX";
    proxyUrlInput.placeholder = "http://localhost:3000";
  }
}

async function checkQuota() {
  const key = licenseKeyInput.value.trim();
  const proxyUrl = proxyUrlInput.value.trim() || 'http://localhost:3000';
  const t = translations[currentLang];

  if (!key) {
    showStatus(t.msg_invalid_key, 'error');
    return;
  }

  checkQuotaBtn.disabled = true;

  try {
    const response = await fetch(`${proxyUrl}/api/quota?key=${encodeURIComponent(key)}`);
    const data = await response.json();

    if (response.ok && data.quota !== undefined) {
      quotaInfo.style.display = 'flex';
      quotaValue.textContent = data.quota;
      quotaValue.className = `quota-value ${data.quota > 0 ? 'positive' : 'zero'}`;

      if (!data.isActive) {
        showStatus('Key đã bị vô hiệu hóa!', 'error');
      }
    } else {
      quotaInfo.style.display = 'flex';
      quotaValue.textContent = 'Invalid';
      quotaValue.className = 'quota-value zero';
      showStatus(data.error || t.msg_invalid_key, 'error');
    }
  } catch (error) {
    console.error('Check quota error:', error);
    showStatus('Không thể kết nối server!', 'error');
  } finally {
    checkQuotaBtn.disabled = false;
  }
}

function saveSettings() {
  const selectedMode = document.querySelector('input[name="defaultMode"]:checked').value;

  const settings = {
    licenseKey: licenseKeyInput.value.trim(),
    proxyUrl: proxyUrlInput.value.trim() || 'http://localhost:3000',
    answerMode: selectedMode,
    language: languageSelect.value,
    model: modelSelect.value,
    autoClickEnabled: autoClickEnabled.checked,
    autoClickDelay: parseInt(autoClickDelay.value),
    showClickNotification: showClickNotification.checked,
    showAnalyzingNotification: showAnalyzingNotification.checked,
    silentModeEnabled: silentModeEnabled.checked,
    continueInBackground: continueInBackground.checked
  };

  const t = translations[currentLang];

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
    licenseKey: '',
    proxyUrl: 'https://admin.hailamdev.space',
    answerMode: 'tracNghiem',
    language: 'vi',
    model: 'gemini-2.0-flash-exp',
    expertContext: '',
    autoClickEnabled: false,
    autoClickDelay: 300,
    showClickNotification: true,
    showAnalyzingNotification: true,
    silentModeEnabled: false,
    continueInBackground: true
  };

  chrome.storage.sync.set(defaultSettings, () => {
    loadSettings();
    quotaInfo.style.display = 'none';
    showStatus(t.msg_reset, 'success');
  });
}

function openShortcutSettings() {
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
}

function exportSettings() {
  const t = translations[currentLang];
  chrome.storage.sync.get(null, (settings) => {
    const exportData = { ...settings };
    // Don't export license key for security
    delete exportData.licenseKey;

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
  const repo = 'xuanhai0913/Extension-Vision-Premium';
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
