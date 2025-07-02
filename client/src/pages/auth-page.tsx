import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Settings, Globe, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeSelector } from "@/components/ThemeSelector";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";

import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

const createLoginSchema = (t: (key: string) => string) => z.object({
  username: z.string().min(1, t('auth.usernameRequired') || "Username is required"),
  password: z.string().min(1, t('auth.passwordRequired') || "Password is required"),
});

const createRegisterSchema = (t: (key: string) => string) => z.object({
  username: z.string().min(1, t('auth.usernameRequired') || "Username is required"),
  password: z.string().min(6, t('auth.passwordMinLength') || "Password must be at least 6 characters"),
  firstName: z.string().min(1, t('auth.firstNameRequired') || "First name is required"),
  lastName: z.string().min(1, t('auth.lastNameRequired') || "Last name is required"),
  email: z.string().email(t('auth.emailInvalid') || "Invalid email").optional().or(z.literal("")),
  userType: z.enum(["student", "faculty"]),
});

const languages: { code: 'ko' | 'en' | 'zh' | 'vi' | 'ja'; flag: string; name: string }[] = [
  { code: 'ko', flag: '🇰🇷', name: '한국어' },
  { code: 'en', flag: '🇺🇸', name: 'English' },
  { code: 'zh', flag: '🇨🇳', name: '中文' },
  { code: 'vi', flag: '🇻🇳', name: 'Tiếng Việt' },
  { code: 'ja', flag: '🇯🇵', name: '日本語' },
];

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);

  const loginSchema = createLoginSchema(t);
  const registerSchema = createRegisterSchema(t);

  type LoginData = z.infer<typeof loginSchema>;
  type RegisterData = z.infer<typeof registerSchema>;

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      email: "",
      userType: "student",
    },
  });

  // Handle redirect with useEffect to avoid hooks issue
  useEffect(() => {
    if (user) {
      if (user.username === "master_admin") {
        setLocation("/master-admin");
      } else {
        setLocation("/");
      }
    }
  }, [user, setLocation]);

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("POST", "/api/login", data);
      return response.json();
    },
    onSuccess: async (userData) => {
      // Invalidate and refetch user data to ensure proper authentication state
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      await queryClient.refetchQueries({ queryKey: ["/api/user"] });
      
      // Small delay to ensure auth state is updated before navigation
      setTimeout(() => {
        // Check if user is master admin and redirect accordingly
        if (userData?.username === "master_admin") {
          setLocation("/master-admin");
        } else {
          setLocation("/");
        }
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: t('auth.loginFailed'),
        description: t('auth.loginError'),
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiRequest("POST", "/api/register", data);
      return response.json();
    },
    onSuccess: async () => {
      // Invalidate and refetch user data to ensure proper authentication state
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      await queryClient.refetchQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "회원가입 성공",
        description: "계정이 생성되었습니다. 로그인되었습니다.",
      });
      
      // Small delay to ensure auth state is updated before navigation
      setTimeout(() => {
        setLocation("/");
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: "회원가입 실패",
        description: "이미 존재하는 학번/교번이거나 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const onLogin = (data: LoginData) => {
    console.log("로그인 시도:", data);
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--neu-bg)' }}>
      {/* Settings dropdown in top right */}
      <div className="fixed top-4 right-4 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1">
              <div className="text-sm text-muted-foreground mb-2">{t('auth.themeSettings')}</div>
              <ThemeSelector />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Logo Section */}
        <div className="text-center space-y-4 mb-8">
          <div className="neu-card w-32 h-32 mx-auto flex items-center justify-center">
            <h1 className="text-4xl font-bold" style={{ color: 'var(--neu-text)' }}>
              LoBo
            </h1>
          </div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--neu-text-light)' }}>
            {t('auth.subtitle')}
          </h2>
        </div>

        {/* Auth Form */}
        <div className="neu-card w-full">
          <div className="mb-6">
            <h3 className="text-2xl font-semibold text-center" style={{ color: 'var(--neu-text)' }}>
              {t('auth.login')}
            </h3>
          </div>
          <div className="space-y-6">
            <form onSubmit={(e) => {
              console.log("폼 제출 이벤트");
              loginForm.handleSubmit(onLogin)(e);
            }} className="space-y-4">
              <div className="space-y-3">
                <label style={{ color: 'var(--neu-text)', fontWeight: '600' }}>
                  {t('auth.username')}
                </label>
                <input
                  id="login-username"
                  type="text"
                  placeholder={t('auth.usernamePlaceholder')}
                  className="neu-input w-full"
                  {...loginForm.register("username")}
                />
                {loginForm.formState.errors.username && (
                  <p className="text-sm" style={{ color: 'var(--neu-error)' }}>
                    {loginForm.formState.errors.username.message}
                  </p>
                )}
              </div>
              <div className="space-y-3">
                <label style={{ color: 'var(--neu-text)', fontWeight: '600' }}>
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    className="neu-input w-full pr-12"
                    {...loginForm.register("password")}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2"
                    style={{ 
                      background: 'transparent',
                      boxShadow: 'none',
                      color: 'var(--neu-text-light)',
                      border: 'none'
                    }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-sm" style={{ color: 'var(--neu-error)' }}>
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
                <div className="text-right">
                  <button
                    type="button"
                    className="text-sm hover:underline"
                    style={{ color: 'var(--neu-primary)' }}
                    onClick={() => {
                      toast({
                        title: t('auth.forgotPassword'),
                        description: t('auth.forgotPasswordMessage'),
                      });
                    }}
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="neu-button-primary w-full text-lg font-semibold"
                disabled={loginMutation.isPending}
                onClick={(e) => {
                  console.log("로그인 버튼 클릭됨");
                  const formData = loginForm.getValues();
                  console.log("현재 폼 데이터:", formData);
                }}
              >
                {loginMutation.isPending ? t('auth.loggingIn') : t('auth.loginButton')}
              </button>
            </form>

            {/* 데모 계정 섹션 */}
            <div className="neu-card">
              <p className="text-sm font-semibold mb-4" style={{ color: 'var(--neu-text)' }}>
                {t('auth.demoAccounts')}
              </p>
              <div className="space-y-4">
                <button
                  type="button"
                  className="neu-button-success w-full py-4"
                  onClick={() => {
                    loginForm.setValue("username", "user1082");
                    loginForm.setValue("password", "student123");
                  }}
                >
                  <div className="text-center">
                    <div className="font-medium text-base">학생계정 (장지훈)</div>
                    <div className="text-xs opacity-90 mt-1">인문대학 / 국어국문학과 / 현대문학전공</div>
                  </div>
                </button>
                <button
                  type="button"
                  className="neu-button-warning w-full py-4"
                  onClick={() => {
                    loginForm.setValue("username", "user1081");
                    loginForm.setValue("password", "faculty123");
                  }}
                >
                  <div className="text-center">
                    <div className="font-medium text-base">교직원계정 (정수빈)</div>
                    <div className="text-xs opacity-90 mt-1">인문대학 / 국어국문학과 / 현대문학전공, 교수</div>
                  </div>
                </button>
                <button
                  type="button"
                  className="neu-button-error w-full py-4"
                  onClick={() => {
                    console.log("마스터 계정 버튼 클릭됨");
                    loginForm.setValue("username", "master_admin");
                    loginForm.setValue("password", "MasterAdmin2024!");
                    // 자동으로 로그인 시도
                    setTimeout(() => {
                      const formData = { username: "master_admin", password: "MasterAdmin2024!" };
                      onLogin(formData);
                    }, 100);
                  }}
                >
                  <div className="text-center">
                    <div className="font-medium text-base">마스터계정 (Master Admin)</div>
                    <div className="text-xs opacity-90 mt-1">LoBo AI 챗봇 통합 관리자 센터</div>
                  </div>
                </button>
              </div>
              <p className="text-xs" style={{ color: 'var(--neu-text-light)' }}>
                {t('auth.autoCreate')}
              </p>
            </div>
          </div>
        </div>

        {/* 언어 선택 섹션 - 하단 */}
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="bg-white dark:bg-gray-800 border shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors px-4 py-3 h-auto w-[160px]"
              >
                <Globe className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">{languages.find(lang => lang.code === language)?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-[160px]">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`cursor-pointer ${language === lang.code ? 'bg-accent' : ''}`}
                >
                  <span className="mr-2">{lang.flag}</span>
                  <span>{lang.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}