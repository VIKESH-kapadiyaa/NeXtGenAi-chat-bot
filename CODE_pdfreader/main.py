import os
import json
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from pypdf import PdfReader
from PIL import Image
import pytesseract
from fastapi.middleware.cors import CORSMiddleware

# Windows-safe explicit path
pytesseract.pytesseract.tesseract_cmd = os.getenv(
    "TESSERACT_CMD", "/usr/bin/tesseract"
)

BASE_DIR = os.path.dirname(__file__)
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
DATA_FOLDER = os.path.join(BASE_DIR, "data")
CHUNK_FILE = os.path.join(DATA_FOLDER, "chunks.json")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATA_FOLDER, exist_ok=True)

app = FastAPI(title="PDF / Image Processor API")



app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# UTILS
# -----------------------------

def extract_text_from_pdf(file_path):
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text


def extract_text_from_image(file_path):
    image = Image.open(file_path)
    return pytesseract.image_to_string(image)


def chunk_text(text, chunk_size=500, overlap=100):
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunks.append(" ".join(words[i:i + chunk_size]))
        i += chunk_size - overlap
    return chunks


# -----------------------------
# API ROUTES
# -----------------------------

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    ext = file.filename.lower().split(".")[-1]
    if ext not in ["pdf", "png", "jpg", "jpeg"]:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        if ext == "pdf":
            text = extract_text_from_pdf(file_path)
        else:
            text = extract_text_from_image(file_path)

        chunks = chunk_text(text)

        # save chunks
        if os.path.exists(CHUNK_FILE):
            with open(CHUNK_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
        else:
            data = []

        for chunk in chunks:
            data.append({
                "source": file.filename,
                "text": chunk
            })

        with open(CHUNK_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

        return {
            "filename": file.filename,
            "total_chunks": len(chunks),
            "chunks": chunks
        }

    finally:
        os.remove(file_path)