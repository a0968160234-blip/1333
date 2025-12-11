// Replaced vite/client reference to avoid type definition errors in this environment
// and explicitly defined process.env.API_KEY as required by the application guidelines.

declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    [key: string]: string | undefined;
  }
}
