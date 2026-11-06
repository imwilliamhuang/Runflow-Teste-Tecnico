export type Product = { id: number; name: string; price: number; stock: number };

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered";

export type OrderItem = {
  productId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type Order = {
  id: number;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  createdAt: string;
};

// Preços em reais. Produto 5 está sem estoque de propósito (testa o filtro "em estoque").
export const products: Product[] = [
  { id: 1, name: "Teclado Mecânico RGB", price: 349.9, stock: 25 },
  { id: 2, name: "Mouse Gamer 16000 DPI", price: 189.9, stock: 40 },
  { id: 3, name: "Headset Surround 7.1", price: 279.0, stock: 12 },
  { id: 4, name: "Monitor 27\" 144Hz", price: 1499.0, stock: 6 },
  { id: 5, name: "Webcam Full HD", price: 229.9, stock: 0 },
  { id: 6, name: "Hub USB-C 7 em 1", price: 129.9, stock: 60 },
  { id: 7, name: "Cadeira Ergonômica", price: 1299.0, stock: 3 },
  { id: 8, name: "Mousepad XL", price: 59.9, stock: 100 },
];

export const orders = new Map<number, Order>();

export const round2 = (n: number) => Math.round(n * 100) / 100;

function seedOrder(id: number, status: OrderStatus, lines: [number, number][], createdAt: string) {
  const items: OrderItem[] = lines.map(([productId, quantity]) => {
    const p = products.find((x) => x.id === productId)!;
    return { productId, name: p.name, quantity, unitPrice: p.price, subtotal: round2(p.price * quantity) };
  });
  orders.set(id, { id, status, items, total: round2(items.reduce((s, i) => s + i.subtotal, 0)), createdAt });
}

seedOrder(1040, "delivered", [[1, 1]], "2026-10-20T10:00:00Z");
seedOrder(1041, "shipped", [[4, 1], [6, 2]], "2026-10-30T14:30:00Z");
seedOrder(1042, "processing", [[2, 1], [8, 2]], "2026-11-03T09:15:00Z");

let nextOrderId = 1043;
export const takeOrderId = () => nextOrderId++;
