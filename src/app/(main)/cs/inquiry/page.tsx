import { redirect } from 'next/navigation';

function InquiryPage() {
  redirect('/mypage/inquiries/write');
}

export default InquiryPage;
