# Gyaanसूत्र (Gyaansutra)

A fully local, private Retrieval-Augmented Generation (RAG) system running entirely within your web browser. This application keeps all document parsing, text chunking, embedding generation, vector database search, and large language model (LLM) inference strictly on the client side. No data leaves your machine.

## 🚀 Architecture & Workflow

Gyaanसूत्र brings a complete backend RAG pipeline into the browser using WebAssembly and WebGPU. 

### Data Ingestion Workflow
1. **Document Parsing**: Files (`.pdf`, `.md`, `.txt`, `.html`, `.csv`, `.json`) are processed natively in the browser. PDFs are parsed locally via `@llamaindex/liteparse-wasm` without external remote servers.
2. **Intelligent Chunking**: The text is split into semantic chunks (with special Code-Aware handling to prevent code blocks from being shredded inappropriately). This runs in an off-main-thread Web Worker to keep the UI smooth.
3. **Embedding Generation**: Chunks are embedded locally using `Transformers.js` powered by WebGPU (or WASM multi-threading fallback).
4. **Vector Storage**: The embeddings and metadata are stored in `PGlite` (a WASM build of PostgreSQL) using the `pgvector` extension. The database persists locally via `IndexedDB`.

### Generation (RAG) Workflow
1. **Query Rewriting**: Multi-turn chat history is passed to a fast local LLM (or heuristics) to rewrite follow-up questions into standalone search queries.
2. **Hybrid Search**: `PGlite` performs a semantic vector search (cosine similarity via `pgvector`) combined with keyword full-text search (ranked by `ts_rank`).
3. **Reciprocal Rank Fusion (RRF)**: The results from semantic and keyword searches are mathematically merged and re-ranked to surface the most relevant context.
4. **LLM Synthesis**: A local LLM engine (e.g. WebLLM, Transformers.js) streams the answer based *only* on the retrieved context. 
5. **Strict Verification**: The output is parsed and verified sentence-by-sentence. Any claims or sentences that cannot be grounded in the provided citations are mathematically dropped to prevent hallucinations.

## 🛠️ Tech Stack

**Frontend & Tooling**
- **React 19** & **TypeScript** (Strict Mode)
- **Vite** (Bundler), **Tailwind CSS v4**, **shadcn/ui** (Components)
- **TanStack Router** & **TanStack Query**

**Local AI & Machine Learning**
- **WebLLM**: Hardware-accelerated local LLMs via WebGPU (Qwen 0.5B, Llama 3.2, Gemma 2).
- **Transformers.js**: Local embedding generation (ONNX Runtime Web) and vision models.
- **Custom WebGPU Kernels**: Experimental support for specialized models like LFM 2.5 and Gemma 4 E2B.

**Local Database & Persistence**
- **PGlite**: Lightweight WASM PostgreSQL running in the browser.
- **pgvector**: Vector similarity search extension compiled to WASM.
- **IndexedDB**: Persistent local storage for the database and cached model weights (CacheStorage).

## 🌟 Key Features

- **100% Offline & Private**: A Progressive Web App (PWA) with Service Worker caching that runs entirely locally after the initial load.
- **Multi-Project Workspaces**: Isolated environments with dedicated, locked embedding models to ensure vector space consistency.
- **TrustScore Verification**: Built-in `/eval` evaluation dashboard to benchmark refusal accuracy, hallucination drop rates, and parse failures.
- **Traceable Citations**: Generated responses include interactive citation tooltips linking back to source document chunks.
- **Debug UI**: Inspect the retrieval and generation pipeline step-by-step. View the rewritten query, semantic/keyword hits, RRF scores, truncation warnings, and precise timings directly in the chat UI.
- **Database Backup & Restore**: Export and import the entire local workspace (projects, documents, vectors, history) via `.tar.gz` compressed tarballs.

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- `pnpm` package manager (do not use npm/yarn)

### Installation

1. Clone the repository and install dependencies:
```bash
pnpm install --frozen-lockfile
```

2. Start the development server:
```bash
pnpm dev
```

3. Build for production:
```bash
pnpm build
pnpm preview
```

## 📝 License
This project is open-source. Please check the repository for license details.
