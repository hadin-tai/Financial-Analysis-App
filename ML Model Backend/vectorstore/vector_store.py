import os
from typing import List, Dict, Any
from langchain_huggingface import HuggingFaceEndpointEmbeddings,HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

os.environ['HF_HOME'] = 'D:/huggingface_cache'


class VectorStore:
    def __init__(self):
        token = os.getenv("HUGGINGFACEHUB_API_TOKEN")
        if not token:
            raise ValueError("HUGGINGFACEHUB_API_TOKEN is not set in the environment variables.")
            
        # self.embeddings = HuggingFaceEndpointEmbeddings(
        #     model="sentence-transformers/all-MiniLM-L6-v2",
        #     task="feature-extraction",
        #     huggingfacehub_api_token=token,
        # )
        
        self.embeddings = HuggingFaceEmbeddings(model_name='sentence-transformers/all-MiniLM-L6-v2')
        self.vector_db = None

    def add_documents(self, user_id: str, documents: List[Dict[str, Any]]):
        """
        Adds documents to the vector store.
        documents: List of dicts with 'text' and 'metadata'.
        """
        if not documents:
            return

        docs = []
        for doc in documents:
            # Ensure userId is in metadata
            metadata = doc.get("metadata", {})
            metadata["user_id"] = user_id
            docs.append(Document(page_content=doc["text"], metadata=metadata))
        
        if self.vector_db is None:
            self.vector_db = FAISS.from_documents(docs, self.embeddings)
        else:
            self.vector_db.add_documents(docs)

    def delete_user_vectors(self, user_id: str):
        """
        Deletes all vectors for a specific user.
        """
        if self.vector_db is None:
            return
            
        if not hasattr(self.vector_db, "docstore") or not self.vector_db.docstore:
            return

        # Safe deletion strategy for in-memory FAISS
        ids_to_delete = []
        
        try:
            # Accessing internal docstore dict - this is specific to FAISS implementation in LangChain
            for doc_id, doc in self.vector_db.docstore._dict.items():
                if doc.metadata.get("user_id") == user_id:
                    ids_to_delete.append(doc_id)
                    
            if ids_to_delete:
                self.vector_db.delete(ids_to_delete)
        except Exception as e:
            print(f"Warning: Failed to delete vectors for user {user_id}: {e}")

    def search(self, user_id: str, query: str, top_k: int = 5) -> List[Document]:
        """
        Search for documents relevant to the query, filtered by user_id.
        """
        if self.vector_db is None:
            return []

        # Fetch more to allow for filtering
        try:
            results = self.vector_db.similarity_search(query, k=top_k * 4)
            
            filtered_results = [
                doc for doc in results 
                if doc.metadata.get("user_id") == user_id
            ]
            
            return filtered_results[:top_k]
        except Exception as e:
            print(f"Error during search: {e}")
            return []

# Singleton instance
vector_db_instance = VectorStore()
