/**
 * Supabase 전환 시 `parent_id → categories.id` 자기 참조 외래 키를 둔다.
 * 하위 카테고리는 `(parent_id, slug)`, 대분류는 `parent_id IS NULL` 범위에서
 * slug가 고유하도록 제약한다.
 */
export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  image_url: string | null;
  alt_text: string | null;
}
