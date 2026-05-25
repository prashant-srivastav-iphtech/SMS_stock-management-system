import { Store } from "../../models/store.model";
import { Organization } from "../../models/organization.model";
import { AppError } from "../../utils/errors";

export class StoreService {
  static async list() {
    return Store.findAll({ include: [{ model: Organization, as: "organization" }], order: [["createdAt", "DESC"]] });
  }

  static async create(payload: { organizationId: string; name: string; slug: string }) {
    const organization = await Organization.findByPk(payload.organizationId);
    if (!organization) {
      throw new AppError("Organization not found", 404);
    }
    const existing = await Store.findOne({ where: { slug: payload.slug } });
    if (existing) {
      throw new AppError("Store slug already exists", 409);
    }
    return Store.create(payload);
  }
}
