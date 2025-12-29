import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

export async function POST(request: NextRequest) {
  try {
    const { userId, userProfile } = await request.json()

    // Validações de entrada
    if (!userId || !userProfile) {
      return NextResponse.json(
        { error: "Dados insuficientes para gerar dieta" },
        { status: 400 }
      )
    }

    // Verificar se a API Key está configurada
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OPENAI_API_KEY não está configurada no ambiente")
      return NextResponse.json(
        { 
          error: "Configuração da API OpenAI não encontrada. Por favor, configure a variável OPENAI_API_KEY nas configurações do projeto.",
          code: "MISSING_API_KEY"
        },
        { status: 500 }
      )
    }

    // Inicializar OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const { weight, height, age, gender, goal, activityLevel, restrictions } = userProfile

    // Validar dados do perfil
    if (!weight || !height || !age || !gender || !goal || !activityLevel) {
      return NextResponse.json(
        { error: "Perfil incompleto. Preencha todos os campos obrigatórios." },
        { status: 400 }
      )
    }

    const prompt = `Você é um nutricionista especializado. Crie um plano alimentar personalizado e profissional em formato JSON.

PERFIL DO USUÁRIO:
- Peso: ${weight}kg
- Altura: ${height}cm
- Idade: ${age} anos
- Gênero: ${gender}
- Objetivo: ${goal}
- Nível de atividade: ${activityLevel}
- Restrições alimentares: ${restrictions || "Nenhuma"}

INSTRUÇÕES:
1. Calcule as calorias e macros ideais baseado no perfil usando fórmulas científicas
2. Crie 5 refeições balanceadas e realistas (Café da Manhã, Lanche da Manhã, Almoço, Lanche da Tarde, Jantar)
3. Cada refeição deve ter alimentos específicos com quantidades precisas (ex: "200g de frango grelhado")
4. Seja profissional e preciso nas quantidades e valores nutricionais
5. Considere as restrições alimentares rigorosamente
6. Use alimentos comuns e acessíveis do Brasil
7. Garanta que a soma das calorias das refeições seja próxima ao target_calories

FORMATO DE RESPOSTA (JSON VÁLIDO):
{
  "goal": "Nome do objetivo exato do usuário",
  "target_calories": número_inteiro_total_diário,
  "target_protein": número_inteiro_em_gramas,
  "target_carbs": número_inteiro_em_gramas,
  "target_fat": número_inteiro_em_gramas,
  "meals": [
    {
      "name": "Café da Manhã",
      "time": "07:00 - 08:00",
      "foods": ["2 ovos mexidos", "2 fatias de pão integral", "1 banana média"],
      "calories": 450,
      "protein": 25,
      "carbs": 55,
      "fat": 12
    }
  ]
}

IMPORTANTE: Retorne APENAS o JSON válido, sem markdown, sem texto adicional, sem \`\`\`json.`

    console.log("🤖 Gerando dieta personalizada com IA...")

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um nutricionista especializado que cria planos alimentares personalizados baseados em ciência nutricional. Sempre responda em JSON válido sem formatação markdown."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    })

    const responseContent = completion.choices[0].message.content

    if (!responseContent) {
      throw new Error("Resposta vazia da API OpenAI")
    }

    console.log("✅ Dieta gerada com sucesso")

    // Parse e validação do JSON
    let dietPlan
    try {
      dietPlan = JSON.parse(responseContent)
    } catch (parseError) {
      console.error("❌ Erro ao fazer parse do JSON:", parseError)
      throw new Error("Formato de resposta inválido da IA")
    }

    // Validar estrutura do plano
    if (!dietPlan.goal || !dietPlan.target_calories || !dietPlan.meals || !Array.isArray(dietPlan.meals)) {
      console.error("❌ Estrutura de dieta inválida:", dietPlan)
      throw new Error("Estrutura de dieta inválida retornada pela IA")
    }

    // Garantir que todas as refeições têm a estrutura correta
    dietPlan.meals = dietPlan.meals.map((meal: any) => ({
      name: meal.name || "Refeição",
      time: meal.time || "00:00 - 00:00",
      foods: Array.isArray(meal.foods) ? meal.foods : [],
      calories: parseInt(meal.calories) || 0,
      protein: parseInt(meal.protein) || 0,
      carbs: parseInt(meal.carbs) || 0,
      fat: parseInt(meal.fat) || 0
    }))

    return NextResponse.json({
      success: true,
      diet: dietPlan
    })

  } catch (error: any) {
    console.error("❌ Erro ao gerar dieta:", error)
    
    // Tratamento específico de erros da OpenAI
    if (error.code === 'invalid_api_key') {
      return NextResponse.json(
        { 
          error: "Chave da API OpenAI inválida. Verifique a configuração.",
          code: "INVALID_API_KEY"
        },
        { status: 401 }
      )
    }

    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        { 
          error: "Cota da API OpenAI excedida. Entre em contato com o suporte.",
          code: "QUOTA_EXCEEDED"
        },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { 
        error: "Erro ao gerar dieta personalizada. Tente novamente em alguns instantes.",
        details: error.message,
        code: "GENERATION_ERROR"
      },
      { status: 500 }
    )
  }
}
