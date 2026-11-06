import OpenAI from "openai";
import { SYSTEM_PROMPT } from "./systemPrompt";
import { executeTool, toolDefinitions } from "./tools";

type Message = OpenAI.Chat.ChatCompletionMessageParam;

const MAX_STEPS = 6; // trava de segurança contra loops infinitos de tool calling

export type ToolCallHook = (name: string, args: unknown, result: unknown) => void;

export function createLlmClient() {
  if (!process.env.LLM_API_KEY) {
    throw new Error("LLM_API_KEY não definida. Copie .env.example para .env e preencha.");
  }
  return new OpenAI({ apiKey: process.env.LLM_API_KEY, baseURL: process.env.LLM_BASE_URL });
}

export class Agent {
  // Memória da sessão: a lista de mensagens inteira (system + user + assistant + tool).
  private history: Message[] = [{ role: "system", content: SYSTEM_PROMPT }];

  constructor(
    private client: OpenAI = createLlmClient(),
    private model: string = process.env.LLM_MODEL ?? "openai/gpt-oss-120b",
    private onToolCall?: ToolCallHook,
  ) {}

  async chat(userInput: string): Promise<string> {
    this.history.push({ role: "user", content: userInput });

    for (let step = 0; step < MAX_STEPS; step++) {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: this.history,
        tools: toolDefinitions,
        temperature: 0.2,
      });

      const message = response.choices[0].message;
      // Guardo só os campos que a API aceita de volta (alguns provedores rejeitam campos extras).
      this.history.push({ role: "assistant", content: message.content, tool_calls: message.tool_calls });

      // Sem tool calls = resposta final em texto.
      const toolCalls = message.tool_calls ?? [];
      if (toolCalls.length === 0) return message.content ?? "";

      // Executa cada tool pedida e devolve o resultado ao modelo, que continua o raciocínio.
      for (const call of toolCalls) {
        if (call.type !== "function") continue;
        let args: Record<string, unknown> = {};
        let result: unknown;
        try {
          args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
          result = await executeTool(call.function.name, args);
        } catch {
          result = { ok: false, error: { error: "BAD_TOOL_ARGUMENTS", message: "Argumentos inválidos (JSON malformado)." } };
        }
        this.onToolCall?.(call.function.name, args, result);
        this.history.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
      }
    }

    return "Desculpe, não consegui concluir sua solicitação agora. Pode tentar reformular?";
  }
}
