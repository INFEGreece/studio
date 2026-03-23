
'use server';
/**
 * @fileOverview A Genkit flow that identifies a song's Spotify link based on artist and title.
 *
 * - identifySpotifyLink - A function that suggests a Spotify URL for a song.
 * - SpotifyLinkerInput - The input type for the identifySpotifyLink function.
 * - SpotifyLinkerOutput - The return type for the identifySpotifyLink function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpotifyLinkerInputSchema = z.object({
  artist: z.string().describe('The artist of the song.'),
  songTitle: z.string().describe('The title of the song.'),
  year: z.number().describe('The year the song was released.'),
});
export type SpotifyLinkerInput = z.infer<typeof SpotifyLinkerInputSchema>;

const SpotifyLinkerOutputSchema = z.object({
  spotifyUrl: z.string().url().describe('The likely Spotify track URL or search URL.'),
  explanation: z.string().describe('Briefly explains why this link was chosen or generated.'),
});
export type SpotifyLinkerOutput = z.infer<typeof SpotifyLinkerOutputSchema>;

export async function identifySpotifyLink(input: SpotifyLinkerInput): Promise<SpotifyLinkerOutput> {
  return spotifyLinkerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'spotifyLinkerPrompt',
  input: {schema: SpotifyLinkerInputSchema},
  output: {schema: SpotifyLinkerOutputSchema},
  prompt: `You are an expert music archivist. Your goal is to provide a functional Spotify link for the following Eurovision song. 
  
  If you can identify the exact Spotify URL, provide it. 
  If you are not 100% certain, generate a Spotify search URL in this format: https://open.spotify.com/search/{{artist}}%20{{songTitle}}%20{{year}}
  
  Artist: {{{artist}}}
  Song Title: {{{songTitle}}}
  Year: {{{year}}}
  
  Return the URL and a short explanation.`,
});

const spotifyLinkerFlow = ai.defineFlow(
  {
    name: 'spotifyLinkerFlow',
    inputSchema: SpotifyLinkerInputSchema,
    outputSchema: SpotifyLinkerOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
