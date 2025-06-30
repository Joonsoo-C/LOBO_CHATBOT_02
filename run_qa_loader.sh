
#!/bin/bash

echo "🚀 Q&A 데이터 로딩 스크립트 실행 중..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js가 설치되어 있지 않습니다. Node.js를 먼저 설치해주세요."
    exit 1
fi

echo "📦 의존성 패키지 설치 중..."
npm install xlsx

echo "📊 Excel Q&A 데이터 로딩 시작..."
node load_qa_data.js

echo "✅ Q&A 데이터 로딩 완료!"
