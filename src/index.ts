import readline from 'readline';
import ytdl from 'ytdl-core'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


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
  const audioPath = path.join(__dirname, 'assets', 'videos')

  await new Promise<void>((resolve, reject) =>{
    ytdl(url, {
      filter: 'videoonly',
      quality: '137'
    }).pipe(fs.createWriteStream(path.join(videoPath, 'v1.mp4')))
    .on('finish', () =>{
      console.log('Vídeo baixado com sucesso!')
    })
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
