import { promises, unlink } from 'fs-extra'
import SpotifyApi, { IAuth, UserObjectPublic } from './lib/API'
import Artist from './lib/details/Atrist'
import Playlist from './lib/details/Playlist'
import SongDetails from './lib/details/Track'
import { downloadYT } from './lib/download'
import SpotifyDlError from './lib/Error'
import getYtlink from './lib/getYtlink'
import metadata from './lib/metadata'
import { Readable } from 'stream'

export default class SpotifyFetcher extends SpotifyApi {
    constructor(auth: IAuth) {
        super(auth)
    }

    /**
     * Get the track details of the given track URL
     * @param url
     * @returns {SongDetails} Track
     */
    getTrack = async (url: string): Promise<SongDetails> => {
        await this.verifyCredentials()
        return await this.extractTrack(this.getID(url))
    }

    /**
     * Gets the info the given album URL
     * @param url
     * @returns {Playlist} Album
     */
    getAlbum = async (url: string): Promise<Playlist> => {
        await this.verifyCredentials()
        return await this.extractAlbum(this.getID(url))
    }

    /**
     * Gets the info of the given Artist URL
     * @param url
     * @returns {Artist} Artist
     */
    getArtist = async (url: string): Promise<Artist> => {
        await this.verifyCredentials()
        return await this.extractArtist(this.getID(url))
    }

    /**
     * Gets the list of albums from the given Artists URL
     * @param url
     * @returns {Playlist[]} Albums
     */
    getArtistAlbums = async (
        url: string
    ): Promise<{
        albums: Playlist[]
        artist: Artist
    }> => {
        await this.verifyCredentials()
        const artistResult = await this.getArtist(url)
        const albumsResult = await this.extractArtistAlbums(artistResult.id)
        const albumIds = albumsResult.map((album) => album.id)
        const albumInfos = []
        for (let x = 0; x < albumIds.length; x++) {
            albumInfos.push(await this.extractAlbum(albumIds[x]))
        }
        return {
            albums: albumInfos,
            artist: artistResult
        }
    }

    /**
     * Gets the playlist info from URL
     * @param url URL of the playlist
     * @returns
     */
    getPlaylist = async (url: string): Promise<Playlist> => {
        await this.verifyCredentials()
        return await this.extractPlaylist(this.getID(url))
    }

    getID = (url: string): string => {
        const splits = url.split('/')
        return splits[splits.length - 1]
    }

    /**
     * Downloads the given spotify track
     * @param url Url to download
     * @param filename file to save to
     * @returns `buffer` if no filename is provided and `string` if it is
     */
    downloadTrack = async <T extends undefined | string>(url: string, filename?: T): Promise<Readable> => {
        await this.verifyCredentials()
        const info = await this.getTrack(url)
        const link = await getYtlink(`${info.name} ${info.artists[0]}`)
        if (!link) throw new SpotifyDlError(`Couldn't get a download URL for the track: ${info.name}`)
        const data = await downloadYT(link)
        return data
    }

    /**
     * Gets the info of tracks from playlist URL
     * @param url URL of the playlist
     */
    getTracksFromPlaylist = async (
        url: string
    ): Promise<{ name: string; total_tracks: number; tracks: SongDetails[] }> => {
        await this.verifyCredentials()
        const playlist = await this.getPlaylist(url)
        const tracks = await Promise.all(playlist.tracks.map((track) => this.getTrack(track)))
        return {
            name: playlist.name,
            total_tracks: playlist.total_tracks,
            tracks
        }
    }

    /**
     * Gets the info of tracks from Album URL
     * @param url URL of the playlist
     */
    getTracksFromAlbum = async (
        url: string
    ): Promise<{ name: string; total_tracks: number; tracks: SongDetails[] }> => {
        await this.verifyCredentials()
        const playlist = await this.getAlbum(url)
        const tracks = await Promise.all(playlist.tracks.map((track) => this.getTrack(track)))
        return {
            name: playlist.name,
            total_tracks: playlist.total_tracks,
            tracks
        }
    }

    getSpotifyUser = async (id: string): Promise<UserObjectPublic> => await this.getUser(id)
}
