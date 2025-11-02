/// <reference types="react" />

// Type declarations for @react-email/render
declare module '@react-email/render' {
  import type { ReactNode } from 'react'
  
  export interface RenderOptions {
    pretty?: boolean
    plainText?: boolean
    htmlToTextOptions?: Record<string, unknown>
  }
  
  export function render(node: ReactNode, options?: RenderOptions): Promise<string>
  export function pretty(str: string, options?: Record<string, unknown>): Promise<string>
  export function toPlainText(html: string, options?: Record<string, unknown>): string
}

