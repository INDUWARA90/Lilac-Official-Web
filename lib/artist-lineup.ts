export type ArtistLineupEntry = {
  id: string;
  name: string;
  hiddenName: string;
  role: string;
  shadowImageUrl: string;
  revealedImageUrl: string;
  variant: "poppy" | "gypsophila" | "clematis" | "lavender";
};

export const ARTIST_LINEUP: readonly ArtistLineupEntry[] = [
  {
    id: "artist-1",
    name: "Imesh Sandeepa",
    hiddenName: "Unknown Artist",
    role: "Artist reveal coming soon",
    shadowImageUrl: "/shadows/Unknown%20Artist%2001.png",
    revealedImageUrl: "https://res.cloudinary.com/dkj7pc9xo/image/upload/v1791103924/hiayhtrwwhsqgd0sdfrq.jpg",
    variant: "poppy",
  },
  {
    id: "artist-2",
    name: "Uvindu Ayshcharya",
    hiddenName: "Unknown Artist",
    role: "Artist reveal coming soon",
    shadowImageUrl: "/shadows/Unknown%20Artist%2002.png",
    revealedImageUrl: "https://res.cloudinary.com/dkj7pc9xo/image/upload/v1791105203/lmdbcgn7ko0iddb7jzy8.jpg",
    variant: "gypsophila",
  },
  {
    id: "artist-3",
    name: "Chathurya Sadabarana",
    hiddenName: "Unknown Artist",
    role: "Artist reveal coming soon",
    shadowImageUrl: "/shadows/Unknown%20Artist%2003.png",
    revealedImageUrl: "https://res.cloudinary.com/dkj7pc9xo/image/upload/v1791105074/hf3sgsktnbrs3cjppvne.jpg",
    variant: "clematis",
  },
  {
    id: "artist-4",
    name: "Yesha Fernando",
    hiddenName: "Unknown Artist",
    role: "Artist reveal coming soon",
    shadowImageUrl: "/shadows/Unknown%20Artist%2004.png",
    revealedImageUrl: "https://res.cloudinary.com/dkj7pc9xo/image/upload/v1791106009/h13xoqhpicyqm7iivew0.jpg",
    variant: "lavender",
  },
];
