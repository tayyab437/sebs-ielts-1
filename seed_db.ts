import { pricingService } from "./src/lib/pricingService";
import { DEFAULT_PRICING_PLANS } from "./src/lib/pricingService";

async function run() {
  await pricingService.savePlans(DEFAULT_PRICING_PLANS);
  console.log("Seeded plans successfully");
}
run();
