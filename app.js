import process from 'process'
import express from 'express'
import { fetchMatchupResults } from './matchup.js'

const app = express()

app.get('/', (req, res) => {
    res.send('hello world')
})

app.get('/matchup-results', (req, res) => {

    const leagueId = 2134550616
    // const leagueId = 763987037

    fetchMatchupResults(leagueId).then( results => {
        res.json(results)
    } )

})

app.listen( process.env.port || 3000, () => console.log('Server is running...') )