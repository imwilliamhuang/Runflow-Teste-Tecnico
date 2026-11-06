# Agente de atendimento para loja online

Um agente de IA que conversa com o cliente e consegue:
- listar produtos e ver detalhes de um produto;
- consultar o status de um pedido;
- criar um pedido novo.

Projeto feito para o teste técnico da Runflow AI.

## Como rodar

Precisa do Node.js 20 ou mais novo.

```bash
npm install
cp .env.example .env
```

Abra o `.env` e coloque sua chave em `LLM_API_KEY` (usei a chave gratuita do Groq, criada em console.groq.com).

Depois, em dois terminais:

```bash
npm run api    # terminal 1: sobe a API da loja (dados em memória)
npm run chat   # terminal 2: abre o chat com o agente
```

Para sair do chat, digite `sair`.

## Como funciona

O projeto tem 3 partes:

1. **API da loja** (`src/api`): servidor Express com os 4 endpoints pedidos. Os dados ficam em memória (8 produtos e 3 pedidos de exemplo, incluindo o pedido 1042).
2. **Agente** (`src/agent`): conversa com o LLM. Quando o modelo precisa de dados, ele pede uma ferramenta (tool), o código chama a API e devolve o resultado para o modelo continuar a resposta.
3. **Chat no terminal** (`src/cli.ts`): onde eu digito as mensagens.

Fluxo de uma mensagem: usuário escreve → modelo decide se precisa de uma tool → o código chama a API → modelo recebe o resultado e responde.

## Decisões técnicas

- **LLM: gpt-oss-120b no Groq.** Tem plano gratuito sem cartão, é rápido e suporta tools. Uso o SDK da OpenAI porque o Groq tem um endereço compatível com ele. Se precisar trocar de provedor ou de modelo, basta mudar o `.env`, sem alterar o código.
- **Por que não os modelos sugeridos no enunciado?** Testei os dois e nenhum funcionou: o Gemini 2.5 Flash retornava erro 404, e o Llama 3.3 70B do Groq também (modelo não existe). Pela documentação que consultei, o Google aposentou a família Gemini 2.5 em outubro de 2026, e o Groq desligou o `llama-3.3-70b-versatile` em 16/08/2026, recomendando o `gpt-oss-120b` no lugar. Por isso usei esse. Como a lista de modelos muda com frequência, deixei o nome do modelo configurável no `.env`.
- **Sem framework: escrevi o loop do agente à mão.** Queria entender como um agente funciona por dentro. O loop é: enviar a conversa ao modelo, executar as tools que ele pedir, devolver os resultados e repetir até vir uma resposta em texto. Coloquei um limite de 6 repetições para não travar.
- **Memória:** a conversa inteira fica guardada em uma lista na memória. Por isso o agente entende "o último que você mostrou".
- **4 tools, uma para cada endpoint:** `list_products`, `get_product`, `get_order_status` e `create_order`. Cada uma tem uma descrição clara para o modelo saber quando usar.
- **Tratamento de erros:** se a API responder erro (produto ou pedido inexistente, estoque insuficiente), o erro vai para o modelo, que explica ao cliente. A própria API confere o estoque antes de criar o pedido, então um pedido inválido nunca é criado.
- **System prompt:** diz que o agente só fala de produtos e pedidos, nunca inventa dados, e que não consegue cancelar nem alterar pedidos (para ele não fingir que fez).
- **"Adicionar" itens a um pedido:** como a API não edita pedidos, o agente cria um pedido novo só com esses itens e avisa o cliente.
- **TypeScript:** era novo para mim. Usei IA como apoio e li o código para entender cada parte.
- **Deixei de fora de propósito:** banco de dados, login, Docker e interface web, para focar no fluxo principal.

## O que eu melhoraria com mais tempo

- Escrever testes automáticos.
- Limitar o tamanho da conversa guardada, para conversas muito longas.
- Pedir confirmação antes de criar um pedido.
- Garantir que cada cliente só veja os próprios pedidos.
- Tentar de novo automaticamente quando o LLM ou a API falharem.
- Criar uma interface web.

## Conversas testadas

### Fluxo 1 — Listar produtos
Quais produtos vocês têm disponíveis?
<img width="856" height="416" alt="image" src="https://github.com/user-attachments/assets/6a534c3a-0811-43f9-9baa-b7cea441b427" />


Me mostra só os produtos que estão em estoque.
![alt text](image-1.png)

### Fluxo 2 — Detalhes de produto
Me conta mais sobre o produto 3.
![alt text](image-2.png)

E quanto custa o produto 2?
![alt text](image-3.png)

### Fluxo 3 — Criar pedido
Quero comprar 2 unidades do produto 1 e 1 unidade do produto 4.
![alt text](image-4.png)

Adiciona também 3 unidades do último que você me mostrou.
![alt text](image-5.png)

### Fluxo 4 — Consultar pedido
Qual o status do pedido 1042?
![alt text](image-6.png)

E o que eu pedi nele mesmo?
![alt text](image-7.png)

### Fluxo 5 — Tratamento de erros
Me fala do produto 999.
![alt text](image-8.png)

Quero comprar 1000 unidades do produto 1.
![alt text](image-9.png)

Qual o status do pedido 9999?
![alt text](image-10.png)


### Fluxo 6 — Limites do agente
Qual a previsão do tempo em SP?
![alt text](image-11.png)

Cancela meu pedido 1042.
![alt text](image-12.png)
