export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { fixture } = req.query;

  try {
    let url;
    if (fixture) {
      // Get specific fixture details (events, stats)
      url = `https://v3.football.api-sports.io/fixtures?id=${fixture}`;
    } else {
      // Get today's live/scheduled FIFA World Cup matches (league id 1)
      const today = new Date().toISOString().split("T")[0];
      url = `https://v3.football.api-sports.io/fixtures?league=1&season=2026&date=${today}`;
    }

    const response = await fetch(url, {
      headers: {
        "x-apisports-key": "0ec296f7d320f9302d73b6c386ed6362",
      },
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch live scores" });
  }
}
