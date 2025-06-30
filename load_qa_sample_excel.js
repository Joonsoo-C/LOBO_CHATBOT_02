import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { MemoryStorage } from './server/memory-storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadQASampleFromExcel() {
  try {
    console.log('📊 Excel 파일에서 Q&A 샘플 데이터 로드 중...');
    
    // Excel 파일 읽기
    const filePath = join(__dirname, 'attached_assets', '질의응답샘플 062825_1751253829317.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📋 Excel 파일에서 ${data.length}개의 행을 발견했습니다.`);
    console.log('첫 번째 행 구조:', Object.keys(data[0] || {}));
    
    // 데이터 구조 분석
    if (data.length > 0) {
      console.log('\n📝 샘플 데이터 구조:');
      console.log(JSON.stringify(data[0], null, 2));
    }
    
    // Memory Storage 초기화
    const storage = new MemoryStorage();
    
    // 기존 QA 로그 모두 삭제
    await storage.clearAllQALogs();
    console.log('🗑️ 기존 QA 로그 데이터를 삭제했습니다.');
    
    const agents = await storage.getAllAgents();
    const users = await storage.getAllUsers();
    
    console.log(`📊 사용 가능한 에이전트: ${agents.length}개`);
    console.log(`👥 사용 가능한 사용자: ${users.length}개`);
    
    // Excel 데이터를 QA 로그 형식으로 변환 - 8컬럼 구조에 맞춰 수정
    const qaLogs = [];
    let successCount = 0;
    
    // 모든 146개 행 처리
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // 8컬럼 구조 매핑: 대화 시각, 에이전트 유형, 에이전트 명, 사용자 유형, 질문 내용, 챗봇 응답내용, 응답 유형, 응답시간
        const timestamp = row['대화 시각'] || row['대화시각'] || row['timestamp'] || new Date();
        const agentType = row['에이전트 유형'] || row['에이전트유형'] || row['agentType'] || '학교';
        const agentName = row['에이전트 명'] || row['에이전트명'] || row['agentName'] || '전남대학교 학사일정 AI';
        const userType = row['사용자 유형'] || row['사용자유형'] || row['userType'] || '학부생';
        const questionContent = row['질문 내용'] || row['질문내용'] || row['질문'] || row['questionContent'] || '';
        const responseContent = row['챗봇 응답내용'] || row['챗봇응답내용'] || row['응답내용'] || row['답변'] || row['responseContent'] || '';
        const responseType = row['응답 유형'] || row['응답유형'] || row['responseType'] || 'general';
        const responseTime = row['응답시간'] || row['responseTime'] || Math.floor(Math.random() * 3) + 1;
        
        if (!questionContent || !responseContent) {
          console.log(`⚠️ 행 ${i + 1}: 질문 또는 응답 내용이 비어있어 건너뜁니다.`);
          continue;
        }
        
        // 에이전트 매칭 또는 랜덤 선택
        let matchedAgent = agents.find(agent => 
          agent.name.includes(agentName) || agentName.includes(agent.name)
        );
        if (!matchedAgent) {
          matchedAgent = agents[Math.floor(Math.random() * agents.length)];
        }
        
        // 사용자 매칭 또는 랜덤 선택
        let matchedUser = users.find(user => user.userType === userType);
        if (!matchedUser) {
          matchedUser = users[Math.floor(Math.random() * users.length)];
        }
        
        // 타임스탬프 처리
        let parsedTimestamp;
        if (timestamp instanceof Date) {
          parsedTimestamp = timestamp;
        } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
          parsedTimestamp = new Date(timestamp);
          if (isNaN(parsedTimestamp.getTime())) {
            // 엑셀 날짜 형식 처리
            const excelDate = new Date((timestamp - 25569) * 86400 * 1000);
            parsedTimestamp = isNaN(excelDate.getTime()) ? new Date() : excelDate;
          }
        } else {
          parsedTimestamp = new Date();
        }
        
        const qaLog = {
          timestamp: parsedTimestamp,
          agentType: agentType,
          agentName: agentName,
          userType: userType,
          questionContent: questionContent.toString().substring(0, 1000), // 최대 1000자
          responseContent: responseContent.toString().substring(0, 2000), // 최대 2000자
          responseType: responseType,
          responseTime: typeof responseTime === 'number' ? responseTime : parseInt(responseTime) || 1,
          agentId: matchedAgent?.id || null,
          userId: matchedUser?.id || null
        };
        
        const created = await storage.createQaLog(qaLog);
        qaLogs.push(created);
        successCount++;
        
        if (successCount % 10 === 0) {
          console.log(`✅ QA 로그 ${successCount}개 생성 완료...`);
        }
        
      } catch (error) {
        console.error(`❌ 행 ${i + 1} 처리 중 오류:`, error.message);
        continue;
      }
    }
    
    console.log(`\n🎉 총 ${successCount}개의 QA 로그가 Excel 데이터에서 성공적으로 생성되었습니다.`);
    console.log(`📈 처리율: ${((successCount / data.length) * 100).toFixed(1)}%`);
    
    // 현재 시스템의 QA 로그 수 확인
    const totalLogs = await storage.getQaLogs();
    console.log(`📊 현재 시스템에 ${totalLogs.length}개의 QA 로그가 있습니다.`);
    
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
      console.log(`   시간: ${log.timestamp.toLocaleString('ko-KR')}`);
      console.log(`   사용자: ${log.userType}`);
      console.log(`   질문: ${log.questionContent.substring(0, 80)}...`);
      console.log(`   응답: ${log.responseContent.substring(0, 80)}...`);
      console.log(`   응답시간: ${log.responseTime}초`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Excel 파일 로드 중 오류 발생:', error);
    console.error('스택 트레이스:', error.stack);
  }
}

// 스크립트 실행
loadQASampleFromExcel().catch(console.error);