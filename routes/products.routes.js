const express = require("express");
const { readDB, writeDB } = require("../utils/db");

const router = express.Router();

router.post("/", (req, res) => {
  const db = readDB();

  const newProduct = {
    id: Date.now(),
    ...req.body
  };

  db.products.push(newProduct);
  writeDB(db);

  res.status(201).json(newProduct);
});

module.exports = router;
