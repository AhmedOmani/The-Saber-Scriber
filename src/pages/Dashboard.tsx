import { useState, useEffect } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Clock, ArrowRight, Trash2 } from 'lucide-react';

export default function Dashboard() {
    const { workspaces, addWorkspace, setCurrentWorkspace, loadWorkspaces, deleteWorkspace } = useWorkspaceStore();
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

    const handleDeleteWorkspace = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this workspace?')) {
            deleteWorkspace(id);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground bg-dot-pattern relative">
            {/* Ambient background glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />

            <div className="max-w-6xl mx-auto p-10 relative z-10">
                <header className="mb-16 flex justify-between items-center relative">
                    <div>
                        <h1 className="text-6xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 drop-shadow-sm">
                            The Saber Scribe
                        </h1>
                        <p className="text-xl text-muted-foreground mt-3 font-light tracking-wide">
                            Manage your English teaching materials with AI.
                        </p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="lg" className="gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:scale-105 rounded-full px-6">
                                <Plus className="h-5 w-5" /> New Workspace
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] border-border/60 shadow-2xl">
                            <DialogHeader>
                                <DialogTitle>Create New Workspace</DialogTitle>
                                <DialogDescription>
                                    Give your new workspace a name (e.g., "Grade 10 - Past Tense").
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Workspace Name</Label>
                                    <Input
                                        id="name"
                                        value={newWorkspaceName}
                                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                                        placeholder="Enter name..."
                                        className="col-span-3"
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateWorkspace} disabled={!newWorkspaceName.trim()}>
                                    Create Workspace
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </header>

                {workspaces.length === 0 ? (
                    <div className="text-center py-24 border-2 border-dashed border-border/60 rounded-3xl bg-card/30 backdrop-blur-sm">
                        <div className="bg-primary/10 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                            <Plus className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-2xl font-semibold text-foreground">No workspaces yet</h3>
                        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                            Create your first workspace to start generating quizzes, vocabulary lists, and more.
                        </p>
                        <Button
                            variant="link"
                            onClick={() => setIsDialogOpen(true)}
                            className="mt-6 text-primary font-semibold text-lg"
                        >
                            Create one now &rarr;
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {workspaces.map((workspace) => (
                            <Card
                                key={workspace.id}
                                className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 border-border/60 hover:border-primary/40 cursor-pointer bg-card/60 backdrop-blur-md overflow-hidden relative"
                                onClick={() => setCurrentWorkspace(workspace.id)}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <CardHeader className="relative z-10">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors duration-300">
                                            {workspace.name}
                                        </CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10 -mt-2 -mr-2"
                                            onClick={(e) => handleDeleteWorkspace(e, workspace.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <CardDescription className="line-clamp-2 mt-2 text-sm">
                                        {workspace.description || "New English teaching workspace"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="flex items-center text-xs text-muted-foreground mt-4 font-medium">
                                        <Clock className="mr-1.5 h-3.5 w-3.5" />
                                        Modified {new Date(workspace.lastModified).toLocaleDateString()}
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-muted/30 p-4 flex justify-between items-center group-hover:bg-primary/5 transition-colors duration-300 relative z-10">
                                    <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">Open Workspace</span>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
