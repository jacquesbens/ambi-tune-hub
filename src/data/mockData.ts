export interface Album {
  id: string;
  title: string;
  artist: string;
  cover: string;
  year: number;
  tracks: Track[];
  folderName?: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  cover: string;
  url?: string;
}

export const mockAlbums: Album[] = [
  {
    id: "1",
    title: "Random Access Memories",
    artist: "Daft Punk",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500",
    year: 2013,
    tracks: [
      {
        id: "1-1",
        title: "Get Lucky",
        artist: "Daft Punk",
        album: "Random Access Memories",
        duration: 367,
        cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      },
      {
        id: "1-2",
        title: "Instant Crush",
        artist: "Daft Punk",
        album: "Random Access Memories",
        duration: 337,
        cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      },
      {
        id: "1-3",
        title: "Lose Yourself to Dance",
        artist: "Daft Punk",
        album: "Random Access Memories",
        duration: 353,
        cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      },
    ],
  },
  {
    id: "2",
    title: "The Dark Side of the Moon",
    artist: "Pink Floyd",
    cover: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500",
    year: 1973,
    tracks: [
      {
        id: "2-1",
        title: "Time",
        artist: "Pink Floyd",
        album: "The Dark Side of the Moon",
        duration: 413,
        cover: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
      },
      {
        id: "2-2",
        title: "Money",
        artist: "Pink Floyd",
        album: "The Dark Side of the Moon",
        duration: 382,
        cover: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
      },
    ],
  },
  {
    id: "3",
    title: "Thriller",
    artist: "Michael Jackson",
    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500",
    year: 1982,
    tracks: [],
  },
  {
    id: "4",
    title: "Abbey Road",
    artist: "The Beatles",
    cover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=500",
    year: 1969,
    tracks: [],
  },
  {
    id: "5",
    title: "OK Computer",
    artist: "Radiohead",
    cover: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=500",
    year: 1997,
    tracks: [],
  },
  {
    id: "6",
    title: "Back in Black",
    artist: "AC/DC",
    cover: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500",
    year: 1980,
    tracks: [],
  },
  {
    id: "7",
    title: "Rumours",
    artist: "Fleetwood Mac",
    cover: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500",
    year: 1977,
    tracks: [],
  },
  {
    id: "8",
    title: "Nevermind",
    artist: "Nirvana",
    cover: "https://images.unsplash.com/photo-1484876065684-b683cf17d276?w=500",
    year: 1991,
    tracks: [],
  },
  {
    id: "9",
    title: "Led Zeppelin IV",
    artist: "Led Zeppelin",
    cover: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=500",
    year: 1971,
    tracks: [],
  },
  {
    id: "10",
    title: "The Wall",
    artist: "Pink Floyd",
    cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500",
    year: 1979,
    tracks: [],
  },
];

export const mockCurrentTrack: Track = {
  id: "1",
  title: "Get Lucky",
  artist: "Daft Punk",
  album: "Random Access Memories",
  duration: 367,
  cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500",
};
