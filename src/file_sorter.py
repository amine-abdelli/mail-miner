import os
import shutil
import logging
from pathlib import Path

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def sort_files():
    """
    Sort files from src/input/unsorted into appropriate processor input folders.
    .msg files go to src/msg-processor/input/
    .pst files go to src/pst-processor/input/
    """
    # Define paths
    unsorted_dir = Path("src/input/unsorted")
    msg_input_dir = Path("src/msg-processor/input")
    pst_input_dir = Path("src/pst-processor/input")
    
    # Ensure directories exist
    msg_input_dir.mkdir(parents=True, exist_ok=True)
    pst_input_dir.mkdir(parents=True, exist_ok=True)
    
    # Check if unsorted directory exists and has files
    if not unsorted_dir.exists():
        logger.warning(f"Unsorted directory {unsorted_dir} does not exist")
        return
    
    # Get all files from unsorted directory
    files = list(unsorted_dir.glob("*"))
    files = [f for f in files if f.is_file()]  # Filter out directories
    
    if not files:
        logger.warning(f"No files found in {unsorted_dir}")
        return
    
    logger.info(f"Found {len(files)} files to sort")
    
    msg_count = 0
    pst_count = 0
    other_count = 0
    
    for file_path in files:
        file_extension = file_path.suffix.lower()
        
        try:
            if file_extension == '.msg':
                destination = msg_input_dir / file_path.name
                shutil.move(str(file_path), str(destination))
                msg_count += 1
                logger.info(f"Moved {file_path.name} to {msg_input_dir}")
                
            elif file_extension == '.pst':
                destination = pst_input_dir / file_path.name
                shutil.move(str(file_path), str(destination))
                pst_count += 1
                logger.info(f"Moved {file_path.name} to {pst_input_dir}")
                
            else:
                logger.warning(f"Unsupported file type: {file_path.name} (extension: {file_extension})")
                other_count += 1
                
        except Exception as e:
            logger.error(f"Error moving {file_path.name}: {str(e)}")
    
    logger.info(f"File sorting completed: {msg_count} .msg files, {pst_count} .pst files, {other_count} other files")
    return {
        'msg_files': msg_count,
        'pst_files': pst_count,
        'other_files': other_count
    }

if __name__ == "__main__":
    sort_files()