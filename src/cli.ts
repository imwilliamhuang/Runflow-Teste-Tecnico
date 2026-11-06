import "dotenv/config";
import readline from "node:readline/promises";
import { Agent } from "./agent/agent";

const gray = (s: string) => `\x1b[90m${s}\x1b[0m`;

async function main() {
  const agent = new Agent(undefined, undefined, (name, args, result) => {
    const ok = (result as { ok?: boolean })?.ok;
    console.log(gray(`  🔧 ${name}(${JSON.stringify(args)}) → ${ok ? "ok" : "erro"}`));
  });

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log('Chat da loja. Digite sua mensagem ("sair" para encerrar).\n');

  while (true) {
    const input = (await rl.question("Você: ")).trim();
    if (!input) continue;
    if (input.toLowerCase() === "sair") break;
    try {
      console.log(`Agente: ${await agent.chat(input)}\n`);
    } catch (err) {
      console.error("Erro ao falar com o LLM:", err instanceof Error ? err.message : err);
    }
  }
  rl.close();
}

main();
