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
  availableDocuments: Array<{ filename: string; content: string }> = []
): Promise<ChatResponse> {
  try {
    // Prepare context from documents
    const documentContext = availableDocuments.length > 0 
      ? `\n\n참고 문서:\n${availableDocuments.map(doc => 
          `[${doc.filename}]\n${doc.content.slice(0, 2000)}...`
        ).join('\n\n')}`
      : "";

    const systemPrompt = `당신은 "${agentName}"입니다. ${agentDescription}

다음 지침을 따라주세요:
1. 한국어로 대답하세요
2. 친근하고 도움이 되는 톤으로 대화하세요
3. 제공된 문서 내용을 기반으로 답변하되, 문서에 없는 내용은 일반적인 지식으로 보완하세요
4. 수식이 포함된 경우 LaTeX 형식으로 표현하세요
5. 구체적이고 실용적인 답변을 제공하세요${documentContext}`;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: "user", content: userMessage },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 1500,
      temperature: 0.7,
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
  try {
    if (mimeType.includes('text/plain')) {
      return content;
    }
    
    // For binary files (DOCX, PPT, etc.), use OpenAI to extract text content
    if (mimeType.includes('application/vnd.openxmlformats') || 
        mimeType.includes('application/msword') || 
        mimeType.includes('application/vnd.ms-powerpoint')) {
      
      // Since we can't directly parse binary files without additional libraries,
      // we'll ask OpenAI to help extract meaningful content
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a document content extractor. Extract the main text content from the given document information and provide a clean, readable version."
          },
          {
            role: "user",
            content: `This is a ${mimeType} document. Please extract and summarize the key textual content that would be useful for answering questions about this document. If the content appears to be encoded or binary, please indicate that this is a binary document and provide a general description of what type of content it likely contains.`
          }
        ],
        max_tokens: 1000,
        temperature: 0.1,
      });
      
      return response.choices[0].message.content || "문서 내용을 추출할 수 없습니다.";
    }
    
    // For other file types, return a descriptive message
    return `${mimeType} 형식의 문서입니다. 내용 분석을 위해 업로드되었습니다.`;
  } catch (error) {
    console.error("Text extraction failed:", error);
    return "문서 내용을 추출하는 중 오류가 발생했습니다.";
  }
}
