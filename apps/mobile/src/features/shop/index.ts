/**
 * Shop feature: screens, cart context, products hook.
 */

export { ShopHomeScreen } from '../../screens/ShopHomeScreen';
export { CartScreen } from '../../screens/CartScreen';
export { CartProvider, useCart } from '../../context/CartContext';
export type { CartItem } from '../../context/CartContext';
export { useShopProducts } from '../../hooks/useShopProducts';
