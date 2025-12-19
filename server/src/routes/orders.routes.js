import express from "express";
// import store from "../data/store.js";
import { store, updateStore } from "../data/store.js"; // Import store and updateStore

const router = express.Router();

// Endpoint to create order
router.post("/api/orders", (req, res) => {
  try {
    const {
      customerName,
      item,
      quantity,
      price,
      description,
      idempotencyKey,
      status = "pending",
    } = req.body;

    if (!customerName || !item) {
      return res.status(400).json({ message: "customerName and item are required" });
    }
    const existingOrder = store.orders.find(
      (order) => idempotencyKey && order?.idempotencyKey === idempotencyKey
    );
    if (existingOrder) {
      return res.status(409).json({ message: "Duplicate order detected", code: "ORDER_DUPLICATE" });
    }
    const order = {
      id: store?.orders[store?.orders?.length - 1]?.id + 1 || 1,
      customerName,
      item,
      quantity,
      price,
      description,
      status,
      idempotencyKey,
    };
    const newStore = store;
    newStore.orders.push(order);
    updateStore(newStore); // Save the updated store to the file
    res.status(201).json(order);
  } catch (error) {
    return res.status(500).json({
      error: "PostError",
      message: "Failed to create order due to server error",
    });
  }
});

router.put("/api/orders", (req, res) => {
  const {
    id,
    customerName,
    item,
    quantity,
    price,
    description,
    idempotencyKey,
    status = "pending",
  } = req.body;

  // Check if the order with the same idempotencyKey already exists
  // const existingOrder = store.orders.find((order) => order?.idempotencyKey === idempotencyKey);
  const existingOrder = store.orders.find((order) => order?.id === id);
  if (existingOrder) {
    store.orders = store.orders.map((order) => {
      if (order?.id === id) {
        return {
          ...order,
          customerName,
          item,
          quantity,
          price,
          description,
          status,
          idempotencyKey,
        };
      }
      return order;
    });
    return res.status(201).json({ message: "order updted successfully", order: order });
  }

  const order = {
    id: store?.orders[store?.orders?.length] + 1 || 1,
    customerName,
    item,
    quantity,
    price,
    description,
    status,
    idempotencyKey,
  };
  store.orders.push(order);
  updateStore(store); // Save the updated store to the file
  // res.status(201).json(order);

  return res.status(400).json({ message: "order not found" });
});

// Endpoint to get all orders
router.get("/api/orders", (req, res) => {
  res.status(200).json(store.orders);
});

// Endpoint to save push subscription
router.post("/api/push-subscription", (req, res) => {
  const subscription = req.body;
  // Store subscription in a way that it can be used for push notifications
  // (In a real app, store it in a database, but for this example, it's in memory)
  store.pushSubscription = subscription;
  updateStore(store); // Save the updated store to the file
  res.status(200).json({ message: "Subscription saved" });
});

export default router;
