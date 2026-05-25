import { Organization } from "../../models/organization.model";
import { AppError } from "../../utils/errors";

export class OrganizationService {
  static async list() {
    return Organization.findAll({ order: [["createdAt", "DESC"]] });
  }

  static async create(payload: { name: string; slug: string }) {
    const existing = await Organization.findOne({ where: { slug: payload.slug } });
    if (existing) {
      throw new AppError("Organization slug already exists", 409);
    }
    return Organization.create(payload);
  }
}
