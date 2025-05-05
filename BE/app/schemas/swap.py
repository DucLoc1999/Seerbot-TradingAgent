from typing import List
from pydantic import BaseModel, field_validator
from app.schemas.my_base_model import CustormBaseModel
import re

class Swap(CustormBaseModel):
    address: str = ''
    private_key: str = ''
    token1: str = ''
    token2: str = ''
    amount_in: float = 0.0
    
