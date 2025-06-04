import { useState } from 'react';
import axios from 'axios';
import mapping from '../data/carparkDetailsWithLatLng.json';
import { Container, Alert, Spinner } from 'react-bootstrap';
import SearchForm from './SearchForm.jsx';
import CarparkResultCard from './CarparkResultCard';


const baseURL = 'https://api.data.gov.sg/v1/transport/carpark-availability';
const ONEMAP_GEOCODE_URL = 'https://www.onemap.gov.sg/api/common/elastic/search';
const authToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxNDI5NWM2OGE2YTcxMWY0YTQzYzc1MjM4MDIwMzA0ZSIsImlzcyI6Imh0dHA6Ly9pbnRlcm5hbC1hbGItb20tcHJkZXppdC1pdC1uZXctMTYzMzc5OTU0Mi5hcC1zb3V0aGVhc3QtMS5lbGIuYW1hem9uYXdzLmNvbS9hcGkvdjIvdXNlci9wYXNzd29yZCIsImlhdCI6MTc0ODg0NjcwNCwiZXhwIjoxNzQ5MTA1OTA0LCJuYmYiOjE3NDg4NDY3MDQsImp0aSI6ImdwR0FvSDZjbUZPaGVVWnEiLCJ1c2VyX2lkIjo3Mzg4LCJmb3JldmVyIjpmYWxzZX0.zA62u-azFu3BtFJZRKnMh4eQxU6Z1aUzkCkr2ss5aKI';  // Replace with your access token
const headers = {
  'Authorization': `Bearer ${authToken}`,
  'Content-Type': 'application/json'
};

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}


function CheckCarpark() {
  const [location, setLocation] = useState('');
  const [availability, setAvailability] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedCarpark, setSelectedCarpark] = useState(null);
  const [loading, setLoading] = useState(false);
  const [minDistance, setMinDistance] = useState(Infinity);

  const checkAvailability = async () => {
    const findCarpark = mapping.find(cp =>
      cp.address.toLowerCase().includes(location.toLowerCase())
    );

    if (!findCarpark || !findCarpark.lat || !findCarpark.lng) {
      setErrorMsg('Location not found in mapping.');
      setAvailability(null);
      setSelectedCarpark(null);
      setLoading(true);
      // return;
    }


    let userLat, userLng;
    // Step 1: Geocode the user input location using OneMap API
    try {
      setLoading(true);
      const response = await axios.get(ONEMAP_GEOCODE_URL, {
        headers: headers,
        params: {
          searchVal: location,
          returnGeom: 'Y',
          getAddrDetails: 'Y'
        }
      });
            // // Check if results are available
      if (response.data.results && response.data.results.length > 0) {
        userLat = response.data.results[0].LATITUDE;
        userLng = response.data.results[0].LONGITUDE;
        console.log("userLat", userLat);
        console.log("userLng", userLng);
      } else {
        setErrorMsg('Failed to geocode location.');
        setAvailability(null);
        setSelectedCarpark(null);
        setLoading(false);
        return;
      }
    } catch (err) {
      setErrorMsg('Failed to fetch data.');
      setAvailability(null);
      setSelectedCarpark(null);
      setLoading(false);
      console.error('Error fetching geocode data:', err);
      return;
    }

// Step 2: Find the nearest carpark from the local mapping data
    let nearestCarpark = null;
    setMinDistance(Infinity);

    if (!userLat || !userLng) {
      setErrorMsg('Failed to retrieve user location.');
      setLoading(false);
      return;
    }
    console.log("userLat",userLat);
    console.log("userLng",userLng); 
    mapping.forEach(carpark => {
      // Ensure carpark has valid lat/lng before calculating distance
      if (carpark.lat && carpark.lng) {
        const distance = calculateDistance(userLat, userLng, carpark.lat, carpark.lng);
        if (distance < minDistance) {
          setMinDistance(distance);
          nearestCarpark = carpark;
        }
      }
    });

    if (!nearestCarpark) {
      setErrorMsg('No carparks found in the vicinity of the entered location.');
      setLoading(false);
      return;
    }



    try {
      setLoading(true);
      setErrorMsg('');

      const availResponse = await axios.get(baseURL);
      const carparkData = availResponse.data.items[0].carpark_data;
      const carpark = carparkData.find(cp => cp.carpark_number === nearestCarpark.car_park_no);

      if (carpark && carpark.carpark_info.length > 0) {
        setAvailability(carpark.carpark_info[0].lots_available);
        setSelectedCarpark(nearestCarpark);
        setErrorMsg('');
      } else {
        setErrorMsg('No availability data for this carpark.');
        setAvailability(null);
        setSelectedCarpark(null);
      }
    } catch (err) {
      setErrorMsg('Failed to fetch data.');
      setAvailability(null);
      setSelectedCarpark(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
        <span className="display-1">🚗</span> <br />
      <h1 className="mb-4">GOT CARPARK OR NOT?</h1>

      <SearchForm
        location={location}
        setLocation={setLocation}
        onCheck={checkAvailability}
        loading={loading}
      />

      {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

      {loading && (
        <div className="text-center mt-3">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p>Finding nearest carpark and checking availability...</p>
        </div>
      )}


      {availability !== null && selectedCarpark && (
        <CarparkResultCard
          availability={availability}
          carpark={selectedCarpark}
          distance={minDistance !== Infinity ? minDistance.toFixed(2) : "N/A"}
        />
      )}
    </Container>
  );
}

export default CheckCarpark;
