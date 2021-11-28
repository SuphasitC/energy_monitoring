const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const xml2js = require('xml2js');
var cors = require('cors')
const axios = require('axios');
const WebSocket = require('ws');
const webSocketPort = 4001;
const ws = new WebSocket.Server({ port: webSocketPort });

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json())

const mongoUrl = 'mongodb://127.0.0.1:27017';
const port = 8000;

const powerPort = 8080;
const powerUrl = 'http://127.0.0.1:' + powerPort;

/* ⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ URL about information from Power Studio Constant ⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ */

const GET_DEVICES_PATH = `${powerUrl}/services/chargePointsInterface/devices.xml?api_key=special-key`;

/* ⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ Database Methods ⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ */

/** *
* @param {String} databaseName
* @param {String} collectionName
* @returns {}
*/
var queryDatabase = async (databaseName, collectionName, queryObj = {}) => {
    return await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true },
        function(err, db) {
            if (err) throw err;
            var dbo = db.db(databaseName);
            dbo.collection(collectionName).find(queryObj).toArray((err, value) => {
                if (err) throw err;
                return value;
            });
        }
    );
}

var insertObjToDatabase = (obj) => {
    MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true },
        function(err, db) {
            if (err) throw err;
            var dbo = db.db("energy-monitoring-api");
            dbo.collection(`${obj.id}`).insertOne(obj, function(err, res) {
                if (err) throw err;
            });
        }
    );
}

/* ⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ Backend flow methods ⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ */

var insertMockedUpData = async () => {
    try {
        var responseList = [];
        for(var i = 0; i < systemDevices.length; i++) {
            var response = await axios.post(`http://127.0.0.1:${port}/devices/${systemDevices[i]}`);
            responseList.push(response.data);
        }
        console.log(responseList);
        responseList = [];
    } catch (error) {
        console.error(error);
    }
}

setInterval(() => {
    insertMockedUpData();
}, 60000);

app.post('/devices/:deviceId', cors(), (req, res) => {
    var deviceId = req.params.deviceId;

    var dataFromPowerStudio =`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                                    <values>
                                        <variable>
                                            <id>${deviceId}.AE</id>
                                            <value>0.000000</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.AI1</id>
                                            <value>0.000000</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.AI2</id>
                                            <value>0.000000</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.AI3</id>
                                            <value>0.000000</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.APIS</id>
                                            <value>0.000000</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.APPIS</id>
                                            <value>0.000000</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.DESCRIPTION</id>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.FRE</id>
                                            <value>0.000000</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.NAME</id>
                                            <textValue>${deviceId}</textValue>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.PFIS</id>
                                            <value>0.000000</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.RPIS</id>
                                            <value>0.000000</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.STATUS</id>
                                            <value>18.000000</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.VDTTM</id>
                                            <value>01011999003545</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.VI1</id>
                                            <value>0.000000</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.VI12</id>
                                            <value>0.000000</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.VI2</id>
                                            <value>0.000000</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.VI23</id>
                                            <value>0.000000</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.VI3</id>
                                            <value>0.000000</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.VI31</id>
                                            <value>0.000000</value>
                                        </variable>
                                    </values>`

    xml2js.parseString(dataFromPowerStudio, (err, result) => {
        if(err) {
            throw err;
        }
        const jsonString = JSON.stringify(result, null, 4);
        var json = JSON.parse(jsonString);
        const date = new Date().toISOString()
        const created_on = new Date(date);

        json = { id: deviceId, ...json, created_on };
        if (systemDevices.includes(deviceId)) {
            insertObjToDatabase(json);
            res.send(json);
        } else {
            res.status(400).send(`Not has this devices in the system.`);
        }
    });
});

/* ⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ API Endpoint ⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ */

app.get('/', (req, res) => {
    res.send('Energy Monitoring - API')
});

app.get('/power/apis_avg_per_hr/', async (req, res) => {
    var acceptableDateType = ['today', 'yesterday'];
    var date = req.query.date;
    if(acceptableDateType.includes(date)) {
        MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true },
            function(err, db) {
                if (err) throw err;
                var dbo = db.db('power-api');
                dbo.collection('MDB1').find({}).toArray((err, value) => {
                    if (err) throw err;
                    res.send(value);
                });
            }
        );
    } else {
        res.status(400).send(`Non-acceptable date type.`);
    }
    
});

/* ⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ API Server set up ⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ */

var systemDevices = [];
var isRealDevice = false;

var setIsRealDevices = (isReal) => {
    isRealDevice = isReal;
}

var getSystemDevices = async () => {
    try {
        var response = !isRealDevice ? `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                            <devices>
                                <id>MDB1-2</id>
                                <id>MDB1</id>
                                <id>MDB2</id>
                                <id>Solar3</id>
                                <id>Sol3</id>
                            </devices>`:
                        await axios.get(GET_DEVICES_PATH);
        xml2js.parseString(!isRealDevice ? response: response.data, (err, result) => {
            if(err) {
                throw err;
            }
            const jsonString = JSON.stringify(result, null, 4);
            var json = JSON.parse(jsonString);
            if(systemDevices !== []) {
                json.devices.id.forEach((device) => {
                    systemDevices.push(device);
                    console.log(`${device} is added to systemDevices list.`);
                });
            }
        });
    } catch (error) {
        console.error(error);
    }
}

app.listen(port, () => {
    setIsRealDevices(false);
    getSystemDevices();
    console.log(`Energy Monitoring API is listening on port ${port}.`);
});