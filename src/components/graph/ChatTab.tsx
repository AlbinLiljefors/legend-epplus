// Doc: Natural_Language_Code/chat/info_chat.md
import { useEffect, useRef, useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, MessageSquare, Loader2, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  GraphNode,
  GraphEdge,
  SystemGroupDef,
  Repository,
} from "@/data/types";
import {
  buildNodeContext,
  getMessageText,
  SUGGESTED_QUESTIONS,
  AssistantMessage,
} from "./chatUtils";

interface ChatTabProps {
  node: GraphNode;
  allNodes: GraphNode[];
  allEdges: GraphEdge[];
  systemGroups: SystemGroupDef[];
  repo: Repository;
  zoomLevel: string;
}

export function ChatTab({
  node,
  allNodes,
  allEdges,
  systemGroups,
  repo,
  zoomLevel,
}: ChatTabProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");

  const nodeContext = useMemo(
    () => buildNodeContext(node, allNodes, allEdges, systemGroups, repo, zoomLevel),
    [node.id, allNodes, allEdges, systemGroups, repo, zoomLevel],
  );

  // Create transport with nodeContext in body — memoize to avoid recreating on every render
  const transport = useMemo(
    () => new DefaultChatTransport({
      api: "/api/chat",
      body: { nodeContext },
    }),
    [nodeContext],
  );

  const { messages, sendMessage, stop, status } = useChat({
    id: `chat-${node.id}`,
    transport,
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Clear input when node changes
  const prevNodeId = useRef(node.id);
  useEffect(() => {
    if (prevNodeId.current !== node.id) {
      setInput("");
      prevNodeId.current = node.id;
    }
  }, [node.id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, [node.id]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage({ text });
  };

  const handleSuggestedQuestion = (question: string) => {
    if (isLoading) return;
    setInput("");
    sendMessage({ text: question });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <ScrollArea className="flex-1 px-4 pt-3">
        <div ref={scrollRef} className="space-y-3 pb-3">
          {messages.length === 0 ? (
            <div className="space-y-4 pt-4">
              <div className="text-center">
                <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Ask about <span className="font-medium text-foreground">{node.label}</span>
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Answers are grounded in the architecture data
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSuggestedQuestion(q)}
                    className="text-xs px-3 py-1.5 rounded-full border bg-secondary/50 hover:bg-secondary text-foreground/80 hover:text-foreground transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const text = getMessageText(m);
              if (!text && m.role === "assistant") return null;
              return (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/70 text-foreground"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <AssistantMessage content={text} />
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{text}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {isLoading && messages.length > 0 && getMessageText(messages[messages.length - 1]) === "" && (
            <div className="flex justify-start">
              <div className="bg-secondary/70 rounded-lg px-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t p-3">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this component..."
            rows={1}
            className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[36px] max-h-[120px]"
            style={{ height: "auto", overflow: "hidden" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 120) + "px";
            }}
          />
          {isLoading ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => stop()}
              className="shrink-0 h-9 w-9"
            >
              <StopCircle className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              onClick={handleSend}
              disabled={!input.trim()}
              className="shrink-0 h-9 w-9"
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
