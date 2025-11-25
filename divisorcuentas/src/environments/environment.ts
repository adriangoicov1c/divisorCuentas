// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

// Protegemos el acceso a import.meta.env: en algunos WebViews import.meta existe
// pero import.meta.env puede ser undefined. Usar `?? {}` evita que _env sea undefined.
const _env =
  typeof import.meta !== 'undefined'
    ? ((import.meta as any).env ?? {})
    : typeof process !== 'undefined'
    ? (process as any).env
    : {};

export const environment = {
  production: false,
  
  azure: {
    endpoint: "https://adria-mi7zki2g-eastus2.cognitiveservices.azure.com/",
    apiKey: "6OZ1lONsrdQbIhTW2aSvz6iSXuoLlOvun3Pe34jeJZMF6hh6mIzQJQQJ99BKACHYHv6XJ3w3AAAAACOGFrqS",
    deployment: "gpt-5.1-chat",
    apiVersion: "2024-04-01-preview",
    model: "gpt-5.1-chat",
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
