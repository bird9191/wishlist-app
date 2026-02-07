from fastapi import APIRouter, HTTPException
from pydantic import HttpUrl
import httpx
from bs4 import BeautifulSoup
import re
from decimal import Decimal

from .. import schemas

router = APIRouter(prefix="/api/url", tags=["url"])


async def parse_price(price_text: str) -> tuple[Decimal | None, str]:
    """Парсинг цены из текста"""
    # Удалить все кроме цифр, точек, запятых
    cleaned = re.sub(r'[^\d.,]', '', price_text)
    
    if not cleaned:
        return None, "RUB"
    
    # Заменить запятую на точку
    cleaned = cleaned.replace(',', '.')
    
    # Удалить лишние точки (оставить только одну для decimal)
    parts = cleaned.split('.')
    if len(parts) > 2:
        # Если больше одной точки, оставляем последнюю как decimal separator
        cleaned = ''.join(parts[:-1]) + '.' + parts[-1]
    
    try:
        price = Decimal(cleaned)
        
        # Определить валюту
        currency = "RUB"
        if "$" in price_text or "usd" in price_text.lower():
            currency = "USD"
        elif "€" in price_text or "eur" in price_text.lower():
            currency = "EUR"
        elif "₽" in price_text or "руб" in price_text.lower():
            currency = "RUB"
        
        return price, currency
    except Exception as e:
        print(f"Error parsing price '{price_text}': {e}")
        return None, "RUB"


@router.post("/parse", response_model=schemas.URLMetadata)
async def parse_url(url: HttpUrl):
    """Парсинг URL для автозаполнения данных о товаре"""
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            response = await client.get(
                str(url),
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Could not fetch URL")
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            metadata = {
                "title": None,
                "description": None,
                "image_url": None,
                "price": None,
                "currency": None
            }
            
            # Open Graph теги (приоритет)
            og_title = soup.find("meta", property="og:title")
            if og_title:
                metadata["title"] = og_title.get("content")
            
            og_desc = soup.find("meta", property="og:description")
            if og_desc:
                metadata["description"] = og_desc.get("content")
            
            og_image = soup.find("meta", property="og:image")
            if og_image:
                metadata["image_url"] = og_image.get("content")
            
            # Цена из Open Graph
            og_price = soup.find("meta", property="og:price:amount")
            og_currency = soup.find("meta", property="og:price:currency")
            if og_price:
                metadata["price"] = og_price.get("content")
                if og_currency:
                    metadata["currency"] = og_currency.get("content")
            
            # Fallback на обычные мета-теги
            if not metadata["title"]:
                title_tag = soup.find("title")
                if title_tag:
                    metadata["title"] = title_tag.string
            
            if not metadata["description"]:
                desc_meta = soup.find("meta", attrs={"name": "description"})
                if desc_meta:
                    metadata["description"] = desc_meta.get("content")
            
            # Попытка найти цену в тексте страницы
            if not metadata["price"]:
                # Ищем по паттернам цен
                price_patterns = [
                    r'(?:цена|price)[:\s]*([0-9\s,.]+)\s*(?:₽|руб|rub|\$|usd|€|eur)',
                    r'([0-9\s,.]+)\s*(?:₽|руб|rub|\$|usd|€|eur)',
                ]
                
                text = soup.get_text()
                for pattern in price_patterns:
                    match = re.search(pattern, text, re.IGNORECASE)
                    if match:
                        price, currency = await parse_price(match.group(0))
                        if price:
                            metadata["price"] = str(price)
                            metadata["currency"] = currency
                            break
            
            # Специфичный парсинг для популярных магазинов
            url_lower = str(url).lower()
            
            # Ozon
            if "ozon.ru" in url_lower:
                price_elem = soup.find("span", {"class": re.compile(r".*price.*", re.I)})
                if price_elem:
                    price, currency = await parse_price(price_elem.get_text())
                    if price:
                        metadata["price"] = str(price)
                        metadata["currency"] = currency
            
            # Wildberries
            elif "wildberries.ru" in url_lower:
                price_elem = soup.find("span", {"class": "price-block__final-price"})
                if price_elem:
                    price, currency = await parse_price(price_elem.get_text())
                    if price:
                        metadata["price"] = str(price)
                        metadata["currency"] = currency
            
            # Яндекс.Маркет
            elif "market.yandex.ru" in url_lower:
                price_elem = soup.find("span", {"data-auto": "snippet-price-current"})
                if price_elem:
                    price, currency = await parse_price(price_elem.get_text())
                    if price:
                        metadata["price"] = str(price)
                        metadata["currency"] = currency
            
            # Amazon
            elif "amazon." in url_lower:
                price_elem = soup.find("span", {"class": "a-price-whole"})
                if price_elem:
                    price, currency = await parse_price(price_elem.get_text())
                    if price:
                        metadata["price"] = str(price)
                        metadata["currency"] = "USD"
            
            return metadata
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="Request timeout")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing URL: {str(e)}")
