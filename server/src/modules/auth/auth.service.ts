import bcrypt from "bcrypt";
import { randomBytes, randomUUID } from "crypto";
import { User } from "../../models/user.model";
import { Session } from "../../models/session.model";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../security/jwt";
import { AppError } from "../../utils/errors";
import { buildDeviceFingerprint } from "iph-device-fingerprint";

const generateHmacSecret = () => randomBytes(32).toString("hex");

export class AuthService {
  static async register(payload: { firstName: string; lastName?: string; email: string; password: string }) {
    const existing = await User.findOne({ where: { email: payload.email } });
    if (existing) {
      throw new AppError("Email already registered", 409);
    }

    const adminExists = await User.count({ where: { role: "admin" } });
    const hashed = await bcrypt.hash(payload.password, 12);

    const user = await User.create({
      firstName: payload.firstName,
      lastName: payload.lastName || "",
      email: payload.email.toLowerCase(),
      password: hashed,
      role: adminExists === 0 ? "admin" : "customer",
    });

    return user;
  }

  static async login(payload: { email: string; password: string }, req: any) {
    const user = await User.findOne({ where: { email: payload.email.toLowerCase() } });
    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    const valid = await bcrypt.compare(payload.password, user.password);
    if (!valid) {
      throw new AppError("Invalid credentials", 401);
    }

    const sessionId = randomUUID();
    const hmacSecret = generateHmacSecret();
    const fingerprint = buildDeviceFingerprint(req);
    const refreshToken = generateRefreshToken({ sub: user.id, sessionId, fingerprint });
    const accessToken = generateAccessToken({ sub: user.id, id: user.id, email: user.email, role: user.role, sessionId });

    // remove all previous sessions
    await Session.destroy({
      where: {
        userId: user.id,
      },
    });


    await Session.create({
      id: sessionId,
      userId: user.id,
      refreshToken,
      hmacSecret,
      deviceFingerprint: fingerprint,
      ip: req.ip || req.headers["x-forwarded-for"] || "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
    });

    return { user, accessToken, refreshToken, hmacSecret };
  }

  static async refresh(token: string, req: any) {
    try {
      const payload = verifyRefreshToken(token) as any;
      const session = await Session.findOne({ where: { id: payload.sessionId, userId: payload.sub } });
      if (!session || session.refreshToken !== token) {
        throw new AppError("Invalid refresh data", 401);
      }

      const fingerprint = buildDeviceFingerprint(req);
      if (payload.fingerprint !== fingerprint) {
        throw new AppError("Device fingerprint mismatch", 401);
      }

      const user = await User.findByPk(payload.sub);
      if (!user) {
        throw new AppError("User missing", 401);
      }

      const hmacSecret = generateHmacSecret();
      const accessToken = generateAccessToken({ sub: user.id, id: user.id, email: user.email, role: user.role, sessionId: payload.sessionId });
      const refreshToken = generateRefreshToken({ sub: payload.sub, sessionId: payload.sessionId, fingerprint });

      session.refreshToken = refreshToken;
      session.hmacSecret = hmacSecret;
      await session.save();

      return { accessToken, refreshToken, hmacSecret };
    } catch (error) {
      throw new AppError("Unable to refresh session", 401, error);
    }
  }

  static async logout(token: string) {
    try {
      const payload = verifyRefreshToken(token) as any;
      await Session.destroy({ where: { id: payload.sessionId, userId: payload.sub } });
      return true;
    } catch (error) {
      return false;
    }
  }
}

