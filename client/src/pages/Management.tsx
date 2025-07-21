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
import { useLanguage } from "../contexts/LanguageContext";

export default function Management() {
  const { agentId } = useParams<{ agentId: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
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
        <div className="flex justify-center items-center min-h-screen">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--neu-bg)' }}>
        <div className="text-center korean-text">
          <p className="text-muted-foreground">에이전트를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--neu-bg)' }}>
        <div className="text-center korean-text">
          <p className="text-muted-foreground">이 에이전트를 관리할 권한이 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <ChatInterface 
      ref={chatInterfaceRef}
      agent={agent} 
      isManagementMode={true} 
    />
  );
}