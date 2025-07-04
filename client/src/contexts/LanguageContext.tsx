import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'ko' | 'en' | 'zh' | 'vi' | 'ja';

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
    'auth.forgotPassword': '비밀번호를 잊으셨나요?',
    'auth.forgotPasswordMessage': '관리자에게 문의하여 비밀번호를 재설정해주세요.',
    'auth.loginButton': '로그인',
    'auth.loggingIn': '로그인 중...',
    'auth.demoAccounts': '데모 계정으로 빠른 로그인',
    'auth.studentAccount': '👨‍🎓 학생 계정',
    'auth.facultyAccount': '👨‍🏫 교직원 계정',
    'auth.masterAccount': '🔑 마스터 계정',
    'auth.adminSystem': '관리자 시스템',
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
    'common.search': '검색',
    'common.files': '파일',
    'common.settings': '설정',
    'common.save': '저장',
    'common.cancel': '취소',
    'common.delete': '삭제',
    'common.edit': '수정',
    'common.upload': '업로드',
    'common.download': '다운로드',
    'common.loading': '로딩 중...',
    'common.error': '오류',
    'common.success': '성공',
    
    // 홈페이지
    'home.searchPlaceholder': '에이전트 검색...',
    'home.categories.all': '전체',
    'home.categories.school': '학교',
    'home.categories.professor': '교수',
    'home.categories.student': '학생',
    'home.categories.group': '그룹',
    'home.categories.function': '기능형',
    'home.accountSettings': '계정 설정',
    'home.selectAgent': '에이전트를 선택하세요',
    'home.selectAgentDesc': '왼쪽에서 대화하고 싶은 에이전트를 선택하면 여기에 채팅창이 나타납니다.',
    'home.manageAgent': '관리할 에이전트를 선택하세요',
    'home.manageAgentDesc': '왼쪽에서 관리하고 싶은 에이전트를 선택하면 여기에 관리 인터페이스가 나타납니다.',
    
    // 에이전트 관리
    'agent.management': '에이전트 관리',
    'agent.managementDesc': '관리 중인 에이전트를 선택하여 설정하세요',
    'agent.persona': '페르소나',
    'agent.iconChange': '아이콘 변경',
    'agent.settings': '챗봇 설정',
    'agent.notification': '알림보내기',
    'agent.upload': '문서 업로드',
    'agent.performance': '성과 분석',
    'agent.active': '활성',
    'agent.totalUsers': '총 메시지',
    'agent.satisfaction': '사용률',
    'agent.ranking': '순위',
    'agent.managementMode': '관리자 모드',
    'agent.generalChat': '채팅',
    
    // Chat interface
    'chat.typing': '메시지 작성 중...',
    'chat.inputPlaceholder': '메시지를 입력하세요...',
    
    // 마스터 관리자 센터
    'admin.title': 'LoBo AI 챗봇 통합 관리자 센터',
    'admin.subtitle': '대학교 AI 챗봇 서비스 통합 관리',
    'admin.dashboard': '대시보드',
    'admin.categories': '조직 카테고리 관리',
    'admin.users': '사용자 관리',
    'admin.agents': '에이전트 관리',
    'admin.documents': '문서 관리',
    'admin.conversations': '질문/응답 로그',
    'admin.tokens': '토큰 관리',
    'admin.system': '시스템 설정',
    'admin.logout': '로그아웃',
    'admin.chatbot': 'LoBo 챗봇',
    'admin.totalUsers': '총 사용자',
    'admin.totalAgents': '총 에이전트',
    'admin.totalConversations': '총 대화',
    'admin.totalTokens': '총 토큰',
    'admin.todayActivity': '오늘 활동',
    'admin.systemStatus': '시스템 상태',
    'admin.activeUsers': '활성 사용자',
    'admin.activeAgents': '활성 에이전트',
    'admin.totalMessages': '총 메시지',
    'admin.weeklyGrowth': '주간 증가율',
    
    // 언어 이름
    'language.ko': '한국어',
    'language.en': 'English',
    'language.zh': '中文',
    'language.vi': 'Tiếng Việt',
    'language.ja': '日本語',
  },
  
  en: {
    // Login page
    'auth.title': 'LoBo',
    'auth.subtitle': 'University AI Chatbot System',
    'auth.login': 'Login',
    'auth.username': 'Student/Faculty ID',
    'auth.usernamePlaceholder': 'e.g: 2024001234 or F2024001',
    'auth.password': 'Password',
    'auth.forgotPassword': 'Forgot your password?',
    'auth.forgotPasswordMessage': 'Contact administrator to reset your password.',
    'auth.loginButton': 'Login',
    'auth.loggingIn': 'Logging in...',
    'auth.demoAccounts': 'Quick login with demo accounts',
    'auth.studentAccount': '👨‍🎓 Student Account',
    'auth.facultyAccount': '👨‍🏫 Faculty Account',
    'auth.masterAccount': '🔑 Master Account',
    'auth.adminSystem': 'Admin System',
    'auth.autoCreate': 'Account will be created automatically if not exists',
    'auth.loginSuccess': 'Login Successful',
    'auth.welcome': 'Welcome!',
    'auth.loginFailed': 'Login Failed',
    'auth.loginError': 'Please check your ID or password.',
    'auth.settings': 'Settings',
    'auth.themeSettings': 'Theme Settings',
    'auth.languageSettings': 'Language Settings',
    'auth.usernameRequired': 'Please enter your ID',
    'auth.passwordRequired': 'Please enter password',
    'auth.passwordMinLength': 'Password must be at least 6 characters',
    'auth.firstNameRequired': 'Please enter first name',
    'auth.lastNameRequired': 'Please enter last name',
    'auth.emailInvalid': 'Please enter a valid email address',
    
    // Common UI elements
    'common.home': 'Home',
    'common.chat': 'Chat',
    'common.management': 'Management',
    'common.logout': 'Logout',
    'common.search': 'Search',
    'common.files': 'Files',
    'common.settings': 'Settings',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.upload': 'Upload',
    'common.download': 'Download',
    'common.loading': 'Loading...',
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
    'home.selectAgent': 'Select an agent',
    'home.selectAgentDesc': 'Choose an agent from the left to start chatting.',
    'home.manageAgent': 'Select an agent to manage',
    'home.manageAgentDesc': 'Choose an agent from the left to access management interface.',
    
    // Agent management
    'agent.management': 'Agent Management',
    'agent.managementDesc': 'Select a managed agent to configure settings',
    'agent.persona': 'Persona',
    'agent.iconChange': 'Change Icon',
    'agent.settings': 'Bot Settings',
    'agent.notification': 'Send Notification',
    'agent.upload': 'Upload Document',
    'agent.performance': 'Performance Analysis',
    'agent.active': 'Active',
    'agent.totalUsers': 'Total Messages',
    'agent.satisfaction': 'Usage Rate',
    'agent.ranking': 'Ranking',
    'agent.managementMode': 'Management Mode',
    'agent.generalChat': 'General Chat',
    
    // Chat interface
    'chat.typing': 'Typing...',
    'chat.inputPlaceholder': 'Type a message...',
    
    // Master Admin Center
    'admin.title': 'LoBo AI Chatbot Integrated Management Center',
    'admin.subtitle': 'University AI Chatbot Service Integrated Management',
    'admin.dashboard': 'Dashboard',
    'admin.categories': 'Organization Category Management',
    'admin.users': 'User Management',
    'admin.agents': 'Agent Management',
    'admin.documents': 'Document Management',
    'admin.conversations': 'Q&A Logs',
    'admin.tokens': 'Token Management',
    'admin.system': 'System Settings',
    'admin.logout': 'Logout',
    'admin.chatbot': 'LoBo Chatbot',
    'admin.totalUsers': 'Total Users',
    'admin.totalAgents': 'Total Agents',
    'admin.totalConversations': 'Total Conversations',
    'admin.totalTokens': 'Total Tokens',
    'admin.todayActivity': 'Today\'s Activity',
    'admin.systemStatus': 'System Status',
    'admin.activeUsers': 'Active Users',
    'admin.activeAgents': 'Active Agents',
    'admin.totalMessages': 'Total Messages',
    'admin.weeklyGrowth': 'Weekly Growth',
    
    // Language names
    'language.ko': '한국어',
    'language.en': 'English',
    'language.zh': '中文',
    'language.vi': 'Tiếng Việt',
    'language.ja': '日本語',
  },
  
  zh: {
    // 登录页面
    'auth.title': 'LoBo',
    'auth.subtitle': '大学人工智能聊天机器人系统',
    'auth.login': '登录',
    'auth.username': '学号/工号',
    'auth.usernamePlaceholder': '例: 2024001234 或 F2024001',
    'auth.password': '密码',
    'auth.forgotPassword': '忘记密码？',
    'auth.forgotPasswordMessage': '请联系管理员重置密码。',
    'auth.loginButton': '登录',
    'auth.loggingIn': '登录中...',
    'auth.demoAccounts': '使用演示账户快速登录',
    'auth.studentAccount': '👨‍🎓 学生账户',
    'auth.facultyAccount': '👨‍🏫 教职员账户',
    'auth.masterAccount': '🔑 管理员账户',
    'auth.adminSystem': '管理系统',
    'auth.autoCreate': '如果账户不存在将自动创建',
    'auth.loginSuccess': '登录成功',
    'auth.welcome': '欢迎！',
    'auth.loginFailed': '登录失败',
    'auth.loginError': '请检查您的账号或密码。',
    'auth.settings': '设置',
    'auth.themeSettings': '主题设置',
    'auth.languageSettings': '语言设置',
    'auth.usernameRequired': '请输入学号/工号',
    'auth.passwordRequired': '请输入密码',
    'auth.passwordMinLength': '密码至少需要6个字符',
    'auth.firstNameRequired': '请输入姓名',
    'auth.lastNameRequired': '请输入姓氏',
    'auth.emailInvalid': '请输入有效的邮箱地址',
    
    // 通用UI元素
    'common.home': '首页',
    'common.chat': '聊天',
    'common.management': '管理',
    'common.logout': '登出',
    'common.search': '搜索',
    'common.files': '文件',
    'common.settings': '设置',
    'common.save': '保存',
    'common.cancel': '取消',
    'common.delete': '删除',
    'common.edit': '编辑',
    'common.upload': '上传',
    'common.download': '下载',
    'common.loading': '加载中...',
    'common.error': '错误',
    'common.success': '成功',
    
    // 首页
    'home.searchPlaceholder': '搜索智能助手...',
    'home.categories.all': '全部',
    'home.categories.school': '学校',
    'home.categories.professor': '教授',
    'home.categories.student': '学生',
    'home.categories.group': '群组',
    'home.categories.function': '功能型',
    'home.accountSettings': '账户设置',
    'home.selectAgent': '请选择智能助手',
    'home.selectAgentDesc': '从左侧选择一个智能助手开始对话。',
    'home.manageAgent': '请选择要管理的智能助手',
    'home.manageAgentDesc': '从左侧选择一个智能助手来访问管理界面。',
    
    // 智能助手管理
    'agent.management': '智能助手管理',
    'agent.managementDesc': '选择要配置的智能助手',
    'agent.persona': '角色设定',
    'agent.iconChange': '更换图标',
    'agent.settings': '机器人设置',
    'agent.notification': '发送通知',
    'agent.upload': '上传文档',
    'agent.performance': '性能分析',
    'agent.active': '活跃',
    'agent.totalUsers': '总消息数',
    'agent.satisfaction': '使用率',
    'agent.ranking': '排名',
    'agent.managementMode': '管理模式',
    'agent.generalChat': '一般对话',
    
    // Chat interface
    'chat.typing': '正在输入...',
    'chat.inputPlaceholder': '输入消息...',
    
    // 主管理员中心
    'admin.title': 'LoBo AI 聊天机器人集成管理中心',
    'admin.subtitle': '大学 AI 聊天机器人服务集成管理',
    'admin.dashboard': '仪表板',
    'admin.categories': '组织类别管理',
    'admin.users': '用户管理',
    'admin.agents': '智能助手管理',
    'admin.documents': '文档管理',
    'admin.conversations': '问答日志',
    'admin.tokens': '令牌管理',
    'admin.system': '系统设置',
    'admin.logout': '登出',
    'admin.chatbot': 'LoBo 聊天机器人',
    'admin.totalUsers': '总用户数',
    'admin.totalAgents': '总智能助手数',
    'admin.totalConversations': '总对话数',
    'admin.totalTokens': '总令牌数',
    'admin.todayActivity': '今日活动',
    'admin.systemStatus': '系统状态',
    'admin.activeUsers': '活跃用户',
    'admin.activeAgents': '活跃智能助手',
    'admin.totalMessages': '总消息数',
    'admin.weeklyGrowth': '周增长率',
    
    // 语言名称
    'language.ko': '한국어',
    'language.en': 'English',
    'language.zh': '中文',
    'language.vi': 'Tiếng Việt',
    'language.ja': '日本語',
  },
  
  vi: {
    // Trang đăng nhập
    'auth.title': 'LoBo',
    'auth.subtitle': 'Hệ thống Chatbot AI Trường đại học',
    'auth.login': 'Đăng nhập',
    'auth.username': 'Mã số sinh viên/giảng viên',
    'auth.usernamePlaceholder': 'VD: 2024001234 hoặc F2024001',
    'auth.password': 'Mật khẩu',
    'auth.forgotPassword': 'Quên mật khẩu?',
    'auth.forgotPasswordMessage': 'Liên hệ quản trị viên để đặt lại mật khẩu.',
    'auth.loginButton': 'Đăng nhập',
    'auth.loggingIn': 'Đang đăng nhập...',
    'auth.demoAccounts': 'Đăng nhập nhanh với tài khoản demo',
    'auth.studentAccount': '👨‍🎓 Tài khoản sinh viên',
    'auth.facultyAccount': '👨‍🏫 Tài khoản giảng viên',
    'auth.masterAccount': '🔑 Tài khoản quản trị',
    'auth.adminSystem': 'Hệ thống quản trị',
    'auth.autoCreate': 'Tài khoản sẽ được tạo tự động nếu chưa tồn tại',
    'auth.loginSuccess': 'Đăng nhập thành công',
    'auth.welcome': 'Chào mừng!',
    'auth.loginFailed': 'Đăng nhập thất bại',
    'auth.loginError': 'Vui lòng kiểm tra mã số hoặc mật khẩu.',
    'auth.settings': 'Cài đặt',
    'auth.themeSettings': 'Cài đặt giao diện',
    'auth.languageSettings': 'Cài đặt ngôn ngữ',
    'auth.usernameRequired': 'Vui lòng nhập mã số',
    'auth.passwordRequired': 'Vui lòng nhập mật khẩu',
    'auth.passwordMinLength': 'Mật khẩu phải có ít nhất 6 ký tự',
    'auth.firstNameRequired': 'Vui lòng nhập tên',
    'auth.lastNameRequired': 'Vui lòng nhập họ',
    'auth.emailInvalid': 'Vui lòng nhập địa chỉ email hợp lệ',
    
    // Các phần tử UI chung
    'common.home': 'Trang chủ',
    'common.chat': 'Trò chuyện',
    'common.management': 'Quản lý',
    'common.logout': 'Đăng xuất',
    'common.search': 'Tìm kiếm',
    'common.files': 'Tập tin',
    'common.settings': 'Cài đặt',
    'common.save': 'Lưu',
    'common.cancel': 'Hủy',
    'common.delete': 'Xóa',
    'common.edit': 'Chỉnh sửa',
    'common.upload': 'Tải lên',
    'common.download': 'Tải xuống',
    'common.loading': 'Đang tải...',
    'common.error': 'Lỗi',
    'common.success': 'Thành công',
    
    // Trang chủ
    'home.searchPlaceholder': 'Tìm kiếm trợ lý AI...',
    'home.categories.all': 'Tất cả',
    'home.categories.school': 'Trường học',
    'home.categories.professor': 'Giáo sư',
    'home.categories.student': 'Sinh viên',
    'home.categories.group': 'Nhóm',
    'home.categories.function': 'Chức năng',
    'home.accountSettings': 'Cài đặt tài khoản',
    'home.selectAgent': 'Vui lòng chọn trợ lý AI',
    'home.selectAgentDesc': 'Chọn một trợ lý AI từ bên trái để bắt đầu trò chuyện.',
    'home.manageAgent': 'Vui lòng chọn trợ lý AI để quản lý',
    'home.manageAgentDesc': 'Chọn một trợ lý AI từ bên trái để truy cập giao diện quản lý.',
    
    // Quản lý trợ lý AI
    'agent.management': 'Quản lý trợ lý AI',
    'agent.managementDesc': 'Chọn trợ lý AI để cấu hình cài đặt',
    'agent.persona': 'Nhân cách',
    'agent.iconChange': 'Thay đổi biểu tượng',
    'agent.settings': 'Cài đặt bot',
    'agent.notification': 'Gửi thông báo',
    'agent.upload': 'Tải lên tài liệu',
    'agent.performance': 'Phân tích hiệu suất',
    'agent.active': 'Hoạt động',
    'agent.totalUsers': 'Tổng tin nhắn',
    'agent.satisfaction': 'Tỷ lệ sử dụng',
    'agent.ranking': 'Xếp hạng',
    'agent.managementMode': 'Chế độ quản lý',
    'agent.generalChat': 'Trò chuyện thường',
    
    // Chat interface
    'chat.typing': 'Đang nhập...',
    'chat.inputPlaceholder': 'Nhập tin nhắn...',
    
    // Trung tâm Quản trị chính
    'admin.title': 'Trung tâm Quản lý Tích hợp Chatbot AI LoBo',
    'admin.subtitle': 'Quản lý Tích hợp Dịch vụ Chatbot AI Trường đại học',
    'admin.dashboard': 'Bảng điều khiển',
    'admin.categories': 'Quản lý Danh mục Tổ chức',
    'admin.users': 'Quản lý Người dùng',
    'admin.agents': 'Quản lý Trợ lý AI',
    'admin.documents': 'Quản lý Tài liệu',
    'admin.conversations': 'Nhật ký Hỏi đáp',
    'admin.tokens': 'Quản lý Token',
    'admin.system': 'Cài đặt Hệ thống',
    'admin.logout': 'Đăng xuất',
    'admin.chatbot': 'LoBo Chatbot',
    'admin.totalUsers': 'Tổng số Người dùng',
    'admin.totalAgents': 'Tổng số Trợ lý AI',
    'admin.totalConversations': 'Tổng số Cuộc trò chuyện',
    'admin.totalTokens': 'Tổng số Token',
    'admin.todayActivity': 'Hoạt động hôm nay',
    'admin.systemStatus': 'Trạng thái Hệ thống',
    'admin.activeUsers': 'Người dùng Hoạt động',
    'admin.activeAgents': 'Trợ lý AI Hoạt động',
    'admin.totalMessages': 'Tổng số Tin nhắn',
    'admin.weeklyGrowth': 'Tăng trưởng Hàng tuần',
    
    // Tên ngôn ngữ
    'language.ko': '한국어',
    'language.en': 'English',
    'language.zh': '中文',
    'language.vi': 'Tiếng Việt',
    'language.ja': '日本語',
  },
  
  ja: {
    // ログインページ
    'auth.title': 'LoBo',
    'auth.subtitle': '大学AIチャットボットシステム',
    'auth.login': 'ログイン',
    'auth.username': '学籍番号/職員番号',
    'auth.usernamePlaceholder': '例: 2024001234 または F2024001',
    'auth.password': 'パスワード',
    'auth.forgotPassword': 'パスワードをお忘れですか？',
    'auth.forgotPasswordMessage': '管理者に連絡してパスワードをリセットしてください。',
    'auth.loginButton': 'ログイン',
    'auth.loggingIn': 'ログイン中...',
    'auth.demoAccounts': 'デモアカウントでクイックログイン',
    'auth.studentAccount': '👨‍🎓 学生アカウント',
    'auth.facultyAccount': '👨‍🏫 教職員アカウント',
    'auth.masterAccount': '🔑 マスターアカウント',
    'auth.adminSystem': '管理システム',
    'auth.autoCreate': 'アカウントが存在しない場合は自動作成されます',
    'auth.loginSuccess': 'ログイン成功',
    'auth.welcome': 'ようこそ！',
    'auth.loginFailed': 'ログイン失敗',
    'auth.loginError': '学籍番号/職員番号またはパスワードを確認してください。',
    'auth.settings': '設定',
    'auth.themeSettings': 'テーマ設定',
    'auth.languageSettings': '言語設定',
    'auth.usernameRequired': '学籍番号/職員番号を入力してください',
    'auth.passwordRequired': 'パスワードを入力してください',
    'auth.passwordMinLength': 'パスワードは6文字以上である必要があります',
    'auth.firstNameRequired': '名前を入力してください',
    'auth.lastNameRequired': '姓を入力してください',
    'auth.emailInvalid': '有効なメールアドレスを入力してください',
    
    // 共通UI要素
    'common.home': 'ホーム',
    'common.chat': 'チャット',
    'common.management': '管理',
    'common.logout': 'ログアウト',
    'common.search': '検索',
    'common.files': 'ファイル',
    'common.settings': '設定',
    'common.save': '保存',
    'common.cancel': 'キャンセル',
    'common.delete': '削除',
    'common.edit': '編集',
    'common.upload': 'アップロード',
    'common.download': 'ダウンロード',
    'common.loading': '読み込み中...',
    'common.error': 'エラー',
    'common.success': '成功',
    
    // ホームページ
    'home.searchPlaceholder': 'エージェント検索...',
    'home.categories.all': 'すべて',
    'home.categories.school': '学校',
    'home.categories.professor': '教授',
    'home.categories.student': '学生',
    'home.categories.group': 'グループ',
    'home.categories.function': '機能型',
    'home.accountSettings': 'アカウント設定',
    'home.selectAgent': 'エージェントを選択してください',
    'home.selectAgentDesc': '左側からエージェントを選択してチャットを開始してください。',
    'home.manageAgent': '管理するエージェントを選択してください',
    'home.manageAgentDesc': '左側からエージェントを選択して管理インターフェースにアクセスしてください。',
    
    // エージェント管理
    'agent.management': 'エージェント管理',
    'agent.managementDesc': '管理するエージェントを選択して設定してください',
    'agent.persona': 'ペルソナ',
    'agent.iconChange': 'アイコン変更',
    'agent.settings': 'ボット設定',
    'agent.notification': '通知送信',
    'agent.upload': 'ドキュメントアップロード',
    'agent.performance': 'パフォーマンス分析',
    'agent.active': 'アクティブ',
    'agent.totalUsers': '総メッセージ数',
    'agent.satisfaction': '使用率',
    'agent.ranking': 'ランキング',
    'agent.managementMode': '管理モード',
    'agent.generalChat': '一般チャット',
    
    // Chat interface
    'chat.typing': '入力中...',
    'chat.inputPlaceholder': 'メッセージを入力...',
    
    // マスター管理センター
    'admin.title': 'LoBo AI チャットボット統合管理センター',
    'admin.subtitle': '大学 AI チャットボットサービス統合管理',
    'admin.dashboard': 'ダッシュボード',
    'admin.categories': '組織カテゴリー管理',
    'admin.users': 'ユーザー管理',
    'admin.agents': 'エージェント管理',
    'admin.documents': 'ドキュメント管理',
    'admin.conversations': '質問・回答ログ',
    'admin.tokens': 'トークン管理',
    'admin.system': 'システム設定',
    'admin.logout': 'ログアウト',
    'admin.chatbot': 'LoBo チャットボット',
    'admin.totalUsers': '総ユーザー数',
    'admin.totalAgents': '総エージェント数',
    'admin.totalConversations': '総対話数',
    'admin.totalTokens': '総トークン数',
    'admin.todayActivity': '今日のアクティビティ',
    'admin.systemStatus': 'システムステータス',
    'admin.activeUsers': 'アクティブユーザー',
    'admin.activeAgents': 'アクティブエージェント',
    'admin.totalMessages': '総メッセージ数',
    'admin.weeklyGrowth': '週間成長率',
    
    // 言語名
    'language.ko': '한국어',
    'language.en': 'English',
    'language.zh': '中文',
    'language.vi': 'Tiếng Việt',
    'language.ja': '日本語',
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
  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};