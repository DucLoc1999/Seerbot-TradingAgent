import re
from pydantic import BaseModel, field_validator
from app.schemas.my_base_model import CustormBaseModel


class TokenInfo(CustormBaseModel):
    chain: str = ''
    name: str = ''
    code: str = ''
    image_url: str = ''

class SwapLink(CustormBaseModel):
    name: str = ''
    img: str = ''
    link: str = ''


class Blockchain(CustormBaseModel):
    id: int = 0
    code: str = ''
    name: str = ''

    @field_validator("code","name")
    def valid_str(cls, v:str) -> str:
        if v is None or not isinstance(v, str):
            return ""
        return str(v)
    
    @field_validator("id")
    def valid_id(cls, v:int) -> int:
        if v is None or not isinstance(v, int):
            return 0
        return v

class EditBlockchain(Blockchain):
    password: str = ''
    @field_validator("password")
    def valid_str(cls, v:str) -> str:
        if v is None or not isinstance(v, str):
            return ""
        return str(v)


class Token(CustormBaseModel):
    id: int = 0
    chain: str = ''
    issuer_address: str=''
    issuer_name: str=''
    name: str=''
    code: str=''
    address: str=''
    image_url: str=''


    @field_validator("issuer_address","issuer_name","name","code","address","image_url")
    def valid_str(cls, v:str) -> str:
        if v is None or not isinstance(v, str):
            return ""
        return str(v)
    
    @field_validator("id")
    def valid_id(cls, v:int) -> int:
        if v is None or not isinstance(v, int):
            return 0
        return v

class EditToken(Token):
    password: str = ''
    @field_validator("password")
    def valid_str(cls, v:str) -> str:
        if v is None or not isinstance(v, str):
            return ""
        return str(v)

