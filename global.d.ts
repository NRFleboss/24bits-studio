// Declare module for Meyda to satisfy TypeScript
declare module 'meyda';

declare module 'next/image' {
  import React from 'react';
  const Image: React.ComponentType<any>;
  export default Image;
}
