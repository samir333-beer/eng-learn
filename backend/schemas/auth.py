from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class SendCodeRequest(BaseModel):
    email: EmailStr
    purpose: str = Field(pattern="^(register|login|reset)$")


class EmailRegisterRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=6, max_length=128)


class EmailLoginCodeRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)


class EmailPasswordLogin(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    id_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)
    new_password: str = Field(min_length=8, max_length=128)


class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)
    # Без purpose запрос ведёт себя как раньше — проверка кода регистрации.
    purpose: Literal["register", "reset"] = "register"


class VerifyCodeResponse(BaseModel):
    status: str = "success"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    username: str

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    message: str
