import re


def clean_text(text: str) -> str:
    text = text.replace("\x00", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def estimate_token_count(text: str) -> int:
    # Approximation simple pour V1 : 1 token ≈ 4 caractères.
    return max(1, len(text) // 4)


def split_text_into_chunks(
    pages: list[dict[str, int | str | None]],
    chunk_size: int = 1200,
    chunk_overlap: int = 200,
) -> list[dict[str, int | str | None]]:
    chunks: list[dict[str, int | str | None]] = []
    chunk_index = 0

    for page in pages:
        page_number = page["page_number"]
        text = clean_text(str(page["text"] or ""))

        if not text:
            continue

        start = 0

        while start < len(text):
            end = start + chunk_size
            chunk_content = text[start:end].strip()

            if chunk_content:
                chunks.append(
                    {
                        "chunk_index": chunk_index,
                        "content": chunk_content,
                        "token_count": estimate_token_count(chunk_content),
                        "page_number": page_number,
                    }
                )
                chunk_index += 1

            start += chunk_size - chunk_overlap

    return chunks
