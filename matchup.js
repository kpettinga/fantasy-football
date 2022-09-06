import axios from 'axios'
import { google } from 'googleapis';
// import { authorize } from './auth.js';

export const fetchMatchupResults = async (leagueId) => {

    if ( ! leagueId ) {
        throw new Error('Invalid `leagueId` (<' + typeof leagueId + '> : ' + leagueId + ')')
    }
    
    const options = {
        method: 'GET',
        url: `https://fantasy.espn.com/apis/v3/games/ffl/seasons/2022/segments/0/leagues/${leagueId}`,
        params: {
            view: 'mBoxscore'
        },
    }
    
    return axios.request(options)
        .then( res => handleData(res.data) )
        .catch( error => console.error(error) )
    
    // Handle Data
    function handleData(data) {
        const { schedule, scoringPeriodId } = data
        
        // create an object which will record each team's projected and actual score
        // this will later be used to write data to the spreadsheet
        const results = []
        let matchupPeriod = 0
    
        // loop through each player in the roster and get their projected score
        schedule.forEach( matchup => {

            // set matchupPeriod to 0-based number
            matchupPeriod = matchup.matchupPeriodId - 1

            if ( ! results[matchupPeriod] ) {
                // create new array for the period
                results[matchupPeriod] = []
                // sort the previous period
                if ( results[matchupPeriod - 1] ) {
                    results[matchupPeriod - 1].sort( (a,b) => {
                        if ( a.teamId > b.teamId ) {
                            return 1
                        } else if ( a.teamId < b.teamId ) {
                            return -1
                        } else {
                            return 0
                        }
                    } )
                }
            }
            if ( ! matchup.away.rosterForCurrentScoringPeriod || ! matchup.home.rosterForCurrentScoringPeriod ) {
                return
            }
            
            // get actual points scored in the matchup
            let awayTotalPoints = matchup.away.totalPoints
            let homeTotalPoints = matchup.home.totalPoints
    
            // add up the project points for each player
            let awayProjectedPoints = 0
            let homeProjectedPoints = 0
            let favored
            matchup.away.rosterForCurrentScoringPeriod.entries.forEach( rosterEntry => {
                const { lineupSlotId, playerPoolEntry: { player } } = rosterEntry
                // only add up players with slot IDs 0 to 8. The rest are on the bench.
                if ( isStarter(lineupSlotId) ) {
                    awayProjectedPoints += player.stats[0].appliedTotal
                }
            } )
            matchup.home.rosterForCurrentScoringPeriod.entries.forEach( rosterEntry => {
                const { lineupSlotId, playerPoolEntry: { player } } = rosterEntry
                // only add up players with slot IDs 0 to 8. The rest are on the bench.
                if ( isStarter(lineupSlotId) ) {
                    homeProjectedPoints += player.stats[0].appliedTotal
                }
            } )
    
            favored = awayProjectedPoints > homeProjectedPoints ? 'away' : 'home'
    
            // push the scores to the results object using the teamId as the key
            results[matchupPeriod].push({ 
                teamId: matchup.away.teamId,
                projected: awayProjectedPoints, 
                total: awayTotalPoints, 
                record: getRecord(awayTotalPoints, homeTotalPoints),
                upset: awayTotalPoints > homeTotalPoints && favored === 'home',
                highScore: false,
            })
            results[matchupPeriod].push({ 
                teamId: matchup.home.teamId,
                projected: homeProjectedPoints, 
                total: homeTotalPoints, 
                record: getRecord(homeTotalPoints, awayTotalPoints),
                upset: homeTotalPoints > awayTotalPoints && favored === 'away',
                highScore: false,
            })
        })
        
        // determine high score
        let highScorerIndex = 0;
        const highScorer = results.reduce( (prev, curr, i, __results) => {
            if ( curr.total > prev.total ) {
                highScorerIndex = i
                return curr
            }
            return prev
        } )
        
        results[highScorerIndex].highScore = true
    
        return results
    }
    
    function isStarter(lineupSlotId) {
        const slotIds = {
            QB: 0,
            RB: 2,
            WR: 4,
            TE: 6,
            DEF: 16,
            KICKER: 17,
            BENCH: 20,
            FLEX: 23,
        }
        return lineupSlotId !== slotIds.BENCH
    }
    
    function getRecord(homeScore, awayScore){ 
        if ( homeScore === 0 && awayScore === 0 ) {
            return null
        }
        if ( homeScore > awayScore ) {
            return 'W' 
        } else if ( awayScore > homeScore ) {
            return 'L'
        } else {
            return 'T'
        }
    }

}

// fetchMatchupResults(2134550616).then( results => console.log(results) )

// authorize()
//     .then(listMajors)
//     .catch(console.error);

// /**
//  * Prints the names and majors of students in a sample spreadsheet:
//  * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
//  * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
//  */
//  async function listMajors(auth) {
//     const sheets = google.sheets({ version: 'v4', auth });
//     const res = await sheets.spreadsheets.values.get({
//         spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
//         range: 'Class Data!A2:E',
//     });
//     const rows = res.data.values;
//     if (!rows || rows.length === 0) {
//         console.log('No data found.');
//         return;
//     }
//     console.log('Name, Major:');
//     rows.forEach((row) => {
//         // Print columns A and E, which correspond to indices 0 and 4.
//         console.log(`${row[0]}, ${row[4]}`);
//     });
// }