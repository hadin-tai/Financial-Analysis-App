import os
from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace

from langchain_ollama import ChatOllama



def get_llm():
    """
    Returns a configured HuggingFace Endpoint LLM.
    # """

    # return ChatOllama(
    #     model="gemma3:1b"     # 100% works on 4GB VRAM
    # )

    return ChatHuggingFace(
        llm=HuggingFaceEndpoint(
            repo_id="google/gemma-2-2b-it",
            task="conversational",
            max_new_tokens=512,
            huggingfacehub_api_token=os.getenv("HUGGINGFACEHUB_API_TOKEN"),
        )
    )
