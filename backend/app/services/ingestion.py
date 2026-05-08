import os
from pathlib import Path

from langchain_text_splitters import RecursiveCharacterTextSplitter
from PyPDF2 import PdfReader

from app.vector_store.client import get_or_create_collection


def extract_text(file_path: str) -> str:
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix == ".pdf":
        reader = PdfReader(file_path)
        return "\n\n".join(page.extract_text() or "" for page in reader.pages)
    elif suffix in (".txt", ".md", ".csv", ".json"):
        return path.read_text(encoding="utf-8")
    else:
        return path.read_text(encoding="utf-8", errors="ignore")


def ingest_document(collection_id: str, document_id: str, file_path: str, filename: str) -> int:
    """Chunk and embed a document into the vector store. Returns chunk count."""
    text = extract_text(file_path)
    if not text.strip():
        return 0

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
    )
    chunks = splitter.split_text(text)

    if not chunks:
        return 0

    collection = get_or_create_collection(collection_id)
    collection.add(
        documents=chunks,
        ids=[f"{document_id}_chunk_{i}" for i in range(len(chunks))],
        metadatas=[
            {
                "document_id": document_id,
                "source_filename": filename,
                "chunk_index": i,
            }
            for i in range(len(chunks))
        ],
    )

    return len(chunks)
