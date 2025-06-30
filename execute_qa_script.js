
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Excel Q&A 데이터 로딩 스크립트 실행 중...');
console.log('=' * 50);

// Execute the load_qa_data.js script
const scriptPath = join(__dirname, 'load_qa_data.js');
const child = spawn('node', [scriptPath], { 
  stdio: 'inherit',
  shell: true 
});

child.on('close', (code) => {
  console.log('\n' + '=' * 50);
  if (code === 0) {
    console.log('✅ Excel Q&A 데이터 로딩이 성공적으로 완료되었습니다!');
    console.log('📊 146개의 한국 대학교 Q&A 데이터가 시스템에 로드되었습니다.');
  } else {
    console.log(`❌ 스크립트 실행이 종료 코드 ${code}로 종료되었습니다.`);
  }
});

child.on('error', (error) => {
  console.error('❌ 스크립트 실행 중 오류 발생:', error.message);
});
