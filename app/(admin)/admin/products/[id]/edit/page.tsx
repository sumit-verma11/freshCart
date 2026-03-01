import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import ProductForm, { ProductInitialData } from "../../../../_components/ProductForm";

interface Props { params: { id: string } }

export default async function EditProductPage({ params }: Props) {
  await connectDB();
  const product = await Product.findById(params.id)
    .populate("category",    "name _id")
    .populate("subCategory", "name _id")
    .lean();

  if (!product) notFound();

  // Map mongoose doc to the shape ProductForm expects
  const initialData: ProductInitialData = {
    _id:                (product._id as object).toString(),
    name:               product.name as string,
    slug:               product.slug as string,
    description:        product.description as string,
    subDescription:     (product.subDescription  as string | undefined) ?? "",
    additionalInfo:     (product.additionalInfo  as string | undefined) ?? "",
    allergyInfo:        (product.allergyInfo     as string | undefined) ?? "",
    ingredients:        (product.ingredients     as string | undefined) ?? "",
    category:           product.category
                          ? { _id: (product.category as { _id: object; name: string })._id.toString(), name: (product.category as { _id: object; name: string }).name }
                          : null,
    subCategory:        product.subCategory
                          ? { _id: (product.subCategory as { _id: object; name: string })._id.toString(), name: (product.subCategory as { _id: object; name: string }).name }
                          : null,
    variants:           (product.variants as { size: string; unit: string; mrp: number; sellingPrice: number; sku: string }[]),
    stockQty:           product.stockQty as number,
    isAvailable:        product.isAvailable as boolean,
    isOrganic:          product.isOrganic as boolean,
    isFeatured:         product.isFeatured as boolean,
    images:             product.images as string[],
    tags:               (product.tags as string[] | undefined) ?? [],
    serviceablePincodes:(product.serviceablePincodes as string[] | undefined) ?? [],
  };

  return <ProductForm initialData={initialData} productId={initialData._id} />;
}
