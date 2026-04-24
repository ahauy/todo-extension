# Graphify — Knowledge Graph for Your Codebase

> Multi-modal knowledge graph builder. Automatically understand your codebase structure, dependencies, and design patterns.

---

## 🎯 What is Graphify?

Graphify builds an interactive knowledge graph from your code, docs, and diagrams:
- **Parse code** — Python, JavaScript, Go, Java, TypeScript, etc.
- **Extract semantics** — AST, call graphs, docstrings, design patterns
- **Build graph** — NetworkX graph with Leiden clustering
- **Identify god nodes** — Core components and surprising connections
- **Interactive output** — HTML visualization + queryable JSON + audit report

**Token reduction:** 71.5× vs naive approach

---

## 📦 Installation

### Step 1: Install Graphify

```bash
# Requires Python 3.10+
pip install graphifyy
```

### Step 2: Verify Installation

```bash
graphify --version
```

---

## 🚀 Usage

### Generate Knowledge Graph

```bash
# Build graph from src/ folder
graphify ./src

# Output lands in graphify-out/
graphify-out/
├── graph.html              # Interactive visualization
├── GRAPH_REPORT.md         # Core nodes, surprises, questions
├── graph.json              # Queryable graph (for Opencode)
└── cache/                  # Incremental cache
```

### Query the Graph

```bash
# Query specific nodes
/graphify query "Component"

# Explain a path
/graphify explain "src/app.ts → src/lib/utils.ts"

# Get god nodes (core components)
/graphify path "god-nodes"
```

### Interactive Visualization

Open `graphify-out/graph.html` in browser to:
- Explore node relationships
- Identify god nodes (highest-degree nodes)
- Find surprising cross-file connections
- Understand architecture at a glance

---

## 📊 Example Output

### GRAPH_REPORT.md

```markdown
# Knowledge Graph Report

## Core Nodes (God Nodes)
1. **App** (degree: 12) — Main application component
2. **Database** (degree: 8) — Database layer
3. **Auth** (degree: 7) — Authentication service

## Communities (Semantic Clusters)
- **API Layer** — routes, middleware, handlers
- **Data Layer** — models, queries, migrations
- **UI Layer** — components, pages, layouts

## Surprising Connections
- ⚠️ Utils → Auth (unexpected dependency)
- ⚠️ Components → Database (should go through API)

## Suggested Questions
- Why does Utils depend on Auth?
- Can we decouple Components from Database?
```

### graph.json (for Opencode)

```json
{
  "nodes": [
    {"id": "App", "type": "component", "degree": 12},
    {"id": "Database", "type": "service", "degree": 8},
    {"id": "Auth", "type": "service", "degree": 7}
  ],
  "edges": [
    {"source": "App", "target": "Database", "weight": 5},
    {"source": "App", "target": "Auth", "weight": 3}
  ],
  "communities": [
    {"id": 1, "nodes": ["App", "Routes", "Middleware"]},
    {"id": 2, "nodes": ["Database", "Models", "Queries"]}
  ]
}
```

---

## 🔄 Workflow

### Initial Setup

```bash
# After start-project.sh
./scripts/start-project.sh
    ↓
graphify ./src
    ↓
graph.json + graph.html + GRAPH_REPORT.md created
    ↓
Opencode reads graph.json to understand structure
```

### During Development

```bash
# After major changes
graphify ./src

# Review GRAPH_REPORT.md for:
# - New god nodes
# - Unexpected dependencies
# - Architecture drift
```

### Before Release

```bash
# Final architecture review
graphify ./src

# Check:
# - No circular dependencies
# - God nodes are appropriate
# - No surprising connections
```

---

## 🔐 Security

Graphify is secure by design:
- ✅ No telemetry
- ✅ Only semantic descriptions sent to LLM (never raw code)
- ✅ Input validation (URLs, size limits, path containment)
- ✅ HTML-escaped output (prevents XSS)
- ✅ MIT License (permissive, no conflicts)

---

## 📚 Resources

- **GitHub:** https://github.com/safi-shamsi/graphify
- **Docs:** https://graphify.net/
- **PyPI:** https://pypi.org/project/graphifyy/

---

## Tips

- Run graphify after major refactors to catch architecture drift
- Review GRAPH_REPORT.md for surprising connections
- Use graph.html for onboarding new team members
- Keep graphify-out/ in .gitignore (regenerate as needed)
- Run graphify in CI to enforce architecture rules
