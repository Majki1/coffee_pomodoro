'use server';
/**
 * @fileOverview Fetches an inspirational quote for display during rest periods.
 *
 * - getInspirationalQuote - A function that retrieves an inspirational quote.
 * - InspirationalQuoteInput - The input type for the getInspirationalQuote function (currently empty).
 * - InspirationalQuoteOutput - The return type for the getInspirationalQuote function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InspirationalQuoteInputSchema = z.object({});
export type InspirationalQuoteInput = z.infer<typeof InspirationalQuoteInputSchema>;

const InspirationalQuoteOutputSchema = z.object({
  quote: z.string().describe('An inspirational quote about productivity.'),
});
export type InspirationalQuoteOutput = z.infer<typeof InspirationalQuoteOutputSchema>;

export async function getInspirationalQuote(
  input: InspirationalQuoteInput
): Promise<InspirationalQuoteOutput> {
  return inspirationalQuoteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'inspirationalQuotePrompt',
  input: {schema: InspirationalQuoteInputSchema},
  output: {schema: InspirationalQuoteOutputSchema},
  prompt: `You are a productivity guru. Generate an inspirational quote about productivity, focus, or taking breaks.`,
});

const inspirationalQuoteFlow = ai.defineFlow(
  {
    name: 'inspirationalQuoteFlow',
    inputSchema: InspirationalQuoteInputSchema,
    outputSchema: InspirationalQuoteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
