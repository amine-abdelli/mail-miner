# Email Processing System

A Python-based email processing system that extracts contact information from .msg and .pst files using AI-powered text analysis.

## Features

- **File Sorting**: Automatically sorts .msg and .pst files from an unsorted directory
- **Email Processing**: Extracts email metadata from both PST and MSG file formats
- **Deduplication**: Removes duplicate emails based on sender email address
- **AI Contact Extraction**: Uses Ollama LLM to extract contact information from email content
- **CSV Export**: Converts extracted contacts to CSV format for easy use

## Prerequisites

1. **Python 3.8+**
2. **Ollama** - Local LLM inference server
   - Install from: https://ollama.ai/
   - Required model: `qwen2.5:7b`

## Installation

1. Clone the repository and navigate to the project directory

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Install and start Ollama:
```bash
# Install Ollama (see https://ollama.ai/ for your platform)
# Then pull the required model:
ollama pull qwen2.5:7b

# Start Ollama server:
ollama serve
```

## Usage

### Quick Start

1. Place your .msg and .pst files in `src/input/unsorted/`

2. Run the complete processing pipeline:
```bash
python src/main_orchestrator.py
```

### Step-by-Step Usage

You can also run individual components:

```bash
# 1. Sort files
python src/file_sorter.py

# 2. Process PST files
python src/pst-processor/processor.py

# 3. Process MSG files  
python src/msg-processor/processor.py

# 4. Deduplicate emails
python src/email_deduplicator.py

# 5. Extract contacts
python src/contacts-extractor/contact_extractor.py

# 6. Convert to CSV
python src/contacts-extractor/csv_converter.py
```

## Directory Structure

```
src/
├── input/
│   └── unsorted/              # Place your .msg and .pst files here
├── msg-processor/
│   ├── input/                 # Sorted .msg files (auto-populated)
│   ├── output/                # JSON output from .msg processing
│   └── processor.py           # MSG file processor
├── pst-processor/
│   ├── input/                 # Sorted .pst files (auto-populated)
│   ├── output/                # JSON output from .pst processing  
│   └── processor.py           # PST file processor
├── contacts-extractor/        # Contact extraction and CSV conversion
│   ├── temp/                  # Temporary processing files
│   ├── contact_extractor.py   # Ollama-powered contact extraction
│   └── csv_converter.py       # CSV conversion utilities
├── file_sorter.py             # File sorting logic
├── email_deduplicator.py      # Email deduplication
└── main_orchestrator.py       # Main workflow coordinator
```

## Output

The system generates several output files:

- **JSON Files**: Raw extracted email data and deduplicated results
- **CSV Files**: 
  - `contacts_export_YYYYMMDD_HHMMSS.csv` - Standard contact export
  - `contacts_detailed_YYYYMMDD_HHMMSS.csv` - Detailed export with analysis
- **Summary Files**: Processing statistics and metadata
- **Log Files**: Detailed processing logs

## Extracted Contact Fields

The system extracts the following contact information:

- **email**: Contact's email address
- **full_name**: Complete name
- **mobile_phone**: Mobile phone number
- **landline_phone**: Landline phone number  
- **company**: Company/organization name
- **role**: Job title or position
- **address**: Physical address

## Email Object Structure

Each processed email is stored as a JSON object with this structure:

```json
{
  "subject": "Email subject line",
  "messageId": "<unique-message-id>",
  "senderName": "Sender Display Name", 
  "senderEmail": "sender@example.com",
  "body": "Email body content...",
  "sentAt": "12/03/2011 - 12h43"
}
```

## Deduplication Logic

The system removes duplicate emails by:
1. Grouping emails by sender email address (case-insensitive)
2. Keeping only the first email from each sender
3. This ensures one contact per unique email address

## Troubleshooting

### Common Issues

1. **Ollama not accessible**: Ensure Ollama is running on `localhost:11434`
2. **Missing dependencies**: Install required packages with `pip install -r requirements.txt`  
3. **No files found**: Check that .msg/.pst files are in `src/input/unsorted/`
4. **Permission errors**: Ensure write permissions for output directories

### Debug Mode

Enable debug logging by modifying the logging level in any script:
```python
logging.basicConfig(level=logging.DEBUG, ...)
```

### Memory Usage

For large PST files, the system processes emails in batches and saves intermediate results to prevent memory issues.

## Dependencies

- **libpff-python**: PST file parsing
- **extract-msg**: MSG file parsing  
- **requests**: HTTP client for Ollama API
- **Ollama**: Local LLM inference (external dependency)

## License

This project is licensed under the MIT License.
