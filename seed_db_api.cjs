const fs = require('fs');
async function test() {
  const content = fs.readFileSync('src/lib/pricingService.ts', 'utf8');
  const match = content.match(/export const DEFAULT_PRICING_PLANS[^=]*= (\[[\s\S]*?\]);\n\nconst/);
  if (!match) {
    console.log("No match");
    return;
  }
  let plans;
  eval(`plans = ${match[1]}`);
  
  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
  const res = await fetch("http://localhost:3000/api/mysql/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      table: "pricing_plans",
      upsertData: plans
    })
  });
  console.log(await res.json());
}
test();
