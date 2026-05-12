const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

const testImagesDir = path.join(__dirname, 'test-images');

if (!fs.existsSync(testImagesDir)) {
  fs.mkdirSync(testImagesDir, { recursive: true });
}

function generateSVG(index, color) {
  const width = 800;
  const height = 600;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad${index}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad${index})"/>
  <circle cx="${width/2}" cy="${height/2}" r="150" fill="rgba(255,255,255,0.3)"/>
  <circle cx="${width/2 - 100}" cy="${height/2 - 100}" r="80" fill="rgba(255,255,255,0.2)"/>
  <circle cx="${width/2 + 120}" cy="${height/2 + 80}" r="60" fill="rgba(255,255,255,0.2)"/>
  <text x="50%" y="45%" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="rgba(255,255,255,0.8)" text-anchor="middle">照片 ${index + 1}</text>
  <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.6)" text-anchor="middle">测试图片 - Album System</text>
</svg>`;
}

console.log('正在生成10张测试图片...\n');

for (let i = 0; i < 10; i++) {
  const svg = generateSVG(i, colors[i]);
  const filename = `test_photo_${i + 1}.svg`;
  const filepath = path.join(testImagesDir, filename);
  fs.writeFileSync(filepath, svg);
  console.log(`生成: ${filename}`);
}

console.log('\n测试图片生成完成！');
console.log('\n正在上传图片到相册系统...\n');

const files = fs.readdirSync(testImagesDir).filter(f => f.endsWith('.svg'));

files.forEach((file, index) => {
  const filepath = path.join(testImagesDir, file);
  try {
    const result = execSync(
      `curl -s -X POST http://localhost:3000/api/media/upload -F "files=@${filepath}"`,
      { encoding: 'utf-8' }
    );
    const response = JSON.parse(result);
    if (response.files && response.files.length > 0) {
      console.log(`上传成功: ${file}`);
    } else {
      console.log(`上传失败: ${file}`);
    }
  } catch (error) {
    console.log(`上传错误: ${file} - ${error.message}`);
  }
});

console.log('\n所有图片上传完成！');
console.log('请访问 http://localhost:3000 查看相册');
