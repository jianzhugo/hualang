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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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

function verifyPassword(env: Env, token: string): boolean {
  const passwords = (env.UPLOAD_PASSWORDS || '').split(',').map(p => p.trim()).filter(p => p)
  return passwords.includes(token)
}

function extractAuthHeader(request: Request): string {
  const auth = request.headers.get('Authorization') || ''
  if (auth.startsWith('Bearer ')) return auth.slice(7)
  return ''
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
    return jsonResponse({
      url: `${urlForRequest(request)}/api/upload/${key}`,
      key
    }, env, 200, origin)
  } catch (e) {
    return errorResponse(500, 'Failed to generate upload token', env, origin)
  }
}

function urlForRequest(request: Request): string {
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}

async function handleUpload(request: Request, env: Env, origin: string, key: string): Promise<Response> {
  try {
    const body = await request.arrayBuffer()
    await env.GALLERY_BUCKET.put(key, body, {
      httpMetadata: { contentType: 'image/webp' }
    })
    return jsonResponse({ success: true }, env, 200, origin)
  } catch (e) {
    return errorResponse(500, 'Upload failed', env, origin)
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

async function handleUpdate(request: Request, env: Env, origin: string): Promise<Response> {
  try {
    const token = extractAuthHeader(request)
    if (!token || !verifyPassword(env, token)) {
      return errorResponse(403, 'Invalid password', env, origin)
    }

    const body: { key: string; author?: string; title?: string; createdDate?: string; tags?: string[] } = await request.json()
    const maxRetries = 3

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const existingObj = await env.GALLERY_BUCKET.get('metadata.json')
      if (!existingObj) {
        return errorResponse(404, 'Artwork not found', env, origin)
      }

      const text = await existingObj.text()
      const metadata: MetadataFile = JSON.parse(text)
      const etag = existingObj.httpEtag

      const idx = metadata.artworks.findIndex((a) => a.key === body.key)
      if (idx === -1) {
        return errorResponse(404, 'Artwork not found', env, origin)
      }

      if (body.author !== undefined) metadata.artworks[idx].author = body.author
      if (body.title !== undefined) metadata.artworks[idx].title = body.title
      if (body.createdDate !== undefined) metadata.artworks[idx].createdDate = body.createdDate
      if (body.tags !== undefined) metadata.artworks[idx].tags = body.tags

      try {
        await env.GALLERY_BUCKET.put('metadata.json', JSON.stringify(metadata), {
          onlyIf: { etagMatches: etag }
        })
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
    return errorResponse(500, 'Failed to update artwork', env, origin)
  }
}

async function handleSync(request: Request, env: Env, origin: string): Promise<Response> {
  const token = extractAuthHeader(request)
  if (!token || !verifyPassword(env, token)) {
    return errorResponse(403, 'Invalid password', env, origin)
  }

  try {
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

      const registeredKeys = new Set(metadata.artworks.map((a) => a.key))
      const listed = await env.GALLERY_BUCKET.list()
      const unregistered = listed.objects.filter(
        (obj) => obj.key.endsWith('.webp') && !registeredKeys.has(obj.key)
      )

      if (unregistered.length === 0) {
        return jsonResponse({ synced: 0 }, env, 200, origin)
      }

      for (const obj of unregistered) {
        metadata.artworks.push({
          key: obj.key,
          uploader: '系统',
          author: '未知',
          title: obj.key.replace('.webp', ''),
          date: obj.uploaded ? obj.uploaded.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          tags: []
        })
      }

      try {
        await env.GALLERY_BUCKET.put('metadata.json', JSON.stringify(metadata), {
          onlyIf: { etagMatches: etag }
        })
        return jsonResponse({ synced: unregistered.length }, env, 200, origin)
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
    return errorResponse(500, 'Failed to sync', env, origin)
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

    if (method === 'PUT' && pathname === '/api/artwork') {
      return handleUpdate(request, env, origin)
    }

    if (method === 'POST' && pathname === '/api/sync') {
      return handleSync(request, env, origin)
    }

    if (method === 'PUT' && pathname.startsWith('/api/upload/')) {
      const key = pathname.replace('/api/upload/', '')
      return handleUpload(request, env, origin, key)
    }

    return errorResponse(404, 'Not found', env, origin)
  }
}
