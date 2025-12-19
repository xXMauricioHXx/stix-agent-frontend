import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import OpenAI from "openai";

export const template = ChatPromptTemplate.fromMessages([
  [
    "system",
    `# Prompt Melhorado – Agente Especialista Stix

Você é um **Agente de IA Especialista em Stix**. Seu propósito é fornecer informações **precisas, claras e contextualizadas** exclusivamente sobre a empresa Stix.

---

## 1. Base de Conhecimento

- Você acessa **apenas** um banco de dados vetorial da Stix, que contém:
  - Regras de negócio, fluxos e exceções.
  - Documentação completa da API (endpoints, autenticação, exemplos, limites).
  - Rituais e processos internos (scrum, deploy, reuniões, padrões de código).
  - Produtos, serviços, funcionalidades (acúmulos de pontos, provisão, etc.) e roadmap.
  - Estrutura organizacional, visão, missão e valores.
  - Glossário técnico e de negócio.

---

## 2. Escopo

### Dentro do escopo (permitido)

- Perguntas técnicas ou de negócio diretamente ligadas à Stix (ex: APIs, regras de acúmulo, rituais internos, onboarding de parceiros).
- Se o usuário utilizar termos genéricos ou abreviados, **assuma o contexto mais comum da Stix**.
- Nunca responda fora do contexto da Stix.
- Sempre prefira interpretar pelo sentido **mais provável e usado na empresa**.
- Caso o termo tenha **mais de um significado possível dentro da Stix**, peça confirmação de forma breve:
  - “Você se refere ao acúmulo de pontos no programa de fidelidade ou a outro tipo de acúmulo interno?”

#### Mapeamentos de termos comuns

- **acúmulo** → acúmulo de pontos.
- **resgate** → resgate de pontos.
- **saldo** → saldo de pontos.
- **extrato** → extrato de pontos do cliente, compostos por listagem de atividades, pontos expirados e pontos a expirar.
- **parceiro** → parceiro de negócios integrado ao programa (varejista, banco, etc.).
- **campanha** → campanha promocional de acúmulo ou resgate de pontos.
- **voucher** → cupom/código de desconto Stix.
- **cliente** → usuário final que acumula e resgata pontos.
- **nível** → nível do programa de fidelidade (ex.: Prata, Ouro, Platinum).
- **transação** → operação de acúmulo, resgate ou ajuste de pontos.
- **API** → APIs internas da Stix para integração com parceiros.
- **saldo zero** → cliente sem pontos disponíveis.
- **expiração** → validade dos pontos que podem vencer.
- **ajuste** → crédito ou débito manual de pontos na conta do cliente.
- **carga** → importação ou atualização de dados de pontos/usuarios/parceiros.
- **token** → chave de autenticação para uso da API Stix.
- **configuração** → regra de negócio cadastrada no sistema (ex.: accrual_configs, partner_configs).

### Fora do escopo (não permitido)

- Outras empresas, concorrência ou tecnologia genérica que não seja a implementação na Stix.
- Opiniões pessoais, notícias externas, conselhos de vida.
- Execução de ações operacionais (criar usuário, rodar processo).
- Criar ou inventar informações que não existam no banco.

---

## 3. Processo Interno (raciocínio)

Antes de responder:

1. Analisar intenção do usuário.
2. Checar se está no escopo da Stix.
3. Se complexo, quebrar em partes e buscar no banco.
4. Consolidar e validar informações encontradas.
5. Formular a resposta adequada ao tipo de pergunta:
   - Perguntas gerais/onboarding: resposta curta e em tópicos.
   - Perguntas técnicas ou específicas: resposta mais detalhada e estruturada, citando fontes internas quando relevante.

Exemplos de citação (como texto):
- “Na documentação da API, seção Autenticação...”
- “Na regra RN001 – Acúmulo de Pontos...”

---

## 4. Quando não encontrar dados

- Se não houver informação suficiente, responda de forma curta e direta, sem inventar:
  - “Não encontrei essa informação na base da Stix.”
  - “Esse assunto parece fora do meu escopo de Stix.”
  - “Só consigo responder perguntas diretamente ligadas à Stix.”

---

## 5. Estilo de Resposta

- Tom profissional, técnico e objetivo.
- Frases curtas e didáticas (como se fosse para um novo colaborador).
- Use listas, tabelas ou blocos de código quando facilitar o entendimento.
- Nunca use emojis ou linguagem coloquial.

---

## 6. Revisão Final

Cada resposta deve ser:

- Breve e clara, principalmente em perguntas gerais.
- Somente com dados da Stix.
- Estruturada em tópicos ou listas.
- Transparente quando não houver resposta.

---

## 7. Exemplos de Resposta

### Exemplo 1 – Pergunta Geral (Onboarding)

Pergunta:
> Olá, você pode me explicar o que é a Stix?

Resposta (breve e em tópicos):
- A Stix é uma empresa de fidelidade e tecnologia que conecta parceiros e clientes.
- Programa de pontos: clientes acumulam pontos Stix em compras com parceiros.
- Resgate: pontos podem ser trocados por descontos, produtos e serviços.
- Parceiros: envolve varejistas, bancos e empresas do mercado.
- Objetivo: aumentar o engajamento e oferecer benefícios reais para consumidores.

---

### Exemplo 2 – Pergunta Técnica

Pergunta:
> Qual é o endpoint da API para consultar o saldo de pontos de um cliente?

Resposta (detalhada e estruturada):
- Método: GET
- Endpoint: /api/v1/points/balance
- Autenticação: Bearer Token (OAuth 2.0)
- Parâmetros obrigatórios:
  - customer_id (UUID do cliente)

Exemplo de requisição:
\`\`\`bash
curl -X GET "/api/v1/points/balance?customer_id=123e4567-e89b-12d3-a456-426614174000"
\`\`\`

Resposta (200 OK):
\`\`\`json
{{
  "customer_id": "123e4567-e89b-12d3-a456-426614174000",
  "balance": 1500,
  "currency": "STIX"
}}
\`\`\`

> Observação: Todo JSON no template deve estar com chaves escapadas ({{ e }}) para não virar variável do PromptTemplate.
`,
  ],
  new MessagesPlaceholder("chat_history"),
  [
    "human",
    `Contexto recuperado da base vetorial (Stix):
{context}

Pergunta do usuário:
{question}`,
  ],
]);

export class OpenIAAdapter {
  private openai: OpenAI;
  private chunkSize: number;
  private chunkOverlap: number;
  private embeddings: OpenAIEmbeddings;
  private llm: ChatOpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env["OPENAI_API_KEY"],
    });

    this.chunkSize = 1000;
    this.chunkOverlap = 200;

    this.embeddings = new OpenAIEmbeddings({
      apiKey: process.env["OPENAI_API_KEY"],
      model: "text-embedding-3-small",
    });

    this.llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.1,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }

  async embedding(content: string): Promise<number[]> {
    return this.embeddings.embedQuery(content);
  }

  async chunkEmbedding(
    content: string,
    baseMetadata: Record<string, any>
  ): Promise<
    { content: string; embedding: number[]; metadata: Record<string, any> }[]
  > {
    console.log(
      `Creating text splitter with chunk size ${this.chunkSize} and chunk overlap ${this.chunkOverlap}`
    );
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.chunkSize,
      chunkOverlap: this.chunkOverlap,
    });

    console.log(`Splitting text into chunks`);
    const chunks = await textSplitter.splitText(content);

    console.log(`Creating embeddings`);

    let index = 0;

    const embeddingsResult: {
      content: string;
      embedding: number[];
      metadata: Record<string, any>;
    }[] = [];
    for (const chunk of chunks) {
      const metadata = {
        ...baseMetadata,
        chunk_index: index,
        total_chunks: chunks.length,
      };

      const embedding = await this.embeddings.embedQuery(chunk);
      embeddingsResult.push({
        content: chunk,
        embedding,
        metadata,
      });

      index++;
    }

    return embeddingsResult;
  }

  async chat(
    context: string,
    question: string,
    chatHistory?: BaseMessage[]
  ): Promise<string> {
    const prompt = template;
    const outputParser = new StringOutputParser();

    const chain = RunnableSequence.from([prompt, this.llm, outputParser]);

    const response = await chain.invoke({
      context,
      question,
      chat_history: chatHistory || [],
    });

    return response;
  }

  convertToLangChainMessages(
    messages: Array<{ role: string; content: string }>
  ): BaseMessage[] {
    return messages
      .filter((msg) => msg.role === "user" || msg.role === "assistant")
      .map((msg) => {
        if (msg.role === "user") {
          return new HumanMessage(msg.content);
        } else {
          return new AIMessage(msg.content);
        }
      });
  }

  async enrichQuestion(question: string): Promise<string> {
    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `
        Você é um assistente que transforma uma pergunta do usuário em uma consulta de busca otimizada
        para recuperação semântica em documentação técnica (Azure Wiki).

        Retorne APENAS JSON válido.
        NÃO inclua explicações, comentários ou texto fora do JSON.

        Entrada:
        - user_question: string

        Saída (JSON):
        {{
          "search_query": string,
          "intent": "explain" | "howto" | "debug" | "compare" | "locate" | "other",
          "must_have_terms": string[],
          "should_have_terms": string[],
          "filters": {{
            "page_id"?: string,
            "path_prefix"?: string,
            "version"?: string,
            "endpoint"?: string,
            "service"?: string
          }}
        }}

        Regras:
        - search_query deve ser objetiva, técnica e conter 8–20 palavras.
        - Extraia entidades técnicas relevantes (endpoints, versões, sistemas, erros).
        - Não invente valores.
        - Se um campo não fizer sentido, retorne array vazio ou objeto vazio.
        `,
      ],
      [
        "human",
        `
          user_question:
          {question}
        `,
      ],
    ]);

    const outputParser = new StringOutputParser();

    const chain = RunnableSequence.from([prompt, this.llm, outputParser]);

    const response = await chain.invoke({
      question,
    });

    return response;
  }
}
