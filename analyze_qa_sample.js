import XLSX from 'xlsx';
import fs from 'fs';

async function analyzeQASample() {
  try {
    console.log('질의응답 샘플 파일 분석 중...');
    
    // Excel 파일 읽기
    const workbook = XLSX.readFile('attached_assets/질의응답샘플 062825_1751247683756.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // JSON으로 변환
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('엑셀 시트명:', sheetName);
    console.log('총 행 수:', data.length);
    
    if (data.length > 0) {
      console.log('헤더 행:', data[0]);
      
      // 처음 몇 개 데이터 행 출력
      for (let i = 1; i < Math.min(6, data.length); i++) {
        console.log(`데이터 행 ${i}:`, data[i]);
      }
      
      // 컬럼 구조 분석
      const headers = data[0];
      console.log('\n컬럼 구조 분석:');
      headers.forEach((header, index) => {
        console.log(`컬럼 ${index + 1}: ${header}`);
      });
    }
    
    // JSON 형태로 변환하여 저장
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    fs.writeFileSync('qa_sample_data.json', JSON.stringify(jsonData, null, 2), 'utf8');
    console.log('\nJSON 파일로 저장 완료: qa_sample_data.json');
    console.log('총 데이터 항목 수:', jsonData.length);
    
  } catch (error) {
    console.error('파일 분석 중 오류:', error);
  }
}

analyzeQASample();