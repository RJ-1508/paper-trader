const {
  openStructure,
  closeStructure,
  listStructures,
  getStructure,
  previewPayoff,
} = require("../services/optionStructureService");

const STATUS = {
  "Portfolio not found": 404,
  "Structure not found": 404,
  "No open structure found": 404,
  "No market price available for contract": 502,
  "Insufficient buying power": 400,
  "Not enough shares to cover call": 400,
  "Legs must share one underlying": 400,
  "At least one leg required": 400,
  "Structure has no legs": 400,
  "Invalid leg": 400,
};

const sendError = (res, error) => {
  const status = STATUS[error.message];
  if (status) return res.status(status).json({ error: error.message });
  console.error(error);
  return res.status(500).json({ error: "Something went wrong" });
};

const createStructure = async (req, res) => {
  try {
    const { legs, label } = req.body;
    const structure = await openStructure(req.userId, legs, label);
    return res.status(201).json(structure);
  } catch (error) {
    return sendError(res, error);
  }
};

const getStructures = async (req, res) => {
  try {
    const structures = await listStructures(req.userId);
    return res.status(200).json(structures);
  } catch (error) {
    return sendError(res, error);
  }
};

const getOneStructure = async (req, res) => {
  try {
    const structure = await getStructure(req.userId, Number(req.params.id));
    return res.status(200).json(structure);
  } catch (error) {
    return sendError(res, error);
  }
};

const postCloseStructure = async (req, res) => {
  try {
    const structure = await closeStructure(req.userId, Number(req.params.id));
    return res.status(200).json(structure);
  } catch (error) {
    return sendError(res, error);
  }
};

const postPayoff = async (req, res) => {
  try {
    const result = await previewPayoff(req.body.legs);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  createStructure,
  getStructures,
  getOneStructure,
  postCloseStructure,
  postPayoff,
};
