export type ApiResult =
  | { ok: true; data: unknown }
  | { ok: false; status: number; error: unknown };

// Nunca lança exceção: devolve o erro como dado, para o LLM poder explicá-lo ao usuário.
async function request(path: string, init?: RequestInit): Promise<ApiResult> {
  const base = process.env.API_BASE_URL ?? "http://localhost:3333";
  try {
    const res = await fetch(`${base}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, status: res.status, error: data ?? { message: res.statusText } };
    return { ok: true, data };
  } catch {
    return { ok: false, status: 0, error: { message: "Sistema da loja indisponível no momento." } };
  }
}

export const storeApi = {
  listProducts: () => request("/products"),
  getProduct: (id: number) => request(`/products/${id}`),
  getOrder: (id: number) => request(`/orders/${id}`),
  createOrder: (items: { productId: number; quantity: number }[]) =>
    request("/orders", { method: "POST", body: JSON.stringify(items) }),
};
