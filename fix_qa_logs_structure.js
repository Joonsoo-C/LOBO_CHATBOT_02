import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function fixQALogsStructure() {
  try {
    console.log('🔧 Q&A 로그 구조 수정 중...');
    
    // 현재 memory-storage.json 읽기
    const memoryStorageFile = join(__dirname, 'data', 'memory-storage.json');
    let currentData = [];
    
    if (fs.existsSync(memoryStorageFile)) {
      const rawData = fs.readFileSync(memoryStorageFile, 'utf8');
      currentData = JSON.parse(rawData);
      console.log('📂 현재 memory-storage.json 데이터 로드됨 (사용자 배열)');
    }
    
    // Excel 파일에서 Q&A 데이터 다시 읽기
    const filePath = join(__dirname, 'attached_assets', '질의응답샘플 062825_1751253829317.xlsx');
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Excel 파일을 찾을 수 없습니다: ${filePath}`);
    }
    
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📋 Excel 파일에서 ${data.length}개의 Q&A 로그를 읽었습니다.`);
    
    // 새로운 올바른 구조 생성
    const newStructure = {
      users: currentData, // 기존 사용자 데이터 유지
      agents: [],
      conversations: [],
      messages: [],
      documents: [],
      qaLogs: [], // 새로운 Q&A 로그 섹션
      organizationCategories: [],
      messageReactions: []
    };
    
    // Excel 데이터를 QA 로그로 변환
    let idCounter = 1;
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const timestamp = row['대화 시각'] || row['대화시각'] || row['timestamp'] || new Date();
        const agentType = row['에이전트 유형'] || row['에이전트유형'] || row['agentType'] || '학교';
        const agentName = row['에이전트 명'] || row['에이전트명'] || row['agentName'] || '전남대학교 학사일정 AI';
        const userType = row['사용자 유형'] || row['사용자유형'] || row['userType'] || '학부생';
        const questionContent = row['질문 내용'] || row['질문내용'] || row['질문'] || row['questionContent'] || '';
        const responseContent = row['챗봇 응답내용'] || row['챗봇응답내용'] || row['응답내용'] || row['답변'] || row['responseContent'] || '';
        const responseType = row['응답 유형'] || row['응답유형'] || row['responseType'] || 'AI 생성';
        const responseTime = row['응답시간'] || row['responseTime'] || '0.5초';
        
        if (!questionContent || !responseContent) {
          console.log(`⚠️ 행 ${i + 1}: 질문 또는 응답 내용이 비어있어 건너뜁니다.`);
          continue;
        }
        
        // 타임스탬프 처리
        let parsedTimestamp;
        if (timestamp instanceof Date) {
          parsedTimestamp = timestamp;
        } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
          parsedTimestamp = new Date(timestamp);
          if (isNaN(parsedTimestamp.getTime())) {
            if (typeof timestamp === 'number') {
              const excelDate = new Date((timestamp - 25569) * 86400 * 1000);
              parsedTimestamp = isNaN(excelDate.getTime()) ? new Date() : excelDate;
            } else {
              parsedTimestamp = new Date();
            }
          }
        } else {
          parsedTimestamp = new Date();
        }
        
        // 응답시간을 숫자로 변환
        let responseTimeNum = 1;
        if (typeof responseTime === 'string') {
          const match = responseTime.match(/(\d+\.?\d*)/);
          if (match) {
            responseTimeNum = parseFloat(match[1]);
          }
        } else if (typeof responseTime === 'number') {
          responseTimeNum = responseTime;
        }
        
        const qaLog = {
          id: idCounter++,
          timestamp: parsedTimestamp.toISOString(),
          agentType: agentType.toString(),
          agentName: agentName.toString(),
          userType: userType.toString(),
          questionContent: questionContent.toString().substring(0, 1000),
          responseContent: responseContent.toString().substring(0, 2000),
          responseType: responseType.toString(),
          responseTime: responseTimeNum,
          agentId: Math.floor(Math.random() * 100) + 1, // 랜덤 에이전트 ID
          userId: 'user1081', // 기본 사용자 ID
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        newStructure.qaLogs.push(qaLog);
        
      } catch (error) {
        console.error(`❌ 행 ${i + 1} 처리 중 오류:`, error.message);
        continue;
      }
    }
    
    // 새로운 구조를 파일에 저장
    fs.writeFileSync(memoryStorageFile, JSON.stringify(newStructure, null, 2), 'utf8');
    
    console.log(`✅ Q&A 로그 구조 수정 완료!`);
    console.log(`📊 총 ${newStructure.qaLogs.length}개의 Q&A 로그가 저장되었습니다.`);
    console.log(`💾 파일 저장 완료: ${memoryStorageFile}`);
    console.log(`🔄 서버를 재시작하면 새로운 Q&A 로그 데이터가 로드됩니다.`);
    
    // 에이전트 유형별 통계
    const agentTypeStats = {};
    newStructure.qaLogs.forEach(log => {
      agentTypeStats[log.agentType] = (agentTypeStats[log.agentType] || 0) + 1;
    });
    
    console.log('\n📊 에이전트 유형별 통계:');
    Object.entries(agentTypeStats).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}개`);
    });
    
  } catch (error) {
    console.error('❌ Q&A 로그 구조 수정 중 오류 발생:', error);
    console.error('스택 트레이스:', error.stack);
  }
}

// 스크립트 실행
fixQALogsStructure().catch(console.error);