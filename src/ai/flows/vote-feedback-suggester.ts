'use server';
/**
 * @fileOverview A Genkit flow that suggests potential reasons for a user's Eurovision vote.
 *
 * - suggestVoteFeedback - A function that handles the feedback suggestion process.
 * - VoteFeedbackSuggesterInput - The input type for the suggestVoteFeedback function.
 * - VoteFeedbackSuggesterOutput - The return type for the suggestVoteFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VoteFeedbackSuggesterInputSchema = z.object({
  entry: z.object({
    title: z.string().describe('The title of the Eurovision song entry.'),
    artist: z.string().describe('The artist of the Eurovision song entry.'),
    country: z.string().describe('The country represented by the entry.'),
    year: z.number().describe('The year the entry competed.'),
  }).describe('Details of the Eurovision entry.'),
  score: z.number().min(0).max(12).describe('The score (0-12 points) given by the user for this entry.'),
});
export type VoteFeedbackSuggesterInput = z.infer<typeof VoteFeedbackSuggesterInputSchema>;

const VoteFeedbackSuggesterOutputSchema = z.object({
  suggestion: z.string().describe('A concise, descriptive reason for the user\'s vote.'),
});
export type VoteFeedbackSuggesterOutput = z.infer<typeof VoteFeedbackSuggesterOutputSchema>;

export async function suggestVoteFeedback(input: VoteFeedbackSuggesterInput): Promise<VoteFeedbackSuggesterOutput> {
  return voteFeedbackSuggesterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'voteFeedbackPrompt',
  input: {schema: VoteFeedbackSuggesterInputSchema},
  output: {schema: VoteFeedbackSuggesterOutputSchema},
  prompt: `You are an AI assistant specialized in Eurovision analysis. Given the details of a Eurovision entry and the score a user gave it, suggest a concise and descriptive reason for why the user might have given that score. Focus on aspects like vocals, staging, melody, lyrics/message, or overall performance. The suggestion should be suitable for qualitative feedback, maximum of two sentences.\n\nEntry Details:\nTitle: {{{entry.title}}}\nArtist: {{{entry.artist}}}\nCountry: {{{entry.country}}}\nYear: {{{entry.year}}}\nUser\'s Score: {{{score}}}\n\nSuggest a reason for this vote:`,
});

const voteFeedbackSuggesterFlow = ai.defineFlow(
  {
    name: 'voteFeedbackSuggesterFlow',
    inputSchema: VoteFeedbackSuggesterInputSchema,
    outputSchema: VoteFeedbackSuggesterOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
