/* products-data.js
   Contains a sample products array (20+ items) used across the demo.
   In production this data would come from a DB / API.
*/
const PRODUCTS = [
  {
    id: 1, sku: "UT-001", name: "Classic Logo Tee", price: 28.00,
    image: "assets/images/placeholder1.jpg", category: "men", colors:["black","white","gray"], sizes:["S","M","L","XL"],
    description: "A clean, classic tee with the UrbanThread logo — premium cotton, regular fit.", stock: 50, bestseller:true, createdAt: "2025-01-01"
  },
  {
    id: 2, sku: "UT-002", name: "Graffiti Skull", price: 35.00,
    image: "assets/images/placeholder2.jpg", category: "graphic", colors:["black","teal"], sizes:["S","M","L","XL"],
    description: "Bold graffiti skull print for those who like to stand out. High-contrast screen print.", stock: 18, bestseller:true, createdAt: "2025-02-02"
  },
  {
    id: 3, sku: "UT-003", name: "Minimal Wave", price: 30.00,
    image: "assets/images/placeholder3.jpg", category: "plain", colors:["white","gray"], sizes:["S","M","L","XL"],
    description: "Minimal wave motif — subtle print, soft hand-feel. Lightweight cotton.", stock: 34, bestseller:false, createdAt: "2025-03-05"
  },
  // more items...
];

// add more sample products programmatically to reach 20+ items
(function addMockProducts(){
  const base = PRODUCTS.length + 1;
  const names = ["Street Tag Tee","Mono Block","Rivet Logo","Split City","Neon Pulse","Urban Camo","Patchwork Tee","Core Tee","Script Logo","Midnight Rider","Retro Grid","Vapor Print","Echo Tee","Outline Logo","Shadow Tee","Sunset Logo","Linework Tee"];
  for(let i=0;i<names.length;i++){
    PRODUCTS.push({
      id: base + i,
      sku: `UT-${100 + i}`,
      name: names[i],
      price: 22 + (i % 5) * 4,
      image: `assets/images/placeholder${(i%3)+1}.jpg`,
      category: (i%2===0) ? "graphic" : "men",
      colors: ["black","white","gray","teal"].slice(0, 2 + (i%3)),
      sizes: ["S","M","L","XL"],
      description: `${names[i]} — premium streetwear tee. Perfect balance of comfort and style.`,
      stock: 10 + (i*3)%40,
      bestseller: (i%4===0),
      createdAt: `2025-0${(i%9)+1}-${(i%27)+1}`
    });
  }
})();
