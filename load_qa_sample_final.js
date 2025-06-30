import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 메모리 스토리지 파일 직접 조작
async function loadQASampleToMemoryStorage() {
  try {
    console.log('📊 Excel 파일에서 Q&A 샘플 데이터 로드 중...');
    
    // Excel 파일 읽기
    const filePath = join(__dirname, 'attached_assets', '질의응답샘플 062825_1751253829317.xlsx');
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Excel 파일을 찾을 수 없습니다: ${filePath}`);
    }
    
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📋 Excel 파일에서 ${data.length}개의 행을 발견했습니다.`);
    
    if (data.length > 0) {
      console.log('📝 Excel 컬럼 구조:', Object.keys(data[0]));
      console.log('📝 첫 번째 행 샘플:', JSON.stringify(data[0], null, 2));
    }
    
    // 메모리 스토리지 데이터 파일 읽기
    const memoryStorageFile = join(__dirname, 'data', 'memory-storage.json');
    let memoryData = {};
    
    if (fs.existsSync(memoryStorageFile)) {
      const rawData = fs.readFileSync(memoryStorageFile, 'utf8');
      memoryData = JSON.parse(rawData);
      console.log('📂 기존 메모리 스토리지 데이터 로드됨');
    } else {
      console.log('📂 새로운 메모리 스토리지 파일 생성 예정');
      memoryData = {
        users: [],
        agents: [],
        conversations: [],
        messages: [],
        documents: [],
        qaLogs: [],
        organizationCategories: [],
        messageReactions: []
      };
    }
    
    // 에이전트와 사용자 데이터 로드
    const agentsFile = join(__dirname, 'data', 'memory-storage-agents.json');
    let agents = [];
    if (fs.existsSync(agentsFile)) {
      const agentsData = fs.readFileSync(agentsFile, 'utf8');
      agents = JSON.parse(agentsData);
      console.log(`👤 ${agents.length}개의 에이전트 데이터 로드됨`);
    }
    
    // 기존 QA 로그 초기화
    memoryData.qaLogs = [];
    console.log('🗑️ 기존 QA 로그 데이터를 초기화했습니다.');
    
    // Excel 데이터를 QA 로그 형식으로 변환
    const qaLogs = [];
    let successCount = 0;
    let idCounter = 1;
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // 8컬럼 구조 매핑
        const timestamp = row['대화 시각'] || row['대화시각'] || row['timestamp'] || new Date();
        const agentType = row['에이전트 유형'] || row['에이전트유형'] || row['agentType'] || '학교';
        const agentName = row['에이전트 명'] || row['에이전트명'] || row['agentName'] || '전남대학교 학사일정 AI';
        const userType = row['사용자 유형'] || row['사용자유형'] || row['userType'] || '학부생';
        const questionContent = row['질문 내용'] || row['질문내용'] || row['질문'] || row['questionContent'] || '';
        const responseContent = row['챗봇 응답내용'] || row['챗봇응답내용'] || row['응답내용'] || row['답변'] || row['responseContent'] || '';
        const responseType = row['응답 유형'] || row['응답유형'] || row['responseType'] || 'general';
        // 응답 시간 처리 (예: "0.5초" -> 0.5)
        let responseTime = row['응답시간'] || row['responseTime'] || 1;
        if (typeof responseTime === 'string') {
          // "0.5초", "1초" 등의 형태에서 숫자만 추출
          const timeMatch = responseTime.match(/[\d.]+/);
          responseTime = timeMatch ? parseFloat(timeMatch[0]) : 1;
        } else if (typeof responseTime === 'number') {
          responseTime = responseTime;
        } else {
          responseTime = 1;
        }
        
        if (!questionContent || !responseContent) {
          console.log(`⚠️ 행 ${i + 1}: 질문 또는 응답 내용이 비어있어 건너뜁니다.`);
          continue;
        }
        
        // 에이전트 매칭
        let matchedAgent = null;
        if (agents.length > 0) {
          matchedAgent = agents.find(agent => 
            agent.name && (agent.name.includes(agentName) || agentName.includes(agent.name))
          );
          if (!matchedAgent) {
            matchedAgent = agents[Math.floor(Math.random() * agents.length)];
          }
        }
        
        // 타임스탬프 처리 (Excel 시리얼 번호 형식)
        let parsedTimestamp;
        if (typeof timestamp === 'number') {
          // Excel 날짜 시리얼 번호를 JavaScript Date로 변환
          // Excel에서 1900년 1월 1일을 기준으로 계산 (Windows Excel 기준)
          const excelDate = new Date((timestamp - 25569) * 86400 * 1000);
          parsedTimestamp = excelDate;
          
          // 한국 시간대 조정 (UTC+9)
          const kstOffset = 9 * 60 * 60 * 1000; // 9시간을 밀리초로 변환
          parsedTimestamp = new Date(excelDate.getTime() + kstOffset);
          
        } else if (timestamp instanceof Date) {
          parsedTimestamp = timestamp;
        } else if (typeof timestamp === 'string') {
          parsedTimestamp = new Date(timestamp);
          if (isNaN(parsedTimestamp.getTime())) {
            parsedTimestamp = new Date();
          }
        } else {
          parsedTimestamp = new Date();
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
          responseTime: responseTime,
          agentId: matchedAgent?.id || null,
          userId: 'user1081' // 기본 사용자 ID
        };
        
        qaLogs.push(qaLog);
        successCount++;
        
        if (successCount % 10 === 0) {
          console.log(`✅ QA 로그 ${successCount}개 생성 완료...`);
        }
        
      } catch (error) {
        console.error(`❌ 행 ${i + 1} 처리 중 오류:`, error.message);
        continue;
      }
    }
    
    // 메모리 스토리지에 QA 로그 저장
    memoryData.qaLogs = qaLogs;
    
    // 파일에 저장
    fs.writeFileSync(memoryStorageFile, JSON.stringify(memoryData, null, 2), 'utf8');
    
    console.log(`\n🎉 총 ${successCount}개의 QA 로그가 Excel 데이터에서 성공적으로 생성되었습니다.`);
    console.log(`📈 처리율: ${((successCount / data.length) * 100).toFixed(1)}%`);
    console.log(`💾 메모리 스토리지 파일에 저장 완료: ${memoryStorageFile}`);
    
    // 에이전트 유형별 통계
    const agentTypeStats = {};
    qaLogs.forEach(log => {
      agentTypeStats[log.agentType] = (agentTypeStats[log.agentType] || 0) + 1;
    });
    
    console.log('\n📊 에이전트 유형별 통계:');
    Object.entries(agentTypeStats).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}개`);
    });
    
    // 생성된 로그 샘플 출력
    console.log('\n📋 생성된 QA 로그 샘플 (최신 5개):');
    qaLogs.slice(0, 5).forEach((log, index) => {
      console.log(`${index + 1}. [${log.agentType}] ${log.agentName}`);
      console.log(`   시간: ${new Date(log.timestamp).toLocaleString('ko-KR')}`);
      console.log(`   사용자: ${log.userType}`);
      console.log(`   질문: ${log.questionContent.substring(0, 80)}...`);
      console.log(`   응답: ${log.responseContent.substring(0, 80)}...`);
      console.log(`   응답시간: ${log.responseTime}초`);
      console.log('');
    });
    
    console.log('\n🔄 서버를 재시작하면 새로운 QA 로그 데이터가 로드됩니다.');
    
  } catch (error) {
    console.error('❌ Excel 파일 로드 중 오류 발생:', error);
    console.error('스택 트레이스:', error.stack);
  }
}

// 스크립트 실행
loadQASampleToMemoryStorage().catch(console.error);