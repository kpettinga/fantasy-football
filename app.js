import express from 'express'
import { fetchMatchupResults } from './matchup.js'

const app = express()

app.get('/matchup-results/:leagueId', (req, res) => {

    if ( ! req.params.leagueId ) {
        res.status = 400
        res.send('A league ID is required')
    }

    fetchMatchupResults(req.params.leagueId).then( results => {
        res.json(results)
    } )

})

app.listen( process.env.PORT || 3000, () => console.log('Server is running...') )