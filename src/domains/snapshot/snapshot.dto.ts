export type SnapshotAuthorDTO = {
  nickname: string;
  profileImage: string;
  height: number;
  weight: number;
};

export type SnapshotImageDTO = {
  url: string;
  order: number;
};

export type SnapshotTaggedProductDTO = {
  productId: string;
  productName: string;
  brandName: string;
  price: number;
  thumbnail: string;
};

export type SnapshotStatsDTO = {
  likes: number;
  comments: number;
  views: number;
};

export type SnapshotDTO = {
  id: string;
  author: SnapshotAuthorDTO;
  images: SnapshotImageDTO[];
  content: string;
  taggedProducts: SnapshotTaggedProductDTO[];
  stats: SnapshotStatsDTO;
  createdAt: string;
};

