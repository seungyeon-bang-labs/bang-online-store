export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  image_url: string | null;
  alt_text: string | null;
}
