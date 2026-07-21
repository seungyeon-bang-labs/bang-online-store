import { Suspense } from 'react';
import FAQClient from './faq-client';

function FAQPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-6xl p-8 md:py-10" />}>
      <FAQClient />
    </Suspense>
  );
}

export default FAQPage;
