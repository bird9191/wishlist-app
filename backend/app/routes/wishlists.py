from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/wishlists", tags=["wishlists"])


def calculate_total_contributed(item: models.WishlistItem) -> Optional[Decimal]:
    """Подсчитать сумму вкладов"""
    if not item.is_pooling or not item.contributions:
        return None
    return sum([c.amount for c in item.contributions])


@router.get("", response_model=List[schemas.WishlistOwner])
def get_user_wishlists(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Получить все вишлисты текущего пользователя (владельца)"""
    wishlists = db.query(models.Wishlist).filter(
        models.Wishlist.owner_id == current_user.id
    ).all()
    
    # Добавить total_contributed для каждого item
    result = []
    for wishlist in wishlists:
        wishlist_dict = wishlist.__dict__.copy()
        wishlist_dict['items'] = []
        for item in wishlist.items:
            item_dict = item.__dict__.copy()
            item_dict['total_contributed'] = calculate_total_contributed(item)
            wishlist_dict['items'].append(item_dict)
        result.append(wishlist_dict)
    
    return result


@router.post("", response_model=schemas.WishlistOwner, status_code=status.HTTP_201_CREATED)
def create_wishlist(
    wishlist: schemas.WishlistCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Создать новый вишлист"""
    # Генерация уникального slug
    slug = models.Wishlist.generate_slug()
    
    # Проверка уникальности slug (на всякий случай)
    while db.query(models.Wishlist).filter(models.Wishlist.slug == slug).first():
        slug = models.Wishlist.generate_slug()
    
    db_wishlist = models.Wishlist(
        **wishlist.model_dump(),
        slug=slug,
        owner_id=current_user.id
    )
    db.add(db_wishlist)
    db.commit()
    db.refresh(db_wishlist)
    return db_wishlist


@router.get("/{wishlist_id}", response_model=schemas.WishlistOwner)
def get_wishlist(
    wishlist_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Получить вишлист по ID"""
    wishlist = db.query(models.Wishlist).filter(
        models.Wishlist.id == wishlist_id,
        models.Wishlist.owner_id == current_user.id
    ).first()
    
    if not wishlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wishlist not found"
        )
    
    return wishlist


@router.put("/{wishlist_id}", response_model=schemas.WishlistOwner)
def update_wishlist(
    wishlist_id: int,
    wishlist_update: schemas.WishlistUpdate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Обновить вишлист"""
    wishlist = db.query(models.Wishlist).filter(
        models.Wishlist.id == wishlist_id,
        models.Wishlist.owner_id == current_user.id
    ).first()
    
    if not wishlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wishlist not found"
        )
    
    # Обновление полей
    update_data = wishlist_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(wishlist, field, value)
    
    db.commit()
    db.refresh(wishlist)
    return wishlist


@router.delete("/{wishlist_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_wishlist(
    wishlist_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Удалить вишлист"""
    wishlist = db.query(models.Wishlist).filter(
        models.Wishlist.id == wishlist_id,
        models.Wishlist.owner_id == current_user.id
    ).first()
    
    if not wishlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wishlist not found"
        )
    
    db.delete(wishlist)
    db.commit()
    return None


@router.get("/public/{slug}", response_model=schemas.WishlistGuest)
def get_public_wishlist(slug: str, db: Session = Depends(get_db)):
    """Получить публичный вишлист по slug (гостевой доступ)"""
    wishlist = db.query(models.Wishlist).filter(
        models.Wishlist.slug == slug,
        models.Wishlist.is_public == True
    ).first()
    
    if not wishlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wishlist not found or not public"
        )
    
    # Добавить total_contributed для каждого item
    wishlist_dict = wishlist.__dict__.copy()
    wishlist_dict['items'] = []
    for item in wishlist.items:
        item_dict = item.__dict__.copy()
        item_dict['total_contributed'] = calculate_total_contributed(item)
        item_dict['reservations'] = item.reservations
        item_dict['contributions'] = item.contributions
        wishlist_dict['items'].append(item_dict)
    
    return wishlist_dict


@router.post("/{wishlist_id}/items", response_model=schemas.WishlistItemOwner, status_code=status.HTTP_201_CREATED)
def add_wishlist_item(
    wishlist_id: int,
    item: schemas.WishlistItemCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Добавить товар в вишлист"""
    # Проверка существования и принадлежности вишлиста
    wishlist = db.query(models.Wishlist).filter(
        models.Wishlist.id == wishlist_id,
        models.Wishlist.owner_id == current_user.id
    ).first()
    
    if not wishlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wishlist not found"
        )
    
    db_item = models.WishlistItem(
        **item.model_dump(),
        wishlist_id=wishlist_id
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item
