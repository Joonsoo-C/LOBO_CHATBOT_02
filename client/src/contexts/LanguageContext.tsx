import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'ko' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// 번역 데이터
const translations: Record<Language, Record<string, string>> = {
  ko: {
    // 로그인 페이지
    'auth.title': 'LoBo',
    'auth.subtitle': '대학교 AI 챗봇 시스템',
    'auth.login': '로그인',
    'auth.username': '학번/교번',
    'auth.usernamePlaceholder': '예: 2024001234 또는 F2024001',
    'auth.password': '비밀번호',
    'auth.passwordPlaceholder': '비밀번호를 입력하세요.',
    'auth.forgotPassword': '비밀번호를 잊으셨나요?',
    'auth.forgotPasswordMessage': '관리자에게 문의하여 비밀번호를 재설정해주세요.',
    'auth.loginButton': '로그인',
    'auth.loggingIn': '로그인 중...',
    'auth.demoAccounts': '데모 계정으로 빠른 로그인',
    'auth.studentAccount': '👨‍🎓 학생 계정',
    'auth.facultyAccount': '👨‍🏫 교직원 계정',
    'auth.masterAccount': '🔑 마스터 계정',
    'auth.adminSystem': '관리자 시스템',
    'auth.demoStudentDesc': '장지훈 (user1082) - 인문대학 / 국어국문학과 / 현대문학전공, 학생',
    'auth.demoFacultyDesc': '정수빈 (user1081) - 인문대학 / 국어국문학과 / 현대문학전공, 교수, 에이전트 관리자',
    'auth.demoMasterDesc': 'Master Admin (master_admin) - LoBo AI 챗봇 통합 관리자 센터 접근',
    'auth.autoCreate': '계정이 없는 경우 자동으로 생성됩니다',
    'auth.loginSuccess': '로그인 성공',
    'auth.welcome': '환영합니다!',
    'auth.loginFailed': '로그인 실패',
    'auth.loginError': '학번/교번 또는 비밀번호를 확인해주세요.',
    'auth.settings': '설정',
    'auth.themeSettings': '테마 설정',
    'auth.languageSettings': '언어 설정',
    'auth.usernameRequired': '학번/교번을 입력해주세요',
    'auth.passwordRequired': '비밀번호를 입력해주세요',
    'auth.passwordMinLength': '비밀번호는 6자 이상이어야 합니다',
    'auth.firstNameRequired': '이름을 입력해주세요',
    'auth.lastNameRequired': '성을 입력해주세요',
    'auth.emailInvalid': '올바른 이메일 주소를 입력해주세요',
    
    // 공통 UI 요소
    'common.home': '홈',
    'common.chat': '채팅',
    'common.management': '관리',
    'common.logout': '로그아웃',
    'common.loading': '로딩 중...',
    'common.search': '검색',
    'common.files': '파일',
    'common.settings': '설정',
    'common.save': '저장',
    'common.cancel': '취소',
    'common.delete': '삭제',
    'common.edit': '수정',
    'common.upload': '업로드',
    'common.download': '다운로드',
    'common.error': '오류',
    'common.success': '성공',
    
    // 홈페이지
    'home.searchPlaceholder': '에이전트 검색...',
    'home.categories.all': '전체',
    'home.categories.school': '학교',
    'home.categories.professor': '교수',
    'home.categories.student': '학생',
    'home.categories.group': '그룹',
    'home.categories.function': '기능',
    'home.accountSettings': '계정 설정',
    'account.regularUser': '일반 사용자',
    'account.agentManager': '에이전트 관리자',
    'account.masterAdmin': '마스터 관리자',
    'account.operationManager': '운영 관리자',
    'account.categoryManager': '카테고리 관리자',
    'account.qaManager': 'QA 관리자',
    'account.documentManager': '문서 관리자',
    'account.externalUser': '외부 사용자',
    'account.active': '활성',
    'account.inactive': '비활성',
    'account.locked': '잠김',
    
    // 에이전트 관련
    'agent.persona': '페르소나 편집',
    'agent.iconChange': '아이콘 변경',
    'agent.settings': '챗봇 설정',
    'agent.notification': '알림보내기',
    'agent.upload': '문서 업로드',
    'agent.performance': '성과 분석',
    'agent.help': '도움말',
    'agent.documentManagement': '문서 관리',
    'agent.active': '활성',
    'agent.chat': '에이전트 채팅',
    'agent.agentManagement': '에이전트 관리',
    'agent.functionsSelect': '기능 선택',
    'agent.totalUsers': '총 메시지',
    'agent.satisfaction': '사용률',
    'agent.ranking': '순위',
    'agent.managementMode': '관리 모드',
    'agent.generalChat': '일반 채팅',
    
    // 카테고리
    'category.school': '학교',
    'category.professor': '교수',
    'category.student': '학생',
    'category.group': '그룹',
    'category.function': '기능',
    
    // 시간 표시
    'time.recent': '최근',
    
    // 계정 설정
    'account.settings': '계정 설정',
    'account.lightMode': '라이트 모드',
    'account.logout': '로그아웃',
    
    // 대시보드 카드 설명
    'dashboard.activeUsersDesc': '활성 사용자: 12명',
    'dashboard.activeAgentsDesc': '활성 에이전트: 79개',
    'dashboard.totalMessagesDesc': '총 메시지: 145개',
    'dashboard.weeklyGrowthDesc': '주간 성장률: +15.2%',
    'dashboard.todayQuestionsPercent': '+12%',
    'dashboard.avgResponseTimeChange': '-0.3초',
    'dashboard.responseSuccessPercent': '전월 대비',
    'dashboard.userSatisfactionDesc': '향상 중',
    'dashboard.tokenUsageDailyPercent': '+12% 지난 주 대비',
    'dashboard.estimatedCostDesc': '이번 달 예상 비용',
    'account.noInfo': '정보 없음',
    'account.student': '학생',
    'account.faculty': '교수',
    'account.admin': '관리자',
    
    // 파일 관리
    'files.uploadedFiles': '업로드된 파일',
    'files.size': '크기',
    'files.uploadDate': '업로드',
    'files.uploadTime': '업로드 날짜',
    'files.noFiles': '업로드된 파일이 없습니다',
    
    // 대시보드 카드
    'dashboard.todayQuestions': '오늘의 질문',
    'dashboard.avgResponseTime': '평균 응답 시간',
    'dashboard.responseSuccess': '문제 응답 성공률',
    'dashboard.userSatisfaction': '사용자 만족도',
    'dashboard.tokenUsageDaily': '토큰 소비량 일평균',
    'dashboard.estimatedCost': '토큰 예상 비용',
    'dashboard.popularQuestions': '인기 질문 TOP 5',
    'dashboard.systemStatus': '시스템 상태',
    'dashboard.database': '데이터베이스',
    'dashboard.openaiApi': 'OpenAI API',
    'dashboard.sessionStore': '세션 저장소',
    'dashboard.fileUpload': '파일 업로드',
    'dashboard.healthy': '정상',
    
    // 채팅 인터페이스
    'chat.typing': '메시지 작성 중...',
    'chat.inputPlaceholder': '메시지를 입력하세요...',
    'chat.agentGreeting': '안녕하세요! 저는 {{name}}입니다. 궁금한 것이 있으면 언제든지 물어보세요.',
    
    // 관리 인터페이스
    'management.personaTitle': '페르소나',
    'management.personaDesc': '에이전트 성격 및 말투 설정',
    'chat.deleteHistory': '채팅 기록 삭제',
    
    // 파일 업로드 시스템
    'file.uploadTitle': '사용자 파일 업로드',
    'file.downloadSample': '샘플 파일 다운로드',
    'file.overwriteOption': '기존 데이터 덮어쓰기',
    'file.overwriteOptionDesc': '체크 시 모든 기존 사용자 데이터를 삭제하고 새로 업로드된 데이터로 완전히 교체합니다.',
    'file.chooseFile': '파일 선택',
    'file.noFileSelected': '선택된 파일이 없습니다',
    'file.uploadButton': '업로드',
    'file.uploading': '업로드 중...',
    'file.close': '닫기',
    'file.uploadedFilesList': '업로드된 파일 목록',
    'file.originalName': '원본 파일명',
    'file.uploadedAt': '업로드 날짜',
    'file.userCount': '사용자 수',
    'file.status': '상태',
    'file.actions': '작업',
    'file.deleteFile': '파일 삭제',
    'file.noUploadedFiles': '업로드된 파일이 없습니다.',
    'file.uploadSuccess': '업로드 성공',
    'file.uploadSuccessMessage': '파일이 성공적으로 업로드되었습니다.',
    'file.uploadFailed': '업로드 실패',
    'file.deleteSuccess': '삭제 성공',
    'file.deleteSuccessMessage': '파일이 성공적으로 삭제되었습니다.',
    'file.deleteFailed': '삭제 실패',
    'file.deleteError': '파일 삭제에 실패했습니다.',
    'file.unsupportedFormat': '지원되지 않는 파일 형식',
    'file.formatRequirement': 'Excel(.xlsx, .xls) 또는 CSV(.csv) 파일만 업로드 가능합니다.',
    'file.sizeExceeded': '파일 크기 초과',
    'file.sizeLimit': '50MB 이하의 파일만 업로드 가능합니다.',
    'file.downloadFailed': '다운로드 실패',
    'file.downloadError': '샘플 파일 다운로드에 실패했습니다.',
    'file.sampleFileName': '사용자_업로드_샘플.xlsx',
    'home.selectAgent': '에이전트를 선택해주세요',
    'home.selectAgentDesc': '왼쪽에서 에이전트를 선택하여 채팅을 시작하세요.',
    'home.manageAgent': '관리할 에이전트를 선택해주세요',
    'home.manageAgentDesc': '관리 모드에서 에이전트를 선택하세요.',
    
    // 언어명
    'language.ko': '한국어',
    'language.en': 'English',
  },
  
  en: {
    // Login page
    'auth.title': 'LoBo',
    'auth.subtitle': 'University AI Chatbot System',
    'auth.login': 'Login',
    'auth.username': 'Student ID/Staff ID',
    'auth.usernamePlaceholder': 'e.g. 2024001234 or F2024001',
    'auth.password': 'Password',
    'auth.passwordPlaceholder': 'Enter your password',
    'auth.forgotPassword': 'Forgot your password?',
    'auth.forgotPasswordMessage': 'Please contact the administrator to reset your password.',
    'auth.loginButton': 'Login',
    'auth.loggingIn': 'Logging in...',
    'auth.demoAccounts': 'Quick login with demo accounts',
    'auth.studentAccount': '👨‍🎓 Student Account',
    'auth.facultyAccount': '👨‍🏫 Faculty Account',
    'auth.masterAccount': '🔑 Master Account',
    'auth.adminSystem': 'Admin System',
    'auth.demoStudentDesc': 'Jang Jihoon (user1082) - College of Humanities / Korean Language and Literature / Modern Literature, Student',
    'auth.demoFacultyDesc': 'Jung Soobin (user1081) - College of Humanities / Korean Language and Literature / Modern Literature, Professor, Agent Manager',
    'auth.demoMasterDesc': 'Master Admin (master_admin) - LoBo AI Chatbot Integrated Management Center Access',
    'auth.autoCreate': 'Account will be created automatically if it doesn\'t exist',
    'auth.loginSuccess': 'Login Successful',
    'auth.welcome': 'Welcome!',
    'auth.loginFailed': 'Login Failed',
    'auth.loginError': 'Please check your student ID/staff ID or password.',
    'auth.settings': 'Settings',
    'auth.themeSettings': 'Theme Settings',
    'auth.languageSettings': 'Language Settings',
    'auth.usernameRequired': 'Please enter your student ID/staff ID',
    'auth.passwordRequired': 'Please enter your password',
    'auth.passwordMinLength': 'Password must be at least 6 characters',
    'auth.firstNameRequired': 'Please enter your first name',
    'auth.lastNameRequired': 'Please enter your last name',
    'auth.emailInvalid': 'Please enter a valid email address',
    
    // Common UI elements
    'common.home': 'Home',
    'common.chat': 'Chat',
    'common.management': 'Management',
    'common.logout': 'Logout',
    'common.loading': 'Loading...',
    'common.search': 'Search',
    'common.files': 'Files',
    'common.settings': 'Settings',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.upload': 'Upload',
    'common.download': 'Download',
    'common.error': 'Error',
    'common.success': 'Success',
    
    // Homepage
    'home.searchPlaceholder': 'Search agents...',
    'home.categories.all': 'All',
    'home.categories.school': 'School',
    'home.categories.professor': 'Professor',
    'home.categories.student': 'Student',
    'home.categories.group': 'Group',
    'home.categories.function': 'Function',
    'home.accountSettings': 'Account Settings',
    'account.regularUser': 'Regular User',
    'account.agentManager': 'Agent Manager',
    'account.masterAdmin': 'Master Admin',
    'account.operationManager': 'Operation Manager',
    'account.categoryManager': 'Category Manager',
    'account.qaManager': 'QA Manager',
    'account.documentManager': 'Document Manager',
    'account.externalUser': 'External User',
    'account.active': 'Active',
    'account.inactive': 'Inactive',
    'account.locked': 'Locked',
    
    // Agent related
    'agent.persona': 'Persona Change',
    'agent.iconChange': 'Change Icon',
    'agent.settings': 'Bot Settings',
    'agent.notification': 'Send Notification',
    'agent.upload': 'Upload Document',
    'agent.performance': 'Performance Analysis',
    'agent.help': 'Help',
    'agent.documentManagement': 'Document Management',
    'agent.active': 'Active',
    'agent.chat': 'Agent Chat',
    'agent.agentManagement': 'Agent Management',
    'agent.functionsSelect': 'Functions',
    'agent.totalUsers': 'Total Messages',
    'agent.satisfaction': 'Usage Rate',
    'agent.ranking': 'Ranking',
    'agent.managementMode': 'Management Mode',
    'agent.generalChat': 'General Chat',
    
    // Categories
    'category.school': 'School',
    'category.professor': 'Professor',
    'category.student': 'Student',
    'category.group': 'Group',
    'category.function': 'Function',
    
    // Time display
    'time.recent': 'Recent',
    
    // Account Settings
    'account.settings': 'Account Settings',
    'account.lightMode': 'Light Mode',
    'account.logout': 'Logout',
    
    // Dashboard card descriptions
    'dashboard.activeUsersDesc': 'Active Users: 12',
    'dashboard.activeAgentsDesc': 'Active Agents: 79',
    'dashboard.totalMessagesDesc': 'Total Messages: 145',
    'dashboard.weeklyGrowthDesc': 'Weekly Growth: +15.2%',
    'dashboard.todayQuestionsPercent': '+12%',
    'dashboard.avgResponseTimeChange': '-0.3s',
    'dashboard.responseSuccessPercent': 'vs Last Month',
    'dashboard.userSatisfactionDesc': 'Improving',
    'dashboard.tokenUsageDailyPercent': '+12% vs Last Week',
    'dashboard.estimatedCostDesc': 'This Month Estimate',
    'account.noInfo': 'No information',
    'account.student': 'Student',
    'account.faculty': 'Faculty',
    'account.admin': 'Administrator',
    
    // File Management
    'files.uploadedFiles': 'Uploaded Files',
    'files.size': 'Size',
    'files.uploadDate': 'Upload',
    'files.uploadTime': 'Upload Date',
    'files.noFiles': 'No uploaded files',
    
    // Dashboard Cards
    'dashboard.todayQuestions': 'Today\'s Questions',
    'dashboard.avgResponseTime': 'Average Response Time',
    'dashboard.responseSuccess': 'Response Success Rate',
    'dashboard.userSatisfaction': 'User Satisfaction',
    'dashboard.tokenUsageDaily': 'Daily Token Usage',
    'dashboard.estimatedCost': 'Estimated Token Cost',
    'dashboard.popularQuestions': 'Popular Questions TOP 5',
    'dashboard.systemStatus': 'System Status',
    'dashboard.database': 'Database',
    'dashboard.openaiApi': 'OpenAI API',
    'dashboard.sessionStore': 'Session Store',
    'dashboard.fileUpload': 'File Upload',
    'dashboard.healthy': 'Healthy',
    
    // Chat interface
    'chat.typing': 'Typing...',
    'chat.inputPlaceholder': 'Type a message...',
    'chat.agentGreeting': 'Hello! I am {{name}}. Feel free to ask me anything anytime.',
    
    // Management interface
    'management.personaTitle': 'Persona',
    'management.personaDesc': 'Set agent personality and speaking style',
    'chat.deleteHistory': 'Delete Chat History',
    
    // File Upload System
    'file.uploadTitle': 'User File Upload',
    'file.downloadSample': 'Download Sample File',
    'file.overwriteOption': 'Overwrite Existing Data',
    'file.overwriteOptionDesc': 'When checked, all existing user data will be deleted and completely replaced with newly uploaded data.',
    'file.chooseFile': 'Choose File',
    'file.noFileSelected': 'No file selected',
    'file.uploadButton': 'Upload',
    'file.uploading': 'Uploading...',
    'file.close': 'Close',
    'file.uploadedFilesList': 'Uploaded Files List',
    'file.originalName': 'Original File Name',
    'file.uploadedAt': 'Upload Date',
    'file.userCount': 'User Count',
    'file.status': 'Status',
    'file.actions': 'Actions',
    'file.deleteFile': 'Delete File',
    'file.noUploadedFiles': 'No uploaded files.',
    'file.uploadSuccess': 'Upload Success',
    'file.uploadSuccessMessage': 'File uploaded successfully.',
    'file.uploadFailed': 'Upload Failed',
    'file.deleteSuccess': 'Delete Success',
    'file.deleteSuccessMessage': 'File deleted successfully.',
    'file.deleteFailed': 'Delete Failed',
    'file.deleteError': 'Failed to delete file.',
    'file.unsupportedFormat': 'Unsupported File Format',
    'file.formatRequirement': 'Only Excel(.xlsx, .xls) or CSV(.csv) files can be uploaded.',
    'file.sizeExceeded': 'File Size Exceeded',
    'file.sizeLimit': 'Only files under 50MB can be uploaded.',
    'file.downloadFailed': 'Download Failed',
    'file.downloadError': 'Failed to download sample file.',
    'file.sampleFileName': 'user_upload_sample.xlsx',
    'home.selectAgent': 'Select an agent',
    'home.selectAgentDesc': 'Choose an agent from the left to start chatting.',
    'home.manageAgent': 'Select an agent to manage',
    'home.manageAgentDesc': 'Choose an agent to manage in management mode.',
    
    // Language names
    'language.ko': '한국어',
    'language.en': 'English',
  },
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguageState] = useState<Language>('ko');

  // 로컬 스토리지에서 언어 설정 로드
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && Object.keys(translations).includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    }
  }, []);

  // 언어 변경 시 로컬 스토리지에 저장
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  // 번역 함수
  const t = (key: string, params?: Record<string, string>): string => {
    let translation = translations[language][key] || key;
    
    // 매개변수 치환 ({{name}} 형태)
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(`{{${paramKey}}}`, paramValue);
      });
    }
    
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};