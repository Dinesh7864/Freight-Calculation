# Freight Cost Comparison System

A React-based web application that fetches freight pricing data from Google Sheets and calculates shipping costs for DHL, FedEx, and UPS carriers.

## Features

- **Dynamic Data Loading**: Fetches real-time data from Google Sheets
- **Multi-Carrier Comparison**: Compare costs across DHL, FedEx, and UPS
- **Zone-Based Pricing**: Automatic zone detection based on country and carrier
- **Dynamic FSC Calculation**: Uses current fuel surcharge percentages based on date ranges
- **Comprehensive Cost Breakdown**: Detailed breakdown of all cost components
- **Responsive Design**: Works on desktop and mobile devices

## Google Sheets Setup

### Required Sheets Structure

#### 1. Zone Chart
**Columns**: Country, Carrier, Zone
```
Country | Carrier | Zone
USA     | DHL     | 1
USA     | FEDEX   | 2
USA     | UPS     | 1
UK      | DHL     | 2
```

#### 2. Rate Charts (3 separate sheets)
**Files**: UPS Rate Chart, DHL Rate Chart, FedEx Rate Chart
**Structure**:
- First row: Weight, Zone 1, Zone 2, Zone 3, Zone 4, Zone 5
- Weight column: 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 12.0, 14.0, 16.0, 18.0, 20.0, 25.0, 30.0, 35.0, 40.0, 45.0, 50.0, 60.0, 70.0, 80.0, 90.0, 100.0, 150.0, 200.0, 250.0, 300.0, 400.0, 500.0, 600.0, 700.0, 800.0, 900.0, 1000.0
- Zone columns: corresponding rates for each weight-zone combination

#### 3. FSC (Fuel Surcharge)
**Columns**: Carrier, Starting Date, End Date, FSC %
```
Carrier | Starting Date | End Date   | FSC %
DHL     | 2024-01-01    | 2024-03-31 | 15.5
FEDEX   | 2024-01-01    | 2024-03-31 | 14.2
UPS     | 2024-01-01    | 2024-03-31 | 16.0
```

#### 4. Interior Delivery Charges
**Columns**: Country, Amount
```
Country | Amount
USA     | 1000
UK      | 1200
Germany | 1100
```

#### 5. Customs Clearance (Fixed in Code)
- DHL: 4000
- FedEx: 2000
- UPS: 2750

## Setup Instructions

### 1. Google Sheets API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API
4. Create credentials (API Key)
5. Restrict the API key to Google Sheets API only

### 2. Prepare Your Google Sheets

1. Create the required sheets with the structures mentioned above
2. Make sure all sheets are publicly readable or shared with your service account
3. Get the Sheet IDs from the URLs (the long string between `/d/` and `/edit`)

### 3. Environment Configuration

1. Copy `.env.example` to `.env`
2. Fill in your Google Sheets API key and Sheet IDs:

```env
VITE_GOOGLE_SHEETS_API_KEY=your_api_key_here
VITE_ZONE_CHART_SHEET_ID=your_zone_chart_sheet_id
VITE_UPS_RATES_SHEET_ID=your_ups_rates_sheet_id
VITE_DHL_RATES_SHEET_ID=your_dhl_rates_sheet_id
VITE_FEDEX_RATES_SHEET_ID=your_fedex_rates_sheet_id
VITE_FSC_SHEET_ID=your_fsc_sheet_id
VITE_INTERIOR_DELIVERY_SHEET_ID=your_interior_delivery_sheet_id
```

### 4. Installation and Running

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Cost Calculation Logic

The application calculates freight costs using the following components:

1. **Base Air Freight**: Weight × Rate (from rate chart based on zone)
2. **Demand Surcharge**: 10% of air freight
3. **Over Dimension Charges**: User-specified per carrier
4. **Over Weight Charges**: User-specified per carrier
5. **Interior Delivery**: Based on destination country
6. **Fuel Surcharge (FSC)**: Dynamic percentage applied to freight components
7. **Customs Clearance**: Fixed per carrier
8. **GST**: 18% of total freight
9. **Business Cushion**: 13% markup on freight + GST

## Features

- **Real-time Data**: Automatically fetches latest data from Google Sheets
- **Fallback Data**: Uses mock data if Google Sheets are unavailable
- **Error Handling**: Comprehensive error handling and user feedback
- **Responsive Design**: Works on all device sizes
- **Data Refresh**: Manual refresh button to reload data
- **Loading States**: Clear loading indicators during data fetching

## Troubleshooting

### Common Issues

1. **"Failed to fetch data"**: Check your API key and sheet IDs
2. **"Sheet not found"**: Ensure sheets are publicly readable
3. **"Invalid data format"**: Verify sheet structures match requirements
4. **"FSC not found"**: Check date ranges in FSC sheet

### Data Validation

The application includes validation for:
- Required form fields
- Positive numbers for weights and charges
- Date range validation for FSC
- Zone and country lookups

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.