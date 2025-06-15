import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Grid, 
  FormControlLabel,
  Switch,
  Button,
  Box,
  Alert,
  Card,
  CardContent,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  Backdrop,
} from '@mui/material';
import {
  LocalShipping,
  Flight,
  Warning,
  Info,
  Calculate,
  CompareArrows,
  LocalAtm,
  AddBox,
  AccountBalance,
  Refresh,
  CloudDownload,
} from '@mui/icons-material';
import { useFreightData } from './hooks/useFreightData';
import {
  getCurrentFSC,
  getZoneForCountryCarrier,
  getRateForWeightZone,
  getInteriorDeliveryCharge,
  getCustomsClearanceCharge
} from './services/googleSheetsService';
import './App.css';

function App() {
  const [showOverDimension, setShowOverDimension] = useState(false);
  const [showOverWeight, setShowOverWeight] = useState(false);
  const [calculationResult, setCalculationResult] = useState(null);
  const [error, setError] = useState(null);

  const { data: freightData, loading: dataLoading, error: dataError, refreshData } = useFreightData();

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      uniqueId: '',
      company: '',
      customerName: '',
      country: '',
      currency: '',
      productValue: '',
      weight: '',
      fedExOverDimension: '',
      dhlOverDimension: '',
      upsOverDimension: '',
      fedExOverWeight: '',
      dhlOverWeight: '',
      upsOverWeight: ''
    }
  });

  const onSubmit = async (data) => {
    try {
      setError(null);
      
      if (!freightData.zoneChart.length || !Object.keys(freightData.rateCharts).length) {
        throw new Error('Freight data not loaded. Please wait or refresh the data.');
      }

      const calculation = {
        fedEx: calculateCarrierCosts(data, 'FEDEX'),
        dhl: calculateCarrierCosts(data, 'DHL'),
        ups: calculateCarrierCosts(data, 'UPS')
      };
      
      setCalculationResult(calculation);
    } catch (err) {
      setError(err.message);
      console.error('Calculation error:', err);
    }
  };

  const calculateCarrierCosts = (data, carrier) => {
    const weight = parseFloat(data.weight);
    const country = data.country;

    // Get zone for this carrier and country
    const zone = getZoneForCountryCarrier(freightData.zoneChart, country, carrier);
    
    // Get base rate from rate chart
    const baseRate = getRateForWeightZone(freightData.rateCharts[carrier], weight, zone);
    
    // Calculate air freight amount
    const amountAirFreight = weight * baseRate;
    
    // Demand surcharge (example: 10% of air freight)
    const demandSurcharge = amountAirFreight * 0.1;
    
    // Over dimension charges
    const overDimension = carrier === 'FEDEX' ? parseFloat(data.fedExOverDimension || 0) :
                         carrier === 'DHL' ? parseFloat(data.dhlOverDimension || 0) :
                         parseFloat(data.upsOverDimension || 0);

    // Over weight charges
    const overWeight = carrier === 'FEDEX' ? parseFloat(data.fedExOverWeight || 0) :
                      carrier === 'DHL' ? parseFloat(data.dhlOverWeight || 0) :
                      parseFloat(data.upsOverWeight || 0);

    // Interior delivery charge based on country
    const interiorDeliveryCharge = getInteriorDeliveryCharge(freightData.interiorDeliveryCharges, country);
    
    // Customs clearance charge
    const customsClearance = getCustomsClearanceCharge(carrier);

    // FSC calculation using current FSC percentage
    const fscRate = getCurrentFSC(freightData.fscData, carrier);
    const fscAmount = (amountAirFreight + demandSurcharge + overDimension + overWeight + interiorDeliveryCharge) * fscRate;
    
    // Total freight calculation
    const totalFreight = amountAirFreight + demandSurcharge + overDimension + 
                        overWeight + interiorDeliveryCharge + fscAmount + customsClearance;
    
    // GST and cushion
    const gst = totalFreight * 0.18;
    const cushion = (totalFreight + gst) * 0.13;
    const finalTotal = totalFreight + gst + cushion;

    return {
      zone,
      baseRate,
      amountAirFreight,
      demandSurcharge,
      overDimension,
      overWeight,
      interiorDeliveryCharge,
      fscAmount,
      fscRate: fscRate * 100, // Convert to percentage for display
      customsClearance,
      totalFreight,
      gst,
      cushion,
      finalTotal,
      convertedAmount: finalTotal
    };
  };

  const carrierColors = {
    fedEx: '#4a148c',
    dhl: '#ffcc00',
    ups: '#351c15'
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (dataLoading) {
    return (
      <Backdrop open={true} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress color="inherit" size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading freight data from Google Sheets...
          </Typography>
        </Box>
      </Backdrop>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          borderRadius: 2,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LocalShipping sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              Freight Cost Comparison
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Data loaded from Google Sheets">
              <CloudDownload sx={{ color: 'success.main' }} />
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={refreshData}
              size="small"
            >
              Refresh Data
            </Button>
          </Box>
        </Box>
        
        {(error || dataError) && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            icon={<Warning fontSize="inherit" />}
          >
            {error || dataError}
          </Alert>
        )}

        {!dataLoading && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Data Status:</strong> Zone Chart ({freightData.zoneChart.length} entries), 
              Rate Charts ({Object.keys(freightData.rateCharts).length} carriers), 
              FSC Data ({freightData.fscData.length} entries), 
              Interior Delivery ({freightData.interiorDeliveryCharges.length} countries)
            </Typography>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box className="form-section">
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Flight sx={{ mr: 1 }} /> Basic Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="uniqueId"
                  control={control}
                  rules={{ required: 'Unique ID is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Unique ID"
                      error={!!errors.uniqueId}
                      helperText={errors.uniqueId?.message}
                      InputProps={{
                        startAdornment: (
                          <Info sx={{ color: 'action.active', mr: 1 }} fontSize="small" />
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="company"
                  control={control}
                  rules={{ required: 'Company is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Company"
                      error={!!errors.company}
                      helperText={errors.company?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="customerName"
                  control={control}
                  rules={{ required: 'Customer Name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Customer Name"
                      error={!!errors.customerName}
                      helperText={errors.customerName?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="country"
                  control={control}
                  rules={{ required: 'Country is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Country"
                      error={!!errors.country}
                      helperText={errors.country?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="currency"
                  control={control}
                  rules={{ required: 'Currency is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Currency"
                      error={!!errors.currency}
                      helperText={errors.currency?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="productValue"
                  control={control}
                  rules={{ 
                    required: 'Product Value is required',
                    min: { value: 0, message: 'Value must be positive' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Product Value"
                      type="number"
                      error={!!errors.productValue}
                      helperText={errors.productValue?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="weight"
                  control={control}
                  rules={{ 
                    required: 'Weight is required',
                    min: { value: 0, message: 'Weight must be positive' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Weight (kg)"
                      type="number"
                      error={!!errors.weight}
                      helperText={errors.weight?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>

          <Box className="form-section">
            <Typography variant="h6" gutterBottom>Additional Charges</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showOverDimension}
                      onChange={(e) => setShowOverDimension(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography>Over Dimension Charges</Typography>
                      <Tooltip title="Additional charges for oversized packages">
                        <IconButton size="small">
                          <Info fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                />
              </Grid>

              {showOverDimension && (
                <>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="fedExOverDimension"
                      control={control}
                      rules={{ min: { value: 0, message: 'Must be positive' } }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="FedEx Over Dimension"
                          type="number"
                          error={!!errors.fedExOverDimension}
                          helperText={errors.fedExOverDimension?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="dhlOverDimension"
                      control={control}
                      rules={{ min: { value: 0, message: 'Must be positive' } }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="DHL Over Dimension"
                          type="number"
                          error={!!errors.dhlOverDimension}
                          helperText={errors.dhlOverDimension?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="upsOverDimension"
                      control={control}
                      rules={{ min: { value: 0, message: 'Must be positive' } }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="UPS Over Dimension"
                          type="number"
                          error={!!errors.upsOverDimension}
                          helperText={errors.upsOverDimension?.message}
                        />
                      )}
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showOverWeight}
                      onChange={(e) => setShowOverWeight(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography>Over Weight Charges</Typography>
                      <Tooltip title="Additional charges for overweight packages">
                        <IconButton size="small">
                          <Info fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                />
              </Grid>

              {showOverWeight && (
                <>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="fedExOverWeight"
                      control={control}
                      rules={{ min: { value: 0, message: 'Must be positive' } }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="FedEx Over Weight"
                          type="number"
                          error={!!errors.fedExOverWeight}
                          helperText={errors.fedExOverWeight?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="dhlOverWeight"
                      control={control}
                      rules={{ min: { value: 0, message: 'Must be positive' } }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="DHL Over Weight"
                          type="number"
                          error={!!errors.dhlOverWeight}
                          helperText={errors.dhlOverWeight?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="upsOverWeight"
                      control={control}
                      rules={{ min: { value: 0, message: 'Must be positive' } }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="UPS Over Weight"
                          type="number"
                          error={!!errors.upsOverWeight}
                          helperText={errors.upsOverWeight?.message}
                        />
                      )}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              startIcon={<Calculate />}
              disabled={dataLoading}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                fontSize: '1.1rem',
                textTransform: 'none',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 8px rgba(0, 0, 0, 0.2)',
                },
              }}
            >
              Calculate Costs
            </Button>
          </Box>
        </form>

        {calculationResult && (
          <Box sx={{ mt: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <CompareArrows sx={{ fontSize: 30, mr: 2, color: 'primary.main' }} />
              <Typography variant="h5">Comparison Results</Typography>
            </Box>
            <Grid container spacing={3}>
              {['fedEx', 'dhl', 'ups'].map((carrier) => (
                <Grid item xs={12} md={4} key={carrier}>
                  <Card 
                    className="carrier-card"
                    sx={{ 
                      height: '100%',
                      position: 'relative',
                      overflow: 'visible',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        backgroundColor: carrierColors[carrier],
                      }
                    }}
                  >
                    <CardContent>
                      <div className="carrier-header">
                        <Typography variant="h6" sx={{ color: carrierColors[carrier] }}>
                          {carrier.toUpperCase()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Zone: {calculationResult[carrier].zone} | Base Rate: ₹{calculationResult[carrier].baseRate}/kg
                        </Typography>
                      </div>
                      
                      <div className="cost-category base">
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <LocalAtm sx={{ mr: 1, color: '#4caf50' }} />
                          <Typography variant="subtitle1" color="text.secondary">
                            Base Charges
                          </Typography>
                        </Box>
                        <div className="cost-item">
                          <Typography>
                            Air Freight: {formatCurrency(calculationResult[carrier].amountAirFreight)}
                          </Typography>
                        </div>
                        <div className="cost-item">
                          <Typography>
                            Demand Surcharge: {formatCurrency(calculationResult[carrier].demandSurcharge)}
                          </Typography>
                        </div>
                      </div>

                      <div className="cost-category additional">
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <AddBox sx={{ mr: 1, color: '#2196f3' }} />
                          <Typography variant="subtitle1" color="text.secondary">
                            Additional Charges
                          </Typography>
                        </Box>
                        <div className="cost-item">
                          <Typography>
                            Over Dimension: {formatCurrency(calculationResult[carrier].overDimension)}
                          </Typography>
                        </div>
                        <div className="cost-item">
                          <Typography>
                            Over Weight: {formatCurrency(calculationResult[carrier].overWeight)}
                          </Typography>
                        </div>
                        <div className="cost-item">
                          <Typography>
                            Interior Delivery: {formatCurrency(calculationResult[carrier].interiorDeliveryCharge)}
                          </Typography>
                        </div>
                        <div className="cost-item">
                          <Typography>
                            FSC ({calculationResult[carrier].fscRate.toFixed(1)}%): {formatCurrency(calculationResult[carrier].fscAmount)}
                          </Typography>
                        </div>
                        <div className="cost-item">
                          <Typography>
                            Customs: {formatCurrency(calculationResult[carrier].customsClearance)}
                          </Typography>
                        </div>
                      </div>

                      <div className="cost-category total">
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <AccountBalance sx={{ mr: 1, color: '#f44336' }} />
                          <Typography variant="subtitle1" color="text.secondary">
                            Total Breakdown
                          </Typography>
                        </Box>
                        <div className="cost-item">
                          <Typography>
                            Freight: {formatCurrency(calculationResult[carrier].totalFreight)}
                          </Typography>
                        </div>
                        <div className="cost-item">
                          <Typography>
                            GST (18%): {formatCurrency(calculationResult[carrier].gst)}
                          </Typography>
                        </div>
                        <div className="cost-item">
                          <Typography>
                            Cushion (13%): {formatCurrency(calculationResult[carrier].cushion)}
                          </Typography>
                        </div>
                      </div>

                      <Box className="total-section">
                        <Typography variant="h6" sx={{ color: carrierColors[carrier], mb: 1 }}>
                          Final Total
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                          {formatCurrency(calculationResult[carrier].finalTotal)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default App;