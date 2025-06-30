import fs from 'fs';
import { MemoryStorage } from './server/memory-storage.js';

async function loadQALogs() {
  try {
    console.log('QA 로그 데이터 로딩 중...');
    
    // QA 샘플 데이터 읽기
    const qaDataPath = './qa_sample_data.json';
    if (!fs.existsSync(qaDataPath)) {
      console.error('QA 샘플 데이터 파일을 찾을 수 없습니다:', qaDataPath);
      return;
    }
    
    const qaData = JSON.parse(fs.readFileSync(qaDataPath, 'utf8'));
    console.log(`총 ${qaData.length}개의 QA 데이터 항목을 읽었습니다.`);
    
    // Memory Storage 인스턴스 생성
    const storage = new MemoryStorage();
    
    // 기존 QA 로그 삭제
    await storage.clearAllQaLogs();
    console.log('기존 QA 로그 데이터를 삭제했습니다.');
    
    // 새 QA 로그 생성
    let successCount = 0;
    for (const [index, item] of qaData.entries()) {
      try {
        // Excel 시리얼 날짜를 JavaScript Date로 변환
        const excelDate = item['대화 시각'];
        const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
        
        const qaLogData = {
          timestamp: jsDate,
          agentType: item['에이전트 유형'] || '기본',
          agentName: item['에이전트 명'] || '알 수 없음',
          userType: item['사용자 유형'] || '학생',
          questionContent: item['질문 내용'] || '',
          responseContent: item['챗봇 응답내용'] || '',
          responseType: item['응답 유형'] || 'AI 생성',
          responseTime: item['응답시간'] || '0.5초',
          agentId: null, // 나중에 실제 에이전트와 연결할 수 있음
          userId: null, // 나중에 실제 사용자와 연결할 수 있음
          improvementRequest: null
        };
        
        await storage.createQaLog(qaLogData);
        successCount++;
        
        if ((index + 1) % 20 === 0) {
          console.log(`${index + 1}개 QA 로그 처리 완료...`);
        }
      } catch (error) {
        console.error(`QA 로그 ${index + 1} 생성 실패:`, error.message);
      }
    }
    
    console.log(`✅ 총 ${successCount}개의 QA 로그가 성공적으로 로딩되었습니다.`);
    
    // 로딩된 데이터 확인
    const allLogs = await storage.getQaLogs();
    console.log(`현재 시스템에 ${allLogs.length}개의 QA 로그가 있습니다.`);
    
    // 처음 3개 항목 출력
    console.log('\n처음 3개 QA 로그 샘플:');
    allLogs.slice(0, 3).forEach((log, index) => {
      console.log(`${index + 1}. [${log.agentType}] ${log.agentName}`);
      console.log(`   질문: ${log.questionContent.substring(0, 50)}...`);
      console.log(`   응답: ${log.responseContent.substring(0, 50)}...`);
      console.log(`   시간: ${log.timestamp?.toLocaleString('ko-KR')}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('QA 로그 로딩 실패:', error);
  }
}

// 실행
loadQALogs();