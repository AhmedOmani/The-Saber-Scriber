import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { TitleBar } from '@/components/TitleBar';

interface WelcomeProps {
    onEnter: () => void;
}

export default function Welcome({ onEnter }: WelcomeProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div className="h-screen w-full bg-background relative overflow-hidden flex flex-col items-center justify-center text-foreground selection:bg-primary/20">
            <TitleBar className="absolute top-0 bg-transparent border-none" />

            {/* Ambient Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-full bg-dot-pattern opacity-30 pointer-events-none" />

            {/* Main Content Container */}
            <div className={`relative z-10 flex flex-col items-center max-w-2xl px-8 text-center transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

                {/* 
                    TODO: REPLACE LOGO
                    1. Add your logo image (e.g., 'logo.png') to the 'src/assets' folder.
                    2. Import it at the top of this file: 
                       import logo from '@/assets/logo.png';
                    3. Replace the <Sparkles /> icon below with: 
                       <img src={logo} alt="Saber Scribe Logo" className="h-24 w-24 object-contain" />
                */}
                {/* Logo Placeholder */}
                <div className="mb-12 relative group">
                    <div className="absolute -inset-4 bg-gradient-to-r from-primary to-indigo-600 rounded-full opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500" />
                    <div className="relative h-32 w-32 bg-gradient-to-br from-background to-muted rounded-3xl border border-border/50 shadow-2xl flex items-center justify-center transform group-hover:scale-105 transition-transform duration-500">
                        <Sparkles className="h-16 w-16 text-primary animate-pulse" />
                    </div>
                </div>

                {/* Greeting */}
                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60">
                    Welcome, <br />
                    <span className="text-primary">Mr. Saber</span>
                </h1>

                <p className="text-xl text-muted-foreground mb-12 max-w-lg leading-relaxed">
                    Your personal AI-powered studio for crafting exceptional English teaching materials.
                </p>

                {/* Enter Button */}
                <Button
                    size="lg"
                    onClick={onEnter}
                    className="h-14 px-10 rounded-full text-lg font-medium shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-all duration-300 group bg-primary text-primary-foreground"
                >
                    Enter Studio
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>

                {/* Footer */}
                <div className="mt-24 text-sm text-muted-foreground/40 font-mono">
                    v1.0.0 • The Saber Scribe
                </div>
            </div>
        </div>
    );
}
