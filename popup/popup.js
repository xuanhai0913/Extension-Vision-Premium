// Vision Key - Popup Script (SaaS Edition)
// Screen capture implementation with Proxy API

// Import modules
import { captureFullViewport, getImageDimensions, cropImage } from '../scripts/capture.js';
import { analyzeWithGemini } from '../scripts/api-service.js';

console.log('Vision Key popup loaded (SaaS Edition)');

// DOM elements
const captureBtn = document.getElementById('captureBtn');
const captureSelectionBtn = document.getElementById('captureSelectionBtn');
const retakeBtn = document.getElementById('retakeBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const settingsBtn = document.getElementById('settingsBtn');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const dismissErrorBtn = document.getElementById('dismissErrorBtn');

const previewSection = document.getElementById('previewSection');
const previewImage = document.getElementById('previewImage');
const resultSection = document.getElementById('resultSection');
const resultText = document.getElementById('resultText');
const loadingSection = document.getElementById('loadingSection');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const emptyState = document.getElementById('emptyState');

// Quota elements
const quotaBadge = document.getElementById('quotaBadge');
const quotaCount = document.getElementById('quotaCount');

const answerMode = document.getElementById('answerMode');
const expertContext = document.getElementById('expertContext');

// State
let capturedImageData = null;

// Fetch and display quota on popup load
async function fetchQuota() {
  try {
    const settings = await chrome.storage.sync.get(['licenseKey', 'proxyUrl']);
    const licenseKey = settings.licenseKey;
    const proxyUrl = settings.proxyUrl || 'https://admin.hailamdev.space';

    if (!licenseKey) {
      quotaCount.textContent = '?';
      quotaBadge.title = 'No license key';
      return;
    }

    const response = await fetch(`${proxyUrl}/api/quota?key=${encodeURIComponent(licenseKey)}`);
    const data = await response.json();

    if (response.ok && data.quota !== undefined) {
      quotaCount.textContent = data.quota;

      // Color code based on quota level
      quotaBadge.classList.remove('low', 'medium', 'high');
      if (data.quota <= 10) {
        quotaBadge.classList.add('low');
      } else if (data.quota <= 50) {
        quotaBadge.classList.add('medium');
      } else {
        quotaBadge.classList.add('high');
      }

      if (!data.isActive) {
        quotaCount.textContent = '⛔';
        quotaBadge.title = 'Key deactivated';
      }
    } else {
      quotaCount.textContent = '!';
      quotaBadge.classList.add('low');
      quotaBadge.title = data.error || 'Invalid key';
    }
  } catch (error) {
    console.error('Quota fetch error:', error);
    quotaCount.textContent = '?';
    quotaBadge.title = 'Server unavailable';
  }
}

// Fetch quota on load
fetchQuota();

// Event listeners
captureBtn.addEventListener('click', handleCapture);
captureSelectionBtn.addEventListener('click', handleCaptureSelection);
retakeBtn.addEventListener('click', handleRetake);
analyzeBtn.addEventListener('click', handleAnalyze);
settingsBtn.addEventListener('click', handleSettings);
copyBtn.addEventListener('click', handleCopy);
clearBtn.addEventListener('click', handleClear);
dismissErrorBtn.addEventListener('click', () => {
  errorSection.style.display = 'none';
});

// Functions

async function handleCapture() {
  try {
    console.log('Capture clicked');
    captureBtn.disabled = true;
    captureBtn.textContent = '📸 Capturing...';

    // Capture full viewport
    const dataUrl = await captureFullViewport();

    // Get dimensions
    const dimensions = await getImageDimensions(dataUrl);
    console.log('Captured image:', dimensions);

    // Clear previous storage
    await chrome.storage.local.remove(['analysisResult', 'captureTimestamp', 'capturedImage']);

    // Clear previous storage
    await chrome.storage.local.remove(['analysisResult', 'captureTimestamp', 'capturedImage']);

    // Store captured image
    capturedImageData = dataUrl;

    // Show preview and hide empty state
    previewImage.src = dataUrl;
    previewSection.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';

    // Enable analyze button
    analyzeBtn.disabled = false;

    // Update button (reset state)
    captureBtn.textContent = '📸 Capture Screen';
    captureBtn.disabled = false;

    showMessage('Screenshot captured successfully!', 'success');

    // Auto Analyze
    handleAnalyze();

  } catch (error) {
    console.error('Capture failed:', error);
    showError('Failed to capture screen: ' + error.message);
    captureBtn.textContent = '📸 Capture Screen';
    captureBtn.disabled = false;
  }
}

async function handleCaptureSelection() {
  try {
    console.log('Capture selection clicked');

    // Clear previous storage immediately
    await chrome.storage.local.remove(['analysisResult', 'captureTimestamp', 'capturedImage']);

    // Update button UI state
    const originalText = captureSelectionBtn.innerHTML;
    captureSelectionBtn.disabled = true;
    captureSelectionBtn.querySelector('span').textContent = 'Starting...';

    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      throw new Error('No active tab found');
    }

    // Check for restricted URLs
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
      throw new Error('Cannot capture this system page. Please try on a normal website.');
    }

    // Function to ensure content script is loaded
    const ensureContentScript = async () => {
      try {
        // Try pinging first
        await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
        return true;
      } catch (e) {
        console.log('Content script not ready, injecting...', e.message);
        try {
          // Inject CSS first
          await chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: ['content/content.css']
          });

          // Inject JS
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content/content.js']
          });
          return true;
        } catch (injectError) {
          throw new Error('Cannot inject script: ' + injectError.message);
        }
      }
    };

    await ensureContentScript();

    // Small delay to ensure script initialization
    await new Promise(resolve => setTimeout(resolve, 100));

    // Send message to start selection
    await chrome.tabs.sendMessage(tab.id, { action: 'startSelection' });
    console.log('Selection message sent');

    // Close popup so user can see selection
    window.close();

  } catch (error) {
    console.error('Selection failed:', error);
    showError(error.message);

    // Reset button
    captureSelectionBtn.disabled = false;
    captureSelectionBtn.innerHTML = `
      <div class="icon-circle">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12H3"/><path d="M21 6H3"/><path d="M21 18H3"/><path d="M3 6v12"/><path d="M21 6v12"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
      </div>
      <span>Selection</span>
    `;
  }
}

async function handleRetake() {
  console.log('Retake clicked');
  previewSection.style.display = 'none';
  analyzeBtn.disabled = true;
  resultSection.style.display = 'none';
  capturedImageData = null;

  // Clear persistent storage
  await chrome.storage.local.remove(['capturedImage', 'analysisResult', 'captureTimestamp']);

  if (emptyState) emptyState.style.display = 'block';
}

async function handleAnalyze() {
  try {
    console.log('Analyze clicked');
    console.log('Mode:', answerMode.value);
    console.log('Expert:', expertContext.value);

    // Check if image is captured
    if (!capturedImageData) {
      showError('Please capture a screenshot first!');
      return;
    }

    // Get API key and auto-click settings
    const settings = await chrome.storage.sync.get([
      'apiKey',
      'autoClickEnabled',
      'autoClickDelay',
      'showClickNotification'
    ]);

    if (!settings.apiKey) {
      showError('API Key not set. Please configure in Settings.');
      return;
    }

    // Set analyzing flag for background continuation
    isAnalyzing = true;

    // Show loading
    showLoading(true);

    // Call Gemini API
    const result = await analyzeWithGemini(
      capturedImageData,
      answerMode.value,
      expertContext.value,
      settings.apiKey
    );

    // Hide loading
    showLoading(false);

    // Display result based on mode
    const currentMode = answerMode.value;

    if (currentMode === 'tracNghiem' && result.finalAnswer) {
      // For multiple choice: format answers nicely
      const answers = result.finalAnswer.split(', ');
      let formattedAnswer;

      if (answers.length === 1) {
        formattedAnswer = `✅ Đáp án: ${answers[0]}`;
      } else {
        // Multiple answers - format as list
        formattedAnswer = '✅ Đáp án:\n' + answers.map((a, i) => `   Câu ${i + 1}: ${a}`).join('\n');
      }

      displayResult(formattedAnswer, result.fullText);
    } else if (result.finalAnswer) {
      // For essay mode with final answer
      displayResult(`${result.fullText}\n\n✅ Đáp án: ${result.finalAnswer}`);
    } else {
      // No final answer found
      displayResult(result.fullText);
    }

    // ===== AUTO-CLICK/AUTO-FILL FEATURE =====
    // Works for both MCQ and essay modes
    if (settings.autoClickEnabled && result.finalAnswer) {
      console.log('Auto-answer enabled, triggering for mode:', currentMode);
      const autoClickSuccess = await triggerAutoClick(
        result.finalAnswer, // Always use finalAnswer (short answer)
        settings.autoClickDelay || 300,
        settings.showClickNotification !== false
      );

      // If auto-click was successful, clear storage and close popup
      if (autoClickSuccess) {
        console.log('Auto-answer successful, clearing and closing popup...');
        await chrome.storage.local.remove(['capturedImage', 'analysisResult', 'captureTimestamp']);
        setTimeout(() => {
          window.close();
        }, 500);
        return;
      }
    }

    // SAVE RESULT TO STORAGE for persistence
    await chrome.storage.local.set({
      analysisResult: {
        fullText: result.fullText,
        finalAnswer: result.finalAnswer,
        timestamp: Date.now()
      }
    });

    // Reset analyzing flag
    isAnalyzing = false;
    showMessage('Analysis complete!', 'success');

  } catch (error) {
    console.error('Analyze failed:', error);
    isAnalyzing = false;
    showLoading(false);
    showError('Analysis failed: ' + error.message);
  }
}

/**
 * Trigger auto-click on the active tab (Quizizz/Wayground)
 * @param {string} answer - The answer to click (e.g., "A", "B")
 * @param {number} delay - Delay in ms before clicking
 * @param {boolean} showNotification - Whether to show notification
 */
async function triggerAutoClick(answer, delay, showNotification) {
  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      console.log('No active tab for auto-click');
      return;
    }

    // Skip for restricted URLs
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') ||
      tab.url.startsWith('about:') || tab.url.startsWith('chrome-extension://')) {
      console.log('Cannot auto-click on system page');
      return;
    }

    console.log('Sending auto-click to tab:', tab.id, 'Answer:', answer);

    // Ensure content script is loaded first
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
    } catch (e) {
      console.log('Content script not ready, injecting...');
      try {
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['content/content.css']
        });
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/content.js']
        });
        // Wait for script initialization
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (injectError) {
        console.error('Cannot inject content script:', injectError);
        return false;
      }
    }

    // Send message to content script
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'autoClickAnswer',
      answer: answer,
      delay: delay,
      showNotification: showNotification
    });

    console.log('Auto-click response:', response);

    if (response && response.success) {
      console.log('Auto-click successful:', response.clicked);
      return true;
    } else {
      console.log('Auto-click failed:', response?.reason);
      return false;
    }
  } catch (error) {
    console.error('Auto-click error:', error);
    return false;
  }
}

function handleSettings() {
  console.log('Settings clicked');
  // Open settings page
  chrome.runtime.openOptionsPage();
}

function handleCopy() {
  const text = resultText.textContent;
  navigator.clipboard.writeText(text).then(() => {
    showMessage('Copied to clipboard!', 'success');
  }).catch(err => {
    showError('Failed to copy: ' + err.message);
  });
}

function handleClear() {
  resultSection.style.display = 'none';
  resultText.textContent = '';

  // Reset toggle state
  fullExplanation = null;
  shortAnswer = null;
  isShowingFullExplanation = false;
  showToggleButton(false);

  // Clear persistent storage but KEEP IMAGE for re-analysis
  chrome.storage.local.remove(['analysisResult']);
}

// Helper functions

function showLoading(show) {
  loadingSection.style.display = show ? 'block' : 'none';
  analyzeBtn.disabled = show;
}

// Store full explanation for toggle
let fullExplanation = null;
let shortAnswer = null;
let isShowingFullExplanation = false;

function displayResult(text, fullText = null) {
  resultText.textContent = text;
  resultSection.style.display = 'block';

  // Store texts for toggle functionality
  if (fullText) {
    shortAnswer = text;
    fullExplanation = fullText;
    isShowingFullExplanation = false;
    showToggleButton(true);
  } else {
    shortAnswer = null;
    fullExplanation = null;
    isShowingFullExplanation = false;
    showToggleButton(false);
  }
}

// Toggle between short answer and full explanation
function toggleExplanation() {
  if (!fullExplanation || !shortAnswer) return;

  isShowingFullExplanation = !isShowingFullExplanation;

  if (isShowingFullExplanation) {
    resultText.textContent = fullExplanation + '\n\n' + shortAnswer;
    updateToggleButton('Ẩn chi tiết');
  } else {
    resultText.textContent = shortAnswer;
    updateToggleButton('Xem chi tiết');
  }
}

// Show/hide toggle button
function showToggleButton(show) {
  let toggleBtn = document.getElementById('toggleExplanationBtn');

  if (show) {
    if (!toggleBtn) {
      // Create toggle button if it doesn't exist
      toggleBtn = document.createElement('button');
      toggleBtn.id = 'toggleExplanationBtn';
      toggleBtn.className = 'toggle-details-btn';
      toggleBtn.textContent = 'Xem chi tiết';
      toggleBtn.addEventListener('click', toggleExplanation);

      // Insert after Answer Text, before Actions
      const resultText = document.getElementById('resultText');
      if (resultText && resultText.parentNode) {
        resultText.parentNode.insertBefore(toggleBtn, resultText.nextSibling);
      }
    }
    toggleBtn.style.display = 'inline-block';
    toggleBtn.textContent = 'Xem chi tiết (Show reasoning)';
  } else if (toggleBtn) {
    toggleBtn.style.display = 'none';
  }
}

// Update toggle button text
function updateToggleButton(text) {
  const toggleBtn = document.getElementById('toggleExplanationBtn');
  if (toggleBtn) {
    toggleBtn.textContent = text;
  }
}

function showError(message) {
  errorMessage.textContent = message;
  errorSection.style.display = 'block';
}

function showMessage(message, type = 'info') {
  // Simple console log for now
  // TODO: Phase 6 - Add toast notifications
  console.log(`[${type.toUpperCase()}] ${message}`);
}

// Load saved settings on init
function loadSettings() {
  chrome.storage.sync.get(['answerMode', 'expertContext'], (result) => {
    if (result.answerMode) {
      answerMode.value = result.answerMode;
    }
    if (result.expertContext) {
      expertContext.value = result.expertContext;
    }
  });
}

// Save settings when changed
answerMode.addEventListener('change', () => {
  chrome.storage.sync.set({ answerMode: answerMode.value });
});

expertContext.addEventListener('blur', () => {
  chrome.storage.sync.set({ expertContext: expertContext.value });
});

// Check for stored image and results
async function checkStoredData() {
  console.log('Checking for stored data...');

  const data = await chrome.storage.local.get([
    'capturedImage',
    'analysisResult'
  ]);

  if (data.capturedImage) {
    console.log('Found stored image');

    // Restore image
    capturedImageData = data.capturedImage;
    previewImage.src = capturedImageData;
    previewSection.style.display = 'block';
    analyzeBtn.disabled = false;
    if (emptyState) emptyState.style.display = 'none';

    // Restore analysis result if available
    if (data.analysisResult) {
      console.log('Found stored analysis result');
      const result = data.analysisResult;

      // Use the same display logic as successful analysis
      const currentMode = answerMode.value;
      if (currentMode === 'tracNghiem' && result.finalAnswer) {
        // Format answers
        const answers = result.finalAnswer.split(', ');
        let formattedAnswer;
        if (answers.length === 1) {
          formattedAnswer = `✅ Đáp án: ${answers[0]}`;
        } else {
          formattedAnswer = '✅ Đáp án:\n' + answers.map((a, i) => `   Câu ${i + 1}: ${a}`).join('\n');
        }
        displayResult(formattedAnswer, result.fullText);
      } else if (result.finalAnswer) {
        displayResult(`${result.fullText}\n\n✅ Đáp án: ${result.finalAnswer}`);
      } else {
        displayResult(result.fullText);
      }
    } else {
      // Auto analyze if image exists but no result
      console.log('No stored result, auto analyzing...');
      handleAnalyze();
    }
  } else {
    console.log('No stored data found');
    if (emptyState) emptyState.style.display = 'block';
  }
}

// Track if analysis is in progress
let isAnalyzing = false;

// Handle popup closing - continue analysis in background if enabled
window.addEventListener('beforeunload', async () => {
  if (isAnalyzing && capturedImageData) {
    console.log('Popup closing while analyzing, requesting background continuation...');

    // Check if continue in background is enabled
    const settings = await chrome.storage.sync.get(['continueInBackground', 'autoClickEnabled']);

    if (settings.continueInBackground && settings.autoClickEnabled) {
      // Send message to background to continue analysis
      chrome.runtime.sendMessage({
        action: 'continueBackgroundAnalysis'
      });
    }
  }
});

// Also listen for visibility change (popup losing focus)
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'hidden' && isAnalyzing && capturedImageData) {
    console.log('Popup hidden while analyzing...');

    const settings = await chrome.storage.sync.get(['continueInBackground', 'autoClickEnabled']);

    if (settings.continueInBackground && settings.autoClickEnabled) {
      chrome.runtime.sendMessage({
        action: 'continueBackgroundAnalysis'
      });
    }
  }
});

// Initialize
loadSettings();
checkStoredData();
console.log('Vision Key ready!');
