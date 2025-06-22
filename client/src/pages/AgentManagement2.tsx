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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Bot, Plus, Edit, Trash2, Users } from "lucide-react";

interface Agent {
  id: number;
  name: string;
  description: string;
  category: string;
  icon: string;
  backgroundColor: string;
  isActive: boolean;
  createdAt: string;
  messageCount: number;
  userCount: number;
  documentCount: number;
  lastUsedAt?: string;
  managerName?: string;
  organizationName?: string;
}

interface Manager {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

interface Organization {
  id: number;
  name: string;
  type: string;
}

const agentSchema = z.object({
  name: z.string().min(1, "에이전트 이름은 필수입니다"),
  description: z.string().min(1, "설명은 필수입니다"),
  category: z.string().min(1, "카테고리를 선택해주세요"),
  personality: z.string().optional(),
  managerId: z.string().min(1, "관리자를 선택해주세요"),
  organizationId: z.string().min(1, "소속 조직을 선택해주세요"),
});

type AgentFormData = z.infer<typeof agentSchema>;

export default function AgentManagement2() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedManager, setSelectedManager] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const { toast } = useToast();

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["/api/admin/agents"],
  });

  const { data: managers = [] } = useQuery<Manager[]>({
    queryKey: ["/api/admin/managers"],
  });

  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/admin/organizations"],
  });

  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      personality: "",
      managerId: "",
      organizationId: "",
    },
  });

  const createAgentMutation = useMutation({
    mutationFn: (data: AgentFormData) =>
      apiRequest("/api/admin/agents", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({ title: "에이전트가 생성되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agents"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
  });

  const updateAgentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AgentFormData> }) =>
      apiRequest(`/api/admin/agents/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({ title: "에이전트 정보가 수정되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agents"] });
      setEditingAgent(null);
    },
  });

  const deleteAgentMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/admin/agents/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast({ title: "에이전트가 삭제되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agents"] });
    },
  });

  const onSubmit = (data: AgentFormData) => {
    if (editingAgent) {
      updateAgentMutation.mutate({ id: editingAgent.id, data });
    } else {
      createAgentMutation.mutate(data);
    }
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    form.reset({
      name: agent.name,
      description: agent.description,
      category: agent.category,
      personality: "",
      managerId: "",
      organizationId: "",
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("정말로 이 에이전트를 삭제하시겠습니까?")) {
      deleteAgentMutation.mutate(id);
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || agent.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || 
                         (selectedStatus === "active" && agent.isActive) ||
                         (selectedStatus === "inactive" && !agent.isActive);
    const matchesManager = selectedManager === "all" || agent.managerName?.includes(selectedManager);
    
    return matchesSearch && matchesCategory && matchesStatus && matchesManager;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <span>에이전트 관리 2</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              placeholder="에이전트 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">전체</option>
              <option value="학교">학교</option>
              <option value="교수">교수</option>
              <option value="학생">학생</option>
              <option value="그룹">그룹</option>
              <option value="기능형">기능형</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">모든 상태</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
            <Input
              placeholder="관리자 검색..."
              value={selectedManager}
              onChange={(e) => setSelectedManager(e.target.value)}
            />
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>에이전트 추가</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>새 에이전트 생성</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>에이전트 이름</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>카테고리</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="카테고리 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="학교">학교</SelectItem>
                                  <SelectItem value="교수">교수</SelectItem>
                                  <SelectItem value="학생">학생</SelectItem>
                                  <SelectItem value="그룹">그룹</SelectItem>
                                  <SelectItem value="기능형">기능형</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
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
                        name="managerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>관리자</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="관리자 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  {managers.map((manager) => (
                                    <SelectItem key={manager.id} value={manager.id}>
                                      {manager.firstName} {manager.lastName} ({manager.username})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="organizationId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>소속 조직</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="조직 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  {organizations.map((org) => (
                                    <SelectItem key={org.id} value={org.id.toString()}>
                                      {org.name} ({org.type})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="personality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>성격 설정 (선택사항)</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="에이전트의 성격이나 응답 스타일을 설명해주세요..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        취소
                      </Button>
                      <Button type="submit" disabled={createAgentMutation.isPending}>
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
              검색 결과: {filteredAgents.length}개의 에이전트
            </p>
          </div>

          {/* Agents Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-2 text-left">에이전트명</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">카테고리</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">상태</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">관리자</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">조직</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">문서</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">사용자</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">최근 사용</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2">
                      <div className="flex items-center space-x-2">
                        <div 
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm`}
                          style={{ backgroundColor: agent.backgroundColor }}
                        >
                          {agent.icon}
                        </div>
                        <div>
                          <div className="font-medium">{agent.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-40">
                            {agent.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <Badge variant="outline">{agent.category}</Badge>
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                        {agent.isActive ? '활성' : '비활성'}
                      </Badge>
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      {agent.managerName || '-'}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      {agent.organizationName || '-'}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      {agent.documentCount || 0}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      {agent.userCount || 0}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      {agent.lastUsedAt ? new Date(agent.lastUsedAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(agent)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(agent.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}