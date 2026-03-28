const fs = require('fs');

async function testUpload() {
  const formData = new FormData();
  
  // Create a minimal valid image (1x1 PNG transparent)
  const pngData = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082', 'hex');
  
  const blob = new Blob([pngData], { type: 'image/png' });
  formData.append('file', blob, 'test.png');

  try {
    const res = await fetch('http://localhost:3000/event/test-id-1234/image', {
      method: 'POST',
      body: formData
    });
    
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${text}`);
  } catch (err) {
    console.error(`Fetch failed: ${err.message}`);
  }
}

testUpload();
