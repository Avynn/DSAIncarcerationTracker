const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

//Delete token.json if modifying scopes
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

//File pointed to here stores various tokens for use in the api
const TOKEN_PATH = 'token.json';

/**
 * NOTE: You will need to authorize an API with your credentials at the developer console
 * and place that credentials.json in the root folder of the package
 * @see https://console.developers.google.com
 */
fs.readFile('credentials.json', (err, content) => {
    if(err) {
        return console.log('Error loading client secret file: ', err);
    }
    
    //Authorize a client iwth credentials, then call the Google Sheets API
    authorize(JSON.parse(content), listMajors);
});


/**
 * Create an OAuth2 client with the given credentials, and then execute the given callback function.
 * @param {object} credentials , The authorization client credentials
 * @param {function} callback , the callback function with the authorized client
 */
function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]
    );

    //check if we have previously stored a token
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) {
            return getNewToken(oAuth2Client, callback);
        }

        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

/**
 * Get and store new token after prompting for user authorization, and then execute the given callback
 * with the authorized oAuth2 client.
 * @param {google.auth.Oauth2} oAuth2Client The oAuth2 client to get the token for.
 * @param {getEventsCallback} callback the callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback){
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });

    console.log('Authorize this app by visiting this url: ', authUrl);

    const r1 = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    r1.question('Enter the code from that page here: ', (code) => {
        r1.close();

        oAuth2Client.getToken(code, (err, token) => {
            if (err) {
                console.error('Error while trying to retrieve access to token', err);
            }

            oAuth2Client.setCredentials(token);

            //store the token to disk for later executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if(err){
                    return console.error(err);
                }

                console.log('Token stored to', TOKEN_PATH);
            });
        });

        callback(oAuth2Client);
    });
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google Oauth cleint.
 */

 function listMajors(auth) {
    const sheets = google.sheets({version: 'v4', auth});

    sheets.spreadsheets.values.get({
        spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
        range: 'Class Data!A2:E'
    }, (err, res) => {
        if (err) {
            return console.log('The API has returned an error: ' + err);
        }

        const rows = res.data.values;

        if (rows.length) {
            console.log('Name, Major:');

            // Print columns A and E, which correspond to indicies 0 and 4

            rows.map((row) => {
                console.log(`${row[0]}, ${row[4]}`);
            });
        } else {
            console.log('No data found. ');
        }
    });
 }