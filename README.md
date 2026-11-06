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
<img width="798" height="316" alt="image" src="https://github.com/user-attachments/assets/0362a152-a1bf-466c-92bb-0ce561c08e0d" />


### Fluxo 2 — Detalhes de produto
Me conta mais sobre o produto 3.
<img width="1620" height="298" alt="image" src="https://github.com/user-attachments/assets/6e6d8aa9-daa0-4f9d-8bfe-c19112e55739" />


E quanto custa o produto 2?
<img width="974" height="100" alt="image" src="https://github.com/user-attachments/assets/2a989d46-3a42-43fd-833b-70f0410fb82e" />


### Fluxo 3 — Criar pedido
Quero comprar 2 unidades do produto 1 e 1 unidade do produto 4.
<img width="1620" height="154" alt="image" src="https://github.com/user-attachments/assets/320e3658-3063-47ae-85ef-9c447fb9e924" />


Adiciona também 3 unidades do último que você me mostrou.
<img width="794" height="252" alt="image" src="https://github.com/user-attachments/assets/78fe8188-7a17-4d27-b559-4d155ef97241" />


### Fluxo 4 — Consultar pedido
Qual o status do pedido 1042?
<img width="1018" height="390" alt="image" src="https://github.com/user-attachments/assets/db2aca60-5ed8-4816-8043-53d02ee79ad6" />


E o que eu pedi nele mesmo?
<img width="1602" height="262" alt="image" src="https://github.com/user-attachments/assets/74a89080-4797-46c4-bb05-4b21724f2024" />


### Fluxo 5 — Tratamento de erros
Me fala do produto 999.
<img width="1600" height="328" alt="image" src="https://github.com/user-attachments/assets/f1fac65e-c0cc-4937-a1fa-8ad6f3d99013" />


Quero comprar 1000 unidades do produto 1.
<img width="1472" height="470" alt="image" src="https://github.com/user-attachments/assets/24f56d1f-8e9a-4201-a3d2-5638fed551ed" />


Qual o status do pedido 9999?
<img width="1602" height="152" alt="image" src="https://github.com/user-attachments/assets/84e02fe9-98c5-42fa-a8f5-08210fdbfcf0" />



### Fluxo 6 — Limites do agente
Qual a previsão do tempo em SP?
<img width="1602" height="126" alt="image" src="https://github.com/user-attachments/assets/05ff2b7d-d81d-432c-b69a-edde1a2a2d93" />


Cancela meu pedido 1042.
<img width="1592" height="130" alt="image" src="https://github.com/user-attachments/assets/ae68d5f5-b26a-47ed-92bf-12371b665274" />

