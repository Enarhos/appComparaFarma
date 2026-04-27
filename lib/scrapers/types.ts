export interface ScrapedProduct {
  name: string;
  price: number;          // precio presencial (tienda)
  onlinePrice: number | null;  // precio web/internet
  cmrPrice: number | null;     // precio con tarjeta CMR (Salcobrand)
  hasStock: boolean;
  hasOnlineDelivery: boolean;
  onlineUrl: string | null;
  laboratory: string | null;
  isBioequivalent: boolean;
}
