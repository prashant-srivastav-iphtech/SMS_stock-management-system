import { Request, Response, NextFunction } from "express";
import { OrganizationService } from "./organization.service";
import { successResponse } from "../../utils/api-response";
import { AppError } from "../../utils/errors";

export class OrganizationController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, slug } = req.body;
      if (!name || !slug) {
        throw new AppError("Name and slug are required", 400);
      }
      const organization = await OrganizationService.create({ name, slug });
      res.status(201).json(successResponse({ organization }));
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const organizations = await OrganizationService.list();
      res.status(200).json(successResponse({ organizations }));
    } catch (error) {
      next(error);
    }
  }
}
