const crypto = require('crypto')
const loadIniFile = require('read-ini-file')

// https://www.metered.ca/blog/coturn/

class TurnUtils {

    static CreateCredentials(server, name, secret){    

        let unixTimeStamp = parseInt(Date.now()/1000) + 24*3600   // this credential would be valid for the next 24 hours
        let username = [unixTimeStamp, name].join(':')
        
        let hmac = crypto.createHmac('sha1', secret)
        hmac.setEncoding('base64');
        hmac.write(username);
        hmac.end();
        let password = hmac.read();

        return {
            urls: server,
            username: username,
            credential: password
        };
    }

    static LoadTurnserverConf(conf_file) {
        try {
            return loadIniFile.sync(conf_file)
        }
        catch(ex) {
            console.log(ex)
        }

        return {}

    }
}

module.exports = TurnUtils
 