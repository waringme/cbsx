function getMetadata(name) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = [...document.querySelectorAll(`meta[${attr}="${name}"]`)]
    .map((m) => m.content)
    .join(', ');
  return meta || '';
}

adobe.target.getOffer({
  "mbox": "tim-mbox",
  "params": {},
  "success": function(offer) {
        console.log(offer[0].content[0].greeting);
         },
  "error": function(status, error) {
      console.log('Error', status, error);
  }
});



export default function decorate(block) {
  const destinationDiv = document.createElement('div');
  destinationDiv.innerHTML = `
        <div class="textCommon section">
          <div class="destination-content-type"><h3>Hello</h3></div>
         </div>
         </div>
      `;


}