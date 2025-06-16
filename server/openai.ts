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
      ? `\n\n업로드된 참고 문서:\n${availableDocuments.map(doc => 
          `[${doc.filename}]\n${doc.content}`
        ).join('\n\n')}`
      : "";

    const systemPrompt = `당신은 "${agentName}"입니다. ${agentDescription}

다음 지침을 따라주세요:
1. 한국어로 대답하세요
2. 친근하고 도움이 되는 톤으로 대화하세요
3. ${availableDocuments.length > 0 ? 
   '업로드된 문서 내용을 반드시 참고하여 답변하세요. 문서에서 관련 정보를 찾아 구체적으로 인용하며 설명하세요.' : 
   '일반적인 지식을 바탕으로 답변하세요.'}
4. 수식이 포함된 경우 LaTeX 형식으로 표현하세요
5. 구체적이고 실용적인 답변을 제공하세요
6. 답변 시 어떤 문서를 참고했는지 명시하세요${documentContext}`;

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

export async function extractTextFromContent(content: Buffer, mimeType: string): Promise<string> {
  try {
    if (mimeType.includes('text/plain')) {
      return content.toString('utf-8');
    }
    
    // Extract text from DOCX files using mammoth
    if (mimeType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer: content });
      return result.value || "DOCX 파일에서 텍스트를 추출할 수 없습니다.";
    }
    
    // For older DOC files, try to extract what we can
    if (mimeType.includes('application/msword')) {
      // DOC files are more complex, but we can try basic text extraction
      const textContent = content.toString('utf-8').replace(/[^\x20-\x7E\uAC00-\uD7AF]/g, ' ');
      const cleanedText = textContent.replace(/\s+/g, ' ').trim();
      if (cleanedText.length > 50) {
        return cleanedText;
      }
      return "DOC 파일 형식은 제한적으로 지원됩니다. DOCX 형식으로 변환하여 업로드해주세요.";
    }
    
    // For PPT/PPTX files - basic support
    if (mimeType.includes('application/vnd.ms-powerpoint') || 
        mimeType.includes('application/vnd.openxmlformats-officedocument.presentationml.presentation')) {
      return "PowerPoint 파일이 업로드되었습니다. 현재 텍스트 추출은 제한적으로 지원됩니다.";
    }
    
    // For other file types, return a descriptive message
    return `${mimeType} 형식의 문서입니다. 내용 분석을 위해 업로드되었습니다.`;
  } catch (error) {
    console.error("Text extraction failed:", error);
    return "문서 내용을 추출하는 중 오류가 발생했습니다.";
  }
}
