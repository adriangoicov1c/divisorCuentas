// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

const _env = typeof import.meta !== 'undefined' ? (import.meta as any).env : (typeof process !== 'undefined' ? (process as any).env : {});

export const environment = {
  production: false,
  geminiApiKey: (_env.VITE_GEMINI_API_KEY ?? '') as string,
  azure: {
    endpoint: (_env.VITE_AZURE_OPENAI_ENDPOINT ?? '') as string,
    apiKey: (_env.VITE_AZURE_OPENAI_API_KEY ?? '') as string,
    deployment: (_env.VITE_AZURE_OPENAI_DEPLOYMENT ?? '') as string,
    apiVersion: (_env.VITE_AZURE_OPENAI_API_VERSION ?? '2024-04-01-preview') as string,
    model: (_env.VITE_AZURE_OPENAI_MODEL ?? '') as string,
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
