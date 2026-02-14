// WhatsApp number and message for premium purchases
const WHATSAPP_NUMBER = '77051097664';
const PREMIUM_MESSAGE = 'Hi, I want to purchase a premium LinkMax';

export function openPremiumPurchase(): void {
  const encodedMessage = encodeURIComponent(PREMIUM_MESSAGE);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
}
