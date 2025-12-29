import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

export async function POST(request: NextRequest) {
  try {
    // Verificar se a API key está configurada
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          error: "Configuração necessária",
          details: "A variável OPENAI_API_KEY não está configurada. Configure nas variáveis de ambiente para usar a análise de alimentos."
        },
        { status: 500 }
      )
    }

    // Instanciar OpenAI apenas quando necessário (evita erro no build)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const { image } = await request.json()

    if (!image) {
      return NextResponse.json(
        { error: "Imagem não fornecida" },
        { status: 400 }
      )
    }

    // Análise detalhada da imagem usando GPT-4 Vision
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Você é um nutricionista especializado. Analise esta imagem de comida e forneça:

1. Nome completo e detalhado do prato/alimento
2. Estimativa precisa de calorias totais
3. Quantidade de proteínas em gramas
4. Quantidade de carboidratos em gramas
5. Quantidade de gorduras em gramas
6. Observações nutricionais relevantes (máximo 2 frases)

IMPORTANTE: 
- Seja PRECISO na identificação dos alimentos visíveis
- Considere as porções aparentes na foto
- Se houver múltiplos alimentos, liste todos e some os valores
- Use valores realistas baseados em tabelas nutricionais
- Se não conseguir identificar com certeza, mencione isso

Responda APENAS em formato JSON válido:
{
  "food": "nome detalhado do prato",
  "calories": número,
  "protein": número,
  "carbs": número,
  "fat": número,
  "observations": "observações nutricionais"
}`,
            },
            {
              type: "image_url",
              image_url: {
                url: image,
                detail: "high"
              },
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.3, // Baixa temperatura para respostas mais precisas
    })

    const content = response.choices[0]?.message?.content

    if (!content) {
      throw new Error("Resposta vazia da API")
    }

    // Extrair JSON da resposta (caso venha com texto adicional)
    let analysisResult
    try {
      // Tentar parsear diretamente
      analysisResult = JSON.parse(content)
    } catch {
      // Se falhar, tentar extrair JSON do texto
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("Não foi possível extrair JSON da resposta")
      }
    }

    // Validar estrutura da resposta
    if (
      !analysisResult.food ||
      typeof analysisResult.calories !== "number" ||
      typeof analysisResult.protein !== "number" ||
      typeof analysisResult.carbs !== "number" ||
      typeof analysisResult.fat !== "number"
    ) {
      throw new Error("Resposta da API em formato inválido")
    }

    return NextResponse.json(analysisResult)
  } catch (error: any) {
    console.error("Erro ao analisar alimento:", error)
    return NextResponse.json(
      { 
        error: "Erro ao analisar imagem",
        details: error.message 
      },
      { status: 500 }
    )
  }
}
