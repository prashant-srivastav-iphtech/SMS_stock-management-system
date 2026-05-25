import { Request, Response, NextFunction } from "express";
import { ProductService } from "./product.service";
import { successResponse } from "../../utils/api-response";

export class ProductController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = req.body;
      const product = await ProductService.create(payload);
      res.status(201).json(successResponse({ product }));
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await ProductService.listPublic();
      res.status(200).json(successResponse({ products }));
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
}
