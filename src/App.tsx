import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import { useWorkspaceStore } from './store/workspaceStore';
import { Button } from './components/ui/button';
import { ArrowLeft, Save, Download, FileText, File } from 'lucide-react';
import GeneratorPanel from './components/generators/GeneratorPanel';
import RichTextEditor from './components/editor/RichTextEditor';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
    <div className="h-screen flex flex-col bg-slate-50">
      <header className="border-b bg-white px-6 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setCurrentWorkspace('')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-serif font-medium text-slate-900">Workspace Editor</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Save className="h-4 w-4" /> Save
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-2">
                <Download className="h-4 w-4" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPDF}>
                <File className="mr-2 h-4 w-4" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportWord}>
                <FileText className="mr-2 h-4 w-4" />
                Export as Word
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Generator Panel (Left Sidebar) */}
        <GeneratorPanel onContentGenerated={handleContentGenerated} editorContent={editorContent} />

        {/* Editor Area */}
        <main className="flex-1 p-6 overflow-hidden bg-slate-50">
          <div className="h-full max-w-4xl mx-auto">
            <RichTextEditor content={editorContent} onChange={handleEditorChange} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
