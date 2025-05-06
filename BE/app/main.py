from fastapi import FastAPI
from datetime import datetime
import uvicorn, secrets
from fastapi.middleware.cors import CORSMiddleware

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.openapi.docs import get_redoc_html, get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from app.middleware import CacheRequestMiddleware
from app.api import health, swap
from app.api.v1 import endpoints as api_v1
from app.api.dev import login_page
from app.api.sessions.auth import auth
from app.api.sessions.auth import google
from app.core.config import settings

# Define the FastAPI application instance
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url=None,
    redoc_url=None,
    openapi_url = None,
)

# cache middleware
app.add_middleware(CacheRequestMiddleware)
# session middleware
app.add_middleware(SessionMiddleware, 
                   secret_key=settings.SESSION_SECRET_KEY,
                   max_age=1800  # 1800,  # 30 minutes lifetime, extend with each request
                   )

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins="*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# mount public static files 
app.mount("/static", StaticFiles(directory=settings.STATIC_FOLDER), name="static")
# templates = Jinja2Templates(directory="templates")

security = HTTPBasic()
def doc_auth(credentials: HTTPBasicCredentials = Depends(security)):
    correct_password = secrets.compare_digest(credentials.password, settings.DOC_PASSWORD)
    if not (correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

@app.get("/docs", include_in_schema=False)
async def get_swagger_documentation(username: str = Depends(doc_auth)):
    return get_swagger_ui_html(openapi_url="/openapi.json", title="docs")

@app.get("/redoc", include_in_schema=False)
async def get_redoc_documentation(username: str = Depends(doc_auth)):
    return get_redoc_html(openapi_url="/openapi.json", title="docs")

@app.get("/openapi.json", include_in_schema=False)
async def openapi(username: str = Depends(doc_auth)):
    return get_openapi(title=app.title, version=app.version, routes=app.routes)

# Include your API routers
# API-v1
app.include_router(health.router, prefix="")
app.include_router(databases.router, prefix="/api/v1")
app.include_router(api_v1.prices.router, prefix="/api/v1/prices")
app.include_router(api_v1.ai_analysis.router, prefix="/api/v1/ai-analysis")
app.include_router(api_v1.al_trade.router, prefix="/api/v1/al-trade")
app.include_router(api_v1.search.router, prefix="/api/v1/search")
app.include_router(api_v2.agent.router, prefix=f"/api/v1/agent")


# swap page
app.include_router(swap.router, prefix="/api/web3")

# login page

app.include_router(auth.router, prefix="/api/sessions")
app.include_router(login_page.router, prefix="/api/sessions")  # exapmle client page for login
app.include_router(google.router, prefix="/api/sessions")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host='127.0.0.1',
        port=settings.PORT,
        # ssl_keyfile=settings.SSL_KEY,
        # ssl_certfile=settings.SSL_CERT,
        reload=True
    )
