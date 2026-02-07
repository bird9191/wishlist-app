from pydantic import BaseModel, EmailStr, Field, HttpUrl
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(UserBase):
    id: int
    is_active: bool
    avatar_url: Optional[str] = None
    created_at: datetime
    oauth_provider: Optional[str] = None

    class Config:
        from_attributes = True


# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: User


class TokenData(BaseModel):
    email: Optional[str] = None


# Contribution schemas
class ContributionBase(BaseModel):
    contributor_name: str = Field(..., min_length=1)
    contributor_email: Optional[EmailStr] = None
    amount: Decimal = Field(..., gt=0)
    message: Optional[str] = None


class ContributionCreate(ContributionBase):
    pass


class Contribution(ContributionBase):
    id: int
    item_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Reservation schemas
class ReservationBase(BaseModel):
    reserver_name: str = Field(..., min_length=1)
    reserver_email: Optional[EmailStr] = None
    message: Optional[str] = None


class ReservationCreate(ReservationBase):
    pass


class Reservation(ReservationBase):
    id: int
    item_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# WishlistItem schemas
class WishlistItemBase(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    url: Optional[HttpUrl] = None
    image_url: Optional[HttpUrl] = None
    price: Optional[Decimal] = Field(None, gt=0)
    currency: str = "RUB"
    priority: int = Field(default=0, ge=0, le=2)
    is_pooling: bool = False  # Разрешить коллективные сборы


class WishlistItemCreate(WishlistItemBase):
    pass


class WishlistItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    url: Optional[HttpUrl] = None
    image_url: Optional[HttpUrl] = None
    price: Optional[Decimal] = Field(None, gt=0)
    currency: Optional[str] = None
    priority: Optional[int] = Field(default=None, ge=0, le=2)
    is_pooling: Optional[bool] = None


# Для владельца вишлиста - без резерваций и вкладов
class WishlistItemOwner(WishlistItemBase):
    id: int
    is_reserved: bool
    wishlist_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    # Владелец видит только факт резервирования, но не детали
    total_contributed: Optional[Decimal] = None  # Сколько собрано (только для pooling)

    class Config:
        from_attributes = True


# Для гостей - с резервациями и вкладами
class WishlistItemGuest(WishlistItemBase):
    id: int
    is_reserved: bool
    wishlist_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    reservations: List[Reservation] = []
    contributions: List[Contribution] = []
    total_contributed: Optional[Decimal] = None

    class Config:
        from_attributes = True


# URL metadata для автозаполнения
class URLMetadata(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    price: Optional[str] = None
    currency: Optional[str] = None


# Wishlist schemas
class WishlistBase(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    is_public: bool = True


class WishlistCreate(WishlistBase):
    pass


class WishlistUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None


# Для владельца
class WishlistOwner(WishlistBase):
    id: int
    slug: str
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[WishlistItemOwner] = []

    class Config:
        from_attributes = True


# Для гостей
class WishlistGuest(BaseModel):
    """Публичное представление вишлиста для гостей"""
    id: int
    title: str
    description: Optional[str] = None
    slug: str
    items: List[WishlistItemGuest] = []
    created_at: datetime

    class Config:
        from_attributes = True


# WebSocket сообщения
class WSMessage(BaseModel):
    type: str  # reservation, contribution, item_update, item_delete
    wishlist_id: int
    item_id: Optional[int] = None
    data: dict = {}
