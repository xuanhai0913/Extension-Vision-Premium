// api-service.js - Proxy API integration for Vision Key (SaaS Edition)

/**
 * Compress image before sending to reduce payload size
 * @param {string} imageDataUrl - Original image data URL
 * @param {number} maxDimension - Maximum width/height (default 1024px)
 * @param {number} quality - JPEG quality 0-1 (default 0.7)
 * @returns {Promise<string>} Compressed image as base64
 */
async function compressImage(imageDataUrl, maxDimension = 1024, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round(height * maxDimension / width);
          width = maxDimension;
        } else {
          width = Math.round(width * maxDimension / height);
          height = maxDimension;
        }
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG for smaller size
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

      console.log(`Image compressed: ${imageDataUrl.length} -> ${compressedDataUrl.length} bytes`);
      resolve(compressedDataUrl);
    };

    img.onerror = reject;
    img.src = imageDataUrl;
  });
}

/**
 * Call Proxy API with image and prompt
 * @param {string} imageDataUrl - Base64 encoded image
 * @param {string} mode - 'tracNghiem' or 'tuLuan'
 * @param {string} expertContext - Optional expert context
 * @param {string} licenseKey - User's license key (not used, kept for compatibility)
 * @returns {Promise<object>} API response with fullText and finalAnswer
 */
async function analyzeWithGemini(imageDataUrl, mode, expertContext, licenseKey) {
  try {
    console.log('=== PROXY API CALL START ===');
    console.log('Mode:', mode);
    console.log('Expert:', expertContext || 'None');
    console.log('Original image length:', imageDataUrl?.length);

    // Validate inputs
    if (!imageDataUrl) {
      throw new Error('No image provided');
    }

    // Get settings from storage
    const settings = await new Promise(resolve => {
      chrome.storage.sync.get(['licenseKey', 'proxyUrl'], resolve);
    });

    const userKey = settings.licenseKey;
    const proxyUrl = settings.proxyUrl || 'https://admin.hailamdev.space';

    if (!userKey) {
      throw new Error('License Key chưa được cấu hình. Vui lòng nhập trong Settings.');
    }

    // Compress image before sending
    console.log('Compressing image...');
    const compressedImage = await compressImage(imageDataUrl, 1024, 0.7);
    console.log('Compressed image length:', compressedImage.length);

    // Extract base64 from dataURL
    const base64Data = compressedImage.split(',')[1];
    if (!base64Data) {
      throw new Error('Invalid image format');
    }

    // Build request body for proxy
    const requestBody = {
      userKey: userKey,
      imageBase64: base64Data,
      mode: mode,
      expertContext: expertContext || '',
      prompt: '' // Additional prompt if needed
    };

    console.log('Sending request to proxy:', proxyUrl);
    console.log('Request body size:', JSON.stringify(requestBody).length);

    // Call Proxy API
    let response;
    try {
      response = await fetch(`${proxyUrl}/api/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
    } catch (fetchError) {
      console.error('Fetch failed:', fetchError);
      throw new Error(`Không thể kết nối đến server: ${proxyUrl}. Chi tiết: ${fetchError.message}`);
    }

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('API error:', errorData);
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    // Handle streaming response
    const text = await handleStreamingResponse(response);
    console.log('Full text received:', text.substring(0, 200) + '...');

    // Parse answer
    const finalAnswer = parseFinalAnswer(text);
    console.log('Final answer:', finalAnswer);

    console.log('=== PROXY API CALL COMPLETE ===');

    return {
      fullText: text,
      finalAnswer: finalAnswer,
      raw: null
    };

  } catch (error) {
    console.error('=== PROXY API CALL FAILED ===');
    console.error('Error:', error);
    throw error;
  }
}

/**
 * Handle streaming response from proxy
 * @param {Response} response - Fetch response object
 * @returns {Promise<string>} Full text from stream
 */
async function handleStreamingResponse(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      // Parse SSE events
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
              fullText += parsed.candidates[0].content.parts[0].text;
            }
          } catch (e) {
            // Not JSON, might be raw text
            if (data.trim()) {
              fullText += data;
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullText;
}

/**
 * Parse answers from text (supports multiple questions)
 */
function parseFinalAnswer(text) {
  console.log('Parsing answer from text:', text.substring(0, 200));

  // First, try to find the "ĐÁP ÁN:" section and extract answers from there
  const dapAnSection = text.match(/ĐÁP\s*ÁN\s*:?\s*([\s\S]*?)(?=\n\n|$)/i);
  let searchText = dapAnSection ? dapAnSection[1] : text;

  // Primary: Find all "Câu X: Y" patterns
  const cauPattern = /[Cc]âu\s*(\d+)\s*[:\.\)]\s*([A-Da-d])/gi;
  const matches = [...searchText.matchAll(cauPattern)];

  if (matches.length > 0) {
    // Sort by question number and extract answers
    const sortedMatches = matches.sort((a, b) => parseInt(a[1]) - parseInt(b[1]));
    const answers = sortedMatches.map(m => m[2].toUpperCase());
    console.log('Found answers:', answers);
    return answers.join(', ');
  }

  // If no matches in section, try full text
  if (dapAnSection) {
    const fullMatches = [...text.matchAll(cauPattern)];
    if (fullMatches.length > 0) {
      const sortedMatches = fullMatches.sort((a, b) => parseInt(a[1]) - parseInt(b[1]));
      const answers = sortedMatches.map(m => m[2].toUpperCase());
      console.log('Found answers (full text):', answers);
      return answers.join(', ');
    }
  }

  // Alternative: Try "1: A" or "1. A" format
  const numPattern = /^(\d+)\s*[:\.\)]\s*([A-Da-d])\s*$/gm;
  const numMatches = [...searchText.matchAll(numPattern)];

  if (numMatches.length > 0) {
    const sortedMatches = numMatches.sort((a, b) => parseInt(a[1]) - parseInt(b[1]));
    const answers = sortedMatches.map(m => m[2].toUpperCase());
    console.log('Found answers (num format):', answers);
    return answers.join(', ');
  }

  // Fallback: Try FINAL_ANSWER format with single letter
  const singleMatch = text.match(/FINAL_ANSWER[S]?:\s*([A-Da-d])\s*(?:\n|$)/i);
  if (singleMatch) {
    return singleMatch[1].toUpperCase();
  }

  // NEW: Try FINAL_ANSWER with any text content (for essay questions)
  const freeTextMatch = text.match(/\*?\*?FINAL_ANSWER\*?\*?[S]?:?\*?\*?\s*(.+?)(?:\n\n|$)/i);
  if (freeTextMatch) {
    const answer = freeTextMatch[1].trim().replace(/^\*+|\*+$/g, ''); // Remove markdown asterisks
    console.log('Found free-text answer:', answer);
    return answer;
  }

  // Last resort: find standalone answer like "Đáp án: B"
  const simpleMatch = text.match(/[Đđ]áp\s*án[:\s]+([A-Da-d])/i);
  if (simpleMatch) {
    return simpleMatch[1].toUpperCase();
  }

  console.log('No answer pattern found');
  return null;
}

/**
 * Build prompt based on mode (kept for compatibility, actual prompt is built server-side)
 */
function buildPrompt(mode, expertContext) {
  const expertRole = expertContext
    ? `Bạn là chuyên gia ${expertContext}.`
    : 'Bạn là trợ lý AI thông minh.';

  if (mode === 'tracNghiem') {
    return `${expertRole}

NHIỆM VỤ: Trả lời các câu hỏi trắc nghiệm trong hình.`;
  } else {
    return `${expertRole}

Phân tích hình ảnh này và trả lời chi tiết câu hỏi.`;
  }
}

/**
 * Test proxy connection
 */
async function testProxyConnection(proxyUrl) {
  try {
    const response = await fetch(`${proxyUrl}/api/quota?key=test`, {
      method: 'GET'
    });
    return response.status !== 500;
  } catch (error) {
    return false;
  }
}

// Export functions
export {
  analyzeWithGemini,
  compressImage,
  buildPrompt,
  parseFinalAnswer,
  testProxyConnection
};
