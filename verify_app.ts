
import { scanRouter, RouterConfig } from "./server/services/routerManager";
import { getSupabaseClient } from "./server/services/supabaseClient";
import * as dotenv from "dotenv";

dotenv.config();

async function verifyConnectivity() {
  console.log("--- NetGuard-Pro Connectivity Verification ---");

  // 1. Verify Supabase Connection
  console.log("\n[1/3] Verifying Supabase Connection...");
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from("devices").select("count").limit(1);
    
    if (error) {
      console.error("❌ Supabase connection failed:", error.message);
    } else {
      console.log("✅ Supabase connection successful!");
    }
  } catch (err) {
    console.error("❌ Error connecting to Supabase:", err instanceof Error ? err.message : String(err));
  }

  // 2. Verify Huawei Router Logic (Simulation/Mock check)
  console.log("\n[2/3] Verifying Huawei Router Integration Logic...");
  const huaweiConfig: RouterConfig = {
    type: "huawei",
    ip: "192.168.0.1",
    username: "admin",
    password: "test-password"
  };
  
  console.log(`Testing logic for Huawei at ${huaweiConfig.ip}...`);
  // We can't actually connect to the real router from here, but we can verify the scraper initialization
  try {
    const { HuaweiScraper } = await import("./server/services/huaweiScraper");
    const scraper = new HuaweiScraper({
      routerIp: huaweiConfig.ip,
      username: huaweiConfig.username,
      password: huaweiConfig.password
    });
    console.log("✅ Huawei scraper initialized successfully!");
  } catch (err) {
    console.error("❌ Huawei scraper initialization failed:", err instanceof Error ? err.message : String(err));
  }

  // 3. Verify Rain Router Logic (Simulation/Mock check)
  console.log("\n[3/3] Verifying Rain Router Integration Logic...");
  const rainConfig: RouterConfig = {
    type: "rain101",
    ip: "192.168.8.1",
    username: "admin",
    password: "test-password"
  };
  
  console.log(`Testing logic for Rain at ${rainConfig.ip}...`);
  try {
    const { RAINScraper } = await import("./server/services/rainScraper");
    const scraper = new RAINScraper({
      routerIp: rainConfig.ip,
      username: rainConfig.username,
      password: rainConfig.password
    });
    console.log("✅ Rain scraper initialized successfully!");
  } catch (err) {
    console.error("❌ Rain scraper initialization failed:", err instanceof Error ? err.message : String(err));
  }

  console.log("\n--- Verification Complete ---");
}

verifyConnectivity().catch(console.error);
