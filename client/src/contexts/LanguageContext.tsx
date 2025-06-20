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