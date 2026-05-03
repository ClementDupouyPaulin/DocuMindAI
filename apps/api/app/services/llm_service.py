import re

from fastapi import HTTPException, status
from openai import OpenAI

from app.core.config import get_settings

settings = get_settings()


class LlmService:
    def __init__(self) -> None:
        self.provider = settings.llm_provider.lower()

        if self.provider == "mock":
            self.client: OpenAI | None = None
            return

        if not settings.openai_api_key or settings.openai_api_key == "your-openai-api-key":
            self.client = None
        else:
            self.client = OpenAI(api_key=settings.openai_api_key)

    def generate_answer(self, question: str, context: str) -> str:
        if self.provider == "mock":
            return self._generate_mock_answer(question=question, context=context)

        if self.client is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="OpenAI API key is not configured.",
            )

        system_prompt = """
Tu es DocuMind AI, un assistant documentaire RAG.

Règles :
- Réponds uniquement à partir du contexte fourni.
- Si le contexte ne contient pas la réponse, dis clairement que les documents ne permettent pas de répondre.
- Cite les sources utilisées avec le format [source_1], [source_2], etc.
- Sois clair, précis et synthétique.
- N'invente aucune information.
""".strip()

        user_prompt = f"""
QUESTION :
{question}

CONTEXTE :
{context}

Réponds à la question avec des citations de sources.
""".strip()

        response = self.client.responses.create(
            model=settings.llm_model,
            input=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ],
        )

        return response.output_text

    def _generate_mock_answer(self, question: str, context: str) -> str:
        excerpts = self._extract_mock_excerpts(context)

        if not excerpts:
            return (
                "Mode démo sans OpenAI.\n\n"
                "Aucun extrait pertinent n’a été retrouvé dans les documents. "
                "DocuMind AI ne peut donc pas répondre à cette question à partir des sources indexées."
            )

        normalized_question = question.lower()

        if self._is_summary_request(normalized_question):
            return self._generate_mock_summary(excerpts)

        return self._generate_mock_qa(question=question, excerpts=excerpts)

    def _is_summary_request(self, question: str) -> bool:
        summary_keywords = [
            "résume",
            "resume",
            "résumé",
            "summary",
            "synthèse",
            "synthese",
            "points clés",
            "points importants",
            "ce qu'il faut retenir",
            "ce qu’il faut retenir",
        ]

        return any(keyword in question for keyword in summary_keywords)

    def _generate_mock_summary(self, excerpts: list[tuple[int, str]]) -> str:
        cleaned_excerpts = [
            (source_index, self._clean_excerpt(text))
            for source_index, text in excerpts
            if self._clean_excerpt(text)
        ]

        if not cleaned_excerpts:
            return (
                "Mode démo sans OpenAI.\n\n"
                "Les sources ont été retrouvées, mais aucun extrait exploitable n’a pu être résumé."
            )

        first_source, first_text = cleaned_excerpts[0]
        summary_text = self._truncate_text(first_text, max_length=420)

        key_points = []
        for source_index, text in cleaned_excerpts[:5]:
            point = self._first_meaningful_sentence(text)
            point = self._truncate_text(point, max_length=220)
            if point:
                key_points.append(f"- {point} [source_{source_index}]")

        notions = self._extract_mock_notions(
            " ".join(text for _, text in cleaned_excerpts)
        )

        notions_block = (
            "\n".join(f"- {notion}" for notion in notions)
            if notions
            else "- Les notions principales sont celles qui reviennent dans les extraits retrouvés."
        )

        takeaway_source = cleaned_excerpts[min(len(cleaned_excerpts) - 1, 1)][0]
        takeaway_text = self._truncate_text(
            cleaned_excerpts[min(len(cleaned_excerpts) - 1, 1)][1],
            max_length=300,
        )

        return (
            "Mode démo sans OpenAI.\n\n"
            "1. Résumé court\n"
            f"{summary_text} [source_{first_source}]\n\n"
            "2. Points clés\n"
            f"{chr(10).join(key_points)}\n\n"
            "3. Notions importantes\n"
            f"{notions_block}\n\n"
            "4. Ce qu’il faut retenir\n"
            f"Le document met surtout en avant les éléments présents dans les chunks indexés. "
            f"Le point central à retenir est : {takeaway_text} [source_{takeaway_source}]\n\n"
            "Cette synthèse est générée localement à partir des chunks récupérés. "
            "Elle sert à démontrer le fonctionnement RAG sans consommer de quota OpenAI."
        )

    def _generate_mock_qa(self, question: str, excerpts: list[tuple[int, str]]) -> str:
        answer_points = []

        for source_index, text in excerpts[:4]:
            cleaned_text = self._clean_excerpt(text)
            point = self._first_meaningful_sentence(cleaned_text)
            point = self._truncate_text(point, max_length=240)

            if point:
                answer_points.append(f"- {point} [source_{source_index}]")

        if not answer_points:
            return (
                "Mode démo sans OpenAI.\n\n"
                "Les documents ont été retrouvés, mais les extraits ne permettent pas "
                "de formuler une réponse fiable."
            )

        return (
            "Mode démo sans OpenAI.\n\n"
            f"Question : {question}\n\n"
            "Réponse basée sur les sources retrouvées :\n"
            f"{chr(10).join(answer_points)}\n\n"
            "Cette réponse est générée localement à partir des chunks récupérés. "
            "Elle sert à démontrer le fonctionnement RAG sans consommer de quota OpenAI."
        )

    def _extract_mock_excerpts(self, context: str, max_excerpts: int = 6) -> list[tuple[int, str]]:
        excerpts: list[tuple[int, str]] = []

        blocks = context.split("---")

        for fallback_index, block in enumerate(blocks, start=1):
            marker = "Extrait:"
            if marker not in block:
                continue

            source_index = self._extract_source_index(block) or fallback_index
            excerpt = block.split(marker, maxsplit=1)[1].strip()
            excerpt = " ".join(excerpt.split())

            if not excerpt:
                continue

            excerpts.append((source_index, excerpt))

            if len(excerpts) >= max_excerpts:
                break

        return excerpts

    def _extract_source_index(self, block: str) -> int | None:
        match = re.search(r"\[source_(\d+)\]", block)

        if not match:
            return None

        return int(match.group(1))

    def _clean_excerpt(self, text: str) -> str:
        cleaned = " ".join(text.split())

        noise_patterns = [
            r"^Question\s*:.*?(?=Synthèse|Source|Extrait|$)",
            r"^Format attendu\s*:.*?(?=Synthèse|Source|Extrait|$)",
            r"Réponds uniquement à partir des extraits fournis\.?",
        ]

        for pattern in noise_patterns:
            cleaned = re.sub(pattern, "", cleaned, flags=re.IGNORECASE | re.DOTALL)

        return cleaned.strip()

    def _first_meaningful_sentence(self, text: str) -> str:
        sentences = re.split(r"(?<=[.!?])\s+", text)

        for sentence in sentences:
            sentence = sentence.strip()

            if len(sentence) >= 45:
                return sentence

        return text.strip()

    def _truncate_text(self, text: str, max_length: int) -> str:
        cleaned = " ".join(text.split())

        if len(cleaned) <= max_length:
            return cleaned

        return f"{cleaned[:max_length].rstrip()}..."

    def _extract_mock_notions(self, text: str, max_notions: int = 6) -> list[str]:
        candidates = re.findall(
            r"\b[A-ZÀ-Ÿ][A-Za-zÀ-ÿ0-9'’\-]{3,}(?:\s+[A-ZÀ-Ÿ][A-Za-zÀ-ÿ0-9'’\-]{3,}){0,3}",
            text,
        )

        ignored = {
            "Mode",
            "Question",
            "Format",
            "Résumé",
            "Source",
            "Extrait",
            "Chunk",
            "Page",
        }

        notions: list[str] = []

        for candidate in candidates:
            cleaned = candidate.strip()

            if cleaned in ignored:
                continue

            if cleaned not in notions:
                notions.append(cleaned)

            if len(notions) >= max_notions:
                break

        return notions


llm_service = LlmService()