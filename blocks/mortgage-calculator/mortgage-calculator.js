/**
 * Mortgage Calculator Block
 * Calls GraphQL endpoint to get mortgage options and calculates payments
 */

class MortgageCalculator {
  constructor() {
    this.graphqlEndpoint = 'https://publish-p147324-e1509924.adobeaemcloud.com/graphql/execute.json/global/mortgageFixed';
    this.init();
  }

  init() {
    this.bindEvents();
    this.setupAutoCalculation();
  }

  bindEvents() {
    // Calculate button
    const calculateBtn = document.getElementById('calculate-mortgage');
    if (calculateBtn) {
      calculateBtn.addEventListener('click', () => this.calculateMortgage());
    }

    // Close results button
    const closeResultsBtn = document.getElementById('close-results');
    if (closeResultsBtn) {
      closeResultsBtn.addEventListener('click', () => this.hideResults());
    }

    // Input fields for auto-calculation
    const propertyValueInput = document.getElementById('property-value');
    const mortgageAmountInput = document.getElementById('mortgage-amount');
    
    if (propertyValueInput) {
      propertyValueInput.addEventListener('input', () => this.updateDeposit());
    }
    
    if (mortgageAmountInput) {
      mortgageAmountInput.addEventListener('input', () => this.updateDeposit());
    }
  }

  setupAutoCalculation() {
    // Auto-calculate deposit when property value or mortgage amount changes
    this.updateDeposit();
  }

  updateDeposit() {
    const propertyValue = parseFloat(document.getElementById('property-value').value) || 0;
    const mortgageAmount = parseFloat(document.getElementById('mortgage-amount').value) || 0;
    const depositAmount = propertyValue - mortgageAmount;
    
    const depositInput = document.getElementById('deposit-amount');
    if (depositInput) {
      depositInput.value = depositAmount > 0 ? depositAmount.toLocaleString() : '0';
    }
  }

  async calculateMortgage() {
    const propertyValue = parseFloat(document.getElementById('property-value').value);
    const mortgageAmount = parseFloat(document.getElementById('mortgage-amount').value);
    const mortgageTerm = parseInt(document.getElementById('mortgage-term').value);

    // Validation
    if (!this.validateInputs(propertyValue, mortgageAmount, mortgageTerm)) {
      return;
    }

    // Show loading state
    this.showLoading(true);

    try {
      // Get mortgage options from GraphQL endpoint
      const mortgageOptions = await this.fetchMortgageOptions(propertyValue, mortgageAmount, mortgageTerm);
      
      // Calculate basic mortgage details
      const calculations = this.calculateBasicMortgage(mortgageAmount, mortgageTerm);
      
      // Display results
      this.displayResults(calculations, mortgageOptions);
      
      // Hide error if it was showing
      this.hideError();
      
    } catch (error) {
      console.error('Mortgage calculation error:', error);
      this.showError('Unable to fetch mortgage options. Please try again.');
    } finally {
      this.showLoading(false);
    }
  }

  validateInputs(propertyValue, mortgageAmount, mortgageTerm) {
    if (!propertyValue || propertyValue <= 0) {
      this.showError('Please enter a valid property value.');
      return false;
    }

    if (!mortgageAmount || mortgageAmount <= 0) {
      this.showError('Please enter a valid mortgage amount.');
      return false;
    }

    if (mortgageAmount > propertyValue) {
      this.showError('Mortgage amount cannot exceed property value.');
      return false;
    }

    if (!mortgageTerm || mortgageTerm < 1 || mortgageTerm > 40) {
      this.showError('Please enter a valid mortgage term (1-40 years).');
      return false;
    }

    return true;
  }

  async fetchMortgageOptions(propertyValue, mortgageAmount, mortgageTerm) {
    try {
      // Calculate LTV (Loan to Value)
      const ltv = (mortgageAmount / propertyValue) * 100;
      
      // Prepare GraphQL query parameters
      const queryParams = {
        propertyValue: propertyValue,
        mortgageAmount: mortgageAmount,
        mortgageTerm: mortgageTerm,
        ltv: ltv
      };

      // Make request to GraphQL endpoint
      const response = await fetch(this.graphqlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: this.buildGraphQLQuery(queryParams)
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Process and return mortgage options
      return this.processMortgageOptions(data, ltv);
      
    } catch (error) {
      console.error('Error fetching mortgage options:', error);
      // Return fallback options if GraphQL fails
      return this.getFallbackMortgageOptions(ltv);
    }
  }

  buildGraphQLQuery(params) {
    // Build GraphQL query based on the endpoint requirements
    return `
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
    `;
  }

  processMortgageOptions(data, ltv) {
    // Process the GraphQL response data
    if (data && data.data && data.data.mortgageOptions) {
      return data.data.mortgageOptions.filter(option => {
        // Filter options based on LTV requirements
        const maxLTV = parseFloat(option.maxLoanToValue.replace('%', ''));
        return ltv <= maxLTV;
      }).sort((a, b) => {
        // Sort by interest rate (lowest first)
        const rateA = parseFloat(a.interestRate.replace('%', ''));
        const rateB = parseFloat(b.interestRate.replace('%', ''));
        return rateA - rateB;
      });
    }
    
    // Return fallback options if no data
    return this.getFallbackMortgageOptions(ltv);
  }

  getFallbackMortgageOptions(ltv) {
    // Fallback mortgage options if GraphQL fails
    const options = [
      {
        id: 'ftb-4-85-fixed',
        title: 'FTB 4.85% Fixed to 28.02.29',
        interestRate: '4.85%',
        rateType: 'Fixed',
        ratePeriod: 'Fixed Rate until 28.02.29',
        followOnRate: '6.94% Variable for remainder of term',
        aprc: '6.5%',
        productFee: '£0',
        maxLoanToValue: '90%',
        earlyRepaymentCharge: 'Yes',
        monthlyPayment: '£1,287.80',
        features: ['No ERC', 'New build property eligible', 'First time buyer exclusive'],
        ctaText: 'How to apply',
        ctaLink: '/member/mortgages/apply/first-time-buyer-4-85'
      },
      {
        id: 'ftb-4-70-fixed',
        title: 'FTB 4.70% Fixed to 28.02.31',
        interestRate: '4.70%',
        rateType: 'Fixed',
        ratePeriod: 'Fixed Rate until 28.02.31',
        followOnRate: '6.94% Variable for remainder of term',
        aprc: '6.1%',
        productFee: '£0',
        maxLoanToValue: '90%',
        earlyRepaymentCharge: 'Yes',
        monthlyPayment: '£1,245.60',
        features: ['No ERC', 'New build property eligible', 'First time buyer exclusive'],
        ctaText: 'How to apply',
        ctaLink: '/member/mortgages/apply/first-time-buyer-4-70'
      },
      {
        id: 'ftb-4-38-fixed',
        title: 'FTB 4.38% Fixed to 28.02.29',
        interestRate: '4.38%',
        rateType: 'Fixed',
        ratePeriod: 'Fixed Rate until 28.02.29',
        followOnRate: '6.94% Variable for remainder of term',
        aprc: '6.3%',
        productFee: '£0',
        maxLoanToValue: '75%',
        earlyRepaymentCharge: 'Yes',
        monthlyPayment: '£1,180.20',
        features: ['No ERC', 'New build property eligible', 'First time buyer exclusive'],
        ctaText: 'How to apply',
        ctaLink: '/member/mortgages/apply/first-time-buyer-4-38'
      }
    ];

    // Filter by LTV
    return options.filter(option => {
      const maxLTV = parseFloat(option.maxLoanToValue.replace('%', ''));
      return ltv <= maxLTV;
    });
  }

  calculateBasicMortgage(mortgageAmount, mortgageTerm) {
    // Basic mortgage calculation (simplified)
    const annualRate = 0.0485; // Using 4.85% as example
    const monthlyRate = annualRate / 12;
    const totalPayments = mortgageTerm * 12;
    
    // Monthly payment calculation
    const monthlyPayment = (mortgageAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                          (Math.pow(1 + monthlyRate, totalPayments) - 1);
    
    // Total calculations
    const totalAmount = monthlyPayment * totalPayments;
    const totalInterest = totalAmount - mortgageAmount;
    
    return {
      monthlyPayment: monthlyPayment,
      totalInterest: totalInterest,
      totalAmount: totalAmount
    };
  }

  displayResults(calculations, mortgageOptions) {
    // Update summary values
    document.getElementById('monthly-payment').textContent = `£${calculations.monthlyPayment.toFixed(2)}`;
    document.getElementById('total-interest').textContent = `£${calculations.totalInterest.toFixed(2)}`;
    document.getElementById('total-amount').textContent = `£${calculations.totalAmount.toFixed(2)}`;
    
    // Display mortgage options
    this.displayMortgageOptions(mortgageOptions);
    
    // Show results section
    document.getElementById('calculator-results').style.display = 'block';
    
    // Scroll to results
    document.getElementById('calculator-results').scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }

  displayMortgageOptions(options) {
    const optionsGrid = document.getElementById('options-grid');
    if (!optionsGrid) return;
    
    optionsGrid.innerHTML = '';
    
    options.forEach(option => {
      const optionElement = this.createMortgageOptionElement(option);
      optionsGrid.appendChild(optionElement);
    });
  }

  createMortgageOptionElement(option) {
    const optionDiv = document.createElement('div');
    optionDiv.className = 'mortgage-option';
    
    optionDiv.innerHTML = `
      <div class="option-header">
        <h6 class="option-title">${option.title}</h6>
        <div class="option-rate">
          <span class="rate-percentage">${option.interestRate}</span>
          <div class="rate-type">${option.rateType}</div>
        </div>
      </div>
      
      <div class="option-details">
        <div class="detail-item">
          <span class="detail-label">Rate</span>
          <span class="detail-value">${option.interestRate} ${option.ratePeriod}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Followed by</span>
          <span class="detail-value">${option.followOnRate}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">APRC</span>
          <span class="detail-value">${option.aprc}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Product fee</span>
          <span class="detail-value">${option.productFee}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Max loan to value</span>
          <span class="detail-value">${option.maxLoanToValue}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Early repayment charge</span>
          <span class="detail-value">${option.earlyRepaymentCharge}</span>
        </div>
      </div>
      
      <div class="option-actions">
        <button class="option-btn calculate-option-btn" onclick="mortgageCalculator.calculateSpecificOption('${option.id}')">
          Calculate monthly payment
        </button>
        <a href="${option.ctaLink}" class="option-btn apply-option-btn">
          ${option.ctaText}
        </a>
      </div>
    `;
    
    return optionDiv;
  }

  calculateSpecificOption(optionId) {
    // Calculate specific mortgage option
    const mortgageAmount = parseFloat(document.getElementById('mortgage-amount').value);
    const mortgageTerm = parseInt(document.getElementById('mortgage-term').value);
    
    if (mortgageAmount && mortgageTerm) {
      // This could call a more specific calculation API
      alert(`Calculating specific mortgage option: ${optionId}\n\nFor a more detailed calculation, please use the main calculator above.`);
    }
  }

  showLoading(show) {
    const calculateBtn = document.getElementById('calculate-mortgage');
    const btnText = calculateBtn.querySelector('.btn-text');
    const btnLoading = calculateBtn.querySelector('.btn-loading');
    
    if (show) {
      btnText.style.display = 'none';
      btnLoading.style.display = 'flex';
      calculateBtn.disabled = true;
    } else {
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
      calculateBtn.disabled = false;
    }
  }

  showError(message) {
    const errorDiv = document.getElementById('calculator-error');
    const errorText = document.getElementById('error-text');
    
    if (errorDiv && errorText) {
      errorText.textContent = message;
      errorDiv.style.display = 'block';
      
      // Scroll to error
      errorDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  hideError() {
    const errorDiv = document.getElementById('calculator-error');
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
  }

  hideResults() {
    const resultsDiv = document.getElementById('calculator-results');
    if (resultsDiv) {
      resultsDiv.style.display = 'none';
    }
  }
}

// Initialize mortgage calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  window.mortgageCalculator = new MortgageCalculator();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MortgageCalculator;
} 