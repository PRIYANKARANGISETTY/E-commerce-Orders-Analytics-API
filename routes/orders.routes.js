router.post("/", (req, res) => {
  const { productId, quantity } = req.body;
  const db = readDB();

  const product = db.products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ message: "Product not found" });

  if (product.stock === 0 || quantity > product.stock)
    return res.status(400).json({ message: "Insufficient stock" });

  const order = {
    id: Date.now(),
    productId,
    quantity,
    totalAmount: product.price * quantity,
    status: "placed",
    createdAt: new Date().toISOString().split("T")[0]
  };

  product.stock -= quantity;
  db.orders.push(order);
  writeDB(db);

  res.status(201).json(order);
});
router.get("/", (req, res) => {
  res.json(readDB().orders);
});
router.delete("/:orderId", (req, res) => {
  const db = readDB();
  const order = db.orders.find(o => o.id == req.params.orderId);

  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.status === "cancelled")
    return res.status(400).json({ message: "Already cancelled" });

  const today = new Date().toISOString().split("T")[0];
  if (order.createdAt !== today)
    return res.status(400).json({ message: "Cannot cancel today" });

  order.status = "cancelled";
  const product = db.products.find(p => p.id === order.productId);
  product.stock += order.quantity;

  writeDB(db);
  res.json(order);
});
router.patch("/change-status/:orderId", (req, res) => {
  const db = readDB();
  const order = db.orders.find(o => o.id == req.params.orderId);
  const { status } = req.body;

  if (!order) return res.status(404).json({ message: "Order not found" });
  if (["cancelled", "delivered"].includes(order.status))
    return res.status(400).json({ message: "Status change not allowed" });

  const flow = ["placed", "shipped", "delivered"];
  if (flow.indexOf(status) !== flow.indexOf(order.status) + 1)
    return res.status(400).json({ message: "Invalid flow" });

  order.status = status;
  writeDB(db);
  res.json(order);
});

