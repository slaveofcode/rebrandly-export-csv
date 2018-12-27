require('dotenv').config()

const fs = require('fs')
const csvWriteStream = require('csv-write-stream');
const axios = require('axios')

const DATA_PER_PAGE = 100
const API_BASE = 'https://api.rebrandly.com'

const getCount = async apikey => {
  const { data } = await axios.get(`${API_BASE}/v1/links/count`, {
    params: {
      status: 'active'
    },
    headers: {
      apikey,
    }
  })

  const { count, } = data
  return count
}

const getData = async (apikey, limit, lastId = null) => {
  const params = {
    orderBy: 'createdAt',
    orderDir: 'desc',
    limit,
    status: 'active'
  }

  if (lastId) Object.assign(params, { last: lastId, })
  const { data } = await axios.get(`${API_BASE}/v1/links`, {
    params,
    headers: {
      apikey,
    }
  })

  

  return data
}

const getFileName = () => {
  const d = new Date()
  return `./results/${d.getFullYear()}${d.getMonth() + 1}${d.getDate()}${d.getMinutes()}.csv`
}

const main = async () => {
  const csvWriter = csvWriteStream({
    separator: ',',
    newline: '\n'
  })

  const filename = getFileName()
  console.log('Starting export to: ' + filename)

  csvWriter
    .pipe(fs.createWriteStream(filename))

  const totalCount = await getCount(process.env.apiKey)

  console.log(`Fetching ${totalCount} data`)
  const totalRequest = Math.ceil(totalCount / DATA_PER_PAGE)
  
  let iter = 0
  let lastId = null
  while (iter < totalRequest) {
    try {
      console.log(`Requesting page ${(iter + 1)} ...`)
      const res = await getData(process.env.apiKey, DATA_PER_PAGE, lastId)
      
      console.log('=> total count: '+ res.length)
      for (const link of res) {
        csvWriter.write(link)
      }

      lastId = res[res.length - 1].id
    } catch (err) {
      console.log(err)
    }
    
    iter++
  }

  console.log('Export finished.')
}

main()