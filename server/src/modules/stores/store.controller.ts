import { Request, Response, NextFunction } from "express";
import { StoreService } from "./store.service";
import { successResponse } from "../../utils/api-response";
import { AppError } from "../../utils/errors";

export class StoreController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { organizationId, name, slug } = req.body;
      if (!organizationId || !name || !slug) {
        throw new AppError("Organization, name and slug are required", 400);
      }
      const store = await StoreService.create({ organizationId, name, slug });
      res.status(201).json(successResponse({ store }));
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const stores = await StoreService.list();
      res.status(200).json(successResponse({ stores }));
    } catch (error) {
      next(error);
    }
  }
}
