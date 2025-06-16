import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || ""
});

export interface ChatResponse {
  message: string;
  usedDocuments?: string[];
}

export interface DocumentAnalysis {
  summary: string;
  keyPoints: string[];
  extractedText: string;
}

export async function analyzeDocument(content: string, filename: string): Promise<DocumentAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "당신은 문서 분석 전문가입니다. 주어진 문서를 분석하여 요약, 주요 포인트, 전체 텍스트를 추출하세요. 응답은 JSON 형식으로 해주세요.",
        },
        {
          role: "user",
          content: `다음 문서를 분석해주세요. 파일명: ${filename}\n\n내용:\n${content}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      summary: result.summary || "문서 요약이 생성되지 않았습니다.",
      keyPoints: result.keyPoints || [],
      extractedText: content,
    };
  } catch (error) {
    console.error("Document analysis failed:", error);
    return {
      summary: "문서 분석 중 오류가 발생했습니다.",
      keyPoints: [],
      extractedText: content,
    };
  }
}

export async function generateChatResponse(
  userMessage: string,
  agentName: string,
  agentDescription: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  availableDocuments: Array<{ filename: string; content: string }> = [],
  chatbotType: string = "general-llm",
  speakingStyle: string = "친근하고 도움이 되는 말투",
  personalityTraits: string = "친절하고 전문적인 성격으로 정확한 정보를 제공",
  prohibitedWordResponse: string = "죄송합니다. 해당 내용에 대해서는 답변드릴 수 없습니다."
): Promise<ChatResponse> {
  try {
    // Debug log to check if persona parameters are received
    console.log("OpenAI persona parameters:", {
      speakingStyle,
      personalityTraits,
      chatbotType
    });

    // Prepare context from documents
    const documentContext = availableDocuments.length > 0 
      ? `\n\n참고 문서:\n${availableDocuments.map(doc => 
          `[${doc.filename}]\n${doc.content.slice(0, 2000)}...`
        ).join('\n\n')}`
      : "";

    // Generate different system prompts based on chatbot type
    let systemPrompt = "";
    
    switch (chatbotType) {
      case "strict-doc":
        if (availableDocuments.length === 0) {
          return {
            message: "죄송합니다. 현재 업로드된 문서가 없어 질문에 답변드릴 수 없습니다. 관련 문서를 업로드해 주시면 도움드리겠습니다.",
            usedDocuments: []
          };
        }
        
        // Check if question relates to documents
        const hasRelevantContent = availableDocuments.some(doc => 
          doc.content.toLowerCase().includes(userMessage.toLowerCase().split(' ').find(word => word.length > 2) || '')
        );
        
        if (!hasRelevantContent) {
          return {
            message: "죄송합니다. 업로드된 문서에서 해당 질문과 관련된 내용을 찾을 수 없습니다. 문서에 포함된 내용에 대해서만 답변이 가능합니다.",
            usedDocuments: []
          };
        }
        
        systemPrompt = `당신은 "${agentName}"입니다. 반드시 "${speakingStyle}" 말투로 대답하세요.

간단한 규칙:
- 한국어로 대답
- 짧고 간결하게 답변
- "${speakingStyle}" 방식으로 말하기
- 문서 내용만 사용, 없으면 "문서에 없음" 답변${documentContext}`;
        break;

      case "doc-fallback-llm":
        systemPrompt = `당신은 "${agentName}"입니다. 반드시 "${speakingStyle}" 말투로 대답하세요.

간단한 규칙:
- 한국어로 대답
- 짧고 간결하게 답변
- "${speakingStyle}" 방식으로 말하기
- 문서 내용 우선, 없으면 일반 지식 사용${documentContext}`;
        break;

      case "general-llm":
      default:
        systemPrompt = `당신은 "${agentName}"입니다. 반드시 "${speakingStyle}" 말투로 대답하세요.

간단한 규칙:
- 한국어로 대답
- 짧고 간결하게 답변
- "${speakingStyle}" 방식으로 말하기
- 문서 내용 우선, 없으면 일반 지식 사용${documentContext}`;
        break;
    }

    // Debug log the final system prompt
    console.log("Final system prompt:", systemPrompt);

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: "user", content: userMessage },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 200, // Limit response length for focused answers
      temperature: 0.3, // Lower temperature for more controlled responses
    });

    const assistantMessage = response.choices[0].message.content || "죄송합니다. 응답을 생성할 수 없습니다.";
    
    return {
      message: assistantMessage,
      usedDocuments: availableDocuments.map(doc => doc.filename),
    };
  } catch (error) {
    console.error("Chat response generation failed:", error);
    return {
      message: "죄송합니다. 현재 응답을 생성할 수 없습니다. 잠시 후 다시 시도해주세요.",
      usedDocuments: [],
    };
  }
}

export async function extractTextFromContent(content: string, mimeType: string): Promise<string> {
  // This is a simple text extraction - in production you might want to use specific libraries
  // for different file types like pdf-parse, mammoth (for docx), etc.
  
  if (mimeType.includes('text/plain')) {
    return content;
  }
  
  // For now, we'll assume the content is already text
  // In production, you'd implement proper parsers for different file types
  return content;
}
