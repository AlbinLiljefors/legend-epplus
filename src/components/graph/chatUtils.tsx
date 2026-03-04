// Doc: Natural_Language_Code/chat/info_chat.md
// Shared chat utilities used by ChatTab and SpotlightChatBar

import {
  GraphNode,
  GraphEdge,
  SystemGroupDef,
  Repository,
} from "@/data/types";

export interface NodeContext {
  node: {
    id: string;
    label: string;
    type: string;
    level: string;
    group: string | undefined;
    description: string;
    stats: string;
    purpose: string | undefined;
    architecture: string | undefined;
    keyDecisions: string[] | undefined;
    howItWorks: string | undefined;
    technicalSpecs: string | undefined;
    connections: string | undefined;
    dependencies: string | undefined;
    codeFiles: GraphNode["codeFiles"];
    functionalities: GraphNode["functionalities"];
    technicalDecisions: GraphNode["technicalDecisions"];
    architectureDetails: GraphNode["architectureDetails"];
  };
  connectedNodes: { id: string; label: string; type: string; description: string }[];
  systemGroup: { id: string; label: string } | undefined;
  siblingNodes: { label: string; type: string }[];
  repo: { name: string; description: string; language: string };
  zoomLevel: string;
}

export function buildNodeContext(
  node: GraphNode,
  allNodes: GraphNode[],
  allEdges: GraphEdge[],
  systemGroups: SystemGroupDef[],
  repo: Repository,
  zoomLevel: string,
): NodeContext {
  // Find connected node IDs (1-hop)
  const connectedIds = new Set<string>();
  allEdges.forEach((e) => {
    if (e.source === node.id) connectedIds.add(e.target);
    if (e.target === node.id) connectedIds.add(e.source);
  });

  const connectedNodes = allNodes
    .filter((n) => connectedIds.has(n.id))
    .map((n) => ({
      id: n.id,
      label: n.label,
      type: n.type,
      description: n.description,
    }));

  const systemGroup = node.group
    ? systemGroups.find((g) => g.id === node.group)
    : undefined;

  const siblingNodes = node.group
    ? allNodes
        .filter((n) => n.group === node.group && n.id !== node.id)
        .map((n) => ({ label: n.label, type: n.type }))
    : [];

  return {
    node: {
      id: node.id,
      label: node.label,
      type: node.type,
      level: node.level,
      group: node.group,
      description: node.description,
      stats: node.stats,
      purpose: node.purpose,
      architecture: node.architecture,
      keyDecisions: node.keyDecisions,
      howItWorks: node.howItWorks,
      technicalSpecs: node.technicalSpecs,
      connections: node.connections,
      dependencies: node.dependencies,
      codeFiles: node.codeFiles,
      functionalities: node.functionalities,
      technicalDecisions: node.technicalDecisions,
      architectureDetails: node.architectureDetails,
    },
    connectedNodes,
    systemGroup: systemGroup
      ? { id: systemGroup.id, label: systemGroup.label }
      : undefined,
    siblingNodes,
    repo: {
      name: repo.name,
      description: repo.description,
      language: repo.language,
    },
    zoomLevel,
  };
}

// Extract text content from UIMessage parts
export function getMessageText(message: { parts?: Array<{ type: string; text?: string }> }): string {
  if (!message.parts) return "";
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text)
    .join("");
}

export const SUGGESTED_QUESTIONS = [
  "What does this component do?",
  "How does it connect to other parts?",
  "What are the key design decisions?",
  "What's the data flow?",
];

// Simple markdown-like rendering for assistant messages
export function AssistantMessage({ content }: { content: string }) {
  if (!content) return null;

  // Split into blocks by double newline
  const blocks = content.split(/\n\n+/);

  return (
    <>
      {blocks.map((block, i) => {
        // Code block
        if (block.startsWith("```")) {
          const lines = block.split("\n");
          const code = lines.slice(1, lines[lines.length - 1] === "```" ? -1 : undefined).join("\n");
          return (
            <pre key={i} className="bg-background/50 rounded p-2 text-xs overflow-x-auto my-2">
              <code>{code}</code>
            </pre>
          );
        }
        // Heading
        if (block.startsWith("### ")) {
          return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{block.slice(4)}</h4>;
        }
        if (block.startsWith("## ")) {
          return <h3 key={i} className="font-semibold text-sm mt-3 mb-1">{block.slice(3)}</h3>;
        }
        // List
        if (block.match(/^[-*]\s/m)) {
          const items = block.split(/\n/).filter(l => l.match(/^[-*]\s/));
          return (
            <ul key={i} className="list-disc pl-4 space-y-0.5 my-1">
              {items.map((item, j) => (
                <li key={j}><InlineMarkdown text={item.replace(/^[-*]\s/, "")} /></li>
              ))}
            </ul>
          );
        }
        // Numbered list
        if (block.match(/^\d+\.\s/m)) {
          const items = block.split(/\n/).filter(l => l.match(/^\d+\.\s/));
          return (
            <ol key={i} className="list-decimal pl-4 space-y-0.5 my-1">
              {items.map((item, j) => (
                <li key={j}><InlineMarkdown text={item.replace(/^\d+\.\s/, "")} /></li>
              ))}
            </ol>
          );
        }
        // Regular paragraph
        return <p key={i} className="my-1"><InlineMarkdown text={block} /></p>;
      })}
    </>
  );
}

// Handle inline markdown: **bold**, `code`, *italic*
export function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={i} className="bg-background/50 rounded px-1 py-0.5 text-xs">{part.slice(1, -1)}</code>;
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
