// Cat-only Unsplash images
const CAT_URLS = [
  "https://images.unsplash.com/photo-1518791841217-8f162f1e1131",
  "https://images.unsplash.com/photo-1511044568932-338cba0ad803",
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
  "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13",
  "https://images.unsplash.com/photo-1517423440428-a5a00ad493e8",
  "https://images.unsplash.com/photo-1494253109108-2e30c049369b",
  "https://images.unsplash.com/photo-1495360010541-f48722b34f7d",
  "https://images.unsplash.com/photo-1595433707802-6b2626ef1c86",
  "https://images.unsplash.com/photo-1519052534942-1f9f9f0b8f1f",
  "https://images.unsplash.com/photo-1543852786-1cf6624b9987"
];

const sized = (url) => `${url}?auto=format&fit=crop&w=800&h=600&q=80`;

function pickRandomUnique(arr, n){
  const shuffled = arr.slice().sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

function loadCats(){
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';
  const picks = pickRandomUnique(CAT_URLS, 6);
  for (let i = 0; i < picks.length; i++){
    const img = document.createElement('img');
    img.src = sized(picks[i]);
    img.alt = `Cute Cat ${i+1}`;
    img.loading = 'lazy';
    img.decoding = 'async';
    gallery.appendChild(img);
  }
}

document.getElementById('refresh').addEventListener('click', loadCats);
window.onload = loadCats;
