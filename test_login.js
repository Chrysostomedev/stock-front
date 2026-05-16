async function test() {
  const res = await fetch("https://back-spservice-production.up.railway.app/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "+2250701020304", password: "123" })
  });
  console.log(res.status, await res.text());
}
test();
