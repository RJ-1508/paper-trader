const { getOptionChain } = require("../providers/alpacaOptions");

const getChain = async (req, res) => {
  try {
    const { underlying } = req.params;
    const snapshots = await getOptionChain(underlying, req.query);
    return res.status(200).json(snapshots);
  } catch (error) {
    return res.status(502).json({ error: "Options provider unreachable" });
  }
};
module.exports = { getChain };
