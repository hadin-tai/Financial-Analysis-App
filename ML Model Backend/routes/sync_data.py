from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from utils.chunk_builder import build_chunks
from vectorstore.vector_store import vector_db_instance

router = APIRouter()

class SyncDataRequest(BaseModel):
    user_id: str
    transactions: List[Dict[str, Any]] = []
    budgets: List[Dict[str, Any]] = []
    balance_sheets: List[Dict[str, Any]] = []

@router.post("/sync-user-data")
async def sync_user_data(data: SyncDataRequest):
    try:
        # 1. Build chunks
        
        # print(f"balance_sheets:  {data.balance_sheets} ")

        user_data = {
            "transactions": data.transactions,
            "budgets": data.budgets,
            "balance_sheets": data.balance_sheets
        }
        chunks = build_chunks(user_data)
        
        # 2. Delete old vectors
        vector_db_instance.delete_user_vectors(data.user_id)
        
        # 3. Add new vectors
        if chunks:
            vector_db_instance.add_documents(data.user_id, chunks)
            
        return {"status": "success", "vectors_stored": len(chunks)}
    except Exception as e:
        print(f"Error in sync_user_data: {e}")
        raise HTTPException(status_code=500, detail=str(e))
