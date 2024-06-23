import * as minecraftserveradmin from '@minecraft/server-admin'
export enum HttpRequestMethod {
  Delete = 'Delete',
  Get = 'Get',
  Head = 'Head',
  Post = 'Post',
  Put = 'Put',
}

export class HttpClient {
  cancelAll(reason: string) {}
  async get(uri: string): Promise<HttpResponse> {
    return new HttpResponse()
  }
  async request(config: HttpRequest): Promise<HttpResponse> {
    return new HttpResponse()
  }
}

export class HttpHeader {
  constructor(
    public key: string,
    public value: minecraftserveradmin.SecretString | string,
  ) {}
}

export class HttpRequest {
  body: string = ''
  headers: HttpHeader[] = []
  method: HttpRequestMethod = HttpRequestMethod.Get
  timeout: number = 5000

  constructor(public uri: string) {}

  addHeader(key: string, value: minecraftserveradmin.SecretString | string): HttpRequest {
    return this
  }
  setBody(body: string): HttpRequest {
    return this
  }
  setHeaders(headers: HttpHeader[]): HttpRequest {
    return this
  }
  setMethod(method: HttpRequestMethod): HttpRequest {
    return this
  }
  setTimeout(timeout: number): HttpRequest {
    return this
  }
}

export class HttpResponse {
  readonly body: string = ''
  readonly headers: HttpHeader[] = []
  readonly request: HttpRequest = new HttpRequest('')
  readonly status: number = 200
}

export const http: HttpClient = new HttpClient()
