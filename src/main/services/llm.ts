const CONFIG = {
  apiKey: 'app-id-c9f670adbfd41f44d9bb32699c0475c24a255c19',
  baseUrl: 'https://duoduo.taotoken.net',
}

const SYSTEM_PROMPT = `你是一个微信群聊消息分析助手。用户会给你一段群聊消息记录，你需要根据用户的要求进行分析。
消息格式为：[时间] 发言人: 消息内容

请用中文回复，条理清晰，使用 Markdown 格式。`

async function callAI(messages: Array<{role: string; content: string}>, apiKey: string, apiBase: string, userToken?: string, model?: string): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  }
  if (userToken) headers['X-User-Token'] = userToken

  const baseUrl = apiBase || `${CONFIG.baseUrl}/v1`
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: model || 'deepseek-v4-flash',
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  })

  if (res.status === 402) {
    throw new Error('INSUFFICIENT_BALANCE')
  }

  const data = await res.json()
  return data.choices[0]?.message?.content || '分析结果为空'
}

export async function analyzeMessages(
  messages: string,
  prompt: string,
  apiKey: string,
  model: string,
  apiBase: string,
  userId?: string,
  userToken?: string
): Promise<string> {
  return callAI([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `${prompt}\n\n---\n以下是群聊消息记录：\n\n${messages}` }
  ], apiKey, apiBase, userToken, model)
}

const DAILY_REPORT_PROMPT = `请根据以下群聊记录生成今日日报，按以下结构输出：

## 讨论话题总结
（今日主要讨论了哪些话题，每个话题简要说明）

## 活跃成员排名
（发言最积极的成员，列出他们的核心观点）

## 关键决策与结论
（群内达成的共识或重要结论）

## 待办事项
（需要跟进的行动项，标注负责人）

## 高频问题 (FAQ)
（今日被多次提及的问题及解答）`

export async function generateDailyReport(
  messages: string,
  apiKey: string,
  model: string,
  apiBase: string,
  userId?: string,
  userToken?: string
): Promise<string> {
  return analyzeMessages(messages, DAILY_REPORT_PROMPT, apiKey, model, apiBase, userId, userToken)
}

const MONITOR_SYSTEM_PROMPT = `你是一个群聊消息监控助手。用户会给定一个监控条件，你需要从提供的消息中找出符合条件的内容。

请严格按以下 JSON 数组格式返回匹配结果，不要输出其他任何内容：
[{
  "sender": "发送人",
  "content": "消息原文",
  "analysis": "为什么匹配该条件（一句话）"
}]

如果没有匹配的消息，返回空数组 []。`

export async function monitorMessages(
  messages: string,
  monitorPrompt: string,
  apiKey: string,
  model: string,
  apiBase: string
): Promise<any[]> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  }

  const baseUrl = apiBase || `${CONFIG.baseUrl}/v1`
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: model || 'deepseek-v4-flash',
      messages: [
        { role: 'system', content: MONITOR_SYSTEM_PROMPT },
        { role: 'user', content: `用户监控条件：${monitorPrompt}\n\n消息记录：\n${messages}` }
      ],
      temperature: 0.2,
      max_tokens: 4096,
    }),
  })

  if (res.status === 402) {
    throw new Error('INSUFFICIENT_BALANCE')
  }

  const data = await res.json()
  const text = data.choices[0]?.message?.content || '[]'
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []
  try {
    return JSON.parse(jsonMatch[0])
  } catch {
    return []
  }
}
