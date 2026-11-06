import type OpenAI from "openai";
import { storeApi } from "./apiClient";

// ---------- Definições (o que o LLM "enxerga") ----------
export const toolDefinitions: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "list_products",
      description:
        "Lista os produtos da loja com id, nome, preço (R$) e estoque. Use quando o cliente quiser ver o catálogo, " +
        "ou saber o que está disponível. Use only_in_stock=true se ele pedir só o que tem em estoque.",
      parameters: {
        type: "object",
        properties: {
          only_in_stock: {
            type: "boolean",
            description: "Se true, retorna apenas produtos com estoque maior que zero. Padrão: false.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_product",
      description: "Busca os detalhes de UM produto pelo id numérico (nome, preço, estoque).",
      parameters: {
        type: "object",
        properties: {
          product_id: { type: "integer", description: "Id numérico do produto, ex: 3." },
        },
        required: ["product_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_order_status",
      description:
        "Consulta um pedido pelo id numérico: status, itens e total. Também serve para saber o que há em um pedido.",
      parameters: {
        type: "object",
        properties: {
          order_id: { type: "integer", description: "Id numérico do pedido, ex: 1042." },
        },
        required: ["order_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_order",
      description:
        "Cria um pedido NOVO com um ou mais itens. Só chame quando o cliente já tiver dito claramente " +
        "quais produtos (id) e quantidades quer. Não altera pedidos existentes.",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            description: "Lista de itens do pedido.",
            items: {
              type: "object",
              properties: {
                product_id: { type: "integer", description: "Id numérico do produto." },
                quantity: { type: "integer", description: "Quantidade (inteiro maior que zero)." },
              },
              required: ["product_id", "quantity"],
            },
          },
        },
        required: ["items"],
      },
    },
  },
];

// ---------- Execução ----------
// Modelos às vezes mandam "3" (string) em vez de 3: aceitamos e convertemos.
function toPositiveInt(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isInteger(n) && n > 0 ? n : null;
}

const argError = (message: string) => ({ ok: false, error: { error: "INVALID_ARGUMENTS", message } });

export async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "list_products": {
      const result = await storeApi.listProducts();
      if (result.ok && args.only_in_stock === true) {
        return { ok: true, data: (result.data as { stock: number }[]).filter((p) => p.stock > 0) };
      }
      return result;
    }
    case "get_product": {
      const id = toPositiveInt(args.product_id);
      return id ? storeApi.getProduct(id) : argError("product_id deve ser um inteiro positivo.");
    }
    case "get_order_status": {
      const id = toPositiveInt(args.order_id);
      return id ? storeApi.getOrder(id) : argError("order_id deve ser um inteiro positivo.");
    }
    case "create_order": {
      const rawItems = args.items;
      if (!Array.isArray(rawItems) || rawItems.length === 0) return argError("items deve ser uma lista não vazia.");
      const items: { productId: number; quantity: number }[] = [];
      for (const raw of rawItems) {
        const productId = toPositiveInt((raw as Record<string, unknown>)?.product_id);
        const quantity = toPositiveInt((raw as Record<string, unknown>)?.quantity);
        if (!productId || !quantity) return argError("Cada item precisa de product_id e quantity inteiros positivos.");
        items.push({ productId, quantity });
      }
      return storeApi.createOrder(items);
    }
    default:
      return { ok: false, error: { error: "UNKNOWN_TOOL", message: `Ferramenta "${name}" não existe.` } };
  }
}
