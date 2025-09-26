#!/usr/bin/env python3
"""
Test script to verify the email processing system components
"""

import sys
from pathlib import Path
import logging

# Set up simple logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_imports():
    """Test if all required modules can be imported"""
    logger.info("Testing imports...")
    
    try:
        import extract_msg
        logger.info("✅ extract_msg imported successfully")
    except ImportError as e:
        logger.error(f"❌ extract_msg import failed: {e}")
        return False
    
    try:
        import pypff
        logger.info("✅ pypff imported successfully") 
    except ImportError as e:
        logger.error(f"❌ pypff import failed: {e}")
        return False
        
    try:
        import requests
        logger.info("✅ requests imported successfully")
    except ImportError as e:
        logger.error(f"❌ requests import failed: {e}")
        return False
    
    return True

def test_directory_structure():
    """Test if required directories exist"""
    logger.info("Testing directory structure...")
    
    required_dirs = [
        "src/input/unsorted",
        "src/msg-processor/input",
        "src/msg-processor/output", 
        "src/pst-processor/input",
        "src/pst-processor/output",
        "src/contacts-extractor"
    ]
    
    all_exist = True
    for dir_path in required_dirs:
        if Path(dir_path).exists():
            logger.info(f"✅ {dir_path} exists")
        else:
            logger.error(f"❌ {dir_path} missing")
            all_exist = False
    
    return all_exist

def test_script_files():
    """Test if all Python scripts exist and are readable"""
    logger.info("Testing script files...")
    
    script_files = [
        "src/file_sorter.py",
        "src/pst-processor/processor.py",
        "src/msg-processor/processor.py", 
        "src/email_deduplicator.py",
        "src/contacts-extractor/contact_extractor.py",
        "src/contacts-extractor/csv_converter.py",
        "src/main_orchestrator.py"
    ]
    
    all_exist = True
    for script_path in script_files:
        if Path(script_path).exists():
            logger.info(f"✅ {script_path} exists")
        else:
            logger.error(f"❌ {script_path} missing")
            all_exist = False
    
    return all_exist

def test_ollama_connection():
    """Test if Ollama is accessible (optional)"""
    logger.info("Testing Ollama connection...")
    
    try:
        import requests
        response = requests.get("http://localhost:11434/api/version", timeout=5)
        if response.ok:
            logger.info("✅ Ollama API is accessible")
            return True
        else:
            logger.warning("⚠️ Ollama API returned error status")
            return False
    except Exception as e:
        logger.warning(f"⚠️ Ollama API not accessible: {e}")
        logger.info("   This is optional - you can start Ollama later with: ollama serve")
        return False

def main():
    """Run all tests"""
    logger.info("="*50)
    logger.info("Email Processing System - Test Suite")
    logger.info("="*50)
    
    tests = [
        ("Python imports", test_imports),
        ("Directory structure", test_directory_structure), 
        ("Script files", test_script_files),
        ("Ollama connection", test_ollama_connection)  # Optional
    ]
    
    results = []
    for test_name, test_func in tests:
        logger.info(f"\n🧪 Running {test_name} test...")
        result = test_func()
        results.append((test_name, result))
    
    # Summary
    logger.info("="*50)
    logger.info("Test Results Summary:")
    logger.info("="*50)
    
    passed = 0
    for test_name, result in results:
        if result:
            logger.info(f"✅ {test_name}: PASSED")
            passed += 1
        else:
            if test_name == "Ollama connection":
                logger.info(f"⚠️ {test_name}: OPTIONAL (can be set up later)")
            else:
                logger.error(f"❌ {test_name}: FAILED")
    
    # Final verdict
    critical_tests = len(tests) - 1  # Exclude Ollama test
    if passed >= critical_tests:
        logger.info("\n🎉 System is ready to use!")
        logger.info("Next steps:")
        logger.info("1. Start Ollama: ollama serve (if not running)")
        logger.info("2. Pull model: ollama pull qwen2.5:7b")
        logger.info("3. Place test files in src/input/unsorted/")
        logger.info("4. Run: python src/main_orchestrator.py")
        return True
    else:
        logger.error("\n❌ System has issues that need to be resolved")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)