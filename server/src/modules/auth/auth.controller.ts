import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { loginSchema, registerSchema } from "./auth.validators";
import { successResponse } from "../../utils/api-response";
import { AppError } from "../../utils/errors";

export class AuthController {
  private static attachSessionHmac(res: Response, hmacSecret: string) {
    res.setHeader("x-session-hmac", hmacSecret);
  }

  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = registerSchema.parse(req.body);
      const user = await AuthService.register(payload);
      res
        .status(201)
        .json(
          successResponse({
            user: { id: user.id, email: user.email, role: user.role },
          }),
        );
    } catch (error) {
      next(
        error instanceof Error ? error : new AppError("Invalid request", 400),
      );
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = loginSchema.parse(req.body);
      const result = await AuthService.login(payload, req);
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      AuthController.attachSessionHmac(res, result.hmacSecret);
      res.status(200).json(
        successResponse({
          user: {
            id: result.user.id,
            email: result.user.email,
            role: result.user.role,
          },
          accessToken: result.accessToken,
        }),
      );
    } catch (error) {
      next(
        error instanceof Error
          ? error
          : new AppError("Invalid login request", 400),
      );
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies.refreshToken;
      if (!token) {
        throw new AppError("Refresh token missing", 401);
      }

      const result = await AuthService.refresh(token, req);
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      AuthController.attachSessionHmac(res, result.hmacSecret);
      res
        .status(200)
        .json(successResponse({ accessToken: result.accessToken }));
    } catch (error) {
      next(
        error instanceof Error
          ? error
          : new AppError("Unable to refresh token", 401),
      );
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies.refreshToken;
      if (token) {
        await AuthService.logout(token);
      }
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      res.status(200).json(successResponse({ message: "Signed out" }));
    } catch (error) {
      next(
        error instanceof Error
          ? error
          : new AppError("Unable to sign out", 500),
      );
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!user) {
        throw new AppError("Not authenticated", 401);
      }
      res.status(200).json(successResponse({ user }));
    } catch (error) {
      next(
        error instanceof Error
          ? error
          : new AppError("Unable to resolve user", 401),
      );
    }
  }
}
