
'use server';

import { detectPanicAndAlert, type DetectPanicAndAlertOutput } from '@/ai/flows/detect-panic-and-alert';

export async function runPanicDetection(videoDataUri: string): Promise<DetectPanicAndAlertOutput> {

  if (!videoDataUri || !videoDataUri.startsWith('data:image')) {
    // If we don't have a valid data URI, we can't call the AI.
    // This might happen on the first analysis run before the camera is ready.
    return {
      panicDetected: false,
      alertLevel: 'low',
      actionsTaken: [],
    };
  }

  try {
    const result = await detectPanicAndAlert({ videoDataUri });
    return result;
  } catch (error) {
    console.error('Error during panic detection:', error);
    // Return a default "safe" state if the AI fails, to avoid false alarms.
    return {
      panicDetected: false,
      alertLevel: 'low',
      actionsTaken: ['Error during analysis.'],
    };
  }
}
