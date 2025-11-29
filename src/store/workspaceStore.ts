import { create } from 'zustand';

export interface Workspace {
    id: string;
    name: string;
    description: string;
    content: string; // Added content field
    createdAt: string;
    lastModified: string;
}

interface WorkspaceState {
    workspaces: Workspace[];
    currentWorkspaceId: string | null;
    loadWorkspaces: () => Promise<void>;
    addWorkspace: (workspace: Omit<Workspace, 'id' | 'createdAt' | 'lastModified' | 'content'>) => Promise<void>;
    updateWorkspaceContent: (id: string, content: string) => Promise<void>;
    setCurrentWorkspace: (id: string) => void;
    deleteWorkspace: (id: string) => Promise<void>;
}

// Helper to invoke IPC
// @ts-ignore
const ipc = window.require ? window.require('electron').ipcRenderer : null;

export const useWorkspaceStore = create<WorkspaceState>()(
    (set) => ({
        workspaces: [],
        currentWorkspaceId: null,

        loadWorkspaces: async () => {
            if (!ipc) return;
            try {
                const result = await ipc.invoke('load-workspaces');
                if (result.success) {
                    set({ workspaces: result.workspaces });
                }
            } catch (error) {
                console.error("Failed to load workspaces:", error);
            }
        },

        addWorkspace: async (workspace: Omit<Workspace, 'id' | 'createdAt' | 'lastModified' | 'content'>) => {
            const newWorkspace: Workspace = {
                ...workspace,
                id: crypto.randomUUID(),
                content: '',
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString(),
            };

            set((state) => ({
                workspaces: [newWorkspace, ...state.workspaces],
                currentWorkspaceId: newWorkspace.id,
            }));

            if (ipc) {
                ipc.invoke('save-workspace', newWorkspace);
            }
        },

        updateWorkspaceContent: async (id: string, content: string) => {
            set((state) => {
                const updatedWorkspaces = state.workspaces.map((w) =>
                    w.id === id ? { ...w, content, lastModified: new Date().toISOString() } : w
                );

                const updatedWorkspace = updatedWorkspaces.find(w => w.id === id);
                if (updatedWorkspace && ipc) {
                    ipc.invoke('save-workspace', updatedWorkspace);
                }

                return { workspaces: updatedWorkspaces };
            });
        },

        setCurrentWorkspace: (id: string) => set({ currentWorkspaceId: id }),

        deleteWorkspace: async (id: string) => {
            set((state) => ({
                workspaces: state.workspaces.filter((w) => w.id !== id),
                currentWorkspaceId: state.currentWorkspaceId === id ? null : state.currentWorkspaceId,
            }));

            if (ipc) {
                ipc.invoke('delete-workspace', id);
            }
        },
    })
);
