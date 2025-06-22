
import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Users, Plus, Edit, Trash2, Search, RotateCcw } from "lucide-react";

interface User {
  id: string;
  username: string;
  role: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  department?: string;
  organization?: string;
  university?: string;
  college?: string;
  position?: string;
  userType?: string;
}

const userSchema = z.object({
  username: z.string().min(1, "사용자명은 필수입니다"),
  email: z.string().email("올바른 이메일을 입력해주세요"),
  firstName: z.string().min(1, "성은 필수입니다"),
  lastName: z.string().min(1, "이름은 필수입니다"),
  role: z.string().min(1, "역할을 선택해주세요"),
});

type UserFormData = z.infer<typeof userSchema>;

export default function UserManagement2() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUpCategory, setSelectedUpCategory] = useState("전체");
  const [selectedLowCategory, setSelectedLowCategory] = useState("전체");
  const [selectedDetailCategory, setSelectedDetailCategory] = useState("전체");
  const [selectedRegion, setSelectedRegion] = useState("전체");
  const [selectedStatus, setSelectedStatus] = useState("전체");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      role: "",
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (data: UserFormData) =>
      apiRequest("/api/admin/users", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({ title: "사용자가 생성되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UserFormData> }) =>
      apiRequest(`/api/admin/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({ title: "사용자 정보가 수정되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditingUser(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/admin/users/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast({ title: "사용자가 삭제되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  const onSubmit = (data: UserFormData) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data });
    } else {
      createUserMutation.mutate(data);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.reset({
      username: user.username,
      email: user.email || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: user.role,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("정말로 이 사용자를 삭제하시겠습니까?")) {
      deleteUserMutation.mutate(id);
    }
  };

  const resetFilters = () => {
    setSelectedUpCategory("전체");
    setSelectedLowCategory("전체");
    setSelectedDetailCategory("전체");
    setSelectedRegion("전체");
    setSelectedStatus("전체");
    setSearchTerm("");
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 필터 조건들
    const matchesUpCategory = selectedUpCategory === "전체" || user.university === selectedUpCategory;
    const matchesLowCategory = selectedLowCategory === "전체" || user.college === selectedLowCategory;
    const matchesDetailCategory = selectedDetailCategory === "전체" || user.department === selectedDetailCategory;
    const matchesRegion = selectedRegion === "전체" || user.region === selectedRegion;
    const matchesStatus = selectedStatus === "전체" || 
                         (selectedStatus === "활성" && user.isActive) ||
                         (selectedStatus === "비활성" && !user.isActive);
    
    return matchesSearch && matchesUpCategory && matchesLowCategory && matchesDetailCategory && matchesRegion && matchesStatus;
  });

  // 가짜 데이터 생성 (실제로는 API에서 받아와야 함)
  const mockUsers = [
    {
      id: "1",
      username: "신미나",
      email: "신.미나200@university.edu",
      firstName: "신",
      lastName: "미나",
      role: "학생",
      organization: "인문대학 > 중어중문학과",
      department: "중어중문학과",
      college: "인문대학",
      university: "로보대학교",
      userType: "일반사용자",
      isActive: true,
      createdAt: "2024-01-15"
    },
    {
      id: "2", 
      username: "오해진",
      email: "오.해진199@university.edu",
      firstName: "오",
      lastName: "해진",
      role: "학생",
      organization: "예술대학 > 디자인학과",
      department: "디자인학과",
      college: "예술대학",
      university: "로보대학교",
      userType: "일반사용자",
      isActive: true,
      createdAt: "2024-01-20"
    },
    {
      id: "3",
      username: "오태준",
      email: "오.태준198@university.edu", 
      firstName: "오",
      lastName: "태준",
      role: "학생",
      organization: "예술대학 > 디자인학과",
      department: "디자인학과",
      college: "예술대학",
      university: "로보대학교",
      userType: "일반사용자",
      isActive: true,
      createdAt: "2024-02-01"
    },
    {
      id: "4",
      username: "권성현",
      email: "권.성현197@university.edu",
      firstName: "권",
      lastName: "성현", 
      role: "학생",
      organization: "예술대학 > 음악학과",
      department: "음악학과",
      college: "예술대학",
      university: "로보대학교",
      userType: "QA 관리자",
      isActive: true,
      createdAt: "2024-02-10"
    },
    {
      id: "5",
      username: "감수빈",
      email: "감.수빈196@university.edu",
      firstName: "감",
      lastName: "수빈",
      role: "학생", 
      organization: "자연과학대학 > 생명과학과",
      department: "생명과학과",
      college: "자연과학대학",
      university: "로보대학교",
      userType: "일반사용자",
      isActive: true,
      createdAt: "2024-02-15"
    },
    {
      id: "6",
      username: "황현수",
      email: "황.현수195@university.edu",
      firstName: "황",
      lastName: "현수",
      role: "학생",
      organization: "사회과학대학 > 심리학과",
      department: "심리학과", 
      college: "사회과학대학",
      university: "로보대학교",
      userType: "에이전트 관리자",
      isActive: true,
      createdAt: "2024-03-01"
    },
    {
      id: "7",
      username: "한지은",
      email: "한.지은194@university.edu",
      firstName: "한",
      lastName: "지은",
      role: "학생",
      organization: "생활과학",
      department: "생활과학",
      college: "생활과학대학",
      university: "로보대학교", 
      userType: "에이전트 관리자",
      isActive: true,
      createdAt: "2024-03-05"
    },
    {
      id: "8",
      username: "류현영",
      email: "류.현영193@university.edu",
      firstName: "류",
      lastName: "현영",
      role: "학생",
      organization: "인문대학 > 중어중문학과",
      department: "중어중문학과",
      college: "인문대학", 
      university: "로보대학교",
      userType: "에이전트 관리자",
      isActive: true,
      createdAt: "2024-03-10"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">사용자 검색</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 검색 및 필터 섹션 */}
          <div className="space-y-4">
            {/* 검색 행 */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium whitespace-nowrap">검색</label>
                <div className="relative flex-1 min-w-[300px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="사용자 이름 또는 이메일로 검색"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* 필터 행 */}
            <div className="grid grid-cols-6 gap-4 items-end">
              <div>
                <label className="text-sm font-medium mb-2 block">상위 카테고리</label>
                <select
                  value={selectedUpCategory}
                  onChange={(e) => setSelectedUpCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                >
                  <option value="전체">전체</option>
                  <option value="로보대학교">로보대학교</option>
                  <option value="테크대학교">테크대학교</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">하위 카테고리</label>
                <select
                  value={selectedLowCategory}
                  onChange={(e) => setSelectedLowCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                >
                  <option value="전체">전체</option>
                  <option value="인문대학">인문대학</option>
                  <option value="예술대학">예술대학</option>
                  <option value="자연과학대학">자연과학대학</option>
                  <option value="사회과학대학">사회과학대학</option>
                  <option value="생활과학대학">생활과학대학</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">세부 카테고리</label>
                <select
                  value={selectedDetailCategory}
                  onChange={(e) => setSelectedDetailCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                >
                  <option value="전체">전체</option>
                  <option value="중어중문학과">중어중문학과</option>
                  <option value="디자인학과">디자인학과</option>
                  <option value="음악학과">음악학과</option>
                  <option value="생명과학과">생명과학과</option>
                  <option value="심리학과">심리학과</option>
                  <option value="생활과학">생활과학</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">역할</label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                >
                  <option value="전체">전체</option>
                  <option value="학생">학생</option>
                  <option value="교수">교수</option>
                  <option value="관리자">관리자</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">상태</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                >
                  <option value="전체">전체</option>
                  <option value="활성">활성</option>
                  <option value="비활성">비활성</option>
                </select>
              </div>

              <div>
                <Button 
                  variant="outline" 
                  onClick={resetFilters}
                  className="w-full"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  초기화
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 사용자 목록 카드 */}
      <Card className="mt-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">사용자 목록</CardTitle>
            <div className="text-sm text-gray-600">
              총 200명의 사용자 중 1 - 20개 표시
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 사용자 테이블 */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">이름</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">이메일</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">소속 및 역할</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">상태</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">설정</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">삭제</th>
                </tr>
              </thead>
              <tbody>
                {mockUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="py-3 px-4 font-medium">{user.username}</td>
                    <td className="py-3 px-4 text-gray-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div className="font-medium">{user.organization}</div>
                        <div className="text-gray-500">{user.userType}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={user.isActive ? "default" : "secondary"} className="bg-blue-100 text-blue-700 border-blue-200">
                        활성
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(user as any)}
                        className="p-2"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>사용자 수정</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>사용자명</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이메일</FormLabel>
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
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>성</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>이름</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>역할</FormLabel>
                      <FormControl>
                        <select {...field} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                          <option value="">역할 선택</option>
                          <option value="student">학생</option>
                          <option value="faculty">교수</option>
                          <option value="admin">관리자</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                    취소
                  </Button>
                  <Button type="submit" disabled={updateUserMutation.isPending}>
                    수정
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
