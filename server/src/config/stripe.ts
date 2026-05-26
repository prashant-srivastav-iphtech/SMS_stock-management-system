import Stripe from "stripe";
import { env } from "../utils/envValidator";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
  maxNetworkRetries: 2,
});
