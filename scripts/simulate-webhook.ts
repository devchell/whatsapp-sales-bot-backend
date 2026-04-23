const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

async function run() {
  const response = await fetch(`${baseUrl}/webhook/whatsapp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      phone: "5511999999999",
      text: process.argv[2] ?? "1"
    })
  });

  console.log(await response.text());
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
