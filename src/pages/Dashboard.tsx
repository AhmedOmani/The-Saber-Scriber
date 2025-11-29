import { useState, useEffect } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, BookOpen, Clock, ArrowRight } from 'lucide-react';

export default function Dashboard() {
    const { workspaces, addWorkspace, setCurrentWorkspace, loadWorkspaces } = useWorkspaceStore();
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        loadWorkspaces();
    }, [loadWorkspaces]);

    const handleCreateWorkspace = () => {
        if (!newWorkspaceName.trim()) return;
        addWorkspace({
            name: newWorkspaceName,
            description: 'New English teaching workspace',
        });
        setNewWorkspaceName('');
        setIsDialogOpen(false);
    };

    return (
        <div className="container mx-auto p-8 max-w-6xl">
            <header className="mb-12 flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">The Saber Scribe</h1>
                    <p className="text-lg text-slate-500 mt-2">Manage your English teaching materials with AI.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="gap-2">
                            <Plus className="h-5 w-5" /> New Workspace
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Workspace</DialogTitle>
                            <DialogDescription>
                                Give your new workspace a name (e.g., "Grade 10 - Past Tense").
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <Input
                                placeholder="Workspace Name"
                                value={newWorkspaceName}
                                onChange={(e) => setNewWorkspaceName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
                            />
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateWorkspace}>Create Workspace</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </header>

            {workspaces.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <div className="bg-white p-4 rounded-full inline-block mb-4 shadow-sm">
                        <BookOpen className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900">No workspaces yet</h3>
                    <p className="text-slate-500 mt-2 max-w-md mx-auto">
                        Create your first workspace to start generating quizzes, vocabulary lists, and more.
                    </p>
                    <Button variant="outline" className="mt-6" onClick={() => setIsDialogOpen(true)}>
                        Create Workspace
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workspaces.map((workspace) => (
                        <Card key={workspace.id} className="group hover:shadow-lg transition-all duration-200 border-slate-200 hover:border-primary/50 cursor-pointer" onClick={() => setCurrentWorkspace(workspace.id)}>
                            <CardHeader>
                                <CardTitle className="flex justify-between items-start">
                                    <span className="truncate">{workspace.name}</span>
                                </CardTitle>
                                <CardDescription>{workspace.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center text-sm text-slate-500 gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>Modified {new Date(workspace.lastModified).toLocaleDateString()}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-slate-50/50 group-hover:bg-slate-50 transition-colors border-t border-slate-100">
                                <Button variant="ghost" className="w-full justify-between group-hover:text-primary">
                                    Open Workspace <ArrowRight className="h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
