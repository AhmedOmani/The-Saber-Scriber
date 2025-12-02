import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';

// Dynamic Model Creator
export const getModel = () => {
    const storedKey = localStorage.getItem('gemini_api_key');
    const envKey = import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY;

    // Prioritize stored key, then env key
    const apiKey = storedKey || envKey;

    if (!apiKey || apiKey === 'your_gemini_key_here') {
        console.warn("No valid API key found.");
        // Return a dummy or handle error gracefully in UI
        const google = createGoogleGenerativeAI({ apiKey: '' });
        return google('gemini-1.5-pro-latest');
    }

    const google = createGoogleGenerativeAI({ apiKey });
    return google('gemini-1.5-pro-latest');
};

export const model = getModel(); // Keep for backward compatibility, but prefer getModel() in new code

export type GeneratorType = 'quiz' | 'vocab' | 'grammar' | 'reading' | 'listening';

export const GENERATORS: { id: GeneratorType; name: string; description: string; prompt: string; system: string }[] = [
    {
        id: 'quiz',
        name: 'Quiz Generator',
        description: 'Create multiple-choice quizzes from a topic or text.',
        prompt: 'Generate a 5-question multiple choice quiz about the following topic or text. Include the answer key at the end.',
        system: 'You are an expert ESL (English as a Second Language) teacher with 25 years of experience. Your goal is to create clear, accurate, and level-appropriate multiple-choice quizzes. Ensure distractors (wrong answers) are plausible but clearly incorrect. Format the output clearly with the question, options (A, B, C, D), and mark the correct answer.',
    },
    {
        id: 'vocab',
        name: 'Vocabulary List',
        description: 'Generate a list of words with definitions and examples.',
        prompt: 'Create a vocabulary list with definitions, part of speech, and example sentences for the following topic or text.',
        system: 'You are a vocabulary specialist for English learners. Create comprehensive vocabulary lists. For each word, provide: 1) Part of Speech, 2) A simple, clear definition suitable for learners, 3) A natural example sentence. Organize the output in a clean Markdown table or list.',
    },
    {
        id: 'grammar',
        name: 'Grammar Exercises',
        description: 'Create gap-fill or sentence transformation exercises.',
        prompt: 'Create 10 grammar exercises (gap-fill) focusing on the following grammar point or text context.',
        system: 'You are a grammar instruction expert. Create engaging and context-rich grammar exercises. Avoid isolated, meaningless sentences. Try to create a cohesive story or theme if possible. Provide the answer key at the bottom.',
    },
    {
        id: 'reading',
        name: 'Reading Comprehension',
        description: 'Generate a short story with comprehension questions.',
        prompt: 'Write a short reading passage (approx 200-300 words) and 5 comprehension questions about it based on the following topic.',
        system: 'You are a creative writer for educational materials. Write engaging, culturally diverse, and age-appropriate reading passages. Ensure the language level is consistent (Intermediate/B1-B2 unless specified otherwise). Follow the passage with open-ended or multiple-choice comprehension questions that test understanding, not just memory.',
    },
    {
        id: 'listening',
        name: 'Listening Script',
        description: 'Generate a dialogue or monologue for listening practice.',
        prompt: 'Write a listening script (dialogue or monologue) about the following topic. Indicate speakers clearly (e.g., Speaker A, Speaker B).',
        system: 'You are an expert in creating ESL listening materials. Write natural-sounding dialogues or monologues. Include "audio cues" in parentheses if necessary (e.g., [Sound of door opening]). Ensure the vocabulary is appropriate for learners. If it is a dialogue, make the interaction natural.',
    },
];

export const REFINE_INSTRUCTIONS = {
    simplify: "Rewrite the following text to be simpler and easier to understand for ESL learners. Use simpler vocabulary and shorter sentences.",
    harden: "Rewrite the following text to be more advanced and academic. Use more complex vocabulary and sentence structures.",
    grammar: "Correct any grammar, spelling, or punctuation errors in the following text. Do not change the meaning or style significantly.",
    expand: "Expand on the following text, adding more details, examples, and depth. Keep the tone consistent.",
    shorten: "Summarize the following text, making it more concise while keeping the key information.",
};

