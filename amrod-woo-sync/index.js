import fetch from 'node-fetch';

const AMROD_API_URL = process.env.AMROD_API_URL;
const AMROD_AUTH = process.env.AMROD_AUTH;
const WOO_URL = process.env.WOO_URL;
const WOO_AUTH = process.env.WOO_AUTH;

async function fetchAmrodStock() {
  const res = await fetch(`${AMROD_API_URL}/stock`, {
    headers: {
      'Authorization': AMROD_AUTH
    }
  });

  if (!res.ok) {
    throw new Error(`Amrod API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

function mapToWooBatch(amrodData) {
  const uniqueProducts = {};

  amrodData.forEach(item => {
    const sku = item.simpleCode;
    if (!uniqueProducts[sku]) {
      uniqueProducts[sku] = {
        name: sku,
        sku: sku,
        price: "100.00",
        stock_quantity: item.stock,
        stock_status: "instock",
        type: "simple",
        images: [
          {
            src: "http://blackprint.co.za/wp-content/uploads/2025/07/DEFAULT_1024X1024.jpg",
            alt: sku
          }
        ]
      };
    }
  });

  return {
    create: Object.values(uniqueProducts)
  };
}

async function pushToWoo(batchData) {
  const res = await fetch(WOO_URL, {
    method: 'POST',
    headers: {
      'Authorization': WOO_AUTH,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(batchData)
  });

  const body = await res.json();

  if (!res.ok) {
    console.error('Woo API error:', body);
    throw new Error(`Woo API error: ${res.status} ${res.statusText}`);
  }

  return body;
}

(async function main() {
  try {
    console.log("Fetching Amrod stock...");
    const amrodData = await fetchAmrodStock();
    console.log(`Fetched ${amrodData.length} stock records`);

    const wooBatch = mapToWooBatch(amrodData);
    console.log(`Pushing ${wooBatch.create.length} products to WooCommerce...`);

    const wooRes = await pushToWoo(wooBatch);
    console.log("WooCommerce sync complete:", JSON.stringify(wooRes, null, 2));
  } catch (err) {
    console.error("Sync failed:", err.message);
  }
})();