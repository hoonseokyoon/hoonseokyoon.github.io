declare global {
  namespace App {}
}

declare module '*.yml?raw' {
  const raw: string;
  export default raw;
}

export {};
