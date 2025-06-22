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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { FolderTree, Plus, Edit, Trash2, Home, GraduationCap, Users, BookOpen, Settings } from "lucide-react";

interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  backgroundColor: string;
  agentCount: number;
  isActive: boolean;
  createdAt: string;
  order: number;
}

const categorySchema = z.object({
  name: z.string().min(1, "카테고리 이름은 필수입니다"),
  description: z.string().min(1, "설명은 필수입니다"),
  icon: z.string().min(1, "아이콘을 선택해주세요"),
  backgroundColor: z.string().min(1, "배경색을 선택해주세요"),
});

type CategoryFormData = z.infer<typeof categorySchema>;

const iconOptions = [
  { value: "🏠", label: "학교", icon: Home },
  { value: "👨‍🏫", label: "교수", icon: GraduationCap },
  { value: "👥", label: "그룹", icon: Users },
  { value: "🎓", label: "학생", icon: BookOpen },
  { value: "⚙️", label: "기능형", icon: Settings },
];

const colorOptions = [
  { value: "#3B82F6", label: "파란색" },
  { value: "#10B981", label: "초록색" },
  { value: "#F59E0B", label: "주황색" },
  { value: "#EF4444", label: "빨간색" },
  { value: "#8B5CF6", label: "보라색" },
  { value: "#06B6D4", label: "청록색" },
  { value: "#F97316", label: "주황색" },
  { value: "#84CC16", label: "연두색" },
];

export default function CategoryManagement2() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { toast } = useToast();

  // Mock data for demonstration
  const mockCategories: Category[] = [
    {
      id: 1,
      name: "학교",
      description: "학교 전반적인 정보 및 안내",
      icon: "🏠",
      backgroundColor: "#3B82F6",
      agentCount: 5,
      isActive: true,
      createdAt: "2025-01-01T00:00:00Z",
      order: 1
    },
    {
      id: 2,
      name: "교수",
      description: "교수진 정보 및 연구 관련",
      icon: "👨‍🏫",
      backgroundColor: "#10B981",
      agentCount: 12,
      isActive: true,
      createdAt: "2025-01-01T00:00:00Z",
      order: 2
    },
    {
      id: 3,
      name: "학생",
      description: "학생 생활 및 학사 정보",
      icon: "🎓",
      backgroundColor: "#F59E0B",
      agentCount: 8,
      isActive: true,
      createdAt: "2025-01-01T00:00:00Z",
      order: 3
    },
    {
      id: 4,
      name: "그룹",
      description: "학과별 또는 동아리 정보",
      icon: "👥",
      backgroundColor: "#8B5CF6",
      agentCount: 6,
      isActive: true,
      createdAt: "2025-01-01T00:00:00Z",
      order: 4
    },
    {
      id: 5,
      name: "기능형",
      description: "특수 기능 및 도구",
      icon: "⚙️",
      backgroundColor: "#EF4444",
      agentCount: 3,
      isActive: false,
      createdAt: "2025-01-01T00:00:00Z",
      order: 5
    }
  ];

  const { data: categories = mockCategories } = useQuery<Category[]>({
    queryKey: ["/api/admin/categories"],
    initialData: mockCategories
  });

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "",
      backgroundColor: "",
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: CategoryFormData) =>
      apiRequest("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({ title: "카테고리가 생성되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CategoryFormData> }) =>
      apiRequest(`/api/admin/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({ title: "카테고리 정보가 수정되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      setEditingCategory(null);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/admin/categories/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast({ title: "카테고리가 삭제되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.reset({
      name: category.name,
      description: category.description,
      icon: category.icon,
      backgroundColor: category.backgroundColor,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("정말로 이 카테고리를 삭제하시겠습니까?")) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || 
                         (selectedStatus === "active" && category.isActive) ||
                         (selectedStatus === "inactive" && !category.isActive);
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FolderTree className="h-5 w-5" />
            <span>카테고리 관리 2</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              placeholder="카테고리 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">모든 상태</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>카테고리 추가</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>새 카테고리 생성</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>카테고리 이름</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>설명</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="icon"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>아이콘</FormLabel>
                            <FormControl>
                              <select {...field} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                                <option value="">아이콘 선택</option>
                                {iconOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.value} {option.label}
                                  </option>
                                ))}
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="backgroundColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>배경색</FormLabel>
                            <FormControl>
                              <select {...field} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                                <option value="">색상 선택</option>
                                {colorOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        취소
                      </Button>
                      <Button type="submit" disabled={createCategoryMutation.isPending}>
                        생성
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Results Count */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              검색 결과: {filteredCategories.length}개의 카테고리
            </p>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredCategories.map((category) => (
              <Card key={category.id} className="relative">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl"
                        style={{ backgroundColor: category.backgroundColor }}
                      >
                        {category.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{category.name}</h3>
                        <Badge variant={category.isActive ? 'default' : 'secondary'}>
                          {category.isActive ? '활성' : '비활성'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(category)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(category.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">에이전트 수:</span>
                    <Badge variant="outline">{category.agentCount}개</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{categories.length}</div>
                <div className="text-sm text-gray-600">총 카테고리</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{categories.filter(c => c.isActive).length}</div>
                <div className="text-sm text-gray-600">활성 카테고리</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{categories.reduce((acc, c) => acc + c.agentCount, 0)}</div>
                <div className="text-sm text-gray-600">총 에이전트</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {(categories.reduce((acc, c) => acc + c.agentCount, 0) / categories.length).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">평균 에이전트/카테고리</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Edit Category Dialog */}
      {editingCategory && (
        <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>카테고리 수정</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>카테고리 이름</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>설명</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>아이콘</FormLabel>
                        <FormControl>
                          <select {...field} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="">아이콘 선택</option>
                            {iconOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.value} {option.label}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="backgroundColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>배경색</FormLabel>
                        <FormControl>
                          <select {...field} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="">색상 선택</option>
                            {colorOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setEditingCategory(null)}>
                    취소
                  </Button>
                  <Button type="submit" disabled={updateCategoryMutation.isPending}>
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