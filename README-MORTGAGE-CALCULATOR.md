# Mortgage Calculator Block - Setup and Usage Guide

## Overview

The Mortgage Calculator block is a dynamic, interactive component that allows users to calculate mortgage payments based on property value, mortgage amount, and term. It integrates with a GraphQL endpoint to fetch real-time mortgage offers and provides a user-friendly interface for mortgage calculations.

## How It Works

### 1. Core Functionality

The calculator consists of three main components:
- **Input Form**: Property value, mortgage amount, and term inputs
- **Calculation Engine**: JavaScript-based mortgage calculation logic
- **Results Display**: Dynamic display of calculated payments and available mortgage offers

### 2. Data Flow

1. **User Input**: Users enter property value, mortgage amount, and term
2. **API Call**: Calculator calls GraphQL endpoint with user parameters
3. **Data Processing**: Mortgage offers are filtered and sorted by interest rate
4. **Calculation**: Monthly payments calculated using selected mortgage rate
5. **Display**: Results shown with interactive mortgage option selection

### 3. Key Features

- **Real-time Calculations**: Updates as users type
- **Comma Formatting**: Automatically formats currency inputs (e.g., 1,000,000)
- **Mortgage Selection**: Click any mortgage option to select and recalculate
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Graceful fallback for API failures

## Technical Implementation

### File Structure

```
blocks/mortgage-calculator/
├── mortgage-calculator.html    # Container div (minimal)
├── mortgage-calculator.css     # Styling and responsive design
├── mortgage-calculator.js      # Core logic and calculations
└── demo.html                   # Test page for development
```

### Core Classes

#### MortgageCalculator Class
- **Constructor**: Initializes calculator with GraphQL endpoint
- **Input Validation**: Ensures values are within acceptable ranges
- **API Integration**: Fetches mortgage offers from GraphQL
- **Calculation Engine**: Computes monthly payments and total costs

#### Key Methods
- `fetchMortgageOptions()`: Calls GraphQL API
- `calculateBasicMortgage()`: Computes payment calculations
- `selectMortgageOption()`: Handles mortgage selection
- `formatCurrencyInput()`: Formats number inputs with commas

### GraphQL Integration

**Endpoint**: `https://publish-p147324-e1509924.adobeaemcloud.com/graphql/execute.json/global/mortgageFixed`

**Request Method**: GET with query parameters
- `propertyValue`: Property purchase price
- `mortgageAmount`: Mortgage loan amount
- `mortgageTerm`: Loan term in years
- `ltv`: Loan-to-value ratio (calculated automatically)

**Response Structure**:
```json
{
  "data": {
    "mortgageOfferList": {
      "items": [
        {
          "title": "Mortgage Product Name",
          "interestRate": "4.85%",
          "aprc": "5.2%",
          "productFee": "£999",
          "maxLoanToValue": "95%",
          "earlyRepaymentCharge": "5%",
          "monthlyPayment": "£1,234",
          "features": ["Feature 1", "Feature 2"],
          "ctaText": "Apply Now",
          "ctaLink": "/apply"
        }
      ]
    }
  }
}
```

## AEM Setup Requirements

### 1. Content Fragment Model

Create a Content Fragment Model named `cbs-mortgage` under:
```
/conf/global/settings/dam/cfm/models
```

**Required Fields**:
- `title` (Text) - Mortgage product name
- `interestRate` (Text) - Interest rate percentage
- `aprc` (Text) - Annual Percentage Rate of Charge
- `productFee` (Text) - Product fee amount
- `maxLoanToValue` (Text) - Maximum LTV percentage
- `earlyRepaymentCharge` (Text) - Early repayment charge
- `monthlyPayment` (Text) - Example monthly payment
- `features` (Text Array) - Product features
- `ctaText` (Text) - Call-to-action button text
- `ctaLink` (Text) - Call-to-action URL

### 2. Content Fragments

Create Content Fragments under `/content/dam/cbs/` for each mortgage product:

**Example Structure**:
```
/content/dam/cbs/
├── ftb-4-85-fixed/
│   ├── .content.xml
│   └── ftb-4-85-fixed.json
├── ftb-4-70-fixed/
│   ├── .content.xml
│   └── ftb-4-70-fixed.json
└── [additional products...]
```

### 3. GraphQL Schema

Ensure your GraphQL schema includes the `mortgageOfferList` query with the required fields. The schema should support:

```graphql
query MortgageOffers($propertyValue: Float!, $mortgageAmount: Float!, $mortgageTerm: Int!, $ltv: Float!) {
  mortgageOfferList(propertyValue: $propertyValue, mortgageAmount: $mortgageAmount, mortgageTerm: $mortgageTerm, ltv: $ltv) {
    items {
      title
      interestRate
      aprc
      productFee
      maxLoanToValue
      earlyRepaymentCharge
      monthlyPayment
      features
      ctaText
      ctaLink
    }
  }
}
```

### 4. AEM Page Configuration

#### Block Configuration
1. Add the `mortgage-calculator` block to your AEM page
2. Ensure the block has access to the required CSS and JavaScript files
3. Verify the GraphQL endpoint is accessible from your AEM instance

#### CSS and JavaScript Loading
Ensure these files are loaded on pages using the calculator:
- `blocks/mortgage-calculator/mortgage-calculator.css`
- `blocks/mortgage-calculator/mortgage-calculator.js`

### 5. Permissions and Access

**Required Permissions**:
- Read access to Content Fragments
- Execute permissions for GraphQL queries
- Access to the mortgage calculator block

**User Groups**:
- Content authors: Create/edit mortgage products
- End users: Access calculator functionality

## Deployment

### 1. Package Structure

Create an AEM content package with:
```
cbs-mortgage-calculator/
├── META-INF/
│   ├── MANIFEST.MF
│   └── vault/
│       ├── filter.xml
│       └── properties.xml
├── jcr_root/
│   ├── conf/global/settings/dam/cfm/models/
│   ├── content/dam/cbs/
│   └── apps/[your-project]/blocks/mortgage-calculator/
└── README.md
```

**Filter.xml Contents:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:vlt="http://jackrabbit.apache.org/vault/1.0">
    <vlt:filter>
        <!-- Configuration Settings -->
        <vlt:root path="/conf/global/settings/graphql/persistentQueries/mortgageFixed"/>
        <vlt:root path="/conf/cbsx"/>
        <vlt:root path="/conf/global/settings/dam/cfm/models/mortgage-offer"/>
        
        <!-- Content and Assets -->
        <vlt:root path="/content/cq%3Agraphql/global/endpoint"/>
        <vlt:root path="/content/dam/cbs"/>
        <vlt:root path="/content/dam/cbsx"/>
        <vlt:root path="/content/cbsx"/>
    </vlt:filter>
</jcr:root>
```

**Package Contents Breakdown:**

**Configuration (`/conf`):**
- `/conf/global/settings/graphql/persistentQueries/mortgageFixed` - GraphQL persistent query for mortgage data
- `/conf/cbsx` - CBSX project configuration settings
- `/conf/global/settings/dam/cfm/models/mortgage-offer` - Content Fragment Model for mortgage offers

**Content (`/content`):**
- `/content/cq%3Agraphql/global/endpoint` - Global GraphQL endpoint configuration
- `/content/dam/cbs` - CBS Digital Asset Management content
- `/content/dam/cbsx` - CBSX Digital Asset Management content
- `/content/cbsx` - CBSX content pages and structure

### 2. Installation Steps

1. **Upload Package**: Install the content package via AEM Package Manager
2. **Verify Models**: Check Content Fragment Models are created
3. **Create Fragments**: Add mortgage product content fragments
4. **Test GraphQL**: Verify GraphQL endpoint returns expected data
5. **Add to Pages**: Include the block on relevant mortgage pages

## Configuration Options

### Calculator Settings

**Input Validation**:
- Maximum property value: £1,000,000
- Maximum mortgage amount: £1,000,000
- Term range: 1-40 years

**Default Values**:
- Default interest rate: 4.85% (fallback)
- Default term: 25 years

### Styling Customization

The calculator uses CSS custom properties for easy theming:
```css
:root {
  --primary-color: #1e3a8a;
  --secondary-color: #f0f4ff;
  --border-radius: 12px;
  --shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}
```

## Troubleshooting

### Common Issues

1. **GraphQL Connection Errors**
   - Verify endpoint URL is correct
   - Check network connectivity
   - Verify GraphQL schema permissions

2. **Content Fragment Issues**
   - Ensure model fields match GraphQL schema
   - Verify content fragment permissions
   - Check content fragment model is published

3. **Calculation Errors**
   - Verify input validation is working
   - Check console for JavaScript errors
   - Ensure mortgage options are loading

### Debug Mode

Enable debug logging by checking browser console for:
- API response data
- Calculation steps
- User input validation
- Mortgage option processing

## Performance Considerations

### Optimization Tips

1. **Lazy Loading**: Calculator initializes only when block is visible
2. **Debounced Input**: API calls are throttled to prevent excessive requests
3. **Caching**: Consider implementing response caching for mortgage offers
4. **CDN**: Serve static assets (CSS/JS) from CDN for better performance

### Monitoring

Monitor these metrics:
- GraphQL response times
- Calculator usage statistics
- Error rates and types
- User interaction patterns

## Future Enhancements

### Potential Improvements

1. **Advanced Filters**: Add filters for mortgage type, features, etc.
2. **Comparison Tools**: Allow side-by-side mortgage comparisons
3. **Save Results**: Enable users to save calculation results
4. **Email Integration**: Send calculation results via email
5. **Mobile App**: Native mobile application version

### Integration Opportunities

1. **CRM Systems**: Connect with customer relationship management
2. **Application Process**: Direct integration with mortgage applications
3. **Analytics**: Enhanced user behavior tracking
4. **Personalization**: User-specific mortgage recommendations

## Support and Maintenance

### Regular Tasks

1. **Content Updates**: Keep mortgage offers current
2. **Rate Monitoring**: Verify interest rates are accurate
3. **Performance Testing**: Regular load testing
4. **Security Updates**: Keep dependencies updated

### Contact Information

For technical support or questions about the mortgage calculator:
- **Development Team**: [Your Team Contact]
- **AEM Support**: [AEM Support Contact]
- **Documentation**: [Link to Additional Docs]

---

**Version**: 1.0  
**Last Updated**: [Current Date]  
**AEM Version**: 6.5+  
**Browser Support**: Chrome, Firefox, Safari, Edge (latest versions)
