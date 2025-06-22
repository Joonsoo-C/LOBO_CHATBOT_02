import React from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard,
  Users, 
  Bot, 
  MessageSquare, 
  Zap, 
  FolderTree, 
  FileText, 
  Settings,
  X
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  {
    title: "대시보드 2",
    path: "/dashboard2",
    icon: LayoutDashboard,
  },
  {
    title: "사용자 관리 2",
    path: "/user-management2",
    icon: Users,
  },
  {
    title: "에이전트 관리 2",
    path: "/agent-management2",
    icon: Bot,
  },
  {
    title: "질문/응답 로그 2",
    path: "/qa-logs2",
    icon: MessageSquare,
  },
  {
    title: "토큰 관리 2",
    path: "/token-management2",
    icon: Zap,
  },
  {
    title: "카테고리 관리 2",
    path: "/category-management2",
    icon: FolderTree,
  },
  {
    title: "문서 관리 2",
    path: "/document-management2",
    icon: FileText,
  },
  {
    title: "시스템 설정 2",
    path: "/system-settings2",
    icon: Settings,
  },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`
          fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-800 shadow-lg z-50 
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:w-64
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            사이드바 메뉴
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Menu Items */}
        <nav className="p-4">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`
                      w-full justify-start text-left h-12
                      ${isActive 
                        ? "bg-blue-600 text-white hover:bg-blue-700" 
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }
                    `}
                    onClick={() => {
                      // Close sidebar on mobile after navigation
                      if (window.innerWidth < 1024) {
                        onClose();
                      }
                    }}
                  >
                    <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            독립형 페이지 시스템
          </div>
        </div>
      </div>
    </>
  );
}