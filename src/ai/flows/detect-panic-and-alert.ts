
'use server';
/**
 * @fileOverview This file defines a Genkit flow for detecting panic or distress in a video frame and triggering appropriate alerts.
 *
 * - detectPanicAndAlert -  detects panic in a video stream and triggers alerts.
 * - DetectPanicAndAlertInput - The input type for the detectPanicAndAlert function.
 * - DetectPanicAndAlertOutput - The return type for the detectPanicAndAlert function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectPanicAndAlertInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A single video frame as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DetectPanicAndAlertInput = z.infer<typeof DetectPanicAndAlertInputSchema>;

const DetectPanicAndAlertOutputSchema = z.object({
  panicDetected: z.boolean().describe('Whether panic, distress, or danger is detected in the image.'),
  alertLevel: z
    .enum(['low', 'medium', 'high'])
    .describe('The level of alert based on the detected situation. "low" means no danger.'),
  actionsTaken: z
    .array(z.string())
    .describe('A list of recommended actions based on the detected situation. If no panic is detected, this should be an empty array.'),
});
export type DetectPanicAndAlertOutput = z.infer<typeof DetectPanicAndAlertOutputSchema>;

export async function detectPanicAndAlert(input: DetectPanicAndAlertInput): Promise<DetectPanicAndAlertOutput> {
  return detectPanicAndAlertFlow(input);
}

const panicDetectionPrompt = ai.definePrompt({
  name: 'panicDetectionPrompt',
  input: {schema: DetectPanicAndAlertInputSchema},
  output: {schema: DetectPanicAndAlertOutputSchema},
  prompt: `You are an AI safety assistant. Your task is to analyze an image from a user's video feed and determine if they are in a situation that indicates panic, distress, or immediate danger.

  Analyze the provided image. Look for contextual clues like menacing figures, signs of a struggle, accidents, fires, or expressions of fear.

  - If you detect a clear and immediate danger (e.g., a visible weapon, a car accident, a fire), set 'panicDetected' to true and 'alertLevel' to 'high'. Recommended actions could include "share_alert_with_authorities" and "initiate_recording".
  - If the situation is ambiguous but potentially concerning (e.g., arguing, someone crying, being followed in a dark alley), set 'panicDetected' to true and 'alertLevel' to 'medium'. Recommended actions could be "take_screenshot" and "initiate_recording".
  - If the image shows a normal, everyday scene with no signs of distress, set 'panicDetected' to false and 'alertLevel' to 'low'. The 'actionsTaken' array should be empty.

  Image from video feed: {{media url=videoDataUri}}
  `,
});

const detectPanicAndAlertFlow = ai.defineFlow(
  {
    name: 'detectPanicAndAlertFlow',
    inputSchema: DetectPanicAndAlertInputSchema,
    outputSchema: DetectPanicAndAlertOutputSchema,
  },
  async (input): Promise<DetectPanicAndAlertOutput> => {
    // If the input is empty, return a safe default with explicit types.
    if (!input.videoDataUri) {
      return {
        panicDetected: false,
        alertLevel: 'low' as const,
        actionsTaken: [] as string[],
      } as DetectPanicAndAlertOutput;
    }
    const {output} = await panicDetectionPrompt(input);

    // Validate and narrow the output using the Zod schema to ensure correct types
    // This will throw at runtime if the prompt output doesn't match the schema, which is desirable
    // to avoid returning an object with wrong types into the flow.
    const parsed = DetectPanicAndAlertOutputSchema.parse(output as unknown) as DetectPanicAndAlertOutput;
    return parsed;
  }
) as any;
