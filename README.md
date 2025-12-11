# Stix Agent Frontend

Um chatbot inteligente para responder perguntas sobre a Stix usando RAG (Retrieval-Augmented Generation) com OpenAI e Supabase.

## 🚀 Tecnologias

- **Next.js 16** - Framework React
- **OpenAI** - GPT-4 para geração de respostas
- **Supabase** - Banco de dados vetorial para busca semântica
- **LangChain** - Embeddings e processamento de texto
- **TypeScript** - Tipagem estática

## 📋 Pré-requisitos

1. **Node.js** 20+ instalado
2. **Chave de API da OpenAI** - [Obter aqui](https://platform.openai.com/api-keys)
3. **Projeto Supabase** configurado com:
   - Tabela `documents` com colunas: `id`, `content`, `embedding`, `metadata`
   - Função RPC `match_documents` para busca de similaridade vetorial
   - Chave de API do Supabase

## ⚙️ Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```bash
cp env.example .env.local
```

Edite `.env.local` e adicione suas chaves:

```env
OPENAI_API_KEY=sk-...
SUPABASE_KEY=eyJ...
```

### 3. Executar o servidor de desenvolvimento

```bash
npm run dev
```

O aplicativo estará disponível em [http://localhost:3001](http://localhost:3001)

## 🏗️ Estrutura do Projeto

```
src/
├── adapters/           # Integrações externas
│   ├── openia.adapter.ts      # OpenAI (embeddings + chat)
│   └── supabase.adapter.ts    # Supabase (busca vetorial)
├── use-cases/          # Lógica de negócio
│   └── question.use-case.ts   # Orquestração de perguntas
├── app/
│   ├── api/
│   │   └── question/
│   │       └── route.ts       # Endpoint POST /api/question
│   └── page.tsx               # Interface do chat
├── components/         # Componentes React
├── services/           # Serviços do frontend
│   └── chatApi.ts             # Cliente HTTP
└── types/              # Definições TypeScript
    └── chat.ts                # Tipos do chat
```

## 🔄 Fluxo de Funcionamento

1. **Usuário faz uma pergunta** através da interface
2. **Frontend** envia POST para `/api/question`
3. **QuestionUseCase** busca documentos similares no Supabase
4. **OpenAI** gera resposta baseada no contexto encontrado
5. **Resposta** é exibida com fontes de referência

## 🧪 Testando

### Testar o endpoint diretamente

```bash
curl -X POST http://localhost:3001/api/question \
  -H "Content-Type: application/json" \
  -d '{"question": "O que é a Stix?"}'
```

### Resposta esperada

```json
{
  "answer": "A Stix é uma empresa de pontos de fidelidade...",
  "sources": [
    {
      "id": "...",
      "content": "...",
      "metadata": {},
      "similarity": 0.85
    }
  ]
}
```

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento (porta 3001)
- `npm run build` - Cria build de produção
- `npm start` - Inicia servidor de produção
- `npm run lint` - Executa linter

## 🔧 Configuração do Supabase

### Criar a função RPC `match_documents`

Execute este SQL no seu projeto Supabase:

```sql
create or replace function match_documents (
  query_embedding vector(1536),
  match_count int default 5,
  filter jsonb default '{}'
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;
```

## 🎨 Personalização

### Alterar modelo do OpenAI

Edite `src/adapters/openia.adapter.ts`:

```typescript
model: "gpt-4o-mini", // ou "gpt-4", "gpt-3.5-turbo"
```

### Ajustar número de documentos retornados

Edite `src/use-cases/question.use-case.ts`:

```typescript
matchCount: 5, // altere para o número desejado
```

## 📄 Licença

Este projeto é privado e pertence à Stix.

## 🤝 Contribuindo

1. Crie uma branch para sua feature
2. Faça commit das mudanças
3. Abra um Pull Request

---

Desenvolvido com ❤️ para a Stix
