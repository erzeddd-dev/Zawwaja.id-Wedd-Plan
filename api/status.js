export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: "Method Not Allowed" }));
  }

  try {
    const { orderId } = req.query || {};

    if (!orderId) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: "orderId is required." }));
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: "MIDTRANS_SERVER_KEY is missing." }));
    }

    const authString = Buffer.from(serverKey + ":").toString("base64");
    const midtransApiUrl = `https://api.sandbox.midtrans.com/v2/${orderId}/status`;

    const response = await fetch(midtransApiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Basic ${authString}`
      }
    });

    const data = await response.json();

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(data));
  } catch (error) {
    console.error("API Status Error:", error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: "Internal Server Error" }));
  }
}
