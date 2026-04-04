const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'

export function getApiKey(): string | null {
  return localStorage.getItem('anthropic_key')
}

export function setApiKey(key: string) {
  if (key) localStorage.setItem('anthropic_key', key)
  else localStorage.removeItem('anthropic_key')
}

export async function claudeCall(
  system: string,
  userContent: AnthropicContent | string,
  maxTokens = 600,
): Promise<string> {
  const key = getApiKey()
  if (!key) throw new Error('Ingen API-nyckel. Lägg till under ⚙️')

  const content = typeof userContent === 'string' ? [{ type: 'text', text: userContent }] : userContent

  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: 'user', content }] }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message ?? JSON.stringify(data))
  return (data.content[0].text as string).trim()
}

export function parseJson<T>(raw: string): T {
  return JSON.parse(raw.replace(/```json|```/g, '').trim()) as T
}

type AnthropicContent = Array<{ type: string; [key: string]: unknown }>
