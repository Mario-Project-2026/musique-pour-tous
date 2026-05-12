import { createClient } from "@cosmicjs/sdk";

const cosmic = createClient({
  bucketSlug: process.env.COSMIC_BUCKET_SLUG!,
  readKey: process.env.COSMIC_READ_KEY,
});

export async function getAlbums(limit = 20, skip = 0) {
  try {
    const albums = await cosmic.objects
      .query({
        type: "albums",
        limit,
        skip,
        sort: "-created_at",
      })
      .props("id,slug,title,description,metadata");
    return albums.objects || [];
  } catch (error) {
    console.error("Error fetching albums:", error);
    return [];
  }
}

export async function getAlbumWithTracks(slug: string) {
  try {
    const album = await cosmic.objects.findOne({
      type: "albums",
      slug,
      props: "id,slug,title,description,metadata",
      depth: 2,
    });
    return album.object;
  } catch (error) {
    console.error("Error fetching album:", error);
    return null;
  }
}

export async function getArtists(limit = 20, skip = 0) {
  try {
    const artists = await cosmic.objects
      .query({
        type: "artists",
        limit,
        skip,
        sort: "title",
      })
      .props("id,slug,title,metadata");
    return artists.objects || [];
  } catch (error) {
    console.error("Error fetching artists:", error);
    return [];
  }
}

export async function getArtist(slug: string) {
  try {
    const artist = await cosmic.objects.findOne({
      type: "artists",
      slug,
      props: "id,slug,title,metadata",
    });
    return artist.object;
  } catch (error) {
    console.error("Error fetching artist:", error);
    return null;
  }
}

export async function getTracks(limit = 100, skip = 0) {
  try {
    const tracks = await cosmic.objects
      .query({
        type: "tracks",
        limit,
        skip,
        sort: "-created_at",
      })
      .props("id,slug,title,metadata");
    return tracks.objects || [];
  } catch (error) {
    console.error("Error fetching tracks:", error);
    return [];
  }
}

export async function getTrack(slug: string) {
  try {
    const track = await cosmic.objects.findOne({
      type: "tracks",
      slug,
      props: "id,slug,title,metadata",
      depth: 2,
    });
    return track.object;
  } catch (error) {
    console.error("Error fetching track:", error);
    return null;
  }
}

export async function getPlaylists(limit = 20, skip = 0) {
  try {
    const playlists = await cosmic.objects
      .query({
        type: "playlists",
        limit,
        skip,
        sort: "-created_at",
      })
      .props("id,slug,title,metadata");
    return playlists.objects || [];
  } catch (error) {
    console.error("Error fetching playlists:", error);
    return [];
  }
}

export async function createTrack(trackData: {
  title: string;
  metadata: Record<string, any>;
}) {
  try {
    const cosmicWrite = createClient({
      bucketSlug: process.env.COSMIC_BUCKET_SLUG!,
      writeKey: process.env.COSMIC_WRITE_KEY!,
    });

    const track = await cosmicWrite.objects.create({
      type: "tracks",
      title: trackData.title,
      metadata: trackData.metadata,
    });
    return track.object;
  } catch (error) {
    console.error("Error creating track:", error);
    return null;
  }
}
