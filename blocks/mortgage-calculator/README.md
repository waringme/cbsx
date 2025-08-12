# Mortgage Calculator Block

A professional mortgage calculator block designed to match the Coventry Building Society (CBS) aesthetic, with GraphQL integration to fetch real mortgage options.

## 🎯 Overview

This mortgage calculator block provides a comprehensive solution for calculating mortgage payments and displaying available mortgage options. It's designed to integrate seamlessly with AEM pages and standalone websites, featuring a responsive design that matches the CBS brand guidelines.

## ✨ Features

- **🎯 GraphQL Integration**: Calls the specified GraphQL endpoint to fetch real mortgage options
- **🧮 Smart Calculations**: Automatically calculates deposit amount and provides basic mortgage payment calculations
- **📱 Responsive Design**: Mobile-first design that works perfectly on all devices
- **🎨 CBS Branding**: Matches the Coventry Building Society design aesthetic
- **⚡ Real-time Updates**: Auto-calculates deposit and provides instant feedback
- **🔄 Fallback Options**: Provides fallback mortgage options if the GraphQL endpoint is unavailable
- **✅ Input Validation**: Comprehensive validation with user-friendly error messages
- **🔄 Loading States**: Visual feedback during calculations and API calls

## 🚀 Quick Start

### 1. Include the Files

Add the following files to your project:

```html
<link rel="stylesheet" href="mortgage-calculator.css">
<script src="mortgage-calculator.js"></script>
```

### 2. Add the HTML Structure

Copy the HTML structure from `mortgage-calculator.html` into your page.

### 3. Initialize the Calculator

The calculator automatically initializes when the DOM is loaded, but you can also manually initialize it:

```javascript
const calculator = new MortgageCalculator();
```

## 📁 File Structure

```
mortgage-calculator/
├── mortgage-calculator.html      # HTML structure for the block
├── mortgage-calculator.css       # Styling and responsive design
├── mortgage-calculator.js        # JavaScript functionality
├── demo.html                     # Demo page for testing
└── README.md                     # This documentation
```

## 🔧 Configuration

### GraphQL Endpoint

The calculator is configured to call the following endpoint:

```
https://publish-p147324-e1509924.adobeaemcloud.com/graphql/execute.json/global/mortgageFixed
```

### Customizing the Endpoint

To change the GraphQL endpoint, modify the `graphqlEndpoint` property in the `MortgageCalculator` class:

```javascript
class MortgageCalculator {
  constructor() {
    this.graphqlEndpoint = 'YOUR_NEW_ENDPOINT_URL';
    this.init();
  }
}
```

## 📊 GraphQL Query Structure

The calculator sends the following GraphQL query:

```graphql
query GetMortgageOptions($propertyValue: Float!, $mortgageAmount: Float!, $mortgageTerm: Int!, $ltv: Float!) {
  mortgageOptions(
    propertyValue: $propertyValue
    mortgageAmount: $mortgageAmount
    mortgageTerm: $mortgageTerm
    ltv: $ltv
  ) {
    id
    title
    interestRate
    rateType
    ratePeriod
    followOnRate
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
```

## 🎨 Customization

### Styling

The calculator uses CSS custom properties and modern CSS features. You can customize the appearance by modifying the CSS variables or overriding specific styles.

### Brand Colors

The default color scheme uses CBS brand colors:

- Primary: `#1e3a8a` (Dark Blue)
- Secondary: `#1e40af` (Lighter Blue)
- Accent: `#f60077` (Burgundy)

### Responsive Breakpoints

- Mobile: `< 480px`
- Tablet: `< 768px`
- Desktop: `≥ 768px`

## 🔌 API Methods

### Public Methods

- `calculateMortgage()` - Triggers the main calculation process
- `calculateSpecificOption(optionId)` - Calculates a specific mortgage option
- `showError(message)` - Displays an error message
- `hideError()` - Hides the error message
- `showResults()` - Shows the calculation results
- `hideResults()` - Hides the calculation results

### Event Handling

The calculator automatically handles:

- Form input changes
- Calculate button clicks
- Close results button clicks
- Input validation
- API error handling

## 📱 Responsive Features

- **Mobile-First Design**: Optimized for mobile devices
- **Flexible Grid Layouts**: Uses CSS Grid for responsive layouts
- **Touch-Friendly Interface**: Large touch targets for mobile users
- **Adaptive Typography**: Font sizes that scale appropriately
- **Collapsible Sections**: Results can be hidden/shown as needed

## 🧪 Testing

### Demo Page

Open `demo.html` in a web browser to test the calculator functionality.

### Test Scenarios

1. **Valid Inputs**: Enter valid property value, mortgage amount, and term
2. **Invalid Inputs**: Test validation with invalid or missing data
3. **Edge Cases**: Test with minimum/maximum values
4. **Responsive Design**: Test on different screen sizes
5. **Error Handling**: Test with network errors or invalid responses

## 🚨 Error Handling

The calculator includes comprehensive error handling:

- **Input Validation**: Ensures all required fields are valid
- **API Error Handling**: Graceful fallback if GraphQL endpoint fails
- **Network Error Handling**: User-friendly messages for connection issues
- **Fallback Options**: Provides default mortgage options if API is unavailable

## 🔒 Security Considerations

- **Input Sanitization**: All user inputs are validated and sanitized
- **XSS Prevention**: Uses safe DOM manipulation methods
- **CORS Handling**: Proper error handling for cross-origin requests
- **Data Validation**: Server-side validation should be implemented for production use

## 🌐 Browser Support

- **Chrome**: 60+
- **Firefox**: 55+
- **Safari**: 12+
- **Edge**: 79+
- **Internet Explorer**: Not supported

## 📈 Performance

- **Lazy Loading**: Results are only calculated when needed
- **Efficient DOM Updates**: Minimal DOM manipulation
- **Optimized Calculations**: Efficient mathematical operations
- **Debounced Input**: Prevents excessive API calls during typing

## 🔄 Updates and Maintenance

### Version History

- **v1.0.0**: Initial release with GraphQL integration
- **v1.0.1**: Added fallback options and improved error handling

### Future Enhancements

- Additional mortgage calculation methods
- Integration with more financial APIs
- Enhanced filtering and sorting options
- Accessibility improvements
- Internationalization support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

1. Check the demo page for examples
2. Review the JavaScript console for error messages
3. Verify the GraphQL endpoint is accessible
4. Ensure all required files are included

## 📚 Additional Resources

- [Coventry Building Society Mortgages](https://coventrybuildingsociety.co.uk/member/mortgages/first-time-buyer.html)
- [GraphQL Documentation](https://graphql.org/)
- [CSS Grid Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [Modern JavaScript Features](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

---

**Note**: This calculator is designed for demonstration and educational purposes. For production use, ensure proper security measures, input validation, and compliance with financial regulations. 