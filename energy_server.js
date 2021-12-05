const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const xml2js = require('xml2js');
var cors = require('cors')
const axios = require('axios');
const WebSocket = require('ws');
const webSocketPort = 4001;
const ws = new WebSocket.Server({ port: webSocketPort });

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json())

const mongoUrl = 'mongodb://127.0.0.1:27017';
// const mongoUrl = 'mongodb://cocoad:CocoaD12345@43.229.134.139:27018/energy-monitoring?authSource=admin';
const port = 8000;

const powerPort = 8080;
const powerUrl = 'http://127.0.0.1:' + powerPort;

/* ⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ URL about information from Power Studio Constant ⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ */

const GET_DEVICES_PATH = `${powerUrl}/services/chargePointsInterface/devices.xml?api_key=special-key`;
const GET_ALARM_POINT = `${powerUrl}/services/chargePointsInterface/variableValue.xml?id=CoPro2&api_key=special-key`;
var getVariableValue = (deviceId) => `${powerUrl}/services/chargePointsInterface/variableValue.xml?id=${deviceId}&api_key=special-key`

const DEVICE_ONLINE = 1;
const DEVICE_OFFLINE = 34;

/* ⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ Database Methods ⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ */

var insertObjToDatabase = (obj) => {
    // Insert for split solar and meter
    if (obj.deviceName !== null) {
        MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true },
            function (err, db) {
                if (err) throw err;
                var dbo = db.db(databaseName);
                var collectionName = getCollectionName(obj.deviceName);
                dbo.collection(collectionName).insertOne(obj, function (err, res) {
                    if (err) throw err;
                });
            }
        );
    // Insert for all
        MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true },
            function (err, db) {
                if (err) throw err;
                var dbo = db.db(databaseName);
                dbo.collection('all').insertOne(obj, function (err, res) {
                    if (err) throw err;
                });
            }
        );
    }
}

var getCollectionName = (deviceName) => {
    if (deviceName === null) return '';
    if (deviceName.startsWith("MDB") || deviceName.startsWith("B")) {
        return 'meter';
    } else if (deviceName.startsWith("Solar")) {
        return 'solar';
    } else {
        return 'other-devices';
    }
}

/* ⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ Backend flow methods ⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ */

var insertData = async () => {
    try {
        var responseList = [];
        for (var i = 0; i < systemDevices.length; i++) {
            var response = await axios.post(`http://127.0.0.1:${port}/devices/${systemDevices[i]}`);
            // console.log(response.data);
            responseList.push(response.data);
        }
        console.log(responseList);
        responseList = [];
    } catch (error) {
        console.error(error);
    }
}

var cleansingData = (json, device) => {
    // console.log(JSON.stringify(json));
    var deviceName = json.values.variable.find((element) => element.id[0] == `${device}.NAME`) !== undefined ?
        json.values.variable.find((element) => element.id[0] == `${device}.NAME`).textValue[0] : null;
    var ae = json.values.variable.find((element) => element.id[0] == `${device}.AE`) !== undefined ?
        parseFloat(json.values.variable.find((element) => element.id[0] == `${device}.AE`).value[0]) : null;
    var ai1 = json.values.variable.find((element) => element.id[0] == `${device}.AI1`) !== undefined ?
        parseFloat(json.values.variable.find((element) => element.id[0] == `${device}.AI1`).value[0]) : null;
    var ai2 = json.values.variable.find((element) => element.id[0] == `${device}.AI2`) !== undefined ?
        parseFloat(json.values.variable.find((element) => element.id[0] == `${device}.AI2`).value[0]) : null;
    var ai3 = json.values.variable.find((element) => element.id[0] == `${device}.AI3`) !== undefined ?
        parseFloat(json.values.variable.find((element) => element.id[0] == `${device}.AI3`).value[0]) : null;
    var ain = json.values.variable.find((element) => element.id[0] == `${device}.AIN`) !== undefined ?
        parseFloat(json.values.variable.find((element) => element.id[0] == `${device}.AIN`).value[0]) : null;
    var apis = json.values.variable.find((element) => element.id[0] == `${device}.APIS`) !== undefined ?
        parseFloat(json.values.variable.find((element) => element.id[0] == `${device}.APIS`).value[0]) : null;
    var appis = json.values.variable.find((element) => element.id[0] == `${device}.APPIS`) !== undefined ?
        parseFloat(json.values.variable.find((element) => element.id[0] == `${device}.APPIS`).value[0]) : null;
    var fre = json.values.variable.find((element) => element.id[0] == `${device}.FRE`) !== undefined ?
        parseFloat(json.values.variable.find((element) => element.id[0] == `${device}.FRE`).value[0]) : null;
    var pfis = json.values.variable.find((element) => element.id[0] == `${device}.PFIS`) !== undefined ?
        parseFloat(json.values.variable.find((element) => element.id[0] == `${device}.PFIS`).value[0]) : null;
    var rpis = json.values.variable.find((element) => element.id[0] == `${device}.RPIS`) !== undefined ?
        parseFloat(json.values.variable.find((element) => element.id[0] == `${device}.RPIS`).value[0]) : null;
    var status = json.values.variable.find((element) => element.id[0] == `${device}.STATUS`) !== undefined ?
        parseFloat(json.values.variable.find((element) => element.id[0] == `${device}.STATUS`).value[0]) : null;
    var thdi1 = json.values.variable.find((element) => element.id[0] == `${device}.THDI1`) !== undefined ?
        parseFloat(json.values.variable.find((element) => element.id[0] == `${device}.THDI1`).value[0]) : null;
    var thdi2 = json.values.variable.find((element) => element.id[0] == `${device}.THDI2`) !== undefined ?
        parseFloat(json.values.variable.find((element) => element.id[0] == `${device}.THDI2`).value[0]) : null;
    var thdi3 = json.values.variable.find((element) => element.id[0] == `${device}.THDI3`) !== undefined ?
        parseFloat(json.values.variable.find((element) => element.id[0] == `${device}.THDI3`).value[0]) : null;
    var thdv1 = json.values.variable.find((element) => element.id[0] == `${device}.THDV1`).value[0];
    parseFloat(json.values.variable.find((element) => element.id[0] == `${device}.THDV1`).value[0])
    var thdv2 = json.values.variable.find((element) => element.id[0] == `${device}.THDV2`) !== undefined ?
        parseFloat(json.values.variable.find((element) => element.id[0] == `${device}.THDV2`).value[0]) : null;
    var thdv3 = json.values.variable.find((element) => element.id[0] == `${device}.THDV3`) !== undefined ?
        parseFloat(json.values.variable.find((element) => element.id[0] == `${device}.THDV3`).value[0]) : null;
    var vi1 = json.values.variable.find((element) => element.id[0] == `${device}.VI1`) !== undefined ?
        parseFloat(json.values.variable.find((element) => element.id[0] == `${device}.VI1`).value[0]) : null;
    var vi12 = json.values.variable.find((element) => element.id[0] == `${device}.VI12`) !== undefined ?
        parseFloat(json.values.variable.find((element) => element.id[0] == `${device}.VI12`).value[0]) : null;
    var vi2 = json.values.variable.find((element) => element.id[0] == `${device}.VI2`) !== undefined ?
        parseFloat(json.values.variable.find((element) => element.id[0] == `${device}.VI2`).value[0]) : null;
    var vi23 = json.values.variable.find((element) => element.id[0] == `${device}.VI23`) !== undefined ?
        parseFloat(json.values.variable.find((element) => element.id[0] == `${device}.VI23`).value[0]) : null;
    var vi3 = json.values.variable.find((element) => element.id[0] == `${device}.VI3`) !== undefined ?
        parseFloat(json.values.variable.find((element) => element.id[0] == `${device}.VI3`).value[0]) : null;
    var vi31 = json.values.variable.find((element) => element.id[0] == `${device}.VI31`) !== undefined ?
        parseFloat(json.values.variable.find((element) => element.id[0] == `${device}.VI31`).value[0]) : null;

    var cleanData = {
        deviceName: deviceName, ae: ae, ai1: ai1, ai2: ai2,
        ai3: ai3, ain: ain, apis: apis, appis: appis, fre: fre, pfis: pfis,
        rpis: rpis, status: status, thdi1: thdi1, thdi2: thdi2, thdi3: thdi3,
        thdv1: thdv1, thdv2: thdv2, thdv3: thdv3, vi1: vi1, vi12: vi12,
        vi2: vi2, vi23: vi23, vi3: vi3, vi31: vi31
    };
    return cleanData;
}

setInterval(() => {
    insertData();
}, 60000);

app.post('/devices/:deviceId', cors(), async (req, res) => {
    var deviceId = req.params.deviceId;

    var dataFromPowerStudio = !isRealDevice ? `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                                    <values>
                                        <variable>
                                            <id>${deviceId}.AE</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.AI1</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.AI2</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.AI3</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.AIN</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.API1</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.API2</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.API3</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.APIS</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.APPI1</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.APPI2</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.APPI3</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.APPIS</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.DESCRIPTION</id>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.FRE</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.NAME</id>
                                            <textValue>${deviceId}</textValue>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.PFI1</id>
                                            <value>9998.000000</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.PFI2</id>
                                            <value>9998.000000</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.PFI2</id>
                                            <value>9998.000000</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.PFI3</id>
                                            <value>9998.000000</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.PFIS</id>
                                            <value>9998.000000</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.RPI1</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.RPI2</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.RPI3</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.RPIS</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.STATUS</id>
                                            <value>${(Math.floor(Math.random()) == 0) ? 1 : 34}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.THDI1</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.THDI2</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.THDI3</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.THDIN</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.THDV1</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.THDV12</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.THDV2</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.THDV23</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.THDV3</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.THDV31</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.VDTTM</id>
                                            <value>01011999003545</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.VI1</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.VI12</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.VI2</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.VI23</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.VI3</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                        <variable>
                                            <id>${deviceId}.VI31</id>
                                            <value>${Math.random() * 100 + 30}</value>
                                        </variable>
                                    </values>` : await axios.get(getVariableValue(deviceId))

    xml2js.parseString(!isRealDevice ? dataFromPowerStudio : dataFromPowerStudio.data, (err, result) => {
        if (err) {
            throw err;
        }
        const jsonString = JSON.stringify(result, null, 4);
        var json = JSON.parse(jsonString);
        // console.log(JSON.stringify(json))
        var cleansingJSON = cleansingData(json, deviceId)

        const date = new Date().toISOString()
        const createdAt = new Date(date);
        cleansingJSON = { ...cleansingJSON, createdAt };
        console.log(`🏀🏀🏀🏀🏀 cleansingJSON = ${cleansingJSON !== null ? JSON.stringify(cleansingJSON) : null} 🏀🏀🏀🏀🏀`);
        if (systemDevices.includes(deviceId)) {
            insertObjToDatabase(cleansingJSON);
            res.send(json);
        } else {
            res.status(400).send(`Not has this devices in the system.`);
        }
    });
});

var compareHr = (docA, docB) => {
    if (docA.hour < docB.hour) {
        return -1;
    }
    if (docA.hour > docB.hour) {
        return 1;
    }
    return 0;
}

/* ⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ API Endpoint ⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ */

app.get('/', (req, res) => {
    res.send('Energy Monitoring - API')
});

app.get('/power/apis_per_hr/', (req, res) => {
    var date = req.query.date;

    var aggGteDate;
    var aggLtDate;

    if (date === 'today') {
        aggGteDate = new Date(today)
        aggLtDate = new Date(tomorrow)
    } else if (date === 'yesterday') {
        aggGteDate = new Date(yesterday)
        aggLtDate = new Date(today)
    }

    var aggregate = [
        {
            "$match": {
                "createdAt": {
                    $gte: aggGteDate,
                    $lt: aggLtDate
                }
            }
        },
        {
            "$group": {
                _id: {
                    $dateTrunc: {
                        date: "$createdAt",
                        unit: "hour",
                        binSize: 1
                    }
                },
                "count": {
                    "$count": {}
                },
                "power": {
                    "$max": "$apis"
                },
            }
        },
        {
            "$addFields": {
                "hour": {
                    "$toInt": { "$substr": ["$_id", 11, 2] }
                }
            }
        },
        {
            "$project": {
                _id: 1,
                power: 1,
                hour: 1,
            }
        },
        {
            "$sort": {
                _id: 1
            }
        }
    ]

    MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true },
        function (err, db) {
            if (err) throw err;
            var dbo = db.db(databaseName);
            dbo.collection(allDevicesCollection).aggregate(aggregate).toArray().then((docs) => {
                if (docs.length === 24) {
                    res.send(docs)
                }
                else {
                    var completeDocs = docs;
                    var hourInDB = [];
                    docs.forEach((time) => {
                        hourInDB.push(time.hour);
                    });
                    for (var i = 0; i < 24; i++) {
                        if (!hourInDB.includes(i)) {
                            var tempDateObj = new Date(today);
                            tempDateObj.setHours(tempDateObj.getHours() + i);
                            var tempDate = tempDateObj.toISOString();
                            var doc = { _id: tempDate, power: 0, hour: i };
                            completeDocs.push(doc);
                        }
                    }
                    completeDocs.sort(compareHr);
                    res.send(completeDocs);
                }
            });
        }
    );
});

app.get('/energy/all/', (req, res) => {
    // var date = req.query.date;

    var aggregate = [
        {
            "$match": {
                "createdAt": {
                    $gte: new Date(today),
                    $lt: new Date(tomorrow)
                }
            }
        },

        {
            "$group": {
                _id: {
                    $dateTrunc: {
                        date: "$createdAt",
                        unit: "hour",
                        binSize: 1
                    }
                },
                "count": {
                    "$count": {}
                },
                "start": {
                    "$first": "$ae"
                },
                "end": {
                    "$last": "$ae"
                }
            }
        },
        {
            $addFields: {
                "energy": {
                    "$subtract": [
                        "$end",
                        "$start"
                    ]
                }
            }
        },
        {
            "$addFields": {
                "hour": {
                    "$toInt": { "$substr": ["$_id", 11, 2] }
                }
            }
        },
        {
            "$sort": {
                "_id": 1
            }
        },
        {
            "$project": {
                _id: 1,
                energy: 1,
                hour: 1
            }
        },
    ]

    MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true },
        function (err, db) {
            if (err) throw err;
            var dbo = db.db(databaseName);
            dbo.collection(allDevicesCollection).aggregate(aggregate).toArray().then((docs) => {
                if (docs.length === 24) {
                    res.send(docs)
                }
                else {
                    var completeDocs = docs;
                    var hourInDB = [];
                    docs.forEach((time) => {
                        hourInDB.push(time.hour);
                    });
                    for (var i = 0; i < 24; i++) {
                        if (!hourInDB.includes(i)) {
                            var tempDateObj = new Date(today);
                            tempDateObj.setHours(tempDateObj.getHours() + i);
                            var tempDate = tempDateObj.toISOString();
                            var doc = { _id: tempDate, energy: 0, hour: i };
                            completeDocs.push(doc);
                        }
                    }
                    completeDocs.sort(compareHr);
                    res.send(completeDocs);
                }
            });
        }
    );
});

// Don't use in this phase.
app.get('/controllers_amount/', (req, res) => {
    var previous7day = new Date()
    previous7day.setDate(previous7day.getDate() - 7);

    var sentData = [];
    var offlineDevicesList = []

    var aggregate =
        [
            {
                "$match": {
                    "createdAt": {
                        $gte: new Date(previous7day),
                        $lt: new Date(tomorrow),
                    }
                }
            },
            {
                "$match": {
                    "status": DEVICE_OFFLINE
                }
            },
            {
                "$group": {
                    "_id": {
                        $dateTrunc: {
                            date: "$createdAt",
                            unit: "day",
                            binSize: 1
                        }
                    },
                    "devicesName": {
                        "$push": "$deviceName"
                    }
                }
            },

        ]

    MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true },
        function (err, db) {
            if (err) throw err;
            var dbo = db.db(databaseName);
            dbo.collection(allDevicesCollection).aggregate(aggregate).toArray().then((docs) => {
                docs.forEach(async (day) => {
                    await day.devicesName.forEach((device) => {
                        if (!offlineDevicesList.includes(device)) {
                            offlineDevicesList.push(device);
                        }
                    })
                    sentData.push({ date: day._id, offlineDevices: offlineDevicesList.length, onlineDevices: systemDevices.length - offlineDevicesList.length });
                    offlineDevicesList = [];
                })
                console.log(sentData);
                res.send(sentData);
            });
        }
    );
});

app.get('/alarm', async (req, res) => {
    try {
        var alarmPoint = !isRealDevice ? `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                            <values>
                                <variable>
                                    <id>CoPro2.DESCRIPTION</id>
                                </variable>
                                <variable>
                                    <id>CoPro2.HUM</id>
                                    <value>42.750000</value>
                                </variable>
                                <variable>
                                    <id>CoPro2.NAME</id>
                                    <value>CoPro2</value>
                                </variable>
                                <variable>
                                    <id>CoPro2.STATUS</id>
                                    <value>1.000000</value>
                                </variable>
                                <variable>
                                    <id>CoPro2.Smoke</id>
                                    <value>0.000000</value>
                                </variable>
                                <variable>
                                    <id>CoPro2.Temp</id>
                                    <value>26.049999</value>
                                </variable>
                                <variable>
                                    <id>CoPro2.Temp1</id>
                                    <value>27.325001</value>
                                </variable>
                                <variable>
                                    <id>CoPro2.VDTTM</id>
                                    <value>05122021053650</value>
                                </variable>
                            </values>`:
            await axios.get(GET_ALARM_POINT);
        xml2js.parseString(!isRealDevice ? alarmPoint : alarmPoint.data, (err, result) => {
            if (err) {
                throw err;
            }
            const jsonString = JSON.stringify(result, null, 4);
            var json = JSON.parse(jsonString);

            var humidity = parseFloat(json.values.variable[1].value[0]);
            var temperature = parseFloat(json.values.variable[5].value[0]);
            var smokeStatus = parseFloat(json.values.variable[4].value[0]) == 0 ? 'Normal' : 'Alarm';
            var sentData = { humidity: humidity, temperature: temperature, smokeStatus: smokeStatus };
            res.send(sentData);
        });
    } catch (error) {
        console.error(error);
    }
});

/* ⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ API Server set up ⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ */

var systemDevices = [];
var isRealDevice = false;

var dateObj = new Date();
var today = dateObj.toISOString();
today = today.substring(0, 10);

var dateOfTomorrow = new Date();
dateOfTomorrow.setDate(dateOfTomorrow.getDate() + 1);
var tomorrow = dateOfTomorrow.toISOString();
tomorrow = tomorrow.substring(0, 10);

var dateOfYesterday = new Date();
dateOfYesterday.setDate(dateOfYesterday.getDate() - 1);
var yesterday = dateOfYesterday.toISOString();
yesterday = yesterday.substring(0, 10);

var databaseName = 'energy-monitoring';
var allDevicesCollection = 'all';

var setIsRealDevices = (isReal) => {
    isRealDevice = isReal;
}

var getSystemDevices = async () => {
    try {
        var response = !isRealDevice ? `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                            <devices>
                                <id>MDB1</id>
                                <id>MDB2</id>
                                <id>MDB4</id>
                                <id>MDB5</id>
                                <id>Solar1</id>
                                <id>Solar2</id>
                                <id>Solar3</id>
                            </devices>`:
            await axios.get(GET_DEVICES_PATH);
        xml2js.parseString(!isRealDevice ? response : response.data, (err, result) => {
            if (err) {
                throw err;
            }
            const jsonString = JSON.stringify(result, null, 4);
            var json = JSON.parse(jsonString);
            if (systemDevices !== []) {
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

/* ⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ Web Socket ⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ */

ws.on('connection', (ws) => {
    ws.onmessage = (event) => {
        console.log(event.data)
        console.log(typeof event.data)
        switch (event.data) {
            case 'event/alarm': alarmEvent(); break;
            case 'event/handled_alarm': handledAlarmEvents(); break;
            case 'cost/today': todayCost(); break;
            case 'saved_cost/today': todaySavedCostAsBaht(); break;
            case 'all_energy/today': allEnergyToday(); break;
            case 'devices-status=online': onlineDevices(); break;
            case 'devices-status=offline': offlineDevices(); break;
            case 'devices-status=non-init': nonInitializedDevices(); break;
        }
    }

    var alarmEvent = () => {
        var todayAlarmEvents = 64;
        ws.send(todayAlarmEvents);
    };

    var handledAlarmEvents = () => {
        var handledAlarmEvents = 87;
        ws.send(handledAlarmEvents);
    };

    var todayCost = () => {
        // var aggregate = [
        //     {
        //         "$match": {
        //             "createdAt": {
        //                 $gte: aggGteDate,
        //                 $lt: aggLtDate
        //             }
        //         }
        //     },
        //     {
        //         "$group": {
        //             _id: {
        //                 $dateTrunc: {
        //                     date: "$createdAt",
        //                     unit: "hour",
        //                     binSize: 1
        //                 }
        //             },
        //             "count": {
        //                 "$count": {}
        //             },
        //             "power": {
        //                 "$max": "$apis"
        //             }
        //         }
        //     },
        //     {
        //         "$project": {
        //             _id: 1,
        //             power: 1,
        //         }
        //     },
        //     {
        //         "$sort": {
        //             _id: 1
        //         }
        //     }
        // ]

        // MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true },
        //     function (err, db) {
        //         if (err) throw err;
        //         var dbo = db.db(databaseName);
        //         dbo.collection(allDevicesCollection).aggregate(aggregate).toArray().then((docs) => {
        //             res.send(docs)
        //         });
        //     }
        // );
        var todayCostAsBaht = 68700;
        ws.send(todayCostAsBaht);
    };

    var todaySavedCostAsBaht = () => {
        var todaySavedCostAsBaht = 42800; // minus if not save
        ws.send(todaySavedCostAsBaht);
    };

    var allEnergyToday = () => {
        var aggregate = [
            {
                "$match": {
                    "createdAt": {
                        $gte: new Date(today),
                        $lt: new Date(tomorrow),
                    }
                }
            },
            {
                "$group": {
                    _id: {
                        $dateTrunc: {
                            date: "$createdAt",
                            unit: "day",
                            binSize: 1
                        }
                    },
                    "energy": {
                        "$sum": "$ae"
                    }
                }
            },
            {
                "$project": {
                    _id: 0,
                    energy: 1,
                }
            },
            {
                "$limit": 1
            },
        ]

        MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true },
            function (err, db) {
                if (err) throw err;
                var dbo = db.db(databaseName);
                dbo.collection(allDevicesCollection).aggregate(aggregate).toArray().then((docs) => {
                    var docsJSONString = JSON.stringify(docs)
                    docsJSONString = docsJSONString.replace(/[\[\]']+/g, '');
                    ws.send(docsJSONString);
                });
            }
        );
        // var allEnergyToday = 100081;
        // ws.send(allEnergyToday);
    };

    var onlineDevices = () => {
        var onlineDevices = 0;
        systemDevices.forEach(async (device) => {
            var dataFromAPI = await axios.get(getVariableValue(device.device.id));
            xml2js.parseString(dataFromAPI.data, (err, result) => {
                if (err) {
                    throw err;
                }
                const jsonString = JSON.stringify(result, null, 4);
                var json = JSON.parse(jsonString);
                if (parseInt(json.values.variable[24].value[0]) === DEVICE_ONLINE) {
                    onlineDevices++;
                }
            });
        })
        ws.send(onlineDevices);
    };

    var offlineDevices = () => {
        var offlineDevices = 0;
        systemDevices.forEach(async (device) => {
            var dataFromAPI = await axios.get(getVariableValue(device.device.id));
            xml2js.parseString(dataFromAPI.data, (err, result) => {
                if (err) {
                    throw err;
                }
                const jsonString = JSON.stringify(result, null, 4);
                var json = JSON.parse(jsonString);
                if (parseInt(json.values.variable[24].value[0]) === DEVICE_OFFLINE) {
                    offlineDevices++;
                }
            });
        })
        ws.send(onlineDevices);
    };

    var nonInitializedDevices = () => {
        var nonInitializedDevices = 702;
        ws.send(nonInitializedDevices);
    };

    ws.on('close', () => {
        console.log('Disconnected from client web socket.');
    });


    ws.send('Connect to Energy-Monitoring WebSocket');
});