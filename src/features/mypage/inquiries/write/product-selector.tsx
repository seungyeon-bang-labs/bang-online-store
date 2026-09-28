'use client';

import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { InputError } from '@/shared/components/ui/input';
import { Dialog, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import {
  INQUIRY_PRODUCT_CATEGORY_FILTER_LABELS,
  INQUIRY_PRODUCT_CATEGORY_FILTERS,
  type InquiryProductCategoryFilter,
  type InquiryWriteProductOptionViewModel,
} from '@/domains/inquiry';
import { MypageFormLabel } from '@/features/mypage/common/form';
import { MYPAGE_SELECTOR_TRIGGER_CLASS_NAME } from '@/features/mypage/common/styles';
import { formatKoreanMoney } from '@/shared/lib/format';
import { MypageInquirySelectorDialogContent } from './selector-dialog-content';
import { MypageInquirySelectorSearchInput } from './selector-search-input';
import { MypageInquirySelectionOption } from './selection-option';

interface MypageInquiryWriteProductSelectorProps {
  products: readonly InquiryWriteProductOptionViewModel[];
  selectedProductId: string;
  error?: string;
  errorId?: string;
  isReadOnly?: boolean;
  onProductChange: (productId: string) => void;
}

export function MypageInquiryWriteProductSelector({
  products,
  selectedProductId,
  error,
  errorId,
  isReadOnly = false,
  onProductChange,
}: MypageInquiryWriteProductSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] =
    useState<InquiryProductCategoryFilter>('all');
  const selectedProduct = products.find(
    product => String(product.id) === selectedProductId,
  );
  const filteredProducts = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase();
    const categoryProducts = products.filter(
      product =>
        categoryFilter === 'all' || product.category === categoryFilter,
    );

    if (!normalizedSearchTerm) return categoryProducts;

    return categoryProducts.filter(
      product =>
        product.name.toLocaleLowerCase().includes(normalizedSearchTerm),
    );
  }, [categoryFilter, products, searchTerm]);

  function selectProduct(productId: string) {
    onProductChange(productId);
    setSearchTerm('');
    setCategoryFilter('all');
    setIsOpen(false);
  }

  return (
    <div>
      <MypageFormLabel htmlFor="inquiry-product-selector" requirement="required">
        상품 선택
      </MypageFormLabel>

      {selectedProduct ? (
        <button
          id="inquiry-product-selector"
          type="button"
          disabled={isReadOnly}
          aria-describedby={error ? errorId : undefined}
          onClick={() => setIsOpen(true)}
          className={`mt-2 flex w-full items-center gap-3 rounded-sm border border-zinc-300 bg-white p-3 text-left transition-colors hover:bg-zinc-50 disabled:cursor-default disabled:hover:bg-white ${MYPAGE_SELECTOR_TRIGGER_CLASS_NAME}`}
        >
          <div className="relative size-14 shrink-0 overflow-hidden rounded-sm bg-zinc-100">
            <Image
              src={selectedProduct.thumbnailUrl}
              alt=""
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-black">
              {selectedProduct.name}
            </p>
            <ProductPrice product={selectedProduct} />
          </div>
          {!isReadOnly ? (
            <ChevronRight
              aria-hidden="true"
              className="size-4 shrink-0 text-zinc-500"
              strokeWidth={2}
            />
          ) : null}
        </button>
      ) : (
        <button
          id="inquiry-product-selector"
          type="button"
          data-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onClick={() => setIsOpen(true)}
          className={`mt-2 flex h-10 w-full items-center justify-between rounded-sm border border-zinc-300 bg-white px-3 text-left text-sm font-medium text-zinc-500 hover:border-black data-[invalid=true]:border-red-500 ${MYPAGE_SELECTOR_TRIGGER_CLASS_NAME}`}
        >
          상품을 선택해 주세요
          <ChevronRight className="size-4 text-zinc-500" strokeWidth={2} />
        </button>
      )}
      <InputError id={errorId} message={error} />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <MypageInquirySelectorDialogContent>
          <DialogHeader className="shrink-0 border-b border-zinc-300 px-4 py-4 text-center md:px-5 md:py-5 sm:text-center">
            <DialogTitle className="font-black text-black">상품 선택</DialogTitle>
          </DialogHeader>
          <div className="shrink-0 p-4 pb-0 md:p-5 md:pb-0">
            <MypageInquirySelectorSearchInput
              value={searchTerm}
              onValueChange={setSearchTerm}
              placeholder="상품명을 입력해 주세요"
            />
            <div className="-mx-4 mt-3 overflow-x-auto px-4 pb-1 md:-mx-5 md:px-5">
              <div className="flex w-max gap-2">
                {INQUIRY_PRODUCT_CATEGORY_FILTERS.map(category => {
                  const isSelected = category === categoryFilter;

                  return (
                    <button
                      key={category}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setCategoryFilter(category)}
                      className={`h-8 rounded-sm border px-3 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${
                        isSelected
                          ? 'border-black bg-black text-white'
                          : 'border-zinc-300 bg-white text-zinc-600 hover:border-black hover:text-black'
                      }`}
                    >
                      {INQUIRY_PRODUCT_CATEGORY_FILTER_LABELS[category]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-5">
            {filteredProducts.length > 0 ? (
              <ul className="divide-y divide-zinc-200 border-y border-zinc-200">
                {filteredProducts.map(product => (
                  <li key={product.id}>
                    <MypageInquirySelectionOption
                      thumbnailUrl={product.thumbnailUrl}
                      title={product.name}
                      onSelect={() => selectProduct(String(product.id))}
                      trailing={
                        product.isSoldOut ? (
                          <span className="shrink-0 text-xs font-bold text-zinc-500">
                            일시 품절
                          </span>
                        ) : null
                      }
                    >
                      <ProductPrice product={product} />
                    </MypageInquirySelectionOption>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="flex h-full items-center justify-center text-center text-sm font-medium text-zinc-500">
                선택한 조건에 맞는 상품이 없습니다.
              </p>
            )}
          </div>
        </MypageInquirySelectorDialogContent>
      </Dialog>
    </div>
  );
}

function ProductPrice({
  product,
}: {
  product: InquiryWriteProductOptionViewModel;
}) {
  if (product.discountRate === 0) {
    return (
      <>
        <span aria-hidden="true" className="mt-0.5 block h-5" />
        <p className="mt-0.5 text-sm font-bold leading-5 text-black">
          {formatKoreanMoney(product.price)}
        </p>
      </>
    );
  }

  return (
    <>
      <p className="mt-0.5 h-5 text-sm leading-5 text-zinc-400 line-through">
        {formatKoreanMoney(product.price)}
      </p>
      <p className="mt-0.5 flex h-5 items-center gap-1.5 text-sm leading-5">
        <span className="font-bold text-red-500">{product.discountRate}%</span>
        <strong className="text-black">
          {formatKoreanMoney(product.discountedPrice)}
        </strong>
      </p>
    </>
  );
}
