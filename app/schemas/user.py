import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.user import UserRole


# Base Pydantic User Schema
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.EMPLOYEE
    is_active: bool = True


# Schema for User Creation / Registration
class UserCreate(UserBase):
    password: str


# Schema for Updating User Details
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


# Schema for User Responses (Hides sensitive information like hashed_password)
class UserResponse(UserBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Schema for JSON Login Request
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# Schema for JWT Access Token Response
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# Schema for Decoded JWT Token Payload
class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
