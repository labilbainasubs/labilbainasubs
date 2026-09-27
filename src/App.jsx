import React, { useState, useMemo, useEffect, useRef } from "react";
import { ShoppingBag, Plus, Minus, X, MapPin, Clock, Truck, Store, ChevronDown, Check, Mail, Phone, Sandwich, Beef, Soup } from "lucide-react";
import laBilbainaLogo from "./assets/la-bilbaina-logo.jpg";

/* ---------------- Square config ----------------
   These two IDs are safe to ship in front-end code — they're not secret,
   just identifiers. The actual secret (the Access Token) lives only on
   the server, in Vercel's environment variables, and is used by
   /api/create-payment.js.
   Production credentials — real customer cards are charged. */
const SQUARE_APPLICATION_ID = "sq0idp-W0x3cj5wL8y-5ngJznBREw";
const SQUARE_LOCATION_ID = "LMSSK4WED8H7V";

/* ---------------- Brand tokens ---------------- */
const NAVY = "#1C3D5A";
const NAVY_DEEP = "#0F2438";
const CREAM = "#FFFFFF";
const CREAM_DARK = "#E9EDF1";
const BRASS = "#B8862E";
const TOMATO = "#C1442D";

/* ---------------- Gear geometry helpers ---------------- */
function polar(cx, cy, r, a) {
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
function gearPath(cx, cy, outerR, innerR, teeth) {
  const step = (Math.PI * 2) / teeth;
  const toothFrac = 0.52;
  let d = "";
  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    const a1 = a0 + step * toothFrac;
    const p0 = polar(cx, cy, innerR, a0);
    const p1 = polar(cx, cy, outerR, a0);
    const p2 = polar(cx, cy, outerR, a1);
    const p3 = polar(cx, cy, innerR, a1);
    d += `${i === 0 ? "M" : "L"} ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} L ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)} `;
  }
  return d + "Z";
}

/* Generic gear-badge emblem used for the three concepts without real artwork yet.
   Swap any of these out for a real logo image the same way La Bilbaina's was wired up
   (see laBilbainaLogo import + CONCEPT_BADGES map below) once photos/logos exist. */
function ConceptBadge({ size = 120, ringColor = NAVY, topText, bottomLine1, bottomLine2, icon }) {
  const cx = 120, cy = 120;
  const arcId = `arc-${topText}`.replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg viewBox="0 0 240 240" width={size} height={size}>
      <path d={gearPath(cx, cy, 118, 101, 20)} fill={ringColor} />
      <circle cx={cx} cy={cy} r={99} fill={CREAM} stroke={ringColor} strokeWidth="3" />
      <circle cx={cx} cy={cy} r={88} fill="none" stroke={ringColor} strokeWidth="1.5" />
      <path id={arcId} d="M 38 130 A 84 84 0 0 1 202 130" fill="none" />
      <text fontFamily="Anton, sans-serif" fontSize="17" fill={NAVY} letterSpacing="0.5">
        <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">{topText}</textPath>
      </text>
      <g fill={NAVY}>
        {[-32, -16, 0, 16, 32].map((dx, i) => (
          <text key={i} x={cx + dx} y={94} fontSize="11" textAnchor="middle">★</text>
        ))}
      </g>
      <g transform={`translate(${cx - 22}, ${cy - 22})`} color={NAVY}>
        {icon}
      </g>
      <path d="M 55 165 Q 70 158 85 165 T 115 165 T 145 165 T 185 165" fill="none" stroke={ringColor} strokeWidth="3" strokeLinecap="round" />
      <text x={cx} y={196} fontFamily="Anton, sans-serif" fontSize="14" fill={NAVY} textAnchor="middle" letterSpacing="1">{bottomLine1}</text>
      <text x={cx} y={213} fontFamily="Anton, sans-serif" fontSize="14" fill={NAVY} textAnchor="middle" letterSpacing="1">{bottomLine2}</text>
    </svg>
  );
}

function GearDivider({ bg = CREAM, fg = NAVY }) {
  const teeth = 40;
  const w = 800, h = 22;
  let path = `M0,${h} L0,${h * 0.4} `;
  for (let i = 0; i <= teeth; i++) {
    const x = (i / teeth) * w;
    path += i % 2 === 0 ? `L${x},0 ` : `L${x},${h * 0.4} `;
  }
  path += `L${w},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: 14, display: "block" }}>
      <rect width={w} height={h} fill={bg} />
      <path d={path} fill={fg} />
    </svg>
  );
}

/* ---------------- Menu data ---------------- */
const CONCEPTS = [
  {
    id: "labilbaina",
    name: "La Bilbaina Submarine Factory",
    short: "SUBS",
    tagline: "Handcrafted Texas-sized subs",
    categories: [
      {
        name: "Signature Subs",
        note: "8\" — priced below · 10\" also available",
        items: [
          ["Don Lopez's Tortilla Espa\u00f1ola", 10.75, "Eggs, potatoes, onions, olive oil on parmesan asiago sub roll"],
          ["Steven's Italian Classic", 10.75, "Mayo, olive oil, cotechino, capicolla, genoa salami, mortadella, provolone, hot pepper relish, lettuce, tomatoes, onions"],
          ["Fimo's Lonestar Turkey Breast", 10.75, "Mayo, turkey, provolone, lettuce, tomatoes, onions, salt"],
          ["Alondra's Ham & Cheese", 10.75, "Mayo, ham, american cheese, lettuce, tomatoes, onions, oregano"],
          ["Andrea's Roast Beef", 10.75, "Mayo, cheddar, roast beef, bacon, lettuce, tomatoes, onions, salt"],
          ["Lydia's Country Club", 10.75, "Mayo, turkey, ham, american cheese, bacon, lettuce, tomatoes, onions"],
          ["Amparo's Tuna", 10.75, "Mayo, turkey, provolone, lettuce, tomatoes, onions, oregano"],
          ["Yami's Veggie", 10.75, "Provolone, lettuce, green peppers, cucumbers, tomatoes, onions"],
          ["F. Antonio's Chicken Deluxe", 10.75, "Mayo, sliced deli chicken breast, cheddar, bacon, lettuce, tomatoes, onions"],
          ["Ashley's Chicken Salad", 10.75, "Mayo, chicken salad, pepper jack, lettuce, tomatoes, italian dressing"],
        ],
      },
      {
        name: "Grilled Specialty Subs",
        note: "8\" — priced below · 10\" also available",
        items: [
          ["April's BLT", 13.75, "Bacon, mayo, lettuce, tomato"],
          ["Sandra's Spicy Italian", 13.75, "Genoa salami, cotechino, pepperoni, mortadella, american cheese, banana peppers"],
          ["Manuel's Philly", 13.75, "Steak or chicken, american cheese, grilled onions, grilled green peppers"],
          ["Pilar's Cheesesteak", 13.75, "Grilled steak or chicken, pepper jack, mayo, lettuce, onions, tomatoes, jalape\u00f1os"],
          ["Lisa's BBQ Chicken", 13.75, "Grilled chicken or steak, bbq sauce, provolone, lettuce, tomatoes, onions"],
          ["Juan's Cuban", 13.75, "Pulled pork, ham, pepperoni, swiss, mayo, brown mustard, pickles"],
          ["Mario's NY Pastrami", 13.75, "Pastrami, swiss, yellow mustard, pickles"],
          ["Joel's Meatballs", 13.75, "Meatballs, provolone, marinara sauce"],
          ["Anita's Carne Asada", 13.75, "Carne asada, american cheese, guacamole, pico de gallo, sour cream"],
        ],
      },
      {
        name: "Kids & Seniors",
        note: "4\" sub · includes small fries, lettuce, onions, tomatoes",
        items: [
          ["Noah's Grilled Cheese", 6.95, ""],
          ["Amber's Ham & Cheese", 6.95, ""],
          ["Manny's Turkey", 6.95, ""],
          ["Ulises' Club", 6.95, ""],
          ["Kayla's Chicken Salad", 6.95, ""],
          ["Michael's Potato Salad", 6.95, ""],
          ["Tuna", 6.95, ""],
        ],
      },
      {
        name: "Sides",
        items: [
          ["Regular Side", 4.50, "French fries, chili cheese fries, hash browns, bacon, sausage patty, potato salad, tuna salad, creamy corn, mac & cheese, coleslaw, mexican rice, refried beans, black beans, chili"],
          ["Family Side", 14.95, "Family-size portion of any regular side"],
        ],
      },
      { name: "Soup of the Day", items: [["Soup of the Day (Bowl)", 6.50, "Mon Broccoli Cheddar \u00b7 Tue Sopa de Ajos \u00b7 Wed Minestrone \u00b7 Thu Creamy Potato \u00b7 Fri Tortilla \u00b7 Sat Boston Clam Chowder"]] },
      { name: "Sauces & Dressings", items: [["Extra Sauce or Dressing (2oz)", 1.50, "Chimichurri, salsas, ranch, chipotle ranch, BBQ, buffalo, blue cheese, and more"]] },
      {
        name: "Salads",
        note: "add protein: carne asada +$6 \u00b7 chicken +$5.75 \u00b7 steak +$5.95",
        items: [
          ["Romero's Salad", 12.75, "Carne asada, lettuce, onions, tomatoes, pico de gallo, guacamole, boiled egg"],
          ["Lonestar Salad", 12.75, "Lettuce, tomatoes, black beans, onions, cheddar, guacamole, tortilla strips, bacon"],
          ["N Foster Rd Salad", 12.75, "Chicken salad, provolone, lettuce, tomatoes, onions, boiled egg"],
          ["Lakeview Salad", 12.75, "Tuna, provolone, lettuce, onions, boiled egg"],
        ],
      },
      {
        name: "Desserts",
        items: [
          ["Cakes", 5.75, "Red velvet, coconut, carrot, tres leches, NY cheesecake, orange"],
          ["Cookies", 3.25, "Red velvet, peanut butter, double chunk, oatmeal raisin, chocolate chip"],
          ["Cupcake / Muffin", 3.75, "Blueberry, banana, chocolate, cheese streusel"],
          ["Brownie", 5.00, "Rich, fudgy double chocolate, baked fresh daily"],
          ["Milkshake", 6.95, "Hand spun, various flavors"],
          ["Float", 6.00, "Big Red, orange, root beer"],
          ["Ice Cream Bowl", 6.00, "Two scoops"],
        ],
      },
      {
        name: "Catering Boxes",
        note: "3 hrs notice required",
        items: [
          ["Daisy's Family Box", 49.75, "8pcs signature subs plus eight cookies"],
          ["Ashley's Lunch Box", 12.00, "7.5\" signature sub and two cookies \u00b7 min. order 3"],
          ["Teresita's 12pc Box", 60.00, ""],
          ["Maria's 20pc Box", 99.00, ""],
        ],
      },
      {
        name: "Combo",
        items: [
          ["Make It A Combo", 6.00, "Add a Regular Side & a Fountain Drink to any order"],
        ],
      },
    ],
  },
  {
    id: "romeros",
    name: "Romero's Lonestar Grill",
    short: "TEX-MEX GRILL",
    tagline: "Lonestar Tex-Mex Grill",
    categories: [
      {
        name: "Breakfast Tacos",
        items: [
          ["Bacon, Eggs & Cheese Taco", 3.25, ""],
          ["Sausage, Eggs & Cheese Taco", 3.25, ""],
          ["Ham, Eggs & Cheese Taco", 3.25, ""],
          ["Potato, Eggs & Cheese Taco", 3.95, ""],
        ],
      },
      {
        name: "Breakfast Bagels",
        note: "Regular or jalape\u00f1o bagel",
        items: [
          ["Bacon, Eggs & Cheese Bagel", 7.75, ""],
          ["Sausage, Eggs & Cheese Bagel", 7.95, ""],
          ["Ham, Eggs & Cheese Bagel", 7.75, ""],
          ["Potatoes, Eggs & Cheese Bagel", 7.75, ""],
          ["Bagel with Cream Cheese", 5.00, ""],
        ],
      },
      {
        name: "Quesadillas",
        note: "Small size priced below · large also available",
        items: [
          ["Cheese Quesadilla", 3.95, ""],
          ["Chicken Quesadilla", 5.95, ""],
          ["Carne Asada Quesadilla", 6.95, ""],
          ["Bacon Quesadilla", 5.00, ""],
        ],
      },
      {
        name: "Morning Plates & Street Tacos",
        items: [
          ["3 Soft Tacos", 7.50, "Choice of bacon, sausage, ham or potato"],
          ["Chilaquiles Plate", 12.75, "Choice of eggs, chicken or beef; chips, refried beans, crema, queso fresco, guacamole"],
          ["Crispy Tacos (2pcs)", 7.00, "Potato & eggs \u00b7 bacon & eggs \u00b7 eggs & cheese"],
          ["Mini Tacos", 12.75, "Street-style, 5 pieces"],
        ],
      },
      {
        name: "Burritos",
        items: [
          ["Texas Burrito", 12.95, "Carne asada, cheese, guacamole, pico de gallo, sour cream, lettuce & beans"],
          ["Regular Burrito", 10.95, "Beef or chicken, cheese, rice, beans & pico de gallo"],
        ],
      },
      {
        name: "Sandwiches",
        note: "Choice of sliced wheat or white bread",
        items: [
          ["Crispy or Grilled Chicken Sandwich", 8.95, "Mayo, lettuce, tomato, onions"],
          ["Spicy Chicken Sandwich", 8.95, "Mayo, lettuce, tomato, onions"],
          ["Club Chicken Sandwich", 12.95, "Ranch, chicken, bacon, cheese, lettuce, tomato, onions"],
        ],
      },
      {
        name: "Burgers",
        items: [
          ["Cheeseburger", 7.95, "Mayo, beef patty, american, lettuce, tomato, onions, pickles"],
          ["Bacon Cheeseburger", 9.95, "Mayo, beef patty, american, bacon, lettuce, tomato, onions, pickles"],
          ["Double Cheeseburger", 11.95, "Mayo, two beef patties, american, lettuce, tomato, onions, pickles"],
        ],
      },
      {
        name: "Catfish Baskets",
        note: "Served with coleslaw, bread, tartar sauce & a fountain drink",
        items: [
          ["Catfish Basket, 2pcs", 9.50, ""],
          ["Catfish Basket, 3pcs", 12.75, ""],
        ],
      },
      {
        name: "Chicken Baskets",
        note: "Served with fries, bread & a fountain drink",
        items: [
          ["Wings, 5pcs", 8.95, ""],
          ["Chicken Tenders, 2pcs", 8.95, ""],
          ["Chicken Tenders, 3pcs", 10.95, ""],
          ["Fried Chicken, 2pcs", 9.95, ""],
          ["Fried Chicken, 3pcs", 11.95, ""],
        ],
      },
      {
        name: "Sides",
        items: [
          ["Regular Side", 4.50, "French fries, chili cheese fries, hash browns, bacon, sausage, potato salad, mac & cheese, coleslaw, mexican rice, refried or black beans, chili"],
          ["Family Side", 14.95, "Family-size portion of any regular side"],
          ["Breakfast Side", 3.00, "Bacon (2pcs), sausage patty, hash browns, refried beans, black beans"],
        ],
      },
      { name: "Soup of the Day", items: [["Soup of the Day (Bowl)", 6.50, "Mon Broccoli Cheddar \u00b7 Tue Sopa de Ajos \u00b7 Wed Minestrone \u00b7 Thu Creamy Potato \u00b7 Fri Tortilla \u00b7 Sat Boston Clam Chowder"]] },
      { name: "Sauces & Dressings", items: [["Extra Sauce or Dressing (2oz)", 1.50, "Wing sauces, ranch, chipotle ranch, salsas, BBQ, buffalo, blue cheese, and more"]] },
      {
        name: "Desserts & Sweets",
        items: [
          ["Cakes", 5.75, "Apple, banana pudding, carrot, chocolate, coconut, red velvet"],
          ["Brownie", 5.00, ""],
          ["Cookies", 3.25, ""],
          ["Milkshake", 6.95, "Vanilla, bread pudding, orange, French toast, mint, strawberry, chocolate, pumpkin"],
          ["Float", 6.00, "Root beer, cola, orange, Big Red, Dr Pepper"],
          ["Ice Cream Bowl", 6.00, "Two scoops, add a shot of syrup"],
        ],
      },
      {
        name: "Salads",
        note: "add any protein +$7",
        items: [
          ["Romero's Salad", 12.75, "Carne asada, lettuce, tomatoes, onions, pico de gallo, guacamole, boiled egg, croutons"],
          ["Lonestar Salad", 12.75, "Lettuce, tomatoes, black beans, onions, cheddar, guacamole, tortilla strips, bacon"],
          ["Chicken Salad", 12.75, "Provolone, lettuce, tomatoes, onions, bacon, boiled egg"],
          ["Tuna Salad", 12.75, "Provolone, lettuce, tomatoes, onions, bacon, boiled egg"],
        ],
      },
      {
        name: "Catering",
        note: "Burgers/Sandwiches/Burritos: 10 whole cut in half = 20pcs. Tenders, Leg & Thigh, Catfish: 10pcs.",
        items: [
          ["Catering Burgers", 95.00, "20pcs"],
          ["Catering Bagels", 75.00, "20pcs"],
          ["Catering Chicken Sandwiches", 99.00, "20pcs"],
          ["Catering Burritos", 115.00, "20pcs"],
          ["Catering Chicken Tenders", 21.95, "10pcs"],
          ["Catering Chicken Leg & Thigh", 23.45, "10pcs"],
          ["Catering Catfish", 32.75, "10pcs"],
        ],
      },
      {
        name: "Combo",
        items: [
          ["Make It A Combo", 6.00, "Add a Regular Side & a 24oz Fountain Drink to any order"],
        ],
      },
    ],
  },
  {
    id: "moms",
    name: "Mom's Tex-Mex Bowls",
    short: "BOWLS",
    tagline: "Fresh \u00b7 Flavorful \u00b7 Authentic",
    categories: [
      {
        name: "Beef & Steak",
        items: [
          ["Monterrey Carne Asada", 9.99, "Carne asada, Mexican rice, refried beans, Oaxaca cheese, red salsa"],
          ["Tijuana Fajita", 11.49, "Steak fajita, chicken fajita, Mexican rice, black beans, pepper jack"],
          ["Saltillo Steak & Corn", 9.99, "Steak fajita, creamy corn, mashed potatoes, pepper jack, BBQ"],
          ["Aguascalientes Green Spaghetti Fajita", 9.49, "Green spaghetti, steak fajita, Oaxaca cheese, green salsa, corn"],
          ["Hermosillo Picadillo Ranchero", 9.49, "Picadillo, white rice, refried beans, cheddar, chipotle ranch"],
          ["Culiac\u00e1n Spaghetti & Picadillo", 9.49, "Spaghetti, picadillo, marinara, provolone, green beans"],
          ["Chihuahua Chili Fajita", 8.99, "Chili, steak fajita, Mexican rice, cheddar, red salsa"],
          ["Spaghetti & Meatballs", 9.49, "Spaghetti, beef meatballs, marinara, parmesan, garlic bread"],
        ],
      },
      {
        name: "Poultry",
        items: [
          ["Morelia Chicken Fajita Rice", 8.99, "Chicken fajita, Mexican rice, black beans, cheddar"],
          ["Mazatl\u00e1n Chicken Tender Fiesta", 8.99, "Chicken tenders, Mexican rice, creamy corn, cheddar, chipotle ranch"],
          ["Torre\u00f3n Chicken Leg", 8.49, "Chicken leg/thigh, mashed potatoes, green beans, ranch, cheddar"],
          ["Campeche Wing & Chili", 8.99, "Chicken wings, chili, white rice, provolone, red salsa"],
        ],
      },
      {
        name: "Breakfast",
        items: [
          ["Guadalajara Breakfast", 8.99, "Scrambled eggs, bacon, potatoes, cheddar, green salsa"],
          ["Oaxaca Breakfast Ranchero", 7.99, "Scrambled eggs, chorizo, refried beans, Oaxaca cheese, red salsa"],
          ["Le\u00f3n Bacon & Egg", 8.99, "Scrambled eggs, bacon, mashed potatoes, American cheese"],
        ],
      },
      { name: "Sauces & Dressings", items: [["Extra Sauce or Dressing (2oz)", 1.50, "Chimichurri, salsas, ranch, chipotle ranch, BBQ, buffalo, blue cheese, and more"]] },
      {
        name: "Combo",
        items: [
          ["Make It A Combo", 6.00, "Add a Regular Side & a Fountain Drink to any order"],
        ],
      },
    ],
  },
  {
    id: "zs",
    name: "Z's Empanadas",
    short: "EMPANADAS",
    tagline: "Hand-folded \u00b7 Texas made",
    categories: [
      {
        name: "Beef & Pork",
        items: [
          ["Beef Picadillo", 6.95, "Ground beef, potato, raisins, olives, w/ cilantro lime crema"],
          ["Brisket & BBQ", 6.95, "Smoked brisket, red onion, BBQ sauce, w/ BBQ ranch"],
          ["Spicy Sausage & Pepper", 6.95, "Chorizo, poblano, onion, jack cheese, w/ roasted salsa"],
          ["Cubano", 6.95, "Pulled pork, ham, swiss, pickle, mustard, w/ dijonaise"],
          ["Carnitas & Salsa Verde", 6.95, "Slow-cooked pork, cilantro, onion, w/ salsa verde"],
          ["Pork Adobo", 6.95, "Marinated pork, pineapple, onion, w/ salsa roja"],
        ],
      },
      {
        name: "Poultry",
        items: [
          ["Chicken Tinga", 6.45, "Shredded chicken, chipotle, onion, tomato, w/ avocado sauce"],
          ["Buffalo Chicken", 6.45, "Shredded chicken, buffalo sauce, blue cheese, w/ blue cheese dip"],
          ["Smoked Turkey & Cheddar", 6.45, "Smoked turkey, cheddar, bacon, w/ honey mustard"],
        ],
      },
      {
        name: "Veggie & Cheese",
        items: [
          ["Spinach & Cheese", 5.95, "Spinach, cream cheese, parmesan, w/ garlic aioli"],
          ["Black Bean & Corn", 5.95, "Black bean, sweet corn, bell pepper, cilantro, w/ pico de gallo"],
          ["Sweet Potato & Black Bean", 5.95, "Roasted sweet potato, black bean, cumin, w/ guajillo sauce"],
          ["Caprese", 5.95, "Fresh mozzarella, tomato, basil, w/ balsamic glaze"],
          ["Chile Relleno", 5.95, "Roasted poblano, Oaxacan cheese, w/ ranchero sauce"],
        ],
      },
      {
        name: "Breakfast",
        items: [
          ["Egg, Bacon & Cheddar", 5.00, "Scrambled egg, bacon, cheddar, w/ breakfast salsa"],
          ["Ham & Cheese", 5.00, "Smoked ham, mozzarella, w/ red pepper dip"],
        ],
      },
      {
        name: "Sweet & Dessert",
        items: [
          ["Banana Nutella", 5.75, "Banana, Nutella, cinnamon sugar, w/ chocolate drizzle"],
          ["Strawberry Cheesecake", 5.75, "Cream cheese, strawberry, graham cracker, w/ strawberry sauce"],
          ["Guava & Cheese", 5.75, "Cream cheese, guava paste, sweet glaze, w/ cajeta drizzle"],
          ["Dulce de Leche", 5.75, "Dulce de leche, cinnamon sugar, w/ chocolate sauce"],
        ],
      },
      {
        name: "Sides",
        items: [
          ["Regular Side", 4.50, "French fries, hash browns, bacon, sausage patty, potato salad, mac & cheese, coleslaw, mexican rice, refried or black beans, chili"],
          ["Family Side", 14.75, "Family-size portion of any regular side"],
        ],
      },
      { name: "Soup of the Day", items: [["Soup of the Day (Bowl)", 6.50, "Mon Broccoli Cheddar \u00b7 Tue Sopa de Ajos \u00b7 Wed Minestrone \u00b7 Thu Creamy Potato \u00b7 Fri Tortilla \u00b7 Sat Boston Clam Chowder"]] },
      { name: "Sauces & Dressings", items: [["Extra Sauce or Dressing (2oz)", 1.50, "Chimichurri, salsas, ranch, chipotle ranch, BBQ, buffalo, blue cheese, and more"]] },
      {
        name: "Salads",
        note: "add any protein +$7",
        items: [
          ["Romero's Salad", 12.75, "Carne asada, lettuce, tomatoes, onions, pico de gallo, guacamole, boiled egg, croutons"],
          ["Lonestar Salad", 12.75, "Lettuce, tomatoes, black beans, onions, cheddar, guacamole, tortilla strips, bacon"],
          ["Chicken Salad", 12.75, "Provolone, lettuce, tomatoes, onions, bacon, boiled egg"],
          ["Tuna Salad", 12.75, "Lettuce, tomatoes, onions, bacon, boiled egg"],
        ],
      },
      {
        name: "Catering Boxes",
        items: [
          ["6 Empanadas", 35.00, "Any combination, 3 salsas or dipping sauces"],
          ["12 Empanadas", 70.00, "Any combination, 6 salsas or dipping sauces"],
          ["24 Empanadas", 140.00, "Any combination, 12 salsas or dipping sauces"],
        ],
      },
      {
        name: "Combo",
        items: [
          ["Make It A Combo", 6.00, "Add a Regular Side & a 24oz Fountain Drink to any order"],
        ],
      },
    ],
  },
];

/* ---------------- Helpers ---------------- */
const money = (n) => `$${n.toFixed(2)}`;
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/* Placeholder photo keywords per concept::category — swap for real photos later */
const IMG_MAP = {
  "labilbaina::Signature Subs": "sub-sandwich",
  "labilbaina::Grilled Specialty Subs": "grilled-sandwich",
  "labilbaina::Kids & Seniors": "kids-sandwich",
  "labilbaina::Sides": "french-fries",
  "labilbaina::Soup of the Day": "soup-bowl",
  "labilbaina::Sauces & Dressings": "hot-sauce",
  "labilbaina::Salads": "salad-bowl",
  "labilbaina::Desserts": "bakery-dessert",
  "labilbaina::Catering Boxes": "sandwich-platter",

  "romeros::Breakfast Tacos": "breakfast-taco",
  "romeros::Breakfast Bagels": "bagel-sandwich",
  "romeros::Quesadillas": "quesadilla",
  "romeros::Morning Plates & Street Tacos": "street-tacos",
  "romeros::Burritos": "burrito",
  "romeros::Sandwiches": "chicken-sandwich",
  "romeros::Burgers": "cheeseburger",
  "romeros::Catfish Baskets": "fried-catfish",
  "romeros::Chicken Baskets": "fried-chicken",
  "romeros::Sides": "french-fries",
  "romeros::Soup of the Day": "soup-bowl",
  "romeros::Sauces & Dressings": "hot-sauce",
  "romeros::Desserts & Sweets": "milkshake",
  "romeros::Salads": "salad-bowl",
  "romeros::Catering": "catering-food",

  "zs::Beef & Pork": "beef-empanada",
  "zs::Poultry": "chicken-empanada",
  "zs::Veggie & Cheese": "cheese-empanada",
  "zs::Breakfast": "breakfast-empanada",
  "zs::Sweet & Dessert": "dessert-pastry",
  "zs::Sides": "french-fries",
  "zs::Soup of the Day": "soup-bowl",
  "zs::Sauces & Dressings": "hot-sauce",
  "zs::Salads": "salad-bowl",
  "zs::Catering Boxes": "empanadas",

  "moms::Beef & Steak": "beef-fajita-bowl",
  "moms::Poultry": "chicken-rice-bowl",
  "moms::Breakfast": "breakfast-bowl",
  "moms::Sauces & Dressings": "salsa",
};

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 1000;
}
function itemImage(conceptId, categoryName, itemName) {
  const keyword = IMG_MAP[`${conceptId}::${categoryName}`] || "tex-mex-food";
  const lock = hashStr(`${conceptId}${categoryName}${itemName}`);
  return `https://loremflickr.com/400/300/${encodeURIComponent(keyword)}?lock=${lock}`;
}
const FALLBACK_IMG = "https://placehold.co/400x300/1C3D5A/F2ECDD?text=Photo+Coming+Soon";

/* Per-concept logo badges. La Bilbaina uses the real logo; the other three use an
   original gear-badge placeholder until real concept logos are supplied. */
const CONCEPT_BADGES = {
  labilbaina: <img src={laBilbainaLogo} alt="La Bilbaina Submarine Factory" style={{ width: 64, height: 64, objectFit: "contain" }} />,
  romeros: (
    <ConceptBadge
      size={64}
      ringColor={TOMATO}
      topText="ROMERO'S"
      bottomLine1="LONESTAR"
      bottomLine2="GRILL"
      icon={<Beef size={44} strokeWidth={1.75} />}
    />
  ),
  moms: (
    <ConceptBadge
      size={64}
      ringColor={NAVY}
      topText="MOM'S KITCHEN"
      bottomLine1="TEX-MEX"
      bottomLine2="BOWLS"
      icon={<Soup size={44} strokeWidth={1.75} />}
    />
  ),
  zs: (
    <ConceptBadge
      size={64}
      ringColor={BRASS}
      topText="Z'S EMPANADAS"
      bottomLine1="HAND-FOLDED"
      bottomLine2="TEXAS MADE"
      icon={<Sandwich size={44} strokeWidth={1.75} />}
    />
  ),
};

function timeSlots() {
  const days = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    if (d.getDay() === 0) continue; // closed Sunday
    days.push(d);
  }
  return days.slice(0, 6).map((d) => ({
    label: d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
    value: d.toISOString().slice(0, 10),
  }));
}
const HOURS = ["7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "5:30 PM"];

/* ---------------- App ---------------- */
export default function App() {
  const [activeConcept, setActiveConcept] = useState(CONCEPTS[0].id);
  const [cart, setCart] = useState([]); // {id, name, price, qty, concept}
  const [panel, setPanel] = useState(null); // null | 'cart' | 'fulfillment' | 'review' | 'confirmed'
  const [fulfillment, setFulfillment] = useState({
    type: "pickup",
    date: timeSlots()[0]?.value || "",
    time: HOURS[2],
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [orderNum] = useState(() => Math.floor(1000 + Math.random() * 9000));
  const [lightbox, setLightbox] = useState(null); // {name, price, desc, img, conceptShort}

  // Square payment state
  const [paymentStatus, setPaymentStatus] = useState("idle"); // idle | loading | error
  const [paymentError, setPaymentError] = useState("");
  const [orderResult, setOrderResult] = useState(null); // {orderId, paymentId, receiptUrl}
  const cardRef = useRef(null); // holds the Square `card` payment method instance
  const cardAttachedRef = useRef(false);

  const concept = CONCEPTS.find((c) => c.id === activeConcept);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);

  function addItem(name, price, conceptShort) {
    const id = slug(`${conceptShort}-${name}`);
    setCart((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing) return prev.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { id, name, price, qty: 1, concept: conceptShort }];
    });
  }
  function changeQty(id, delta) {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  }
  function removeItem(id) {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }

  // Combine the picked date + time into a real timestamp Square can use
  // for pickup_at / deliver_at.
  function pickupAtISO() {
    try {
      const d = new Date(`${fulfillment.date} ${fulfillment.time}`);
      if (isNaN(d.getTime())) return null;
      return d.toISOString();
    } catch {
      return null;
    }
  }

  // Mount the Square card form only while the payment step is showing.
  useEffect(() => {
    let cancelled = false;
    async function setupCard() {
      if (panel !== "payment") return;
      if (!window.Square) {
        setPaymentError("Square's payment form couldn't load. Check your connection and try again.");
        return;
      }
      try {
        const payments = window.Square.payments(SQUARE_APPLICATION_ID, SQUARE_LOCATION_ID);
        const card = await payments.card();
        if (cancelled) return;
        await card.attach("#sq-card-container");
        cardRef.current = card;
        cardAttachedRef.current = true;
      } catch (err) {
        setPaymentError("Couldn't load the card form: " + String(err.message || err));
      }
    }
    setupCard();
    return () => {
      cancelled = true;
      if (cardAttachedRef.current && cardRef.current) {
        cardRef.current.destroy().catch(() => {});
        cardRef.current = null;
        cardAttachedRef.current = false;
      }
    };
  }, [panel]);

  async function handlePay() {
    setPaymentError("");
    if (!cardRef.current) {
      setPaymentError("The card form isn't ready yet — give it a second and try again.");
      return;
    }
    setPaymentStatus("loading");
    try {
      const tokenResult = await cardRef.current.tokenize();
      if (tokenResult.status !== "OK") {
        const msg = (tokenResult.errors || []).map((e) => e.message).join(" ") || "Card was declined.";
        setPaymentError(msg);
        setPaymentStatus("error");
        return;
      }

      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: tokenResult.token,
          cart: cart.map((i) => ({ name: i.name, price: i.price, qty: i.qty, concept: i.concept })),
          fulfillment: { ...fulfillment, pickupAtISO: pickupAtISO() },
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setPaymentError(data.error || "Payment failed — please try again.");
        setPaymentStatus("error");
        return;
      }

      setOrderResult({ orderId: data.orderId, paymentId: data.paymentId, receiptUrl: data.receiptUrl });
      setPaymentStatus("idle");
      setPanel("confirmed");
    } catch (err) {
      setPaymentError("Something went wrong reaching the payment server: " + String(err.message || err));
      setPaymentStatus("error");
    }
  }

  return (
    <div style={{ background: CREAM, minHeight: "100vh", fontFamily: "Bitter, serif", color: NAVY_DEEP }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Barlow+Condensed:wght@500;700;900&family=Bitter:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        .disp { font-family: 'Anton', sans-serif; }
        .lbl { font-family: 'Barlow Condensed', sans-serif; }
      `}</style>

      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-30" style={{ background: CREAM, borderBottom: `1px solid ${NAVY}22` }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={laBilbainaLogo} alt="La Bilbaina Submarine Factory" style={{ width: 44, height: 44, objectFit: "contain", flexShrink: 0 }} />
            <div>
              <div className="disp text-sm tracking-wide" style={{ color: NAVY }}>LA BILBAINA</div>
              <div className="lbl text-xs" style={{ color: BRASS, fontWeight: 700, letterSpacing: 1 }}>SUBMARINE FACTORY</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-1 lbl" style={{ fontWeight: 700, fontSize: 15 }}>
            {CONCEPTS.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveConcept(c.id)}
                className="px-3 py-2 rounded"
                style={{
                  color: activeConcept === c.id ? CREAM : NAVY,
                  background: activeConcept === c.id ? NAVY : "transparent",
                }}
              >
                {c.short}
              </button>
            ))}
          </nav>
          <button
            onClick={() => setPanel("cart")}
            className="relative flex items-center gap-2 px-4 py-2 lbl"
            style={{ background: BRASS, color: CREAM, fontWeight: 700, fontSize: 15 }}
          >
            <ShoppingBag size={18} />
            Order
            {cartCount > 0 && (
              <span
                className="absolute -top-2 -right-2 flex items-center justify-center rounded-full text-xs"
                style={{ background: TOMATO, color: CREAM, width: 20, height: 20 }}
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section style={{ background: NAVY, color: CREAM }}>
        <div className="max-w-6xl mx-auto px-4 py-14 flex flex-col items-center text-center">
          <img
            src={laBilbainaLogo}
            alt="La Bilbaina Submarine Factory"
            style={{ width: 200, height: 200, objectFit: "contain", marginBottom: 24 }}
          />
          <div className="lbl mb-3" style={{ color: BRASS, fontWeight: 700, letterSpacing: 2, fontSize: 14 }}>
            4915 N FOSTER RD, SAN ANTONIO, TX 78244
          </div>
          <h1 className="disp" style={{ fontSize: 40, lineHeight: 1.2, maxWidth: 720 }}>
            Texas-Sized Subs &middot; Tex-Mex &middot; Empanadas &amp; More
          </h1>
          <p className="mt-4" style={{ maxWidth: 520, fontSize: 17, lineHeight: 1.6 }}>
            Order ahead from La Bilbaina, Romero's Lonestar Grill, Z's Empanadas and Mom's Tex-Mex Bowls &mdash; one cart, one pickup window at the corner of N Foster Rd.
          </p>
          <div className="flex gap-3 mt-7 justify-center">
            <a href="#menu" className="lbl px-6 py-3" style={{ background: BRASS, color: CREAM, fontWeight: 700, fontSize: 16 }}>
              Start an order
            </a>
            <a href="#hours" className="lbl px-6 py-3 border" style={{ borderColor: CREAM, color: CREAM, fontWeight: 700, fontSize: 16 }}>
              Hours &amp; location
            </a>
          </div>
        </div>
      </section>
      <GearDivider bg={CREAM} fg={NAVY} />

      {/* ---------- Menu ---------- */}
      <section id="menu" className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex md:hidden gap-2 overflow-x-auto pb-4 mb-2 lbl" style={{ fontWeight: 700 }}>
          {CONCEPTS.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveConcept(c.id)}
              className="px-3 py-2 whitespace-nowrap"
              style={{ background: activeConcept === c.id ? NAVY : CREAM_DARK, color: activeConcept === c.id ? CREAM : NAVY }}
            >
              {c.short}
            </button>
          ))}
        </div>

        <div className="mb-8 flex items-center gap-4">
          {CONCEPT_BADGES[concept.id]}
          <div>
            <h2 className="disp" style={{ fontSize: 30, color: NAVY }}>{concept.name}</h2>
            <p className="lbl" style={{ color: BRASS, fontWeight: 700, letterSpacing: 1 }}>{concept.tagline}</p>
          </div>
        </div>

        {concept.categories.map((cat) => (
          <div key={cat.name} className="mb-10">
            <div className="flex items-baseline justify-between border-b pb-2 mb-4" style={{ borderColor: NAVY }}>
              <h3 className="disp" style={{ fontSize: 20, color: NAVY }}>{cat.name}</h3>
              {cat.note && <span className="lbl text-xs" style={{ color: BRASS, fontWeight: 700 }}>{cat.note}</span>}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {cat.items.map(([name, price, desc]) => {
                const img = itemImage(concept.id, cat.name, name);
                return (
                  <div key={name} className="flex gap-3 p-3" style={{ background: "#fff", border: `1px solid ${NAVY}1c` }}>
                    <button
                      onClick={() => setLightbox({ name, price, desc, img, conceptShort: concept.short })}
                      aria-label={`View photo of ${name}`}
                      style={{ width: 84, height: 84, flexShrink: 0, background: CREAM_DARK, overflow: "hidden" }}
                    >
                      <img
                        src={img}
                        alt={name}
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    </button>
                    <div className="flex-1 flex justify-between gap-2">
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{name}</div>
                        {desc && <div style={{ fontSize: 13, color: "#555", marginTop: 2, lineHeight: 1.4 }}>{desc}</div>}
                        <div className="lbl mt-1" style={{ color: BRASS, fontWeight: 700 }}>{money(price)}</div>
                      </div>
                      <button
                        onClick={() => addItem(name, price, concept.short)}
                        aria-label={`Add ${name}`}
                        className="self-start flex items-center justify-center"
                        style={{ width: 34, height: 34, background: NAVY, color: CREAM, flexShrink: 0 }}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <GearDivider bg={NAVY_DEEP} fg={NAVY} />

      {/* ---------- Footer ---------- */}
      <footer id="hours" style={{ background: NAVY_DEEP, color: CREAM }}>
        <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
          <div>
            <div className="disp" style={{ fontSize: 18 }}>La Bilbaina Submarine Factory</div>
            <p className="mt-2 lbl" style={{ color: `${CREAM}bb`, fontSize: 15 }}>Home to La Bilbaina, Romero's Lonestar Grill, Z's Empanadas &amp; Mom's Tex-Mex Bowls.</p>
          </div>
          <div className="lbl" style={{ fontSize: 15 }}>
            <div className="flex items-center gap-2 mb-2"><MapPin size={16} /> 4915 N Foster Rd, San Antonio, TX 78244</div>
            <div className="flex items-center gap-2 mb-2"><Clock size={16} /> Monday&ndash;Saturday, 7am&ndash;6pm</div>
            <div className="flex items-center gap-2 mb-2"><Phone size={16} /> 210.265.1017</div>
          </div>
          <div className="lbl" style={{ fontSize: 15 }}>
            <div className="flex items-center gap-2 mb-2"><Mail size={16} /> orders@labilbainasubs.com</div>
            <div className="flex items-center gap-2 mb-2"><Mail size={16} /> info@labilbainasubs.com</div>
            <div className="mt-4" style={{ color: `${CREAM}88`, fontSize: 12 }}>
              Prototype build &mdash; menu &amp; cart are live, Square payment processing not yet connected.
            </div>
          </div>
        </div>
      </footer>

      {/* ---------- Cart / Checkout slide-over ---------- */}
      {panel && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0" style={{ background: "#00000066" }} onClick={() => panel !== "confirmed" && paymentStatus !== "loading" && setPanel(null)} />
          <div className="relative w-full max-w-md h-full flex flex-col" style={{ background: CREAM }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ background: NAVY, color: CREAM }}>
              <div className="disp" style={{ fontSize: 18 }}>
                {panel === "cart" && "Your order"}
                {panel === "fulfillment" && "Pickup or delivery"}
                {panel === "review" && "Review order"}
                {panel === "payment" && "Payment"}
                {panel === "confirmed" && "Order confirmed"}
              </div>
              {panel !== "confirmed" && paymentStatus !== "loading" && (
                <button onClick={() => setPanel(null)}><X size={22} /></button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {panel === "cart" && (
                cart.length === 0 ? (
                  <p className="lbl" style={{ color: "#777" }}>Nothing in your order yet &mdash; add something from the menu.</p>
                ) : (
                  <div className="space-y-3">
                    {cart.map((i) => (
                      <div key={i.id} className="flex justify-between items-start p-3" style={{ background: "#fff", border: `1px solid ${NAVY}1c` }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{i.name}</div>
                          <div className="lbl" style={{ fontSize: 12, color: BRASS, fontWeight: 700 }}>{i.concept}</div>
                          <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => changeQty(i.id, -1)} style={{ background: CREAM_DARK, width: 24, height: 24 }} className="flex items-center justify-center"><Minus size={14} /></button>
                            <span style={{ fontWeight: 700 }}>{i.qty}</span>
                            <button onClick={() => changeQty(i.id, 1)} style={{ background: CREAM_DARK, width: 24, height: 24 }} className="flex items-center justify-center"><Plus size={14} /></button>
                            <button onClick={() => removeItem(i.id)} className="ml-2 text-xs underline" style={{ color: TOMATO }}>remove</button>
                          </div>
                        </div>
                        <div className="lbl" style={{ fontWeight: 700 }}>{money(i.price * i.qty)}</div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {panel === "fulfillment" && (
                <div className="space-y-5">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setFulfillment((f) => ({ ...f, type: "pickup" }))}
                      className="flex-1 flex flex-col items-center gap-2 p-4"
                      style={{ background: fulfillment.type === "pickup" ? NAVY : "#fff", color: fulfillment.type === "pickup" ? CREAM : NAVY_DEEP, border: `1px solid ${NAVY}` }}
                    >
                      <Store size={22} /> <span className="lbl" style={{ fontWeight: 700 }}>Pickup</span>
                    </button>
                    <button
                      onClick={() => setFulfillment((f) => ({ ...f, type: "delivery" }))}
                      className="flex-1 flex flex-col items-center gap-2 p-4"
                      style={{ background: fulfillment.type === "delivery" ? NAVY : "#fff", color: fulfillment.type === "delivery" ? CREAM : NAVY_DEEP, border: `1px solid ${NAVY}` }}
                    >
                      <Truck size={22} /> <span className="lbl" style={{ fontWeight: 700 }}>Delivery</span>
                    </button>
                  </div>

                  {fulfillment.type === "pickup" ? (
                    <div className="lbl p-3" style={{ background: "#fff", border: `1px solid ${NAVY}1c`, fontSize: 14 }}>
                      Pickup at 4915 N Foster Rd, San Antonio, TX 78244
                    </div>
                  ) : (
                    <div>
                      <label className="lbl text-xs" style={{ fontWeight: 700 }}>Delivery address</label>
                      <input
                        value={fulfillment.address}
                        onChange={(e) => setFulfillment((f) => ({ ...f, address: e.target.value }))}
                        placeholder="Street, city, ZIP"
                        className="w-full mt-1 p-2"
                        style={{ border: `1px solid ${NAVY}55` }}
                      />
                      <div className="lbl mt-1" style={{ fontSize: 12, color: "#777" }}>Delivered from 4915 N Foster Rd, San Antonio, TX 78244</div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="lbl text-xs" style={{ fontWeight: 700 }}>Date</label>
                      <select
                        value={fulfillment.date}
                        onChange={(e) => setFulfillment((f) => ({ ...f, date: e.target.value }))}
                        className="w-full mt-1 p-2"
                        style={{ border: `1px solid ${NAVY}55` }}
                      >
                        {timeSlots().map((d) => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="lbl text-xs" style={{ fontWeight: 700 }}>Time</label>
                      <select
                        value={fulfillment.time}
                        onChange={(e) => setFulfillment((f) => ({ ...f, time: e.target.value }))}
                        className="w-full mt-1 p-2"
                        style={{ border: `1px solid ${NAVY}55` }}
                      >
                        {HOURS.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="lbl text-xs" style={{ fontWeight: 700 }}>Name</label>
                      <input value={fulfillment.name} onChange={(e) => setFulfillment((f) => ({ ...f, name: e.target.value }))} className="w-full mt-1 p-2" style={{ border: `1px solid ${NAVY}55` }} />
                    </div>
                    <div>
                      <label className="lbl text-xs" style={{ fontWeight: 700 }}>Phone</label>
                      <input value={fulfillment.phone} onChange={(e) => setFulfillment((f) => ({ ...f, phone: e.target.value }))} className="w-full mt-1 p-2" style={{ border: `1px solid ${NAVY}55` }} />
                    </div>
                    <div>
                      <label className="lbl text-xs" style={{ fontWeight: 700 }}>Email</label>
                      <input value={fulfillment.email} onChange={(e) => setFulfillment((f) => ({ ...f, email: e.target.value }))} className="w-full mt-1 p-2" style={{ border: `1px solid ${NAVY}55` }} />
                    </div>
                  </div>
                </div>
              )}

              {panel === "review" && (
                <div className="space-y-4">
                  <div>
                    <div className="lbl" style={{ fontWeight: 700, color: BRASS }}>Items</div>
                    {cart.map((i) => (
                      <div key={i.id} className="flex justify-between text-sm py-1">
                        <span>{i.qty} &times; {i.name}</span>
                        <span>{money(i.price * i.qty)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="lbl" style={{ fontWeight: 700, color: BRASS }}>
                    {fulfillment.type === "pickup" ? "Pickup" : "Delivery"}
                  </div>
                  <div className="text-sm">
                    {fulfillment.type === "pickup" ? "4915 N Foster Rd, San Antonio, TX 78244" : fulfillment.address || "(no address entered)"}
                    <br />
                    {timeSlots().find((d) => d.value === fulfillment.date)?.label}, {fulfillment.time}
                    <br />
                    {fulfillment.name} &middot; {fulfillment.phone} &middot; {fulfillment.email}
                  </div>
                </div>
              )}

              {panel === "payment" && (
                <div className="space-y-4">
                  <div>
                    <label className="lbl text-xs" style={{ fontWeight: 700 }}>Card details</label>
                    <div id="sq-card-container" className="mt-1 p-2" style={{ border: `1px solid ${NAVY}55`, background: "#fff", minHeight: 56 }} />
                  </div>
                  {paymentError && (
                    <div className="p-3 text-sm" style={{ background: "#fdecea", color: TOMATO, border: `1px solid ${TOMATO}55` }}>
                      {paymentError}
                    </div>
                  )}
                </div>
              )}

              {panel === "confirmed" && (
                <div className="text-center py-6">
                  <div className="inline-flex items-center justify-center rounded-full mb-4" style={{ width: 60, height: 60, background: NAVY, color: CREAM }}>
                    <Check size={30} />
                  </div>
                  <div className="disp" style={{ fontSize: 22, color: NAVY }}>Order #{orderNum}</div>
                  <p className="lbl mt-2" style={{ color: "#555" }}>
                    Thanks{fulfillment.name ? `, ${fulfillment.name}` : ""} &mdash; your payment went through.
                  </p>
                  {orderResult && (
                    <div className="mt-4 text-left p-3" style={{ background: "#fff", border: `1px solid ${NAVY}1c`, fontSize: 13 }}>
                      <div><strong>Square order:</strong> {orderResult.orderId}</div>
                      <div><strong>Payment:</strong> {orderResult.paymentId}</div>
                      {orderResult.receiptUrl && (
                        <div className="mt-1">
                          <a href={orderResult.receiptUrl} target="_blank" rel="noreferrer" className="underline" style={{ color: BRASS }}>
                            View Square receipt
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {panel !== "confirmed" && (
              <div className="px-5 py-4" style={{ borderTop: `1px solid ${NAVY}22` }}>
                <div className="flex justify-between mb-3 lbl" style={{ fontWeight: 700, fontSize: 16 }}>
                  <span>Subtotal</span>
                  <span>{money(subtotal)}</span>
                </div>
                {panel === "cart" && (
                  <button
                    disabled={cart.length === 0}
                    onClick={() => setPanel("fulfillment")}
                    className="w-full lbl py-3"
                    style={{ background: cart.length ? BRASS : "#ccc", color: CREAM, fontWeight: 700 }}
                  >
                    Continue
                  </button>
                )}
                {panel === "fulfillment" && (
                  <button onClick={() => setPanel("review")} className="w-full lbl py-3" style={{ background: BRASS, color: CREAM, fontWeight: 700 }}>
                    Review order
                  </button>
                )}
                {panel === "review" && (
                  <button
                    onClick={() => { setPaymentError(""); setPanel("payment"); }}
                    className="w-full lbl py-3"
                    style={{ background: NAVY, color: CREAM, fontWeight: 700 }}
                  >
                    Continue to payment
                  </button>
                )}
                {panel === "payment" && (
                  <button
                    onClick={handlePay}
                    disabled={paymentStatus === "loading"}
                    className="w-full lbl py-3"
                    style={{ background: paymentStatus === "loading" ? "#ccc" : BRASS, color: CREAM, fontWeight: 700 }}
                  >
                    {paymentStatus === "loading" ? "Processing…" : `Pay ${money(subtotal)}`}
                  </button>
                )}
              </div>
            )}
            {panel === "confirmed" && (
              <div className="px-5 py-4" style={{ borderTop: `1px solid ${NAVY}22` }}>
                <button
                  onClick={() => { setCart([]); setOrderResult(null); setPanel(null); }}
                  className="w-full lbl py-3"
                  style={{ background: NAVY, color: CREAM, fontWeight: 700 }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- Photo lightbox ---------- */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: "#00000088" }} onClick={() => setLightbox(null)} />
          <div className="relative w-full max-w-sm" style={{ background: CREAM }}>
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-2 right-2 flex items-center justify-center z-10"
              style={{ width: 32, height: 32, background: NAVY, color: CREAM }}
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <img
              src={lightbox.img}
              alt={lightbox.name}
              onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
              style={{ width: "100%", height: 240, objectFit: "cover", display: "block" }}
            />
            <div className="p-4">
              <div className="lbl" style={{ color: BRASS, fontWeight: 700, fontSize: 12 }}>{lightbox.conceptShort}</div>
              <div className="disp" style={{ fontSize: 20, color: NAVY, marginTop: 2 }}>{lightbox.name}</div>
              {lightbox.desc && <p style={{ fontSize: 14, color: "#555", marginTop: 6, lineHeight: 1.5 }}>{lightbox.desc}</p>}
              <div className="flex items-center justify-between mt-4">
                <div className="lbl" style={{ fontWeight: 700, fontSize: 18, color: BRASS }}>{money(lightbox.price)}</div>
                <button
                  onClick={() => { addItem(lightbox.name, lightbox.price, lightbox.conceptShort); setLightbox(null); }}
                  className="lbl px-5 py-2 flex items-center gap-2"
                  style={{ background: NAVY, color: CREAM, fontWeight: 700 }}
                >
                  <Plus size={16} /> Add to order
                </button>
              </div>
              <p className="mt-3" style={{ fontSize: 11, color: "#999" }}>Placeholder photo &mdash; will be replaced with an in-house shot.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
