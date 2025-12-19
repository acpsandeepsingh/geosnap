// This file tells TypeScript that we can import assets with `?inline`.
// This is used for inlining assets like images as data URIs.
declare module '*?inline' {
  const content: any;
  export default content;
}
