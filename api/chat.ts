// Doc: Natural_Language_Code/chat/info_chat.md
import { streamText, convertToModelMessages, createUIMessageStreamResponse, UIMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

interface NodeContext {
  node: {
    id: string;
    label: string;
    type: string;
    level: string;
    group?: string;
    description: string;
    stats: string;
    purpose?: string;
    architecture?: string;
    keyDecisions?: string[];
    howItWorks?: {
      overview?: string;
      workflow?: { step: number; description: string }[];
      edgeCases?: { scenario: string; handling: string; severity?: string }[];
    };
    technicalSpecs?: { title: string; details: string }[];
    connections?: {
      inputs: { name: string; id: string }[];
      outputs: { name: string; id: string }[];
    };
    dependencies?: {
      external: string[];
      internal: string[];
    };
    codeFiles?: { path: string; language: string; symbolCount: number }[];
    functionalities?: { name: string; description: string; items?: string[] }[];
    technicalDecisions?: {
      topic: string;
      decision: string;
      rationale: string[];
      tradeoffs?: { benefits: string[]; drawbacks?: string[] };
    }[];
    architectureDetails?: {
      overview?: string;
      dataFlow?: { inputs: string[]; processing: string[]; outputs: string[] };
      componentInteractions?: { component: string; role: string }[];
    };
  };
  connectedNodes: { id: string; label: string; type: string; description: string }[];
  systemGroup?: { id: string; label: string };
  siblingNodes: { label: string; type: string }[];
  repo: { name: string; description: string; language: string };
  zoomLevel: string;
}

function buildSystemPrompt(ctx: NodeContext): string {
  const { node, connectedNodes, systemGroup, siblingNodes, repo, zoomLevel } = ctx;

  const sections: string[] = [];

  sections.push(
    `You are an architecture assistant for the **${repo.name}** codebase.`,
    `Answer questions about the architecture based ONLY on the information provided below.`,
    `If you don't have enough information to answer, say so clearly.`,
    `Keep answers concise and well-structured. Use markdown formatting.`,
  );

  // Currently viewing
  sections.push(`\n## Currently Viewing: ${node.label}`);
  sections.push(`Level: ${node.level} | Type: ${node.type}${node.group ? ` | Group: ${node.group}` : ''}`);
  sections.push(`Stats: ${node.stats}`);

  // Description
  if (node.description) {
    sections.push(`\n### Description\n${node.description}`);
  }

  // Purpose
  if (node.purpose) {
    sections.push(`\n### Purpose\n${node.purpose}`);
  }

  // Architecture
  if (node.architecture) {
    sections.push(`\n### Architecture\n${node.architecture}`);
  }

  // Architecture details
  if (node.architectureDetails?.overview) {
    sections.push(`\n### Architecture Details\n${node.architectureDetails.overview}`);
  }
  if (node.architectureDetails?.dataFlow) {
    const df = node.architectureDetails.dataFlow;
    sections.push(`\n**Data Flow:**`);
    if (df.inputs.length) sections.push(`- Inputs: ${df.inputs.join(', ')}`);
    if (df.processing.length) sections.push(`- Processing: ${df.processing.join(' → ')}`);
    if (df.outputs.length) sections.push(`- Outputs: ${df.outputs.join(', ')}`);
  }
  if (node.architectureDetails?.componentInteractions?.length) {
    sections.push(`\n**Component Interactions:**`);
    node.architectureDetails.componentInteractions.forEach(ci => {
      sections.push(`- ${ci.component}: ${ci.role}`);
    });
  }

  // How it works
  if (node.howItWorks) {
    sections.push(`\n### How It Works`);
    if (node.howItWorks.overview) {
      sections.push(node.howItWorks.overview);
    }
    if (node.howItWorks.workflow?.length) {
      sections.push(`\n**Workflow:**`);
      node.howItWorks.workflow.forEach(w => {
        sections.push(`${w.step}. ${w.description}`);
      });
    }
    if (node.howItWorks.edgeCases?.length) {
      sections.push(`\n**Edge Cases:**`);
      node.howItWorks.edgeCases.forEach(ec => {
        sections.push(`- ${ec.scenario}: ${ec.handling}${ec.severity ? ` (${ec.severity})` : ''}`);
      });
    }
  }

  // Functionalities
  if (node.functionalities?.length) {
    sections.push(`\n### Functionalities`);
    node.functionalities.forEach(f => {
      sections.push(`**${f.name}:** ${f.description}`);
      if (f.items?.length) {
        f.items.forEach(item => sections.push(`  - ${item}`));
      }
    });
  }

  // Technical specs
  if (node.technicalSpecs?.length) {
    sections.push(`\n### Technical Specifications`);
    node.technicalSpecs.forEach(spec => {
      sections.push(`- **${spec.title}:** ${spec.details}`);
    });
  }

  // Key decisions
  if (node.keyDecisions?.length) {
    sections.push(`\n### Key Decisions`);
    node.keyDecisions.forEach(d => sections.push(`- ${d}`));
  }

  // Technical decisions (detailed)
  if (node.technicalDecisions?.length) {
    sections.push(`\n### Technical Decisions (Detailed)`);
    node.technicalDecisions.forEach(td => {
      sections.push(`\n**${td.topic}:** ${td.decision}`);
      if (td.rationale.length) {
        sections.push(`Rationale: ${td.rationale.join('; ')}`);
      }
      if (td.tradeoffs) {
        if (td.tradeoffs.benefits.length) sections.push(`Benefits: ${td.tradeoffs.benefits.join(', ')}`);
        if (td.tradeoffs.drawbacks?.length) sections.push(`Drawbacks: ${td.tradeoffs.drawbacks.join(', ')}`);
      }
    });
  }

  // Dependencies
  if (node.dependencies) {
    sections.push(`\n### Dependencies`);
    if (node.dependencies.external.length) sections.push(`External: ${node.dependencies.external.join(', ')}`);
    if (node.dependencies.internal.length) sections.push(`Internal: ${node.dependencies.internal.join(', ')}`);
  }

  // Connections
  if (node.connections) {
    sections.push(`\n### Connections`);
    if (node.connections.inputs.length) {
      sections.push(`**Inputs from:** ${node.connections.inputs.map(c => c.name).join(', ')}`);
    }
    if (node.connections.outputs.length) {
      sections.push(`**Outputs to:** ${node.connections.outputs.map(c => c.name).join(', ')}`);
    }
  }

  // Code files (top 10 by symbol count)
  if (node.codeFiles?.length) {
    const topFiles = [...node.codeFiles].sort((a, b) => b.symbolCount - a.symbolCount).slice(0, 10);
    sections.push(`\n### Key Code Files`);
    topFiles.forEach(f => {
      sections.push(`- \`${f.path}\` (${f.language}, ${f.symbolCount} symbols)`);
    });
  }

  // Surrounding context
  sections.push(`\n## Surrounding Context`);
  if (systemGroup) {
    sections.push(`**System Group:** ${systemGroup.label}`);
  }
  if (siblingNodes.length) {
    sections.push(`**Sibling nodes in group:** ${siblingNodes.map(n => `${n.label} (${n.type})`).join(', ')}`);
  }
  if (connectedNodes.length) {
    sections.push(`\n**Connected nodes:**`);
    connectedNodes.forEach(n => {
      sections.push(`- ${n.label} (${n.type}): ${n.description}`);
    });
  }
  sections.push(`\n**Repository:** ${repo.name} — ${repo.description} (${repo.language})`);
  sections.push(`**Viewing Level:** ${zoomLevel}`);

  return sections.join('\n');
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await req.json();
  const { messages, nodeContext } = body as {
    messages: UIMessage[];
    nodeContext: NodeContext;
  };

  const systemPrompt = buildSystemPrompt(nodeContext);
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: systemPrompt,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
