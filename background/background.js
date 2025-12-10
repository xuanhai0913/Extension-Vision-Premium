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

    // Open popup to show result and trigger analysis
    await chrome.action.openPopup();
    console.log('Full screen capture complete, popup opened');

  } catch (error) {
    console.error('Error handling full capture:', error);
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
    console.log('Step 7: Re-opening popup...');

    // Reduced delay before opening popup (was 100ms, now 50ms for speed)
    await new Promise(resolve => setTimeout(resolve, 50));

    // Re-open popup
    await chrome.action.openPopup();

    console.log('=== SELECTION PROCESSING COMPLETE ===');

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

// Keep service worker alive
chrome.runtime.onConnect.addListener((port) => {
  console.log('Port connected:', port.name);
});

console.log('Background service worker initialized');
