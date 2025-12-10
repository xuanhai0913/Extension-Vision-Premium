{
  // Verify if we are running in the correct context
  console.log('Vision Key Content Script initializing...');

  let isSelecting = false;
  let startX = 0;
  let startY = 0;
  let selectionBox = null;
  let overlay = null;
  let dimensionLabel = null;
  let instructionsEl = null;

  // Get device pixel ratio for accurate cropping
  function getDevicePixelRatio() {
    return window.devicePixelRatio || 1;
  }

  // Initialize overlay
  function initOverlay() {
    // Remove existing overlay if any
    cleanupOverlay();

    // Create overlay div (dark background)
    overlay = document.createElement('div');
    overlay.id = 'vision-key-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.3);
      z-index: 2147483640;
      cursor: crosshair;
      display: block;
    `;

    // Create selection box
    selectionBox = document.createElement('div');
    selectionBox.id = 'vision-key-selection';
    selectionBox.style.cssText = `
      position: fixed;
      border: 2px solid #00d4ff;
      background: transparent;
      display: none;
      z-index: 2147483645;
      pointer-events: none;
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
    `;

    // Create dimension label
    dimensionLabel = document.createElement('div');
    dimensionLabel.id = 'vision-key-dimensions';
    dimensionLabel.style.cssText = `
      position: fixed;
      background: rgba(0, 0, 0, 0.85);
      color: #00d4ff;
      padding: 4px 10px;
      border-radius: 4px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 12px;
      font-weight: bold;
      z-index: 2147483647;
      pointer-events: none;
      display: none;
    `;

    // Create instructions
    instructionsEl = document.createElement('div');
    instructionsEl.id = 'vision-key-instructions';
    instructionsEl.innerHTML = '✂️ Kéo để chọn vùng • <kbd>ESC</kbd> để hủy';
    instructionsEl.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 24px;
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      z-index: 2147483647;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      pointer-events: none;
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(selectionBox);
    document.body.appendChild(dimensionLabel);
    document.body.appendChild(instructionsEl);

    // Add event listeners
    overlay.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);

    // Reset state
    isSelecting = false;

    console.log('Vision Key overlay initialized');
  }

  // Cleanup all overlay elements
  function cleanupOverlay() {
    const elementsToRemove = [
      'vision-key-overlay',
      'vision-key-selection',
      'vision-key-dimensions',
      'vision-key-instructions'
    ];

    elementsToRemove.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });

    overlay = null;
    selectionBox = null;
    dimensionLabel = null;
    instructionsEl = null;
  }

  // Show overlay
  function showOverlay() {
    initOverlay();
  }

  // Hide overlay
  function hideOverlay() {
    cleanupOverlay();
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('keydown', handleKeyDown);
    isSelecting = false;
    console.log('Vision Key overlay removed');
  }

  // Mouse down - start selection
  function handleMouseDown(e) {
    e.preventDefault();
    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;

    selectionBox.style.left = startX + 'px';
    selectionBox.style.top = startY + 'px';
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    selectionBox.style.display = 'block';

    dimensionLabel.style.display = 'block';

    console.log('Selection started:', { x: startX, y: startY });
  }

  // Mouse move - update selection
  function handleMouseMove(e) {
    if (!isSelecting) return;

    e.preventDefault();
    const currentX = e.clientX;
    const currentY = e.clientY;

    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    const left = Math.min(currentX, startX);
    const top = Math.min(currentY, startY);

    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';

    // Update dimension label
    dimensionLabel.textContent = `${width} × ${height}`;
    dimensionLabel.style.left = (left + width + 10) + 'px';
    dimensionLabel.style.top = (top - 25) + 'px';

    // Keep label in viewport
    if (left + width + 100 > window.innerWidth) {
      dimensionLabel.style.left = (left - 80) + 'px';
    }
    if (top < 30) {
      dimensionLabel.style.top = (top + height + 10) + 'px';
    }
  }

  // Mouse up - finish selection and capture immediately
  function handleMouseUp(e) {
    if (!isSelecting) return;

    e.preventDefault();
    isSelecting = false;

    const width = parseInt(selectionBox.style.width);
    const height = parseInt(selectionBox.style.height);
    const left = parseInt(selectionBox.style.left);
    const top = parseInt(selectionBox.style.top);

    console.log('Selection complete:', { left, top, width, height });

    // Validate selection (minimum 10x10 pixels)
    if (width < 10 || height < 10) {
      console.log('Selection too small, cancelled');
      hideOverlay();
      return;
    }

    // Calculate rect with devicePixelRatio adjustment
    const dpr = getDevicePixelRatio();
    const rect = {
      x: Math.round(left * dpr),
      y: Math.round(top * dpr),
      width: Math.round(width * dpr),
      height: Math.round(height * dpr)
    };

    console.log('Rect with DPR adjustment:', rect, 'DPR:', dpr);

    // Hide overlay BEFORE capturing
    hideOverlay();

    // Small delay to ensure overlay is hidden, then send to background
    setTimeout(() => {
      chrome.runtime.sendMessage({
        action: 'selectionComplete',
        rect: rect,
        devicePixelRatio: dpr
      });
    }, 30);
  }

  // ESC to cancel
  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      console.log('Selection cancelled by user');
      hideOverlay();
      chrome.runtime.sendMessage({ action: 'selectionCancelled', reason: 'user_cancel' });
    }
  }

  // Listen for messages from popup/background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content script received message:', message);

    if (message.action === 'startSelection') {
      showOverlay();
      sendResponse({ success: true });
    } else if (message.action === 'cancelSelection') {
      hideOverlay();
      sendResponse({ success: true });
    } else if (message.action === 'ping') {
      sendResponse({ status: 'pong' });
    } else if (message.action === 'autoClickAnswer') {
      // Auto-click answer on Quizizz/Wayground
      handleAutoClick(message.answer, message.delay, message.showNotification)
        .then(result => sendResponse(result))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true; // Keep channel open for async
    }

    return true;
  });

  // ==========================================
  // AUTO-CLICK FUNCTIONALITY FOR QUIZIZZ
  // ==========================================

  /**
   * Detect if current page is Quizizz/Wayground
   */
  function isQuizizzPage() {
    const hostname = window.location.hostname;
    return hostname.includes('quizizz.com') ||
      hostname.includes('wayground.com') ||
      hostname.includes('quizizz');
  }

  /**
   * Find all option buttons on the page
   * @returns {Array<{button: Element, text: string, position: string, index: number}>}
   */
  function findOptionButtons() {
    const options = [];

    // Quizizz/Wayground selector
    const buttons = document.querySelectorAll('button.option[role="option"]');

    buttons.forEach((btn, index) => {
      // Get text from .content-slot p
      const textEl = btn.querySelector('.content-slot p');
      const text = textEl ? textEl.textContent.trim() : '';

      // Get position number from .gesture-ed div (1, 2, 3, 4)
      const positionEl = btn.querySelector('.gesture-ed > div');
      const position = positionEl ? positionEl.textContent.trim() : String(index + 1);

      options.push({
        button: btn,
        text: text,
        textUpper: text.toUpperCase(),
        position: position,
        index: index
      });
    });

    console.log('Found options:', options.map(o => ({ pos: o.position, text: o.text.substring(0, 30) })));
    return options;
  }

  /**
   * Convert letter answer to position number
   * A -> 1, B -> 2, C -> 3, D -> 4
   */
  function letterToPosition(letter) {
    const mapping = { 'A': '1', 'B': '2', 'C': '3', 'D': '4' };
    return mapping[letter.toUpperCase()] || letter;
  }

  /**
   * Handle open-ended text input questions
   * @param {HTMLTextAreaElement} textarea - The textarea element
   * @param {string} answer - AI's answer text
   * @param {number} delay - Delay before actions
   * @param {boolean} showNotification - Whether to show notification
   */
  async function handleTextInput(textarea, answer, delay, showNotification) {
    console.log('=== TEXT INPUT MODE ===');

    // Add random delay variation
    const randomDelay = delay + Math.floor(Math.random() * 200) - 100;
    await new Promise(resolve => setTimeout(resolve, Math.max(0, randomDelay)));

    // Focus the textarea
    textarea.focus();

    // Set the value and trigger input events for Vue reactivity
    textarea.value = answer;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));

    console.log('Text filled:', answer.substring(0, 50) + '...');

    // Wait a bit for UI to update
    await new Promise(resolve => setTimeout(resolve, 200));

    // Find and click the submit button
    const submitBtn = document.querySelector('button[data-cy="submit-button"]');
    if (submitBtn && !submitBtn.disabled) {
      submitBtn.click();
      console.log('Submit button clicked');

      if (showNotification) {
        showAutoClickNotification('📝 Đã nhập');
      }

      console.log('=== TEXT INPUT COMPLETE ===');
      return { success: true, type: 'text_input', answered: answer.substring(0, 30) };
    } else if (submitBtn && submitBtn.disabled) {
      console.log('Submit button is disabled, waiting...');
      // Try again after a short wait
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!submitBtn.disabled) {
        submitBtn.click();
        console.log('Submit button clicked after wait');
        if (showNotification) {
          showAutoClickNotification('📝 Đã nhập');
        }
        return { success: true, type: 'text_input', answered: answer.substring(0, 30) };
      }

      if (showNotification) {
        showAutoClickNotification('📝 Đã nhập (chờ nộp)');
      }
      return { success: true, type: 'text_input_pending', answered: answer.substring(0, 30) };
    }

    console.log('Submit button not found');
    return { success: false, reason: 'no_submit_button' };
  }

  /**
   * Click the answer button matching the AI response
   * Supports both MCQ (button click) and Open-ended (text input)
   * @param {string} answer - Answer from AI
   * @param {number} delay - Delay in ms before action
   * @param {boolean} showNotification - Whether to show notification
   */
  async function handleAutoClick(answer, delay = 300, showNotification = true) {
    console.log('=== AUTO-ANSWER START ===');
    console.log('Answer:', answer);
    console.log('Delay:', delay);
    console.log('Current URL:', window.location.href);

    if (!isQuizizzPage()) {
      console.log('Not a Quizizz page, skipping');
      return { success: false, reason: 'not_quizizz_page' };
    }

    // PRIORITY 1: Check for option buttons first (MCQ/MSQ)
    const options = findOptionButtons();

    if (options.length > 0) {
      console.log('Found', options.length, 'option buttons - using button click mode');

      // Check if this is multi-select question (MSQ)
      const isMSQ = document.querySelector('.is-msq') !== null ||
        document.querySelector('.msq-text') !== null;
      console.log('Is MSQ (multi-select):', isMSQ);

      // Normalize answers (handle multiple answers like "A, B, C")
      const answerList = answer.split(',').map(a => a.trim().toUpperCase());
      console.log('Answer list:', answerList);

      const clickedOptions = [];

      for (const singleAnswer of answerList) {
        // Extract just the letter if answer contains more (e.g., "B. receptionist" -> "B")
        const letterMatch = singleAnswer.match(/^([A-D])/i);
        const targetLetter = letterMatch ? letterMatch[1].toUpperCase() : singleAnswer.toUpperCase();

        // Convert letter to position if needed (A->1, B->2, etc.) - used as fallback
        const targetPosition = letterToPosition(targetLetter);

        // Try multiple matching strategies in order of priority
        let matchingOption = null;

        // Strategy 1: Match by letter PREFIX in option text (e.g., "B. receptionist" starts with "B")
        // This handles Quizizz's scrambled options where visual position != letter
        matchingOption = options.find(opt => {
          const textLetterMatch = opt.text.match(/^([A-D])[.\s:)]/i);
          if (textLetterMatch) {
            return textLetterMatch[1].toUpperCase() === targetLetter;
          }
          return false;
        });

        if (matchingOption) {
          console.log('Matched by text letter prefix:', targetLetter, '->', matchingOption.text.substring(0, 20));
        }

        // Strategy 2: Match by exact full text (if AI returned full option text)
        if (!matchingOption) {
          matchingOption = options.find(opt => opt.textUpper === singleAnswer);
          if (matchingOption) {
            console.log('Matched by exact text');
          }
        }

        // Strategy 3: Match by partial text content (AI returned part of the answer)
        if (!matchingOption && singleAnswer.length > 2) {
          matchingOption = options.find(opt =>
            opt.textUpper.includes(singleAnswer) || singleAnswer.includes(opt.textUpper)
          );
          if (matchingOption) {
            console.log('Matched by partial text');
          }
        }

        // Strategy 4: Match by position number (fallback for simple quizzes without letter prefixes)
        if (!matchingOption) {
          matchingOption = options.find(opt => opt.position === targetPosition);
          if (matchingOption) {
            console.log('Matched by position fallback:', targetPosition);
          }
        }

        // Strategy 5: Match if answer is a number directly
        if (!matchingOption && /^\d+$/.test(singleAnswer)) {
          matchingOption = options.find(opt => opt.position === singleAnswer);
          if (matchingOption) {
            console.log('Matched by direct number');
          }
        }

        if (matchingOption) {
          // Add random delay between clicks
          const randomDelay = delay + Math.floor(Math.random() * 200) - 100;
          await new Promise(resolve => setTimeout(resolve, Math.max(100, randomDelay)));

          // Click the button
          matchingOption.button.click();
          console.log('Clicked option:', matchingOption.text.substring(0, 30));
          clickedOptions.push(targetLetter);
        } else {
          console.log('No match found for:', singleAnswer);
        }
      }

      // For MSQ: Click submit button after selecting all options
      if (isMSQ && clickedOptions.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const submitBtn = document.querySelector('button[data-cy="submit-button"]');
        if (submitBtn && !submitBtn.disabled) {
          submitBtn.click();
          console.log('MSQ Submit button clicked');
        }
      }

      if (clickedOptions.length > 0) {
        if (showNotification) {
          showAutoClickNotification(clickedOptions.join(', '));
        }
        console.log('=== AUTO-CLICK COMPLETE ===');
        return { success: true, clicked: clickedOptions.join(', ') };
      } else {
        console.log('No options were clicked');
        return { success: false, reason: 'no_match' };
      }
    }

    // PRIORITY 2: Fall back to text input (open-ended questions)
    let textarea = document.querySelector('textarea[data-cy="open-ended-textarea"]');
    if (!textarea) textarea = document.querySelector('textarea.typed-option-input');
    if (!textarea) textarea = document.querySelector('.typed-option-container textarea');

    if (textarea) {
      console.log('No buttons found, using text input mode');
      return await handleTextInput(textarea, answer, delay, showNotification);
    }

    console.log('No option buttons or textarea found');
    return { success: false, reason: 'no_options_found' };
  }

  /**
   * Show a small notification when auto-click happens
   */
  function showAutoClickNotification(answer) {
    // Remove existing notification if any
    const existing = document.getElementById('vision-key-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.id = 'vision-key-notification';
    notification.innerHTML = `✅ Đã chọn: <strong>${answer}</strong>`;
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      z-index: 2147483647;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.3s ease-out;
      pointer-events: none;
    `;

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(notification);

    // Remove after 2 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in forwards';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }
}
