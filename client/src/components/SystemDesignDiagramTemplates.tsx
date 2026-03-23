// System Design Diagram Templates
// Pre-built Excalidraw JSON templates for News Feed, Messenger, and Instagram
// Download and open directly in excalidraw.com → File → Open

import { useState } from "react";
import {
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Layout,
} from "lucide-react";
import { toast } from "sonner";

// ── Excalidraw element helpers ────────────────────────────────────────────────
let _idCounter = 1000;
function uid() {
  return `el_${_idCounter++}`;
}
function seed() {
  return Math.floor(Math.random() * 1000000);
}

type El = Record<string, unknown>;

function makeRect(
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  strokeColor: string,
  bgColor: string,
  fontSize = 14
): El[] {
  const rectId = uid();
  const textId = uid();
  const rect: El = {
    type: "rectangle",
    id: rectId,
    x,
    y,
    width: w,
    height: h,
    angle: 0,
    strokeColor,
    backgroundColor: bgColor,
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 0,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: { type: 3 },
    seed: seed(),
    version: 1,
    versionNonce: 0,
    isDeleted: false,
    boundElements: [{ type: "text", id: textId }],
    updated: Date.now(),
    link: null,
    locked: false,
  };
  const text: El = {
    type: "text",
    id: textId,
    x: x + 8,
    y: y + h / 2 - fontSize * 0.75,
    width: w - 16,
    height: fontSize * 1.5,
    angle: 0,
    strokeColor,
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 1,
    strokeStyle: "solid",
    roughness: 0,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: seed(),
    version: 1,
    versionNonce: 0,
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
    text: label,
    fontSize,
    fontFamily: 1,
    textAlign: "center",
    verticalAlign: "middle",
    containerId: rectId,
    originalText: label,
    lineHeight: 1.25,
    baseline: fontSize,
  };
  return [rect, text];
}

function makeArrow(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  label = ""
): El[] {
  const arrowId = uid();
  const elements: El[] = [
    {
      type: "arrow",
      id: arrowId,
      x: x1,
      y: y1,
      width: Math.abs(x2 - x1),
      height: Math.abs(y2 - y1),
      angle: 0,
      strokeColor: "#94a3b8",
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: 1.5,
      strokeStyle: "solid",
      roughness: 0,
      opacity: 80,
      groupIds: [],
      frameId: null,
      roundness: { type: 2 },
      seed: seed(),
      version: 1,
      versionNonce: 0,
      isDeleted: false,
      boundElements: [],
      updated: Date.now(),
      link: null,
      locked: false,
      points: [
        [0, 0],
        [x2 - x1, y2 - y1],
      ],
      lastCommittedPoint: null,
      startBinding: null,
      endBinding: null,
      startArrowhead: null,
      endArrowhead: "arrow",
    },
  ];
  if (label) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    elements.push({
      type: "text",
      id: uid(),
      x: midX - 40,
      y: midY - 10,
      width: 80,
      height: 16,
      angle: 0,
      strokeColor: "#64748b",
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: 1,
      strokeStyle: "solid",
      roughness: 0,
      opacity: 80,
      groupIds: [],
      frameId: null,
      roundness: null,
      seed: seed(),
      version: 1,
      versionNonce: 0,
      isDeleted: false,
      boundElements: null,
      updated: Date.now(),
      link: null,
      locked: false,
      text: label,
      fontSize: 11,
      fontFamily: 1,
      textAlign: "center",
      verticalAlign: "top",
      containerId: null,
      originalText: label,
      lineHeight: 1.25,
      baseline: 11,
    });
  }
  return elements;
}

function makeLabel(
  x: number,
  y: number,
  text: string,
  color: string,
  fontSize = 16,
  bold = false
): El {
  return {
    type: "text",
    id: uid(),
    x,
    y,
    width: 600,
    height: fontSize * 1.5,
    angle: 0,
    strokeColor: color,
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 1,
    strokeStyle: "solid",
    roughness: 0,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: seed(),
    version: 1,
    versionNonce: 0,
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
    text,
    fontSize,
    fontFamily: bold ? 3 : 1,
    textAlign: "left",
    verticalAlign: "top",
    containerId: null,
    originalText: text,
    lineHeight: 1.25,
    baseline: fontSize,
  };
}

// ── Template: News Feed ───────────────────────────────────────────────────────
function buildNewsFeedTemplate(): object {
  _idCounter = 1000;
  const elements: El[] = [];

  // Title
  elements.push(
    makeLabel(
      40,
      20,
      "📰 News Feed System Design (FAANG L6/L7)",
      "#8b5cf6",
      20,
      true
    )
  );
  elements.push(
    makeLabel(
      40,
      50,
      "Fan-out on write vs read · Feed ranking · Real-time updates",
      "#64748b",
      12
    )
  );

  // Layer labels
  elements.push(makeLabel(40, 100, "CLIENT", "#94a3b8", 11));
  elements.push(
    makeLabel(40, 200, "API GATEWAY / LOAD BALANCER", "#94a3b8", 11)
  );
  elements.push(makeLabel(40, 300, "SERVICES", "#94a3b8", 11));
  elements.push(makeLabel(40, 500, "DATA STORES", "#94a3b8", 11));

  // Client
  elements.push(
    ...makeRect(40, 120, 120, 50, "Mobile App", "#3b82f6", "#1e3a5f")
  );
  elements.push(
    ...makeRect(200, 120, 120, 50, "Web App", "#3b82f6", "#1e3a5f")
  );

  // API Gateway
  elements.push(
    ...makeRect(
      40,
      220,
      340,
      50,
      "API Gateway / Load Balancer",
      "#6366f1",
      "#1e1b4b"
    )
  );

  // Services row
  elements.push(
    ...makeRect(
      40,
      320,
      140,
      60,
      "Feed Service\n(read/write)",
      "#10b981",
      "#064e3b"
    )
  );
  elements.push(
    ...makeRect(
      200,
      320,
      140,
      60,
      "Post Service\n(create/delete)",
      "#10b981",
      "#064e3b"
    )
  );
  elements.push(
    ...makeRect(
      360,
      320,
      140,
      60,
      "User Service\n(profile/follow)",
      "#10b981",
      "#064e3b"
    )
  );
  elements.push(
    ...makeRect(
      520,
      320,
      140,
      60,
      "Notification\nService",
      "#f59e0b",
      "#451a03"
    )
  );

  // Fan-out worker
  elements.push(
    ...makeRect(
      200,
      420,
      200,
      50,
      "Fan-out Worker\n(async, Kafka consumer)",
      "#8b5cf6",
      "#2e1065"
    )
  );

  // Data stores
  elements.push(
    ...makeRect(
      40,
      540,
      130,
      60,
      "Feed Cache\n(Redis, per user)",
      "#ef4444",
      "#450a0a"
    )
  );
  elements.push(
    ...makeRect(
      190,
      540,
      130,
      60,
      "Post DB\n(MySQL sharded)",
      "#ef4444",
      "#450a0a"
    )
  );
  elements.push(
    ...makeRect(340, 540, 130, 60, "User DB\n(MySQL)", "#ef4444", "#450a0a")
  );
  elements.push(
    ...makeRect(490, 540, 130, 60, "Kafka\n(event bus)", "#f59e0b", "#451a03")
  );
  elements.push(
    ...makeRect(
      640,
      540,
      130,
      60,
      "Object Store\n(S3 / media)",
      "#6366f1",
      "#1e1b4b"
    )
  );

  // CDN
  elements.push(
    ...makeRect(640, 320, 130, 60, "CDN\n(static assets)", "#06b6d4", "#083344")
  );

  // Arrows: Client → Gateway
  elements.push(...makeArrow(100, 170, 210, 220));
  elements.push(...makeArrow(260, 170, 210, 220));

  // Gateway → Services
  elements.push(...makeArrow(110, 270, 110, 320));
  elements.push(...makeArrow(210, 270, 270, 320));
  elements.push(...makeArrow(310, 270, 430, 320));

  // Post Service → Kafka
  elements.push(...makeArrow(270, 380, 555, 540, "publish"));

  // Kafka → Fan-out
  elements.push(...makeArrow(555, 540, 300, 470));

  // Fan-out → Feed Cache
  elements.push(...makeArrow(250, 470, 105, 540, "write"));

  // Feed Service → Feed Cache
  elements.push(...makeArrow(110, 380, 105, 540, "read/write"));

  // Feed Service → Post DB
  elements.push(...makeArrow(145, 380, 255, 540));

  // User Service → User DB
  elements.push(...makeArrow(430, 380, 405, 540));

  // Notes
  elements.push(
    makeLabel(
      40,
      640,
      "📌 L7 Signals: Hybrid fan-out (push for normal users, pull for celebrities >1M followers)",
      "#f59e0b",
      12
    )
  );
  elements.push(
    makeLabel(
      40,
      660,
      "📌 Feed ranking: ML model scores posts by relevance, recency, engagement. Separate ranking service.",
      "#f59e0b",
      12
    )
  );
  elements.push(
    makeLabel(
      40,
      680,
      "📌 Real-time: WebSocket/SSE push for online users; polling fallback for mobile.",
      "#f59e0b",
      12
    )
  );

  return {
    type: "excalidraw",
    version: 2,
    source: "meta-prep-guide",
    elements,
    appState: { viewBackgroundColor: "#0f172a", gridSize: null },
    files: {},
  };
}

// ── Template: Messenger ───────────────────────────────────────────────────────
function buildMessengerTemplate(): object {
  _idCounter = 2000;
  const elements: El[] = [];

  elements.push(
    makeLabel(
      40,
      20,
      "💬 Messenger / Chat System Design (FAANG L6/L7)",
      "#06b6d4",
      20,
      true
    )
  );
  elements.push(
    makeLabel(
      40,
      50,
      "WebSocket connections · Message storage · Delivery receipts · Group chat",
      "#64748b",
      12
    )
  );

  // Clients
  elements.push(makeLabel(40, 100, "CLIENTS", "#94a3b8", 11));
  elements.push(
    ...makeRect(40, 120, 100, 50, "User A\n(sender)", "#3b82f6", "#1e3a5f")
  );
  elements.push(
    ...makeRect(620, 120, 100, 50, "User B\n(receiver)", "#3b82f6", "#1e3a5f")
  );

  // Connection layer
  elements.push(makeLabel(40, 200, "CONNECTION LAYER", "#94a3b8", 11));
  elements.push(
    ...makeRect(
      40,
      220,
      200,
      50,
      "WebSocket Server A\n(stateful, sticky session)",
      "#6366f1",
      "#1e1b4b"
    )
  );
  elements.push(
    ...makeRect(
      520,
      220,
      200,
      50,
      "WebSocket Server B\n(stateful, sticky session)",
      "#6366f1",
      "#1e1b4b"
    )
  );

  // Message broker
  elements.push(makeLabel(40, 300, "MESSAGE BROKER", "#94a3b8", 11));
  elements.push(
    ...makeRect(
      240,
      320,
      280,
      50,
      "Kafka / Message Queue\n(ordered, durable delivery)",
      "#f59e0b",
      "#451a03"
    )
  );

  // Services
  elements.push(makeLabel(40, 400, "SERVICES", "#94a3b8", 11));
  elements.push(
    ...makeRect(
      40,
      420,
      150,
      60,
      "Chat Service\n(send/receive)",
      "#10b981",
      "#064e3b"
    )
  );
  elements.push(
    ...makeRect(
      210,
      420,
      150,
      60,
      "Presence Service\n(online/offline)",
      "#10b981",
      "#064e3b"
    )
  );
  elements.push(
    ...makeRect(
      380,
      420,
      150,
      60,
      "Notification\nService",
      "#f59e0b",
      "#451a03"
    )
  );
  elements.push(
    ...makeRect(
      550,
      420,
      150,
      60,
      "Group Service\n(membership)",
      "#10b981",
      "#064e3b"
    )
  );

  // Data stores
  elements.push(makeLabel(40, 510, "DATA STORES", "#94a3b8", 11));
  elements.push(
    ...makeRect(
      40,
      530,
      140,
      60,
      "Message Store\n(Cassandra, by conv_id)",
      "#ef4444",
      "#450a0a"
    )
  );
  elements.push(
    ...makeRect(
      200,
      530,
      140,
      60,
      "Presence Cache\n(Redis, TTL 30s)",
      "#ef4444",
      "#450a0a"
    )
  );
  elements.push(
    ...makeRect(
      360,
      530,
      140,
      60,
      "User/Conv DB\n(MySQL)",
      "#ef4444",
      "#450a0a"
    )
  );
  elements.push(
    ...makeRect(
      520,
      530,
      140,
      60,
      "Media Store\n(S3 + CDN)",
      "#6366f1",
      "#1e1b4b"
    )
  );

  // Arrows
  elements.push(...makeArrow(90, 170, 140, 220, "connect"));
  elements.push(...makeArrow(670, 170, 620, 220, "connect"));
  elements.push(...makeArrow(200, 270, 280, 320, "publish msg"));
  elements.push(...makeArrow(520, 270, 480, 320, "deliver msg"));
  elements.push(...makeArrow(380, 345, 115, 420));
  elements.push(...makeArrow(380, 370, 285, 420));
  elements.push(...makeArrow(480, 370, 455, 420));
  elements.push(...makeArrow(115, 480, 110, 530));
  elements.push(...makeArrow(285, 480, 270, 530));
  elements.push(...makeArrow(455, 480, 430, 530));

  // Notes
  elements.push(
    makeLabel(
      40,
      620,
      "📌 L7 Signals: Message ordering guarantees (Kafka partition by conv_id). Exactly-once delivery with idempotency keys.",
      "#f59e0b",
      12
    )
  );
  elements.push(
    makeLabel(
      40,
      640,
      "📌 Read receipts: client ACK → Chat Service → update delivery_status in Cassandra → push to sender via WebSocket.",
      "#f59e0b",
      12
    )
  );
  elements.push(
    makeLabel(
      40,
      660,
      "📌 Group chat: fan-out to all members. For large groups (>500), use pull model on read.",
      "#f59e0b",
      12
    )
  );
  elements.push(
    makeLabel(
      40,
      680,
      "📌 Offline users: store in Cassandra, push via APNs/FCM when they reconnect.",
      "#f59e0b",
      12
    )
  );

  return {
    type: "excalidraw",
    version: 2,
    source: "meta-prep-guide",
    elements,
    appState: { viewBackgroundColor: "#0f172a", gridSize: null },
    files: {},
  };
}

// ── Template: Instagram ───────────────────────────────────────────────────────
function buildInstagramTemplate(): object {
  _idCounter = 3000;
  const elements: El[] = [];

  elements.push(
    makeLabel(
      40,
      20,
      "📸 Instagram / Photo Sharing System Design (FAANG L6/L7)",
      "#ec4899",
      20,
      true
    )
  );
  elements.push(
    makeLabel(
      40,
      50,
      "Photo upload pipeline · Feed generation · Search · Stories",
      "#64748b",
      12
    )
  );

  // Clients
  elements.push(makeLabel(40, 100, "CLIENTS", "#94a3b8", 11));
  elements.push(
    ...makeRect(
      40,
      120,
      120,
      50,
      "Mobile App\n(iOS/Android)",
      "#3b82f6",
      "#1e3a5f"
    )
  );
  elements.push(
    ...makeRect(200, 120, 120, 50, "Web App", "#3b82f6", "#1e3a5f")
  );

  // API Gateway
  elements.push(makeLabel(40, 200, "API GATEWAY", "#94a3b8", 11));
  elements.push(
    ...makeRect(
      40,
      220,
      340,
      50,
      "API Gateway (rate limiting, auth, routing)",
      "#6366f1",
      "#1e1b4b"
    )
  );

  // Upload pipeline
  elements.push(makeLabel(440, 100, "UPLOAD PIPELINE", "#94a3b8", 11));
  elements.push(
    ...makeRect(
      440,
      120,
      140,
      50,
      "Upload Service\n(pre-signed S3 URL)",
      "#10b981",
      "#064e3b"
    )
  );
  elements.push(
    ...makeRect(
      600,
      120,
      140,
      50,
      "S3\n(original photos)",
      "#6366f1",
      "#1e1b4b"
    )
  );
  elements.push(
    ...makeRect(
      440,
      200,
      140,
      50,
      "Media Processor\n(resize, compress)",
      "#8b5cf6",
      "#2e1065"
    )
  );
  elements.push(
    ...makeRect(
      600,
      200,
      140,
      50,
      "CDN\n(processed images)",
      "#06b6d4",
      "#083344"
    )
  );

  // Services
  elements.push(makeLabel(40, 300, "SERVICES", "#94a3b8", 11));
  elements.push(
    ...makeRect(
      40,
      320,
      130,
      60,
      "Post Service\n(create/delete)",
      "#10b981",
      "#064e3b"
    )
  );
  elements.push(
    ...makeRect(
      190,
      320,
      130,
      60,
      "Feed Service\n(timeline gen)",
      "#10b981",
      "#064e3b"
    )
  );
  elements.push(
    ...makeRect(
      340,
      320,
      130,
      60,
      "Search Service\n(Elasticsearch)",
      "#10b981",
      "#064e3b"
    )
  );
  elements.push(
    ...makeRect(
      490,
      320,
      130,
      60,
      "Story Service\n(24h TTL)",
      "#f59e0b",
      "#451a03"
    )
  );
  elements.push(
    ...makeRect(
      640,
      320,
      100,
      60,
      "Like/Comment\nService",
      "#10b981",
      "#064e3b"
    )
  );

  // Message queue
  elements.push(
    ...makeRect(
      190,
      420,
      280,
      50,
      "Kafka (post events, fan-out, analytics)",
      "#f59e0b",
      "#451a03"
    )
  );

  // Data stores
  elements.push(makeLabel(40, 500, "DATA STORES", "#94a3b8", 11));
  elements.push(
    ...makeRect(
      40,
      520,
      120,
      60,
      "Post DB\n(MySQL, sharded)",
      "#ef4444",
      "#450a0a"
    )
  );
  elements.push(
    ...makeRect(
      180,
      520,
      120,
      60,
      "Feed Cache\n(Redis, per user)",
      "#ef4444",
      "#450a0a"
    )
  );
  elements.push(
    ...makeRect(
      320,
      520,
      120,
      60,
      "Search Index\n(Elasticsearch)",
      "#ef4444",
      "#450a0a"
    )
  );
  elements.push(
    ...makeRect(
      460,
      520,
      120,
      60,
      "Story Store\n(Redis, 24h TTL)",
      "#ef4444",
      "#450a0a"
    )
  );
  elements.push(
    ...makeRect(
      600,
      520,
      120,
      60,
      "Graph DB\n(follow graph)",
      "#ef4444",
      "#450a0a"
    )
  );

  // Arrows
  elements.push(...makeArrow(100, 170, 210, 220));
  elements.push(...makeArrow(260, 170, 210, 220));
  elements.push(...makeArrow(510, 170, 510, 200, "resize"));
  elements.push(...makeArrow(580, 145, 600, 145, "store"));
  elements.push(...makeArrow(580, 225, 600, 225, "serve"));
  elements.push(...makeArrow(105, 270, 105, 320));
  elements.push(...makeArrow(255, 270, 255, 320));
  elements.push(...makeArrow(105, 380, 240, 420));
  elements.push(...makeArrow(255, 380, 280, 420));
  elements.push(...makeArrow(240, 445, 100, 520, "write"));
  elements.push(...makeArrow(280, 445, 240, 520, "fan-out"));
  elements.push(...makeArrow(405, 380, 380, 520));
  elements.push(...makeArrow(555, 380, 520, 520));
  elements.push(...makeArrow(690, 380, 660, 520));

  // Notes
  elements.push(
    makeLabel(
      40,
      610,
      "📌 L7 Signals: Photo upload uses pre-signed S3 URLs (client uploads directly, bypasses servers). Async media processing via Lambda.",
      "#f59e0b",
      12
    )
  );
  elements.push(
    makeLabel(
      40,
      630,
      "📌 Feed: hybrid fan-out. Celebrities (>1M followers) use pull model. Normal users: push to Redis feed cache on post.",
      "#f59e0b",
      12
    )
  );
  elements.push(
    makeLabel(
      40,
      650,
      "📌 Stories: separate service with 24h TTL in Redis. Viewed status stored in Redis bitmap (1 bit per user per story).",
      "#f59e0b",
      12
    )
  );
  elements.push(
    makeLabel(
      40,
      670,
      "📌 Search: Elasticsearch for hashtag/caption search. Typeahead uses trie + Redis. Geo-search for location tags.",
      "#f59e0b",
      12
    )
  );

  return {
    type: "excalidraw",
    version: 2,
    source: "meta-prep-guide",
    elements,
    appState: { viewBackgroundColor: "#0f172a", gridSize: null },
    files: {},
  };
}

// ── Template Definitions ──────────────────────────────────────────────────────
// Inline SVG previews for each template (simplified architecture overview)
const SVG_PREVIEWS: Record<string, string> = {
  "news-feed": `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg" font-family="monospace">
    <rect width="320" height="160" fill="#0f172a"/>
    <rect x="8" y="8" width="52" height="22" rx="3" fill="#4c1d95" stroke="#7c3aed" stroke-width="1"/>
    <text x="34" y="23" text-anchor="middle" fill="#c4b5fd" font-size="8">Client</text>
    <rect x="72" y="8" width="52" height="22" rx="3" fill="#1e3a5f" stroke="#3b82f6" stroke-width="1"/>
    <text x="98" y="23" text-anchor="middle" fill="#93c5fd" font-size="8">API GW</text>
    <rect x="136" y="8" width="52" height="22" rx="3" fill="#1e3a5f" stroke="#3b82f6" stroke-width="1"/>
    <text x="162" y="23" text-anchor="middle" fill="#93c5fd" font-size="8">Feed Svc</text>
    <rect x="200" y="8" width="52" height="22" rx="3" fill="#14532d" stroke="#22c55e" stroke-width="1"/>
    <text x="226" y="23" text-anchor="middle" fill="#86efac" font-size="8">Redis</text>
    <rect x="264" y="8" width="48" height="22" rx="3" fill="#713f12" stroke="#f59e0b" stroke-width="1"/>
    <text x="288" y="23" text-anchor="middle" fill="#fcd34d" font-size="8">Kafka</text>
    <rect x="8" y="50" width="52" height="22" rx="3" fill="#1e3a5f" stroke="#3b82f6" stroke-width="1"/>
    <text x="34" y="65" text-anchor="middle" fill="#93c5fd" font-size="8">Post Svc</text>
    <rect x="72" y="50" width="52" height="22" rx="3" fill="#1e3a5f" stroke="#3b82f6" stroke-width="1"/>
    <text x="98" y="65" text-anchor="middle" fill="#93c5fd" font-size="8">Fan-out</text>
    <rect x="136" y="50" width="52" height="22" rx="3" fill="#1e3a5f" stroke="#3b82f6" stroke-width="1"/>
    <text x="162" y="65" text-anchor="middle" fill="#93c5fd" font-size="8">Notif Svc</text>
    <rect x="200" y="50" width="52" height="22" rx="3" fill="#1c1917" stroke="#78716c" stroke-width="1"/>
    <text x="226" y="65" text-anchor="middle" fill="#a8a29e" font-size="8">MySQL</text>
    <rect x="264" y="50" width="48" height="22" rx="3" fill="#1c1917" stroke="#78716c" stroke-width="1"/>
    <text x="288" y="65" text-anchor="middle" fill="#a8a29e" font-size="8">Cassandra</text>
    <rect x="8" y="92" width="80" height="22" rx="3" fill="#1e3a5f" stroke="#3b82f6" stroke-width="1"/>
    <text x="48" y="107" text-anchor="middle" fill="#93c5fd" font-size="8">ML Ranking Svc</text>
    <rect x="100" y="92" width="60" height="22" rx="3" fill="#14532d" stroke="#22c55e" stroke-width="1"/>
    <text x="130" y="107" text-anchor="middle" fill="#86efac" font-size="8">Feed Cache</text>
    <rect x="172" y="92" width="60" height="22" rx="3" fill="#713f12" stroke="#f59e0b" stroke-width="1"/>
    <text x="202" y="107" text-anchor="middle" fill="#fcd34d" font-size="8">Media CDN</text>
    <rect x="244" y="92" width="68" height="22" rx="3" fill="#1c1917" stroke="#78716c" stroke-width="1"/>
    <text x="278" y="107" text-anchor="middle" fill="#a8a29e" font-size="8">Object Store</text>
    <line x1="60" y1="19" x2="72" y2="19" stroke="#475569" stroke-width="1" marker-end="url(#arr)"/>
    <line x1="124" y1="19" x2="136" y2="19" stroke="#475569" stroke-width="1"/>
    <line x1="188" y1="19" x2="200" y2="19" stroke="#475569" stroke-width="1"/>
    <line x1="252" y1="19" x2="264" y2="19" stroke="#475569" stroke-width="1"/>
    <line x1="34" y1="30" x2="34" y2="50" stroke="#475569" stroke-width="1"/>
    <line x1="98" y1="30" x2="98" y2="50" stroke="#475569" stroke-width="1"/>
    <text x="8" y="148" fill="#475569" font-size="7">News Feed — Fan-out on Write · Redis Feed Cache · ML Ranking · Kafka Events</text>
  </svg>`,
  messenger: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg" font-family="monospace">
    <rect width="320" height="160" fill="#0f172a"/>
    <rect x="8" y="8" width="52" height="22" rx="3" fill="#164e63" stroke="#06b6d4" stroke-width="1"/>
    <text x="34" y="23" text-anchor="middle" fill="#67e8f9" font-size="8">Client A</text>
    <rect x="136" y="8" width="52" height="22" rx="3" fill="#1e3a5f" stroke="#3b82f6" stroke-width="1"/>
    <text x="162" y="23" text-anchor="middle" fill="#93c5fd" font-size="8">WS Server</text>
    <rect x="264" y="8" width="48" height="22" rx="3" fill="#164e63" stroke="#06b6d4" stroke-width="1"/>
    <text x="288" y="23" text-anchor="middle" fill="#67e8f9" font-size="8">Client B</text>
    <rect x="72" y="50" width="52" height="22" rx="3" fill="#1e3a5f" stroke="#3b82f6" stroke-width="1"/>
    <text x="98" y="65" text-anchor="middle" fill="#93c5fd" font-size="8">Msg Svc</text>
    <rect x="136" y="50" width="52" height="22" rx="3" fill="#713f12" stroke="#f59e0b" stroke-width="1"/>
    <text x="162" y="65" text-anchor="middle" fill="#fcd34d" font-size="8">Kafka</text>
    <rect x="200" y="50" width="52" height="22" rx="3" fill="#1e3a5f" stroke="#3b82f6" stroke-width="1"/>
    <text x="226" y="65" text-anchor="middle" fill="#93c5fd" font-size="8">Presence</text>
    <rect x="8" y="92" width="60" height="22" rx="3" fill="#1c1917" stroke="#78716c" stroke-width="1"/>
    <text x="38" y="107" text-anchor="middle" fill="#a8a29e" font-size="8">Cassandra</text>
    <rect x="80" y="92" width="52" height="22" rx="3" fill="#14532d" stroke="#22c55e" stroke-width="1"/>
    <text x="106" y="107" text-anchor="middle" fill="#86efac" font-size="8">Redis</text>
    <rect x="144" y="92" width="60" height="22" rx="3" fill="#1e3a5f" stroke="#3b82f6" stroke-width="1"/>
    <text x="174" y="107" text-anchor="middle" fill="#93c5fd" font-size="8">Notif Svc</text>
    <rect x="216" y="92" width="60" height="22" rx="3" fill="#1c1917" stroke="#78716c" stroke-width="1"/>
    <text x="246" y="107" text-anchor="middle" fill="#a8a29e" font-size="8">Media S3</text>
    <line x1="60" y1="19" x2="136" y2="19" stroke="#475569" stroke-width="1"/>
    <line x1="188" y1="19" x2="264" y2="19" stroke="#475569" stroke-width="1"/>
    <line x1="162" y1="30" x2="162" y2="50" stroke="#475569" stroke-width="1"/>
    <text x="8" y="148" fill="#475569" font-size="7">Messenger — WebSocket · Kafka Fan-out · Cassandra Msgs · Redis Presence</text>
  </svg>`,
  instagram: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg" font-family="monospace">
    <rect width="320" height="160" fill="#0f172a"/>
    <rect x="8" y="8" width="52" height="22" rx="3" fill="#500724" stroke="#ec4899" stroke-width="1"/>
    <text x="34" y="23" text-anchor="middle" fill="#f9a8d4" font-size="8">Client</text>
    <rect x="72" y="8" width="52" height="22" rx="3" fill="#1e3a5f" stroke="#3b82f6" stroke-width="1"/>
    <text x="98" y="23" text-anchor="middle" fill="#93c5fd" font-size="8">API GW</text>
    <rect x="136" y="8" width="52" height="22" rx="3" fill="#1e3a5f" stroke="#3b82f6" stroke-width="1"/>
    <text x="162" y="23" text-anchor="middle" fill="#93c5fd" font-size="8">Upload Svc</text>
    <rect x="200" y="8" width="52" height="22" rx="3" fill="#1c1917" stroke="#78716c" stroke-width="1"/>
    <text x="226" y="23" text-anchor="middle" fill="#a8a29e" font-size="8">S3</text>
    <rect x="264" y="8" width="48" height="22" rx="3" fill="#713f12" stroke="#f59e0b" stroke-width="1"/>
    <text x="288" y="23" text-anchor="middle" fill="#fcd34d" font-size="8">CDN</text>
    <rect x="8" y="50" width="52" height="22" rx="3" fill="#1e3a5f" stroke="#3b82f6" stroke-width="1"/>
    <text x="34" y="65" text-anchor="middle" fill="#93c5fd" font-size="8">Feed Svc</text>
    <rect x="72" y="50" width="52" height="22" rx="3" fill="#1e3a5f" stroke="#3b82f6" stroke-width="1"/>
    <text x="98" y="65" text-anchor="middle" fill="#93c5fd" font-size="8">Stories Svc</text>
    <rect x="136" y="50" width="52" height="22" rx="3" fill="#1e3a5f" stroke="#3b82f6" stroke-width="1"/>
    <text x="162" y="65" text-anchor="middle" fill="#93c5fd" font-size="8">Search Svc</text>
    <rect x="200" y="50" width="52" height="22" rx="3" fill="#14532d" stroke="#22c55e" stroke-width="1"/>
    <text x="226" y="65" text-anchor="middle" fill="#86efac" font-size="8">Redis</text>
    <rect x="264" y="50" width="48" height="22" rx="3" fill="#1c1917" stroke="#78716c" stroke-width="1"/>
    <text x="288" y="65" text-anchor="middle" fill="#a8a29e" font-size="8">MySQL</text>
    <rect x="8" y="92" width="80" height="22" rx="3" fill="#1e3a5f" stroke="#3b82f6" stroke-width="1"/>
    <text x="48" y="107" text-anchor="middle" fill="#93c5fd" font-size="8">Media Processor</text>
    <rect x="100" y="92" width="68" height="22" rx="3" fill="#1c1917" stroke="#78716c" stroke-width="1"/>
    <text x="134" y="107" text-anchor="middle" fill="#a8a29e" font-size="8">Elasticsearch</text>
    <rect x="180" y="92" width="60" height="22" rx="3" fill="#713f12" stroke="#f59e0b" stroke-width="1"/>
    <text x="210" y="107" text-anchor="middle" fill="#fcd34d" font-size="8">Kafka</text>
    <rect x="252" y="92" width="60" height="22" rx="3" fill="#1e3a5f" stroke="#3b82f6" stroke-width="1"/>
    <text x="282" y="107" text-anchor="middle" fill="#93c5fd" font-size="8">Notif Svc</text>
    <line x1="60" y1="19" x2="72" y2="19" stroke="#475569" stroke-width="1"/>
    <line x1="124" y1="19" x2="136" y2="19" stroke="#475569" stroke-width="1"/>
    <line x1="188" y1="19" x2="200" y2="19" stroke="#475569" stroke-width="1"/>
    <line x1="252" y1="19" x2="264" y2="19" stroke="#475569" stroke-width="1"/>
    <text x="8" y="148" fill="#475569" font-size="7">Instagram — S3 Upload · CDN · Elasticsearch · Stories TTL · Kafka Events</text>
  </svg>`,
};

const TEMPLATES = [
  {
    id: "news-feed",
    title: "News Feed",
    emoji: "📰",
    description:
      "Fan-out on write/read, feed ranking, real-time updates, Kafka event bus",
    color: "violet",
    tags: ["Fan-out", "Redis Cache", "Kafka", "ML Ranking"],
    build: buildNewsFeedTemplate,
    filename: "meta-news-feed-system-design.excalidraw",
  },
  {
    id: "messenger",
    title: "Messenger / Chat",
    emoji: "💬",
    description:
      "WebSocket connections, message ordering, delivery receipts, group chat",
    color: "cyan",
    tags: ["WebSocket", "Cassandra", "Kafka", "Presence"],
    build: buildMessengerTemplate,
    filename: "meta-messenger-system-design.excalidraw",
  },
  {
    id: "instagram",
    title: "Instagram",
    emoji: "📸",
    description:
      "Photo upload pipeline, CDN, feed generation, Stories with 24h TTL",
    color: "pink",
    tags: ["S3 Upload", "CDN", "Elasticsearch", "Stories"],
    build: buildInstagramTemplate,
    filename: "meta-instagram-system-design.excalidraw",
  },
];

const colorMap: Record<
  string,
  { badge: string; btn: string; border: string; icon: string }
> = {
  violet: {
    badge: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    btn: "bg-violet-500/20 hover:bg-violet-500/30 border-violet-500/30 text-violet-400",
    border: "border-violet-500/20",
    icon: "text-violet-400",
  },
  cyan: {
    badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    btn: "bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/30 text-cyan-400",
    border: "border-cyan-500/20",
    icon: "text-cyan-400",
  },
  pink: {
    badge: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    btn: "bg-pink-500/20 hover:bg-pink-500/30 border-pink-500/30 text-pink-400",
    border: "border-pink-500/20",
    icon: "text-pink-400",
  },
};

// ── Main Component ────────────────────────────────────────────────────────────
export function SystemDesignDiagramTemplates() {
  const [open, setOpen] = useState(false);

  const downloadTemplate = (tmpl: (typeof TEMPLATES)[0]) => {
    try {
      const data = tmpl.build();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = tmpl.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(
        `Downloaded ${tmpl.title} template! Open in excalidraw.com → File → Open`
      );
    } catch {
      toast.error("Failed to generate template. Please try again.");
    }
  };

  const openInExcalidraw = (tmpl: (typeof TEMPLATES)[0]) => {
    // Encode the template data as a URL parameter for excalidraw.com
    try {
      const data = tmpl.build();
      const json = JSON.stringify(data);
      const encoded = encodeURIComponent(json);
      // excalidraw.com supports loading via URL hash with base64 encoded data
      // However the simplest approach is to download and open manually
      // We'll open excalidraw.com and show a toast with instructions
      window.open("https://excalidraw.com", "_blank");
      // Also trigger download so user has the file ready
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = tmpl.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(
        `Excalidraw opened! File downloaded — drag it into excalidraw.com or use File → Open`,
        { duration: 6000 }
      );
    } catch {
      toast.error("Failed to open template.");
    }
  };

  return (
    <div className="prep-card p-5">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <Layout size={14} className="text-violet-400" />
          <div className="text-left">
            <div className="text-sm font-bold text-foreground">
              System Design Diagram Templates
            </div>
            <div className="text-xs text-muted-foreground">
              3 pre-built Excalidraw diagrams — News Feed, Messenger, Instagram
            </div>
          </div>
          <span className="badge bg-violet-500/20 text-violet-400 border border-violet-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
            NEW
          </span>
        </div>
        {open ? (
          <ChevronUp size={16} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={16} className="text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10 text-xs text-muted-foreground">
            <span className="text-violet-400 font-bold">How to use: </span>
            Click <strong className="text-foreground">Download</strong> to save
            the{" "}
            <code className="text-violet-300 bg-violet-500/10 px-1 rounded">
              .excalidraw
            </code>{" "}
            file, then open{" "}
            <a
              href="https://excalidraw.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 underline hover:text-violet-300"
            >
              excalidraw.com
            </a>{" "}
            and use <strong className="text-foreground">File → Open</strong> (or
            drag &amp; drop) to load the diagram. Each template includes L7
            coaching notes and architecture annotations.
          </div>

          <div className="grid gap-3">
            {TEMPLATES.map(tmpl => {
              const c = colorMap[tmpl.color];
              return (
                <div
                  key={tmpl.id}
                  className={`p-4 rounded-xl bg-secondary/40 border ${c.border} space-y-3`}
                >
                  {/* SVG Preview Thumbnail */}
                  <div
                    className="w-full rounded-lg overflow-hidden border border-border/50 cursor-pointer"
                    title="Architecture preview — click Download to get the full Excalidraw file"
                    dangerouslySetInnerHTML={{
                      __html: SVG_PREVIEWS[tmpl.id] ?? "",
                    }}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl shrink-0 mt-0.5">
                        {tmpl.emoji}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground">
                          {tmpl.title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {tmpl.description}
                        </div>
                        <div className="flex gap-1.5 flex-wrap mt-2">
                          {tmpl.tags.map(tag => (
                            <span
                              key={tag}
                              className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${c.badge}`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => downloadTemplate(tmpl)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${c.btn}`}
                        title="Download .excalidraw file"
                      >
                        <Download size={12} /> Download
                      </button>
                      <button
                        onClick={() => openInExcalidraw(tmpl)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent border border-border text-muted-foreground text-xs font-semibold transition-all"
                        title="Open excalidraw.com and download file"
                      >
                        <ExternalLink size={12} /> Open
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-xs text-muted-foreground">
            <span className="text-amber-400 font-bold">💡 L7 Tip: </span>
            Each diagram includes coaching notes at the bottom highlighting L7
            differentiation signals. During your interview, use Excalidraw to
            draw live — practice navigating these diagrams fluently.
          </div>
        </div>
      )}
    </div>
  );
}
