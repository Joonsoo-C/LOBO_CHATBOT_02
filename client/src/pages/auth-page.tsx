import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Settings, Globe } from "lucide-react";
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

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

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

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("POST", "/api/login", data);
      return response.json();
    },
    onSuccess: async (userData) => {
      // Invalidate and refetch user data to ensure proper authentication state
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      await queryClient.refetchQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: t('auth.loginSuccess'),
        description: t('auth.welcome'),
      });
      
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
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
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
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            {t('auth.title')}
          </h1>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            {t('auth.subtitle')}
          </h2>
        </div>

        {/* Auth Form */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{t('auth.login')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-username">{t('auth.username')}</Label>
                <Input
                  id="login-username"
                  type="text"
                  placeholder={t('auth.usernamePlaceholder')}
                  {...loginForm.register("username")}
                />
                {loginForm.formState.errors.username && (
                  <p className="text-sm text-red-500">
                    {loginForm.formState.errors.username.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">{t('auth.password')}</Label>
                <Input
                  id="login-password"
                  type="password"
                  {...loginForm.register("password")}
                />
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-red-500">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
                <div className="text-right">
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
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
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? t('auth.loggingIn') : t('auth.loginButton')}
              </Button>
            </form>

            {/* 데모 계정 섹션 */}
            <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">{t('auth.demoAccounts')}</p>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    loginForm.setValue("username", "2024001234");
                    loginForm.setValue("password", "student123");
                  }}
                >
                  {t('auth.studentAccount')}
                  <br />
                  <span className="text-xs text-muted-foreground">2024001234</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    loginForm.setValue("username", "F2024001");
                    loginForm.setValue("password", "faculty123");
                  }}
                >
                  {t('auth.facultyAccount')}
                  <br />
                  <span className="text-xs text-muted-foreground">F2024001</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    loginForm.setValue("username", "master_admin");
                    loginForm.setValue("password", "master123");
                  }}
                >
                  {t('auth.masterAccount')}
                  <br />
                  <span className="text-xs text-muted-foreground">master_admin</span>
                </Button>
              </div>
              <p className="text-xs text-blue-700">
                {t('auth.autoCreate')}
              </p>
            </div>
          </CardContent>
        </Card>

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