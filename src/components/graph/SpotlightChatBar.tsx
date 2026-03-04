import { useEffect, useRef, useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { motion } from "framer-motion";
import { Search, Send, X, PanelRight, Loader2, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  GraphNode,
  GraphEdge,
  SystemGroupDef,
  Repository,
} from "@/data/types";
import {
  buildNodeContext,
  getMessageText,
  AssistantMessage,
} from "./chatUtils";

interface SpotlightChatBarProps {
  node: GraphNode;
  allNodes: GraphNode[];
  allEdges: GraphEdge[];
  systemGroups: SystemGroupDef[];
  repo: Repository;
  zoomLevel: string;
  mode: "bar" | "expanded";
  onExpand: () => void;
  onMoveToPanel: () => void;
  onClose: () => void;
}

export function SpotlightChatBar({
  node,
  allNodes,
  allEdges,
  systemGroups,
  repo,
  zoomLevel,
  mode,
  onExpand,
  onMoveToPanel,
  onClose,
}: SpotlightChatBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  const nodeContext = useMemo(
    () => buildNodeContext(node, allNodes, allEdges, systemGroups, repo, zoomLevel),
    [node.id, allNodes, allEdges, systemGroups, repo, zoomLevel],
  );

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

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Focus input on mount / mode change
  useEffect(() => {
    if (mode === "bar") {
      inputRef.current?.focus();
    } else {
      textareaRef.current?.focus();
    }
  }, [mode, node.id]);

  // Auto-scroll on new messages in expanded mode
  useEffect(() => {
    if (mode === "expanded" && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, mode]);

  const handleBarSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage({ text });
    onExpand();
  };

  const handleExpandedSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage({ text });
  };

  const handleBarKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleBarSend();
    }
  };

  const handleExpandedKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleExpandedSend();
    }
  };

  if (mode === "bar") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="absolute bottom-6 left-0 right-0 mx-auto z-10 w-[560px] max-w-[calc(100%-3rem)]"
      >
        <div className="bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl px-4 py-3 flex items-center gap-3">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleBarKeyDown}
            placeholder={`Ask about ${node.label}...`}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleBarSend}
            disabled={!input.trim()}
            className="shrink-0 h-8 w-8"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  }

  // Expanded mode
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute bottom-6 left-0 right-0 mx-auto z-10 w-[560px] max-w-[calc(100%-3rem)]"
    >
      <div className="bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl flex flex-col max-h-[500px]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <span className="text-sm font-medium text-foreground truncate">
            {node.label}
          </span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={onMoveToPanel}
              className="h-7 w-7"
              title="Move to panel"
            >
              <PanelRight className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="h-7 w-7"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[120px] max-h-[340px]">
          {messages.map((m) => {
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
          })}
          {isLoading && messages.length > 0 && getMessageText(messages[messages.length - 1]) === "" && (
            <div className="flex justify-start">
              <div className="bg-secondary/70 rounded-lg px-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border/30 px-4 py-3">
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleExpandedKeyDown}
              placeholder="Ask a follow-up..."
              rows={1}
              className="flex-1 resize-none rounded-md border bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[36px] max-h-[80px]"
              style={{ height: "auto", overflow: "hidden" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 80) + "px";
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
                onClick={handleExpandedSend}
                disabled={!input.trim()}
                className="shrink-0 h-9 w-9"
              >
                <Send className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
