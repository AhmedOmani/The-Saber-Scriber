
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { GENERATORS, type GeneratorType, getModel } from '@/lib/ai';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Sparkles, Upload, X, FileText } from 'lucide-react';
import { generateText } from 'ai';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface GeneratorPanelProps {
    onContentGenerated: (content: string) => void;
    editorContent?: string;
}

export default function GeneratorPanel({ onContentGenerated, editorContent }: GeneratorPanelProps) {
    const [selectedGenerator, setSelectedGenerator] = useState<GeneratorType>('quiz');
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<{ name: string; content: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            let text = '';

            if (file.name.endsWith('.docx')) {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                text = result.value;
            } else if (file.type === 'application/pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let fullText = '';

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map((item: any) => item.str).join(' ');
                    fullText += pageText + '\n';
                }
                text = fullText;
            } else if (file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
                text = await file.text();
            } else {
                toast.error("Unsupported file type. Please use .txt, .md, .docx, or .pdf");
                return;
            }

            setAttachedFiles(prev => [...prev, { name: file.name, content: text }]);
            // Reset input so same file can be selected again if needed (though unlikely immediately)
            if (fileInputRef.current) fileInputRef.current.value = '';
            toast.success(`Attached ${file.name}`);
        } catch (error) {
            console.error("File parsing error:", error);
            toast.error("Failed to read file. Please ensure it is a valid document.");
        }
    };

    const removeFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleGenerate = async () => {
        if (!topic && attachedFiles.length === 0 && !editorContent) return;

        setIsLoading(true);
        try {
            const generator = GENERATORS.find(g => g.id === selectedGenerator);
            if (!generator) return;

            let promptText = `${generator.prompt}\n\n`;

            if (topic) {
                promptText += `Context/Topic: ${topic}\n\n`;
            }

            if (attachedFiles.length > 0) {
                promptText += `Attached Documents:\n`;
                attachedFiles.forEach((file, index) => {
                    promptText += `--- Document ${index + 1}: ${file.name} ---\n${file.content}\n\n`;
                });
            }

            if (editorContent && editorContent.trim().length > 0) {
                promptText += `Current Editor Content (Context of what has been done so far):\n${editorContent}\n\n`;
            }

            console.log("Starting generation with:", {
                model: model.provider,
                prompt: promptText,
                system: generator.system
            });

            const currentModel = getModel();

            const result = await generateText({
                model: currentModel,
                prompt: promptText,
                system: generator.system,
            });

            console.log("AI Response Result:", result);
            console.log("Generated Text:", result.text);

            onContentGenerated(result.text);
            toast.success("Content generated successfully!");
        } catch (error) {
            console.error("Generation failed:", error);
            toast.error("Generation failed. Please check your API Key in Settings and internet connection.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-card border-r border-border/60 w-[400px] shadow-xl z-20">
            <div className="p-6 border-b border-border/40 bg-muted/10 backdrop-blur-sm">
                <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    AI Generator
                </h2>
                <p className="text-sm text-muted-foreground mt-2">Create materials from topics or files.</p>
            </div>

            <ScrollArea className="flex-1 p-6">
                <div className="space-y-8">
                    <div className="space-y-4">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Content Type</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {GENERATORS.map((gen) => (
                                <div
                                    key={gen.id}
                                    onClick={() => setSelectedGenerator(gen.id)}
                                    className={`cursor-pointer rounded-xl border p-4 text-sm transition-all duration-200 hover:shadow-md flex flex-col gap-2 relative overflow-hidden group ${selectedGenerator === gen.id
                                        ? 'border-primary bg-primary/10 ring-1 ring-primary/20'
                                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                        }`}
                                >
                                    <div className={`p-2 rounded-lg w-fit transition-colors ${selectedGenerator === gen.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10'}`}>
                                        {gen.id === 'quiz' && <FileText className="h-4 w-4" />}
                                        {gen.id === 'vocab' && <FileText className="h-4 w-4" />}
                                        {gen.id === 'grammar' && <FileText className="h-4 w-4" />}
                                        {gen.id === 'reading' && <FileText className="h-4 w-4" />}
                                        {gen.id === 'listening' && <FileText className="h-4 w-4" />}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-foreground text-xs">{gen.name}</div>
                                    </div>
                                    {selectedGenerator === gen.id && (
                                        <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="topic" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Topic / Instructions</Label>
                        <Textarea
                            id="topic"
                            placeholder="E.g., Past Tense verbs, Travel vocabulary..."
                            className="min-h-[120px] resize-none bg-background border-border focus:border-primary focus:ring-primary/20 transition-all rounded-xl"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reference Document</Label>
                        <div className="space-y-2">
                            {attachedFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-xl animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-2 bg-background rounded-lg border border-border">
                                            <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{file.name}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                                        onClick={() => removeFile(index)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}

                            <div
                                className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
                                    <Upload className="h-4 w-4" />
                                    <span className="text-sm font-medium">Add Reference File</span>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".txt,.md,.pdf,.docx"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </ScrollArea>

            <div className="p-6 border-t border-border/40 bg-muted/10 backdrop-blur-sm">
                <Button
                    className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-[1.02]"
                    size="lg"
                    onClick={handleGenerate}
                    disabled={isLoading || (!topic && attachedFiles.length === 0)}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate Content
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
