import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { prompt, referenceUrl } = await req.json()

  if (!prompt || !referenceUrl) {
    return NextResponse.json({ error: 'חסרים פרטים' }, { status: 400 })
  }

  // Step 1: Extract style description from reference image
  const styleRes = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: referenceUrl } },
          {
            type: 'text',
            text: 'Describe the visual style of this image precisely. Cover: line style, colors, level of detail, shading, artistic technique. Write only the style description, no other text.',
          },
        ],
      },
    ],
    max_tokens: 300,
  })

  const styleDescription = styleRes.choices[0].message.content

  // Step 2: Generate image in that style
  const imageRes = await openai.images.generate({
    model: 'gpt-image-1',
    prompt: `Style: ${styleDescription}\n\nCreate: ${prompt}`,
    size: '1024x1024',
    quality: 'standard',
  })

const imageData = imageRes.data?.[0]
if (!imageData) return NextResponse.json({ error: 'שגיאה' }, { status: 500 })
let imageUrl: string

if (imageData.b64_json) {
  imageUrl = `data:image/png;base64,${imageData.b64_json}`
} else if (imageData.url) {
  imageUrl = imageData.url
} else {
  return NextResponse.json({ error: 'לא התקבלה תמונה' }, { status: 500 })
}

  return NextResponse.json({ imageUrl })
}
