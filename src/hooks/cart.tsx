import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storage = await AsyncStorage.getItem('@goMarketplace/cartProducts');
      if (storage) {
        const cartProducts = JSON.parse(storage);
        setProducts(cartProducts);
      }
    }
    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      let updatedProducts = [...products];
      const existingProduct = products.findIndex(
        item => item.id === product.id,
      );
      if (existingProduct > -1) {
        updatedProducts[existingProduct].quantity += 1;
      } else {
        updatedProducts = [...updatedProducts, { ...product, quantity: 1 }];
      }

      setProducts(updatedProducts);
      await AsyncStorage.setItem(
        '@goMarketplace/cartProducts',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const updatedProducts = [...products];
      const existingProduct = products.findIndex(item => item.id === id);
      if (existingProduct > -1) {
        updatedProducts[existingProduct].quantity += 1;
      }
      setProducts(updatedProducts);
      await AsyncStorage.setItem(
        '@goMarketplace/cartProducts',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      let updatedProducts = [...products];
      const existingProduct = products.findIndex(item => item.id === id);
      if (existingProduct > -1) {
        if (updatedProducts[existingProduct].quantity - 1 === 0) {
          updatedProducts = updatedProducts.filter(item => item.id !== id);
        } else {
          updatedProducts[existingProduct].quantity -= 1;
        }
      }
      setProducts(updatedProducts);
      await AsyncStorage.setItem(
        '@goMarketplace/cartProducts',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
