async function test() {
  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
  const res = await fetch("http://localhost:3000/api/mysql/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      table: "courses",
      deleteFlag: true,
      filters: [{ type: "eq", column: "id", value: "" }]
    })
  });
  console.log(await res.json());
}
test();
