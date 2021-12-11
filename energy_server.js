const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const xml2js = require('xml2js');
var cors = require('cors')
const axios = require('axios');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json())

const socketServer = require('http').Server(app);
const io = require("socket.io")(socketServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// const mongoUrl = 'mongodb://127.0.0.1:27017';
const mongoUrl = 'mongodb://cocoad:CocoaD12345@43.229.134.139:27018/energy-monitoring?authSource=admin';
const port = 8000;

const powerPort = 8080;
const powerUrl = 'http://localhost:' + powerPort;

const socketIOPort = 4000;

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
            responseList.push(response.data);
        }
        responseList = [];
    } catch (error) {
        console.error(error);
    }
}

var cleansingData = (json, device) => {
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
    var thdv1 = json.values.variable.find((element) => element.id[0] == `${device}.THDV1`) !== undefined ?
        parseFloat(json.values.variable.find((element) => element.id[0] == `${device}.THDV1`).value[0]) : null;
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
        if (systemDevices.includes(deviceId) && (deviceId != 'CoPro1' || deviceId != 'CoPro2')) {
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
                        "$addToSet": "$deviceName"
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
                // console.log(sentData);
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

const ON_PEAK_COST_PER_UNIT = 4.1839;
const OFF_PEAK_COST_PER_UNIT = 2.6037;

const SUNDAY = 0;
const MONDAY = 1;
const TUESDAY = 2;
const WEDNESDAY = 3;
const THURSDAY = 4;
const FRIDAY = 5;
const SATURDAY = 6;


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
                    if ((device.startsWith("MDB") && !device.endsWith("Care")) || device.startsWith("B1") || device.startsWith("Solar")) {
                        systemDevices.push(device);
                        console.log(`${device} is added to systemDevices list.`);
                    }
                });
            }
        });
    } catch (error) {
        console.error(error);
    }
}

var client;

app.listen(port, async () => {
    setIsRealDevices(true);
    getSystemDevices();
    client = await MongoClient.connect(mongoUrl);
    console.log('Fetch device from:' + GET_DEVICES_PATH);
    console.log(`Energy Monitoring API is listening on port ${port}.`);
});

/* ⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ Web Socket ⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️⚡️ */

io.on('connection', (socket) => {
    socket.on('event/alarm', (message) => {
        socket.emit('event/alarm', alarmEvent());
    });

    socket.on('event/handled_alarm', (message) => {
        socket.emit('event/handled_alarm', handledAlarmEvents());
    });

    socket.on('cost/today', (message) => {
        setInterval(async () => {
            socket.emit('cost/today', await todayCost());
        }, 3000);
    });

    socket.on('saved_cost/today', (message) => {
        setInterval(async () => {
            socket.emit('saved_cost/today', await todaySavedCostAsBaht());
        }, 3000);
    });

    socket.on('all_energy/today', (message) => {
        setInterval(async () => {
            socket.emit('all_energy/today', await allEnergyToday());
        }, 3000);
    });

    socket.on('devices-status=online', (message) => {
        setInterval(async () => {
            socket.emit('devices-status=online', await onlineDevices());
        }, 3000);
    });

    socket.on('devices-status=offline', (message) => {
        setInterval(async () => {
            socket.emit('devices-status=offline', await offlineDevices());
        }, 3000);
    });

    socket.on('pea/today', (message) => {
        setInterval(async () => {
            socket.emit('pea/today', await peaEnergyToday());
        }, 3000);
    });

    socket.on('pea_devices/all_energy/today', (message) => {
        setInterval(async () => {
            socket.emit('pea_devices/all_energy/today', await eachDevicesEnergyToday());
        }, 3000);
    });

    socket.on('solar/all_energy/today', (message) => {
        setInterval(async () => {
            socket.emit('solar/all_energy/today', await eachSolarEnergyToday());
        }, 3000);
    });

    socket.on('solar/today', (message) => {
        setInterval(async () => {
            socket.emit('solar/today', await solarEnergyToday());
        }, 3000);
    });

    socket.on('on_peak/today', (message) => {
        setInterval(async () => {
            socket.emit('on_peak/today', await onPeakToday());
        }, 3000);
    });

    socket.on('off_peak/today', (message) => {
        setInterval(async () => {
            socket.emit('off_peak/today', await offPeakToday());
        }, 3000);
    });

    socket.on('alarm', async () => {
        setInterval(async () => {
            socket.emit('alarm', await getAlarmEvent());
        }, 3000)
    });
});

socketServer.listen(socketIOPort, () => {
    console.log(`SocketIO is listening on port:${socketIOPort}`);
});

var alarmEvent = () => {
    var todayAlarmEvents = 64;
    return todayAlarmEvents;
};

var handledAlarmEvents = () => {
    var handledAlarmEvents = 87;
    return handledAlarmEvents;
};

var todayCost = async () => {
    var todayOnPeak = await onPeakToday();
    var todayOffPeak = await offPeakToday();
    var todayCostAsBaht = (todayOnPeak.onPeak * ON_PEAK_COST_PER_UNIT) + (todayOffPeak.offPeak * OFF_PEAK_COST_PER_UNIT);
    return { todayCost: todayCostAsBaht };
};

var yesterdayCost = async () => {
    var yesterdayOnPeak = await onPeakYesterday();
    var yesterdayOffPeak = await offPeakYesterday();
    var yesterdayCostAsBaht = (yesterdayOnPeak.onPeak * ON_PEAK_COST_PER_UNIT) + (yesterdayOffPeak.offPeak * OFF_PEAK_COST_PER_UNIT);
    return { yesterdayCost: yesterdayCostAsBaht };
};

var todaySavedCostAsBaht = async () => {
    var today = await todayCost();
    var yesterday = await yesterdayCost();
    var todaySavedCost = yesterday.yesterdayCost - today.todayCost;
    return { todaySavedCost: todaySavedCost };
};

var allEnergyToday = async () => {
    var todayAllEnergyAggregate = [
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
                _id: "$deviceName",
                "energy": {
                    "$last": "$ae"
                }
            }
        },
        {
            "$project": {
                _id: 0,
                energy: 1,
            }
        },
    ];

    var yesterdayAllEnergyAggregate = [
        {
            "$match": {
                "createdAt": {
                    $gte: new Date(yesterday),
                    $lt: new Date(today),
                }
            }
        },
        {
            "$group": {
                _id: "$deviceName",
                "energy": {
                    "$last": "$ae"
                }
            }
        },
        {
            "$project": {
                _id: 0,
                energy: 1,
            }
        },
    ];

    var db = client.db(databaseName);
    const collection = db.collection(allDevicesCollection);
    const todayResult = await collection.aggregate(todayAllEnergyAggregate).toArray();
    const yesterdayResult = await collection.aggregate(yesterdayAllEnergyAggregate).toArray();
    var todayAllEnergy = 0;
    var yesterdayAllEnergy = 0;

    for (var result of todayResult) {
        todayAllEnergy += result.energy;
    }

    for (var result of yesterdayResult) {
        yesterdayAllEnergy += result.energy;
    }

    var allEnergyToday = todayAllEnergy - yesterdayAllEnergy;
    return { energy: allEnergyToday };
};

var peaEnergyToday = async () => {
    var todayPEAEnergyAggregate = [
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
    ];
    var yesterdayPEAEnergyAggregate = [
        {
            "$match": {
                "createdAt": {
                    $gte: new Date(yesterday),
                    $lt: new Date(today),
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
    var db = client.db(databaseName);
    const collection = db.collection('meter');
    const todayResult = await collection.aggregate(todayPEAEnergyAggregate).toArray();
    const yesterdayResult = await collection.aggregate(yesterdayPEAEnergyAggregate).toArray();
    var todayPEAAllEnergy = todayResult[0].energy - yesterdayResult[0].energy;
    return { energy: todayPEAAllEnergy };
};

var solarEnergyToday = async () => {
    var todaySolarEnergyAggregate = [
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
    ];

    var yesterdaySolarEnergyAggregate = [
        {
            "$match": {
                "createdAt": {
                    $gte: new Date(yesterday),
                    $lt: new Date(today),
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
    ];

    var db = client.db(databaseName);
    const collection = db.collection('solar');
    const todayResult = await collection.aggregate(todaySolarEnergyAggregate).toArray();
    const yesterdayResult = await collection.aggregate(yesterdaySolarEnergyAggregate).toArray();
    var todaySolarEnergy = todayResult[0].energy - yesterdayResult[0].energy;
    return { energy: todaySolarEnergy };
};

var eachDevicesEnergyToday = async () => {
    var todayAllEnergyAggregate = [
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
                _id: "$deviceName",
                "energy": { "$last": "$ae" }
            }
        },
        {
            "$sort": {
                _id: 1
            }
        }
    ];

    var yesterdayAllEnergyAggregate = [
        {
            "$match": {
                "createdAt": {
                    $gte: new Date(yesterday),
                    $lt: new Date(today),
                }
            }
        },
        {
            "$group": {
                _id: "$deviceName",
                "energy": { "$last": "$ae" }
            }
        },
        {
            "$sort": {
                _id: 1
            }
        }
    ];

    var db = client.db(databaseName);
    const collection = db.collection('meter');
    const todayResult = await collection.aggregate(todayAllEnergyAggregate).toArray();
    const yesterdayResult = await collection.aggregate(yesterdayAllEnergyAggregate).toArray();
    var devicesEnergyToday = [];
    var currentYesterdayResultCalculationIndex = 0;

    for (result of todayResult) {
        if (currentYesterdayResultCalculationIndex < yesterdayResult.length) {
            const deviceEnergy = result.energy - yesterdayResult[currentYesterdayResultCalculationIndex].energy;
            currentYesterdayResultCalculationIndex++;
            devicesEnergyToday.push({ _id: result._id, energy: deviceEnergy });
        }
    }

    return devicesEnergyToday;
};

var eachSolarEnergyToday = async () => {
    var todayAllEnergyAggregate = [
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
                _id: "$deviceName",
                "energy": { "$last": "$ae" }
            }
        },
        {
            "$sort": {
                _id: 1
            }
        }
    ];

    var yesterdayAllEnergyAggregate = [
        {
            "$match": {
                "createdAt": {
                    $gte: new Date(yesterday),
                    $lt: new Date(today),
                }
            }
        },
        {
            "$group": {
                _id: "$deviceName",
                "energy": { "$last": "$ae" }
            }
        },
        {
            "$sort": {
                _id: 1
            }
        }
    ];

    var db = client.db(databaseName);
    const collection = db.collection('solar');
    const todayResult = await collection.aggregate(todayAllEnergyAggregate).toArray();
    const yesterdayResult = await collection.aggregate(yesterdayAllEnergyAggregate).toArray();
    var solarEnergyToday = [];
    var currentYesterdayResultCalculationIndex = 0;

    for (result of todayResult) {
        if (currentYesterdayResultCalculationIndex < yesterdayResult.length) {
            const solarEnergy = result.energy - yesterdayResult[currentYesterdayResultCalculationIndex].energy;
            currentYesterdayResultCalculationIndex++;
            solarEnergyToday.push({ _id: result._id, energy: solarEnergy });
        }
    }

    return solarEnergyToday;
};

var onlineDevices = async () => {
    var onlineDevices = 0;
    for (var device of systemDevices) {
        var dataFromAPI = !isRealDevice ? `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                                                    <values>
                                                        <variable>
                                                            <id>${device}.AE</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.AI1</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.AI2</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.AI3</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.AIN</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.API1</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.API2</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.API3</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.APIS</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.APPI1</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.APPI2</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.APPI3</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.APPIS</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.DESCRIPTION</id>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.FRE</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.NAME</id>
                                                            <textValue>${device}</textValue>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.PFI1</id>
                                                            <value>9998.000000</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.PFI2</id>
                                                            <value>9998.000000</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.PFI2</id>
                                                            <value>9998.000000</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.PFI3</id>
                                                            <value>9998.000000</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.PFIS</id>
                                                            <value>9998.000000</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.RPI1</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.RPI2</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.RPI3</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.RPIS</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.STATUS</id>
                                                            <value>${(Math.floor(Math.random()) == 0) ? 1 : 34}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.THDI1</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.THDI2</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.THDI3</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.THDIN</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.THDV1</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.THDV12</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.THDV2</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.THDV23</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.THDV3</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.THDV31</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.VDTTM</id>
                                                            <value>01011999003545</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.VI1</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.VI12</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.VI2</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.VI23</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.VI3</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                        <variable>
                                                            <id>${device}.VI31</id>
                                                            <value>${Math.random() * 100 + 30}</value>
                                                        </variable>
                                                    </values>` : await axios.get(getVariableValue(device));
        xml2js.parseString(!isRealDevice ? dataFromAPI : dataFromAPI.data, (err, result) => {
            if (err) {
                throw err;
            }
            const jsonString = JSON.stringify(result, null, 4);
            var json = JSON.parse(jsonString);
            var deviceStatus = parseFloat(json.values.variable.find((element) => element.id[0] == `${device}.STATUS`).value[0]);

            if (deviceStatus !== NaN) {
                if (deviceStatus === DEVICE_ONLINE) {
                    onlineDevices++;
                }
            }
        });
    }

    return { onlineDevices: onlineDevices };
};

var offlineDevices = async () => {
    var offlineDevices = 0;
    for (var device of systemDevices) {
        var dataFromAPI = !isRealDevice ? `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                                                <values>
                                                    <variable>
                                                        <id>${device}.AE</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.AI1</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.AI2</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.AI3</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.AIN</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.API1</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.API2</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.API3</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.APIS</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.APPI1</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.APPI2</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.APPI3</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.APPIS</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.DESCRIPTION</id>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.FRE</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.NAME</id>
                                                        <textValue>${device}</textValue>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.PFI1</id>
                                                        <value>9998.000000</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.PFI2</id>
                                                        <value>9998.000000</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.PFI2</id>
                                                        <value>9998.000000</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.PFI3</id>
                                                        <value>9998.000000</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.PFIS</id>
                                                        <value>9998.000000</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.RPI1</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.RPI2</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.RPI3</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.RPIS</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.STATUS</id>
                                                        <value>${(Math.floor(Math.random()) == 0) ? 1 : 34}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.THDI1</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.THDI2</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.THDI3</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.THDIN</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.THDV1</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.THDV12</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.THDV2</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.THDV23</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.THDV3</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.THDV31</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.VDTTM</id>
                                                        <value>01011999003545</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.VI1</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.VI12</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.VI2</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.VI23</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.VI3</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                    <variable>
                                                        <id>${device}.VI31</id>
                                                        <value>${Math.random() * 100 + 30}</value>
                                                    </variable>
                                                </values>` : await axios.get(getVariableValue(device));
        xml2js.parseString(!isRealDevice ? dataFromAPI : dataFromAPI.data, (err, result) => {
            if (err) {
                throw err;
            }
            const jsonString = JSON.stringify(result, null, 4);
            var json = JSON.parse(jsonString);
            var deviceStatus = parseFloat(json.values.variable.find((element) => element.id[0] == `${device}.STATUS`).value[0]);

            if (deviceStatus !== NaN) {
                if (deviceStatus === DEVICE_OFFLINE) {
                    offlineDevices++;
                }
            }
        });
    }

    return { offlineDevices: offlineDevices };
};

var onPeakToday = async () => {
    var todayOnPeak = 0;
    var onPeakStartTime = new Date(today);
    onPeakStartTime.setHours(onPeakStartTime.getHours() + 2);
    var onPeakEndTime = new Date(today);
    onPeakEndTime.setHours(onPeakEndTime.getHours() + 15);

    var aggregate = [
        {
            "$match": {
                "createdAt": {
                    $gte: onPeakStartTime,
                    $lt: onPeakEndTime,
                }
            }
        },
        {
            "$group": {
                _id: "$deviceName",
                "firstAE": {
                    "$first": "$ae"
                },
                "nowAE": {
                    "$last": "$ae"
                }
            }
        },
        {
            $addFields: {
                "onPeak": {
                    "$subtract": [
                        "$nowAE",
                        "$firstAE"
                    ]
                }
            }
        },
        {
            "$project": {
                _id: 0,
                onPeak: 1
            }
        },
    ];

    if (onPeakStartTime.getDay() !== SATURDAY && onPeakStartTime.getDay() !== SUNDAY) {
        var db = client.db(databaseName);
        const collection = db.collection('all');
        const result = await collection.aggregate(aggregate).toArray();

        for (var onPeak of result) {
            todayOnPeak += onPeak.onPeak;
        }

        return { onPeak: todayOnPeak };
    } else {
        return { onPeak: 0 };
    }
};

var offPeakToday = async () => {
    var todayOffPeak = 0;
    var offPeakStartTime = new Date(today);
    var offPeakEndTime = new Date();

    if (offPeakStartTime.getDay() !== SATURDAY && offPeakStartTime.getDay() !== SUNDAY) {
        offPeakStartTime.setHours(offPeakStartTime.getHours() + 15);
        offPeakEndTime = new Date();
    } else {
        offPeakStartTime = new Date(today);
        offPeakEndTime = new Date(tomorrow);
    }

    var aggregate = [
        {
            "$match": {
                "createdAt": {
                    $gte: offPeakStartTime,
                    $lt: offPeakEndTime,
                }
            }
        },
        {
            "$group": {
                _id: "$deviceName",
                "firstAE": {
                    "$first": "$ae"
                },
                "nowAE": {
                    "$last": "$ae"
                }
            }
        },
        {
            $addFields: {
                "offPeak": {
                    "$subtract": [
                        "$nowAE",
                        "$firstAE"
                    ]
                }
            }
        },
        {
            "$project": {
                _id: 0,
                offPeak: 1
            }
        },
    ];

    var db = client.db(databaseName);
    const collection = db.collection('all');
    const result = await collection.aggregate(aggregate).toArray();

    for (var offPeak of result) {
        todayOffPeak += offPeak.offPeak;
    }

    return { offPeak: todayOffPeak };
};

var onPeakYesterday = async () => {
    var yesterdayOnPeak = 0;
    var onPeakStartTime = new Date(yesterday);
    onPeakStartTime.setHours(onPeakStartTime.getHours() + 2);
    var onPeakEndTime = new Date(yesterday);
    onPeakEndTime.setHours(onPeakEndTime.getHours() + 15);

    var aggregate = [
        {
            "$match": {
                "createdAt": {
                    $gte: onPeakStartTime,
                    $lt: onPeakEndTime,
                }
            }
        },
        {
            "$group": {
                _id: "$deviceName",
                "firstAE": {
                    "$first": "$ae"
                },
                "nowAE": {
                    "$last": "$ae"
                }
            }
        },
        {
            $addFields: {
                "onPeak": {
                    "$subtract": [
                        "$nowAE",
                        "$firstAE"
                    ]
                }
            }
        },
        {
            "$project": {
                _id: 0,
                onPeak: 1
            }
        },
    ];

    if (onPeakStartTime.getDay() !== SATURDAY && onPeakStartTime.getDay() !== SUNDAY) {
        var db = client.db(databaseName);
        const collection = db.collection('all');
        const result = await collection.aggregate(aggregate).toArray();

        for (var onPeak of result) {
            yesterdayOnPeak += onPeak.onPeak;
        }

        return { onPeak: yesterdayOnPeak };
    } else {
        return { onPeak: 0 };
    }
};

var offPeakYesterday = async () => {
    var yesterdayOffPeak = 0;
    var offPeakStartTime = new Date(yesterday);
    var offPeakEndTime = new Date(today);

    if (offPeakStartTime.getDay() !== SATURDAY && offPeakStartTime.getDay() !== SUNDAY) {
        offPeakStartTime.setHours(offPeakStartTime.getHours() + 15);
        offPeakEndTime.setHours(offPeakEndTime.getHours() + 2);
    } else {
        offPeakStartTime = new Date(yesterday);
        offPeakEndTime = new Date(today);
    }

    var aggregate = [
        {
            "$match": {
                "createdAt": {
                    $gte: offPeakStartTime,
                    $lt: offPeakEndTime,
                }
            }
        },
        {
            "$group": {
                _id: "$deviceName",
                "firstAE": {
                    "$first": "$ae"
                },
                "nowAE": {
                    "$last": "$ae"
                }
            }
        },
        {
            $addFields: {
                "offPeak": {
                    "$subtract": [
                        "$nowAE",
                        "$firstAE"
                    ]
                }
            }
        },
        {
            "$project": {
                _id: 0,
                offPeak: 1
            }
        },
    ];

    var db = client.db(databaseName);
    const collection = db.collection('all');
    const result = await collection.aggregate(aggregate).toArray();

    for (var offPeak of result) {
        yesterdayOffPeak += offPeak.offPeak;
    }

    return { offPeak: yesterdayOffPeak };
};

var getAlarmEvent = async () => {
    var sentData;
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

            var humidity = json.values.variable.find((element) => element.id[0] == `CoPro2.HUM`) !== undefined ?
                parseFloat(json.values.variable.find((element) => element.id[0] == `CoPro2.HUM`).value[0]) : 0;
            var temperature = json.values.variable.find((element) => element.id[0] == `CoPro2.Temp`) !== undefined ?
                parseFloat(json.values.variable.find((element) => element.id[0] == `CoPro2.Temp`).value[0]) : 0;
            var smokeStatus = json.values.variable.find((element) => element.id[0] == `CoPro2.Smoke`) !== undefined ?
                parseFloat(json.values.variable.find((element) => element.id[0] == `CoPro2.Smoke`).value[0]) === 0 ? 'Normal' : 'Alarm' : 'Normal';
            // console.log({ humidity: humidity, temperature: temperature, smokeStatus: smokeStatus });
            sentData = { humidity: humidity, temperature: temperature, smokeStatus: smokeStatus };
        });
    } catch (error) {
        console.error(error);
    }
    return sentData;
}