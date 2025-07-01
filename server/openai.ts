import OpenAI from "openai";
import * as mammoth from "mammoth";
import * as fs from "fs";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || ""
});

export interface ChatResponse {
  message: string;
  usedDocuments?: string[];
  triggerAction?: string;
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

export async function generateManagementResponse(
  userMessage: string,
  agentName: string,
  agentDescription: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  availableDocuments: Array<{ filename: string; content: string }>,
  chatbotType: string = "general-llm",
  speakingStyle: string = "친근하고 도움이 되는 말투",
  personalityTraits: string = "친절하고 전문적인 성격으로 정확한 정보를 제공",
  prohibitedWordResponse: string = "죄송합니다. 해당 내용에 대해서는 답변드릴 수 없습니다.",
  userLanguage: string = "ko"
): Promise<ChatResponse> {
  const lowerMessage = userMessage.toLowerCase();
  
  // Check for management commands with typo tolerance
  if (lowerMessage.includes("페르소나") || lowerMessage.includes("persona") || lowerMessage.includes("성격") || 
      lowerMessage.includes("말투") || lowerMessage.includes("캐릭터") || lowerMessage.includes("개성") ||
      lowerMessage.includes("닉네임") || lowerMessage.includes("특성") || lowerMessage.includes("변경") ||
      lowerMessage.includes("수정") || lowerMessage.includes("편집")) {
    return {
      message: "🔧 페르소나 편집 창을 열었습니다. 닉네임, 말투 스타일, 지식 분야, 성격 특성, 금칙어 반응 방식을 수정할 수 있습니다.",
      usedDocuments: [],
      triggerAction: "openPersonaModal"
    };
  }
  
  if (lowerMessage.includes("챗봇") || lowerMessage.includes("설정") || lowerMessage.includes("모델") ||
      lowerMessage.includes("llm") || lowerMessage.includes("gpt") || lowerMessage.includes("ai설정") ||
      lowerMessage.includes("봇설정") || lowerMessage.includes("동작") || lowerMessage.includes("유형")) {
    return {
      message: "🔧 챗봇 설정 창을 열었습니다. LLM 모델과 챗봇 유형을 변경할 수 있습니다.",
      usedDocuments: [],
      triggerAction: "openSettingsModal"
    };
  }
  
  if (lowerMessage.includes("문서") || lowerMessage.includes("업로드") || lowerMessage.includes("파일") ||
      lowerMessage.includes("자료") || lowerMessage.includes("첨부") || lowerMessage.includes("지식") ||
      lowerMessage.includes("학습") || lowerMessage.includes("데이터") || lowerMessage.includes("정보")) {
    return {
      message: "🔧 문서 업로드 창을 열었습니다. TXT, DOC, DOCX, PPT, PPTX 형식의 문서를 업로드하여 에이전트의 지식베이스를 확장할 수 있습니다.",
      usedDocuments: [],
      triggerAction: "openFileModal"
    };
  }
  
  if (lowerMessage.includes("알림") || lowerMessage.includes("notification") || lowerMessage.includes("브로드캐스트") ||
      lowerMessage.includes("공지") || lowerMessage.includes("메시지") || lowerMessage.includes("전송") ||
      lowerMessage.includes("안내") || lowerMessage.includes("소식")) {
    return {
      message: "🔧 알림 기능을 시작합니다. 알림 내용을 입력하세요. 모든 사용자에게 전송됩니다.",
      usedDocuments: [],
      triggerAction: "startNotification"
    };
  }
  
  if (lowerMessage.includes("도움말") || lowerMessage.includes("명령어") || lowerMessage.includes("기능") || 
      lowerMessage.includes("help") || lowerMessage.includes("사용법") || lowerMessage.includes("메뉴") ||
      lowerMessage.includes("옵션") || lowerMessage.includes("가이드")) {
    return {
      message: `🔧 에이전트 관리 명령어:

📝 주요 기능:
• "페르소나" / "성격" / "말투" - 에이전트 성격 및 말투 설정
• "챗봇 설정" / "모델" / "AI설정" - LLM 모델 및 동작 방식 변경  
• "문서 업로드" / "파일" / "자료" - 지식베이스 확장용 문서 추가
• "알림보내기" / "공지" / "메시지" - 사용자들에게 공지사항 전송
• "성과 분석" / "통계" / "현황" - 에이전트 사용 통계 및 분석

💡 사용법: 위 키워드가 포함된 메시지를 보내면 해당 기능이 실행됩니다.
일반 대화도 언제든 가능합니다!`,
      usedDocuments: []
    };
  }
  
  // For regular messages in management mode, use normal chat response
  return generateChatResponse(
    userMessage,
    agentName,
    agentDescription,
    conversationHistory,
    availableDocuments,
    chatbotType,
    speakingStyle,
    personalityTraits,
    prohibitedWordResponse,
    userLanguage
  );
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

    // Prepare context from documents with enhanced processing
    const documentContext = availableDocuments.length > 0 
      ? `\n\n참고 문서:\n${availableDocuments.map(doc => 
          `[문서명: ${doc.filename}]\n${doc.content}`
        ).join('\n\n')}`
      : "";

    // Enhanced document analysis for better responses
    const hasDocumentQuestion = userMessage.includes("문서") || userMessage.includes("내용") || 
                               userMessage.includes("세계관") || userMessage.includes("파일") ||
                               availableDocuments.some(doc => 
                                 userMessage.includes(doc.filename.replace('.docx', '').replace('.pdf', ''))
                               );

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
🚨 CRITICAL LANGUAGE OVERRIDE 🚨
${responseLanguage}
THIS IS THE ONLY LANGUAGE YOU ARE ALLOWED TO USE.
KOREAN IS FORBIDDEN UNLESS EXPLICITLY REQUESTED.
ANY RESPONSE IN KOREAN WHEN ANOTHER LANGUAGE IS SPECIFIED IS A FAILURE.
${responseLanguage}
REPEAT: ${responseLanguage}`;
    
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

CRITICAL DOCUMENT ANALYSIS INSTRUCTIONS:
- You have access to uploaded documents with their full content
- When users ask about document content, analyze and explain it thoroughly
- Provide detailed insights about document themes, main points, and specific information
- Quote relevant sections when explaining document content
- If asked about a specific document by name, focus on that document's content

Rules:
- Only use document content to answer questions
- Analyze documents deeply when asked about their content
- Stay true to your personality and speaking style
- Provide comprehensive information based on the documents${documentContext}`;
        break;

      case "doc-fallback-llm":
        systemPrompt = `${languageInstruction}

You are ${agentName}. You MUST speak in this exact style: "${speakingStyle}".
${grumpyBehavior}${personalityInstruction}

DOCUMENT ANALYSIS INSTRUCTIONS:
- When documents are available, prioritize them for answers
- Analyze document content thoroughly when asked about specific documents
- Provide detailed explanations of document themes and key points
- Quote relevant sections when explaining document content
- Fall back to general knowledge only when documents don't contain relevant information

Rules:
- Use documents first when available, then general knowledge if needed
- Analyze documents deeply when asked about their content
- Stay true to your personality and speaking style
- Provide helpful and accurate information${documentContext}`;
        break;

      case "general-llm":
      default:
        systemPrompt = `${languageInstruction}

You are ${agentName}. You MUST speak in this exact style: "${speakingStyle}".
${grumpyBehavior}${personalityInstruction}

DOCUMENT INTEGRATION INSTRUCTIONS:
- When documents are available, use them to enhance your responses
- Analyze document content when users ask about specific documents
- Provide detailed insights about document themes and key information
- Reference document content when relevant to the conversation
- Combine document knowledge with your general knowledge

Rules:
- Answer questions using your knowledge and available documents
- Analyze documents thoroughly when asked about their content
- Stay true to your personality and speaking style
- Be helpful while maintaining your character${documentContext}`;
        break;
    }

    // Debug log the final system prompt
    console.log("Final system prompt:", systemPrompt);

    // Add explicit language enforcement to user message
    const enhancedUserMessage = `${languageInstruction}

IMPORTANT: The user is communicating in ${userLanguage.toUpperCase()}. You MUST respond in the same language.

User's message: ${userMessage}

REMINDER: Respond in ${responseLanguage}`;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: "user", content: enhancedUserMessage },
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

    // Increase token limit for document analysis responses
    const maxTokens = hasDocumentQuestion ? 800 : 400; // More tokens for document analysis
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: maxTokens,
      temperature: 0.3, // Lower temperature for more controlled responses
    });

    const errorMessages = {
      'ko': "죄송합니다. 응답을 생성할 수 없습니다.",
      'en': "Sorry, I couldn't generate a response.",
      'zh': "抱歉，无法生成回复。",
      'vi': "Xin lỗi, không thể tạo phản hồi.",
      'ja': "申し訳ありませんが、応答を生成できませんでした。"
    };
    
    const assistantMessage = response.choices[0].message.content || errorMessages[userLanguage as keyof typeof errorMessages] || errorMessages['ko'];
    
    return {
      message: assistantMessage,
      usedDocuments: availableDocuments.map(doc => doc.filename),
    };
  } catch (error) {
    console.error("Chat response generation failed:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      apiKey: process.env.OPENAI_API_KEY ? 'SET' : 'NOT_SET'
    });
    
    const catchErrorMessages = {
      'ko': "죄송합니다. 현재 응답을 생성할 수 없습니다. 잠시 후 다시 시도해주세요.",
      'en': "Sorry, I can't generate a response right now. Please try again in a moment.",
      'zh': "抱歉，目前无法生成回复。请稍后重试。",
      'vi': "Xin lỗi, hiện tại không thể tạo phản hồi. Vui lòng thử lại sau một lúc.",
      'ja': "申し訳ありませんが、現在応答을 생成できません。しばらくしてからもう一度お試しください。"
    };
    
    return {
      message: catchErrorMessages[userLanguage as keyof typeof catchErrorMessages] || catchErrorMessages['ko'],
      usedDocuments: [],
    };
  }
}

export async function extractTextFromContent(filePath: string, mimeType: string): Promise<string> {
  try {
    if (mimeType.includes('text/plain')) {
      // Read text files with proper UTF-8 encoding
      return fs.readFileSync(filePath, 'utf-8');
    }
    
    if (mimeType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') || 
        mimeType.includes('application/msword')) {
      // Extract text from Word documents using mammoth with proper encoding
      console.log('Extracting text from Word document:', filePath);
      try {
        const result = await mammoth.extractRawText({ 
          path: filePath
        });
        
        // Clean extracted text to remove any residual binary characters
        let cleanText = result.value
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove control characters
          .replace(/\uFFFD/g, '') // Remove replacement characters
          .trim();
        
        console.log('Extracted text length:', cleanText.length);
        console.log('First 200 characters:', cleanText.substring(0, 200));
        
        // Verify text is not corrupted
        if (cleanText.includes('PK') || cleanText.includes('[Content_Types]') || 
            cleanText.includes('word/document.xml') || cleanText.length < 10) {
          console.warn('Extracted text appears corrupted, returning error message');
          return '워드 문서 텍스트 추출에 실패했습니다. 원본 파일을 다운로드하여 확인해주세요.';
        }
        
        return cleanText;
      } catch (extractError) {
        console.error('Mammoth extraction failed:', extractError);
        return '워드 문서 텍스트 추출 중 오류가 발생했습니다. 원본 파일을 다운로드하여 확인해주세요.';
      }
    }
    
    if (mimeType.includes('application/pdf')) {
      // Extract text from PDF files using pdf-parse
      console.log('PDF file detected, extracting text:', filePath);
      try {
        // Dynamic import for better error handling
        const pdfParse = require('pdf-parse');
        
        // Check if file exists and is readable
        if (!fs.existsSync(filePath)) {
          console.error('PDF file does not exist:', filePath);
          return 'PDF 파일을 찾을 수 없습니다.';
        }
        
        const dataBuffer = fs.readFileSync(filePath);
        console.log('PDF buffer size:', dataBuffer.length);
        
        // Add timeout to prevent hanging
        const data = await Promise.race([
          pdfParse(dataBuffer),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('PDF parsing timeout')), 30000)
          )
        ]);
        
        if (!data || !data.text) {
          console.warn('No text extracted from PDF');
          return 'PDF 문서에서 텍스트를 추출할 수 없습니다. 이미지 기반 PDF이거나 보호된 문서일 수 있습니다.';
        }
        
        const cleanText = data.text
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove control characters
          .replace(/\uFFFD/g, '') // Remove replacement characters
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        
        console.log('Extracted PDF text length:', cleanText.length);
        console.log('First 200 characters:', cleanText.substring(0, 200));
        
        if (cleanText.length < 10) {
          console.warn('PDF text extraction yielded very short result');
          return 'PDF 문서에서 의미있는 텍스트를 추출할 수 없습니다. 스캔된 이미지 PDF이거나 텍스트가 없는 문서일 수 있습니다.';
        }
        
        return cleanText;
      } catch (pdfError) {
        console.error('PDF extraction failed:', pdfError);
        if (pdfError.message?.includes('timeout')) {
          return 'PDF 문서가 너무 큽니다. 텍스트 추출에 시간이 오래 걸려 중단되었습니다.';
        }
        return `PDF 문서 텍스트 추출 중 오류가 발생했습니다: ${pdfError.message || '알 수 없는 오류'}`;
      }
    }
    
    // For other file types, try to read as UTF-8 text
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      console.log('Could not read file as UTF-8, returning filename only');
      return `파일: ${filePath.split('/').pop() || 'unknown'}`;
    }
    
  } catch (error) {
    console.error('Error extracting text from file:', error);
    return `파일 텍스트 추출 실패: ${filePath.split('/').pop() || 'unknown'}`;
  }
}
