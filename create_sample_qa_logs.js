import { MemoryStorage } from './server/memory-storage.js';

const sampleQALogs = [
  {
    timestamp: new Date('2024-06-25T10:30:00'),
    agentType: '학교',
    agentName: '전남대학교 입학안내 AI',
    userType: '학부생',
    questionContent: '2025학년도 신입생 모집요강에 대해 알려주세요.',
    responseContent: '2025학년도 전남대학교 신입생 모집은 수시모집과 정시모집으로 나누어 진행됩니다. 수시모집은 학생부종합전형, 학생부교과전형, 논술전형 등이 있으며, 정시모집은 가, 나, 다군으로 나누어 실시됩니다. 자세한 내용은 입학처 홈페이지를 참고해주세요.',
    responseType: 'AI 생성',
    responseTime: '1.2초',
    agentId: 1,
    userId: null,
    improvementRequest: null
  },
  {
    timestamp: new Date('2024-06-25T11:15:00'),
    agentType: '교수',
    agentName: '컴퓨터공학과 김교수 AI',
    userType: '대학원생',
    questionContent: '머신러닝 연구실 입실 조건이 어떻게 되나요?',
    responseContent: '머신러닝 연구실 입실을 위해서는 다음 조건을 만족해야 합니다: 1) 학부 GPA 3.5 이상, 2) 프로그래밍 언어(Python, C++) 숙련도, 3) 기초 수학(선형대수, 확률통계) 이해도, 4) 면접 통과. 관심있으시면 연구실로 직접 문의해주세요.',
    responseType: 'AI 생성',
    responseTime: '0.8초',
    agentId: 2,
    userId: null,
    improvementRequest: null
  },
  {
    timestamp: new Date('2024-06-25T14:22:00'),
    agentType: '학생',
    agentName: '학생회 문의 AI',
    userType: '학부생',
    questionContent: '동아리 신청은 어떻게 하나요?',
    responseContent: '동아리 신청은 매 학기 초에 학생회 홈페이지를 통해 온라인으로 접수받습니다. 신청 기간은 보통 3월과 9월 첫 2주간이며, 필요 서류로는 동아리 신청서, 지도교수 추천서, 활동계획서가 있습니다. 승인 결과는 신청 마감 후 1주일 내에 발표됩니다.',
    responseType: 'AI 생성',
    responseTime: '1.5초',
    agentId: 3,
    userId: null,
    improvementRequest: null
  },
  {
    timestamp: new Date('2024-06-25T15:45:00'),
    agentType: '기능형',
    agentName: '도서관 예약 AI',
    userType: '교직원',
    questionContent: '세미나실 예약 방법을 알려주세요.',
    responseContent: '도서관 세미나실 예약은 다음과 같이 진행됩니다: 1) 도서관 홈페이지 로그인, 2) 시설예약 메뉴 선택, 3) 원하는 날짜와 시간 확인, 4) 예약 신청서 작성, 5) 승인 대기. 예약은 최대 2주 전부터 가능하며, 취소는 사용일 1일 전까지 가능합니다.',
    responseType: 'AI 생성',
    responseTime: '1.0초',
    agentId: 4,
    userId: null,
    improvementRequest: null
  },
  {
    timestamp: new Date('2024-06-25T16:30:00'),
    agentType: '학교',
    agentName: '전남대학교 학사일정 AI',
    userType: '학부생',
    questionContent: '기말고사 일정이 언제인가요?',
    responseContent: '2024년 2학기 기말고사 일정은 12월 16일(월)부터 12월 20일(금)까지 5일간 실시됩니다. 과목별 세부 시간표는 수강신청시스템에서 확인할 수 있으며, 시험 장소는 시험 1주일 전에 공지됩니다. 추가 문의사항은 해당 과목 담당교수님께 직접 문의해주세요.',
    responseType: 'AI 생성',
    responseTime: '0.9초',
    agentId: 1,
    userId: null,
    improvementRequest: null
  }
];

async function createSampleQALogs() {
  try {
    console.log('샘플 QA 로그 데이터 생성 중...');
    
    const storage = new MemoryStorage();
    
    // 기존 QA 로그 삭제
    await storage.clearAllQaLogs();
    console.log('기존 QA 로그 데이터를 삭제했습니다.');
    
    // 샘플 QA 로그 생성
    let successCount = 0;
    for (const logData of sampleQALogs) {
      try {
        await storage.createQaLog(logData);
        successCount++;
      } catch (error) {
        console.error('QA 로그 생성 실패:', error.message);
      }
    }
    
    console.log(`✅ ${successCount}개의 샘플 QA 로그가 생성되었습니다.`);
    
    // 생성된 데이터 확인
    const allLogs = await storage.getQaLogs();
    console.log(`현재 시스템에 ${allLogs.length}개의 QA 로그가 있습니다.`);
    
    // 생성된 로그 출력
    console.log('\n생성된 QA 로그:');
    allLogs.forEach((log, index) => {
      console.log(`${index + 1}. [${log.agentType}] ${log.agentName}`);
      console.log(`   시간: ${log.timestamp?.toLocaleString('ko-KR')}`);
      console.log(`   사용자: ${log.userType}`);
      console.log(`   질문: ${log.questionContent.substring(0, 30)}...`);
      console.log(`   응답: ${log.responseContent.substring(0, 30)}...`);
      console.log('');
    });
    
  } catch (error) {
    console.error('샘플 QA 로그 생성 실패:', error);
  }
}

// 실행
createSampleQALogs();