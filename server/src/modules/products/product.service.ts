import { Product } from "../../models/product.model";
import { Category } from "../../models/category.model";
import { Store } from "../../models/store.model";
import { AppError } from "../../utils/errors";
import { generateSku } from "../../utils/sku";
import { Op } from "@sequelize/core";

export class ProductService {
  static async listPublic(page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    // TODO: to get only the data needed to show to the user.
    const { count, rows } = await Product.findAndCountAll({
      where: { status: "active" },
      include: [
        { model: Store, as: "store" },
        { model: Category, as: "category" },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return {
      products: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  static async getPublicById(id: string) {
    const product = await Product.findOne({
      where: { id, status: "active" },
      include: [
        { model: Store, as: "store" },
        { model: Category, as: "category" },
      ],
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return product;
  }

  static async create(payload: {
    storeId: string;
    categoryId?: string;
    name: string;
    description?: string;
    price: number;
    stock: number;
  }) {
    const store = await Store.findByPk(payload.storeId);
    if (!store) {
      throw new AppError("Store not found", 404);
    }
    if (payload.categoryId) {
      const category = await Category.findByPk(payload.categoryId);
      if (!category) {
        throw new AppError("Category not found", 404);
      }
    }
    const sku = generateSku(payload.name);
    const existingSku = await Product.findOne({ where: { sku } });
    if (existingSku) {
      throw new AppError("Product SKU already exists", 409);
    }
    return Product.create({
      ...payload,
      sku,
      status: "active",
      reservedStock: 0,
      soldStock: 0,
      returnedStock: 0,
      damagedStock: 0,
    });
  }

  static async getLowStockAlerts(threshhold:number=10,page:number=1,limit:number=10, storeId?:string){
    const offset = (page - 1) * limit;
    const where: any = {
      status: "active",
      stock: { [Op.lt]: threshhold },
    };

    if (storeId) {
      where.storeId = storeId;
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        { model: Store, as: "store" },
        { model: Category, as: "category" },
      ],
      order: [["stock", "ASC"]],
      limit,
      offset,
    });

    return {
      alerts: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }
}
