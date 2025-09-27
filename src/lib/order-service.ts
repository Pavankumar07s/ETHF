// Order API service for fetching user orders from backend

export interface Order {
  _id: string;
  user: string;
  merchant: string;
  outToken: string;
  outChain: string;
  usdCents: string;
  deadlineSec: string;
  status?: string;
  uid?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  success: boolean;
  data: {
    orders: Order[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalOrders: number;
      hasMore: boolean;
    };
  };
  message?: string;
  error?: string;
}

export interface OrderByIdResponse {
  success: boolean;
  data?: {
    order: Order;
  };
  order?: Order; // For public API response format
  message?: string;
  error?: string;
}

export interface PublicOrder {
  uid: string;
  outChain: string;
  outToken: string;
  usdCents: string;
  merchant: string;
  deadline: number;
  createdAt: string;
  status: string;
}

class OrderService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  }

  /**
   * Fetch all orders for the authenticated user with pagination
   */
  async getUserOrders(page: number = 1, limit: number = 10): Promise<OrdersResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/order?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result: OrdersResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch orders');
      }

      return result;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  }

  /**
   * Fetch a specific order by its UID (authenticated)
   */
  async getOrderById(uid: string): Promise<OrderByIdResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/order/orderId/${uid}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result: OrderByIdResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch order');
      }

      return result;
    } catch (error) {
      console.error('Error fetching order by ID:', error);
      throw error;
    }
  }

  /**
   * Fetch order status by UID (authenticated)
   */
  async getOrderStatus(uid: string): Promise<{ success: boolean; order: Order; status: string; message?: string; error?: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/order/status/orderId/${uid}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch order status');
      }

      return result;
    } catch (error) {
      console.error('Error fetching order status:', error);
      throw error;
    }
  }

  /**
   * Fetch a specific order by its UID (public, no authentication required)
   */
  async getPublicOrderById(uid: string): Promise<OrderByIdResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/order/public/${uid}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result: OrderByIdResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch order');
      }

      return result;
    } catch (error) {
      console.error('Error fetching public order by ID:', error);
      throw error;
    }
  }

  /**
   * Create a new order
   */
  async createOrder(orderData: {
    merchant: string;
    outToken: string;
    outChain: string;
    usdCents: string;
    deadlineSec: string;
  }): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/order/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(orderData),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create order');
      }

      return result;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const orderService = new OrderService();

// Export individual functions for convenience
export const getUserOrders = (page?: number, limit?: number) => 
  orderService.getUserOrders(page, limit);

export const getOrderById = (uid: string) => 
  orderService.getOrderById(uid);

export const getOrderStatus = (uid: string) => 
  orderService.getOrderStatus(uid);

export const getPublicOrderById = (uid: string) => 
  orderService.getPublicOrderById(uid);

export const createOrder = (orderData: {
  merchant: string;
  outToken: string;
  outChain: string;
  usdCents: string;
  deadlineSec: string;
}) => orderService.createOrder(orderData);