
import { useState, useRef } from 'react';
import { GENERATORS, type GeneratorType, model } from '@/lib/ai';
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
    const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
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
                alert("Unsupported file type. Please use .txt, .md, .docx, or .pdf");
                return;
            }

            setAttachedFile({ name: file.name, content: text });
        } catch (error) {
            console.error("File parsing error:", error);
            alert("Failed to read file. Please ensure it is a valid document.");
        }
    };

    const handleGenerate = async () => {
        if (!topic && !attachedFile && !editorContent) return;

        setIsLoading(true);
        try {
            const generator = GENERATORS.find(g => g.id === selectedGenerator);
            if (!generator) return;

            let promptText = `${generator.prompt}\n\n`;

            if (topic) {
                promptText += `Context/Topic: ${topic}\n\n`;
            }

            if (attachedFile) {
                promptText += `Attached Document Content (${attachedFile.name}):\n${attachedFile.content}\n\n`;
            }

            if (editorContent && editorContent.trim().length > 0) {
                // Strip HTML tags for cleaner context if needed, or keep as is. 
                // For now, we'll pass it as is, but maybe adding a label.
                promptText += `Current Editor Content (Context of what has been done so far):\n${editorContent}\n\n`;
            }

            console.log("Starting generation with:", {
                model: model.provider,
                prompt: promptText,
                system: generator.system
            });

            const result = await generateText({
                model: model,
                prompt: promptText,
                system: generator.system,
            });

            console.log("AI Response Result:", result);
            console.log("Generated Text:", result.text);

            onContentGenerated(result.text);
        } catch (error) {
            console.error("Generation failed:", error);
            alert("Generation failed. Please check your API Key in .env and internet connection.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-white border-r border-slate-200 w-[400px]">
            <div className="p-6 border-b border-slate-100">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-500" />
                    AI Generator
                </h2>
                <p className="text-sm text-slate-500 mt-1">Create materials from topics or files.</p>
            </div>

            <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label>Content Type</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {GENERATORS.map((gen) => (
                                <div
                                    key={gen.id}
                                    onClick={() => setSelectedGenerator(gen.id)}
                                    className={`cursor-pointer rounded-lg border p-3 text-sm transition-all hover:bg-slate-50 ${selectedGenerator === gen.id
                                        ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500'
                                        : 'border-slate-200'
                                        }`}
                                >
                                    <div className="font-medium text-slate-900">{gen.name}</div>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            {GENERATORS.find(g => g.id === selectedGenerator)?.description}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="topic">Topic / Instructions</Label>
                        <Textarea
                            id="topic"
                            placeholder="E.g., Past Tense verbs, Travel vocabulary..."
                            className="min-h-[100px] resize-none"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Reference Document</Label>
                        {!attachedFile ? (
                            <div
                                className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-slate-50 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="h-8 w-8 text-slate-400 mb-2" />
                                <p className="text-sm text-slate-600 font-medium">Click to upload file</p>
                                <p className="text-xs text-slate-400 mt-1">.txt, .md supported</p>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".txt,.md,.pdf,.docx"
                                    onChange={handleFileChange}
                                />
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <FileText className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                                    <span className="text-sm text-indigo-900 truncate">{attachedFile.name}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-indigo-400 hover:text-indigo-700"
                                    onClick={() => {
                                        setAttachedFile(null);
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </ScrollArea>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
                    size="lg"
                    onClick={handleGenerate}
                    disabled={isLoading || (!topic && !attachedFile)}
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
