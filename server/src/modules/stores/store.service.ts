import { Store } from "../../models/store.model";
import { AppError } from "../../utils/errors";

export class StoreService {
  static async list() {
    return Store.findAll({ 
      order: [["createdAt", "DESC"]]
     });
  }

  static async create(payload: { name: string; slug: string }) {
    const existing = await Store.findOne({ where: { slug: payload.slug } });
    if (existing) {
      throw new AppError("Store slug already exists", 409);
    }
    return Store.create(payload);
  }
}
