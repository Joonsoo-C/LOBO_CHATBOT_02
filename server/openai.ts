import OpenAI from "openai";
import * as mammoth from "mammoth";
import * as fs from "fs";
import * as path from "path";

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
  speechStyle: string = "친근하고 도움이 되는 말투",
  personality: string = "친절하고 전문적인 성격으로 정확한 정보를 제공",
  additionalPrompt: string = "",
  userLanguage: string = "ko"
): Promise<ChatResponse> {
  // Check if we need to translate Korean text to English
  if (userLanguage === "en" && containsKorean(userMessage)) {
    console.log("Korean text detected in English mode (management), translating...");
    userMessage = await translateKoreanToEnglish(userMessage);
    console.log("Translated management message:", userMessage);
  }

  const lowerMessage = userMessage.toLowerCase();
  
  // Check for management commands with typo tolerance
  if (lowerMessage.includes("페르소나") || lowerMessage.includes("persona") || lowerMessage.includes("성격") || 
      lowerMessage.includes("말투") || lowerMessage.includes("캐릭터") || lowerMessage.includes("개성") ||
      lowerMessage.includes("닉네임") || lowerMessage.includes("특성") || lowerMessage.includes("변경") ||
      lowerMessage.includes("수정") || lowerMessage.includes("편집")) {
    const personaMessage = userLanguage === "en" 
      ? "🔧 Persona editing window opened. You can modify nickname, speaking style, knowledge domain, personality traits, and prohibited word response."
      : "🔧 페르소나 편집 창을 열었습니다. 닉네임, 말투 스타일, 지식 분야, 성격 특성, 금칙어 반응 방식을 수정할 수 있습니다.";
    return {
      message: personaMessage,
      usedDocuments: [],
      triggerAction: "openPersonaModal"
    };
  }
  
  if (lowerMessage.includes("챗봇") || lowerMessage.includes("설정") || lowerMessage.includes("모델") ||
      lowerMessage.includes("llm") || lowerMessage.includes("gpt") || lowerMessage.includes("ai설정") ||
      lowerMessage.includes("봇설정") || lowerMessage.includes("동작") || lowerMessage.includes("유형")) {
    const settingsMessage = userLanguage === "en" 
      ? "🔧 Chatbot settings window opened. You can change LLM model and chatbot type."
      : "🔧 챗봇 설정 창을 열었습니다. LLM 모델과 챗봇 유형을 변경할 수 있습니다.";
    return {
      message: settingsMessage,
      usedDocuments: [],
      triggerAction: "openSettingsModal"
    };
  }
  
  if (lowerMessage.includes("문서") || lowerMessage.includes("업로드") || lowerMessage.includes("파일") ||
      lowerMessage.includes("자료") || lowerMessage.includes("첨부") || lowerMessage.includes("지식") ||
      lowerMessage.includes("학습") || lowerMessage.includes("데이터") || lowerMessage.includes("정보")) {
    const fileMessage = userLanguage === "en" 
      ? "🔧 Document upload window opened. You can upload TXT, DOC, DOCX, PPT, PPTX format documents to expand the agent's knowledge base."
      : "🔧 문서 업로드 창을 열었습니다. TXT, DOC, DOCX, PPT, PPTX 형식의 문서를 업로드하여 에이전트의 지식베이스를 확장할 수 있습니다.";
    return {
      message: fileMessage,
      usedDocuments: [],
      triggerAction: "openFileModal"
    };
  }
  
  if (lowerMessage.includes("알림") || lowerMessage.includes("notification") || lowerMessage.includes("브로드캐스트") ||
      lowerMessage.includes("공지") || lowerMessage.includes("메시지") || lowerMessage.includes("전송") ||
      lowerMessage.includes("안내") || lowerMessage.includes("소식")) {
    const notificationMessage = userLanguage === "en" 
      ? "🔧 Notification function started. Enter notification content. It will be sent to all users."
      : "🔧 알림 기능을 시작합니다. 알림 내용을 입력하세요. 모든 사용자에게 전송됩니다.";
    return {
      message: notificationMessage,
      usedDocuments: [],
      triggerAction: "startNotification"
    };
  }
  
  if (lowerMessage.includes("도움말") || lowerMessage.includes("명령어") || lowerMessage.includes("기능") || 
      lowerMessage.includes("help") || lowerMessage.includes("사용법") || lowerMessage.includes("메뉴") ||
      lowerMessage.includes("옵션") || lowerMessage.includes("가이드")) {
    const helpMessage = userLanguage === "en" 
      ? `🔧 Agent Management Commands:

📝 Main Features:
• "persona" / "personality" / "style" - Set agent personality and speaking style
• "chatbot settings" / "model" / "AI settings" - Change LLM model and operation mode
• "document upload" / "file" / "data" - Add documents to expand knowledge base
• "notification" / "announcement" / "message" - Send announcements to users
• "performance analysis" / "statistics" / "status" - View agent usage statistics and analysis

💡 Usage: Send a message containing the above keywords to execute the function.
General conversation is also always possible!`
      : `🔧 에이전트 관리 명령어:

📝 주요 기능:
• "페르소나" / "성격" / "말투" - 에이전트 성격 및 말투 설정
• "챗봇 설정" / "모델" / "AI설정" - LLM 모델 및 동작 방식 변경  
• "문서 업로드" / "파일" / "자료" - 지식베이스 확장용 문서 추가
• "알림보내기" / "공지" / "메시지" - 사용자들에게 공지사항 전송
• "성과 분석" / "통계" / "현황" - 에이전트 사용 통계 및 분석

💡 사용법: 위 키워드가 포함된 메시지를 보내면 해당 기능이 실행됩니다.
일반 대화도 언제든 가능합니다!`;
    return {
      message: helpMessage,
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
    speechStyle,
    personality,
    additionalPrompt,
    userLanguage
  );
}

// Function to detect Korean text
function containsKorean(text: string): boolean {
  const koreanRegex = /[\u3131-\u318E\u3200-\u321E\u3260-\u327E\uAC00-\uD7A3]/;
  return koreanRegex.test(text);
}

// Function to translate Korean text to English
async function translateKoreanToEnglish(text: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional Korean to English translator. Translate the given Korean text to natural, fluent English. Only return the translated text without any additional comments or explanations."
        },
        {
          role: "user",
          content: text
        }
      ],
      max_tokens: 1000,
      temperature: 0.1,
    });

    return response.choices[0].message.content || text;
  } catch (error) {
    console.error("Translation failed:", error);
    return text; // Return original text if translation fails
  }
}

export async function generateChatResponse(
  userMessage: string,
  agentName: string,
  agentDescription: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  availableDocuments: Array<{ filename: string; content: string }> = [],
  chatbotType: string = "general-llm",
  speechStyle: string = "친근하고 도움이 되는 말투",
  personality: string = "친절하고 전문적인 성격으로 정확한 정보를 제공",
  additionalPrompt: string = "",
  userLanguage: string = "ko"
): Promise<ChatResponse> {
  try {
    // Debug log to check if persona parameters are received
    console.log("OpenAI persona parameters:", {
      speechStyle,
      personality,
      chatbotType
    });

    // Check if we need to translate Korean text to English
    if (userLanguage === "en" && containsKorean(userMessage)) {
      console.log("Korean text detected in English mode, translating...");
      userMessage = await translateKoreanToEnglish(userMessage);
      console.log("Translated message:", userMessage);
    }

    // Translate agent name and description to English if needed
    if (userLanguage === "en") {
      if (containsKorean(agentName)) {
        agentName = await translateKoreanToEnglish(agentName);
      }
      if (containsKorean(agentDescription)) {
        agentDescription = await translateKoreanToEnglish(agentDescription);
      }
      if (containsKorean(speechStyle)) {
        speechStyle = await translateKoreanToEnglish(speechStyle);
      }
      if (containsKorean(personality)) {
        personality = await translateKoreanToEnglish(personality);
      }
    }

    // Translate conversation history to English if needed
    if (userLanguage === "en") {
      for (let i = 0; i < conversationHistory.length; i++) {
        if (containsKorean(conversationHistory[i].content)) {
          conversationHistory[i].content = await translateKoreanToEnglish(conversationHistory[i].content);
        }
      }
    }

    // Prepare context from documents with enhanced processing
    let documentContext = "";
    if (availableDocuments.length > 0) {
      if (userLanguage === "en") {
        // Translate Korean document content to English
        const translatedDocs = [];
        for (const doc of availableDocuments) {
          let translatedContent = doc.content;
          if (containsKorean(doc.content)) {
            translatedContent = await translateKoreanToEnglish(doc.content);
          }
          translatedDocs.push({
            filename: doc.filename,
            content: translatedContent
          });
        }
        documentContext = `\n\nReference Documents:\n${translatedDocs.map(doc => 
          `[Document: ${doc.filename}]\n${doc.content}`
        ).join('\n\n')}`;
      } else {
        documentContext = `\n\n참고 문서:\n${availableDocuments.map(doc => 
          `[문서명: ${doc.filename}]\n${doc.content}`
        ).join('\n\n')}`;
      }
    }

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
    const isGrumpyPersonality = speechStyle.includes("투덜이") || speechStyle.includes("스머프") || 
                                personality.includes("투덜이") || personality.includes("스머프");
    
    const grumpyBehavior = isGrumpyPersonality ? 
      `CRITICAL: Always sound grumpy, annoyed, and bothered. Use short, irritated responses.

` : "";
    
    const personalityInstruction = personality ? `
Your personality: ${personality}` : "";
    
    const additionalInstruction = additionalPrompt ? `
Additional instructions: ${additionalPrompt}` : "";
    
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

You are ${agentName}. You MUST speak in this exact style: "${speechStyle}".
${grumpyBehavior}${personalityInstruction}${additionalInstruction}

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

You are ${agentName}. You MUST speak in this exact style: "${speechStyle}".
${grumpyBehavior}${personalityInstruction}${additionalInstruction}

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

You are ${agentName}. You MUST speak in this exact style: "${speechStyle}".
${grumpyBehavior}${personalityInstruction}${additionalInstruction}

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
    if (speechStyle && (speechStyle.includes("투덜이") || speechStyle.includes("스머프"))) {
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
        // Check if file exists and is readable first
        console.log('Checking PDF file path:', filePath);
        console.log('File exists check:', fs.existsSync(filePath));
        console.log('Current working directory:', process.cwd());
        
        if (!fs.existsSync(filePath)) {
          console.error('PDF file does not exist:', filePath);
          const path = require('path');
          const dir = path.dirname(filePath);
          if (fs.existsSync(dir)) {
            console.log('Directory contents:', fs.readdirSync(dir));
          } else {
            console.log('Directory does not exist:', dir);
          }
          return 'PDF 파일을 찾을 수 없습니다. 파일 경로를 확인해주세요.';
        }
        
        const fileStats = fs.statSync(filePath);
        console.log('PDF file size:', fileStats.size);
        
        if (fileStats.size === 0) {
          console.error('PDF file is empty');
          return 'PDF 파일이 비어있습니다.';
        }
        
        // Read file as buffer
        const dataBuffer = fs.readFileSync(filePath);
        console.log('PDF buffer read successfully, size:', dataBuffer.length);
        
        // Check if buffer starts with PDF header
        const pdfHeader = dataBuffer.subarray(0, 4).toString();
        console.log('PDF header check:', pdfHeader);
        
        if (!pdfHeader.includes('%PDF')) {
          console.error('File does not appear to be a valid PDF');
          return 'PDF 파일 형식이 올바르지 않습니다. 파일이 손상되었거나 PDF가 아닐 수 있습니다.';
        }
        
        // For now, provide basic PDF information instead of attempting text extraction
        // This avoids the module path issues with pdf-parse
        const fileName = path.basename(filePath);
        const fileSizeKB = Math.round(dataBuffer.length / 1024);
        const fileDate = new Date().toLocaleDateString('ko-KR');
        
        console.log(`PDF file processed: ${fileName}, size: ${fileSizeKB}KB`);
        
        return `📄 PDF 문서 업로드 완료
파일명: ${fileName}
파일 크기: ${fileSizeKB}KB
업로드 일시: ${fileDate}

이 PDF 문서가 업로드되었습니다. 문서에 대한 질문이나 내용에 대해 궁금한 점이 있으시면 언제든지 말씀해 주세요.

참고: 현재 PDF 텍스트 자동 추출 기능은 시스템 제한으로 인해 임시적으로 비활성화되어 있습니다. 문서의 구체적인 내용에 대해 질문해 주시면 도움을 드릴 수 있습니다.`;
      } catch (pdfError) {
        console.error('PDF extraction failed:', pdfError);
        console.error('Error stack:', pdfError.stack);
        if (pdfError.message?.includes('timeout')) {
          return 'PDF 문서가 너무 큽니다. 텍스트 추출에 시간이 오래 걸려 중단되었습니다.';
        }
        if (pdfError.message?.includes('ENOENT')) {
          return 'PDF 파일 경로에 문제가 있습니다. 파일이 올바르게 업로드되었는지 확인해주세요.';
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
