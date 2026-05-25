import { Product } from "../../models/product.model";
import { Category } from "../../models/category.model";
import { Store } from "../../models/store.model";
import { AppError } from "../../utils/errors";

export class ProductService {
  static async listPublic() {
    return Product.findAll({
      where: { status: "active" },
      include: [
        { model: Store, as: "store" },
        { model: Category, as: "category" },
      ],
      order: [["createdAt", "DESC"]],
    });
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

  static async create(payload: { storeId: string; categoryId?: string; sku: string; name: string; description?: string; price: number; stock: number }) {
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
    const existingSku = await Product.findOne({ where: { sku: payload.sku } });
    if (existingSku) {
      throw new AppError("Product SKU already exists", 409);
    }
    return Product.create({
      ...payload,
      status: "active",
      reservedStock: 0,
      soldStock: 0,
      returnedStock: 0,
      damagedStock: 0,
    });
  }
}
