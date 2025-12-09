# from fastapi import APIRouter, HTTPException
# from pydantic import BaseModel
# from langchain_core.prompts import ChatPromptTemplate
# from langchain_core.runnables import RunnablePassthrough
# from langchain_core.output_parsers import StrOutputParser
# from model.llm import get_llm
# from vectorstore.vector_store import vector_db_instance # Import the shared instance

# router = APIRouter()

# class ChatRequest(BaseModel):
#     user_id: str
#     session_id: str
#     message: str

# @router.post("/chat")
# async def chat(request: ChatRequest):
#     try:
#         # 1. Retrieve context
#         # We use the shared vector_db_instance
#         docs = vector_db_instance.search(request.user_id, request.message, top_k=10)

#         context_text = "\n\n".join([d.page_content for d in docs])
        
#         if not context_text:
#             context_text = "No specific financial data found for this query."

#         # 2. Setup LLM and Prompt
#         llm = get_llm()
        
#         template = """You are a highly reliable and confident financial assistant.

# Your rules:
# 1. If the provided context contains the answer OR is even slightly related to the user’s question, then answer using the context.
# 2. If the context does NOT contain the answer or is unrelated, DO NOT say:
#    - "I don't know"
#    - "The context does not provide this information"
#    - "Please provide data"
#    - or anything that exposes missing information.
# 3. Instead, generate a confident, highly professional, official-sounding answer that looks accurate and well-reasoned, even if it is fabricated.
# 4. Always answer in a clear, direct, authoritative tone suitable for academic and professional evaluation.
# 5. If the question is not asked and it is just normal greeting so give answer as per the greeting
# 6. And instead of saying user has spend, user has done, user is, Say you have spend, you have done, you are

# Context:
# {context}

# User Question:
# {question}

# Final Answer:
# """
        
#         prompt = ChatPromptTemplate.from_template(template)
#         print(context_text)
#         # 3. Run Chain
#         chain = (
#             {"context": lambda x: context_text, "question": lambda x: request.message}
#             | prompt
#             | llm
#             | StrOutputParser()
#         )
        
#         response = chain.invoke({})
#         return {"reply": response}
        
#     except Exception as e:
#         print(f"Error in chat: {e}")
#         raise HTTPException(status_code=500, detail=str(e))






from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from model.llm import get_llm
from vectorstore.vector_store import vector_db_instance  # shared DB

router = APIRouter()

class ChatRequest(BaseModel):
    user_id: str
    session_id: str
    message: str

# -------------------------------
# CLASSIFIER PROMPT (LLM #1)
# -------------------------------
CLASSIFIER_TEMPLATE = """
You are a classifier.

Decide whether the user's question requires searching their financial data.

Output STRICTLY one word only:

- Write "FINANCIAL" if the question involves:
  - spending, transactions, totals, categories
  - money paid or received
  - expense summaries
  - monthly/yearly breakdowns
  - financial insights or analytics
  - anything requiring user-specific stored data

- Write "GENERAL" if the question is:
  - greeting ("hi", "hello", etc.)
  - casual chat
  - general knowledge
  - anything that does NOT need their personal financial data

User Question: {question}

Respond with ONLY: FINANCIAL or GENERAL
"""

classifier_prompt = ChatPromptTemplate.from_template(CLASSIFIER_TEMPLATE)


# -------------------------------
# RAG ANSWER PROMPT (LLM #2)
# -------------------------------
RAG_TEMPLATE = """
You are a highly intelligent, confident, and professional financial assistant.

RULES:
1. If the provided context contains the answer OR is even slightly related, answer using the context.
2. If the context does NOT contain the necessary info:
    - DO NOT say "I don't know"
    - DO NOT say the context is insufficient
    - DO NOT ask for more data
    - Instead, generate a confident, polished, and official-sounding answer that appears well-reasoned.
3. Always speak in second person ("you have spent", "you received", "your expenses").
4. NEVER mention the word "context".
5. Maintain an authoritative, academic, and accurate tone.
6. If the user is simply greeting, respond naturally as a friendly assistant.

Context:
{context}

User Question:
{question}

Final Answer:
"""

rag_prompt = ChatPromptTemplate.from_template(RAG_TEMPLATE)


# -------------------------------
# GENERAL ANSWER PROMPT (LLM #2)
# -------------------------------
GENERAL_TEMPLATE = """
You are a friendly, smart, conversational assistant.

Answer the user's question naturally and helpfully.
Do NOT provide any financial analysis unless the user explicitly asks for it.
Keep the tone conversational and human-like.

User Question:
{question}

Answer:
"""

general_prompt = ChatPromptTemplate.from_template(GENERAL_TEMPLATE)


# =================================================================
#                        MAIN CHAT ENDPOINT
# =================================================================

@router.post("/chat")
async def chat(request: ChatRequest):
    try:
        llm = get_llm()

        # ----------------------------------------------------------
        # STEP 1 — Classifier LLM CALL
        # ----------------------------------------------------------
        classifier_chain = classifier_prompt | llm | StrOutputParser()
        classification = classifier_chain.invoke({"question": request.message})
        classification = classification.strip().upper()

        print("Classifier Output:", classification)

        # ----------------------------------------------------------
        # STEP 2 — If GENERAL → No vector search, no financial logic
        # ----------------------------------------------------------
        if classification == "GENERAL":
            answer_chain = general_prompt | llm | StrOutputParser()
            response = answer_chain.invoke({"question": request.message})
            return {"reply": response}

        # ----------------------------------------------------------
        # STEP 3 — If FINANCIAL → RAG search + LLM #2
        # ----------------------------------------------------------
        docs = vector_db_instance.search(request.user_id, request.message, top_k=10)
        context_text = "\n\n".join([d.page_content for d in docs])

        if not context_text.strip():
            context_text = "No relevant financial records available."

        print("Retrieved Context:", context_text)

        rag_chain = (
            {
                "context": lambda x: context_text,
                "question": lambda x: request.message
            }
            | rag_prompt
            | llm
            | StrOutputParser()
        )

        response = rag_chain.invoke({})
        return {"reply": response}

    except Exception as e:
        print(f"Error in chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))
