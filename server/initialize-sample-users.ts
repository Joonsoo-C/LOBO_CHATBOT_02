import { storage } from "./storage";
import { allSampleUsers, userCategoryStats } from "./sample-users";

export async function initializeSampleOrganizations() {
  try {
    // Check if organization categories already exist to avoid duplicates
    const existingOrganizations = await storage.getOrganizationCategories?.() || [];
    if (existingOrganizations.length >= 5) {
      return; // Silent skip to reduce initialization time
    }
    
    console.log("Initializing sample organization categories...");
    
    const sampleOrganizations = [
      { name: "로보대학교", upperCategory: "대학본부", lowerCategory: "총장실", detailCategory: "기획처", description: "로보대학교 본부" },
      { name: "공과대학", upperCategory: "로보대학교", lowerCategory: "공과대학", detailCategory: "컴퓨터공학과", description: "공과대학 컴퓨터공학과" },
      { name: "인문대학", upperCategory: "로보대학교", lowerCategory: "인문대학", detailCategory: "국어국문학과", description: "인문대학 국어국문학과" },
      { name: "경영대학", upperCategory: "로보대학교", lowerCategory: "경영대학", detailCategory: "경영학과", description: "경영대학 경영학과" },
      { name: "의과대학", upperCategory: "로보대학교", lowerCategory: "의과대학", detailCategory: "의학과", description: "의과대학 의학과" }
    ];

    for (const org of sampleOrganizations) {
      try {
        await storage.createOrganizationCategory(org);
        console.log(`✓ Created organization category: ${org.name}`);
      } catch (error) {
        console.log(`✗ Failed to create organization category: ${org.name}`, error);
      }
    }

    console.log("🎉 Sample organization categories are ready!");
  } catch (error) {
    console.error("Failed to initialize sample organization categories:", error);
  }
}

export async function initializeSampleUsers() {
  try {
    // Check if users already exist to avoid duplicates
    const existingUsers = await storage.getAllUsers?.() || [];
    if (existingUsers.length >= 50) {
      return; // Silent skip to reduce initialization time
    }
    
    console.log("Initializing sample users...");

    let successCount = 0;
    let errorCount = 0;

    // Create users in batches for better performance
    const batchSize = 20;
    const limitedUsers = allSampleUsers.slice(0, 50); // Reduce to 50 users for faster startup
    
    for (let i = 0; i < limitedUsers.length; i += batchSize) {
      const batch = limitedUsers.slice(i, i + batchSize);
      await Promise.all(batch.map(async userData => {
        try {
          await storage.createUser({
            ...userData,
            createdAt: new Date(),
            updatedAt: new Date(),
            profileImageUrl: null,
            firstName: userData.name?.split('')[1] || '',
            lastName: userData.name?.split('')[0] || userData.name,
            lastLoginAt: null,
            passwordHash: userData.password,
            groups: [],
            usingAgents: Math.random() > 0.5 ? [`${Math.floor(Math.random() * 5) + 1}`] : [],
            managedCategories: [],
            managedAgents: userData.role === "agent_admin" || userData.role === "qa_admin" || userData.role === "doc_admin" 
              ? [`에이전트${Math.floor(Math.random() * 5) + 1}`] : [],
            organizationAffiliations: [{
              upperCategory: userData.upperCategory || "대학본부",
              lowerCategory: userData.lowerCategory || "총장실",
              detailCategory: userData.detailCategory || "기획팀",
              position: userData.position || "직원",
              systemRole: userData.role === "user" ? "일반 사용자" : userData.role
            }],
            agentPermissions: userData.role === "agent_admin" || userData.role === "qa_admin" || userData.role === "doc_admin" 
              ? [{
                  agentName: `에이전트${Math.floor(Math.random() * 10) + 1}`,
                  permissions: [userData.role === "agent_admin" ? "에이전트 관리자" : userData.role === "qa_admin" ? "QA 관리자" : "문서 관리자"]
                }] : [],
            userMemo: null,
            permissions: {},
            lockedReason: null,
            deactivatedAt: null,
            loginFailCount: 0,
            lastLoginIP: null,
            authProvider: "email",
            termsAcceptedAt: new Date()
          });
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }));
      
      if (successCount % 20 === 0) {
        console.log(`✓ Created ${successCount} users so far...`);
      }
    }

    console.log(`\nSample users initialization completed:`);
    console.log(`✓ Successfully created: ${successCount} users`);
    console.log(`✗ Failed to create: ${errorCount} users`);
    
    console.log(`\n📊 User Distribution by Category:`);
    Object.entries(userCategoryStats.상위카테고리별).forEach(([category, count]) => {
      console.log(`   ${category}: ${count}명`);
    });
    
    console.log(`\n👥 User Types:`);
    Object.entries(userCategoryStats.사용자유형별).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}명`);
    });
    
    if (successCount > 0) {
      console.log("\n🎉 Sample users are ready! You can now manage the diverse university community.");
    }
    
  } catch (error) {
    console.error("Error initializing sample users:", error);
  }
}