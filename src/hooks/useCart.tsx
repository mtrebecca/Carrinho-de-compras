import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data } = await api.get(`/products/${productId}`)
      const productOnCart = cart.find((product) => product.id === productId)

      if (productOnCart) {
        const amount = productOnCart.amount + 1;
        updateProductAmount({
          productId,
          amount,
        })
      }

      const amount = 1;
      const newCart = [...cart, { amount, ...data }]
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      setCart(newCart);
    } catch {
      toast.error('Erro na adição do produto');
      toast.error('Quantidade solicitada fora de estoque');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const findProduct = [...cart].find((product) => product.id === productId)

      if (!findProduct) {
        return toast.error('Erro na remoção do produto');
      }
      const removeProduct = [...cart].filter((product) => {
        return product['id'] !== productId;
      })

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(removeProduct));
      setCart(removeProduct);
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const Stock = await api.get(`/stock/${productId}`)

      if (amount > Stock.data.amount || amount < 1){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updateProduct = [...cart].filter((product) => {
        if (product.id === productId) {
          product.amount = amount;
        }
        return product;
      })

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateProduct));
      setCart(updateProduct);
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}