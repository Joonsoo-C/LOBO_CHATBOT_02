import fs from 'fs';

async function directReplaceAgents() {
  try {
    console.log('🔄 직접 에이전트 데이터 교체 시작...');
    
    // 저장된 최종 에이전트 데이터 로드
    if (!fs.existsSync('./final_agents.json')) {
      console.log('❌ final_agents.json 파일을 찾을 수 없습니다.');
      return;
    }

    const finalAgents = JSON.parse(fs.readFileSync('./final_agents.json', 'utf-8'));
    console.log(`📊 ${finalAgents.length}개의 새 에이전트 데이터를 로드했습니다.`);

    // 스토리지 직접 접근
    const { storage } = await import('./server/storage.ts');

    console.log('🗑️ 기존 에이전트 데이터 삭제 중...');
    await storage.clearAllAgents();
    console.log('✅ 기존 에이전트 데이터 삭제 완료');

    // 새 에이전트 데이터 추가
    let successCount = 0;
    let failCount = 0;

    for (const agentData of finalAgents) {
      try {
        // 필수 필드 확인 및 기본값 설정
        const agentToCreate = {
          name: agentData.name || `에이전트 ${agentData.id}`,
          description: agentData.description || '',
          category: agentData.category || '기능형',
          icon: agentData.icon || '🤖',
          backgroundColor: agentData.backgroundColor || '#3B82F6',
          isActive: agentData.isActive !== false,
          status: agentData.status || 'active',
          managerId: agentData.managerId || 'prof001',
          organizationId: agentData.organizationId || null,
          upperCategory: agentData.upperCategory || null,
          lowerCategory: agentData.lowerCategory || null,
          detailCategory: agentData.detailCategory || null,
          llmModel: agentData.llmModel || 'gpt-4o',
          chatbotType: agentData.chatbotType || 'doc-fallback-llm',
          maxInputLength: agentData.maxInputLength || 2048,
          maxResponseLength: agentData.maxResponseLength || 1024,
          visibility: agentData.visibility || 'private',
          rolePrompt: agentData.rolePrompt || '',
          persona: agentData.persona || '',
          systemPrompt: agentData.systemPrompt || '',
          speechStyle: agentData.speechStyle || '친근한',
          personality: agentData.personality || '도움이 되는',
          prohibitedWords: agentData.prohibitedWords || '',
          responseStyle: agentData.responseStyle || '상세한',
          uploadFormats: agentData.uploadFormats || "['PDF', 'DOCX', 'TXT']",
          uploadMethod: agentData.uploadMethod || 'dragdrop',
          maxFileCount: agentData.maxFileCount || 100,
          maxFileSizeMB: agentData.maxFileSizeMB || 100,
          isCustomIcon: agentData.isCustomIcon || false,
          agentManagerIds: Array.isArray(agentData.agentManagerIds) ? agentData.agentManagerIds : ['prof001'],
          documentManagerIds: Array.isArray(agentData.documentManagerIds) ? agentData.documentManagerIds : ['prof001'],
          agentEditorIds: Array.isArray(agentData.agentEditorIds) ? agentData.agentEditorIds : ['prof001'],
          allowedGroups: Array.isArray(agentData.allowedGroups) ? agentData.allowedGroups : [],
          creatorId: agentData.creatorId || 'master_admin',
          type: agentData.type || '기능형'
        };

        const agent = await storage.createAgent(agentToCreate);
        successCount++;
        console.log(`✓ 에이전트 생성 완료: ${agentToCreate.name} (${agentToCreate.type})`);
      } catch (error) {
        failCount++;
        console.log(`❌ 에이전트 생성 실패: ${agentData.name} - ${error.message}`);
      }
    }

    console.log(`🎉 에이전트 교체 완료: 성공 ${successCount}개, 실패 ${failCount}개`);
    
    // 시스템 통계 출력
    const allAgents = await storage.getAllAgents();
    const typeStats = {};
    allAgents.forEach(agent => {
      const type = agent.type || '기타';
      typeStats[type] = (typeStats[type] || 0) + 1;
    });

    console.log('\n📈 현재 시스템 에이전트 유형별 통계:');
    Object.entries(typeStats).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}개`);
    });

  } catch (error) {
    console.error('❌ 에이전트 교체 중 오류 발생:', error);
  }
}

// 스크립트가 직접 실행되는 경우
if (import.meta.url === `file://${process.argv[1]}`) {
  directReplaceAgents();
}

export default directReplaceAgents;