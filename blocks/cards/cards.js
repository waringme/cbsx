import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);

    // Get the card container and log all data elements
    const cardContainer = img.closest('li');
    if (cardContainer) {
      console.log('=== CARD DATA ===');
      console.log('Card container:', cardContainer);
      
      // Log all data attributes
      const dataAttributes = cardContainer.querySelectorAll('[data-*]');
      console.log('Data attributes found:', dataAttributes.length);
      dataAttributes.forEach(attr => {
        const key = attr.getAttributeNames().find(name => name.startsWith('data-'));
        const value = attr.getAttribute(key);
        console.log(`${key}: ${value}`);
      });
      
      // Log all child elements and their content
      const allElements = cardContainer.querySelectorAll('*');
      console.log('All elements in card:', allElements.length);
      allElements.forEach(element => {
        if (element.textContent && element.textContent.trim()) {
          console.log(`${element.tagName.toLowerCase()}.${element.className}: "${element.textContent.trim()}"`);
        }
      });
      
      // Log the card body specifically
      const cardBody = cardContainer.querySelector('.cards-card-body');
      if (cardBody) {
        console.log('Card body element:', cardBody);
        console.log('Card body HTML:', cardBody.innerHTML);
      }
      
      console.log('=== END CARD DATA ===');
    } else {
      console.log('Warning: Could not find card container (li) for image:', img);
    }
  });
  block.textContent = '';
  block.append(ul);
}
