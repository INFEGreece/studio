
'use server';
/**
 * @fileOverview A Genkit flow that identifies a song's YouTube link based on artist and title.
 *
 * - identifyYouTubeLink - A function that suggests a YouTube URL for a song.
 * - YouTubeLinkerInput - The input type for the identifyYouTubeLink function.
 * - YouTubeLinkerOutput - The return type for the identifyYouTubeLink function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const YouTubeLinkerInputSchema = z.object({
  artist: z.string().describe('The artist of the song.'),
  songTitle: z.string().describe('The title of the song.'),
  year: z.number().describe('The year the song competed in Eurovision.'),
});
export type YouTubeLinkerInput = z.infer<typeof YouTubeLinkerInputSchema>;

const YouTubeLinkerOutputSchema = z.object({
  videoUrl: z.string().url().describe('The likely YouTube video URL or search URL.'),
  explanation: z.string().describe('Briefly explains why this link was chosen.'),
});
export type YouTubeLinkerOutput = z.infer<typeof YouTubeLinkerOutputSchema>;

export async function identifyYouTubeLink(input: YouTubeLinkerInput): Promise<YouTubeLinkerOutput> {
  return youtubeLinkerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'youtubeLinkerPrompt',
  input: {schema: YouTubeLinkerInputSchema},
  output: {schema: YouTubeLinkerOutputSchema},
  prompt: `You are a Eurovision video archivist. Your goal is to provide the official YouTube link for the following Eurovision entry. 
  
  If you are 100% certain of the official Eurovision.tv or artist video ID, provide the full URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID).
  If you are not 100% certain, generate a specific YouTube search URL for the official performance: https://www.youtube.com/results?search_query=Eurovision+{{year}}+{{artist}}+{{songTitle}}+official
  
  Artist: {{{artist}}}
  Song Title: {{{songTitle}}}
  Year: {{{year}}}
  
  Return the URL and a short explanation in Greek.`,
});

const youtubeLinkerFlow = ai.defineFlow(
  {
    name: 'youtubeLinkerFlow',
    inputSchema: YouTubeLinkerInputSchema,
    outputSchema: YouTubeLinkerOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
