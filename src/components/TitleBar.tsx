import { Minus, Square, X } from "lucide-react";
import { Button } from "./ui/button";

import { cn } from "@/lib/utils";

// @ts-ignore
const { ipcRenderer } = window.require('electron');

interface TitleBarProps {
    className?: string;
}

export function TitleBar({ className }: TitleBarProps) {
    const handleMinimize = () => ipcRenderer.invoke('window-minimize');
    const handleMaximize = () => ipcRenderer.invoke('window-maximize');
    const handleClose = () => ipcRenderer.invoke('window-close');

    return (
        <div className={cn("h-10 bg-background/80 backdrop-blur-md border-b border-border/40 flex items-center justify-between px-4 select-none z-50 sticky top-0 w-full", className)} style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
            <div className="flex items-center gap-2">
                {/* Optional: App Icon or Title here if needed, currently kept clean */}
            </div>

            <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-white/10 text-muted-foreground hover:text-foreground rounded-md transition-colors"
                    onClick={handleMinimize}
                >
                    <Minus className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-white/10 text-muted-foreground hover:text-foreground rounded-md transition-colors"
                    onClick={handleMaximize}
                >
                    <Square className="h-3.5 w-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground text-muted-foreground rounded-md transition-colors"
                    onClick={handleClose}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
