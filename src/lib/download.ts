import os from 'os'
import ytdl from '@distube/ytdl-core'
import SpotifyDlError from './Error'
import { readFile, unlink, writeFile } from 'fs-extra'
import axios from 'axios'
import Ffmpeg from 'fluent-ffmpeg'
import { Readable } from 'stream'

/**
 * Function to download the give `YTURL`
 * @param {string} url The youtube URL to download
 * @returns `Buffer`
 * @throws Error if the URL is invalid
 */
export const downloadYT = async (url: string): Promise<Readable> => {
    if (!ytdl.validateURL(url)) throw new SpotifyDlError('Invalid YT URL', 'SpotifyDlError')
    return ytdl(url, {
        quality: 'highestaudio',
        filter: 'audioonly'
    })
}

/**
 * Function to get buffer of files with their URLs
 * @param url URL to get Buffer of
 * @returns Buffer
 */
export const getBufferFromUrl = async (url: string): Promise<Buffer> =>
    (await axios.get(url, { responseType: 'arraybuffer' })).data
