async function test() {
  const res = await fetch("http://localhost:3000/api/mysql/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      table: "pricing_plans",
      selectFields: "*"
    })
  });
  const data = await res.json();
  console.log(data.length);
}
test();
