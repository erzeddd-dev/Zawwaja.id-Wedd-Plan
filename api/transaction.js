export default async function handler(req, res) {
  // Hanya menerima metode POST
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: "Method Not Allowed" }));
  }

  try {
    // Ambil data dari body (dikirim oleh aplikasi React frontend)
    const { orderId, amount, customerDetails } = req.body || {};

    if (!orderId || !amount) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: "orderId and amount are required." }));
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: "MIDTRANS_SERVER_KEY is not configured in the environment variables." }));
    }

    // Midtrans Endpoint (menggunakan URL Sandbox, ubah ke app.midtrans.com untuk produksi)
    const midtransApiUrl = "https://app.sandbox.midtrans.com/snap/v1/transactions";

    // Format Basic Auth base64(serverKey + ":")
    const authString = Buffer.from(serverKey + ":").toString("base64");

    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: customerDetails || {
        first_name: "Pengantin",
        email: "guest@zawwaja.id"
      },
      credit_card: {
        secure: true
      }
    };

    const response = await fetch(midtransApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Basic ${authString}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      res.statusCode = response.status;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        error: "Gagal membuat transaksi di Midtrans",
        details: data
      }));
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      token: data.token,
      redirect_url: data.redirect_url
    }));

  } catch (error) {
    console.error("API Transaction Error:", error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: "Internal Server Error" }));
  }
}
