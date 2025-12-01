import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import { useWorkspaceStore } from './store/workspaceStore';
import { Button } from './components/ui/button';
import { Save, Download, FileText, File, ChevronLeft } from 'lucide-react';
import GeneratorPanel from './components/generators/GeneratorPanel';
import RichTextEditor from './components/editor/RichTextEditor';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ThemeToggle';
// @ts-ignore
const { ipcRenderer } = window.require('electron');

import { marked } from 'marked';

function App() {
  const { currentWorkspaceId, workspaces, updateWorkspaceContent, setCurrentWorkspace } = useWorkspaceStore();
  const [editorContent, setEditorContent] = useState('');

  // Load content when workspace changes
  useEffect(() => {
    if (currentWorkspaceId) {
      const workspace = workspaces.find(w => w.id === currentWorkspaceId);
      if (workspace) {
        setEditorContent(workspace.content || '');
      }
    }
  }, [currentWorkspaceId, workspaces]);

  // Simple routing based on state for now
  if (!currentWorkspaceId) {
    return <Dashboard />;
  }

  const handleEditorChange = (newContent: string) => {
    setEditorContent(newContent);
    if (currentWorkspaceId) {
      updateWorkspaceContent(currentWorkspaceId, newContent);
    }
  };

  const handleContentGenerated = async (content: string) => {
    console.log("App received content:", content);
    // Parse Markdown to HTML
    const htmlContent = await marked.parse(content);
    // Append generated content to the editor
    const newContent = editorContent + `\n\n` + htmlContent;

    setEditorContent(newContent);
    if (currentWorkspaceId) {
      updateWorkspaceContent(currentWorkspaceId, newContent);
    }
  };

  const handleExportPDF = async () => {
    try {
      const result = await ipcRenderer.invoke('export-to-pdf', editorContent);
      if (result.success) {
        alert(`Saved to ${result.filePath}`);
      } else if (result.error) {
        alert(`Export failed: ${result.error}`);
      }
    } catch (e) {
      console.error("PDF export failed", e);
      alert("Export to PDF failed.");
    }
  };

  const handleExportWord = async () => {
    try {
      const result = await ipcRenderer.invoke('export-to-word', editorContent);
      if (result.success) {
        alert(`Saved to ${result.filePath}`);
      } else if (result.error) {
        alert(`Export failed: ${result.error}`);
      }
    } catch (e) {
      console.error("Word export failed", e);
      alert("Export to Word failed.");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden bg-dot-pattern bg-aurora">
      {/* Premium Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-md px-6 py-3 flex items-center justify-between shadow-sm z-50 sticky top-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentWorkspace('')}
            className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back
          </Button>
          <div className="h-6 w-px bg-border/60" />
          <h1 className="text-sm font-medium tracking-tight text-muted-foreground/80">
            The Saber Scribe / Editor
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all">
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Save</span>
          </Button>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-2 shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
                <File className="mr-2 h-4 w-4 text-red-500" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportWord} className="cursor-pointer">
                <FileText className="mr-2 h-4 w-4 text-blue-500" />
                Export as Word
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Generator Panel (Left Sidebar) */}
        <GeneratorPanel onContentGenerated={handleContentGenerated} editorContent={editorContent} />

        {/* Editor Area */}
        <main className="flex-1 overflow-hidden bg-muted/20 relative">
          {/* Decorative background elements */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />

          <div className="h-full w-full overflow-y-auto p-8 scroll-smooth">
            <div className="max-w-4xl mx-auto min-h-[calc(100vh-8rem)]">
              <RichTextEditor content={editorContent} onChange={handleEditorChange} />
            </div>
            <div className="h-20" /> {/* Bottom spacer */}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
