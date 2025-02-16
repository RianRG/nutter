import readline from 'readline';
import ffmpegPath from '@ffmpeg-installer/ffmpeg'; 
import ffmpeg from 'fluent-ffmpeg';
import ytdl from 'ytdl-core'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

ffmpeg.setFfmpegPath(ffmpegPath.path)
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const calculateDuration = (startTime: string, endTime: string): number =>{
  const [startHour, startMinute, startSecond] = startTime.split(':').map(Number)
  const [endHour, endMinute, endSecond] = endTime.split(':').map(Number)

  const duration = (endHour*3600 + endMinute*60 + endSecond) - (startHour*3600 + startMinute*60 + startSecond)
  return duration
}

const processVideo = async (url: string, time1: string, time2: string) =>{
  const duration: number = calculateDuration(time1, time2)
  const videoPath = path.join(__dirname, 'assets', 'videos')
  const publicPath = path.join(__dirname, 'public')

  fs.mkdirSync(videoPath, { recursive: true })
  fs.mkdirSync(publicPath, { recursive: true })

  await new Promise<void>((resolve, reject) =>{
    console.log('Starting to download video...')
    ytdl(url, {
      filter: 'videoonly',
      quality: '137'
    }).pipe(fs.createWriteStream(path.join(videoPath, 'v1.mp4')))
    .on('finish', () =>{
      console.log('Video downloaded succesfully!')
      resolve()
    })
    .on('error', err =>{
      console.log(err)
      reject(err)
    })
  })
  await new Promise<void>((resolve, reject) =>{
    console.log('Downloading audio...')
    ytdl(url, {
      filter: 'audioonly',
      quality: 'highestaudio'
    }).pipe(fs.createWriteStream(path.join(videoPath, 'v1.m4a')))
    .on('finish', () =>{
      console.log('Audio downloaded succesfully!')
      resolve()
    })
    .on('error', err =>{
      console.log(err)
      reject(err)
    })
  })

  await new Promise<void>((resolve, reject) =>{
    console.log('Starting to merge videos...')
    ffmpeg()
    .input(path.join(videoPath, 'v1.mp4'))
    .input(path.join(videoPath, 'v1.m4a'))
    .outputOptions([
      '-c:v copy',
      '-c:a aac',  // Converter áudio para AAC em vez de copiar
      '-strict experimental',
      '-y'
    ])
    .save(path.join(publicPath, 'fullvideo.mp4'))
    .on('progress', () =>{
      console.log('Merging in progress...')
    })
    .on('end', () =>{
      console.log('Video merged succesfully!')
      resolve()
    })
    .on('error', (err) =>{
      console.log(err);
      reject(err)
    })
  })

  await new Promise<void>((resolve, reject) =>{
    console.log('Starting to cut video...');

    ffmpeg(path.join(publicPath, 'fullvideo.mp4'))
    .setStartTime(time1)
    .setDuration(duration)
    .output(path.join(publicPath, 'result.mp4'))
    .on('error', (err) =>{
      console.log(err)
      reject(err)
    })
    .on('end', () =>{
      console.log('Video cut succesfully!')
      resolve()
    })
    .run()
  })
}


rl.question('Enter the video URL: \n', async (url) =>{
  rl.question('Enter the start time: (00:00:00)\n', async (time1) =>{
    rl.question('Enter the end time: (00:00:00)\n', async (time2) =>{
      try{
        await processVideo(url.toString(), time1.toString(), time2.toString());
      } catch(err){
        console.log(err)
      } finally{
        rl.close()
      }
    })
  })
})
