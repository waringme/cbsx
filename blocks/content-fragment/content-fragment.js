function getMetadata(name) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = [...document.querySelectorAll(`meta[${attr}="${name}"]`)]
    .map((m) => m.content)
    .join(', ');
  return meta || '';
}

export default function decorate(block) {
  const destinationDiv = document.createElement('div');

  adobe.target.getOffer({
    "mbox": "tim-mbox",
    "params": {},
    "success": function(offer) {
      const offerData = offer[0].content[0].data.offerBankByPath.item;
      console.log(offerData.title);
      
      let title = offerData.title;
      let detail = offerData.detail.plaintext;
      let image = offerData.image._publishUrl;
      let cta = offerData.cta;
      let ctaLink = offerData.ctaLink;
      
      // Update the HTML with all the dynamic content
      destinationDiv.innerHTML = `
        <div class="textCommon section">
          <div class="destination-content-type">
            <h3>${title}</h3>
            <p>${detail}</p>
            <img src="${image}" alt="${title}" />
            <a href="${ctaLink}" class="cta-button">${cta}</a>
          </div>
        </div>
      `;
    },
    "error": function(status, error) {
      console.log('Error', status, error);
      // Fallback content if there's an error
      destinationDiv.innerHTML = `
        <div class="textCommon section">
          <div class="destination-content-type"><h3>Welcome</h3></div>
        </div>
      `;
    }
  });

  block.querySelector('div:last-of-type').replaceWith(destinationDiv);
  
  // Initial content while waiting for the offer
  destinationDiv.innerHTML = `
    <div class="textCommon section">
      <div class="destination-content-type"><h3>Loading...</h3></div>
    </div>
  `;
}