<div align="center">
  <img src="./public/knowsphere-logo.svg" alt="KnowSphere Logo" width="200" height="200">
  
# 🌐 KnowSphere - AI-Powered Knowledge Discovery

> Transforming Academic Research Through Intelligent Hybrid Search & Generative AI

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![Elasticsearch](https://img.shields.io/badge/Elasticsearch-8.x-005571?logo=elasticsearch)](https://www.elastic.co/)
[![Google Cloud](https://img.shields.io/badge/Google_Cloud-Vertex_AI-4285F4?logo=google-cloud)](https://cloud.google.com/vertex-ai)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)

</div>

---

## 🌟 Project Overview

**KnowSphere** is an intelligent, context-aware conversational search system that revolutionizes how researchers interact with academic literature. By seamlessly integrating **Elasticsearch's hybrid search** (ELSER semantic + BM25 keyword) with **Google Cloud's Gemini AI**, it transforms complex research queries into natural conversations backed by relevant scientific papers.

### 🎯 Problem Statement

Researchers worldwide face critical challenges when navigating academic literature:

- 📚 **Information Overload**: Over 3 million research papers are published annually, making it impossible to keep up with relevant work
- 🔍 **Inefficient Discovery**: Traditional keyword search misses semantically related papers, leading to incomplete literature reviews
- ⏱️ **Time Consumption**: Researchers spend hours or days reading papers just to answer simple questions
- 🔗 **Knowledge Fragmentation**: Difficulty connecting related research across different fields and domains
- 📊 **No Intelligent Synthesis**: Manual comparison and analysis required to understand relationships between papers
- 💬 **Lack of Context**: Each search starts from scratch with no memory of previous queries

### ✨ Our Solution

KnowSphere addresses these challenges through:

1. **Hybrid Search Technology**
   - Combines semantic understanding (ELSER) with precise keyword matching (BM25)
   - Finds papers based on meaning, not just exact word matches
   - Uses Reciprocal Rank Fusion to deliver the most relevant results

2. **Conversational AI Interface**
   - Natural language queries: Ask questions as you would to a colleague
   - Context memory: System remembers your entire conversation
   - Follow-up questions: Build on previous answers without repeating context
   - Structured responses: Get summaries, evidence, analysis, and insights

3. **Intelligent Paper Management**
   - Auto-fetch papers from arXiv and Semantic Scholar
   - Just enter a topic - system handles the rest
   - Real-time indexing for immediate searchability
   - Support for 2000+ pre-indexed papers plus unlimited additions

4. **AI-Powered Synthesis**
   - Gemini 2.0 Flash generates comprehensive answers
   - Every claim backed by citations from source papers
   - Comparison tables and structured insights
   - Actionable next steps and suggested follow-ups

**Result**: Reduce literature review time from days to minutes while discovering more relevant papers and gaining deeper insights.

---

## 🏗️ Architecture

```mermaid
graph TB
    subgraph "User Interface Layer"
        UI[Next.js + React Frontend]
        Chat[Chat Interface]
        Sidebar[Conversation Sidebar]
        Modal[Paper Addition Modal]
    end

    subgraph "Application Layer"
        API[Next.js API Routes]
        Search["API: Search"]
        Index["API: Index"]
        Fetch["API: Fetch Papers"]
    end

    subgraph "Data Layer"
        ES[(Elasticsearch 8.x<br/>+ ELSER v2)]
        VAI[Vertex AI<br/>Gemini 2.0 Flash]
        Ext[External APIs<br/>arXiv + Semantic Scholar]
    end

    UI --> Chat
    UI --> Sidebar
    UI --> Modal
    
    Chat --> Search
    Modal --> Fetch
    Modal --> Index
    
    Search --> ES
    Search --> VAI
    Index --> ES
    Fetch --> Ext
    Fetch --> ES

    style UI fill:#4285F4
    style API fill:#0052CC
    style ES fill:#005571
    style VAI fill:#34A853
    style Ext fill:#FBBC04
```

### Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Context as Context Manager
    participant ES as Elasticsearch
    participant AI as Vertex AI
    
    User->>Frontend: Enter query
    Frontend->>API: POST /api/search
    API->>Context: Load conversation history
    Context-->>API: Previous messages
    API->>API: Enhance query with context
    
    par Parallel Execution
        API->>ES: Hybrid search (ELSER + BM25)
        ES-->>API: Top 5 relevant papers
    and
        API->>AI: Generate response prompt
        AI-->>API: Structured markdown
    end
    
    API->>API: Combine results + citations
    API->>Context: Save to history
    API-->>Frontend: Return response
    Frontend-->>User: Display answer + sources
```

### System Components

```mermaid
flowchart LR
    subgraph Client
        A[React UI] --> B[LocalStorage]
        A --> C[Conversation State]
    end
    
    subgraph Server
        D[API Routes] --> E[Search Logic]
        D --> F[Index Logic]
        D --> G[Fetch Logic]
    end
    
    subgraph Services
        H[Elasticsearch Client]
        I[Vertex AI Client]
        J[arXiv API]
        K[Semantic Scholar API]
    end
    
    C --> D
    E --> H
    E --> I
    F --> H
    G --> J
    G --> K
    G --> H

    style A fill:#61DAFB
    style D fill:#000000
    style H fill:#005571
    style I fill:#4285F4
    style J fill:#B31B1B
    style K fill:#1857B6
```

### Hybrid Search Architecture

```mermaid
graph TD
    Query[User Query] --> Enhance[Context Enhancement]
    Enhance --> Split{Hybrid Search}
    
    Split --> Semantic[ELSER Semantic Search<br/>Weight: 0.7]
    Split --> Keyword[BM25 Keyword Search<br/>Weight: 0.3]
    
    Semantic --> Papers1[(Semantic Matches<br/>'neural networks'<br/>'deep learning'<br/>'transformers')]
    Keyword --> Papers2[(Exact Matches<br/>'transformer'<br/>'attention'<br/>'BERT')]
    
    Papers1 --> RRF[Reciprocal Rank Fusion<br/>Rank Constant: 60]
    Papers2 --> RRF
    
    RRF --> Top5[Top 5 Results]
    Top5 --> AI[Gemini AI Generation]
    AI --> Response[Structured Answer]

    style Query fill:#4285F4
    style Semantic fill:#0052CC
    style Keyword fill:#005571
    style RRF fill:#FBBC04
    style AI fill:#34A853
    style Response fill:#EA4335
```

### Conversation Flow

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> QueryInput: User enters query
    QueryInput --> LoadContext: Load history
    LoadContext --> EnhanceQuery: Add context
    EnhanceQuery --> Search: Execute hybrid search
    Search --> Generate: Send to Gemini AI
    Generate --> Display: Show response
    Display --> SaveHistory: Store conversation
    SaveHistory --> Idle: Ready for next query
    
    Display --> FollowUp: User asks follow-up
    FollowUp --> LoadContext
    
    Idle --> AddPaper: Click "Add Paper"
    AddPaper --> FetchPapers: Auto-fetch from APIs
    FetchPapers --> IndexPapers: Index in Elasticsearch
    IndexPapers --> Idle: Papers ready
```

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- npm 9.0+ (comes with Node.js)
- Elasticsearch Cloud account ([Free trial](https://cloud.elastic.co/))
- Google Cloud account with Vertex AI enabled ([Sign up](https://console.cloud.google.com/))

### Step 1: Clone Repository

```bash
git clone https://github.com/tejuiceB/KnowSphere.git
cd KnowSphere
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Elasticsearch

#### 3.1 Create Deployment

1. Go to [cloud.elastic.co](https://cloud.elastic.co/)
2. Click "Create deployment"
3. Choose "Elasticsearch"
4. Select your preferred region
5. Copy the deployment URL and API key

#### 3.2 Enable ELSER Model

In Kibana Dev Tools, run:

```json
PUT _ml/trained_models/.elser_model_2
{
  "input": {
    "field_names": ["text_field"]
  }
}

POST _ml/trained_models/.elser_model_2/deployment/_start
{
  "wait_for": "started"
}
```

#### 3.3 Create Index with Mappings

```json
PUT /research_papers
{
  "mappings": {
    "properties": {
      "text": { "type": "text" },
      "vector": { "type": "sparse_vector" },
      "metadata": {
        "properties": {
          "title": { "type": "text" },
          "authors": { "type": "keyword" },
          "abstract": { "type": "text" },
          "year": { "type": "integer" },
          "url": { "type": "keyword" },
          "source": { "type": "keyword" }
        }
      }
    }
  }
}
```

#### 3.4 Create Ingestion Pipeline

```json
PUT _ingest/pipeline/elser-pipeline
{
  "processors": [
    {
      "inference": {
        "model_id": ".elser_model_2",
        "input_output": {
          "input_field": "text",
          "output_field": "vector"
        }
      }
    }
  ]
}
```

### Step 4: Configure Google Cloud Vertex AI

#### 4.1 Create GCP Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Note your project ID

#### 4.2 Enable Vertex AI API

```bash
gcloud services enable aiplatform.googleapis.com
```

#### 4.3 Create Service Account

```bash
# Create service account
gcloud iam service-accounts create knowsphere \
  --display-name="KnowSphere Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:knowsphere@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# Generate key file
gcloud iam service-accounts keys create key.json \
  --iam-account=knowsphere@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### Step 5: Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# Elasticsearch Configuration
ELASTIC_SEARCH_API_URL=https://your-deployment.elastic-cloud.com:443
ELASTIC_API_KEY=your-api-key-here
ELASTIC_INDEX_NAME=research_papers

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1

# GCP Service Account (from key.json)
GCP_SERVICE_ACCOUNT_TYPE=service_account
GCP_SERVICE_ACCOUNT_PROJECT_ID=your-project-id
GCP_SERVICE_ACCOUNT_PRIVATE_KEY_ID=your-private-key-id
GCP_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GCP_SERVICE_ACCOUNT_CLIENT_EMAIL=knowsphere@your-project.iam.gserviceaccount.com
GCP_SERVICE_ACCOUNT_CLIENT_ID=your-client-id
GCP_SERVICE_ACCOUNT_AUTH_URI=https://accounts.google.com/o/oauth2/auth
GCP_SERVICE_ACCOUNT_TOKEN_URI=https://oauth2.googleapis.com/token
GCP_SERVICE_ACCOUNT_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
GCP_SERVICE_ACCOUNT_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/knowsphere%40your-project.iam.gserviceaccount.com
GCP_SERVICE_ACCOUNT_UNIVERSE_DOMAIN=googleapis.com
```

### Step 6: Run the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser 🎉

### Step 7: Index Sample Data (Optional)

Use the "Add Paper" feature in the UI to:

1. Click "Add Paper" button in the sidebar
2. Enter a research topic (e.g., "transformer neural networks")
3. Optionally add author names
4. System will auto-fetch and index papers from arXiv and Semantic Scholar

---

<div align="center">

### Built with ❤️ by Team Yoddha Universe

[![GitHub](https://img.shields.io/badge/GitHub-tejuiceB-181717?logo=github)](https://github.com/tejuiceB/KnowSphere)

</div>
