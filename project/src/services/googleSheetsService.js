import axios from 'axios';

// Google Sheets API configuration
const GOOGLE_SHEETS_API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

// Sheet IDs - Replace these with your actual Google Sheet IDs
const SHEET_IDS = {
  ZONE_CHART: import.meta.env.VITE_ZONE_CHART_SHEET_ID,
  UPS_RATES: import.meta.env.VITE_UPS_RATES_SHEET_ID,
  DHL_RATES: import.meta.env.VITE_DHL_RATES_SHEET_ID,
  FEDEX_RATES: import.meta.env.VITE_FEDEX_RATES_SHEET_ID,
  FSC: import.meta.env.VITE_FSC_SHEET_ID,
  INTERIOR_DELIVERY: import.meta.env.VITE_INTERIOR_DELIVERY_SHEET_ID
};

// Helper function to fetch data from Google Sheets
const fetchSheetData = async (sheetId, range = 'A:Z') => {
  try {
    const response = await axios.get(
      `${BASE_URL}/${sheetId}/values/${range}?key=${GOOGLE_SHEETS_API_KEY}`
    );
    return response.data.values || [];
  } catch (error) {
    console.error(`Error fetching sheet data for ${sheetId}:`, error);
    throw new Error(`Failed to fetch data from Google Sheets: ${error.message}`);
  }
};

// Convert array data to objects for easier manipulation
const arrayToObjects = (data, headers = null) => {
  if (!data || data.length === 0) return [];
  
  const headerRow = headers || data[0];
  const dataRows = headers ? data : data.slice(1);
  
  return dataRows.map(row => {
    const obj = {};
    headerRow.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj;
  });
};

// Fetch Zone Chart data
export const fetchZoneChart = async () => {
  try {
    const data = await fetchSheetData(SHEET_IDS.ZONE_CHART);
    return arrayToObjects(data);
  } catch (error) {
    console.error('Error fetching zone chart:', error);
    // Return mock data if API fails
    return [
      { Country: 'USA', Carrier: 'DHL', Zone: '1' },
      { Country: 'USA', Carrier: 'FEDEX', Zone: '2' },
      { Country: 'USA', Carrier: 'UPS', Zone: '1' },
      { Country: 'UK', Carrier: 'DHL', Zone: '2' },
      { Country: 'UK', Carrier: 'FEDEX', Zone: '1' },
      { Country: 'UK', Carrier: 'UPS', Zone: '2' },
    ];
  }
};

// Fetch Rate Charts for all carriers
export const fetchRateCharts = async () => {
  try {
    const [upsData, dhlData, fedexData] = await Promise.all([
      fetchSheetData(SHEET_IDS.UPS_RATES),
      fetchSheetData(SHEET_IDS.DHL_RATES),
      fetchSheetData(SHEET_IDS.FEDEX_RATES)
    ]);

    return {
      UPS: processRateChart(upsData),
      DHL: processRateChart(dhlData),
      FEDEX: processRateChart(fedexData)
    };
  } catch (error) {
    console.error('Error fetching rate charts:', error);
    // Return mock data if API fails
    return generateMockRateCharts();
  }
};

// Process rate chart data into a more usable format
const processRateChart = (data) => {
  if (!data || data.length === 0) return {};
  
  const headers = data[0]; // First row contains headers (Weight, Zone 1, Zone 2, etc.)
  const rateData = {};
  
  // Skip the first column (Weight) and process zone columns
  for (let i = 1; i < headers.length; i++) {
    const zoneName = headers[i];
    rateData[zoneName] = {};
    
    // Process each weight row
    for (let j = 1; j < data.length; j++) {
      const weight = parseFloat(data[j][0]);
      const rate = parseFloat(data[j][i]) || 0;
      rateData[zoneName][weight] = rate;
    }
  }
  
  return rateData;
};

// Generate mock rate charts for fallback
const generateMockRateCharts = () => {
  const weights = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 
                  12.0, 14.0, 16.0, 18.0, 20.0, 25.0, 30.0, 35.0, 40.0, 45.0, 50.0, 60.0, 70.0, 
                  80.0, 90.0, 100.0, 150.0, 200.0, 250.0, 300.0, 400.0, 500.0, 600.0, 700.0, 800.0, 900.0, 1000.0];
  
  const zones = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5'];
  const carriers = ['UPS', 'DHL', 'FEDEX'];
  
  const rateCharts = {};
  
  carriers.forEach(carrier => {
    rateCharts[carrier] = {};
    zones.forEach(zone => {
      rateCharts[carrier][zone] = {};
      weights.forEach(weight => {
        // Generate mock rates based on weight and zone
        const baseRate = weight * 100;
        const zoneMultiplier = parseInt(zone.split(' ')[1]) * 0.2;
        const carrierMultiplier = carrier === 'DHL' ? 1.1 : carrier === 'FEDEX' ? 1.05 : 1.0;
        rateCharts[carrier][zone][weight] = Math.round(baseRate * (1 + zoneMultiplier) * carrierMultiplier);
      });
    });
  });
  
  return rateCharts;
};

// Fetch FSC data
export const fetchFSCData = async () => {
  try {
    const data = await fetchSheetData(SHEET_IDS.FSC);
    return arrayToObjects(data);
  } catch (error) {
    console.error('Error fetching FSC data:', error);
    // Return mock data if API fails
    return [
      { Carrier: 'DHL', 'Starting Date': '2024-01-01', 'End Date': '2024-12-31', 'FSC %': '15.5' },
      { Carrier: 'FEDEX', 'Starting Date': '2024-01-01', 'End Date': '2024-12-31', 'FSC %': '14.2' },
      { Carrier: 'UPS', 'Starting Date': '2024-01-01', 'End Date': '2024-12-31', 'FSC %': '16.0' }
    ];
  }
};

// Fetch Interior Delivery Charges
export const fetchInteriorDeliveryCharges = async () => {
  try {
    const data = await fetchSheetData(SHEET_IDS.INTERIOR_DELIVERY);
    return arrayToObjects(data);
  } catch (error) {
    console.error('Error fetching interior delivery charges:', error);
    // Return mock data if API fails
    return [
      { Country: 'USA', Amount: '1000' },
      { Country: 'UK', Amount: '1200' },
      { Country: 'Germany', Amount: '1100' },
      { Country: 'France', Amount: '1150' },
      { Country: 'India', Amount: '800' }
    ];
  }
};

// Get current FSC percentage for a carrier
export const getCurrentFSC = (fscData, carrier) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const fscRecord = fscData.find(record => {
    const carrierMatch = record.Carrier.toUpperCase() === carrier.toUpperCase();
    const startDate = record['Starting Date'];
    const endDate = record['End Date'];
    
    return carrierMatch && todayStr >= startDate && todayStr <= endDate;
  });
  
  return fscRecord ? parseFloat(fscRecord['FSC %']) / 100 : 0.15; // Default to 15% if not found
};

// Get zone for country and carrier
export const getZoneForCountryCarrier = (zoneChart, country, carrier) => {
  const record = zoneChart.find(item => 
    item.Country.toUpperCase() === country.toUpperCase() && 
    item.Carrier.toUpperCase() === carrier.toUpperCase()
  );
  return record ? record.Zone : '1'; // Default to Zone 1 if not found
};

// Get rate for weight and zone from rate chart
export const getRateForWeightZone = (rateChart, weight, zone) => {
  const zoneName = `Zone ${zone}`;
  if (!rateChart[zoneName]) return 100; // Default rate if zone not found
  
  // Find the closest weight that's greater than or equal to the input weight
  const weights = Object.keys(rateChart[zoneName]).map(w => parseFloat(w)).sort((a, b) => a - b);
  const applicableWeight = weights.find(w => w >= weight) || weights[weights.length - 1];
  
  return rateChart[zoneName][applicableWeight] || 100; // Default rate if weight not found
};

// Get interior delivery charge for country
export const getInteriorDeliveryCharge = (interiorCharges, country) => {
  const record = interiorCharges.find(item => 
    item.Country.toUpperCase() === country.toUpperCase()
  );
  return record ? parseFloat(record.Amount) : 1000; // Default to 1000 if not found
};

// Customs clearance charges (fixed values)
export const getCustomsClearanceCharge = (carrier) => {
  const charges = {
    'DHL': 4000,
    'FEDEX': 2000,
    'UPS': 2750
  };
  return charges[carrier.toUpperCase()] || 2000;
};