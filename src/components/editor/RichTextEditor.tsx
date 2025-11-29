import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '@/components/ui/button';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Quote, Undo, Redo, Sparkles, ArrowUp, ArrowDown, Check, Maximize, Minimize } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { generateText } from 'ai';
import { model, REFINE_INSTRUCTIONS } from '@/lib/ai';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
    const [isRefining, setIsRefining] = useState(false);
    const editor = useEditor({
        extensions: [StarterKit],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-8',
            },
        },
    });

    // Update editor content when prop changes
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    const handleRefine = async (type: keyof typeof REFINE_INSTRUCTIONS) => {
        if (!editor) return;
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to);

        if (!selectedText) {
            alert("Please select some text to refine.");
            return;
        }

        setIsRefining(true);
        try {
            const instruction = REFINE_INSTRUCTIONS[type];
            const prompt = `${instruction}\n\nText to rewrite:\n"${selectedText}"`;

            const { text } = await generateText({
                model: model,
                prompt: prompt,
                system: "You are an expert editor. Return ONLY the rewritten text. Do not include quotes or explanations.",
            });

            if (text) {
                editor.chain().focus().setTextSelection({ from, to }).insertContent(text).run();
            }
        } catch (error) {
            console.error("Refinement failed:", error);
            alert("Refinement failed. Check API key.");
        } finally {
            setIsRefining(false);
        }
    };

    if (!editor) {
        return null;
    }

    const ToolbarButton = ({ onClick, isActive, icon: Icon }: any) => (
        <Button
            variant="ghost"
            size="sm"
            onClick={onClick}
            className={isActive ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-900'}
        >
            <Icon className="h-4 w-4" />
        </Button>
    );

    return (
        <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
            <div className="flex items-center gap-1 p-2 border-b border-slate-100 bg-slate-50/50 flex-wrap">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    icon={Bold}
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    icon={Italic}
                />
                <div className="w-px h-6 bg-slate-200 mx-1" />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive('heading', { level: 1 })}
                    icon={Heading1}
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    icon={Heading2}
                />
                <div className="w-px h-6 bg-slate-200 mx-1" />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    icon={List}
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    icon={ListOrdered}
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive('blockquote')}
                    icon={Quote}
                />

                <div className="w-px h-6 bg-slate-200 mx-1" />

                {/* AI Refinement Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                            <Sparkles className="h-4 w-4" />
                            <span className="text-xs font-medium">AI Refine</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => handleRefine('simplify')} disabled={isRefining} title="Rewrite text to be simpler and easier to understand.">
                            <ArrowDown className="mr-2 h-4 w-4 text-green-500" /> Simplify
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRefine('harden')} disabled={isRefining} title="Rewrite text to be more advanced and academic.">
                            <ArrowUp className="mr-2 h-4 w-4 text-red-500" /> Advanced
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRefine('grammar')} disabled={isRefining} title="Correct grammar, spelling, and punctuation errors.">
                            <Check className="mr-2 h-4 w-4 text-blue-500" /> Fix Grammar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRefine('expand')} disabled={isRefining} title="Add more details, examples, and depth.">
                            <Maximize className="mr-2 h-4 w-4 text-purple-500" /> Expand
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRefine('shorten')} disabled={isRefining} title="Summarize text to be more concise.">
                            <Minimize className="mr-2 h-4 w-4 text-orange-500" /> Shorten
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex-1" />
                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    icon={Undo}
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    icon={Redo}
                />
            </div>

            <div className="flex-1 overflow-y-auto bg-white">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
