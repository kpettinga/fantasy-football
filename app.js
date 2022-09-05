import express from 'express'
import { fetchMatchupResults } from './matchup.js'

const app = express()
const port = 3000

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

app.listen( port, () => console.log('listening on port ' + port) )