from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class ScrapedProduct:
    name: str
    price: float
    has_stock: bool
    has_online_delivery: bool
    online_url: Optional[str]
    online_price: Optional[float] = None
    active_ingredient: Optional[str] = None
    concentration: Optional[str] = None
    form: Optional[str] = None
    laboratory: Optional[str] = None
    is_bioequivalent: bool = False


class BaseScraper(ABC):
    slug: str
    name: str

    @abstractmethod
    async def search(self, query: str) -> list[ScrapedProduct]:
        """Busca un medicamento y retorna los resultados."""
        ...
