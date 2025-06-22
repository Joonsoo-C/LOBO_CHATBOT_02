import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Settings, Database, Shield, Bell, Mail, Globe, Save } from "lucide-react";

interface SystemConfig {
  siteName: string;
  siteDescription: string;
  adminEmail: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  maxFileSize: number;
  sessionTimeout: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
  backupEnabled: boolean;
  backupInterval: string;
  logLevel: string;
  maxLoginAttempts: number;
  passwordMinLength: number;
  requirePasswordComplexity: boolean;
}

const configSchema = z.object({
  siteName: z.string().min(1, "사이트명은 필수입니다"),
  siteDescription: z.string().min(1, "사이트 설명은 필수입니다"),
  adminEmail: z.string().email("올바른 이메일을 입력해주세요"),
  maxFileSize: z.number().min(1, "최대 파일 크기는 1MB 이상이어야 합니다"),
  sessionTimeout: z.number().min(5, "세션 타임아웃은 최소 5분입니다"),
  maxLoginAttempts: z.number().min(1, "최대 로그인 시도 횟수는 1회 이상이어야 합니다"),
  passwordMinLength: z.number().min(4, "최소 비밀번호 길이는 4자 이상이어야 합니다"),
});

type ConfigFormData = z.infer<typeof configSchema>;

export default function SystemSettings2() {
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();

  // Mock data for demonstration
  const mockConfig: SystemConfig = {
    siteName: "LoBo AI 챗봇 시스템",
    siteDescription: "대학교 AI 챗봇 관리 시스템",
    adminEmail: "admin@university.edu",
    maintenanceMode: false,
    allowRegistration: true,
    maxFileSize: 10,
    sessionTimeout: 30,
    emailNotifications: true,
    smsNotifications: false,
    backupEnabled: true,
    backupInterval: "daily",
    logLevel: "info",
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requirePasswordComplexity: true,
  };

  const { data: config = mockConfig } = useQuery<SystemConfig>({
    queryKey: ["/api/admin/system-config"],
    initialData: mockConfig
  });

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      siteName: config.siteName,
      siteDescription: config.siteDescription,
      adminEmail: config.adminEmail,
      maxFileSize: config.maxFileSize,
      sessionTimeout: config.sessionTimeout,
      maxLoginAttempts: config.maxLoginAttempts,
      passwordMinLength: config.passwordMinLength,
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: (data: Partial<SystemConfig>) =>
      apiRequest("/api/admin/system-config", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({ title: "시스템 설정이 저장되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-config"] });
    },
  });

  const onSubmit = (data: ConfigFormData) => {
    updateConfigMutation.mutate(data);
  };

  const handleSwitchChange = (field: keyof SystemConfig, value: boolean) => {
    updateConfigMutation.mutate({ [field]: value });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>시스템 설정 2</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">일반 설정</TabsTrigger>
              <TabsTrigger value="security">보안 설정</TabsTrigger>
              <TabsTrigger value="notifications">알림 설정</TabsTrigger>
              <TabsTrigger value="backup">백업 설정</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-4 w-4" />
                    <span>사이트 정보</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="siteName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>사이트명</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="siteDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>사이트 설명</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="adminEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>관리자 이메일</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="maxFileSize"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>최대 파일 크기 (MB)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="sessionTimeout"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>세션 타임아웃 (분)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>유지보수 모드</Label>
                            <p className="text-sm text-gray-600">유지보수 모드 활성화 시 일반 사용자 접근 제한</p>
                          </div>
                          <Switch
                            checked={config.maintenanceMode}
                            onCheckedChange={(checked) => handleSwitchChange('maintenanceMode', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>회원가입 허용</Label>
                            <p className="text-sm text-gray-600">새로운 사용자의 회원가입을 허용합니다</p>
                          </div>
                          <Switch
                            checked={config.allowRegistration}
                            onCheckedChange={(checked) => handleSwitchChange('allowRegistration', checked)}
                          />
                        </div>
                      </div>
                      <Button type="submit" disabled={updateConfigMutation.isPending} className="w-full">
                        <Save className="h-4 w-4 mr-2" />
                        설정 저장
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>보안 정책</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>최대 로그인 시도 횟수</Label>
                      <Input
                        type="number"
                        value={config.maxLoginAttempts}
                        onChange={(e) => updateConfigMutation.mutate({ maxLoginAttempts: Number(e.target.value) })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>최소 비밀번호 길이</Label>
                      <Input
                        type="number"
                        value={config.passwordMinLength}
                        onChange={(e) => updateConfigMutation.mutate({ passwordMinLength: Number(e.target.value) })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>비밀번호 복잡성 요구</Label>
                      <p className="text-sm text-gray-600">대소문자, 숫자, 특수문자 포함 필수</p>
                    </div>
                    <Switch
                      checked={config.requirePasswordComplexity}
                      onCheckedChange={(checked) => handleSwitchChange('requirePasswordComplexity', checked)}
                    />
                  </div>
                  <div>
                    <Label>로그 레벨</Label>
                    <select
                      value={config.logLevel}
                      onChange={(e) => updateConfigMutation.mutate({ logLevel: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="error">Error</option>
                      <option value="warn">Warning</option>
                      <option value="info">Info</option>
                      <option value="debug">Debug</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-4 w-4" />
                    <span>알림 설정</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <div>
                        <Label>이메일 알림</Label>
                        <p className="text-sm text-gray-600">시스템 알림을 이메일로 전송</p>
                      </div>
                    </div>
                    <Switch
                      checked={config.emailNotifications}
                      onCheckedChange={(checked) => handleSwitchChange('emailNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>SMS 알림</Label>
                      <p className="text-sm text-gray-600">중요한 알림을 SMS로 전송</p>
                    </div>
                    <Switch
                      checked={config.smsNotifications}
                      onCheckedChange={(checked) => handleSwitchChange('smsNotifications', checked)}
                    />
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">알림 발송 조건</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• 시스템 오류 발생 시</li>
                      <li>• 사용자 계정 보안 이슈</li>
                      <li>• 서버 리소스 부족</li>
                      <li>• 백업 실패</li>
                      <li>• 대량의 스팸 활동 감지</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="backup" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-4 w-4" />
                    <span>백업 설정</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>자동 백업 활성화</Label>
                      <p className="text-sm text-gray-600">정기적으로 데이터베이스 자동 백업</p>
                    </div>
                    <Switch
                      checked={config.backupEnabled}
                      onCheckedChange={(checked) => handleSwitchChange('backupEnabled', checked)}
                    />
                  </div>
                  <div>
                    <Label>백업 주기</Label>
                    <select
                      value={config.backupInterval}
                      onChange={(e) => updateConfigMutation.mutate({ backupInterval: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      disabled={!config.backupEnabled}
                    >
                      <option value="hourly">매시간</option>
                      <option value="daily">매일</option>
                      <option value="weekly">매주</option>
                      <option value="monthly">매월</option>
                    </select>
                  </div>
                  <div className="space-y-4">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => toast({ title: "수동 백업을 시작합니다." })}
                    >
                      수동 백업 실행
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => toast({ title: "백업 목록을 확인합니다." })}
                    >
                      백업 파일 목록 보기
                    </Button>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">최근 백업 상태</h4>
                    <div className="space-y-2 text-sm text-green-800">
                      <div className="flex justify-between">
                        <span>마지막 백업:</span>
                        <Badge variant="secondary">2025-06-22 08:00</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>백업 크기:</span>
                        <span>245.6 MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>상태:</span>
                        <Badge className="bg-green-100 text-green-800">성공</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}