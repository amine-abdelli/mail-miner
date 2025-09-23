import { getPrompt } from "./ollama.utils";
import { ExtractedContactInfo as ExtractedContactData } from "../msg/msg.type";

interface OllamaResponse {
  /**
   * Interface principale pour la réponse de l'API Ollama
   */
  // Modèle utilisé
  model: string;

  // Timestamp de création
  created_at: string;

  // Réponse du modèle (JSON stringifié contenant ExtractedData)
  response: string;

  // État de complétion
  done: boolean;

  // Raison de fin de génération
  done_reason: 'stop' | 'length' | 'abort' | string;

  // Contexte (tokens)
  context: number[];

  // Métriques de performance
  total_duration: number;
  load_duration: number;
  prompt_eval_count: number;
  prompt_eval_duration: number;
  eval_count: number;
  eval_duration: number;
}

export async function askOllamaMistral(objectToAnalyze: string): Promise<ExtractedContactData | null> {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral:7b',
        prompt: getPrompt(objectToAnalyze),
        stream: false
      })
    });
    console.log('response ====', response)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as OllamaResponse;
    try {
      const parsedResponse: ExtractedContactData = JSON.parse(data.response);
      return parsedResponse;
    } catch (parseError) {
      console.error('Error parsing Ollama response as JSON:', parseError);
      console.error('Raw response:', data.response);
      return null;
    }

  } catch (error) {
    console.error('Error calling Ollama API:', error);
    return null;
  }
}