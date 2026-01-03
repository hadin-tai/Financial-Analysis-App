from dotenv import load_dotenv
import os

# Load environment variables before importing any other modules
load_dotenv()

if os.getenv("HUGGINGFACEHUB_API_TOKEN") is None:
    raise RuntimeError("HUGGINGFACEHUB_API_TOKEN missing even after loading .env")

from fastapi import FastAPI
from routes.chat import router as chat_router
from routes.sync_data import router as sync_router
from routes.health import router as health_router
from app.middleware.cors import setup_cors

app = FastAPI(
    title="Financial Analysis ML Backend",
    version="1.0"
)

setup_cors(app)

app.include_router(chat_router, prefix="")
app.include_router(sync_router, prefix="")
app.include_router(health_router, prefix="")
    
# if __name__ == "__main__":
#     import uvicorn

#     uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
