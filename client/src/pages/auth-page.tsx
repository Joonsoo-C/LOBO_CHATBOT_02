import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

const loginSchema = z.object({
  username: z.string().min(1, "학번/교번을 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

const registerSchema = z.object({
  username: z.string().min(1, "학번/교번을 입력해주세요"),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
  firstName: z.string().min(1, "이름을 입력해주세요"),
  lastName: z.string().min(1, "성을 입력해주세요"),
  email: z.string().email("올바른 이메일 주소를 입력해주세요").optional().or(z.literal("")),
  userType: z.enum(["student", "faculty"]),
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "로그인 성공",
        description: "환영합니다!",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "로그인 실패",
        description: "학번/교번 또는 비밀번호를 확인해주세요.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiRequest("POST", "/api/register", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "회원가입 성공",
        description: "계정이 생성되었습니다. 로그인되었습니다.",
      });
      setLocation("/");
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="space-y-6 text-center md:text-left">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900">
              LoBo
            </h1>
            <h2 className="text-2xl font-semibold text-gray-700">
              대학교 AI 챗봇 시스템
            </h2>
          </div>
          <p className="text-lg text-gray-600 leading-relaxed">
            학교 생활에 필요한 모든 정보를 AI 챗봇과 함께 쉽고 빠르게 찾아보세요.
            전공별 맞춤 상담부터 학사 정보까지, 똑똑한 AI가 도와드립니다.
          </p>
          <div className="space-y-3 text-sm text-gray-500">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>24시간 언제든지 이용 가능</span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>학과별 전문 상담 제공</span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>문서 업로드 및 분석 기능</span>
            </div>
          </div>
        </div>

        {/* Auth Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>로그인</CardTitle>
            <CardDescription>
              학번/교번으로 로그인하세요. 계정이 없으면 자동으로 생성됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 데모 계정 섹션 */}
            <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">데모 계정으로 빠른 로그인</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    loginForm.setValue("username", "2024001234");
                    loginForm.setValue("password", "student123");
                  }}
                >
                  👨‍🎓 학생 계정
                  <br />
                  <span className="text-xs text-muted-foreground">2024001234</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    loginForm.setValue("username", "F2024001");
                    loginForm.setValue("password", "faculty123");
                  }}
                >
                  👨‍🏫 교직원 계정
                  <br />
                  <span className="text-xs text-muted-foreground">F2024001</span>
                </Button>
              </div>
              <p className="text-xs text-blue-700">
                계정이 없는 경우 자동으로 생성됩니다
              </p>
            </div>

            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-username">학번/교번</Label>
                <Input
                  id="login-username"
                  type="text"
                  placeholder="예: 2024001234 또는 F2024001"
                  {...loginForm.register("username")}
                />
                {loginForm.formState.errors.username && (
                  <p className="text-sm text-red-500">
                    {loginForm.formState.errors.username.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">비밀번호</Label>
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
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "로그인 중..." : "로그인"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}