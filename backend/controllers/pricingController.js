const getPrice = async (req, res) => {
  try {
    const url = new URL("http://localhost:8000/price");
    for (const [key, value] of Object.entries(req.query)) {
      url.searchParams.set(key, String(value));
    }
    const r = await fetch(url);
    if (!r.ok) return res.status(502).json({ error: "Pricing engine error" });
    return res.json(await r.json());
  } catch (error) {
    console.error(error);
    return res.status(502).json({ error: "Pricing engine unreachable" });
  }
};

module.exports = { getPrice };
