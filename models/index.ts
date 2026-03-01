/**
 * FreshCart — Mongoose model barrel export
 * Import from here instead of individual files to avoid circular deps.
 *
 * Usage:
 *   import { User, Product, Category, Cart, Order, Pincode } from "@/models";
 */

export { default as User }     from "./User";
export { default as Category } from "./Category";
export { default as Product }  from "./Product";
export { default as Cart }     from "./Cart";
export { default as Order }    from "./Order";
export { default as Pincode }  from "./Pincode";

// Document type re-exports for convenience
export type { IUserDocument }     from "./User";
export type { ICategoryDocument } from "./Category";
export type { IProductDocument }  from "./Product";
export type { ICartDocument }     from "./Cart";
export type { IOrderDocument }    from "./Order";
export type { IPincodeDocument }  from "./Pincode";
