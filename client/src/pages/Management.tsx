import { useState, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft, LogOut, ChevronDown, User, Edit, Settings, Bell, FileText, Files, BarChart3 } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import ChatInterface from "@/components/ChatInterface";
import type { Agent } from "@/types/agent";

export default function Management() {
  const { agentId } = useParams<{ agentId: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const chatInterfaceRef = useRef<any>(null);


  const { data: agent, isLoading } = useQuery<Agent>({
    queryKey: [`/api/agents/${agentId}`],
    enabled: !!agentId,
  });

  // Check if user is the manager of this agent or master admin
  const isAuthorized = agent && user && (agent.managerId === user.id || user.userType === 'admin' || user.id === 'master_admin');

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        window.location.href = '/auth';
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handlePersonaChange = () => {
    if (chatInterfaceRef.current?.setShowPersonaModal) {
      chatInterfaceRef.current.setShowPersonaModal(true);
      chatInterfaceRef.current.addSystemMessage("페르소나 편집 창을 열었습니다. 닉네임, 말투 스타일, 지식 분야, 성격 특성, 금칙어 반응 방식을 수정할 수 있습니다.");
    }
  };

  const handleIconChange = () => {
    if (chatInterfaceRef.current?.setShowIconModal) {
      chatInterfaceRef.current.setShowIconModal(true);
      chatInterfaceRef.current.addSystemMessage("아이콘 변경 창을 열었습니다. 에이전트의 아이콘과 배경색을 변경할 수 있습니다.");
    }
  };

  const handleChatbotSettings = () => {
    if (chatInterfaceRef.current?.setShowSettingsModal) {
      chatInterfaceRef.current.setShowSettingsModal(true);
      chatInterfaceRef.current.addSystemMessage("챗봇 설정 창을 열었습니다. LLM 모델과 챗봇 유형을 변경할 수 있습니다.");
    }
  };

  const handleNotifications = () => {
    if (chatInterfaceRef.current?.setNotificationState) {
      chatInterfaceRef.current.setNotificationState("waiting_input");
      chatInterfaceRef.current.addSystemMessage("알림 내용을 입력하세요. 모든 사용자에게 전송됩니다.");
    }
  };

  const handleDocumentUpload = () => {
    if (chatInterfaceRef.current?.setShowFileModal) {
      chatInterfaceRef.current.setShowFileModal(true);
      chatInterfaceRef.current.addSystemMessage("문서 업로드 창을 열었습니다. TXT, DOC, DOCX, PPT, PPTX 형식의 문서를 업로드하여 에이전트의 지식베이스를 확장할 수 있습니다.");
    }
  };

  const handleDocumentManagement = () => {
    if (chatInterfaceRef.current?.setShowFileListModal) {
      chatInterfaceRef.current.setShowFileListModal(true);
      chatInterfaceRef.current.addSystemMessage("문서 관리 창을 열었습니다. 업로드된 문서를 확인하고 삭제할 수 있습니다.");
    }
  };

  const handlePerformanceAnalysis = async () => {
    if (chatInterfaceRef.current?.addSystemMessage) {
      chatInterfaceRef.current.addSystemMessage("에이전트 성과 분석을 실행합니다...");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--neu-bg)' }}>
        {/* Minimal Flat UI Global Navigation Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 md:static md:border-none">
          <div className="px-4 py-3 md:px-6 md:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link href="/management">
                  <button className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </Link>
                <h1 className="text-base font-medium text-gray-900 dark:text-gray-100 korean-text">로딩 중...</h1>
              </div>
              
              <div className="flex items-center space-x-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">기능 선택</span>
                      <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      로그아웃
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center min-h-[50vh] pt-20 md:pt-0">
          <div className="text-center korean-text">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--neu-bg)' }}>
        {/* Minimal Flat UI Global Navigation Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 md:static md:border-none">
          <div className="px-4 py-3 md:px-6 md:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link href="/management">
                  <button className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </Link>
                <h1 className="text-base font-medium text-gray-900 dark:text-gray-100 korean-text">에이전트를 찾을 수 없음</h1>
              </div>
              
              <div className="flex items-center space-x-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">기능 선택</span>
                      <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      로그아웃
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center min-h-[50vh] pt-20 md:pt-0">
          <div className="text-center korean-text">
            <p className="text-muted-foreground">에이전트를 찾을 수 없습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--neu-bg)' }}>
        {/* Minimal Flat UI Global Navigation Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 md:static md:border-none">
          <div className="px-4 py-3 md:px-6 md:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link href="/management">
                  <button className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </Link>
                <h1 className="text-base font-medium text-gray-900 dark:text-gray-100 korean-text">권한 없음</h1>
              </div>
              
              <div className="flex items-center space-x-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">기능 선택</span>
                      <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      로그아웃
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center min-h-[50vh] pt-20 md:pt-0">
          <div className="text-center korean-text">
            <p className="text-muted-foreground">이 에이전트를 관리할 권한이 없습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--neu-bg)' }}>
      {/* Minimal Flat UI Global Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 md:static md:border-none">
        <div className="px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/management">
                <button className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </Link>
              <div className="flex items-center space-x-3">
                {/* Agent Icon */}
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium text-white"
                     style={{ backgroundColor: agent.backgroundColor || '#6366f1' }}>
                  {agent.icon ? (
                    agent.isCustomIcon ? (
                      <img 
                        src={`/api/agents/${agent.id}/icon`} 
                        alt={agent.name}
                        className="w-full h-full rounded-lg object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const nextElement = target.nextElementSibling as HTMLElement;
                          if (nextElement) {
                            nextElement.style.display = 'block';
                          }
                        }}
                      />
                    ) : (
                      <i className={`${agent.icon} text-white`}></i>
                    )
                  ) : (
                    agent.name.charAt(0)
                  )}
                  {agent.isCustomIcon && (
                    <span style={{ display: 'none' }}>
                      {agent.name.charAt(0)}
                    </span>
                  )}
                </div>
                <h1 className="text-base font-medium text-gray-900 dark:text-gray-100 korean-text truncate max-w-[200px]">
                  {agent.name} (관리)
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">기능 선택</span>
                    <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handlePersonaChange}>
                    <User className="w-4 h-4 mr-2" />
                    페르소나 변경
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleIconChange}>
                    <Edit className="w-4 h-4 mr-2" />
                    아이콘 변경
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleChatbotSettings}>
                    <Settings className="w-4 h-4 mr-2" />
                    챗봇 설정
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleNotifications}>
                    <Bell className="w-4 h-4 mr-2" />
                    알림보내기
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDocumentUpload}>
                    <FileText className="w-4 h-4 mr-2" />
                    문서 업로드
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDocumentManagement}>
                    <Files className="w-4 h-4 mr-2" />
                    문서 관리
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePerformanceAnalysis}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    성과 분석
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Interface without header */}
      <div className="pt-20 md:pt-0">
        <ChatInterface 
          ref={chatInterfaceRef}
          agent={agent} 
          isManagementMode={true} 
        />
      </div>


    </div>
  );
}