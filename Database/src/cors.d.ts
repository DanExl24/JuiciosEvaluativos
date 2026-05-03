declare module 'cors' {
  import type { RequestHandler } from 'express'

  interface CorsOptions {
    origin?: boolean | string | RegExp | Array<boolean | string | RegExp>
    credentials?: boolean
    methods?: string | string[]
    allowedHeaders?: string | string[]
    exposedHeaders?: string | string[]
  }

  function cors(options?: CorsOptions): RequestHandler

  export default cors
}
