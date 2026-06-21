const getPrice = async (req, res) => {
  try {
    const r = await fetch("http://localhost:8000/price");
    res.json(await r.json());
  } catch (error) {
    res.status(502).json({ error: "engine unreachable" });
  }
};

module.exports = { getPrice };
