import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, Bot, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSendChatMessage } from "@workspace/api-client-react";
import type { ChatMessage, ChatMessageRole } from "@workspace/api-client-react";

export default function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hola. Soy el asistente educativo de VIHSafe. Estoy aquí para responder tus dudas sobre salud sexual, prevención del VIH y dónde encontrar pruebas en Manizales. ¿En qué te puedo ayudar hoy?"
    }
  ]);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([
    "¿Cuáles son los síntomas iniciales?",
    "¿Dónde puedo hacerme una prueba gratis en Manizales?",
    "¿Qué es la PrEP y cómo funciona?"
  ]);

  const sendChat = useSendChatMessage();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sendChat.isPending]);

  const handleSend = async (content: string) => {
    if (!content.trim() || sendChat.isPending) return;

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content }
    ];
    setMessages(newMessages);
    setInput("");
    setSuggestions([]); // Clear suggestions while waiting

    try {
      const res = await sendChat.mutateAsync({
        data: { messages: newMessages }
      });

      setMessages([
        ...newMessages,
        { role: 'assistant', content: res.reply }
      ]);
      
      if (res.suggestions && res.suggestions.length > 0) {
        setSuggestions(res.suggestions);
      }
    } catch (error) {
      console.error("Failed to send message", error);
      // Fallback suggestions on error so user isn't stuck
      setSuggestions(["Intentar de nuevo"]);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 h-[calc(100vh-4rem)] max-h-[800px] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Asistente IA</h1>
        <p className="text-muted-foreground">Respuestas confidenciales basadas en ciencia.</p>
      </div>

      <div className="flex-1 bg-card rounded-2xl border shadow-sm flex flex-col overflow-hidden">
        {/* Warning Banner */}
        <div className="bg-amber-50 border-b border-amber-100 p-3 flex items-start text-sm text-amber-800">
          <AlertCircle className="w-5 h-5 mr-2 shrink-0 text-amber-600" />
          <p>
            Este chatbot proporciona información educativa, no consejos médicos. Para emergencias o diagnósticos, acude a un centro de salud profesional.
          </p>
        </div>

        {/* Chat Area */}
        <ScrollArea className="flex-1 p-4 sm:p-6" ref={scrollRef}>
          <div className="space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[85%] sm:max-w-[75%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-5 h-5" />}
                    </div>
                    
                    <div className={`p-4 rounded-2xl ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                        : 'bg-muted text-foreground rounded-tl-sm'
                    }`}>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {sendChat.isPending && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex max-w-[80%] gap-3 flex-row">
                    <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="p-4 rounded-2xl bg-muted rounded-tl-sm flex items-center space-x-1.5">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t bg-card">
          {suggestions.length > 0 && !sendChat.isPending && (
            <div className="flex flex-wrap gap-2 mb-4">
              {suggestions.map((sugg, i) => (
                <Button 
                  key={i} 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full text-xs font-normal border-primary/20 text-primary hover:bg-primary/10"
                  onClick={() => handleSend(sugg)}
                >
                  {sugg}
                </Button>
              ))}
            </div>
          )}

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta aquí..."
              className="flex-1 rounded-full h-12 px-6 bg-muted/50 border-transparent focus-visible:border-primary"
              disabled={sendChat.isPending}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="w-12 h-12 rounded-full shrink-0"
              disabled={!input.trim() || sendChat.isPending}
            >
              <Send className="w-5 h-5 ml-0.5" />
              <span className="sr-only">Enviar</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
