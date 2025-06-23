
import { storage } from "./storage";
import { sampleAgents } from "./sample-agents";

export async function initializeSampleAgents() {
  try {
    console.log("Initializing 50 sample agents...");
    
    // Check if agents already exist to avoid duplicates
    const existingAgents = await storage.getAllAgents();
    if (existingAgents.length >= 50) {
      console.log("Sample agents already exist, skipping initialization");
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const agentData of sampleAgents) {
      try {
        await storage.createAgent({
          ...agentData,
          isActive: true,
          organizationId: null,
          isCustomIcon: false,
        });
        successCount++;
        console.log(`✓ Created agent: ${agentData.name}`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Failed to create agent: ${agentData.name}`, error);
      }
    }

    console.log(`\nSample agents initialization completed:`);
    console.log(`✓ Successfully created: ${successCount} agents`);
    console.log(`✗ Failed to create: ${errorCount} agents`);
    
    if (successCount > 0) {
      console.log("\n🎉 Sample agents are ready! You can now explore the diverse collection of AI assistants.");
    }
    
  } catch (error) {
    console.error("Error initializing sample agents:", error);
  }
}
