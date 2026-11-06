import express from "express";
import { orders, products, round2, takeOrderId, type Order, type OrderItem } from "./data";

const errorBody = (error: string, message: string) => ({ error, message });

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/products", (_req, res) => {
    res.json(products);
  });

  app.get("/products/:id", (req, res) => {
    const id = Number(req.params.id);
    const product = products.find((p) => p.id === id);
    if (!product) {
      return res.status(404).json(errorBody("PRODUCT_NOT_FOUND", `Produto ${req.params.id} não encontrado.`));
    }
    res.json(product);
  });

  app.get("/orders/:id", (req, res) => {
    const order = orders.get(Number(req.params.id));
    if (!order) {
      return res.status(404).json(errorBody("ORDER_NOT_FOUND", `Pedido ${req.params.id} não encontrado.`));
    }
    res.json(order);
  });

  app.post("/orders", (req, res) => {
    const body: unknown = req.body;

    if (!Array.isArray(body) || body.length === 0) {
      return res.status(400).json(errorBody("INVALID_BODY", "Envie um array não vazio: [{ productId, quantity }]."));
    }

    // 1) valida formato e agrega quantidades do mesmo produto
    const wanted = new Map<number, number>();
    for (const raw of body) {
      const { productId, quantity } = (raw ?? {}) as { productId?: unknown; quantity?: unknown };
      if (!Number.isInteger(productId) || !Number.isInteger(quantity) || (quantity as number) <= 0) {
        return res
          .status(400)
          .json(errorBody("INVALID_ITEM", "Cada item precisa de productId e quantity inteiros, com quantity > 0."));
      }
      wanted.set(productId as number, (wanted.get(productId as number) ?? 0) + (quantity as number));
    }

    // 2) valida existência e estoque de TODOS antes de alterar qualquer coisa (tudo ou nada)
    const items: OrderItem[] = [];
    for (const [productId, quantity] of wanted) {
      const product = products.find((p) => p.id === productId);
      if (!product) {
        return res.status(404).json(errorBody("PRODUCT_NOT_FOUND", `Produto ${productId} não encontrado.`));
      }
      if (product.stock < quantity) {
        return res.status(409).json({
          ...errorBody(
            "INSUFFICIENT_STOCK",
            `Estoque insuficiente para "${product.name}" (id ${product.id}): pedido ${quantity}, disponível ${product.stock}.`,
          ),
          productId: product.id,
          requested: quantity,
          available: product.stock,
        });
      }
      items.push({
        productId,
        name: product.name,
        quantity,
        unitPrice: product.price,
        subtotal: round2(product.price * quantity),
      });
    }

    // 3) baixa estoque e cria o pedido
    for (const item of items) {
      products.find((p) => p.id === item.productId)!.stock -= item.quantity;
    }
    const order: Order = {
      id: takeOrderId(),
      status: "pending",
      items,
      total: round2(items.reduce((s, i) => s + i.subtotal, 0)),
      createdAt: new Date().toISOString(),
    };
    orders.set(order.id, order);
    res.status(201).json(order);
  });

  return app;
}
