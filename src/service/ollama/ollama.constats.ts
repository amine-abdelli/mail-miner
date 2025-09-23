export enum EOllamaModel {
  Mistral = 'mistral:7b',
  Qwen = 'Qwen2.5:7b',
  Llama = 'llama3.2:3b',
}

export const DEFAULT_OLLAMA_MODEL = EOllamaModel.Qwen;

export const LOCAL_OLLAMA_API_URL = 'http://localhost:11434/api/generate';