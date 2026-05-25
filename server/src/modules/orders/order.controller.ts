import { Request, Response, NextFunction } from "express";
import { OrderService } from "./order.service";
import { successResponse } from "../../utils/api-response";
import { AppError } from "../../utils/errors";

export class OrderController {
  static async checkout(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = (req as any).user?.sub || (req as any).user?.id;
      const { items, successUrl, cancelUrl } = req.body;
      if (!customerId || !Array.isArray(items) || items.length === 0) {
        throw new AppError("Invalid checkout payload", 400);
      }

      const result = await OrderService.checkout(customerId, items, successUrl, cancelUrl);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = (req as any).user?.sub || (req as any).user?.id;
      if (!customerId) {
        throw new AppError("Authentication required", 401);
      }
      const orders = await OrderService.listOrders(customerId);
      res.status(200).json(successResponse({ orders }));
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = (req as any).user?.sub || (req as any).user?.id;
      if (!customerId) {
        throw new AppError("Authentication required", 401);
      }
      const order = await OrderService.getCustomerOrderById(customerId, req.params.id);
      res.status(200).json(successResponse({ order }));
    } catch (error) {
      next(error);
    }
  }

  static async adminList(req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await OrderService.listAdminOrders();
      res.status(200).json(successResponse({ orders }));
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, paymentStatus } = req.body;
      if (!status) {
        throw new AppError("Order status is required", 400);
      }
      const order = await OrderService.updateStatus(req.params.id, status, paymentStatus);
      res.status(200).json(successResponse({ order }));
    } catch (error) {
      next(error);
    }
  }
}
