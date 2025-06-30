
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple storage implementation for Q&A logs
class QALogStorage {
  constructor() {
    this.dataFile = join(__dirname, 'qa_logs.json');
    this.logs = this.loadData();
  }
  
  loadData() {
    try {
      if (fs.existsSync(this.dataFile)) {
        return JSON.parse(fs.readFileSync(this.dataFile, 'utf-8'));
      }
    } catch (error) {
      console.warn('Warning: Could not load existing data:', error.message);
    }
    return [];
  }
  
  saveData() {
    try {
      fs.writeFileSync(this.dataFile, JSON.stringify(this.logs, null, 2));
    } catch (error) {
      console.error('Error saving data:', error.message);
    }
  }
  
  clearAllQALogs() {
    this.logs = [];
    this.saveData();
    console.log('🗑️ 기존 QA 로그 데이터를 삭제했습니다.');
  }
  
  createQaLog(logData) {
    const log = {
      id: this.logs.length + 1,
      ...logData,
      createdAt: new Date().toISOString()
    };
    this.logs.push(log);
    return log;
  }
  
  getQaLogs() {
    return this.logs;
  }
}

async function loadQASampleFromExcel() {
  try {
    console.log('📊 Excel 파일에서 Q&A 샘플 데이터 로드 중...');
    
    // Look for Excel file in multiple possible locations
    const possiblePaths = [
      join(__dirname, 'attached_assets', '질의응답샘플 062825_1751253829317.xlsx'),
      join(__dirname, '질의응답샘플 062825_1751253829317.xlsx'),
      join(__dirname, 'qa_sample.xlsx'),
      join(__dirname, 'sample_data.xlsx')
    ];
    
    let filePath = null;
    for (const path of possiblePaths) {
      if (fs.existsSync(path)) {
        filePath = path;
        break;
      }
    }
    
    if (!filePath) {
      console.log('📝 Excel 파일을 찾을 수 없어 샘플 데이터를 생성합니다...');
      return generateSampleData();
    }
    
    console.log(`📁 Excel 파일 발견: ${filePath}`);
    
    // Excel 파일 읽기
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📋 Excel 파일에서 ${data.length}개의 행을 발견했습니다.`);
    
    if (data.length > 0) {
      console.log('📝 컬럼 구조:', Object.keys(data[0]));
      console.log('샘플 데이터:', JSON.stringify(data[0], null, 2));
    }
    
    // Storage 초기화
    const storage = new QALogStorage();
    storage.clearAllQALogs();
    
    const qaLogs = [];
    let successCount = 0;
    
    // 샘플 에이전트 및 사용자 데이터
    const sampleAgents = [
      { id: 1, name: '전남대학교 학사일정 AI', type: '학교' },
      { id: 2, name: '김교수 AI 어시스턴트', type: '교수' },
      { id: 3, name: '학생회 도우미', type: '학생' },
      { id: 4, name: '프로젝트 팀 AI', type: '그룹' },
      { id: 5, name: '시스템 관리 봇', type: '기능형' }
    ];
    
    const sampleUsers = [
      { id: 1, name: '홍길동', userType: '학부생' },
      { id: 2, name: '김철수', userType: '대학원생' },
      { id: 3, name: '이영희', userType: '교수' },
      { id: 4, name: '박민수', userType: '직원' },
      { id: 5, name: '최지원', userType: '학부생' }
    ];
    
    // Excel 데이터 처리
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // 가능한 컬럼명들 매핑
        const questionContent = 
          row['질문 내용'] || row['질문내용'] || row['질문'] || 
          row['Question'] || row['question'] || row['Q'] || 
          row['User Message'] || row['사용자 메시지'] || '';
          
        const responseContent = 
          row['챗봇 응답내용'] || row['챗봇응답내용'] || row['응답내용'] || 
          row['답변'] || row['Response'] || row['response'] || row['A'] ||
          row['Bot Message'] || row['봇 메시지'] || '';
          
        const agentName = 
          row['에이전트 명'] || row['에이전트명'] || row['Agent'] || 
          row['agent'] || row['Bot Name'] || row['봇 이름'] || '전남대학교 AI';
          
        const userType = 
          row['사용자 유형'] || row['사용자유형'] || row['User Type'] || 
          row['userType'] || row['유형'] || '학부생';
          
        const timestamp = 
          row['대화 시각'] || row['대화시각'] || row['Timestamp'] || 
          row['timestamp'] || row['시간'] || new Date();
        
        if (!questionContent || !responseContent) {
          console.log(`⚠️ 행 ${i + 1}: 질문 또는 응답 내용이 비어있어 건너뜁니다.`);
          continue;
        }
        
        // 에이전트 매칭
        let matchedAgent = sampleAgents.find(agent => 
          agent.name.includes(agentName) || agentName.includes(agent.name)
        );
        if (!matchedAgent) {
          matchedAgent = sampleAgents[Math.floor(Math.random() * sampleAgents.length)];
        }
        
        // 사용자 매칭
        let matchedUser = sampleUsers.find(user => user.userType === userType);
        if (!matchedUser) {
          matchedUser = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
        }
        
        // 타임스탬프 처리
        let parsedTimestamp = new Date();
        if (timestamp) {
          if (timestamp instanceof Date) {
            parsedTimestamp = timestamp;
          } else if (typeof timestamp === 'number') {
            // Excel 날짜 형식 처리
            parsedTimestamp = new Date((timestamp - 25569) * 86400 * 1000);
          } else {
            const parsed = new Date(timestamp);
            if (!isNaN(parsed.getTime())) {
              parsedTimestamp = parsed;
            }
          }
        }
        
        const qaLog = {
          timestamp: parsedTimestamp,
          agentType: matchedAgent.type,
          agentName: matchedAgent.name,
          userType: matchedUser.userType,
          userName: matchedUser.name,
          questionContent: questionContent.toString().substring(0, 1000),
          responseContent: responseContent.toString().substring(0, 2000),
          responseType: 'general',
          responseTime: Math.floor(Math.random() * 3) + 1,
          agentId: matchedAgent.id,
          userId: matchedUser.id,
          sessionId: `session_${i + 1}_${Date.now()}`,
          satisfaction: Math.floor(Math.random() * 5) + 1 // 1-5 점
        };
        
        const created = storage.createQaLog(qaLog);
        qaLogs.push(created);
        successCount++;
        
        if (successCount % 20 === 0) {
          console.log(`✅ QA 로그 ${successCount}개 생성 완료...`);
        }
        
      } catch (error) {
        console.error(`❌ 행 ${i + 1} 처리 중 오류:`, error.message);
        continue;
      }
    }
    
    storage.saveData();
    
    console.log(`\n🎉 총 ${successCount}개의 QA 로그가 Excel 데이터에서 성공적으로 생성되었습니다.`);
    console.log(`📈 처리율: ${((successCount / data.length) * 100).toFixed(1)}%`);
    
    return displayResults(storage, qaLogs);
    
  } catch (error) {
    console.error('❌ Excel 파일 로드 중 오류 발생:', error);
    console.error('스택 트레이스:', error.stack);
    
    // 오류 발생 시 샘플 데이터 생성
    return generateSampleData();
  }
}

async function generateSampleData() {
  console.log('📝 146개의 샘플 Q&A 데이터를 생성합니다...');
  
  const storage = new QALogStorage();
  storage.clearAllQALogs();
  
  const sampleQAs = [
    {
      question: "전남대학교 2024년 2학기 개강일은 언제인가요?",
      answer: "2024년 2학기 개강일은 9월 2일(월)입니다. 수강신청은 8월 26일부터 시작됩니다.",
      agentType: "학교",
      userType: "학부생"
    },
    {
      question: "도서관 운영시간이 어떻게 되나요?",
      answer: "중앙도서관은 평일 09:00-22:00, 주말 09:00-18:00 운영합니다. 시험기간에는 24시간 운영합니다.",
      agentType: "학교",
      userType: "학부생"
    },
    {
      question: "기숙사 신청은 어떻게 하나요?",
      answer: "기숙사 신청은 매 학기 학생포털에서 온라인으로 진행됩니다. 신청기간과 결과발표일은 학사공지를 확인해주세요.",
      agentType: "학교",
      userType: "학부생"
    },
    {
      question: "졸업요건이 어떻게 되나요?",
      answer: "학부 졸업요건은 전공 36학점, 교양 30학점, 총 130학점 이상 이수해야 합니다. 자세한 내용은 학과사무실에 문의하세요.",
      agentType: "교수",
      userType: "학부생"
    },
    {
      question: "장학금 신청 방법을 알려주세요",
      answer: "장학금은 성적우수, 가계곤란, 봉사활동 등 다양한 유형이 있습니다. 학생지원처 홈페이지에서 신청할 수 있습니다.",
      agentType: "학교",
      userType: "학부생"
    },
    {
      question: "학과 사무실 위치와 운영시간을 알려주세요",
      answer: "학과 사무실은 공과대학 5층 502호에 위치하며, 평일 09:00-18:00 운영합니다. 점심시간은 12:00-13:00입니다.",
      agentType: "학교",
      userType: "학부생"
    },
    {
      question: "휴학신청은 언제까지 해야 하나요?",
      answer: "일반휴학은 학기 시작 후 4주 이내, 군입대 휴학은 입대 전까지 신청 가능합니다. 학생포털에서 온라인으로 신청하세요.",
      agentType: "학교",
      userType: "학부생"
    },
    {
      question: "성적이의신청은 어떻게 하나요?",
      answer: "성적이의신청은 성적공지 후 1주일 이내에 해당 과목 담당교수에게 직접 신청하시면 됩니다.",
      agentType: "교수",
      userType: "학부생"
    },
    {
      question: "전과(전부) 신청 조건이 무엇인가요?",
      answer: "전과는 2학기 이상 이수, 평점평균 2.5 이상인 학생이 신청 가능합니다. 모집인원과 경쟁률에 따라 선발됩니다.",
      agentType: "학교",
      userType: "학부생"
    },
    {
      question: "복수전공 신청은 언제 하나요?",
      answer: "복수전공은 3학기 이수 후 신청 가능하며, 매년 2월과 8월에 신청 기간이 있습니다.",
      agentType: "학교",
      userType: "학부생"
    },
    {
      question: "학생증 재발급은 어떻게 하나요?",
      answer: "학생증 재발급은 학생지원처에서 신청하며, 재발급 수수료 3,000원이 필요합니다.",
      agentType: "학교",
      userType: "학부생"
    },
    {
      question: "교환학생 프로그램에 대해 알려주세요",
      answer: "교환학생 프로그램은 국제교류처에서 관리하며, 매년 3월과 9월에 모집합니다. 영어성적과 학점 기준이 있습니다.",
      agentType: "학교",
      userType: "학부생"
    },
    {
      question: "졸업논문 제출 일정을 알려주세요",
      answer: "졸업논문은 매년 5월 말(1학기), 11월 말(2학기)까지 제출해야 합니다. 지도교수 승인 후 학과 사무실에 제출하세요.",
      agentType: "교수",
      userType: "대학원생"
    },
    {
      question: "연구실 배정은 어떻게 되나요?",
      answer: "연구실 배정은 대학원 입학 후 지도교수와 상담을 통해 결정됩니다. 학과별로 절차가 다를 수 있습니다.",
      agentType: "교수",
      userType: "대학원생"
    },
    {
      question: "학회 참가비 지원이 가능한가요?",
      answer: "학회 참가비는 연구실 예산이나 학과 지원금을 통해 일부 지원 가능합니다. 지도교수와 상의하세요.",
      agentType: "교수",
      userType: "대학원생"
    },
    {
      question: "수강신청은 언제부터 가능한가요?",
      answer: "수강신청은 매 학기 개강 2주 전부터 시작됩니다. 학년별로 신청 시간이 다르니 학사일정을 확인하세요.",
      agentType: "학교",
      userType: "학부생"
    },
    {
      question: "계절학기는 언제 있나요?",
      answer: "계절학기는 여름(7-8월), 겨울(1-2월)에 있으며, 각각 4주간 진행됩니다.",
      agentType: "학교",
      userType: "학부생"
    },
    {
      question: "인턴십 프로그램이 있나요?",
      answer: "인턴십 프로그램은 취업지원처에서 운영하며, 기업과 연계한 현장실습 기회를 제공합니다.",
      agentType: "학교",
      userType: "학부생"
    },
    {
      question: "동아리 가입은 어떻게 하나요?",
      answer: "동아리 가입은 학생활동지원센터나 각 동아리에 직접 문의하시면 됩니다. 매 학기 초 동아리 박람회도 열립니다.",
      agentType: "학생",
      userType: "학부생"
    },
    {
      question: "체육시설 이용 방법을 알려주세요",
      answer: "체육시설은 학생증으로 이용 가능하며, 헬스장은 별도 등록이 필요합니다. 이용시간은 06:00-22:00입니다.",
      agentType: "학교",
      userType: "학부생"
    }
  ];
  
  const agents = [
    { id: 1, name: '전남대학교 학사일정 AI', type: '학교' },
    { id: 2, name: '김교수 AI 어시스턴트', type: '교수' },
    { id: 3, name: '학생회 도우미', type: '학생' },
    { id: 4, name: '프로젝트 팀 AI', type: '그룹' },
    { id: 5, name: '시스템 관리 봇', type: '기능형' }
  ];
  
  const users = [
    { id: 1, name: '홍길동', userType: '학부생' },
    { id: 2, name: '김철수', userType: '대학원생' },
    { id: 3, name: '이영희', userType: '교수' },
    { id: 4, name: '박민수', userType: '직원' },
    { id: 5, name: '최지원', userType: '학부생' }
  ];
  
  const qaLogs = [];
  
  // 146개 데이터 생성
  for (let i = 0; i < 146; i++) {
    const baseQA = sampleQAs[i % sampleQAs.length];
    const agent = agents[Math.floor(Math.random() * agents.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    
    // 시간을 최근 30일 내에서 랜덤하게 설정
    const timestamp = new Date();
    timestamp.setDate(timestamp.getDate() - Math.floor(Math.random() * 30));
    timestamp.setHours(Math.floor(Math.random() * 24));
    timestamp.setMinutes(Math.floor(Math.random() * 60));
    
    const qaLog = {
      timestamp: timestamp,
      agentType: agent.type,
      agentName: agent.name,
      userType: user.userType,
      userName: user.name,
      questionContent: baseQA.question + (i > 0 ? ` (문의 ${i + 1})` : ''),
      responseContent: baseQA.answer,
      responseType: 'general',
      responseTime: Math.floor(Math.random() * 5) + 1,
      agentId: agent.id,
      userId: user.id,
      sessionId: `session_${i + 1}_${Date.now()}`,
      satisfaction: Math.floor(Math.random() * 5) + 1
    };
    
    const created = storage.createQaLog(qaLog);
    qaLogs.push(created);
    
    if ((i + 1) % 20 === 0) {
      console.log(`✅ QA 로그 ${i + 1}개 생성 완료...`);
    }
  }
  
  storage.saveData();
  
  console.log(`\n🎉 총 146개의 샘플 QA 로그가 성공적으로 생성되었습니다.`);
  
  return displayResults(storage, qaLogs);
}

function displayResults(storage, qaLogs) {
  const totalLogs = storage.getQaLogs();
  console.log(`📊 현재 시스템에 ${totalLogs.length}개의 QA 로그가 있습니다.`);
  
  // 에이전트 유형별 통계
  const agentTypeStats = {};
  const userTypeStats = {};
  
  qaLogs.forEach(log => {
    agentTypeStats[log.agentType] = (agentTypeStats[log.agentType] || 0) + 1;
    userTypeStats[log.userType] = (userTypeStats[log.userType] || 0) + 1;
  });
  
  console.log('\n📊 에이전트 유형별 통계:');
  Object.entries(agentTypeStats).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}개`);
  });
  
  console.log('\n👥 사용자 유형별 통계:');
  Object.entries(userTypeStats).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}개`);
  });
  
  // 생성된 로그 샘플 출력
  console.log('\n📋 생성된 QA 로그 샘플 (최신 5개):');
  qaLogs.slice(0, 5).forEach((log, index) => {
    console.log(`${index + 1}. [${log.agentType}] ${log.agentName}`);
    console.log(`   시간: ${log.timestamp.toLocaleString('ko-KR')}`);
    console.log(`   사용자: ${log.userType} (${log.userName})`);
    console.log(`   질문: ${log.questionContent.substring(0, 50)}...`);
    console.log(`   응답: ${log.responseContent.substring(0, 50)}...`);
    console.log(`   응답시간: ${log.responseTime}초, 만족도: ${log.satisfaction}/5`);
    console.log('');
  });
  
  console.log('\n✨ Q&A 로그 시스템이 성공적으로 구축되었습니다!');
  console.log(`📁 데이터 파일: ${path.resolve('qa_logs.json')}`);
  
  return { success: true, count: qaLogs.length, logs: qaLogs };
}

// 스크립트 실행
loadQASampleFromExcel().catch(console.error);
