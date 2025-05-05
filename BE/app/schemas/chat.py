from pydantic import BaseModel, field_validator
from app.schemas.my_base_model import CustormBaseModel
import re

class UserQuery(CustormBaseModel):
    query: str = ''

    @field_validator("query")
    def format_text(cls, v:str) -> float:
        try:
            v = v.strip().replace("\n", " ").replace("\t", " ")
            v = re.sub('[^A-Za-z0-9\s]+', '', v)
            print(v)
            return v
        except Exception as e:
            raise ValueError(f"Error: {e}") 

    