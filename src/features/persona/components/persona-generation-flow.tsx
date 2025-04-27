
"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Users, History, ArrowUp, Plus } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  personaName?: string
}

interface Persona {
  id: string
  name: string
  description: string
  avatar: string
}

interface PersonaGroup {
  id: string
  name: string
  personas: Persona[]
  messages: Message[]
  createdAt: Date
}

export function PersonaGenerationFlow() {
  const [personaCount, setPersonaCount] = useState(3)
  const [isGenerating, setIsGenerating] = useState(false)
  const [message, setMessage] = useState("")
  const [personaGroups, setPersonaGroups] = useState<PersonaGroup[]>([])
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [showGroupSelector, setShowGroupSelector] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const activeGroup = personaGroups.find(group => group.id === activeGroupId)
  const isInitialMessage = !activeGroup || activeGroup.messages.length === 0

  // テキストエリアの高さを自動調整する
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "24px";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = scrollHeight + "px";
    }
  }, [message]);

  // 新しいメッセージが追加されたらスクロールエリアを下にスクロール
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [activeGroup?.messages.length]);

  const handleGenerate = async (message: string) => {
    setIsGenerating(true)
    try {
      const newGroup: PersonaGroup = {
        id: Date.now().toString(),
        name: `Group ${personaGroups.length + 1}`,
        personas: Array(personaCount).fill(null).map((_, i) => ({
          id: `persona-${i}`,
          name: `Persona ${i + 1}`,
          description: "Generated description...",
          avatar: `https://api.dicebear.com/7.x/personas/svg?seed=${i}`,
        })),
        messages: [{
          id: Date.now().toString(),
          role: "user",
          content: message,
        }],
        createdAt: new Date(),
      }
      setPersonaGroups(prev => [...prev, newGroup])
      setActiveGroupId(newGroup.id)
      
      newGroup.personas.forEach(persona => {
        const response: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: `${persona.name}からの回答...`,
          personaName: persona.name,
        }
        newGroup.messages.push(response)
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim() || isGenerating) return

    if (isInitialMessage) {
      await handleGenerate(message)
    } else if (activeGroup) {
      const newMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: message,
      }
      
      setPersonaGroups(prev => prev.map(group => {
        if (group.id === activeGroupId) {
          return {
            ...group,
            messages: [...group.messages, newMessage]
          }
        }
        return group
      }))

      activeGroup.personas.forEach(persona => {
        const response: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: `${persona.name}からの回答...`,
          personaName: persona.name,
        }
        setPersonaGroups(prev => prev.map(group => {
          if (group.id === activeGroupId) {
            return {
              ...group,
              messages: [...group.messages, response]
            }
          }
          return group
        }))
      })
    }

    setMessage("")
    // 送信後にテキストエリアの高さをリセット
    if (textareaRef.current) {
      textareaRef.current.style.height = "24px";
    }
  }

  return (
    <div className="relative flex h-full w-full flex-col items-stretch">
      {(!activeGroup || showGroupSelector) && (
        <div className="flex h-full flex-col">
          <div className="flex-1 pb-8">
            <div className="relative h-full w-full flex flex-col items-center justify-center">
              <div className="mb-8 text-center">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold">
                  お手伝いできることはありますか？
                </h1>
              </div>
              <Card className="w-full max-w-xl bg-card">
                <div className="p-4 sm:p-6 space-y-6">
                  <div className="space-y-2 text-center">
                    <h2 className="text-xl sm:text-2xl font-bold">AI人格を生成</h2>
                    <p className="text-sm text-muted-foreground">
                      会話を通じて、あなたの質問に答えるAI人格を生成します
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>生成するAI人格の数</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[personaCount]}
                          onValueChange={(value) => setPersonaCount(value[0])}
                          max={10}
                          min={2}
                          step={1}
                          className="flex-1"
                        />
                        <span className="w-16 text-right">{personaCount}人</span>
                      </div>
                    </div>
                    {personaGroups.length > 0 && (
                      <div className="space-y-2">
                        <Label>過去のAI人格グループ</Label>
                        <div className="space-y-2">
                          {personaGroups.map(group => (
                            <Button
                              key={group.id}
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => {
                                setActiveGroupId(group.id)
                                setShowGroupSelector(false)
                              }}
                            >
                              <Users className="mr-2 h-4 w-4" />
                              {group.name} - {group.personas.length}人
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full">
            <div className="mx-auto max-w-3xl px-4 pb-4 sm:pb-8">
              <div className="relative flex w-full flex-col">
                <div className="flex w-full items-center">
                  <div className="relative flex w-full cursor-text flex-col rounded-2xl border border-token-border-light bg-background px-2 py-2">
                    <div className="flex min-h-[44px] items-start pl-1 pr-12">
                      <Textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="AI人格を生成するための質問や話題を入力..."
                        className="min-h-[24px] w-full resize-none overflow-hidden border-0 bg-transparent p-0 focus:outline-none placeholder:text-muted-foreground"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                        rows={1}
                      />
                    </div>
                    <div className="mb-2 mt-1 flex items-center justify-between">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-full hover:bg-accent"
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="default"
                          size="icon"
                          className="h-9 w-9 rounded-full"
                          onClick={handleSendMessage}
                          disabled={isGenerating || !message.trim()}
                        >
                          {isGenerating ? (
                            "..."
                          ) : (
                            <ArrowUp className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeGroup && !showGroupSelector && (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-4 sm:px-6 py-3 sm:py-4 bg-background">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span className="font-semibold text-sm sm:text-base">{activeGroup.name}</span>
              <span className="text-xs sm:text-sm text-muted-foreground">
                ({activeGroup.personas.length}人)
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowGroupSelector(true)}
            >
              <History className="h-5 w-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1" ref={scrollAreaRef}>
            <div className="mx-auto flex h-full w-full flex-col max-w-3xl">
              <div className="flex-1 px-2 sm:px-4 py-4 sm:py-6">
                <div className="space-y-6">
                  {activeGroup.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-2 sm:gap-3",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.role === "assistant" && (
                        <div
                          className="rounded-full w-6 h-6 sm:w-8 sm:h-8 bg-cover shrink-0"
                          style={{
                            backgroundImage: `url(${activeGroup.personas.find(
                              (p) => p.name === msg.personaName
                            )?.avatar})`
                          }}
                        />
                      )}
                      <div
                        className={cn(
                          "rounded-2xl px-3 py-2 sm:px-4 sm:py-2 max-w-[85%] sm:max-w-[80%]",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {msg.role === "assistant" && (
                          <div className="text-xs sm:text-sm font-medium mb-1">
                            {msg.personaName}
                          </div>
                        )}
                        <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="w-full border-t bg-background">
            <div className="mx-auto max-w-3xl px-2 sm:px-4 py-2 sm:py-4">
              <div className="relative flex w-full flex-col">
                <div className="flex w-full items-center">
                  <div className="relative flex w-full cursor-text flex-col rounded-2xl border border-token-border-light bg-background px-2 py-2">
                    <div className="flex min-h-[44px] items-start pl-1 pr-12">
                      <Textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="メッセージを入力..."
                        className="min-h-[24px] w-full resize-none overflow-hidden border-0 bg-transparent p-0 focus:outline-none placeholder:text-muted-foreground"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                        rows={1}
                      />
                    </div>
                    <div className="mb-2 mt-1 flex items-center justify-between">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 sm:h-9 sm:w-9 rounded-full hover:bg-accent"
                        >
                          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="default"
                          size="icon"
                          className="h-8 w-8 sm:h-9 sm:w-9 rounded-full"
                          onClick={handleSendMessage}
                          disabled={isGenerating || !message.trim()}
                        >
                          {isGenerating ? (
                            "..."
                          ) : (
                            <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
