import { Request, Response, NextFunction } from "express";
import { PaymentService } from "./payment.service";
import { successResponse } from "../../utils/api-response";
import { AppError } from "../../utils/errors";

export class PaymentController {
  static async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers["stripe-signature"] as string;
      if (!signature) {
        throw new AppError("Missing Stripe webhook signature", 400);
      }
      const event = await PaymentService.handleStripeWebhook(req.body, signature);
      res.status(200).json(successResponse({ event: event.type }));
    } catch (error) {
      next(error);
    }
  }
}
