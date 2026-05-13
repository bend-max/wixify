import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { prompt, referenceUrl } = await req.json()

    if (!prompt || !referenceUrl) {
      return NextResponse.json({ error: 'חסרים פרטים' }, { status: 400 })
    }

    const styleRes = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: referenceUrl } },
            {
              type: 'text',
              text: 'Describe the visual style of this image in 2-3 sentences. Focus on: colors, line style, artistic technique.',
            },
          ],
        },
      ],
      max_tokens: 150,
    })

    const styleDescription = styleRes.choices[0].message.content

    const imageRes = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: `${styleDescription} Create: ${prompt}`,
      size: '1024x1024',
    })

    const imageData = imageRes.data?.[0]
    if (!imageData) return NextResponse.json({ error: 'לא התקבלה תמונה' }, { status: 500 })

    const imageUrl = imageData.b64_json
      ? `data:image/png;base64,${imageData.b64_json}`
      : imageData.url ?? ''

    return NextResponse.json({ imageUrl })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'שגיאה'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
