# coding: utf8
"""
PdfGen Test Script
==================
This script allows testing PdfGen.py independently without the Electron application.
Useful for debugging and development purposes.
"""

import os
import sys
import json
from PdfGen import generate

# Test parameters - modify these as needed for testing
TEST_PARAMS = {
    "main": "C:\\Users\\Moshe\\Nextcloud\\ויסאם\\משפחת שומלי\\היתר בניה.pdf",
    "attachments": [
        {
            "path": "C:\\Users\\Moshe\\Nextcloud\\ויסאם\\משפחת שומלי\\צו ירושה- אגליה בחוס.pdf",
            "title": "צו ירושה- אגליה בחוס"
        }
    ],
    "output": {
        "path": "C:\\Users\\Moshe\\Desktop\\כתב טענות.pdf"
    },
    "isDraft": False  # Set to True to add draft watermark
}

def main():
    """Run PdfGen with test parameters"""
    sys.stdout.reconfigure(encoding='utf-8')  # Ensure UTF-8 output
    
    # Set base_dir (same as in PdfGen.py)
    if getattr(sys, 'frozen', False):
        base_dir = os.path.dirname(sys.executable)
        internal_dir = os.path.join(base_dir, "_internal")
        if os.path.exists(internal_dir):
            base_dir = internal_dir
    else:
        base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Make base_dir available globally (PdfGen.py uses it)
    import PdfGen
    PdfGen.base_dir = base_dir
    
    print("=" * 60)
    print("PdfGen Test Script")
    print("=" * 60)
    print("\nTest Parameters:")
    print(json.dumps(TEST_PARAMS, indent=2, ensure_ascii=False))
    print("\n" + "=" * 60)
    
    # Validate input files exist
    print("\nValidating input files...")
    if not os.path.exists(TEST_PARAMS["main"]):
        print(f"ERROR: Main file not found: {TEST_PARAMS['main']}")
        return
    else:
        print(f"✓ Main file exists: {TEST_PARAMS['main']}")
    
    for i, attachment in enumerate(TEST_PARAMS["attachments"], 1):
        if not os.path.exists(attachment["path"]):
            print(f"ERROR: Attachment {i} not found: {attachment['path']}")
            return
        else:
            print(f"✓ Attachment {i} exists: {attachment['path']}")
    
    # Check output directory exists
    output_dir = os.path.dirname(TEST_PARAMS["output"]["path"])
    if not os.path.exists(output_dir):
        print(f"\nERROR: Output directory not found: {output_dir}")
        return
    else:
        print(f"✓ Output directory exists: {output_dir}")
    
    print("\n" + "=" * 60)
    print("Starting PDF generation...")
    print("=" * 60 + "\n")
    
    # Run the generation without FIFO pipe (for testing)
    # We pass None as the fifo parameter
    result = generate(None, TEST_PARAMS)
    
    print("\n" + "=" * 60)
    print("Result:")
    print("=" * 60)
    
    # Handle potential exception objects in result
    if result.get("status") == "success":
        print(json.dumps(result, indent=2, ensure_ascii=False))
        print("\n✓ PDF generated successfully!")
        if "output" in result and "path" in result["output"]:
            print(f"Output file: {result['output']['path']}")
    else:
        print("\n✗ PDF generation failed!")
        if "msg" in result:
            error_msg = result["msg"]
            # Convert exception object to string if needed
            if isinstance(error_msg, Exception):
                print(f"Error type: {type(error_msg).__name__}")
                print(f"Error message: {str(error_msg)}")
                # Print full traceback if available
                import traceback
                print("\nFull traceback:")
                traceback.print_exception(type(error_msg), error_msg, error_msg.__traceback__)
            else:
                print(f"Error: {error_msg}")
        else:
            print(json.dumps(result, indent=2, ensure_ascii=False, default=str))

if __name__ == "__main__":
    main()
