import { stripe } from "../../config/stripe";
import { MasterOrder } from "../../models/masterOrder.model";
import { Order } from "../../models/order.model";
import { OrderItem } from "../../models/orderItem.model";
import { Payment } from "../../models/payment.model";
import { Product } from "../../models/product.model";
import { Store } from "../../models/store.model";
import { User } from "../../models/user.model";
import { sequelize } from "../../config/database";
import { AppError } from "../../utils/errors";
import { Lock } from "@sequelize/core";

export class OrderService {
  static async checkout(customerId: string, items: Array<{ productId: string; quantity: number }>, successUrl: string, cancelUrl: string) {
    const transaction = await sequelize.startUnmanagedTransaction();
    try {
      const customer = await User.findByPk(customerId, { transaction });
      if (!customer) {
        throw new AppError("Customer not found", 404);
      }

      const productRecords = await Product.findAll({
        where: { id: items.map((item) => item.productId) },
        lock: Lock.UPDATE,
        transaction,
      });

      const lineItems = items.map((item) => {
        const product = productRecords.find((product) => product.id === item.productId);
        if (!product) {
          throw new AppError(`Missing product ${item.productId}`, 404);
        }
        if (product.stock - product.reservedStock < item.quantity) {
          throw new AppError(`Insufficient inventory for ${product.name}`, 409);
        }
        product.reservedStock += item.quantity;
        return {
          price_data: {
            currency: "usd",
            unit_amount: Number(product.price) * 100,
            product_data: {
              name: product.name,
              description: product.description || undefined,
            },
          },
          quantity: item.quantity,
        };
      });

      await Promise.all(productRecords.map((product) => product.save({ transaction })));

      const masterOrder = await MasterOrder.create(
        {
          customerId,
          totalAmount: items.reduce((sum, item) => {
            const product = productRecords.find((product) => product.id === item.productId);
            return sum + (product ? Number(product.price) * item.quantity : 0);
          }, 0),
          status: "pending",
        },
        { transaction },
      );

      const ordersByStore = new Map<string, { order: Order; items: Array<{ product: any; quantity: number }> }>();
      for (const item of items) {
        const product = productRecords.find((product) => product.id === item.productId)!;
        const storeId = product.storeId;
        if (!ordersByStore.has(storeId)) {
          const order = await Order.create(
            {
              masterOrderId: masterOrder.id,
              storeId,
              customerId,
              total: 0,
              status: "pending",
              paymentStatus: "pending",
            },
            { transaction },
          );
          ordersByStore.set(storeId, { order, items: [] });
        }
        ordersByStore.get(storeId)!.items.push({ product, quantity: item.quantity });
      }

      for (const { order, items: storeItems } of ordersByStore.values()) {
        let subtotal = 0;
        for (const item of storeItems) {
          subtotal += Number(item.product.price) * item.quantity;
          await OrderItem.create(
            {
              orderId: order.id,
              productId: item.product.id,
              quantity: item.quantity,
              price: item.product.price,
            },
            { transaction },
          );
        }
        order.total = subtotal;
        await order.save({ transaction });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: lineItems,
        customer_email: customer.email,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          masterOrderId: masterOrder.id,
        },
      });

      await Payment.create(
        {
          masterOrderId: masterOrder.id,
          userId: customerId,
          stripePaymentIntentId: session.id,
          amount: Number(masterOrder.totalAmount),
          status: "pending",
        },
        { transaction },
      );

      await transaction.commit();
      return { checkoutUrl: session.url };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async listOrders(customerId: string) {
    return Order.findAll({
      where: { customerId },
      include: [
        { model: Store, as: "store" },
        {
          model: OrderItem,
          as: "items",
          include: [{ model: Product, as: "product" }],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  }

  static async getCustomerOrderById(customerId: string, orderId: string) {
    const order = await Order.findOne({
      where: { id: orderId, customerId },
      include: [
        { model: Store, as: "store" },
        {
          model: OrderItem,
          as: "items",
          include: [{ model: Product, as: "product" }],
        },
      ],
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    return order;
  }

  static async listAdminOrders() {
    return Order.findAll({
      include: [
        { model: Store, as: "store" },
        { model: User, as: "customer", attributes: ["id", "email", "firstName", "lastName", "role"] },
        {
          model: OrderItem,
          as: "items",
          include: [{ model: Product, as: "product" }],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  }

  static async updateStatus(orderId: string, status: string, paymentStatus?: string) {
    const allowedStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
    const allowedPaymentStatuses = ["pending", "paid", "failed", "refunded"];

    if (!allowedStatuses.includes(status)) {
      throw new AppError("Invalid order status", 400);
    }

    if (paymentStatus && !allowedPaymentStatuses.includes(paymentStatus)) {
      throw new AppError("Invalid payment status", 400);
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    order.status = status;
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }
    await order.save();

    return this.getAdminOrderById(order.id);
  }

  static async getAdminOrderById(orderId: string) {
    const order = await Order.findByPk(orderId, {
      include: [
        { model: Store, as: "store" },
        { model: User, as: "customer", attributes: ["id", "email", "firstName", "lastName", "role"] },
        {
          model: OrderItem,
          as: "items",
          include: [{ model: Product, as: "product" }],
        },
      ],
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    return order;
  }
}
