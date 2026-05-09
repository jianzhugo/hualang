interface Artwork {
  key: string
  uploader: string
  title: string
  date: string
}

interface MetadataFile {
  artworks: Artwork[]
}

interface Env {
  GALLERY_BUCKET: R2Bucket
  UPLOAD_PASSWORDS: string
  CORS_ORIGIN: string
}

function corsHeaders(env: Env): HeadersInit {
  return {
    'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  }
}

function errorResponse(code: number, message: string, env: Env): Response {
  return new Response(JSON.stringify({ code, message }), {
    status: code >= 500 ? 500 : code,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(env)
    }
  })
}

function jsonResponse(data: unknown, env: Env, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(env)
    }
  })
}

async function handleToken(request: Request, env: Env): Promise<Response> {
  try {
    const body: { password: string } = await request.json()
    const passwords = (env.UPLOAD_PASSWORDS || '').split(',').map(p => p.trim()).filter(p => p)
    
    if (passwords.length === 0) {
      return errorResponse(500, 'UPLOAD_PASSWORDS not configured', env)
    }
    
    if (!passwords.includes(body.password)) {
      return errorResponse(403, 'Invalid password', env)
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
      }, env)
    } catch (presignError) {
      // 预签名失败时返回错误
      console.error('Failed to create presigned URL:', presignError)
      return errorResponse(500, 'Failed to create upload token', env)
    }
  } catch (e) {
    return errorResponse(500, 'Failed to generate upload token', env)
  }
}

async function handleRegister(request: Request, env: Env): Promise<Response> {
  try {
    const body: { key: string; uploader: string; title?: string; date?: string } = await request.json()
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
        title: body.title || body.key.replace('.webp', ''),
        date: body.date || new Date().toISOString().split('T')[0]
      }

      metadata.artworks.push(newArtwork)

      const putOptions: R2PutOptions = {}
      if (etag) {
        putOptions.onlyIf = { etagMatches: etag }
      }

      try {
        await env.GALLERY_BUCKET.put('metadata.json', JSON.stringify(metadata), putOptions)
        return jsonResponse({ success: true }, env)
      } catch (putError: unknown) {
        const err = putError as { code?: string; message?: string }
        if (attempt < maxRetries - 1 && (err.code === 'ConditionalCheckFailed' || err.message?.includes('etag'))) {
          await new Promise(r => setTimeout(r, Math.random() * 1000))
          continue
        }
        if (attempt === maxRetries - 1) {
          return errorResponse(409, 'Metadata conflict, please try again', env)
        }
        throw putError
      }
    }

    return errorResponse(409, 'Metadata conflict, please try again', env)
  } catch (e) {
    return errorResponse(500, 'Failed to register artwork', env)
  }
}

async function handleList(request: Request, env: Env): Promise<Response> {
  try {
    const obj = await env.GALLERY_BUCKET.get('metadata.json')
    
    if (!obj) {
      return jsonResponse({ artworks: [] }, env)
    }

    const text = await obj.text()
    const metadata: MetadataFile = JSON.parse(text)
    
    metadata.artworks.sort((a, b) => b.date.localeCompare(a.date))

    return jsonResponse({ artworks: metadata.artworks }, env)
  } catch (e) {
    return errorResponse(500, 'Read failed', env)
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const pathname = url.pathname
    const method = request.method

    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(env)
      })
    }

    if (method === 'POST' && pathname === '/api/token') {
      return handleToken(request, env)
    }

    if (method === 'POST' && pathname === '/api/register') {
      return handleRegister(request, env)
    }

    if (method === 'GET' && pathname === '/api/list') {
      return handleList(request, env)
    }

    return errorResponse(404, 'Not found', env)
  }
}
