import readline from 'readline';
import ffmpegPath from '@ffmpeg-installer/ffmpeg'; 
import ffmpeg from 'fluent-ffmpeg';
import ytdl from '@distube/ytdl-core'
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

  if(!fs.existsSync(videoPath)) fs.mkdirSync(videoPath, { recursive: true })
  if(!fs.existsSync(publicPath)) fs.mkdirSync(publicPath, { recursive: true })

  await new Promise<void>((resolve, reject) =>{
    console.log(' Starting to download video...')
    ytdl(url, {
      filter: 'videoonly',
      quality: '137'
    }).pipe(fs.createWriteStream(path.join(videoPath, 'v1.mp4')))
    .on('finish', () =>{
      console.log(' Video downloaded succesfully!')
      resolve()
    })
    .on('error', (err: Error) =>{
      console.log(err)
      reject(err)
    })
  })
  await new Promise<void>((resolve, reject) =>{
    console.log(' Downloading audio...')
    ytdl(url, {
      filter: 'audioonly',
      quality: 'highestaudio'
    }).pipe(fs.createWriteStream(path.join(videoPath, 'v1.m4a')))
    .on('finish', () =>{
      console.log(' Audio downloaded succesfully!')
      resolve()
    })
    .on('error', (err: Error) =>{
      console.log(err)
      reject(err)
    })
  })

  await new Promise<void>((resolve, reject) =>{
    console.log(' Starting to merge videos...')
    let count=0;
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
      for(let k=-1; k<count; ++k){
        process.stdout.write('| ')
      }
      setTimeout(() =>{
        count++;
        process.stdout.write('\r\x1b[K')
      }, 2000)
    })
    .on('end', () =>{
      console.log('\nVideo merged succesfully!')
      resolve()
    })
    .on('error', (err) =>{
      console.log(err);
      reject(err)
    })
  })

  await new Promise<void>((resolve, reject) =>{
    console.log('Starting to cut video...');
    let count=0;
    ffmpeg(path.join(publicPath, 'fullvideo.mp4'))
    .setStartTime(time1)
    .setDuration(duration)
    .output(path.join(publicPath, 'result.mp4'))
    .on('start', () =>{
      process.stdout.write('\n Cutting in progress \n')
    })
    .on('progress', () =>{
      for(let k=-1; k<count; ++k){
        process.stdout.write('| ')
      }
      setTimeout(() =>{
        count++;
        process.stdout.write('\r\x1b[K')
      }, 2000)
    })
    .on('error', (err) =>{
      console.log(err)
      reject(err)
    })
    .on('end', () =>{
      console.log('\nVideo cut succesfully!')
      resolve()
    })
    .run()
  })

  fs.rmSync(videoPath, { recursive: true, force: true })
  fs.rmdirSync(path.join(videoPath, '..', '..','assets'))
  fs.unlinkSync(path.join(publicPath, 'fullvideo.mp4'))
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
