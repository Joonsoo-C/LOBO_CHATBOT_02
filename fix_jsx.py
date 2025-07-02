#!/usr/bin/env python3
"""
MasterAdmin.tsx JSX 구조 복구 스크립트
"""

import re

def fix_jsx_structure():
    with open('client/src/pages/MasterAdmin.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # JSX 태그 균형 확인
    tags_to_check = ['TabsContent', 'Tabs', 'Dialog', 'DialogContent', 'Form']
    
    for tag in tags_to_check:
        open_count = len(re.findall(f'<{tag}', content))
        close_count = len(re.findall(f'</{tag}>', content))
        print(f"{tag}: Open={open_count}, Close={close_count}, Balance={open_count - close_count}")
    
    # 파일 끝 부분에서 중복 코드 제거
    lines = content.split('\n')
    
    # export default MasterAdmin; 이후의 모든 라인 제거
    export_line = -1
    for i, line in enumerate(lines):
        if 'export default MasterAdmin;' in line:
            export_line = i
            break
    
    if export_line != -1:
        clean_lines = lines[:export_line + 1]
        
        # 정리된 내용 저장
        with open('client/src/pages/MasterAdmin.tsx', 'w', encoding='utf-8') as f:
            f.write('\n'.join(clean_lines))
        
        print(f"파일 정리 완료: {len(lines)} -> {len(clean_lines)} 줄")
        return True
    
    return False

if __name__ == "__main__":
    fix_jsx_structure()