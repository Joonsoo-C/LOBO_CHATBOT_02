
import React from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown } from "lucide-react";

interface OrganizationSelectorProps {
  selectedUniversity: string;
  selectedCollege: string;
  selectedDepartment: string;
  onUniversityChange: (value: string) => void;
  onCollegeChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onApply?: () => void;
  showApplyButton?: boolean;
  className?: string;
}

export default function OrganizationSelector({
  selectedUniversity,
  selectedCollege,
  selectedDepartment,
  onUniversityChange,
  onCollegeChange,
  onDepartmentChange,
  onApply,
  showApplyButton = false,
  className = ""
}: OrganizationSelectorProps) {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* 전체/대학원/대학교 */}
      <div className="relative">
        <Select value={selectedUniversity} onValueChange={onUniversityChange}>
          <SelectTrigger className="min-w-[140px] h-10 bg-gray-50 border border-gray-200 rounded-lg px-4 text-sm font-medium hover:bg-gray-100 transition-colors">
            <SelectValue placeholder="전체/대학원/대학교" />
            <ChevronDown className="w-4 h-4 ml-2 text-gray-500" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="graduate">대학원</SelectItem>
            <SelectItem value="undergraduate">대학교</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 단과대학 */}
      <div className="relative">
        <Select 
          value={selectedCollege} 
          onValueChange={onCollegeChange} 
          disabled={selectedUniversity === 'all'}
        >
          <SelectTrigger className="min-w-[120px] h-10 bg-gray-50 border border-gray-200 rounded-lg px-4 text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <SelectValue placeholder="단과대학" />
            <ChevronDown className="w-4 h-4 ml-2 text-gray-500" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="engineering">공과대학</SelectItem>
            <SelectItem value="business">경영대학</SelectItem>
            <SelectItem value="liberal">인문대학</SelectItem>
            <SelectItem value="science">자연과학대학</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 학과 */}
      <div className="relative">
        <Select 
          value={selectedDepartment} 
          onValueChange={onDepartmentChange} 
          disabled={selectedCollege === 'all' || selectedUniversity === 'all'}
        >
          <SelectTrigger className="min-w-[100px] h-10 bg-gray-50 border border-gray-200 rounded-lg px-4 text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <SelectValue placeholder="학과" />
            <ChevronDown className="w-4 h-4 ml-2 text-gray-500" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="computer">컴퓨터공학과</SelectItem>
            <SelectItem value="electrical">전자공학과</SelectItem>
            <SelectItem value="mechanical">기계공학과</SelectItem>
            <SelectItem value="business_admin">경영학과</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 적용 버튼 */}
      {showApplyButton && (
        <Button 
          onClick={onApply}
          className="h-10 px-6 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          적용
        </Button>
      )}
    </div>
  );
}
