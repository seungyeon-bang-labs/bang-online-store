// app/(shop)/products/[id]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductImages } from '@/features/product/product-images';
import { ProductInfo } from '@/features/product/product-info';
import { ProductForm } from '@/features/product/product-form';
import {
  productService,
  toProductDetailViewModel,
} from '@/domains/product';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: number }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await productService.findById(Number(id));
  return { title: product ? `${product.name} | MyStore` : '상품 없음' };
}

async function ProductPage({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const { id } = await params;
  const product = await productService.findById(Number(id));
  if (!product) notFound();

  const styleProducts = await productService.findByStyleId(product.styleId);
  const productView = toProductDetailViewModel(product, styleProducts);

  return (
    <div className="w-full max-w-6xl p-8 md:py-10">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] lg:grid-cols-[1fr_450px] gap-10 xl:gap-16 items-start">
        {/* 왼쪽 섹션: 이미지 (PC에서 남은 공간 전부 차지) */}
        <div className="w-full">
          <ProductImages images={productView.detailImages} />
        </div>

        {/* 오른쪽 섹션: 정보 및 구매 (PC에서 400px 고정 및 스크롤 시 고정) */}
        <div className="flex flex-col gap-8 md:sticky md:top-30 border-2 border-gray-100 p-6 rounded-lg">
          <ProductInfo
            name={productView.name}
            price={productView.price}
            discount={productView.discountRate}
          />
          <ProductForm
            colors={productView.groupColors}
            variants={productView.variants}
            productId={productView.id}
            price={productView.price}
            discount={productView.discountRate}
          />
          <ul className="space-y-3 pt-2">
            <li className="flex items-center gap-3 text-xs text-gray-500">
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              카드 무이자 할부 혜택
            </li>
            <li className="flex items-center gap-3 text-xs text-gray-500">
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              오후 2시 이전 주문 시 당일 발송
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ProductPage;
