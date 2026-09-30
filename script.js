const API = (window.AFH_CONFIG || {}).API_URL || "";

let D = {};
let P = null;
let Q = 1;
let selectedColor = "";
let selectedSize = "";
let T = sessionStorage.getItem("afh_token") || "";


/* =========================
   BASIC HELPERS
========================= */

function $(id){
  return document.getElementById(id);
}

function num(v){
  return Number(v || 0).toLocaleString("en-US");
}

function set(id,value){
  if($(id)) $(id).value = value ?? "";
}

function v(id){
  return $(id) ? $(id).value.trim() : "";
}


/* =========================
   API
========================= */

async function get(action){
  try{
    const r = await fetch(
      API + "?action=" + encodeURIComponent(action)
    );
    return await r.json();
  }catch(e){
    console.error(e);
    return null;
  }
}

async function post(data){
  try{
    const r = await fetch(API,{
      method:"POST",
      headers:{
        "Content-Type":"text/plain"
      },
      body:JSON.stringify(data)
    });

    return await r.json();

  }catch(e){
    console.error(e);
    return null;
  }
}


/* =========================
   LOAD STORE
========================= */

async function loadStore(){

  if(!API){
    console.warn("API URL missing");
    return;
  }

  const r = await get("store");

  if(!r || !r.ok){
    console.warn("Store data failed");
    return;
  }

  D = r.data || {};

  applySettings();

  renderProducts("all");
}


/* =========================
   SETTINGS
========================= */

function applySettings(){

  const s = D.settings || {};

  if($("brandName"))
    $("brandName").textContent =
      s.brand || "Arif Fashion House";

  if($("footerBrand"))
    $("footerBrand").textContent =
      s.brand || "Arif Fashion House";

  if($("heroTitle"))
    $("heroTitle").textContent =
      s.hero || "Style • Quality • Reliable Service";

  if($("heroSubtitle"))
    $("heroSubtitle").textContent =
      s.heroSubtitle || "Trendy fashion with home delivery.";

  if($("facebookLink")){
    $("facebookLink").href =
      s.facebook || "#";
  }

  if($("youtubeLink")){
    $("youtubeLink").href =
      s.youtube || "#";
  }

  if($("warning")){
    $("warning").textContent =
      s.warning ||
      "আপনার অর্ডারটি নিশ্চিত করার আগে অনুগ্রহ করে পণ্য, সাইজ/কালার, ঠিকানা ও মোবাইল নম্বর ভালোভাবে যাচাই করুন।";
  }

  updatePaymentOptions();
}


/* =========================
   PRODUCTS
========================= */

function renderProducts(category){

  const box = $("products");

  if(!box) return;

  const products = D.products || [];

  const list =
    category === "all"
      ? products
      : products.filter(
          p => String(p.category).toLowerCase() === category
        );

  if(!list.length){
    box.innerHTML =
      "<p>এই category-তে কোনো product নেই।</p>";
    return;
  }

  box.innerHTML = list.map(p => {

    const discount =
      p.oldPrice > p.price
        ? Math.round(
            ((p.oldPrice - p.price) / p.oldPrice) * 100
          )
        : 0;

    return `
      <div class="card">

        <img
          src="${p.image || ""}"
          alt="${p.name || "Product"}"
          onclick="openProduct('${p.id}')"
        >

        <div class="info">

          <small>
            ${p.category || ""}
          </small>

          <h3>${p.name || ""}</h3>

          <div class="price-line">

            <b>৳${num(p.price)}</b>

            ${
              p.oldPrice > p.price
              ? `<del>৳${num(p.oldPrice)}</del>`
              : ""
            }

            ${
              discount
              ? `<i>${discount}% OFF</i>`
              : ""
            }

          </div>

          <button
            class="primary full"
            onclick="openProduct('${p.id}')"
          >
            View & Order
          </button>

        </div>

      </div>
    `;

  }).join("");
}


/* =========================
   CATEGORY FILTER
========================= */

document.addEventListener("click",function(e){

  const btn = e.target.closest(".chip");

  if(!btn) return;

  document
    .querySelectorAll(".chip")
    .forEach(x => x.classList.remove("active"));

  btn.classList.add("active");

  renderProducts(
    btn.dataset.cat || "all"
  );

});


/* =========================
   OPEN PRODUCT
========================= */

function openProduct(id){

  P = (D.products || []).find(
    p => String(p.id) === String(id)
  );

  if(!P) return;

  Q = 1;

  selectedColor = "";
  selectedSize = "";

  if($("detailImage"))
    $("detailImage").src = P.image || "";

  if($("detailCategory"))
    $("detailCategory").textContent =
      P.category || "";

  if($("detailName"))
    $("detailName").textContent =
      P.name || "";

  if($("detailDescription"))
    $("detailDescription").textContent =
      P.description || "";

  if($("detailPrice"))
    $("detailPrice").textContent =
      "৳" + num(P.price);

  if($("detailOld")){

    if(P.oldPrice && P.oldPrice > P.price){
      $("detailOld").textContent =
        "৳" + num(P.oldPrice);
      $("detailOld").style.display = "";
    }else{
      $("detailOld").textContent = "";
      $("detailOld").style.display = "none";
    }

  }

  if($("detailDiscount")){

    if(P.oldPrice && P.oldPrice > P.price){

      const d = Math.round(
        ((P.oldPrice - P.price) / P.oldPrice) * 100
      );

      $("detailDiscount").textContent =
        d + "% OFF";

      $("detailDiscount").style.display = "";

    }else{

      $("detailDiscount").textContent = "";
      $("detailDiscount").style.display = "none";

    }

  }


  /* =========================
     COLOR
  ========================= */

  const colors =
    Array.isArray(P.colors)
      ? P.colors.filter(x => String(x).trim())
      : [];

  if($("colorWrap")){

    $("colorWrap").style.display =
      colors.length ? "" : "none";
  }

  if($("colors")){

    $("colors").innerHTML =
      colors.map(c => `
        <button
          type="button"
          class="choice"
          onclick="selectColor('${escapeAttr(c)}',this)"
        >
          ${escapeHTML(c)}
        </button>
      `).join("");
  }


  /* =========================
     SIZE
  ========================= */

  const sizes =
    Array.isArray(P.sizes)
      ? P.sizes.filter(x => String(x).trim())
      : [];

  if($("sizeWrap")){

    $("sizeWrap").style.display =
      sizes.length ? "" : "none";
  }

  if($("sizes")){

    $("sizes").innerHTML =
      sizes.map(s => `
        <button
          type="button"
          class="choice"
          onclick="selectSize('${escapeAttr(s)}',this)"
        >
          ${escapeHTML(s)}
        </button>
      `).join("");
  }


  /* =========================
     THUMBNAILS
  ========================= */

  const imgs = [];

  if(P.image)
    imgs.push(P.image);

  if(Array.isArray(P.images)){
    P.images.forEach(x => {
      if(x && !imgs.includes(x))
        imgs.push(x);
    });
  }

  if($("thumbs")){

    $("thumbs").innerHTML =
      imgs.map(img => `
        <img
          src="${img}"
          onclick="changeDetailImage('${escapeAttr(img)}')"
        >
      `).join("");
  }


  if($("qty"))
    $("qty").textContent = Q;

  updateProductTotal();

  if($("productModal"))
    $("productModal").classList.remove("hidden");
}


/* =========================
   COLOR SELECT
========================= */

function selectColor(color,el){

  selectedColor = color;

  document
    .querySelectorAll("#colors .choice")
    .forEach(x => x.classList.remove("active"));

  if(el)
    el.classList.add("active");
}


/* =========================
   SIZE SELECT
========================= */

function selectSize(size,el){

  selectedSize = size;

  document
    .querySelectorAll("#sizes .choice")
    .forEach(x => x.classList.remove("active"));

  if(el)
    el.classList.add("active");
}


/* =========================
   QUANTITY
========================= */

function changeQty(change){

  Q += Number(change || 0);

  if(Q < 1)
    Q = 1;

  if(Q > 99)
    Q = 99;

  if($("qty"))
    $("qty").textContent = Q;

  updateProductTotal();

  if(
    $("checkoutModal") &&
    !$("checkoutModal").classList.contains("hidden")
  ){
    updateTotal();
  }
}


/* =========================
   PRODUCT TOTAL
========================= */

function updateProductTotal(){

  if(!P) return;

  const total =
    Number(P.price || 0) * Q;

  if($("productTotal"))
    $("productTotal").textContent =
      "৳" + num(total);
}


/* =========================
   CLOSE PRODUCT
========================= */

function closeProduct(){

  if($("productModal"))
    $("productModal").classList.add("hidden");
}


/* =========================
   DETAIL IMAGE
========================= */

function changeDetailImage(src){

  if($("detailImage"))
    $("detailImage").src = src;
}


/* =========================
   DELIVERY CHARGE
========================= */

function getShipping(){

  const s = D.settings || {};

  const area =
    $("deliveryArea")
      ? $("deliveryArea").value
      : "dhaka";

  if(area === "outside"){

    return Number(
      s.outsideDhakaShipping ??
      s.shipping ??
      0
    );

  }

  return Number(
    s.dhakaShipping ??
    s.shipping ??
    0
  );
}


/* =========================
   CHECKOUT
========================= */

function goCheckout(){

  if(!P) return;


  /* COLOR VALIDATION */

  const colors =
    Array.isArray(P.colors)
      ? P.colors.filter(x => String(x).trim())
      : [];

  if(colors.length && !selectedColor){

    alert("Please select color.");

    return;
  }


  /* SIZE VALIDATION */

  const sizes =
    Array.isArray(P.sizes)
      ? P.sizes.filter(x => String(x).trim())
      : [];

  if(sizes.length && !selectedSize){

    alert("Please select size.");

    return;
  }


  if($("checkoutImage"))
    $("checkoutImage").src =
      P.image || "";

  if($("checkoutName"))
    $("checkoutName").textContent =
      P.name || "";


  updateVariantSummary();


  /* Default delivery area */

  if($("deliveryArea"))
    $("deliveryArea").value = "dhaka";


  /* Reset confirmation */

  if($("confirmCheck"))
    $("confirmCheck").checked = false;

  if($("confirmOrder"))
    $("confirmOrder").disabled = true;


  /* Clear order message */

  if($("orderMsg"))
    $("orderMsg").textContent = "";


  updateTotal();

  updatePaymentOptions();


  if($("checkoutModal"))
    $("checkoutModal").classList.remove("hidden");
}


/* =========================
   VARIANT SUMMARY
========================= */

function updateVariantSummary(){

  if(!$("variantSummary"))
    return;

  const parts = [];

  if(selectedColor)
    parts.push("Color: " + selectedColor);

  if(selectedSize)
    parts.push("Size: " + selectedSize);

  parts.push("Qty: " + Q);

  $("variantSummary").textContent =
    parts.join(" | ");
}


/* =========================
   CHECKOUT TOTAL
========================= */

function updateTotal(){

  if(!P) return;

  const shipping =
    getShipping();

  const productTotal =
    Number(P.price || 0) * Q;

  const total =
    productTotal + shipping;


  if($("shipping"))
    $("shipping").textContent =
      "৳" + num(shipping);

  if($("total"))
    $("total").textContent =
      "৳" + num(total);

  updateVariantSummary();
}


/* =========================
   PAYMENT OPTIONS
========================= */

function updatePaymentOptions(){

  const s = D.settings || {};

  const codRadio =
    document.querySelector(
      'input[name="payment"][value="COD"]'
    );

  const advanceRadio =
    document.querySelector(
      'input[name="payment"][value="Advance"]'
    );

  if(codRadio)
    codRadio.parentElement.style.display =
      s.cod === false ? "none" : "";

  if(advanceRadio)
    advanceRadio.parentElement.style.display =
      s.advance === false ? "none" : "";


  if(
    s.cod === false &&
    s.advance !== false &&
    advanceRadio
  ){
    advanceRadio.checked = true;
  }


  if(
    s.advance === false &&
    s.cod !== false &&
    codRadio
  ){
    codRadio.checked = true;
  }


  updatePaymentNumbers();
}


/* =========================
   PAYMENT NUMBER DISPLAY
========================= */

function updatePaymentNumbers(){

  const box = $("paymentNumbers");

  if(!box) return;

  const s = D.settings || {};

  const selected =
    document.querySelector(
      'input[name="payment"]:checked'
    );

  if(!selected){

    box.innerHTML = "";

    if($("transactionId"))
      $("transactionId").classList.add("hidden");

    return;
  }


  if(selected.value === "Advance"){

    const nums = [];

    if(s.bkashNumber)
      nums.push(
        "bKash: " +
        escapeHTML(String(s.bkashNumber))
      );

    if(s.nagadNumber)
      nums.push(
        "Nagad: " +
        escapeHTML(String(s.nagadNumber))
      );

    if(s.rocketNumber)
      nums.push(
        "Rocket: " +
        escapeHTML(String(s.rocketNumber))
      );


    box.innerHTML =
      nums.length
        ? `<p>${nums.join("<br>")}</p>`
        : "<p>Advance payment number not set.</p>";


    if($("transactionId"))
      $("transactionId").classList.remove("hidden");

  }else{

    box.innerHTML = "";

    if($("transactionId")){

      $("transactionId").value = "";

      $("transactionId").classList.add("hidden");

    }

  }
}


/* =========================
   PAYMENT RADIO CHANGE
========================= */

document.addEventListener(
  "change",
  function(e){

    if(
      e.target &&
      e.target.name === "payment"
    ){

      updatePaymentNumbers();

    }

  }
);


/* =========================
   CONFIRM CHECKBOX
========================= */

function toggleConfirm(){

  const checked =
    $("confirmCheck")
      ? $("confirmCheck").checked
      : false;

  if($("confirmOrder"))
    $("confirmOrder").disabled =
      !checked;
}


/* =========================
   SUBMIT ORDER
========================= */

async function submitOrder(){

  if(!P) return;


  const name =
    v("customerName");

  const phone =
    v("customerPhone");

  const address =
    v("customerAddress");


  if(!name){

    alert("Please enter customer name.");
    return;
  }

  if(!phone){

    alert("Please enter mobile number.");
    return;
  }

  if(!address){

    alert("Please enter delivery address.");
    return;
  }


  if(
    $("confirmCheck") &&
    !$("confirmCheck").checked
  ){

    alert("Please confirm the order information.");
    return;
  }


  const paymentEl =
    document.querySelector(
      'input[name="payment"]:checked'
    );

  const payment =
    paymentEl
      ? paymentEl.value
      : "COD";


  const transactionId =
    v("transactionId");


  if(
    payment === "Advance" &&
    !transactionId
  ){

    alert("Please enter Transaction ID.");
    return;
  }


  const area =
    $("deliveryArea")
      ? $("deliveryArea").value
      : "dhaka";


  const shipping =
    getShipping();


  const productTotal =
    Number(P.price || 0) * Q;


  const total =
    productTotal + shipping;


  const order = {

    id:
      "AFH-" +
      Date.now(),

    name,

    phone,

    address,

    productId:
      P.id,

    productName:
      P.name,

    qty:
      Q,

    color:
      selectedColor,

    size:
      selectedSize,

    price:
      Number(P.price || 0),

    productTotal,

    deliveryArea:
      area,

    shipping,

    total,

    payment,

    transactionId,

    status:
      "Pending",

    source:
      "Website"

  };


  if($("confirmOrder"))
    $("confirmOrder").disabled = true;

  if($("orderMsg"))
    $("orderMsg").textContent =
      "অর্ডার পাঠানো হচ্ছে...";


  const r =
    await post({
      action:"createOrder",
      order
    });


  if(r && r.ok){

    if($("orderMsg"))
      $("orderMsg").textContent =
        "✅ আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে।";

    alert(
      "অর্ডার সফলভাবে গ্রহণ করা হয়েছে।"
    );


    setTimeout(() => {

      closeCheckout();

      if($("customerName"))
        $("customerName").value = "";

      if($("customerPhone"))
        $("customerPhone").value = "";

      if($("customerAddress"))
        $("customerAddress").value = "";

      if($("transactionId"))
        $("transactionId").value = "";

      if($("confirmCheck"))
        $("confirmCheck").checked = false;

      if($("confirmOrder"))
        $("confirmOrder").disabled = true;

    },800);


  }else{

    if($("orderMsg"))
      $("orderMsg").textContent =
        "❌ অর্ডার পাঠানো যায়নি। আবার চেষ্টা করুন।";

    if($("confirmOrder"))
      $("confirmOrder").disabled = false;

  }
}


/* =========================
   CLOSE CHECKOUT
========================= */

function closeCheckout(){

  if($("checkoutModal"))
    $("checkoutModal").classList.add("hidden");
}


/* =========================
   ESCAPE HTML
========================= */

function escapeHTML(value){

  return String(value ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}


function escapeAttr(value){

  return String(value ?? "")
    .replace(/\\/g,"\\\\")
    .replace(/'/g,"\\'");
}


/* =========================
   START
========================= */

document.addEventListener(
  "DOMContentLoaded",
  function(){

    loadStore();

  }
);
