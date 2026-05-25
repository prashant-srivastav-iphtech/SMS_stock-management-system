import { stripe } from "../../config/stripe";
import { Payment } from "../../models/payment.model";
import { MasterOrder } from "../../models/masterOrder.model";
import { Order } from "../../models/order.model";
import { OrderItem } from "../../models/orderItem.model";
import { Product } from "../../models/product.model";
import { InventoryLog } from "../../models/inventoryLog.model";
import { AppError } from "../../utils/errors";

const fulfillOrder = async (paymentIntentId: string, masterOrderId?: string) => {
  const payment =
    (await Payment.findOne({ where: { stripePaymentIntentId: paymentIntentId } })) ||
    (masterOrderId ? await Payment.findOne({ where: { masterOrderId } }) : null);

  if (!payment) {
    throw new AppError("Payment record missing", 404);
  }

  // Stripe webhooks may be delivered more than once, so fulfillment must be idempotent.
  if (payment.status === "successful") {
    return;
  }

  payment.stripePaymentIntentId = paymentIntentId;
  payment.status = "successful";
  await payment.save();

  const masterOrder = await MasterOrder.findByPk(payment.masterOrderId);
  if (!masterOrder) {
    throw new AppError("Master order missing", 404);
  }
  masterOrder.status = "processing";
  await masterOrder.save();

  const orders = await Order.findAll({ where: { masterOrderId: masterOrder.id } });
  await Promise.all(orders.map(async (order) => {
    order.paymentStatus = "paid";
    order.status = "confirmed";
    await order.save();
  }));

  const orderItems = await OrderItem.findAll({
    where: { orderId: orders.map((order) => order.id) },
    include: [{ model: Product, as: "product" }],
  });

  for (const item of orderItems) {
    const product = item.product;
    if (!product) continue;
    product.reservedStock = Math.max(product.reservedStock - item.quantity, 0);
    product.stock = Math.max(product.stock - item.quantity, 0);
    product.soldStock += item.quantity;
    product.status = product.stock <= 0 ? "out_of_stock" : "active";
    await product.save();
    await InventoryLog.create({
      productId: product.id,
      storeId: product.storeId,
      userId: payment.userId,
      change: -item.quantity,
      reason: "paid_order",
    });
  }
};

export class PaymentService {
  static async createCheckoutSession(masterOrderId: string, items: any[], successUrl: string, cancelUrl: string) {
    const lineItems = items.map((item) => ({
      price_data: {
        currency: "usd",
        unit_amount: Math.round(item.price * 100),
        product_data: {
          name: item.name,
          description: item.description || undefined,
        },
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { masterOrderId },
    });

    return session;
  }

  static async handleStripeWebhook(payload: Buffer, signature: string) {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    const event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      await fulfillOrder(session.payment_intent, session.metadata?.masterOrderId);
    }

    return event;
  }
}
