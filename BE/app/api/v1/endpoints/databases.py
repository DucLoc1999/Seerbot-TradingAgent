from app.core.router_decorated import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db

router = APIRouter()

@router.get("/databases")
def list_databases(db: Session = Depends(get_db)):
    databases = db.execute(text("SHOW DATABASES;")).fetchall()
    return {"databases": [db[0] for db in databases]}
