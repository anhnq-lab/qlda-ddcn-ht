import PyPDF2
import sys

def main():
    pdf_path = sys.argv[1]
    out_path = sys.argv[2]
    try:
        reader = PyPDF2.PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        with open(out_path, 'w', encoding='utf-8', errors='ignore') as f:
            f.write(text)
        print("Success")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
