import { Request, Response, NextFunction } from "express";
import { StoreService } from "./store.service";
import { successResponse } from "../../utils/api-response";
import { AppError } from "../../utils/errors";
import { storeSchema } from "./store.validators";

export class StoreController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, slug } = storeSchema.parse(req.body);
      if (!name || !slug) {
        throw new AppError("Store name and slug are required", 400);
      }
      const store = await StoreService.create({ name, slug });
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
