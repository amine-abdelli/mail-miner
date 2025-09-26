# Installation Guide

## Quick Setup for macOS

Since you have Python 3.13.7 and pip3 installed, here's the quickest way to get started:

### 1. Automated Setup (Recommended)
```bash
./setup.sh
```

### 2. Manual Setup
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip3 install -r requirements.txt
```

### 3. Install Ollama
```bash
# Install Ollama (if not already installed)
# Visit https://ollama.ai/ and download for macOS
# Or use Homebrew:
brew install ollama

# Pull the required model
ollama pull qwen2.5:7b

# Start Ollama server (in a separate terminal)
ollama serve
```

### 4. Verify Installation
```bash
# Check if all dependencies are installed
python3 -c "import extract_msg, pypff, requests; print('✅ All dependencies installed')"

# Test Ollama connection
curl http://localhost:11434/api/version
```

## Troubleshooting

### pip command not found
Use `pip3` instead of `pip`:
```bash
pip3 install -r requirements.txt
```

### Permission errors
If you get permission errors, use the virtual environment:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### libpff-python installation issues
On macOS, you might need to install additional dependencies:
```bash
# If libpff-python fails to install
brew install autoconf automake libtool pkg-config

# Then retry
pip3 install libpff-python==20240506
```

### extract-msg installation issues
```bash
# If extract-msg fails
pip3 install --upgrade setuptools wheel
pip3 install extract-msg==0.41.1
```

## Testing the Installation

1. Place a test .msg or .pst file in `src/input/unsorted/`
2. Run a quick test:
```bash
python3 src/file_sorter.py
```

If it runs without errors, your installation is successful!