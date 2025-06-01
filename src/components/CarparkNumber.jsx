import React, { useEffect, useState } from "react";
import axios from "axios";
import CarparkMap from "./CarparkMap";
import styles from "./CarparkNumber.module.css";
import infoDetail from "../data/carparkDetailsWithLatLng.json";

const baseUrl = "https://api.data.gov.sg/v1/transport/carpark-availability";

function CarparkNumber() {
  const [carparkinfo, setCarparkInfo] = useState(null);
  const [error, setError] = useState(null);
  const [cpnum, setCpNum] = useState(null);
  const [searchItem, setSearchItem] = useState(null);
  const [searchItemDetail, setSearchItemDetail] = useState(null);
  const [isDisplay, setIsDisplay] = useState(false);
  const [isCheck, setIsCheck] = useState(false);

  async function fetchCarparkData() {
    try {
      const response = await axios.get(baseUrl);
      const cpinfo = response.data.items?.[0]?.carpark_data || [];
      setCarparkInfo(cpinfo);
      console.log(cpinfo);
      console.log("response.data = ", response.data);
    } catch (error) {
      setError("Error fetching carpark data");
      console.log(error.message);
    }
  }

  useEffect(() => {
    fetchCarparkData();
  }, []);

  const handleChangeCheckbox = (event) => {
    setIsCheck(event.target.checked);
  };

  const handlerSelect = (event) => {
    setCpNum(event.target.value);
  };

  const retrieveDateTime = () => {
    let dT = {
      date: " ",
      time: " ",
    };

    const datetime = searchItem.update_datetime;
    const [date, time] = datetime.split("T");
    dT = {
      date: date,
      time: time,
    };
    console.log("Date Time = " + dT.date + ", " + dT.time);
    return dT;
  };

  function handlerSearch() {
    if (!cpnum) {
      setError("Select Car Park Number!");
    } else {
      const obj = carparkinfo.find(
        (carpark) => carpark.carpark_number === cpnum
      );

      const objDetail = infoDetail.find(
        (carparknum) => carparknum.car_park_no === cpnum
      );

      if (obj === undefined || objDetail === undefined) {
        setError("No parking lots data available for this carpark.");
      } else {
        setSearchItem(obj);
        setSearchItemDetail(objDetail);
        console.log("obj: " + obj.carpark_info[0].total_lots);
        console.log("objDetail: " + objDetail.lat + ", " + objDetail.lng);
        setIsDisplay(true);
      }
    }
  }

  return (
    <div>
      <label className={styles.chkboxlabel}>
        <input
          className={styles.chkbox}
          type="checkbox"
          checked={isCheck}
          onChange={handleChangeCheckbox}
        />
        Carpark Number
      </label>
      {isCheck && carparkinfo && (
        <div className={styles.selectlist}>
          <select onChange={handlerSelect}>
            <option value="">-- Select carpark number --</option>
            {infoDetail.map((cpno, index) => (
              <option key={index} value={cpno.car_park_no}>
                {cpno.car_park_no}
              </option>
            ))}
          </select>

          <button className={styles.searchbtn} onClick={handlerSearch}>
            Search
          </button>
        </div>
      )}
      {error && isCheck === true && (
        <div className={styles.popupoverlay}>
          <div className={styles.popupbox}>
            <div className={styles.msgheader}>Error</div>
            <p className={styles.msgbody}>{error}</p>
            <button className={styles.errbtn} onClick={(e) => setError(false)}>
              Close
            </button>
          </div>
        </div>
      )}
      {isDisplay && isCheck && searchItem && searchItemDetail && (
        <div>
          <table className={styles.table}>
            <tbody>
              <tr>
                <td>Carpark Number</td>
                <td>{searchItem.carpark_number}</td>
              </tr>
              <tr>
                <td>Date</td>
                <td>{retrieveDateTime().date}</td>
              </tr>
              <tr>
                <td>Time</td>
                <td>{retrieveDateTime().time}</td>
              </tr>
              <tr>
                <td>Total Lots</td>
                <td>{searchItem.carpark_info[0].total_lots}</td>
              </tr>
              <tr>
                <td>Available Lots</td>
                <td>{searchItem.carpark_info[0].lots_available}</td>
              </tr>
              <tr>
                <td>Address</td>
                <td>{searchItemDetail.address}</td>
              </tr>
              <tr>
                <td>Type</td>
                <td>{searchItemDetail.car_park_type}</td>
              </tr>
              <tr>
                <td>Short Term</td>
                <td>{searchItemDetail.short_term_parking}</td>
              </tr>
            </tbody>
          </table>
          <button
            className={styles.closebtn}
            onClick={(e) => setIsDisplay(false)}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

export default CarparkNumber;
