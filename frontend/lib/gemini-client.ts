/**
 * Cliente para Google Gemini API
 */

import axios from 'axios'

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

export interface GeminiRequest {
  prompt: string
  temperature?: number
  maxTokens?: number
}

export interface GeminiResponse {
  text: string
  candidates: any[]
}

export async function generateContentWithGemini(
  request: GeminiRequest
): Promise<GeminiResponse> {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: request.prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: request.temperature || 0.7,
          maxOutputTokens: request.maxTokens || 2048,
        },
      }
    )

    const text = response.data.candidates[0]?.content?.parts[0]?.text || ''

    return {
      text,
      candidates: response.data.candidates,
    }
  } catch (error) {
    console.error('Erro ao chamar Gemini API:', error)
    throw new Error('Falha ao gerar conteúdo com Gemini')
  }
}

export async function analyzeTextWithGemini(text: string): Promise<any> {
  const prompt = `Analise o seguinte texto de um projeto PRONAS/PCD e retorne uma análise estruturada em JSON:

${text}

Retorne JSON com: score (0-100), summary, key_points, concerns, recommendations`

  const response = await generateContentWithGemini({ prompt })

  try {
    return JSON.parse(response.text)
  } catch {
    return {
      score: 0,
      summary: response.text,
      error: 'Resposta não estruturada',
    }
  }
}
