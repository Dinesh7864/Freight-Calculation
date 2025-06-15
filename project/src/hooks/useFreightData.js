import { useState, useEffect } from 'react';
import {
  fetchZoneChart,
  fetchRateCharts,
  fetchFSCData,
  fetchInteriorDeliveryCharges
} from '../services/googleSheetsService';

export const useFreightData = () => {
  const [data, setData] = useState({
    zoneChart: [],
    rateCharts: {},
    fscData: [],
    interiorDeliveryCharges: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [zoneChart, rateCharts, fscData, interiorDeliveryCharges] = await Promise.all([
          fetchZoneChart(),
          fetchRateCharts(),
          fetchFSCData(),
          fetchInteriorDeliveryCharges()
        ]);

        setData({
          zoneChart,
          rateCharts,
          fscData,
          interiorDeliveryCharges
        });
      } catch (err) {
        setError(err.message);
        console.error('Error loading freight data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  const refreshData = () => {
    setLoading(true);
    setError(null);
    loadAllData();
  };

  return { data, loading, error, refreshData };
};