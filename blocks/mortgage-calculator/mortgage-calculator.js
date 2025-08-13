/**
 * Mortgage Calculator Block
 * Calls GraphQL endpoint to get mortgage options and calculates payments
 */

function getMetadata(name) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = [...document.querySelectorAll(`meta[${attr}="${name}"]`)]
    .map((m) => m.content)
    .join(', ');
  return meta || '';
}

export default function decorate(block) {
  // Render the mortgage calculator HTML structure
  const calculatorHTML = `
    <div class="calculator-container">
      <div class="calculator-header">
        <p>Calculate your monthly mortgage payments and find the right deal for you</p>
      </div>
      
      <div class="calculator-form">
        <div class="form-row">
          <div class="form-group">
            <label for="property-value">Property value</label>
            <div class="input-wrapper">
              <span class="currency-symbol">£</span>
              <input type="text" id="property-value" placeholder="e.g. 250,000" inputmode="numeric">
            </div>
          </div>
          
          <div class="form-group">
            <label for="mortgage-amount">Mortgage amount</label>
            <div class="input-wrapper">
              <span class="currency-symbol">£</span>
              <input type="text" id="mortgage-amount" placeholder="e.g. 200,000" inputmode="numeric">
            </div>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="mortgage-term">Mortgage term (1-40 years)</label>
            <div class="input-wrapper">
              <input type="number" id="mortgage-term" placeholder="25" min="1" max="40">
              <span class="unit">Years</span>
            </div>
          </div>
          
          <div class="form-group">
            <label for="deposit-amount">Deposit amount</label>
            <div class="input-wrapper">
              <span class="currency-symbol">£</span>
              <input type="text" id="deposit-amount" placeholder="0" readonly>
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="calculate-btn" id="calculate-mortgage">
            <span class="btn-text">Calculate monthly payment</span>
            <span class="btn-loading" style="display: none;">
              <svg class="spinner" viewBox="0 0 50 50">
                <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
              </svg>
              Calculating...
            </span>
          </button>
        </div>
      </div>
      
      <div class="calculator-results" id="calculator-results" style="display: none;">
        <div class="results-header">
          <h4>Your mortgage calculation</h4>
          <button type="button" class="close-results" id="close-results">×</button>
        </div>
        
        <div class="results-summary">
          <div class="summary-item">
            <span class="label">Monthly payment:</span>
            <span class="value" id="monthly-payment">-</span>
          </div>
          <div class="summary-item">
            <span class="label">Total interest:</span>
            <span class="value" id="total-interest">-</span>
          </div>
          <div class="summary-item">
            <span class="label">Total amount payable:</span>
            <span class="value" id="total-amount">-</span>
          </div>
        </div>
        
        <div class="mortgage-options" id="mortgage-options">
          <h5>Available mortgage options</h5>
          <div class="options-grid" id="options-grid">
            <!-- Mortgage options will be populated here -->
          </div>
        </div>
      </div>
      
      <div class="calculator-error" id="calculator-error" style="display: none;">
        <div class="error-message">
          <svg class="error-icon" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span id="error-text">An error occurred while calculating your mortgage. Please try again.</span>
        </div>
      </div>
    </div>
  `;
  
  // Insert the HTML into the block
  block.innerHTML = calculatorHTML;
  
  // Initialize the mortgage calculator functionality
  const calculator = new MortgageCalculator();
}

class MortgageCalculator {
  constructor() {
    this.graphqlEndpoint = 'https://publish-p147324-e1509924.adobeaemcloud.com/graphql/execute.json/global/mortgageFixed';
    this.selectedMortgageOption = null; // Track selected mortgage option
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

    // Input fields for auto-calculation and formatting
    const propertyValueInput = document.getElementById('property-value');
    const mortgageAmountInput = document.getElementById('mortgage-amount');
    
    if (propertyValueInput) {
      propertyValueInput.addEventListener('input', (e) => {
        this.formatCurrencyInput(e.target);
        this.updateDeposit();
      });
    }
    
    if (mortgageAmountInput) {
      mortgageAmountInput.addEventListener('input', (e) => {
        this.formatCurrencyInput(e.target);
        this.updateDeposit();
      });
    }
  }

  formatCurrencyInput(input) {
    // Remove all non-numeric characters except decimal point
    let value = input.value.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Convert to number and validate maximum value
    const number = parseFloat(value) || 0;
    
    // Check maximum value (1,000,000)
    if (number > 1000000) {
      input.value = '1,000,000';
      return;
    }
    
    // Format with commas if valid
    if (number > 0) {
      input.value = number.toLocaleString();
    } else {
      input.value = '';
    }
    
    // Trigger deposit calculation update
    this.updateDeposit();
  }

  setupAutoCalculation() {
    // Auto-calculate deposit when property value or mortgage amount changes
    this.updateDeposit();
  }

  updateDeposit() {
    const propertyValueInput = document.getElementById('property-value');
    const mortgageAmountInput = document.getElementById('mortgage-amount');
    
    // Get values and clean them (remove commas and other non-numeric characters)
    const propertyValue = parseFloat(propertyValueInput.value.replace(/[^\d.]/g, '')) || 0;
    const mortgageAmount = parseFloat(mortgageAmountInput.value.replace(/[^\d.]/g, '')) || 0;
    const depositAmount = propertyValue - mortgageAmount;
    
    const depositInput = document.getElementById('deposit-amount');
    if (depositInput) {
      depositInput.value = depositAmount > 0 ? depositAmount.toLocaleString() : '0';
    }
  }

  async calculateMortgage() {
    const propertyValueInput = document.getElementById('property-value');
    const mortgageAmountInput = document.getElementById('mortgage-amount');
    const mortgageTermInput = document.getElementById('mortgage-term');
    
    // Get values and clean them (remove commas and other non-numeric characters)
    const propertyValue = parseFloat(propertyValueInput.value.replace(/[^\d.]/g, '')) || 0;
    const mortgageAmount = parseFloat(mortgageAmountInput.value.replace(/[^\d.]/g, '')) || 0;
    const mortgageTerm = parseInt(mortgageTermInput.value.replace(/[^\d]/g, '')) || 0;

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

    if (propertyValue > 1000000) {
      this.showError('Property value cannot exceed £1,000,000.');
      return false;
    }

    if (!mortgageAmount || mortgageAmount <= 0) {
      this.showError('Please enter a valid mortgage amount.');
      return false;
    }

    if (mortgageAmount > 1000000) {
      this.showError('Mortgage amount cannot exceed £1,000,000.');
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
      
      // Prepare query parameters for GET request
      const queryParams = new URLSearchParams({
        propertyValue: propertyValue.toString(),
        mortgageAmount: mortgageAmount.toString(),
        mortgageTerm: mortgageTerm.toString(),
        ltv: ltv.toFixed(2)
      });

      // Build the full URL with query parameters
      const url = `${this.graphqlEndpoint}?${queryParams.toString()}`;

      // Make GET request to GraphQL endpoint
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Debug logging
      console.log('API Response:', data);
      console.log('Request URL:', url);
      console.log('Response structure:', {
        hasData: !!data,
        hasDataWrapper: !!(data && data.data),
        hasMortgageOfferList: !!(data && data.data && data.data.mortgageOfferList),
        hasItems: !!(data && data.data && data.data.mortgageOfferList && data.data.mortgageOfferList.items),
        itemsCount: data && data.data && data.data.mortgageOfferList && data.data.mortgageOfferList.items ? data.data.mortgageOfferList.items.length : 0,
        sampleItem: data && data.data && data.data.mortgageOfferList && data.data.mortgageOfferList.items && data.data.mortgageOfferList.items[0] ? data.data.mortgageOfferList.items[0] : null
      });
      
      // Process and return mortgage options
      return this.processMortgageOptions(data, ltv);
      
    } catch (error) {
      console.error('Error fetching mortgage options:', error);
      // Return fallback options if GraphQL fails
      return this.getFallbackMortgageOptions(ltv);
    }
  }

  processMortgageOptions(data, ltv) {
    console.log('Processing mortgage options with data:', data);
    
    let mortgageOptions = [];
    
    // Handle the nested data structure from GraphQL response
    if (data && data.data && data.data.mortgageOfferList && data.data.mortgageOfferList.items) {
      console.log('Found data.mortgageOfferList.items:', data.data.mortgageOfferList.items);
      
      mortgageOptions = data.data.mortgageOfferList.items.filter(option => {
        // Filter options based on LTV requirements
        if (option.maxLoanToValue) {
          const maxLTV = parseFloat(option.maxLoanToValue.replace('%', ''));
          return ltv <= maxLTV;
        }
        return true; // Include if no LTV restriction
      }).sort((a, b) => {
        // Sort by interest rate (lowest first)
        if (a.interestRate && b.interestRate) {
          const rateA = parseFloat(a.interestRate.replace('%', ''));
          const rateB = parseFloat(b.interestRate.replace('%', ''));
          return rateA - rateB;
        }
        return 0;
      });
    } else if (data && data.mortgageOfferList && data.mortgageOfferList.items) {
      // Handle direct mortgageOfferList.items structure
      console.log('Found mortgageOfferList.items:', data.mortgageOfferList.items);
      
      mortgageOptions = data.mortgageOfferList.items.filter(option => {
        if (option.maxLoanToValue) {
          const maxLTV = parseFloat(option.maxLoanToValue.replace('%', ''));
          return ltv <= maxLTV;
        }
        return true;
      }).sort((a, b) => {
        if (a.interestRate && b.interestRate) {
          const rateA = parseFloat(a.interestRate.replace('%', ''));
          const rateB = parseFloat(b.interestRate.replace('%', ''));
          return rateA - rateB;
        }
        return 0;
      });
    } else if (data && data.mortgageOptions) {
      // Handle alternative structure
      console.log('Found mortgageOptions:', data.mortgageOptions);
      
      mortgageOptions = data.mortgageOptions.filter(option => {
        if (option.maxLoanToValue) {
          const maxLTV = parseFloat(option.maxLoanToValue.replace('%', ''));
          return ltv <= maxLTV;
        }
        return true;
      }).sort((a, b) => {
        if (a.interestRate && b.interestRate) {
          const rateA = parseFloat(a.interestRate.replace('%', ''));
          const rateB = parseFloat(b.interestRate.replace('%', ''));
          return rateA - rateB;
        }
        return 0;
      });
    } else if (data && Array.isArray(data)) {
      // Handle case where response is directly an array
      console.log('Found direct array response:', data);
      
      mortgageOptions = data.filter(option => {
        if (option.maxLoanToValue) {
          const maxLTV = parseFloat(option.maxLoanToValue.replace('%', ''));
          return ltv <= maxLTV;
        }
        return true;
      }).sort((a, b) => {
        if (a.interestRate && b.interestRate) {
          const rateA = parseFloat(a.interestRate.replace('%', ''));
          const rateB = parseFloat(b.interestRate.replace('%', ''));
          return rateA - rateB;
        }
        return 0;
      });
    }
    
    // If we found mortgage options, automatically select the first one as default
    if (mortgageOptions && mortgageOptions.length > 0) {
      const firstOption = mortgageOptions[0];
      this.selectedMortgageOption = firstOption;
      console.log(`Auto-selected first mortgage option as default: ${firstOption.title} with rate ${firstOption.interestRate}`);
    } else {
      // Return fallback options if no data or unexpected format
      console.log('No mortgage options found in response, using fallback options');
      console.log('Available data keys:', data ? Object.keys(data) : 'No data');
      if (data && data.data) {
        console.log('Data.data keys:', Object.keys(data.data));
      }
      mortgageOptions = this.getFallbackMortgageOptions(ltv);
    }
    
    return mortgageOptions;
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
    // Use the selected mortgage option's interest rate, or fallback to a default rate
    let annualRate;
    
    if (this.selectedMortgageOption && this.selectedMortgageOption.interestRate) {
      // Extract the numeric rate from the interestRate string (e.g., "4.85%" -> 0.0485)
      const rateString = this.selectedMortgageOption.interestRate.replace('%', '');
      annualRate = parseFloat(rateString) / 100;
      console.log(`Using selected mortgage rate: ${this.selectedMortgageOption.interestRate} (${annualRate})`);
    } else {
      // Fallback to default rate if no option selected
      annualRate = 0.0485; // 4.85% as fallback
      console.log('No mortgage option selected, using fallback rate: 4.85%');
    }
    
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
      totalAmount: totalAmount,
      rateUsed: this.selectedMortgageOption ? this.selectedMortgageOption.interestRate : '4.85% (fallback)'
    };
  }

  displayResults(calculations, mortgageOptions) {
    // Update summary values
    document.getElementById('monthly-payment').textContent = `£${calculations.monthlyPayment.toFixed(2)}`;
    document.getElementById('total-interest').textContent = `£${calculations.totalInterest.toFixed(2)}`;
    document.getElementById('total-amount').textContent = `£${calculations.totalAmount.toFixed(2)}`;
    
    // Add rate information to the results
    const resultsHeader = document.querySelector('.results-header h4');
    if (resultsHeader && calculations.rateUsed) {
      resultsHeader.innerHTML = `Your mortgage calculation <small style="font-size: 14px; color: #666; font-weight: normal;">(Rate: ${calculations.rateUsed})</small>`;
    }
    
    // Display mortgage options
    this.displayMortgageOptions(mortgageOptions);
    
    // Highlight the first option as selected by default
    if (mortgageOptions && mortgageOptions.length > 0 && this.selectedMortgageOption) {
      this.highlightSelectedOption(this.selectedMortgageOption.id || this.selectedMortgageOption.title || 'unknown');
    }
    
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
    
    options.forEach((option, index) => {
      const optionElement = this.createMortgageOptionElement(option);
      
      // If this is the first option and it's the selected one, add selected class
      if (index === 0 && this.selectedMortgageOption && 
          (this.selectedMortgageOption.id === option.id || 
           this.selectedMortgageOption.title === option.title)) {
        optionElement.classList.add('selected-option');
      }
      
      optionsGrid.appendChild(optionElement);
    });
  }

  createMortgageOptionElement(option) {
    const optionDiv = document.createElement('div');
    optionDiv.className = 'mortgage-option';
    optionDiv.dataset.optionId = option.id || option.title || 'unknown'; // Add data attribute for easy selection
    
    // Safely extract values with fallbacks
    const title = option.title || option.name || 'Mortgage Option';
    const interestRate = option.interestRate || option.rate || 'N/A';
    const rateType = option.rateType || 'Fixed';
    const ratePeriod = option.ratePeriod || option.period || 'N/A';
    const followOnRate = option.followOnRate || option.followOn || 'N/A';
    const aprc = option.aprc || option.aprcRate || 'N/A';
    const productFee = option.productFee || option.fee || 'N/A';
    const maxLoanToValue = option.maxLoanToValue || option.maxLTV || 'N/A';
    const earlyRepaymentCharge = option.earlyRepaymentCharge || option.erc || 'Yes';
    const ctaText = option.ctaText || option.cta || 'How to apply';
    const ctaLink = option.ctaLink || option.link || '#';
    
    optionDiv.innerHTML = `
      <div class="option-header">
        <h6 class="option-title">${title}</h6>
        <div class="option-rate">
          <span class="rate-percentage">${interestRate}</span>
          <div class="rate-type">${rateType}</div>
        </div>
      </div>
      
      <div class="option-details">
        <div class="detail-item">
          <span class="detail-label">Rate</span>
          <span class="detail-value">${interestRate} ${ratePeriod}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Followed by</span>
          <span class="detail-value">${followOnRate}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">APRC</span>
          <span class="detail-value">${aprc}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Product fee</span>
          <span class="detail-value">${productFee}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Max loan to value</span>
          <span class="detail-value">${maxLoanToValue}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Early repayment charge</span>
          <span class="detail-value">${earlyRepaymentCharge}</span>
        </div>
      </div>
      
      <div class="option-actions">
        <a href="${ctaLink}" class="option-btn apply-option-btn">
          ${ctaText}
        </a>
      </div>
    `;
    
    // Add click event listener to the entire mortgage option box
    optionDiv.addEventListener('click', (e) => {
      // Don't trigger if clicking on links
      if (e.target.closest('a')) {
        return;
      }
      
      // Select this mortgage option
      this.selectMortgageOption(option.id || option.title || 'unknown', option);
    });
    
    return optionDiv;
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

  selectMortgageOption(optionId, optionData) {
    console.log('selectMortgageOption called with:', { optionId, optionData });
    
    // Store the selected mortgage option
    this.selectedMortgageOption = optionData;
    console.log('Selected mortgage option stored:', this.selectedMortgageOption);
    
    // Get current input values
    const mortgageAmountInput = document.getElementById('mortgage-amount');
    const mortgageTermInput = document.getElementById('mortgage-term');
    
    const mortgageAmount = parseFloat(mortgageAmountInput.value.replace(/[^\d.]/g, '')) || 0;
    const mortgageTerm = parseInt(mortgageTermInput.value.replace(/[^\d]/g, '')) || 0;
    
    console.log('Current values:', { mortgageAmount, mortgageTerm });
    
    if (mortgageAmount && mortgageTerm) {
      // Recalculate with the selected rate
      const calculations = this.calculateBasicMortgage(mortgageAmount, mortgageTerm);
      console.log('New calculations:', calculations);
      
      // Update the results display
      this.updateCalculationResults(calculations);
      
      // Highlight the selected option
      this.highlightSelectedOption(optionId);
      
      console.log(`Selected mortgage option: ${optionData.title} with rate ${optionData.interestRate}`);
    } else {
      alert('Please enter mortgage amount and term first, then select a mortgage option.');
    }
  }

  updateCalculationResults(calculations) {
    console.log('updateCalculationResults called with:', calculations);
    
    // Update summary values
    const monthlyPaymentEl = document.getElementById('monthly-payment');
    const totalInterestEl = document.getElementById('total-interest');
    const totalAmountEl = document.getElementById('total-amount');
    
    if (monthlyPaymentEl) {
      monthlyPaymentEl.textContent = `£${calculations.monthlyPayment.toFixed(2)}`;
      console.log('Updated monthly payment:', monthlyPaymentEl.textContent);
    } else {
      console.error('monthly-payment element not found');
    }
    
    if (totalInterestEl) {
      totalInterestEl.textContent = `£${calculations.totalInterest.toFixed(2)}`;
      console.log('Updated total interest:', totalInterestEl.textContent);
    } else {
      console.error('total-interest element not found');
    }
    
    if (totalAmountEl) {
      totalAmountEl.textContent = `£${calculations.totalAmount.toFixed(2)}`;
      console.log('Updated total amount:', totalAmountEl.textContent);
    } else {
      console.error('total-amount element not found');
    }
    
    // Update rate information in the results header
    const resultsHeader = document.querySelector('.results-header h4');
    if (resultsHeader && calculations.rateUsed) {
      resultsHeader.innerHTML = `Your mortgage calculation <small style="font-size: 14px; color: #666; font-weight: normal;">(Rate: ${calculations.rateUsed})</small>`;
      console.log('Updated results header with rate:', calculations.rateUsed);
    } else {
      console.error('Results header not found or no rate used');
    }
  }

  highlightSelectedOption(optionId) {
    // Remove highlight from all options
    const allOptions = document.querySelectorAll('.mortgage-option');
    allOptions.forEach(option => {
      option.classList.remove('selected-option');
    });
    
    // Highlight the selected option
    const selectedOption = document.querySelector(`[data-option-id="${optionId}"]`).closest('.mortgage-option');
    if (selectedOption) {
      selectedOption.classList.add('selected-option');
    }
  }
}

// Make the calculator available globally for onclick handlers
window.mortgageCalculator = null;

// Initialize mortgage calculator when DOM is loaded (for standalone use)
document.addEventListener('DOMContentLoaded', function() {
  // Only initialize if not already initialized by decorate function
  if (!window.mortgageCalculator) {
    window.mortgageCalculator = new MortgageCalculator();
  }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { decorate, MortgageCalculator };
} 