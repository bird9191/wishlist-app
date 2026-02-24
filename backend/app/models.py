from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import secrets


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # nullable for OAuth users
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
    event_date = Column(DateTime(timezone=True), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    owner = relationship("User", back_populates="wishlists")
    items = relationship("WishlistItem", back_populates="wishlist", cascade="all, delete-orphan")

    @staticmethod
    def generate_slug():
        return secrets.token_urlsafe(8)


class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    url = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    price = Column(Numeric(10, 2), nullable=True)
    currency = Column(String, default="RUB")
    priority = Column(Integer, default=0)  # 0=low, 1=medium, 2=high
    is_reserved = Column(Boolean, default=False)
    is_pooling = Column(Boolean, default=False)  # allows group contributions
    wishlist_id = Column(Integer, ForeignKey("wishlists.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    wishlist = relationship("Wishlist", back_populates="items")
    reservations = relationship("Reservation", back_populates="item", cascade="all, delete-orphan")
    contributions = relationship("Contribution", back_populates="item", cascade="all, delete-orphan")


class Reservation(Base):
    """Hidden from wishlist owner to preserve gift surprise."""
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("wishlist_items.id"), nullable=False)
    reserver_name = Column(String, nullable=False)
    reserver_email = Column(String, nullable=True)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    item = relationship("WishlistItem", back_populates="reservations")


class Contribution(Base):
    __tablename__ = "contributions"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("wishlist_items.id"), nullable=False)
    contributor_name = Column(String, nullable=False)
    contributor_email = Column(String, nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    item = relationship("WishlistItem", back_populates="contributions")
