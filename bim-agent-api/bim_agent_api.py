from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Security
from fastapi.security.api_key import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os, json
from langchain_core.messages import HumanMessage

load_dotenv()

from bim_code_agent import init_multi_agent, update_vector_db, get_bim_input_files

app = FastAPI(title="BIM LLM Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.getenv("BIM_AGENT_API_KEY")
if not API_KEY:
    raise RuntimeError(
        "BIM_AGENT_API_KEY is not set. Refusing to start with a default key — "
        "set BIM_AGENT_API_KEY in the environment (or .env file) before launching."
    )
api_key_header = APIKeyHeader(name="x-api-key", auto_error=True)

async def get_api_key(api_key: str = Security(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Could not validate API KEY")
    return api_key

# Initialize on startup
llm = chains = vector_db = memory = None

@app.on_event("startup")
async def startup():
    global llm, chains, vector_db, memory
    try:
        llm, chains, vector_db, memory = init_multi_agent(
            tools_option=[],
            model_name=os.getenv("BIM_LLM_MODEL", "gpt-4o-mini"), # Using a faster model for testing
            init_db=False
        )
        print("BIM LLM Agent API Started (Live Mode Connected to IfcOpenShell)")
    except Exception as e:
        print(f"Failed to initialize BIM Agent: {e}")

class QueryRequest(BaseModel):
    query: str
    model: str | None = None

class QueryResponse(BaseModel):
    success: bool
    results: list
    code: str | None = None
    error: str | None = None

@app.post("/api/bim-agent/query", response_model=QueryResponse)
async def query_bim(req: QueryRequest, api_key: str = Depends(get_api_key)):
    if not req.query:
        raise HTTPException(status_code=400, detail="Query is empty")
    
    global chains
    if not chains:
        return QueryResponse(success=False, results=[], error="LLM Chains not initialized")
        
    try:
        # Run the agent chain
        output = chains.invoke({"messages": [HumanMessage(content=req.query)]})
        
        results = []
        if isinstance(output, list):
            for res in output:
                if isinstance(res, str) and ('<table' in res or '<TABLE' in res):
                    results.append({"type": "html", "content": res})
                elif hasattr(res, 'to_html'): # pandas dataframe or plotly
                    results.append({"type": "html", "content": res.to_html()})
                else:
                    results.append({"type": "text", "content": str(res)})
        else:
             results.append({"type": "text", "content": str(output)})

        return QueryResponse(success=True, results=results)
    except Exception as e:
        return QueryResponse(success=False, results=[], error=str(e))

@app.post("/api/bim-agent/upload")
async def upload_file(file: UploadFile = File(...), api_key: str = Depends(get_api_key)):
    global vector_db, llm
    
    # Ensure dir exists
    os.makedirs("expert_kb_files", exist_ok=True)
    file_path = f"expert_kb_files/{file.filename}"
    
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    try:
        if vector_db and llm:
            update_vector_db(vector_db, file_path)
            return {"success": True, "message": f"Successfully uploaded and indexed {file.filename}"}
        else:
            return {"success": True, "message": f"Successfully uploaded {file.filename} (Vector DB not initialized)"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0", "ai_ready": chains is not None}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("bim_agent_api:app", host="0.0.0.0", port=8002, reload=True)
