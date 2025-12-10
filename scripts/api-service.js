// api-service.js - Gemini API integration for Vision Key

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

/**
 * Call Gemini API with image and prompt
 * @param {string} imageDataUrl - Base64 encoded image
 * @param {string} mode - 'tracNghiem' or 'tuLuan'
 * @param {string} expertContext - Optional expert context
 * @param {string} apiKey - Gemini API key
 * @returns {Promise<string>} API response
 */
async function analyzeWithGemini(imageDataUrl, mode, expertContext, apiKey) {
  try {
    console.log('=== GEMINI API CALL START ===');
    console.log('Mode:', mode);
    console.log('Expert:', expertContext || 'None');
    console.log('Image length:', imageDataUrl?.length);

    // Validate inputs
    if (!imageDataUrl) {
      throw new Error('No image provided');
    }

    if (!apiKey) {
      throw new Error('API key not configured. Please set it in Settings.');
    }

    // Build prompt based on mode
    const prompt = buildPrompt(mode, expertContext);
    console.log('Prompt built:', prompt.substring(0, 100) + '...');

    // Extract base64 from dataURL
    const base64Data = imageDataUrl.split(',')[1];
    if (!base64Data) {
      throw new Error('Invalid image format');
    }

    // Build request body
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            },
            {
              inline_data: {
                mime_type: 'image/png',
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: mode === 'tracNghiem' ? 0.1 : 0.4,
        topK: mode === 'tracNghiem' ? 1 : 40,
        topP: mode === 'tracNghiem' ? 0.8 : 0.95,
        maxOutputTokens: mode === 'tracNghiem' ? 512 : 2048,
      }
    };

    console.log('Sending request to Gemini API...');

    // Call API
    const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API error:', errorData);
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Response received:', JSON.stringify(data).substring(0, 200) + '...');

    // Extract text from response
    const text = extractTextFromResponse(data);
    console.log('Extracted text:', text);

    // Parse FINAL_ANSWER
    const finalAnswer = parseFinalAnswer(text);
    console.log('Final answer:', finalAnswer);

    console.log('=== GEMINI API CALL COMPLETE ===');

    return {
      fullText: text,
      finalAnswer: finalAnswer,
      raw: data
    };

  } catch (error) {
    console.error('=== GEMINI API CALL FAILED ===');
    console.error('Error:', error);
    throw error;
  }
}

/**
 * Build prompt based on mode
 */
function buildPrompt(mode, expertContext) {
  const expertRole = expertContext
    ? `Bạn là chuyên gia ${expertContext}.`
    : 'Bạn là trợ lý AI thông minh.';

  if (mode === 'tracNghiem') {
    return `${expertRole}

NHIỆM VỤ: Trả lời các câu hỏi trắc nghiệm trong hình.

CÁCH LÀM:
1. Đọc và hiểu từng câu hỏi
2. Suy luận ngắn gọn (1-2 dòng mỗi câu)
3. Đưa ra đáp án cuối cùng theo format bên dưới

FORMAT TRẢ LỜI (BẮT BUỘC):
[Suy luận ngắn cho mỗi câu]

ĐÁP ÁN:
Câu 1: [A/B/C/D]
Câu 2: [A/B/C/D]
(tiếp tục nếu có nhiều câu)

VÍ DỤ:
Câu 1 hỏi về thì quá khứ hoàn thành, dấu hiệu "before" -> dùng had + V3.
Câu 2 hỏi về từ vựng, "essential" = cần thiết.

ĐÁP ÁN:
Câu 1: A
Câu 2: C

Bắt đầu phân tích và trả lời:`;
  } else {
    return `${expertRole}

Phân tích hình ảnh này và trả lời chi tiết câu hỏi.

Quy tắc:
1. Đọc và hiểu câu hỏi trong hình
2. Phân tích kỹ lưỡng
3. Giải thích từng bước
4. Đưa ra câu trả lời cuối cùng

Format trả lời:
1. Tóm tắt câu hỏi
2. Phân tích chi tiết
3. Các bước giải quyết
4. FINAL_ANSWER: [câu trả lời cuối cùng]

Hãy trả lời bằng tiếng Việt, rõ ràng và chi tiết.`;
  }
}

/**
 * Extract text from Gemini response
 */
function extractTextFromResponse(data) {
  try {
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        return candidate.content.parts[0].text || '';
      }
    }
    throw new Error('No text found in response');
  } catch (error) {
    console.error('Error extracting text:', error);
    throw new Error('Failed to parse API response');
  }
}

/**
 * Parse answers from text (supports multiple questions)
 */
function parseFinalAnswer(text) {
  console.log('Parsing answer from text:', text);

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
 * Test API key
 */
async function testApiKey(apiKey) {
  try {
    const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'Hello'
              }
            ]
          }
        ]
      })
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

// Export functions
export {
  analyzeWithGemini,
  testApiKey,
  buildPrompt,
  parseFinalAnswer
};
