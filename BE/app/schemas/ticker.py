from pydantic import BaseModel, field_validator
from app.schemas.my_base_model import CustormBaseModel
import re

class SearchKey(CustormBaseModel):
    key: str = ''
    skip: int = 0
    limit: int = 20
    
    @field_validator("key")
    def key_format(cls, v: str) -> str:
        pattern = re.compile('([^a-zA-Z0-9\\\/]|_)+')
        try: 
            v = re.sub(pattern, ' ', v).strip()
            v = "^" + v.replace(" ", "|^")
        except:
            v = ""
        return str(v)
    @field_validator("skip")
    def skip_format(cls, v: int) -> int:
        return max(0, v)
    @field_validator("limit")
    def limit_format(cls, v: int) -> int:
        return max(1, v)

class Ticker(CustormBaseModel):
    symbol: str = ''
    close: float = 0
    percentage: float = 0
    baseVolume: float = 0

    @field_validator("close")
    def round_pc(cls, v: float) -> float:
        return round(v, 8)

    @field_validator("percentage")
    def round_pct(cls, v:float) -> float:
        return round(v, 2)
    
    @field_validator("baseVolume")
    def round_prediction(cls, v:float) -> float:
        return round(v, 4)

# todo: remove this use less code