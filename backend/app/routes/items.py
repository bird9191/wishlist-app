from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from decimal import Decimal

from .. import models, schemas, auth
from ..database import get_db
import json

router = APIRouter(prefix="/api/items", tags=["items"])

# WebSocket менеджер для real-time обновлений
class ConnectionManager:
    def __init__(self):
        # wishlist_id -> list of WebSocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, wishlist_id: int):
        await websocket.accept()
        if wishlist_id not in self.active_connections:
            self.active_connections[wishlist_id] = []
        self.active_connections[wishlist_id].append(websocket)

    def disconnect(self, websocket: WebSocket, wishlist_id: int):
        if wishlist_id in self.active_connections:
            try:
                self.active_connections[wishlist_id].remove(websocket)
            except ValueError:
                # WebSocket уже был удалён
                pass
            if not self.active_connections[wishlist_id]:
                del self.active_connections[wishlist_id]

    async def broadcast(self, wishlist_id: int, message: dict):
        """Отправить сообщение всем подключенным к вишлисту"""
        if wishlist_id in self.active_connections:
            for connection in self.active_connections[wishlist_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass  # Ignore failed sends


manager = ConnectionManager()


@router.put("/{item_id}", response_model=schemas.WishlistItemOwner)
def update_item(
    item_id: int,
    item_update: schemas.WishlistItemUpdate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Обновить товар в вишлисте (только владелец)"""
    item = db.query(models.WishlistItem).filter(
        models.WishlistItem.id == item_id
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    # Проверка владения вишлистом
    wishlist = db.query(models.Wishlist).filter(
        models.Wishlist.id == item.wishlist_id,
        models.Wishlist.owner_id == current_user.id
    ).first()
    
    if not wishlist:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this item"
        )
    
    # Обновление полей
    update_data = item_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)
    
    db.commit()
    db.refresh(item)
    
    # Рассчитать total_contributed
    item_dict = {
        **item.__dict__,
        'total_contributed': sum([c.amount for c in item.contributions]) if item.contributions else None
    }
    
    return item_dict


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: int,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Удалить товар из вишлиста (только владелец)"""
    item = db.query(models.WishlistItem).filter(
        models.WishlistItem.id == item_id
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    # Проверка владения
    wishlist = db.query(models.Wishlist).filter(
        models.Wishlist.id == item.wishlist_id,
        models.Wishlist.owner_id == current_user.id
    ).first()
    
    if not wishlist:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this item"
        )
    
    # Проверка на вклады - если есть вклады, нельзя просто удалить
    if item.contributions:
        total_contributed = sum(c.amount for c in item.contributions)
        if total_contributed > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete item with {len(item.contributions)} contributions totaling {total_contributed}. Please handle contributions first."
            )
    
    wishlist_id = item.wishlist_id
    
    db.delete(item)
    db.commit()
    
    # WebSocket broadcast через background task
    background_tasks.add_task(
        manager.broadcast,
        wishlist_id,
        {
            "type": "item_deleted",
            "item_id": item_id,
            "wishlist_id": wishlist_id
        }
    )
    
    return None


@router.post("/{item_id}/reserve", response_model=schemas.Reservation)
async def reserve_item(
    item_id: int,
    reservation: schemas.ReservationCreate,
    db: Session = Depends(get_db)
):
    """Зарезервировать подарок (доступно без авторизации)"""
    item = db.query(models.WishlistItem).filter(
        models.WishlistItem.id == item_id
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    # Проверка что вишлист публичный
    wishlist = db.query(models.Wishlist).filter(
        models.Wishlist.id == item.wishlist_id
    ).first()
    
    if not wishlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wishlist not found"
        )
    
    if not wishlist.is_public:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot reserve items in private wishlist"
        )
    
    # Проверка что товар не для коллективных сборов
    if item.is_pooling:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This item is for pooling contributions, not single reservations"
        )
    
    # Проверка что еще не зарезервирован
    if item.is_reserved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item is already reserved"
        )
    
    # Создать резервацию
    db_reservation = models.Reservation(
        **reservation.model_dump(),
        item_id=item_id
    )
    item.is_reserved = True
    
    db.add(db_reservation)
    db.commit()
    db.refresh(db_reservation)
    
    # Broadcast через WebSocket
    await manager.broadcast(wishlist.id, {
        "type": "reservation",
        "wishlist_id": wishlist.id,
        "item_id": item_id,
        "data": {
            "is_reserved": True,
            "reserver_name": reservation.reserver_name
        }
    })
    
    return db_reservation


@router.delete("/{item_id}/reserve", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_reservation(
    item_id: int,
    cancel_data: schemas.ReservationCancel,
    db: Session = Depends(get_db)
):
    """Отменить резервацию (требуется email того кто зарезервировал)"""
    item = db.query(models.WishlistItem).filter(
        models.WishlistItem.id == item_id
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    # Найти резервацию с указанным email
    reservation = db.query(models.Reservation).filter(
        models.Reservation.item_id == item_id,
        models.Reservation.reserver_email == cancel_data.reserver_email
    ).first()
    
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found or email doesn't match"
        )
    
    # Удалить резервацию
    db.delete(reservation)
    
    # Проверить, остались ли другие резервации
    remaining_reservations = db.query(models.Reservation).filter(
        models.Reservation.item_id == item_id
    ).count()
    
    if remaining_reservations == 0:
        item.is_reserved = False
    
    db.commit()
    
    # Broadcast через WebSocket
    wishlist = db.query(models.Wishlist).filter(
        models.Wishlist.id == item.wishlist_id
    ).first()
    
    if not wishlist:
        return None  # Вишлист был удалён
    
    await manager.broadcast(wishlist.id, {
        "type": "reservation_cancelled",
        "wishlist_id": wishlist.id,
        "item_id": item_id,
        "data": {"is_reserved": item.is_reserved}
    })
    
    return None


@router.post("/{item_id}/contribute", response_model=schemas.Contribution)
async def contribute_to_item(
    item_id: int,
    contribution: schemas.ContributionCreate,
    db: Session = Depends(get_db)
):
    """Внести вклад в коллективный подарок"""
    item = db.query(models.WishlistItem).filter(
        models.WishlistItem.id == item_id
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    # Проверка что вишлист публичный
    wishlist = db.query(models.Wishlist).filter(
        models.Wishlist.id == item.wishlist_id
    ).first()
    
    if not wishlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wishlist not found"
        )
    
    if not wishlist.is_public:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot contribute to private wishlist"
        )
    
    # Проверка что товар для коллективных сборов
    if not item.is_pooling:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This item is not set up for pooling contributions"
        )
    
    # Проверка цены товара
    if not item.price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item price is not set"
        )
    
    # Проверка что не превышена сумма
    total_contributed = sum([c.amount for c in item.contributions]) if item.contributions else Decimal(0)
    if total_contributed + contribution.amount > item.price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Contribution would exceed item price. Remaining: {item.price - total_contributed}"
        )
    
    # Создать вклад
    db_contribution = models.Contribution(
        **contribution.model_dump(),
        item_id=item_id
    )
    
    db.add(db_contribution)
    db.commit()
    db.refresh(db_contribution)
    
    # Обновить item чтобы получить свежие contributions из БД
    db.refresh(item)
    
    # Пересчитать total с обновленными данными
    total_contributed = sum([c.amount for c in item.contributions])
    
    # Если собрана вся сумма - пометить как зарезервированный
    if total_contributed >= item.price:
        item.is_reserved = True
        db.commit()
        db.refresh(item)  # Обновить после изменения
    
    # Broadcast через WebSocket
    await manager.broadcast(wishlist.id, {
        "type": "contribution",
        "wishlist_id": wishlist.id,
        "item_id": item_id,
        "data": {
            "contributor_name": contribution.contributor_name,
            "amount": float(contribution.amount),
            "total_contributed": float(total_contributed),
            "is_reserved": item.is_reserved
        }
    })
    
    return db_contribution


@router.websocket("/ws/{wishlist_id}")
async def websocket_endpoint(websocket: WebSocket, wishlist_id: int, db: Session = Depends(get_db)):
    """WebSocket для real-time обновлений вишлиста"""
    # Проверка существования вишлиста
    wishlist = db.query(models.Wishlist).filter(
        models.Wishlist.id == wishlist_id
    ).first()
    
    if not wishlist or not wishlist.is_public:
        await websocket.close(code=1008)
        return
    
    await manager.connect(websocket, wishlist_id)
    try:
        while True:
            # Просто держим соединение открытым
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, wishlist_id)
    except Exception as e:
        # На случай любых других ошибок - отключаем соединение
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, wishlist_id)
    finally:
        # Гарантируем очистку при любом выходе
        try:
            manager.disconnect(websocket, wishlist_id)
        except:
            pass
