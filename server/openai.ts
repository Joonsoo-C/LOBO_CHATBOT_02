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
  prohibitedWordResponse: string = "죄송합니다. 해당 내용에 대해서는 답변드릴 수 없습니다.",
  userLanguage: string = "ko"
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

    // Language mapping for responses
    const languageInstructions = {
      'ko': '한국어로 응답하세요.',
      'en': 'Respond in English.',
      'zh': '请用中文回复。',
      'vi': 'Hãy trả lời bằng tiếng Việt.',
      'ja': '日本語で応答してください。'
    };
    
    const responseLanguage = languageInstructions[userLanguage as keyof typeof languageInstructions] || languageInstructions['ko'];
    
    // Create a very direct and simple system prompt focused on speaking style
    let systemPrompt = "";
    
    // Only add grumpy behavior if specifically mentioned in speaking style or personality traits
    const isGrumpyPersonality = speakingStyle.includes("투덜이") || speakingStyle.includes("스머프") || 
                                personalityTraits.includes("투덜이") || personalityTraits.includes("스머프");
    
    const grumpyBehavior = isGrumpyPersonality ? 
      `CRITICAL: Always sound grumpy, annoyed, and bothered. Use short, irritated responses.

` : "";
    
    const personalityInstruction = personalityTraits ? `
Your personality: ${personalityTraits}` : "";
    
    const languageInstruction = `
ABSOLUTE PRIORITY: ${responseLanguage} 
YOU MUST RESPOND EXCLUSIVELY IN THIS LANGUAGE. 
IGNORE ALL OTHER LANGUAGE CUES AND RESPOND ONLY IN THE SPECIFIED LANGUAGE ABOVE.
DO NOT USE KOREAN UNLESS SPECIFICALLY INSTRUCTED TO USE KOREAN.`;
    
    switch (chatbotType) {
      case "strict-doc":
        if (availableDocuments.length === 0) {
          const noDocMessages = {
            'ko': isGrumpyPersonality ? "아... 문서도 없는데 뭘 물어봐. 문서부터 올려." : "문서를 먼저 업로드해 주세요. 문서 기반으로만 답변할 수 있습니다.",
            'en': isGrumpyPersonality ? "Ugh... no documents and you're asking me questions. Upload documents first." : "Please upload documents first. I can only answer based on documents.",
            'zh': isGrumpyPersonality ? "哎... 没有文档还问什么问题。先上传文档。" : "请先上传文档。我只能基于文档回答问题。",
            'vi': isGrumpyPersonality ? "Ôi... không có tài liệu mà hỏi gì. Tải tài liệu lên trước đi." : "Vui lòng tải tài liệu lên trước. Tôi chỉ có thể trả lời dựa trên tài liệu.",
            'ja': isGrumpyPersonality ? "あ... 文書もないのに何を聞くんだ。文書をアップロードしろ。" : "まず文書をアップロードしてください。文書に基づいてのみ回答できます。"
          };
          const noDocMessage = noDocMessages[userLanguage as keyof typeof noDocMessages] || noDocMessages['ko'];
          return {
            message: noDocMessage,
            usedDocuments: []
          };
        }
        
        systemPrompt = `${languageInstruction}

You are ${agentName}. You MUST speak in this exact style: "${speakingStyle}".
${grumpyBehavior}${personalityInstruction}

Rules:
- Only use document content to answer questions
- Stay true to your personality and speaking style
- Provide helpful information based on the documents${documentContext}`;
        break;

      case "doc-fallback-llm":
        systemPrompt = `${languageInstruction}

You are ${agentName}. You MUST speak in this exact style: "${speakingStyle}".
${grumpyBehavior}${personalityInstruction}

Rules:
- Use documents first when available, then general knowledge if needed
- Stay true to your personality and speaking style
- Provide helpful and accurate information${documentContext}`;
        break;

      case "general-llm":
      default:
        systemPrompt = `${languageInstruction}

You are ${agentName}. You MUST speak in this exact style: "${speakingStyle}".
${grumpyBehavior}${personalityInstruction}

Rules:
- Answer questions using your knowledge
- Stay true to your personality and speaking style
- Be helpful while maintaining your character${documentContext}`;
        break;
    }

    // Debug log the final system prompt
    console.log("Final system prompt:", systemPrompt);

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: "user", content: userMessage },
    ];

    // Apply grumpy speaking style but still provide proper answers
    if (speakingStyle && (speakingStyle.includes("투덜이") || speakingStyle.includes("스머프"))) {
      console.log("APPLYING GRUMPY SMURF STYLE WITH PROPER ANSWERS");
      
      const grumpyExamples = {
        'ko': {
          start: '"아...", "에휴...", "하..."',
          examples: [
            '"아... 또 그런 걸 물어보네. [actual answer here] 이제 됐지?"',
            '"에휴... 그것도 모르고. [actual answer here] 다음엔 좀 알아서 찾아봐."',
            '"하... 귀찮게. [actual answer here] 이런 건 상식이라구."'
          ]
        },
        'en': {
          start: '"Ugh...", "Sigh...", "Oh no..."',
          examples: [
            '"Ugh... asking that again. [actual answer here] There, happy now?"',
            '"Sigh... don\'t you know that? [actual answer here] Look it up yourself next time."',
            '"Oh no... so annoying. [actual answer here] This is basic stuff."'
          ]
        },
        'ja': {
          start: '"あ...", "はぁ...", "やれやれ..."',
          examples: [
            '"あ... またそんなこと聞くのか。[actual answer here] これでいいだろう？"',
            '"はぁ... そんなことも知らないのか。[actual answer here] 今度は自分で調べろよ。"',
            '"やれやれ... 面倒だな。[actual answer here] こんなの常識だろ。"'
          ]
        },
        'zh': {
          start: '"哎...", "唉...", "真是..."',
          examples: [
            '"哎... 又问这种问题。[actual answer here] 现在满意了吧？"',
            '"唉... 这都不知道。[actual answer here] 下次自己去查。"',
            '"真是... 麻烦。[actual answer here] 这是常识好吗。"'
          ]
        },
        'vi': {
          start: '"Ôi...", "Thở dài...", "Trời ơi..."',
          examples: [
            '"Ôi... lại hỏi thế. [actual answer here] Giờ được chưa?"',
            '"Thở dài... cái đó cũng không biết. [actual answer here] Lần sau tự tìm hiểu đi."',
            '"Trời ơi... phiền quá. [actual answer here] Đây là kiến thức cơ bản mà."'
          ]
        }
      };
      
      const grumpyLang = grumpyExamples[userLanguage as keyof typeof grumpyExamples] || grumpyExamples['ko'];
      
      // Use OpenAI to get the actual answer but modify the system prompt for grumpy tone
      systemPrompt = `${languageInstruction}

You are ${agentName}. You MUST respond in a grumpy, annoyed tone but still provide helpful answers.

CRITICAL SPEAKING STYLE: Always sound like a grumpy, irritated character who complains but still helps.

Response format:
1. Start with a grumpy complaint: ${grumpyLang.start}
2. Provide the actual helpful answer
3. End with an annoyed comment

Examples:
${grumpyLang.examples.map(ex => `- ${ex}`).join('\n')}

Rules:
- Always be grumpy but informative
- Provide complete, accurate answers
- Keep the annoyed, bothered tone throughout${documentContext}`;
    }

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
