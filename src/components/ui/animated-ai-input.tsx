"use client";

import { ArrowRight, Bot, Check, ChevronDown, Paperclip, MessageSquare, Users, Loader2 } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({
    minHeight,
    maxHeight,
}: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            textarea.style.height = `${minHeight}px`;

            const newHeight = Math.max(
                minHeight,
                Math.min(
                    textarea.scrollHeight,
                    maxHeight ?? Number.POSITIVE_INFINITY
                )
            );

            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = `${minHeight}px`;
        }
    }, [minHeight]);

    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

const OPENAI_ICON = (
    <>
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 256 260"
            aria-label="OpenAI Icon"
            className="w-4 h-4 dark:hidden block"
        >
            <title>OpenAI Icon Light</title>
            <path d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z" />
        </svg>
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 256 260"
            aria-label="OpenAI Icon"
            className="w-4 h-4 hidden dark:block"
        >
            <title>OpenAI Icon Dark</title>
            <path
                fill="#fff"
                d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z"
            />
        </svg>
    </>
);

interface AI_PromptProps {
    onSendMessage: (message: string, mode: 'normal' | 'persona_question') => void;
    isLoading: boolean;
    selectedPersonaCountForQuery: number;
}

export function AI_Prompt({ onSendMessage, isLoading, selectedPersonaCountForQuery }: AI_PromptProps) {
    const [value, setValue] = useState("");
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 72,
        maxHeight: 300,
    });
    const [currentMode, setCurrentMode] = useState<'normal' | 'persona_question'>('normal');

    // ★ Vanishing Animation State and Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const newDataRef = useRef<any[]>([]);
    const [animating, setAnimating] = useState(false);

    // ★ Draw function adapted for Textarea
    const draw = useCallback(() => {
        console.log("[Debug] draw called");
        if (!textareaRef.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        console.log("[Debug] draw: Context obtained");
        canvas.width = 800;
        canvas.height = 800;
        ctx.clearRect(0, 0, 800, 800);
        const computedStyles = getComputedStyle(textareaRef.current);
        const fontSize = parseFloat(computedStyles.getPropertyValue("font-size"));
        const fontFamily = computedStyles.getPropertyValue("font-family");
        const lineHeight = parseFloat(computedStyles.getPropertyValue("line-height")) || fontSize * 1.2;
        const paddingTop = parseFloat(computedStyles.getPropertyValue("padding-top"));
        const paddingLeft = parseFloat(computedStyles.getPropertyValue("padding-left"));

        ctx.font = `${fontSize * 2}px ${fontFamily}`;
        ctx.fillStyle = "#000000";

        const textLines = value.split('\n');
        console.log(`[Debug] draw: Drawing ${textLines.length} lines`);
        textLines.forEach((line, index) => {
            ctx.fillText(line, paddingLeft * 2, paddingTop * 2 + index * lineHeight * 2);
        });

        const imageData = ctx.getImageData(0, 0, 800, 800);
        const pixelData = imageData.data;
        const newData: any[] = [];

        for (let t = 0; t < 800; t++) {
            let i = 4 * t * 800;
            for (let n = 0; n < 800; n++) {
                let e = i + 4 * n;
                if (pixelData[e + 3] > 0) {
                    newData.push({
                        x: n,
                        y: t,
                        color: [0, 0, 0, pixelData[e + 3]],
                    });
                }
            }
        }
        console.log(`[Debug] draw: Found ${newData.length} pixels`);

        newDataRef.current = newData.map(({ x, y, color }) => ({
            x,
            y,
            r: 1,
            color: `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 255})`,
        }));
    }, [value, textareaRef]);

    useEffect(() => {
        if (animating) {
            console.log("[Debug] useEffect[animating]: calling draw()");
            draw();
        }
    }, [value, draw, animating]);

    // ★ Animate function (mostly unchanged)
    const animate = (start: number) => {
        console.log(`[Debug] animate called with start: ${start}`);
        let frameCount = 0;
        const animateFrame = (pos: number = 0) => {
            frameCount++;
            const rafId = requestAnimationFrame(() => {
                const newArr = [];
                for (let i = 0; i < newDataRef.current.length; i++) {
                    const current = newDataRef.current[i];
                    if (current.x < pos) {
                        newArr.push(current);
                    } else {
                        if (current.r <= 0) {
                            current.r = 0;
                            continue;
                        }
                        current.x += Math.random() > 0.5 ? 1 : -1;
                        current.y += Math.random() > 0.5 ? 1 : -1;
                        current.r -= 0.02 * Math.random();
                        newArr.push(current);
                    }
                }
                newDataRef.current = newArr;
                const ctx = canvasRef.current?.getContext("2d");
                if (ctx) {
                    ctx.clearRect(pos, 0, 800, 800);
                    newDataRef.current.forEach((t) => {
                        const { x: n, y: i, r: s, color: color } = t;
                        if (n > pos) {
                            ctx.beginPath();
                            ctx.rect(n, i, s, s);
                            ctx.fillStyle = color;
                            ctx.strokeStyle = color;
                            ctx.stroke();
                        }
                    });
                }
                if (newDataRef.current.length > 0) {
                     if (frameCount > 1000) {
                         console.warn("[Debug] animate: Animation forced stop after 1000 frames");
                         cancelAnimationFrame(rafId);
                         setValue("");
                         adjustHeight(true);
                         setAnimating(false);
                         return;
                     }
                    animateFrame(pos - 8);
                } else {
                    console.log(`[Debug] animate: Animation finished after ${frameCount} frames`);
                    setValue("");
                    adjustHeight(true);
                    setAnimating(false);
                }
            });
        };
        animateFrame(start);
    };

    // ★ Vanish and Submit logic
    const vanishAndSubmit = () => {
        console.log("[Debug] vanishAndSubmit called");
        if (isLoading || animating) return;
        const currentValue = value;
        if (!currentValue.trim()) return;

        console.log("[Debug] vanishAndSubmit: Setting animating=true");
        setAnimating(true);
        onSendMessage(currentValue, currentMode);
        setTimeout(() => {
             console.log("[Debug] vanishAndSubmit: setTimeout calling draw()");
             draw();
             if (textareaRef.current) {
                 const maxX = newDataRef.current.reduce(
                     (prev, current) => (current.x > prev ? current.x : prev),
                     0
                 );
                 console.log(`[Debug] vanishAndSubmit: Calculated maxX = ${maxX}`);
                 if (maxX > 0) {
                    animate(maxX);
                 } else {
                    console.warn("[Debug] vanishAndSubmit: No pixels found (maxX=0), resetting animation state.");
                    setValue("");
                    adjustHeight(true);
                    setAnimating(false);
                 }
             }
        }, 50);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey && value.trim() && !isLoading && !animating) {
            e.preventDefault();
            vanishAndSubmit();
        }
    };

    const handleSendClick = () => {
        if (!value.trim() || isLoading || animating) return;
        vanishAndSubmit();
    };

    const placeholderText = currentMode === 'normal'
        ? "AIへの指示やメッセージを入力..."
        : selectedPersonaCountForQuery > 0
            ? `選択中の${selectedPersonaCountForQuery}人のペルソナへ質問...`
            : "ペルソナ一覧から質問対象を選択してください";

    return (
        <>
            <div className="flex-shrink-0 bg-white p-4">
                <div className="bg-white dark:bg-neutral-900 rounded-2xl p-1.5 max-w-3xl mx-auto border border-gray-200 dark:border-neutral-800">
                    <div className="relative">
                        <div className="relative flex flex-col">
                            <canvas
                                ref={canvasRef}
                                className={cn(
                                    "absolute pointer-events-none top-0 left-0",
                                    "text-base transform scale-50 origin-top-left",
                                    animating ? "opacity-100" : "opacity-0"
                                )}
                            />
                            <div className="overflow-y-auto">
                                <Textarea
                                    id="ai-prompt-input"
                                    value={value}
                                    placeholder={placeholderText}
                                    className={cn(
                                        "w-full rounded-xl rounded-b-none px-4 py-3 bg-white dark:bg-neutral-800/50 border-none text-black dark:text-white placeholder:text-black/70 dark:placeholder:text-white/70 resize-none focus-visible:ring-0 focus-visible:ring-offset-0",
                                        "min-h-[72px]",
                                        animating && "text-transparent dark:text-transparent"
                                    )}
                                    ref={textareaRef}
                                    onKeyDown={handleKeyDown}
                                    disabled={isLoading || animating}
                                    onChange={(e) => {
                                        if (!animating) {
                                          setValue(e.target.value);
                                          adjustHeight();
                                        }
                                    }}
                                />
                            </div>
                            <div className="h-14 bg-white dark:bg-neutral-900 rounded-b-xl flex items-center">
                                <div className="absolute left-3 right-3 bottom-3 flex items-center justify-between w-[calc(100%-24px)]">
                                    <div className="flex items-center gap-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="flex items-center gap-1 h-8 pl-1 pr-2 text-xs rounded-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-blue-500"
                                                    disabled={isLoading || animating}
                                                >
                                                    <AnimatePresence mode="wait">
                                                        <motion.div
                                                            key={currentMode}
                                                            initial={{ opacity: 0, y: -5 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: 5 }}
                                                            transition={{ duration: 0.15 }}
                                                            className="flex items-center gap-1"
                                                        >
                                                            {currentMode === 'normal' ? <MessageSquare className="w-3.5 h-3.5"/> : <Users className="w-3.5 h-3.5"/>}
                                                            {currentMode === 'normal' ? '通常モード' : 'ペルソナ質問'}
                                                            <ChevronDown className="w-3 h-3 opacity-50" />
                                                        </motion.div>
                                                    </AnimatePresence>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                className={cn(
                                                    "min-w-[10rem]",
                                                    "border-neutral-200 dark:border-neutral-700",
                                                    "bg-white dark:bg-neutral-800"
                                                )}
                                            >
                                                <DropdownMenuItem
                                                    onSelect={() => setCurrentMode('normal')}
                                                    className="flex items-center justify-between gap-2 cursor-pointer text-neutral-800 dark:text-neutral-200 hover:!bg-neutral-100 dark:hover:!bg-neutral-700"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <MessageSquare className="w-4 h-4 opacity-60" />
                                                        <span className="text-neutral-800 dark:text-neutral-200">通常モード</span>
                                                    </div>
                                                    {currentMode === 'normal' && <Check className="w-4 h-4 text-blue-500" />}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onSelect={() => {
                                                        if (selectedPersonaCountForQuery > 0) {
                                                            setCurrentMode('persona_question');
                                                        }
                                                    }}
                                                    disabled={selectedPersonaCountForQuery === 0}
                                                    className="flex items-center justify-between gap-2 cursor-pointer text-neutral-800 dark:text-neutral-200 hover:!bg-neutral-100 dark:hover:!bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                     <div className="flex items-center gap-2">
                                                         <Users className="w-4 h-4 opacity-60" />
                                                         <span className="text-neutral-800 dark:text-neutral-200">ペルソナ質問</span>
                                                     </div>
                                                     {currentMode === 'persona_question' && <Check className="w-4 h-4 text-blue-500" />}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <div className="h-4 w-px bg-black/10 dark:bg-white/10 mx-0.5" />
                                        <label
                                            className={cn(
                                                "rounded-lg p-2 bg-black/5 dark:bg-white/5 cursor-pointer",
                                                "hover:bg-black/10 dark:hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-blue-500",
                                                "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white",
                                                (isLoading || animating) && "opacity-50 cursor-not-allowed"
                                            )}
                                            aria-label="Attach file"
                                            aria-disabled={isLoading || animating}
                                        >
                                            <input type="file" className="hidden" disabled={isLoading || animating} />
                                            <Paperclip className="w-4 h-4 transition-colors" />
                                        </label>
                                    </div>
                                    <Button
                                        type="button"
                                        aria-label="Send message"
                                        disabled={!value.trim() || isLoading || animating}
                                        size="icon"
                                        className={cn(
                                            "w-10 h-10 bg-gray-800 hover:bg-gray-700 text-white rounded-full disabled:opacity-50 transition-all",
                                            "dark:bg-white/10 dark:hover:bg-white/20 dark:text-white"
                                        )}
                                        onClick={handleSendClick}
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <ArrowRight
                                            className={cn(
                                                "w-4 h-4 transition-opacity duration-200",
                                                value.trim() && !isLoading && !animating
                                                    ? "opacity-100"
                                                    : "opacity-30"
                                            )}
                                        />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
} 