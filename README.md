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
<img width="856" height="416" alt="image" src="https://github.com/user-attachments/assets/715936b0-a6fc-40a2-afb5-11e61ffe4b09" />



Me mostra só os produtos que estão em estoque.
<img width="1620" height="298" alt="image" src="https://github.com/user-attachments/assets/ab02a0c1-5163-4ac7-80e4-c830c0c41f2d" />



### Fluxo 2 — Detalhes de produto
Me conta mais sobre o produto 3.
<img width="798" height="316" alt="image" src="https://github.com/user-attachments/assets/3d5ce95d-9354-4b22-b2d3-7a00c13df385" />



E quanto custa o produto 2?
<img width="974" height="100" alt="image" src="https://github.com/user-attachments/assets/c09a924a-084d-4efd-aba2-276ff71b72e0" />




### Fluxo 3 — Criar pedido
Quero comprar 2 unidades do produto 1 e 1 unidade do produto 4.
<img width="1472" height="470" alt="image" src="https://github.com/user-attachments/assets/2062b234-e7bb-4a97-9c9b-21440e007607" />




Adiciona também 3 unidades do último que você me mostrou.
<img width="1602" height="262" alt="image" src="https://github.com/user-attachments/assets/1c0fb05e-9482-460a-ada6-1db6ca69701f" />




### Fluxo 4 — Consultar pedido
Qual o status do pedido 1042?
<img width="1018" height="390" alt="image" src="https://github.com/user-attachments/assets/b69c62f8-37a3-498d-92ca-9e32274994ba" />




E o que eu pedi nele mesmo?
<img width="794" height="252" alt="image" src="https://github.com/user-attachments/assets/4d721aa9-acff-4dbc-af7d-061db4d43ab0" />



### Fluxo 5 — Tratamento de erros
Me fala do produto 999.
<img width="1600" height="328" alt="image" src="https://github.com/user-attachments/assets/9b67b057-d054-43a5-860b-3763a2243c13" />



Quero comprar 1000 unidades do produto 1.
<img width="1600" height="328" alt="image" src="https://github.com/user-attachments/assets/7d5b7b58-e7cb-49cd-afd1-16c61748562d" />



Qual o status do pedido 9999?
<img width="1602" height="152" alt="image" src="https://github.com/user-attachments/assets/4d07364f-a1a5-4fe3-a4ed-ad43b87677c2" />




### Fluxo 6 — Limites do agente
Qual a previsão do tempo em SP?
<img width="1602" height="126" alt="image" src="https://github.com/user-attachments/assets/add76964-aa2d-473f-aefd-f6c98f1f682c" />



Cancela meu pedido 1042.
<img width="1592" height="130" alt="image" src="https://github.com/user-attachments/assets/459f090a-2a2d-4bc7-ab50-870a7b113500" />


