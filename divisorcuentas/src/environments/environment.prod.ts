const _env = typeof import.meta !== 'undefined' ? (import.meta as any).env : (typeof process !== 'undefined' ? (process as any).env : {});

export const environment = {
  production: true,
  geminiApiKey: (_env.VITE_GEMINI_API_KEY ?? '') as string,
  azure: {
    endpoint: (_env.VITE_AZURE_OPENAI_ENDPOINT ?? '') as string,
    apiKey: (_env.VITE_AZURE_OPENAI_API_KEY ?? '') as string,
    deployment: (_env.VITE_AZURE_OPENAI_DEPLOYMENT ?? '') as string,
    apiVersion: (_env.VITE_AZURE_OPENAI_API_VERSION ?? '') as string,
    model: (_env.VITE_AZURE_OPENAI_MODEL ?? '') as string,
  }
};
