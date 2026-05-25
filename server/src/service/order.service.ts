import { Lock } from "@sequelize/core";
import { sequelize } from "../config/database";
import { Order } from "../models/order.model";
import { Product } from "../models/product.model";

export const createOrder = async ({
  productId,
  quantity,
  customerId,
  storeId,
}: any) => {
  await sequelize.transaction(async (transaction) => {
    const product = await Product.findByPk(productId, {
      transaction,
      lock: Lock.UPDATE,
    });

    if (!product) {
      throw new Error("Product not found");
    }

    if (product.getDataValue("stock") < quantity) {
      throw new Error("Insufficient stock");
    }

    await product.update(
      {
        stock: product.getDataValue("stock") - quantity,

        reservedStock: product.getDataValue("reservedStock") + quantity,
      },
      { transaction },
    );

    const order = await Order.create(
      {
        customerId,
        storeId,

        total: product.getDataValue("price") * quantity,

        status: "pending",

        paymentStatus: "pending",
      },
      { transaction },
    );

    return order;
  });
};
