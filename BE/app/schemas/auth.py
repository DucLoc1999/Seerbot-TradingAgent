from datetime import datetime, timezone
from app.core.config import settings

import re
from pydantic import BaseModel, ValidationError, field_validator
from app.schemas.my_base_model import CustormBaseModel
from passlib.context import CryptContext

# password process
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")



class Token(CustormBaseModel):
    access_token: str = ''
    token_type: str = 'bearer'

# class TokenValid(Token):
#     access_token: str = ''
#     token_type: str = 'bearer'

#     @field_validator("access_token")
#     def access_token(cls, v: str) -> str:
#         token = jwt.decode(v, settings.ENCODE_KEY, algorithms=[settings.ENCODE_ALGORITHM])
#         print(token)
#         if token.get("sub") is None:
#             # check mail if need -> slower and make more request to db
#             raise ValueError("token is invalid")
#         if token.get("exp") is None:
#             raise ValueError("token is invalid")
#         elif int(token.get("exp")) < datetime.now(timezone.utc).timestamp():
#             raise ValueError("token is invalid")
#         if token.get("scopes") is None:
#             # check is scope in list of scopes
#             raise ValueError("token is invalid")
#         return token

#     @field_validator("token_type")
#     def token_type(cls, v: str) -> str:
#         if v.lower() == "bearer":
#             return v
#         else:
#             raise ValueError("token_type must be bearer")

class RegisterUrl(CustormBaseModel):
    status_code: int = 0
    message: str = ''
    url: str = ''
    exp: int = 0

class BaseUser(CustormBaseModel):
    user_name: str = ''
    password: str = ''
    
    @field_validator("user_name")
    def valid_user_name(cls, v: str) -> str:
        """
        user_name: 6-20 characters, 
            no _ or . at the beginning, 
            no __ or _. or ._ or .. inside,
            allowed 0-9, a-z, A-Z, ._@ inside,
            no _ or . at the end
        """
        # https://stackoverflow.com/a/12019115
        if not re.match("^(?=.{6,20}$)", v):
            raise ValueError("user_name must be 6-20 characters")
        elif not re.match("(?![_.])", v):
            raise ValueError("user_name must not have _ or . at the beginning")
        elif not re.match("(?!.*[_.]{2})", v):
            raise ValueError("user_name must not have __ or _. or ._ or .. inside")
        elif not re.match("[a-zA-Z0-9._@]+", v):
            raise ValueError("user_name only allowed 0-9, a-z, A-Z, . and _ inside")
        elif not re.match("(?<![_.])$", v):
            raise ValueError("user_name must not have _ or . at the end")
        return v

    @field_validator("password")
    def hash_password(cls, v: str) -> str:
        """
        (?=.{8,50}$)                Ensure string is of length 8 - 50.
        (?=.*[A-Z])                 Ensure string has uppercase letters.
        (?=.*[!@#$&*])              Ensure string has special case letter.
        (?=.*[0-9])                 Ensure string has digits.
        (?=.*[a-z].*[a-z].*[a-z])   Ensure string has three lowercase letters.
        """
        # https://stackoverflow.com/a/5142164
        if not re.match("(?=.{8,50}$)", v):
            raise ValueError("password must be 8-50 characters")
        elif not re.match("(?=.*[A-Z])", v):
            raise ValueError("password must have uppercase letters")
        elif not re.match("(?=.*[!@#$&*])", v):
            raise ValueError("password must have special case letter (!@#$&*)")
        elif not re.match("(?=.*[0-9])", v):
            raise ValueError("password must have digits")
        elif not re.match("(?=.*[a-z].*[a-z].*[a-z])", v):
            raise ValueError("password must have three lowercase letters")
        cls._hashed_password = pwd_context.hash(v)
        return "hidden"
    
    def set_hashed_password(self, hash_password: str) -> None:
        self._hashed_password = hash_password

    def verify_password(self, password: str) -> bool:
        return pwd_context.verify(password, self._hashed_password)

# todo: check user name is valid 
def valid_username(user_name: str) -> bool:
    return True

def valid_email(email: str) -> bool:
    email_regex = re.compile(r'^[\w\.]+@([\w-]+\.)+[\w-]{2,4}$')
    return email_regex.match(email)

def valid_phone(phone: str) -> bool:
        # todo : check phone number 
        # https://callhippo.com/blog/general/international-phone-number-format
    return True

class UserEmail(BaseUser):    
    email: str = ''
    @field_validator("email")
    def valid_email(email: str) -> str:
        if not valid_email(email):
            raise ValueError("Invalid email")
        return email

class UserPhone(BaseUser):    
    phone: str = ''
    @field_validator("phone")
    def valid_phone(phone: str) -> bool:
        if not valid_phone(phone):
            raise ValueError("Invalid number")
        return phone

class UserRegistration(BaseUser):
    expired: int = 0
    code: int = 0
    token: str = ''
    update_time: int = 0

class Proflies(CustormBaseModel):
    # user_id: str = ''
    user_name: str = ''  # unique
    first_name: str = ''
    last_name: str = ''
    url_path: str = ''
    gender: str = ''
    birth: str = ''
    image: str = ''
    country: str = ''
    address: str = ''
    language: str = ''
    scopes: str = 'me'
    verified: bool = False
    
    @field_validator("user_name", "first_name", "last_name", "url_path", "gender", "birth", "image", "country", "address", "language", "scopes")
    def valid_str(cls, v:str) -> str:
        if v is None or not isinstance(v, str):
            return ""
        return str(v)
    @field_validator('verified')
    def valid(cls, v:int|bool) -> bool:
        return bool(v)

class GoogleProflies(CustormBaseModel):
    user_id: str = ""
    email: str = ""
    sub: str = ""
    name: str = ""
    given_name: str = ""
    family_name: str = ""
    picture: str = ""
    email_verified: bool = False
