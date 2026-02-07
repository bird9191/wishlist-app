from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import secrets


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # Nullable для OAuth пользователей
    is_active = Column(Boolean, default=True)
    oauth_provider = Column(String, nullable=True)  # google, github, etc.
    oauth_id = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    wishlists = relationship("Wishlist", back_populates="owner", cascade="all, delete-orphan")


class Wishlist(Base):
    __tablename__ = "wishlists"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    is_public = Column(Boolean, default=True)
    event_date = Column(DateTime(timezone=True), nullable=True)  # Дата события (для контроля сборов)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    owner = relationship("User", back_populates="wishlists")
    items = relationship("WishlistItem", back_populates="wishlist", cascade="all, delete-orphan")

    @staticmethod
    def generate_slug():
        """Генерирует уникальный slug для публичной ссылки"""
        return secrets.token_urlsafe(8)


class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    url = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    price = Column(Numeric(10, 2), nullable=True)  # Decimal для точности
    currency = Column(String, default="RUB")
    priority = Column(Integer, default=0)  # 0-низкий, 1-средний, 2-высокий
    is_reserved = Column(Boolean, default=False)  # Зарезервирован ли товар
    is_pooling = Column(Boolean, default=False)  # Можно ли скидываться
    wishlist_id = Column(Integer, ForeignKey("wishlists.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    wishlist = relationship("Wishlist", back_populates="items")
    reservations = relationship("Reservation", back_populates="item", cascade="all, delete-orphan")
    contributions = relationship("Contribution", back_populates="item", cascade="all, delete-orphan")


class Reservation(Base):
    """Резервирование подарка (скрыто от владельца вишлиста)"""
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("wishlist_items.id"), nullable=False)
    reserver_name = Column(String, nullable=False)  # Имя того кто зарезервировал
    reserver_email = Column(String, nullable=True)  # Email для уведомлений (опционально)
    message = Column(Text, nullable=True)  # Сообщение для других участников
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    item = relationship("WishlistItem", back_populates="reservations")


class Contribution(Base):
    """Вклад в коллективный подарок"""
    __tablename__ = "contributions"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("wishlist_items.id"), nullable=False)
    contributor_name = Column(String, nullable=False)  # Имя того кто скинулся
    contributor_email = Column(String, nullable=True)  # Email для уведомлений
    amount = Column(Numeric(10, 2), nullable=False)  # Сумма вклада
    message = Column(Text, nullable=True)  # Сообщение для других участников
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    item = relationship("WishlistItem", back_populates="contributions")
