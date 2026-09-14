const fetch = require("node-fetch");
async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/mysql/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "pricing_plans",
        selectFields: "*"
      })
    });
    const data = await res.json();
    console.log("Plans length in MySQL:", data.length);
  } catch (e) {
    console.error(e);
  }
}
test();
