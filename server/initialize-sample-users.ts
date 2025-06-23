
import { storage } from "./storage";
import { allSampleUsers, userCategoryStats } from "./sample-users";

export async function initializeSampleUsers() {
  try {
    console.log("Initializing 400 sample users...");
    
    // Check if users already exist to avoid duplicates
    const existingUsers = await storage.getAllUsers?.() || [];
    console.log(`Current user count: ${existingUsers.length}`);
    if (existingUsers.length >= 300) {
      console.log("Sample users already exist, updating roles for senior faculty...");
      // Update existing users' roles based on position
      for (const user of existingUsers) {
        if (user.position === "교수" || user.position === "학과장" || user.position === "연구소장") {
          if (user.role === "user") {
            user.role = "operation_admin";
            await storage.updateUser(user.id, { role: user.role });
          }
        } else if (user.position === "부교수" || user.position === "조교수") {
          if (user.role === "user") {
            user.role = "agent_admin";
            await storage.updateUser(user.id, { role: user.role });
          }
        }
      }
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const userData of allSampleUsers) {
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
          usingAgents: Math.random() > 0.5 ? [`${Math.floor(Math.random() * 50) + 1}`] : [],
          managedCategories: [],
          managedAgents: userData.role === "agent_admin" || userData.role === "qa_admin" || userData.role === "doc_admin" 
            ? [`에이전트${Math.floor(Math.random() * 10) + 1}`] : [],
          permissions: {},
          lockedReason: null,
          deactivatedAt: null,
          loginFailCount: 0,
          lastLoginIP: null,
          authProvider: "email",
          termsAcceptedAt: new Date()
        });
        successCount++;
        if (successCount % 50 === 0) {
          console.log(`✓ Created ${successCount} users so far...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`✗ Failed to create user: ${userData.username}`, error);
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
