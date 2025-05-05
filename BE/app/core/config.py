import os

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv(override=True)

class Settings(BaseSettings):
    PROJECT_NAME: str = "Vistia"
    # Application settings
    PORT: int | None = os.getenv("PORT")
    PROTOCOL: str | None = os.getenv("PROTOCOL")
    DOMAIN: str | None = os.getenv("DOMAIN")
    HOST: str | None = os.getenv("HOST") or ""
    STATIC_FOLDER: str | None = os.getenv("STATIC_FOLDER")
    VERSION: str | None = os.getenv("VERSION") or "1.0.0"
    DOC_PASSWORD: str | None = os.getenv("DOC_PASSWORD")

    # SSL settings
    SSL_KEY: str | None = os.getenv("SSL_KEY")
    SSL_CERT: str | None = os.getenv("SSL_CERT")

    # MySQL settings
    MYSQL_USER: str | None = os.getenv("MYSQL_USER")
    MYSQL_PASSWORD: str | None = os.getenv("MYSQL_PASSWORD")
    MYSQL_SERVER: str | None = os.getenv("MYSQL_SERVER")
    MYSQL_PORT: int | None = os.getenv("MYSQL_PORT")
    MYSQL_DB: str | None = os.getenv("MYSQL_DB")

    SCHEMA_1: str | None = os.getenv("SCHEMA_1")
    SCHEMA_2: str | None = os.getenv("SCHEMA_2")
    SCHEMA_3: str | None = os.getenv("SCHEMA_3")
    SCHEMA_4: str | None = os.getenv("SCHEMA_4")
    SCHEMA_5: str | None = os.getenv("SCHEMA_5")

    # SQLAlchemy database URL
    SQLALCHEMY_DATABASE_URL: str = (
        f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_SERVER}:{MYSQL_PORT}/{MYSQL_DB}"
    )
    print(SQLALCHEMY_DATABASE_URL)

    # Login configuration
    ENCODE_KEY: str = os.getenv("ENCODE_KEY")
    ENCODE_ALGORITHM: str = os.getenv("ENCODE_ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")

    # Settings for session login
    SESSION_SECRET_KEY: str | None = os.getenv("SESSION_SECRET_KEY")
    GOOGLE_CLIENT_ID: str | None = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: str | None = os.getenv("GOOGLE_CLIENT_SECRET")

    # Redis settings
    REDIS_HOST: str | None = os.getenv("REDIS_HOST")
    REDIS_PORT: int | None = os.getenv("REDIS_PORT")
    REDIS_PASSWORD: str | None = os.getenv("REDIS_PASSWORD")
    REDIS_DB: int | None = os.getenv("REDIS_DB")
    REDIS_MAX_CONNECTIONS: int | None = os.getenv("REDIS_MAX_CONNECTIONS")
    REDIS_SSL: bool | None = os.getenv("REDIS_SSL")
    
    # Chat GPT settings
    GPT_KEY: str | None = os.getenv("GPT_KEY")
     
    SYMBOL_MOBILE_SUPPORT: str | None = os.getenv("SYMBOL_MOBILE_SUPPORT")
    

    class Config:
        env_file = ".env"

# Instantiate the settings
settings = Settings()