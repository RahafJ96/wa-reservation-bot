import dotenv from 'dotenv';
import { analyzeUserMessage } from './gemini-start';

dotenv.config();

async function run() {
  try {
    const message =
      'I want to book a table after two days from today at 4pm for 2 people under the name Rahaf';
    console.log('User message:', message);

    const result = await analyzeUserMessage(message);

    console.log('Helper result from Gemini:');
    console.dir(result, { depth: null });
  } catch (error) {
    console.error('Error testing Gemini:', error);
  }
}

run();
