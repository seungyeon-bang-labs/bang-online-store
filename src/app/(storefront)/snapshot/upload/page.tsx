'use client';

import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Camera, Plus } from 'lucide-react';
import { PageTitle } from '@/shared/components/common/page-title';

function SnapshotUploadPage() {
  return (
    <div className="w-full max-w-6xl p-8 md:py-10">
      <PageTitle current="SNAPSHOT UPLOAD" className="mb-12 hidden md:flex" />

      <div className="grid lg:grid-cols-[1fr_600px] gap-12 items-start">
        <div className="aspect-3/4 bg-zinc-100 border-2 border-dashed border-zinc-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-200 transition-all">
          <Camera className="size-10 text-zinc-400 mb-2" />
          <span className="text-xs font-bold text-zinc-500 uppercase">
            사진 올리기
          </span>
        </div>

        <div className="flex flex-col gap-10">
          <section className="space-y-4">
            <div className="flex justify-between items-end pb-2">
              <h2 className="font-black text-sm uppercase tracking-widest">
                상품 태그
              </h2>
            </div>

            <div className="flex gap-4 overflow-x-auto py-2">
              {/* 선택된 상품 카드들 */}
              <div className="min-w-30 aspect-square bg-zinc-100 rounded-md border flex items-center justify-center">
                <Plus className="text-zinc-400" />
              </div>
            </div>
          </section>

          {/* 3. 내용 입력 */}
          <section className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest">
                Style Description
              </label>
              <Textarea
                placeholder="착용하신 스타일의 포인트나 사이즈 팁을 공유해주세요."
                className="min-h-37.5 border-zinc-200 focus:ring-black rounded-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest">
                  Style Category
                </label>
                <select className="w-full h-12 border border-zinc-200 px-4 font-bold text-sm outline-none focus:border-black">
                  <option>Minimal</option>
                  <option>Street</option>
                  <option>Amekaji</option>
                  <option>City Boy</option>
                </select>
              </div>
              {/* 유저 스펙 정보 확인 (수정 가능하게) */}
              <div className="space-y-2 text-right">
                <p className="text-[10px] font-bold text-zinc-400 uppercase">
                  Your Spec
                </p>
                <p className="text-sm font-black italic tracking-tighter">
                  182cm / 74kg
                </p>
              </div>
            </div>
          </section>

          {/* 4. 제출 버튼 */}
          <div className="pt-10">
            <Button className="w-full h-16 bg-black text-white font-black text-xl italic uppercase tracking-tighter hover:bg-zinc-800">
              Post My Snap
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SnapshotUploadPage;
