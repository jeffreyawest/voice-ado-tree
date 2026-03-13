# Voice ADO Tree

A real-time, voice-driven meeting capture tool that builds an Azure DevOps work item hierarchy as you speak. Talk naturally about epics, features, stories, and tasks — the tree updates live every 3 seconds.

## How It Works

```
Microphone → Azure Speech SDK → 3-second time blocks → Claude LLM → Work Item Tree
```

1. **Speech Capture** — Web Audio API captures microphone input
2. **Transcription** — Azure Speech SDK provides real-time speech-to-text (interim + finalized segments)
3. **Time-Block Flush** — Every 3 seconds, the full accumulated transcript is sent to Claude
4. **Tree Extraction** — Claude returns the complete work item hierarchy as structured JSON
5. **Visualization** — React + D3 renders an interactive, color-coded tree

The full transcript is sent on every cycle, so the LLM always has complete context. Partial words (e.g., "honey" → "honeycrisp") are naturally corrected on the next update.

## Work Item Hierarchy

```
Epic → Feature → Story → Task
```

Each work item supports:
- **Title** and **type** (epic/feature/story/task)
- **Status**: new, active, resolved, closed
- **Priority**: 1 (highest) to 4
- **Assignee**
- **Tags**: multiple labels per item (e.g., "Big Rock", "Q3")
- **Description**

## Screenshot

| Left Panel | Right Panel |
|---|---|
| Live transcript with timestamps | Color-coded tree (blue=Epic, pink=Feature, green=Story, amber=Task) |
| Start/Stop, Undo, Clear, Export | Click any node to edit, zoom/pan to navigate |

## Setup

### Prerequisites

- Node.js 18+
- Azure Speech Services subscription ([create one](https://portal.azure.com/#create/Microsoft.CognitiveServicesSpeechServices))
- Anthropic API key ([get one](https://console.anthropic.com/))

### Install

```bash
git clone https://github.com/jeffreyawest/voice-ado-tree.git
cd voice-ado-tree
npm install
```

### Configure

Create a `.env` file in the project root:

```env
VITE_AZURE_SPEECH_KEY=your_azure_speech_key
VITE_AZURE_SPEECH_REGION=your_azure_region
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Run

```bash
npm run dev:all     # Start both frontend (port 5173) and API proxy (port 3001)
```

Or run them separately:

```bash
npm run dev          # Vite dev server (port 5173)
npm run dev:server   # Express proxy (port 3001)
```

### Build

```bash
npm run build        # Production build
npx tsc --noEmit     # Type-check only
```

## Architecture

```
src/
├── App.tsx                        # Root layout, pipeline orchestration
├── components/
│   ├── TreeView.tsx               # D3 tree visualization
│   ├── TranscriptPanel.tsx        # Live transcript + controls
│   ├── WorkItemCard.tsx           # Node editor popover
│   └── StatusIndicator.tsx        # Listening/Processing/Idle dot
├── graph/
│   ├── types.ts                   # WorkItem, WorkItemTree interfaces
│   ├── stateManager.ts            # Tree state + undo stack
│   └── persistence.ts             # localStorage read/write
├── speech/
│   ├── useSpeechRecognition.ts    # Azure Speech SDK React hook
│   └── debounce.ts                # 3-second time-block flush gate
└── llm/
    ├── extractEntities.ts         # Claude API caller
    └── prompts.ts                 # System + user prompt templates
server/
└── proxy.ts                       # Express proxy (keeps Anthropic key server-side)
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Visualization**: D3.js
- **Speech-to-Text**: Azure Cognitive Services Speech SDK
- **LLM**: Claude Haiku 4.5 via Anthropic API
- **API Proxy**: Express.js

## Usage Tips

- Speak naturally: "We have an epic called Checkout Redesign. Under that, a feature for Payment Processing."
- Tag items: "Tag the Checkout Redesign epic as a Big Rock."
- Assign work: "Assign the Payment Processing feature to Sarah."
- Set status: "Mark the Payment Processing feature as active."
- The tree rebuilds from the full transcript each cycle, so corrections happen automatically.
