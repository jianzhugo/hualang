interface Artwork {
  key: string
  uploader: string
  author: string
  title: string
  date: string
  createdDate?: string
  tags?: string[]
}

interface MetadataFile {
  artworks: Artwork[]
}

interface Env {
  GALLERY_BUCKET: R2Bucket
  UPLOAD_PASSWORDS: string
  CORS_ORIGIN: string
}

function corsHeaders(env: Env, requestOrigin: string = ''): HeadersInit {
  const allowedOrigins = (env.CORS_ORIGIN || '*').split(',').map(o => o.trim())
  let origin = '*'
  if (allowedOrigins.length > 1 || (allowedOrigins[0] !== '*' && allowedOrigins[0] !== '')) {
    if (allowedOrigins.includes(requestOrigin)) {
      origin = requestOrigin
    } else {
      origin = allowedOrigins[0]
    }
  }
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  }
}

function errorResponse(code: number, message: string, env: Env, requestOrigin: string = ''): Response {
  return new Response(JSON.stringify({ code, message }), {
    status: code >= 500 ? 500 : code,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(env, requestOrigin)
    }
  })
}

function jsonResponse(data: unknown, env: Env, status = 200, requestOrigin: string = ''): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(env, requestOrigin)
    }
  })
}

async function handleToken(request: Request, env: Env, origin: string): Promise<Response> {
  try {
    const body: { password: string } = await request.json()
    const passwords = (env.UPLOAD_PASSWORDS || '').split(',').map(p => p.trim()).filter(p => p)
    
    if (passwords.length === 0) {
      return errorResponse(500, 'UPLOAD_PASSWORDS not configured', env, origin)
    }
    
    if (!passwords.includes(body.password)) {
      return errorResponse(403, 'Invalid password', env, origin)
    }

    const key = `${Date.now()}-${crypto.randomUUID()}.webp`
    const headers: Record<string, string> = { 'Content-Type': 'image/webp' }

    try {
      const presignedUrl = await env.GALLERY_BUCKET.createPresignedUpload(key, {
        expiresInSeconds: 3600,
        httpHeaders: { 'Content-Type': 'image/webp' }
      })
      return jsonResponse({
        url: presignedUrl.url,
        headers,
        key
      }, env, 200, origin)
    } catch (presignError) {
      console.error('Failed to create presigned URL:', presignError)
      return errorResponse(500, 'Failed to create upload token', env, origin)
    }
  } catch (e) {
    return errorResponse(500, 'Failed to generate upload token', env, origin)
  }
}

async function handleRegister(request: Request, env: Env, origin: string): Promise<Response> {
  try {
    const body: { key: string; uploader: string; author: string; title?: string; date?: string; createdDate?: string; tags?: string[] } = await request.json()
    const maxRetries = 3

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const existingObj = await env.GALLERY_BUCKET.get('metadata.json')
      let metadata: MetadataFile
      let etag: string

      if (existingObj) {
        const text = await existingObj.text()
        metadata = JSON.parse(text)
        etag = existingObj.httpEtag
      } else {
        metadata = { artworks: [] }
        etag = ''
      }

      const newArtwork: Artwork = {
        key: body.key,
        uploader: body.uploader,
        author: body.author,
        title: body.title || body.key.replace('.webp', ''),
        date: body.date || new Date().toISOString().split('T')[0],
        ...(body.createdDate && { createdDate: body.createdDate }),
        tags: body.tags || []
      }

      metadata.artworks.push(newArtwork)

      const putOptions: R2PutOptions = {}
      if (etag) {
        putOptions.onlyIf = { etagMatches: etag }
      }

      try {
        await env.GALLERY_BUCKET.put('metadata.json', JSON.stringify(metadata), putOptions)
        return jsonResponse({ success: true }, env, 200, origin)
      } catch (putError: unknown) {
        const err = putError as { code?: string; message?: string }
        if (attempt < maxRetries - 1 && (err.code === 'ConditionalCheckFailed' || err.message?.includes('etag'))) {
          await new Promise(r => setTimeout(r, Math.random() * 1000))
          continue
        }
        if (attempt === maxRetries - 1) {
          return errorResponse(409, 'Metadata conflict, please try again', env, origin)
        }
        throw putError
      }
    }

    return errorResponse(409, 'Metadata conflict, please try again', env, origin)
  } catch (e) {
    return errorResponse(500, 'Failed to register artwork', env, origin)
  }
}

async function handleList(request: Request, env: Env, origin: string): Promise<Response> {
  try {
    const obj = await env.GALLERY_BUCKET.get('metadata.json')
    
    if (!obj) {
      return jsonResponse({ artworks: [] }, env, 200, origin)
    }

    const text = await obj.text()
    const metadata: MetadataFile = JSON.parse(text)
    
    metadata.artworks.sort((a, b) => b.date.localeCompare(a.date))

    return jsonResponse({ artworks: metadata.artworks }, env, 200, origin)
  } catch (e) {
    return errorResponse(500, 'Read failed', env, origin)
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const pathname = url.pathname
    const method = request.method
    const origin = request.headers.get('Origin') || ''

    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(env, origin)
      })
    }

    if (method === 'POST' && pathname === '/api/token') {
      return handleToken(request, env, origin)
    }

    if (method === 'POST' && pathname === '/api/register') {
      return handleRegister(request, env, origin)
    }

    if (method === 'GET' && pathname === '/api/list') {
      return handleList(request, env, origin)
    }

    return errorResponse(404, 'Not found', env, origin)
  }
}
