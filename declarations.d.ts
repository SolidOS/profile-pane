/// <reference types="jest" />

declare module '*.ttl' {
  const content: string;
  export default content;
}

declare module '*.css';

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}
