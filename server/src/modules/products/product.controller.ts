import { Request, Response, NextFunction } from "express";
import { ProductService } from "./product.service";
import { successResponse } from "../../utils/api-response";
import { lowStockQuerySchema, paginationSchema, productSchema } from "./product.validators";

export class ProductController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = productSchema.parse(req.body);
      const product = await ProductService.create(payload);
      res.status(201).json(successResponse({ product }));
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = paginationSchema.parse(req.query);
      const result = await ProductService.listPublic(query.page, query.limit);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.getPublicById(req.params.id);
      res.status(200).json(successResponse({ product }));
    } catch (error) {
      next(error);
    }
  }

  static async getLowStockAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const query = lowStockQuerySchema.parse(req.query);
      const result = await ProductService.getLowStockAlerts(
        query.threshold,
        query.page,
        query.limit,
        query.storeId,
      );
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

}
