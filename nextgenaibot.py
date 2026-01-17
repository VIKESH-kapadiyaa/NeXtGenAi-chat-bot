import os
import json
from pypdf import PdfReader
from PIL import Image
import pytesseract

# -----------------------------
# CONFIG
# -----------------------------
UPLOAD_FOLDER = "uploads"
DATA_FOLDER = "data"
CHUNK_FILE = os.path.join(DATA_FOLDER, "chunks.json")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATA_FOLDER, exist_ok=True)

# -----------------------------
# TEXT EXTRACTION
# -----------------------------
def extract_text_from_pdf(file_path):
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text


def extract_text_from_image(file_path):
    image = Image.open(file_path)
    return pytesseract.image_to_string(image)


# -----------------------------
# CHUNKING
# -----------------------------
def chunk_text(text, chunk_size=500, overlap=100):
    words = text.split()
    chunks = []
    start = 0

    while start < len(words):
        end = start + chunk_size
        chunk_words = words[start:end]
        chunks.append(" ".join(chunk_words))
        start += chunk_size - overlap

    return chunks


# -----------------------------
# STORAGE
# -----------------------------
def save_chunks(chunks, source_file):
    if os.path.exists(CHUNK_FILE):
        with open(CHUNK_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    else:
        data = []

    base_id = len(data)

    for i, chunk in enumerate(chunks):
        data.append({
            "id": base_id + i + 1,
            "source": source_file,
            "text": chunk
        })

    with open(CHUNK_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


# -----------------------------
# MAIN PIPELINE
# -----------------------------
def process_file(file_path):
    filename = os.path.basename(file_path)
    ext = filename.lower()

    print(f"\nProcessing file: {filename}")

    if ext.endswith(".pdf"):
        text = extract_text_from_pdf(file_path)
    elif ext.endswith((".png", ".jpg", ".jpeg")):
        text = extract_text_from_image(file_path)
    else:
        raise ValueError("Unsupported file type")

    if not text.strip():
        print("No text extracted.")
        return

    print("Text extracted ✔")

    chunks = chunk_text(text)
    print(f"Created {len(chunks)} chunks ✔")

    save_chunks(chunks, filename)
    print("Chunks stored ✔\n")


# -----------------------------
# RUN
# -----------------------------
if __name__ == "__main__":
    path = input("Enter file path (PDF/Image): ").strip()
    process_file(path)
