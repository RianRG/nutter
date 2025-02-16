import readline from 'readline';
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const calculateDuration = (startTime: string, endTime: string) =>{
  const [startHour, startMinute, startSecond] = startTime.split(':').map(Number)
  const [endHour, endMinute, endSecond] = endTime.split(':').map(Number)

  const duration = (endHour*3600 + endMinute*60 + endSecond) - (startHour*3600 + startMinute*60 + startSecond)
  console.log(duration);
}

const processVideo = async (url: string, time1: string, time2: string) =>{
  calculateDuration(time1, time2)
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
