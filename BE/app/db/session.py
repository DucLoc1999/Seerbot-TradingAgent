from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from fastapi import HTTPException

# Create the SQLAlchemy engine
engine = create_engine(settings.SQLALCHEMY_DATABASE_URL,
                       connect_args={"connect_timeout": 1},
)

# Create a configured "Session" class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# do not change the order of the code below
# Dependency that can be used in routes to get the session
def get_db() -> Session  |  HTTPException:
    db = SessionLocal()  # generate a new SessionLocal
    try:
        yield db
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Query data error")
    finally:
        db.close()
