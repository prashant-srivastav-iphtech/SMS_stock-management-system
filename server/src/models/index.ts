import { Store } from "./store.model";
import { Category } from "./category.model";
import { Product } from "./product.model";
import { User } from "./user.model";
import { Cart } from "./cart.model";
import { CartItem } from "./cartItem.model";
import { MasterOrder } from "./masterOrder.model";
import { Order } from "./order.model";
import { OrderItem } from "./orderItem.model";
import { Payment } from "./payment.model";
import { InventoryLog } from "./inventoryLog.model";
import { Session } from "./session.model";
import { RequestNonce } from "./requestNonce.model";

Store.hasMany(Product, { foreignKey: "storeId", as: "products" });
Product.belongsTo(Store, { foreignKey: "storeId", as: "store" });

Category.hasMany(Product, { foreignKey: "categoryId", as: "products" });
Product.belongsTo(Category, { foreignKey: "categoryId", as: "category" });

User.hasOne(Cart, { foreignKey: "userId", as: "cart" });
Cart.belongsTo(User, { foreignKey: "userId", as: "user" });

Cart.hasMany(CartItem, { foreignKey: "cartId", as: "items" });
CartItem.belongsTo(Cart, { foreignKey: "cartId", as: "cart" });

Product.hasMany(CartItem, { foreignKey: "productId", as: "cartItems" });
CartItem.belongsTo(Product, { foreignKey: "productId", as: "product" });

Store.hasMany(CartItem, { foreignKey: "storeId", as: "cartItems" });
CartItem.belongsTo(Store, { foreignKey: "storeId", as: "store" });

User.hasMany(MasterOrder, { foreignKey: "customerId", as: "masterOrders" });
MasterOrder.belongsTo(User, { foreignKey: "customerId", as: "customer" });

MasterOrder.hasMany(Order, { foreignKey: "masterOrderId", as: "orders" });
Order.belongsTo(MasterOrder, { foreignKey: "masterOrderId", as: "masterOrder" });

Store.hasMany(Order, { foreignKey: "storeId", as: "orders" });
Order.belongsTo(Store, { foreignKey: "storeId", as: "store" });

User.hasMany(Order, { foreignKey: "customerId", as: "orders" });
Order.belongsTo(User, { foreignKey: "customerId", as: "customer" });

Order.hasMany(OrderItem, { foreignKey: "orderId", as: "items" });
OrderItem.belongsTo(Order, { foreignKey: "orderId", as: "order" });

Product.hasMany(OrderItem, { foreignKey: "productId", as: "orderItems" });
OrderItem.belongsTo(Product, { foreignKey: "productId", as: "product" });

MasterOrder.hasMany(Payment, { foreignKey: "masterOrderId", as: "payments" });
Payment.belongsTo(MasterOrder, { foreignKey: "masterOrderId", as: "masterOrder" });

User.hasMany(Payment, { foreignKey: "userId", as: "payments" });
Payment.belongsTo(User, { foreignKey: "userId", as: "user" });

Product.hasMany(InventoryLog, { foreignKey: "productId", as: "inventoryLogs" });
InventoryLog.belongsTo(Product, { foreignKey: "productId", as: "product" });

Store.hasMany(InventoryLog, { foreignKey: "storeId", as: "inventoryLogs" });
InventoryLog.belongsTo(Store, { foreignKey: "storeId", as: "store" });

User.hasMany(Session, { foreignKey: "userId", as: "sessions" });
Session.belongsTo(User, { foreignKey: "userId", as: "user" });

export {
  User,
  Store,
  Category,
  Product,
  Cart,
  CartItem,
  MasterOrder,
  Order,
  OrderItem,
  Payment,
  InventoryLog,
  Session,
  RequestNonce,
};
