
#!/bin/bash
echo "🚀 Excel Q&A 데이터 로딩 스크립트 실행 중..."
echo "=================================================="

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js가 설치되어 있지 않습니다."
    echo "Node.js를 설치한 후 다시 실행해주세요."
    exit 1
fi

# Execute the Q&A loading script
echo "📊 146개의 한국 대학교 Q&A 데이터를 로드하는 중..."
node load_qa_data.js

if [ $? -eq 0 ]; then
    echo ""
    echo "=================================================="
    echo "✅ Excel Q&A 데이터 로딩이 성공적으로 완료되었습니다!"
    echo "📊 146개의 한국 대학교 Q&A 데이터가 시스템에 로드되었습니다."
    echo "📁 생성된 파일: qa_logs.json"
    echo ""
    echo "🎉 Q&A 로그 시스템이 성공적으로 구축되었습니다!"
else
    echo ""
    echo "=================================================="
    echo "❌ 스크립트 실행 중 오류가 발생했습니다."
    echo "로그를 확인하고 다시 시도해주세요."
fi
