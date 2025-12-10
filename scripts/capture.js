// capture.js - Screen capture functionality for Vision Key

/**
 * Capture the full visible viewport of the active tab
 * @returns {Promise<string>} dataURL of the captured screenshot
 */
async function captureFullViewport() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      throw new Error('No active tab found');
    }
    
    // Capture visible tab as dataURL
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 100
    });
    
    console.log('Captured viewport:', dataUrl.substring(0, 50) + '...');
    return dataUrl;
    
  } catch (error) {
    console.error('Capture error:', error);
    throw error;
  }
}

/**
 * Convert dataURL to Blob object
 * @param {string} dataUrl - The dataURL to convert
 * @returns {Blob} Blob object
 */
function dataURLtoBlob(dataUrl) {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
}

/**
 * Crop an image based on selection rectangle
 * @param {string} dataUrl - The original image dataURL
 * @param {Object} rect - Selection rectangle {x, y, width, height}
 * @returns {Promise<string>} Cropped image dataURL
 */
async function cropImage(dataUrl, rect) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      const ctx = canvas.getContext('2d');
      
      // Draw cropped portion
      ctx.drawImage(
        img,
        rect.x, rect.y, rect.width, rect.height,  // Source rectangle
        0, 0, rect.width, rect.height              // Destination rectangle
      );
      
      // Convert to dataURL
      const croppedDataUrl = canvas.toDataURL('image/png');
      console.log('Image cropped:', rect);
      resolve(croppedDataUrl);
    };
    
    img.onerror = (error) => {
      console.error('Image load error:', error);
      reject(error);
    };
    
    img.src = dataUrl;
  });
}

/**
 * Get image dimensions from dataURL
 * @param {string} dataUrl - The image dataURL
 * @returns {Promise<{width: number, height: number}>} Image dimensions
 */
async function getImageDimensions(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// Export functions
export { 
  captureFullViewport, 
  dataURLtoBlob, 
  cropImage,
  getImageDimensions
};
