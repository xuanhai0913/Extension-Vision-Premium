// Vision Key - Background Service Worker
// Phase 1: Basic structure

console.log('Vision Key background service worker loaded');

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Vision Key installed!');
    // Set default settings
    chrome.storage.sync.set({
      answerMode: 'tracNghiem',
      expertContext: '',
      apiKey: ''
    });
  } else if (details.reason === 'update') {
    console.log('Vision Key updated!');
  }
});

// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  console.log('Command received:', command);

  if (command === 'capture-selection') {
    handleCaptureSelection();
  } else if (command === 'capture-full') {
    handleCaptureFull();
  } else if (command === 'quick-mc') {
    handleQuickCapture('tracNghiem');
  } else if (command === 'quick-essay') {
    handleQuickCapture('tuLuan');
  }
});

// Handle capture selection command (keyboard shortcut: Ctrl+Shift+.)
async function handleCaptureSelection() {
  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      console.error('No active tab found');
      return;
    }

    console.log('Triggering selection capture for tab:', tab.id, tab.url);

    // Check for restricted URLs
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') ||
      tab.url.startsWith('about:') || tab.url.startsWith('chrome-extension://')) {
      console.log('Cannot capture on system page');
      chrome.action.openPopup();
      return;
    }

    // Ensure content script is loaded
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
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (injectError) {
        console.error('Cannot inject script:', injectError);
        chrome.action.openPopup();
        return;
      }
    }

    // Start selection mode directly
    await chrome.tabs.sendMessage(tab.id, { action: 'startSelection' });
    console.log('Selection mode started via keyboard shortcut');

  } catch (error) {
    console.error('Error handling capture selection:', error);
    chrome.action.openPopup();
  }
}

// Handle capture full screen command (keyboard shortcut: Ctrl+Shift+/)
async function handleCaptureFull() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      console.error('No active tab found');
      return;
    }

    console.log('Triggering full screen capture for tab:', tab.id);

    // Check for restricted URLs
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') ||
      tab.url.startsWith('about:') || tab.url.startsWith('chrome-extension://')) {
      console.log('Cannot capture on system page');
      chrome.action.openPopup();
      return;
    }

    // Get settings to check for silent mode
    const settings = await chrome.storage.sync.get([
      'silentModeEnabled',
      'autoClickEnabled'
    ]);

    // Capture full viewport
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 100
    });

    console.log('Full screen captured! DataURL length:', dataUrl.length);

    // Store captured image
    await chrome.storage.local.set({
      capturedImage: dataUrl,
      captureTimestamp: Date.now()
    });

    // Check if Silent Mode is enabled
    if (settings.silentModeEnabled && settings.autoClickEnabled) {
      console.log('SILENT MODE - Running background analysis...');

      // Run analysis in background without opening popup
      await analyzeInBackground(dataUrl, tab.id);

      console.log('Full screen SILENT MODE complete');
    } else {
      // Open popup to show result and trigger analysis
      await chrome.action.openPopup();
      console.log('Full screen capture complete, popup opened');
    }

  } catch (error) {
    console.error('Error handling full capture:', error);
    chrome.action.openPopup();
  }
}

// Handle quick capture with specific mode (Ctrl+Shift+T for MC, Ctrl+Shift+Y for Essay)
async function handleQuickCapture(mode) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      console.error('No active tab found');
      return;
    }

    console.log('Quick capture for mode:', mode, 'tab:', tab.id);

    // Check for restricted URLs
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') ||
      tab.url.startsWith('about:') || tab.url.startsWith('chrome-extension://')) {
      console.log('Cannot capture on system page');
      chrome.action.openPopup();
      return;
    }

    // Capture full viewport
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 100
    });

    console.log('Quick capture completed! Mode:', mode);

    // Store captured image and mode override
    await chrome.storage.local.set({
      capturedImage: dataUrl,
      captureTimestamp: Date.now(),
      modeOverride: mode // Override mode for this capture
    });

    // Get settings
    const settings = await chrome.storage.sync.get([
      'silentModeEnabled',
      'autoClickEnabled'
    ]);

    // Always run in background for quick capture (it's meant to be fast)
    if (settings.autoClickEnabled) {
      console.log('Quick capture - Running background analysis with mode:', mode);
      await analyzeInBackgroundWithMode(dataUrl, tab.id, mode);
    } else {
      // Open popup if auto-click not enabled
      await chrome.action.openPopup();
    }

  } catch (error) {
    console.error('Error handling quick capture:', error);
    chrome.action.openPopup();
  }
}

// Listen for messages from popup/content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  if (message.action === 'capture') {
    // TODO: Phase 2 - Handle capture
    handleScreenCapture(sender.tab?.id).then(result => {
      sendResponse({ success: true, data: result });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  }

  if (message.action === 'selectionComplete') {
    handleSelectionComplete(message.rect, sender.tab.id, message.devicePixelRatio)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.action === 'selectionCancelled') {
    console.log('Selection cancelled:', message.reason);
    sendResponse({ success: true });
  }

  if (message.action === 'analyze') {
    // TODO: Phase 3 - Handle AI analysis
    handleAnalyze(message.imageData, message.mode, message.context).then(result => {
      sendResponse({ success: true, result: result });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  // Handle request to continue analysis in background (when popup is about to close)
  if (message.action === 'continueBackgroundAnalysis') {
    console.log('Popup requested background analysis continuation');

    // Get the pending analysis data
    chrome.storage.local.get(['pendingBackgroundAnalysis', 'capturedImage'], async (data) => {
      if (data.capturedImage) {
        // Get active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          console.log('Continuing analysis in background for tab:', tab.id);
          analyzeInBackground(data.capturedImage, tab.id);
        }
      }
    });

    sendResponse({ success: true });
    return true;
  }

  // Handle direct background analysis request
  if (message.action === 'analyzeInBackground') {
    console.log('Direct background analysis requested');

    chrome.tabs.query({ active: true, currentWindow: true }).then(async ([tab]) => {
      if (tab && message.imageData) {
        const result = await analyzeInBackground(message.imageData, tab.id);
        sendResponse(result);
      } else {
        sendResponse({ success: false, reason: 'no_tab_or_image' });
      }
    });

    return true;
  }

  return true;
});

// Handle selection complete (optimized version)
async function handleSelectionComplete(rect, tabId, devicePixelRatio = 1) {
  try {
    console.log('=== SELECTION PROCESSING START ===');
    console.log('Selection rect:', JSON.stringify(rect));
    console.log('Device Pixel Ratio:', devicePixelRatio);
    console.log('Tab ID:', tabId);

    // Validate rect
    if (!rect || !rect.width || !rect.height) {
      throw new Error('Invalid selection rectangle');
    }

    // Get settings to check for silent mode
    const settings = await chrome.storage.sync.get([
      'silentModeEnabled',
      'continueInBackground',
      'autoClickEnabled'
    ]);

    console.log('Step 1: Capturing full viewport...');

    // Capture full viewport first
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 100
    });

    console.log('Step 2: Full viewport captured! DataURL length:', dataUrl.length);
    console.log('Step 3: Starting crop operation...');

    // Crop to selection using canvas (rect already has DPR-adjusted values from content script)
    const croppedDataUrl = await cropImageInBackground(dataUrl, rect);

    console.log('Step 4: Image cropped successfully! DataURL length:', croppedDataUrl.length);
    console.log('Step 5: Storing in chrome.storage.local...');

    // Store in chrome.storage (temporary)
    await chrome.storage.local.set({
      capturedImage: croppedDataUrl,
      captureTimestamp: Date.now()
    });

    console.log('Step 6: Stored successfully!');

    // Check if Silent Mode is enabled (analyze in background without popup)
    if (settings.silentModeEnabled && settings.autoClickEnabled) {
      console.log('Step 7: SILENT MODE - Running background analysis...');

      // Run analysis in background without opening popup
      await analyzeInBackground(croppedDataUrl, tabId);

      console.log('=== SILENT MODE COMPLETE ===');
    } else if (settings.continueInBackground && settings.autoClickEnabled) {
      console.log('Step 7: Opening popup with background fallback...');

      // Store pending analysis flag so background can continue if popup closes
      await chrome.storage.local.set({
        pendingBackgroundAnalysis: {
          imageData: croppedDataUrl,
          tabId: tabId,
          timestamp: Date.now()
        }
      });

      // Reduced delay before opening popup
      await new Promise(resolve => setTimeout(resolve, 50));

      // Re-open popup
      await chrome.action.openPopup();

      console.log('=== SELECTION PROCESSING COMPLETE (with background fallback) ===');
    } else {
      console.log('Step 7: Re-opening popup (standard mode)...');

      // Reduced delay before opening popup
      await new Promise(resolve => setTimeout(resolve, 50));

      // Re-open popup
      await chrome.action.openPopup();

      console.log('=== SELECTION PROCESSING COMPLETE ===');
    }

  } catch (error) {
    console.error('=== SELECTION PROCESSING FAILED ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    throw error;
  }
}

// Crop image function (for background service worker)
// Service workers don't have DOM APIs, so we use fetch + createImageBitmap
async function cropImageInBackground(dataUrl, rect) {
  try {
    console.log('Starting crop with rect:', rect);

    // Convert dataURL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    console.log('Converted dataURL to blob, size:', blob.size);

    // Create ImageBitmap from blob
    const imageBitmap = await createImageBitmap(blob);
    console.log('Image loaded, dimensions:', imageBitmap.width, 'x', imageBitmap.height);

    // Ensure integer values and validate bounds
    let x = Math.round(rect.x);
    let y = Math.round(rect.y);
    let width = Math.round(rect.width);
    let height = Math.round(rect.height);

    // Clamp to image bounds
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + width > imageBitmap.width) {
      width = imageBitmap.width - x;
      console.warn('Width adjusted to:', width);
    }
    if (y + height > imageBitmap.height) {
      height = imageBitmap.height - y;
      console.warn('Height adjusted to:', height);
    }

    console.log('Final crop rect:', { x, y, width, height });
    console.log('Creating OffscreenCanvas:', width, 'x', height);

    // Create OffscreenCanvas for cropping
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    console.log('Drawing cropped image...');

    // Draw cropped portion
    ctx.drawImage(
      imageBitmap,
      x, y, width, height,  // Source rectangle
      0, 0, width, height   // Destination rectangle
    );

    console.log('Converting to blob...');

    // Convert to blob with quality setting for speed
    const croppedBlob = await canvas.convertToBlob({
      type: 'image/png'
    });
    console.log('Blob created, size:', croppedBlob.size);

    // Optimized base64 conversion (faster for large images)
    const arrayBuffer = await croppedBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Process in chunks to avoid stack overflow for large images
    let binaryString = '';
    const chunkSize = 32768; // 32KB chunks
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binaryString += String.fromCharCode.apply(null, chunk);
    }

    const base64 = btoa(binaryString);
    const croppedDataUrl = `data:image/png;base64,${base64}`;

    console.log('DataURL created, length:', croppedDataUrl.length);

    return croppedDataUrl;

  } catch (error) {
    console.error('Crop error:', error);
    throw error;
  }
}

// TODO: Phase 2 - Screen capture function
async function handleScreenCapture(tabId) {
  console.log('Screen capture requested for tab:', tabId);

  // This will be implemented in Phase 2
  // Will use chrome.tabs.captureVisibleTab()

  return { message: 'Phase 2: Capture not yet implemented' };
}

// TODO: Phase 3 - AI analysis function
async function handleAnalyze(imageData, mode, context) {
  console.log('AI analysis requested');
  console.log('Mode:', mode);
  console.log('Context:', context);

  // This will be implemented in Phase 3
  // Will call Gemini API

  return { message: 'Phase 3: Analysis not yet implemented' };
}

// ===================================================
// BACKGROUND AI ANALYSIS - Continue when popup closes
// ===================================================

/**
 * Analyze image in background (without popup)
 * This allows AI to continue even when popup is closed
 */
async function analyzeInBackground(imageDataUrl, tabId) {
  console.log('=== BACKGROUND ANALYSIS START ===');

  try {
    // Get settings
    const settings = await chrome.storage.sync.get([
      'apiKey',
      'answerMode',
      'expertContext',
      'autoClickEnabled',
      'autoClickDelay',
      'showClickNotification',
      'showAnalyzingNotification',
      'model'
    ]);

    if (!settings.apiKey) {
      console.error('No API key configured');
      await showNotificationOnTab(tabId, '❌ Chưa cài đặt API Key');
      return { success: false, reason: 'no_api_key' };
    }

    // Store analysis state
    await chrome.storage.local.set({
      backgroundAnalysis: {
        status: 'analyzing',
        startTime: Date.now()
      }
    });

    // Show analyzing notification on tab (if enabled)
    if (settings.showAnalyzingNotification !== false) {
      await showNotificationOnTab(tabId, '🔄 Đang phân tích...');
    }

    // Call Gemini API directly (inline implementation to avoid import issues in service worker)
    const result = await callGeminiAPI(
      imageDataUrl,
      settings.answerMode || 'tracNghiem',
      settings.expertContext || '',
      settings.apiKey,
      settings.model || 'gemini-2.0-flash-exp'
    );

    console.log('Background analysis result:', result.finalAnswer);

    // Store result
    await chrome.storage.local.set({
      analysisResult: {
        fullText: result.fullText,
        finalAnswer: result.finalAnswer,
        timestamp: Date.now()
      },
      backgroundAnalysis: {
        status: 'complete',
        endTime: Date.now()
      }
    });

    // If auto-click is enabled and we have an answer, trigger it
    if (settings.autoClickEnabled && result.finalAnswer) {
      console.log('Background auto-click triggered');
      await triggerAutoClickFromBackground(
        tabId,
        result.finalAnswer,
        settings.autoClickDelay || 300,
        settings.showClickNotification !== false
      );
    } else {
      // Show success notification
      await showNotificationOnTab(tabId, `✅ Đáp án: ${result.finalAnswer || 'Xem popup'}`);
    }

    console.log('=== BACKGROUND ANALYSIS COMPLETE ===');
    return { success: true, finalAnswer: result.finalAnswer };

  } catch (error) {
    console.error('Background analysis failed:', error);
    await chrome.storage.local.set({
      backgroundAnalysis: {
        status: 'error',
        error: error.message
      }
    });
    await showNotificationOnTab(tabId, '❌ Lỗi: ' + error.message.substring(0, 50));
    return { success: false, error: error.message };
  }
}

/**
 * Call Gemini API (inline version for background service worker)
 */
async function callGeminiAPI(imageDataUrl, mode, expertContext, apiKey, model) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  // Build prompt
  const expertRole = expertContext
    ? `Bạn là chuyên gia ${expertContext}.`
    : 'Bạn là trợ lý AI thông minh.';

  let prompt;
  if (mode === 'tracNghiem') {
    prompt = `${expertRole}

NHIỆM VỤ: Trả lời các câu hỏi trắc nghiệm trong hình.

CÁCH LÀM:
1. Đọc và hiểu từng câu hỏi
2. Suy luận ngắn gọn (1-2 dòng mỗi câu)
3. Đưa ra đáp án cuối cùng

FORMAT TRẢ LỜI (BẮT BUỘC):
[Suy luận ngắn]

ĐÁP ÁN:
Câu 1: [A/B/C/D]
(tiếp tục nếu có nhiều câu)

Bắt đầu phân tích:`;
  } else {
    prompt = `${expertRole}

Phân tích hình ảnh và trả lời chi tiết câu hỏi.
Format: 
1. Phân tích 
2. Các bước giải
3. FINAL_ANSWER: [câu trả lời]

Trả lời bằng tiếng Việt.`;
  }

  // Extract base64
  const base64Data = imageDataUrl.split(',')[1];

  // Build request
  const requestBody = {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: 'image/png', data: base64Data } }
      ]
    }],
    generationConfig: {
      temperature: mode === 'tracNghiem' ? 0.1 : 0.4,
      maxOutputTokens: mode === 'tracNghiem' ? 512 : 2048,
    }
  };

  const response = await fetch(`${endpoint}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();

  // Extract text
  let text = '';
  if (data.candidates && data.candidates[0]?.content?.parts) {
    text = data.candidates[0].content.parts[0].text || '';
  }

  // Parse answer
  let finalAnswer = null;

  // Try various patterns
  const dapAnSection = text.match(/ĐÁP\s*ÁN\s*:?\s*([\s\S]*?)(?=\n\n|$)/i);
  const searchText = dapAnSection ? dapAnSection[1] : text;

  const cauPattern = /[Cc]âu\s*(\d+)\s*[:\.\)]\s*([A-Da-d])/gi;
  const matches = [...searchText.matchAll(cauPattern)];

  if (matches.length > 0) {
    const sorted = matches.sort((a, b) => parseInt(a[1]) - parseInt(b[1]));
    finalAnswer = sorted.map(m => m[2].toUpperCase()).join(', ');
  } else {
    const singleMatch = text.match(/[Đđ]áp\s*án[:\s]+([A-Da-d])/i);
    if (singleMatch) {
      finalAnswer = singleMatch[1].toUpperCase();
    } else {
      const freeText = text.match(/FINAL_ANSWER[S]?:?\s*(.+?)(?:\n\n|$)/i);
      if (freeText) {
        finalAnswer = freeText[1].trim();
      }
    }
  }

  return { fullText: text, finalAnswer };
}

/**
 * Trigger auto-click from background
 */
async function triggerAutoClickFromBackground(tabId, answer, delay, showNotification) {
  try {
    // Ensure content script is loaded
    try {
      await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    } catch (e) {
      await chrome.scripting.insertCSS({
        target: { tabId },
        files: ['content/content.css']
      });
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content/content.js']
      });
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Send auto-click command
    const response = await chrome.tabs.sendMessage(tabId, {
      action: 'autoClickAnswer',
      answer: answer,
      delay: delay,
      showNotification: showNotification
    });

    console.log('Background auto-click response:', response);
    return response?.success;
  } catch (error) {
    console.error('Background auto-click error:', error);
    return false;
  }
}

/**
 * Show notification on specific tab
 */
async function showNotificationOnTab(tabId, message) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (msg) => {
        // Remove existing notification
        const existing = document.getElementById('vision-key-bg-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.id = 'vision-key-bg-notification';
        notification.innerHTML = msg;
        notification.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          padding: 12px 20px;
          border-radius: 12px;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 14px;
          font-weight: 600;
          z-index: 2147483647;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          animation: slideIn 0.3s ease-out;
        `;

        const style = document.createElement('style');
        style.textContent = `
          @keyframes slideIn {
            from { transform: translateX(100px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `;
        document.head.appendChild(style);
        document.body.appendChild(notification);

        setTimeout(() => {
          notification.style.animation = 'slideOut 0.3s ease-in forwards';
          setTimeout(() => notification.remove(), 300);
        }, 3000);
      },
      args: [message]
    });
  } catch (error) {
    console.error('Failed to show notification:', error);
  }
}

// Keep service worker alive
chrome.runtime.onConnect.addListener((port) => {
  console.log('Port connected:', port.name);
});

console.log('Background service worker initialized');
