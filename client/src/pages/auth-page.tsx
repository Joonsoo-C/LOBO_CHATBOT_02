import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Settings, Globe, Eye, EyeOff, GraduationCap, UserCheck, Shield } from "lucide-react";
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
  const [selectedAccountType, setSelectedAccountType] = useState("student");

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
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{ 
           background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
         }}>
      {/* Settings dropdown in top right */}
      <div className="fixed top-4 right-4 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
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
      <div className="w-full max-w-md mx-auto">
        {/* Main Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header Section */}
          <div className="px-8 pt-12 pb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Get Started
            </h1>
            <p className="text-gray-500 text-sm">
              Already have an account? 
              <button className="text-blue-600 hover:underline ml-1">
                Sign In
              </button>
            </p>
          </div>

          {/* Form Section */}
          <div className="px-8 pb-8">
            <form onSubmit={(e) => {
              console.log("폼 제출 이벤트");
              loginForm.handleSubmit(onLogin)(e);
            }} className="space-y-6">
              
              {/* Full Name Field */}
              <div>
                <label className="block text-gray-500 text-sm mb-2">
                  Full Name
                </label>
                <input
                  id="login-username"
                  type="text"
                  placeholder="Nouman Suleman"
                  className="w-full px-4 py-4 border-0 border-b-2 border-gray-200 bg-transparent text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors text-lg"
                  {...loginForm.register("username")}
                />
                {loginForm.formState.errors.username && (
                  <p className="text-sm text-red-500 mt-1">
                    {loginForm.formState.errors.username.message}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-gray-500 text-sm mb-2">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="noumansuleman000@gmail.com"
                  className="w-full px-4 py-4 border-0 border-b-2 border-gray-200 bg-transparent text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors text-lg"
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-gray-500 text-sm mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-4 border-0 border-b-2 border-gray-200 bg-transparent text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors text-lg pr-12"
                    {...loginForm.register("password")}
                  />
                  <button
                    type="button"
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-red-500 mt-1">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Account Type */}
              <div>
                <label className="block text-gray-500 text-sm mb-4">데모 계정으로 빠른 로그인</label>
                <div className="grid grid-cols-3 gap-3">
                  {/* 학생계정 */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAccountType("student");
                      loginForm.setValue("username", "user1082");
                      loginForm.setValue("password", "student123");
                    }}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center space-y-2 ${
                      selectedAccountType === "student" 
                        ? "border-blue-500 bg-blue-50 text-blue-700" 
                        : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <GraduationCap className="w-6 h-6" />
                    <span className="text-xs font-medium">학생</span>
                  </button>

                  {/* 교직원계정 */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAccountType("faculty");
                      loginForm.setValue("username", "user1081");
                      loginForm.setValue("password", "faculty123");
                    }}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center space-y-2 ${
                      selectedAccountType === "faculty" 
                        ? "border-blue-500 bg-blue-50 text-blue-700" 
                        : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <UserCheck className="w-6 h-6" />
                    <span className="text-xs font-medium">교직원</span>
                  </button>

                  {/* 마스터계정 */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAccountType("master");
                      loginForm.setValue("username", "master_admin");
                      loginForm.setValue("password", "MasterAdmin2024!");
                      // 마스터 계정은 자동 로그인
                      setTimeout(() => {
                        const formData = { username: "master_admin", password: "MasterAdmin2024!" };
                        onLogin(formData);
                      }, 100);
                    }}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center space-y-2 ${
                      selectedAccountType === "master" 
                        ? "border-blue-500 bg-blue-50 text-blue-700" 
                        : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <Shield className="w-6 h-6" />
                    <span className="text-xs font-medium">마스터</span>
                  </button>
                </div>
              </div>

              {/* Sign Up Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-2xl font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? 'Signing In...' : 'Sign Up'}
              </button>

              {/* Terms */}
              <p className="text-xs text-gray-400 text-center leading-relaxed">
                By Sign up you agree to our 
                <button className="text-blue-600 hover:underline mx-1">Privacy Policy</button> 
                and 
                <button className="text-blue-600 hover:underline ml-1">Terms and Condition</button>
              </p>
            </form>
          </div>
        </div>

        {/* Demo Accounts Section */}
        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-6">
          <p className="text-white text-sm font-medium mb-4 text-center">
            {t('auth.demoAccounts')}
          </p>
          <div className="space-y-3">
            <button
              type="button"
              className="w-full bg-white/20 hover:bg-white/30 text-white py-3 px-4 rounded-xl transition-all duration-200 backdrop-blur-sm"
              onClick={() => {
                loginForm.setValue("username", "user1082");
                loginForm.setValue("password", "student123");
              }}
            >
              <div className="text-center">
                <div className="font-medium">학생계정 (장지훈)</div>
                <div className="text-xs opacity-90 mt-1">인문대학 / 국어국문학과 / 현대문학전공</div>
              </div>
            </button>
            <button
              type="button"
              className="w-full bg-white/20 hover:bg-white/30 text-white py-3 px-4 rounded-xl transition-all duration-200 backdrop-blur-sm"
              onClick={() => {
                loginForm.setValue("username", "user1081");
                loginForm.setValue("password", "faculty123");
              }}
            >
              <div className="text-center">
                <div className="font-medium">교직원계정 (정수빈)</div>
                <div className="text-xs opacity-90 mt-1">인문대학 / 국어국문학과 / 현대문학전공, 교수</div>
              </div>
            </button>
            <button
              type="button"
              className="w-full bg-white/20 hover:bg-white/30 text-white py-3 px-4 rounded-xl transition-all duration-200 backdrop-blur-sm"
              onClick={() => {
                console.log("마스터 계정 버튼 클릭됨");
                loginForm.setValue("username", "master_admin");
                loginForm.setValue("password", "MasterAdmin2024!");
                setTimeout(() => {
                  const formData = { username: "master_admin", password: "MasterAdmin2024!" };
                  onLogin(formData);
                }, 100);
              }}
            >
              <div className="text-center">
                <div className="font-medium">마스터계정 (Master Admin)</div>
                <div className="text-xs opacity-90 mt-1">LoBo AI 챗봇 통합 관리자 센터</div>
              </div>
            </button>
          </div>
        </div>

        {/* Language Selection */}
        <div className="flex justify-center mt-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm px-4 py-2"
              >
                <Globe className="w-4 h-4 mr-2" />
                <span className="text-sm">{languages.find(lang => lang.code === language)?.name}</span>
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