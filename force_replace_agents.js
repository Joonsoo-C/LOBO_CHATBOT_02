import xlsx from 'xlsx';
import fs from 'fs';

async function forceReplaceAgents() {
  try {
    console.log('🔄 강제 에이전트 데이터 교체 시작...');
    
    // 1. 기존 에이전트 파일 삭제
    const agentFile = 'data/memory-storage-agents.json';
    if (fs.existsSync(agentFile)) {
      fs.unlinkSync(agentFile);
      console.log('✅ 기존 에이전트 파일 삭제 완료');
    }
    
    // 2. 최신 Excel 파일 읽기
    const workbook = xlsx.readFile('attached_assets/AI 에이전트 0627_1751054472984.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);
    
    console.log(`📊 Excel에서 ${jsonData.length}개의 에이전트 데이터를 읽었습니다.`);
    
    // 3. 에이전트 데이터 변환 (Excel 구조에 맞게)
    const agents = jsonData.map((row, index) => {
      return {
        id: parseInt(row.id) || (69 + index),
        name: (row.name || `에이전트 ${index + 1}`).toString().trim(),
        description: (row.description || '').toString().trim(),
        category: (row['유형'] || row.category || '학생').toString().trim(), // '유형' 컬럼 우선
        icon: 'Bot',
        backgroundColor: 'bg-blue-500',
        upperCategory: (row.upperCategory || '공과대학').toString().trim(),
        lowerCategory: (row.lowerCategory || '컴퓨터공학과').toString().trim(),
        detailCategory: (row.detailCategory || row.lowerCategory || '컴퓨터공학과').toString().trim(),
        status: (row.status || 'active').toString().trim(),
        manager: (row.managerId || 'prof001').toString().trim(),
        personality: (row.personalityTraits || '').toString().trim(),
        llmModel: (row.llmModel || 'gpt-4o').toString().trim(),
        chatbotType: (row.chatbotType || 'doc-fallback-llm').toString().trim(),
        maxInputLength: parseInt(row.maxInputLength) || 2048,
        maxOutputLength: parseInt(row.maxResponseLength) || 1024,
        temperature: 0.7,
        visibility: (row.visibility || 'organization').toString().trim(),
        isActive: Boolean(row.isActive !== false),
        personaName: (row.personaName || '').toString().trim(),
        speakingStyle: (row.speakingStyle || '').toString().trim(),
        personalityTraits: (row.personalityTraits || '').toString().trim(),
        rolePrompt: (row.rolePrompt || '').toString().trim(),
        prohibitedWordResponse: (row.prohibitedWordResponse || '').toString().trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });
    
    console.log(`✅ ${agents.length}개의 에이전트 데이터 변환 완료`);
    
    // 4. 유형별 통계
    const categoryStats = {};
    agents.forEach(agent => {
      categoryStats[agent.category] = (categoryStats[agent.category] || 0) + 1;
    });
    
    console.log('\n📊 유형별 통계:');
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}개`);
    });
    
    // 5. 새 에이전트 파일 생성
    const agentsData = { 
      agents, 
      lastModified: new Date().toISOString(),
      source: 'AI 에이전트 0627_1751054472984.xlsx'
    };
    
    if (!fs.existsSync('data')) {
      fs.mkdirSync('data', { recursive: true });
    }
    
    fs.writeFileSync(agentFile, JSON.stringify(agentsData, null, 2));
    console.log(`💾 새 에이전트 데이터를 ${agentFile}에 저장했습니다.`);
    
    // 6. API를 통한 강제 업데이트
    try {
      const response = await fetch('http://localhost:5000/api/admin/agents/force-reload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agents })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ API를 통한 에이전트 데이터 강제 로드 성공:', result.message);
      } else {
        console.log('ℹ️ API 엔드포인트가 없으므로 서버 재시작이 필요합니다.');
      }
    } catch (error) {
      console.log('ℹ️ API 호출 실패. 서버 재시작이 필요합니다.');
    }
    
    console.log('\n🎉 에이전트 데이터 강제 교체 완료!');
    console.log('서버를 재시작하면 새 데이터가 확실히 적용됩니다.');
    
    return agents;
    
  } catch (error) {
    console.error('❌ 강제 교체 실패:', error);
    throw error;
  }
}

// 실행
forceReplaceAgents()
  .then(() => {
    console.log('✅ 강제 에이전트 교체 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 강제 교체 실패:', error);
    process.exit(1);
  });

export { forceReplaceAgents };