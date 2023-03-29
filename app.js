const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const toConvertObjectToString = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log("DB Error: ${e.message}");
    process.exit(1);
  }
};

initializeDBAndServer();

//get allStates API1
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT * FROM state WHERE state_id;
    `;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachOne) => {
      return {
        stateId: eachOne.state_id,
        stateName: eachOne.state_name,
        population: eachOne.population,
      };
    })
  );
});

//get singleId ApI2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT * FROM state WHERE state_id = ${stateId};
    `;
  const stateArray = await db.get(getStateQuery);
  response.send(toConvertObjectToString(stateArray));
});

//add district API3
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
    INSERT INTO 
    district (district_name, state_id, cases, cured, active, deaths)
    VALUES ('${districtName}', '${stateId}', '${cases}', '${cured}', '${active}', '${deaths}');
    `;
  const dbResponse = await db.run(addDistrictQuery);
  const { districtId } = dbResponse.lastID;
  response.send("District Successfully Added");
});

//get district API4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT * FROM district WHERE district_id = ${districtId};
    `;
  const districtArray = await db.get(getDistrictQuery);
  response.send(toConvertObjectToString(districtArray));
});

//delete district API5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM district WHERE district_id = ${districtId};
    `;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//update district API6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
    UPDATE 
    district
    SET district_name='${districtName}', state_id='${stateId}', cases='${cases}', cured='${cured}', active='${active}', deaths='${deaths}'
    WHERE district_id = ${districtId};
    `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//get total numbers state wise API7]
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateDetailsQuery = `
    SELECT SUM(cases), SUM(cured), SUM(active), SUM(deaths) FROM district 
    WHERE
    state_id = ${stateId};
    `;
  const stateDetails = await db.get(getStateDetailsQuery);

  response.send({
    totalCases: stateDetails["SUM(cases)"],
    totalCured: stateDetails["SUM(cured)"],
    totalActive: stateDetails["SUM(active)"],
    totalDeaths: stateDetails["SUM(deaths)"],
  });
});

//get district API8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT state_id FROM district WHERE district_id = ${districtId};
    `;
  const getDistrictIdQueryResponse = await db.get(getDistrictQuery);
  const getStateQuery = `
    SELECT state_name FROM state WHERE state_id = ${getDistrictIdQueryResponse.state_id};
    `;
  const getStateQueryResponse = await db.get(getStateQuery);
  response.send({ stateName: getStateQueryResponse.state_name });
});

// Export the APP default exports
module.exports = app;
