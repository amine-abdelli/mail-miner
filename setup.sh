#!/bin/bash

echo "🚀 Email Processing System Setup"
echo "================================="

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Check if pip3 is available
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3 first."
    exit 1
fi

echo "✅ pip3 found"

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📚 Installing Python dependencies..."
pip install -r requirements.txt

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Activate the virtual environment: source venv/bin/activate"
echo "2. Install and start Ollama:"
echo "   - Install from: https://ollama.ai/"
echo "   - Pull model: ollama pull qwen2.5:7b"
echo "   - Start server: ollama serve"
echo "3. Place your .msg and .pst files in src/input/unsorted/"
echo "4. Run the system: python src/main_orchestrator.py"
echo ""
echo "🎉 Ready to process emails!"