import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft, Settings, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";

import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "../contexts/LanguageContext";
import { AccountSettingsModal } from "@/components/AccountSettingsModal";
import ChatInterface from "@/components/ChatInterface";
import type { Agent } from "@/types/agent";

export default function Chat() {
  const { agentId } = useParams<{ agentId: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [showAccountModal, setShowAccountModal] = useState(false);

  const { data: agent, isLoading } = useQuery<Agent>({
    queryKey: [`/api/agents/${agentId}`],
    enabled: !!agentId,
  });

  // Regular chat should never use management mode, even for managers
  const isManagementMode = false;

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

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--neu-bg)' }}>
        {/* Global Navigation Header */}
        <header className="neu-card mx-4 mt-4 md:static md:shadow-none md:mb-0">
          <div className="px-4 py-3 md:px-6 md:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link href="/">
                  <Button variant="ghost" size="sm" className="p-2">
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                </Link>
                <h1 className="text-lg font-semibold korean-text">로딩 중...</h1>
              </div>
              
              <div className="flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-2">
                      <Settings className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowAccountModal(true)}>
                      <User className="w-4 h-4 mr-2" />
                      계정 설정
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <LanguageSelector />
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      {t("common.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center korean-text">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--neu-bg)' }}>
        {/* Global Navigation Header */}
        <header className="neu-card mx-4 mt-4 md:static md:shadow-none md:mb-0">
          <div className="px-4 py-3 md:px-6 md:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link href="/">
                  <Button variant="ghost" size="sm" className="p-2">
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                </Link>
                <h1 className="text-lg font-semibold korean-text">에이전트를 찾을 수 없음</h1>
              </div>
              
              <div className="flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-2">
                      <Settings className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowAccountModal(true)}>
                      <User className="w-4 h-4 mr-2" />
                      계정 설정
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <LanguageSelector />
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      {t("common.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center korean-text">
            <p className="text-muted-foreground">에이전트를 찾을 수 없습니다.</p>
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
              <Link href="/">
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
                  {agent.name}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setShowAccountModal(true)}>
                    <User className="w-4 h-4 mr-2" />
                    {t('home.accountSettings')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LanguageSelector />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    {t("common.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Interface without header */}
      <div className="pt-20 md:pt-0">
        <ChatInterface agent={agent} isManagementMode={isManagementMode || false} />
      </div>

      {/* Account Settings Modal */}
      <AccountSettingsModal 
        isOpen={showAccountModal} 
        onClose={() => setShowAccountModal(false)} 
      />
    </div>
  );
}
